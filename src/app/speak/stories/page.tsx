"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Navigation from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import TabNavigation from "@/components/TabNavigation";
import { Sound } from "@/assets/sound";
import { Mic } from "@/assets/mic";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import Dialog from "@/components/Dialog";
import { TABS } from "../constants";
import { STORIES } from "./mockData";

// SpeechRecognition is now handled by the useSpeechRecognition hook

export interface Story {
  id: string;
  title: string;
  content: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  words: number;
}

interface StoryPart {
  part: number;
  content: string;
  words: number;
}

interface WordMatch {
  word: string;
  matched: boolean;
  timestamp: number;
}

interface ReadingAttempt {
  storyId: string;
  date: number;
  recordedAudio?: string; // Base64 encoded audio
  accuracy: number;
  duration: number;
  missedWords: MissedWord[];
  matchedWords: WordMatch[];
}

interface MissedWord {
  index: number;
  word: string
}

function findMistakes(original, test) {
  // Helper function to clean and split text into words
  const clean = (str) =>
    str
      .toLowerCase()
      .replace(/[.,!?;:"']/g, "") // remove punctuation
      .split(/\s+/) // split by any whitespace
      .filter(w => w.length > 0); // remove empty strings

  const originalWords = clean(original);
  const testWords = clean(test);

  // Use Levenshtein distance to find best alignment
  const results = findBestAlignment(originalWords, testWords);
  return results;
}

function findBestAlignment(originalWords, testWords) {
  // Use dynamic programming to find the best alignment
  const mistakes = [];
  let i = 0;
  let j = 0;
  
  // Track previous matches to detect substitution patterns
  const substitutions = {};
  
  while (i < originalWords.length && j < testWords.length) {
    if (originalWords[i] === testWords[j]) {
      // Words match exactly
      i++;
      j++;
    } else if (j + 1 < testWords.length && originalWords[i] === testWords[j + 1]) {
      // Extra word in test - skip it
      j++;
    } else if (i + 1 < originalWords.length && originalWords[i + 1] === testWords[j]) {
      // Missing word in test
      mistakes.push({
        index: i,
        word: originalWords[i],
        type: 'missing',
        context: getContext(originalWords, i)
      });
      i++;
    } else {
      // Word substitution - check for phonetic or semantic similarity
      if (areSimilarWords(originalWords[i], testWords[j])) {
        // Similar but not exact match
        substitutions[originalWords[i]] = testWords[j];
        mistakes.push({
          index: i,
          word: originalWords[i],
          type: 'substitution',
          replacement: testWords[j],
          context: getContext(originalWords, i)
        });
      } else {
        // Completely different words
        mistakes.push({
          index: i,
          word: originalWords[i],
          type: 'missing',
          context: getContext(originalWords, i)
        });
      }
      i++;
      j++;
    }
  }
  
  // Add remaining missing words from original
  while (i < originalWords.length) {
    mistakes.push({
      index: i,
      word: originalWords[i],
      type: 'missing',
      context: getContext(originalWords, i)
    });
    i++;
  }
  
  return mistakes;
}

// Check if words are similar (could be expanded with more sophisticated checks)
function areSimilarWords(word1, word2) {
  // Simple character-based similarity
  const similarity = calculateSimilarity(word1, word2);
  return similarity > 0.5; // Threshold for similarity
}

// Calculate string similarity ratio using Levenshtein distance
function calculateSimilarity(s1, s2) {
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Calculate Levenshtein distance
  const track = Array(s2.length + 1).fill(null).map(() => 
    Array(s1.length + 1).fill(null));
  
  for (let i = 0; i <= s1.length; i += 1) {
    track[0][i] = i;
  }
  
  for (let j = 0; j <= s2.length; j += 1) {
    track[j][0] = j;
  }
  
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  
  const distance = track[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  return maxLength > 0 ? (maxLength - distance) / maxLength : 1;
}

// Get context around a word to help identify its position
function getContext(words, index, windowSize = 2) {
  const start = Math.max(0, index - windowSize);
  const end = Math.min(words.length, index + windowSize + 1);
  return words.slice(start, end).join(' ');
}

export default function StoriesPage() {
  // State for stories and reading practice
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [storyParts, setStoryParts] = useState<StoryPart[]>([]);
  const [selectedPartIndex, setSelectedPartIndex] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [userSpeech, setUserSpeech] = useState("");
  const [missedWords, setMissedWords] = useState<MissedWord[]>([]);
  const [matchedWords, setMatchedWords] = useState<WordMatch[]>([]);
  const [accuracy, setAccuracy] = useState(0);
  const [readingAttempts, setReadingAttempts] = useState<ReadingAttempt[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [componentError, setComponentError] = useState<string | null>(null);
  const [isStoryDialogOpen, setIsStoryDialogOpen] = useState(false);
  const [isAddStoryDialogOpen, setIsAddStoryDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newStory, setNewStory] = useState<Partial<Story>>({ 
    id: `story-${Date.now()}`, 
    title: "", 
    content: "", 
    difficulty: "beginner" 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Refs for managing audio recording
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const storyContentRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

  // Speech synthesis for reading the story
  const { speak, stop } = useSpeechSynthesis();
  
  // Speech recognition for listening to the user
  const { 
    transcript, 
    isListening,
    isSupported, 
    startListening, 
    stopListening, 
    clearTranscript,
    error: speechRecognitionError
  } = useSpeechRecognition({
    silenceTimeout: 2000,
    language: 'en-US',
    continuous: true,
    interimResults: true
  });
  
  // Update component error state when speech recognition error changes
  useEffect(() => {
    if (speechRecognitionError) {
      setComponentError(`Speech recognition error: ${speechRecognitionError}`);
    }
  }, [speechRecognitionError]);

  // Function to split story content into parts (paragraphs)
  const splitStoryIntoParts = useCallback((content: string) => {
    // Split by paragraphs (empty lines)
    const paragraphs = content.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    
    // If no paragraphs are found, treat the whole content as one part
    if (paragraphs.length === 0) {
      return [{
        part: 1,
        content: content,
        words: content.split(/\s+/).filter(word => word.length > 0).length
      }];
    }
    
    // Create story parts from paragraphs
    return paragraphs.map((paragraph, index) => ({
      part: index + 1,
      content: paragraph,
      words: paragraph.split(/\s+/).filter(word => word.length > 0).length
    }));
  }, []);
  // Test the improved algorithm with the example sentences
  const testFindMistakes = () => {
    const originalText = `Yesterday, I had an interview with a team based in the Philippines. Initially, I thought I was rejected because they abruptly left the meeting without notifying me, but they later emailed me to reschedule.`;
    const testText = `yesterday I had an interview with a team based in the Philippines initially I thought I was rejected because they are probably left the meeting without notifying me but the letter emailed me to reschedule`;
    
    const mistakes = findMistakes(originalText, testText);
    
    console.log("=== MISSED WORDS ANALYSIS ===");
    console.log("Original text:", originalText);
    console.log("Test text:", testText);
    console.log("\nDetected mistakes:");
    
    mistakes.forEach(mistake => {
      console.log(`- "${mistake.word}" (${mistake.type}${mistake.replacement ? ', replaced with "' + mistake.replacement + '"' : ''})`);
      console.log(`  Context: "...${mistake.context}..."`);
    });
    
    // Filter for specific words like "abruptly"
    const abruptlyMistake = mistakes.find(m => m.word === "abruptly");
    if (abruptlyMistake) {
      console.log("\nFound 'abruptly' missing:", abruptlyMistake);
    }
    
    return mistakes;
  };
  
  // Run the test once on component initialization
  useEffect(() => {
    testFindMistakes();
  }, []);

  // Custom setter for selected story that also caches 
  const setSelectedStoryWithCache = useCallback((story: Story) => {
    setSelectedStory(story);
    localStorage.setItem("selectedStoryId", story.id);
    
    // Split the story into parts
    const parts = splitStoryIntoParts(story.content);
    setStoryParts(parts);
    setSelectedPartIndex(0);
  }, [splitStoryIntoParts]);

  // Fetch stories from API
  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stories');
      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }
      const data = await response.json();
      setStories([...data, ...STORIES]);
      return data;
    } catch (error) {
      console.error('Error fetching stories:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load reading attempts
  const loadReadingAttempts = useCallback(() => {
    try {
      const savedAttempts = localStorage.getItem("readingAttempts");
      if (savedAttempts) {
        const parsed: ReadingAttempt[] = JSON.parse(savedAttempts);
        setReadingAttempts(parsed);
      }
    } catch (error) {
      console.error("Error loading reading attempts:", error);
    }
  }, []);

  // Load selected story and part
  const loadSelectedStory = useCallback(async () => {
    try {
      const storiesData = await fetchStories();
      
      const savedStoryId = localStorage.getItem("selectedStoryId");
      if (savedStoryId) {
        const story = storiesData.find((s: Story) => s.id === savedStoryId);
        if (story) {
          setSelectedStoryWithCache(story);
        }
      } else {
        // Default story initialization
        if (storiesData.length > 0) {
          setSelectedStoryWithCache(storiesData[0]);
        }
      }
    } catch (error) {
      console.error("Error loading selected story:", error);
    }
  }, [fetchStories, setSelectedStoryWithCache]);
  
  // Load reading attempts and selected story from localStorage
  useEffect(() => {
    loadReadingAttempts();
    loadSelectedStory();
    // We don't need to call fetchStories() explicitly here as it's already called in loadSelectedStory()
  }, [loadReadingAttempts, loadSelectedStory]);

  // Save reading attempt to localStorage
  const saveReadingAttempt = useCallback(
    (attempt: ReadingAttempt) => {
      try {
        // Get existing attempts
        const existingData = localStorage.getItem("readingAttempts");
        const attempts = existingData ? JSON.parse(existingData) : [];
        
        // Add new attempt
        attempts.push(attempt);
        
        // Save back to localStorage (keep only last 50 attempts)
        localStorage.setItem(
          "readingAttempts",
          JSON.stringify(attempts.slice(-50))
        );
        
        // Update state
        setReadingAttempts(attempts);
      } catch (error) {
        console.error("Error saving reading attempt:", error);
      }
    },
    []
  );

  // Process speech for word matching
  const processSpeech = useCallback(
    (speech: string) => {
      if (!selectedStory || storyParts.length === 0) return { accuracy: 0 };

      const storyText = storyParts[selectedPartIndex].content;
      const currentTime = Date.now();

      // Use the improved findMistakes function to detect word differences
      const mistakes = findMistakes(storyText, speech);

      // Map the mistakes to our application's data structure
      const listMissedWords: MissedWord[] = mistakes.map((mistake) => ({
        index: mistake.index,
        word: mistake.word,
        type: mistake.type,
      }));

      // Create matched words list (words not in the mistakes list)
      const storyWords = storyText
        .toLowerCase()
        .replace(/[.,!?;:"']/g, "")
        .split(/\s+/)
        .filter((word) => word.length > 0);

      const matchedWordsWithTimestamp: WordMatch[] = [];
      const storyWordsMatched = new Set<number>();

      // For each word in the story, check if it's not in the missed words
      storyWords.forEach((word, index) => {
        const isMissed = listMissedWords.some((missed) => missed.index === index);
        
        if (!isMissed) {
          storyWordsMatched.add(index);
          matchedWordsWithTimestamp.push({
            word: word,
            matched: true,
            timestamp: currentTime - (storyWords.length - index) * 100, // Simulate timestamps
          });
        }
      });

      // Always update state regardless of isFinal
      // This ensures that our UI shows the correct values
      setMissedWords(listMissedWords);
      setMatchedWords(matchedWordsWithTimestamp);
      
      // Calculate accuracy based on matched words
      const accuracy = storyWords.length > 0
        ? Math.round((storyWordsMatched.size / storyWords.length) * 100)
        : 0;
      
      // Always update accuracy
      setAccuracy(accuracy);

      return { accuracy, missedWords: listMissedWords, matchedWords: matchedWordsWithTimestamp };
    },
    [selectedStory, storyParts, selectedPartIndex]
  );
  
  // Update userSpeech when transcript changes
  useEffect(() => {
    if (transcript) {
      setUserSpeech(transcript);
      // Process speech in real-time to provide feedback
      processSpeech(transcript);
    }
  }, [transcript, processSpeech]);

  // Function to clear reading history
  const clearReadingHistory = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem("readingAttempts");
    // Clear state
    setReadingAttempts([]);
  }, []);

  // Function to reset the recognition state
  const resetRecognitionState = useCallback(() => {
    setUserSpeech("");
    setMissedWords([]);
    setMatchedWords([]);
    setComponentError(null);
    clearTranscript();
  }, [clearTranscript]);

  // Begin the reading practice session
  const beginReadingSession = useCallback(() => {
    try {
      // Reset state
      resetRecognitionState();
      setShowResults(false);
      audioChunksRef.current = [];
      startTimeRef.current = Date.now();

      // Start recording audio (for saving the attempt)
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.start(200); // Collect chunks every 200ms
        })
        .catch((err) => {
          console.error("Error accessing microphone:", err);
          setComponentError(
            "Could not access your microphone. Please check permissions."
          );
        });

      // Start speech recognition
      startListening();
    } catch (error) {
      console.error("Error starting reading session:", error);
      setComponentError("Failed to start reading session. Please try again.");
    }
  }, [resetRecognitionState, startListening]);

  // Process final results
  const processResults = useCallback(() => {
    if (userSpeech.trim().length > 0) {
      // Get accuracy based on missed words
      const finalResults = processSpeech(userSpeech);
      
      // Calculate duration (just an example, in a real app this would be more accurate)
      const duration = matchedWords.length > 0 
        ? matchedWords[matchedWords.length - 1].timestamp - matchedWords[0].timestamp 
        : 0;

      // Save reading attempt
      saveReadingAttempt({
        storyId: selectedStory?.id || "",
        date: Date.now(),
        accuracy: finalResults.accuracy,
        duration,
        missedWords: missedWords,
        matchedWords: matchedWords
      });

      setShowResults(true);
    }
  }, [userSpeech, selectedStory?.id, processSpeech, saveReadingAttempt, matchedWords, missedWords]);

  // End the reading practice session
  const endReadingSession = useCallback(() => {
    // Stop speech recognition using the hook
    stopListening();

    // Stop media recorder
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();

      // Stop all tracks in the stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    }

    // Process final results
    processResults();
  }, [processResults, stopListening]);

  // Set the selected part index and save to localStorage
  const setPartIndexWithCache = useCallback((index: number) => {
    if (index >= 0 && index < storyParts.length) {
      setSelectedPartIndex(index);
      try {
        localStorage.setItem("selectedPartIndex", index.toString());
      } catch (error) {
        console.error("Error saving selected part index:", error);
      }
    }
  }, [storyParts.length]);

  // Play the selected story part using text-to-speech
  const playStory = useCallback(() => {
    setIsReading(true);
    const contentToRead = storyParts.length > 0 ? storyParts[selectedPartIndex].content : selectedStory?.content || "";
    speak(contentToRead, false);
  }, [selectedPartIndex, selectedStory?.content, speak, storyParts]);

  // Stop playback
  const stopPlayback = useCallback(() => {
    stop();
    setIsReading(false);
  }, [stop]);

  // Generate highlighted text with matched and missed words
  const getHighlightedText = useCallback(() => {
    if (!showResults || !selectedStory || storyParts.length === 0) 
      return selectedStory?.content || "";
      
    const contentToHighlight = storyParts[selectedPartIndex].content;

    const normalizeText = (text: string) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    };

    const userSpeechWords = normalizeText(userSpeech).split(" ");
    let indexWord = -1;

    // Create spans with appropriate classes for highlighting
    return contentToHighlight
      .split(/\b/)
      .map((part) => {
        const normalized = normalizeText(part);
        const skipMatch = !normalized  || normalized.length < 2
        const skipWord = normalized === ', ' || normalized === ','
        const excludeSkip = normalized !== 'a' && normalized !== 'i' 
        if (skipWord) return part;
        if (skipMatch && excludeSkip) return part;
        indexWord++;

        const findMissedWord = missedWords.find((_value, index) => indexWord === index);
        if (findMissedWord?.word === normalized) {
          return `<span class="text-red-500 font-bold">${part}</span>`;
        }

        const userWord = userSpeechWords[indexWord];
        if (!userWord) {
          return part
        }
        if (userWord === normalized) {
          return `<span class="text-green-500">${part}</span>`;
        } else {
          return `<span class="text-red-500 font-bold">${part}</span>`;
        }
      })
      .join("");
  }, [selectedStory, missedWords, showResults, userSpeech, storyParts, selectedPartIndex]);

  // Toggle the reading practice mode
  const toggleReading = useCallback(() => {
    if (isListening) {
      endReadingSession();
    } else {
      beginReadingSession();
    }
  }, [isListening, beginReadingSession, endReadingSession]);

  // Reset the reading practice
  const resetReading = useCallback(() => {
    resetRecognitionState();
    setAccuracy(0);
    setShowResults(false);
  }, [resetRecognitionState]);

  // Handle adding a new story
  const handleAddStory = async () => {
    // Validate form
    if (!newStory.title || !newStory.content) {
      setSubmitMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }
    
    setIsSubmitting(true);
    setSubmitMessage(null);
    
    try {
      // Create a complete story object
      const storyToAdd: Story = {
        id: newStory.id || `story-${Date.now()}`,
        title: newStory.title,
        content: newStory.content,
        difficulty: newStory.difficulty || 'beginner',
        words: newStory.content.split(/\s+/).filter(word => word.length > 0).length
      };
      
      // Send to API
      const response = await fetch('/api/stories/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ story: storyToAdd })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Success - add to local stories and select it
        setStories(prevStories => [...prevStories, storyToAdd]);
        setSelectedStoryWithCache(storyToAdd);
        
        // Reset form
        setNewStory({ 
          id: `story-${Date.now()}`, 
          title: "", 
          content: "", 
          difficulty: "beginner" 
        });
        
        setSubmitMessage({ type: 'success', text: 'Story added successfully!' });
        
        // Close dialog after a delay
        setTimeout(() => {
          setIsAddStoryDialogOpen(false);
          setSubmitMessage(null);
        }, 1500);
      } else {
        // Error
        setSubmitMessage({ type: 'error', text: data.error || 'Failed to add story' });
      }
    } catch (error) {
      console.error('Error adding story:', error);
      setSubmitMessage({ type: 'error', text: 'An error occurred while adding the story' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container min-h-screen p-4 max-w-4xl mx-auto">
        <Navigation />
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Story Reading Practice
          </h1>

          {/* Tab Navigation */}
          <TabNavigation tabs={TABS} />

          <div className="mt-6 bg-white p-6 rounded-lg shadow-sm">
            {/* Story selection button */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium">Current Story</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsAddStoryDialogOpen(true)}
                    className="px-4 py-2 bg-green-50 text-green-600 rounded-md border border-green-200 hover:bg-green-100 transition-colors"
                  >
                    Add Story
                  </button>
                  <button
                    onClick={() => {
                      if (!isListening && !isReading) {
                        setIsStoryDialogOpen(true);
                      }
                    }}
                    className={`px-4 py-2 bg-blue-50 text-blue-600 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors ${isListening || isReading ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={isListening || isReading}
                  >
                    Change Story
                  </button>
                </div>
              </div>
              
              {/* Current story card */}
              <div className="p-4 border rounded-lg border-blue-500 bg-blue-50">
                <h3 className="font-medium text-lg">{selectedStory?.title}</h3>
                <div className="flex justify-between mt-2">
                  <span
                    className={`px-2 py-0.5 rounded ${selectedStory?.difficulty === "beginner" ? "bg-green-100 text-green-800" : selectedStory?.difficulty === "intermediate" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}
                  >
                    {selectedStory?.difficulty}
                  </span>
                  <span className="text-gray-500">{selectedStory?.words} words</span>
                </div>
                
                {/* Story parts navigation */}
                {storyParts.length > 1 && (
                  <div className="mt-4 border-t pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Story Parts</span>
                      <span className="text-xs text-gray-500">{selectedPartIndex + 1} of {storyParts.length}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setPartIndexWithCache(selectedPartIndex - 1)}
                        disabled={selectedPartIndex === 0 || isListening || isReading}
                        className={`px-2 py-1 rounded ${selectedPartIndex === 0 || isListening || isReading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                      >
                        ← Previous
                      </button>
                      
                      <div className="flex space-x-1">
                        {storyParts.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setPartIndexWithCache(index)}
                            disabled={isListening || isReading}
                            className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${selectedPartIndex === index ? 'bg-blue-500 text-white' : isListening || isReading ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                          >
                            {index + 1}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setPartIndexWithCache(selectedPartIndex + 1)}
                        disabled={selectedPartIndex === storyParts.length - 1 || isListening || isReading}
                        className={`px-2 py-1 rounded ${selectedPartIndex === storyParts.length - 1 || isListening || isReading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Story selection dialog using the reusable Dialog component */}
            <Dialog
              isOpen={isStoryDialogOpen}
              onClose={() => setIsStoryDialogOpen(false)}
              title="Select a Story"
              maxWidth="max-w-3xl"
              footer={
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsStoryDialogOpen(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                {isLoading ? (
                  <div className="flex justify-center items-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  stories.map((story) => (
                    <div
                      key={story.id}
                      onClick={() => {
                        setSelectedStoryWithCache(story);
                        resetReading();
                        setIsStoryDialogOpen(false);
                      }}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedStory?.id === story.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}
                    >
                      <h3 className="font-medium">{story.title}</h3>
                      <div className="flex justify-between mt-2 text-sm">
                        <span
                          className={`px-2 py-0.5 rounded ${story.difficulty === "beginner" ? "bg-green-100 text-green-800" : story.difficulty === "intermediate" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}
                        >
                          {story.difficulty}
                        </span>
                        <span className="text-gray-500">{story.words} words</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Dialog>
            
            {/* Add Story Dialog */}
            <Dialog
              isOpen={isAddStoryDialogOpen}
              onClose={() => setIsAddStoryDialogOpen(false)}
              title="Add New Story"
              maxWidth="max-w-2xl"
              footer={
                <div className="flex justify-between w-full">
                  <div>
                    {submitMessage && (
                      <div className={`text-sm ${submitMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {submitMessage.text}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsAddStoryDialogOpen(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddStory}
                      disabled={isSubmitting || !newStory.title || !newStory.content}
                      className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${(isSubmitting || !newStory.title || !newStory.content) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Story'}
                    </button>
                  </div>
                </div>
              }
            >
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleAddStory(); }}>
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newStory.title}
                    onChange={(e) => setNewStory({...newStory, title: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    id="difficulty"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newStory.difficulty}
                    onChange={(e) => setNewStory({...newStory, difficulty: e.target.value as "beginner" | "intermediate" | "advanced"})}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    id="content"
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newStory.content}
                    onChange={(e) => setNewStory({...newStory, content: e.target.value})}
                    placeholder="Enter your story text here. Use blank lines to separate paragraphs."
                    required
                  />
                </div>
                
                <div className="text-sm text-gray-500">
                  <p>Word count: {newStory.content?.split(/\s+/).filter(word => word.length > 0).length || 0} words</p>
                  <p>Paragraphs: {newStory.content?.split(/\n\s*\n/).filter(p => p.trim().length > 0).length || 0}</p>
                </div>
              </form>
            </Dialog>

            {/* Reading controls */}
            <div className="mb-4 flex flex-wrap gap-3 justify-center">
              <button
                onClick={playStory}
                disabled={isListening || isReading}
                className={`flex items-center px-4 py-2 bg-green-500 text-white rounded-lg transition-colors ${
                  isListening || isReading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-green-600"
                }`}
              >
                <Sound />
                <span className="ml-2">Listen to Story</span>
              </button>

              <button
                onClick={toggleReading}
                disabled={isReading || !isSupported}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  isListening
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                } ${(isReading || !isSupported) ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Mic isListening={isListening} />
                <span className="ml-2">
                  {isListening ? "Stop Reading" : "Start Reading"}
                </span>
              </button>

              {isReading && (
                <button
                  onClick={stopPlayback}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Stop Playback
                </button>
              )}

              {showResults && (
                <button
                  onClick={resetReading}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Error message */}
            {(componentError || !isSupported) && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                {!isSupported ? 
                  "Your browser doesn't support speech recognition. Try using Chrome or Edge." : 
                  componentError}
                <button 
                  onClick={() => setComponentError(null)}
                  className="ml-2 underline text-blue-600 hover:text-blue-800"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Reading results */}
            {showResults && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-medium mb-2">
                  Your Reading Results
                </h3>
                <div className="flex flex-wrap gap-4 mb-3">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Accuracy</div>
                    <div className="text-2xl font-bold">{accuracy}%</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Words Read</div>
                    <div className="text-2xl font-bold">
                      {matchedWords.length}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Words Missed</div>
                    <div className="text-2xl font-bold">
                      {missedWords.length}
                    </div>
                  </div>
                </div>

                {missedWords.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-medium mb-1">Words you missed:</h4>
                    <div className="flex flex-wrap gap-2">
                      {missedWords.map((item, index) => (
                        <span
                          key={index}
                          onClick={() => speak(item.word)}
                          className="px-2 py-1 bg-red-100 text-red-800 rounded"
                        >
                          {item.word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Story content */}
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">
                  {selectedStory?.title} {storyParts.length > 1 && <span className="text-sm font-normal text-gray-500">- Part {selectedPartIndex + 1}</span>}
                </h3>
                
                {storyParts.length > 0 && (
                  <div className="text-sm text-gray-500">
                    {storyParts[selectedPartIndex].words} words
                  </div>
                )}
              </div>

              {isListening && (
                <div className="absolute right-0 top-0">
                  <div className="animate-pulse flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium">Listening...</span>
                  </div>
                </div>
              )}

              <div
                ref={storyContentRef}
                className={`prose max-w-none p-4 bg-gray-50 rounded-lg overflow-y-auto ${
                  isListening ? "border-2 border-blue-500" : ""
                }`}
                style={{
                  maxHeight: "400px",
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.8",
                }}
              >
                {showResults ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: getHighlightedText() }}
                  />
                ) : (
                  storyParts.length > 0 ? (
                    storyParts[selectedPartIndex].content.split("\n").map((line, lineIndex) => (
                      <p key={lineIndex} className="mb-2">
                        {line.split(" ").map((word, wordIndex) => (
                          <span
                            key={`${lineIndex}-${wordIndex}`}
                            className="inline-block mr-1"
                          >
                            {word}
                          </span>
                        ))}
                      </p>
                    ))
                  ) : (
                    selectedStory?.content.split("\n").map((line, lineIndex) => (
                      <p key={lineIndex} className="mb-2">
                        {line.split(" ").map((word, wordIndex) => (
                          <span
                            key={`${lineIndex}-${wordIndex}`}
                            className="inline-block mr-1"
                          >
                            {word}
                          </span>
                        ))}
                      </p>
                    ))
                  )
                )}
              </div>
            </div>

            {/* User speech output for debugging */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium mb-1">
                Voice-to-Text Debug Output:
              </h4>
              <div className="text-gray-700">
                {userSpeech ? userSpeech : "No speech detected yet"}
              </div>
              {isListening && (
                <div className="mt-2 text-xs text-blue-600 animate-pulse">
                  Listening active...
                </div>
              )}
            </div>
          </div>

          {/* Reading history */}
          {readingAttempts.length > 0 && (
            <div className="mt-6 bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-medium">Your Reading History</h2>
                <button
                  onClick={clearReadingHistory}
                  className="px-3 py-1 bg-red-50 text-red-600 rounded-md border border-red-200 hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  Clear History
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Story</th>
                      <th className="px-4 py-2 text-left">Accuracy</th>
                      <th className="px-4 py-2 text-left">Duration</th>
                      <th className="px-4 py-2 text-left">Missed Words</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readingAttempts
                      .sort((a, b) => b.date - a.date)
                      .slice(0, 10)
                      .map((attempt, index) => {
                        const story =
                          STORIES.find((s) => s.id === attempt.storyId) ||
                          STORIES[0];
                        return (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-2">
                              {new Date(attempt.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2">{story.title}</td>
                            <td className="px-4 py-2">{attempt.accuracy}%</td>
                            <td className="px-4 py-2">
                              {attempt.duration.toFixed(1)} sec
                            </td>
                            <td className="px-4 py-2">
                              {attempt.missedWords.length > 0
                                ? attempt.missedWords.slice(0, 3).join(", ") +
                                  (attempt.missedWords.length > 3
                                    ? `... (+${
                                        attempt.missedWords.length - 3
                                      } more)`
                                    : "")
                                : "None"}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
