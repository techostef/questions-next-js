/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Navigation from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import TabNavigation from "@/components/TabNavigation";
import { Sound } from "@/assets/sound";
import { Mic } from "@/assets/mic";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { TABS } from "../constants";

// Add type definition for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface Story {
  id: string;
  title: string;
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
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
  missedWords: string[];
  matchedWords: WordMatch[];
}

// Mock stories for practice
const STORIES: Story[] = [
  {
    id: 'story-1',
    title: 'The Determined Developer',
    content: `Once upon a time in a bustling tech hub, there lived a young developer named Maya. Every morning, she arrived at her tiny corner desk with a steaming cup of coffee and a heart full of ideas. Her dream was to create an app that would help people learn new languages through short, daily stories—just like the one you're reading now.

One afternoon, after weeks of coding, Maya finally released the first version of her app. Excited users flooded in, but not long after, bug reports began to pour in. Some stories failed to load, buttons didn't respond, and worst of all, the progress tracker reset itself at random. Maya felt her excitement fade into frustration.

Instead of giving up, she took a deep breath and wrote down each bug report. She prioritized them: "Failed loads" at the top, "unresponsive buttons" next, and "tracker resets" after that. Day by day, she tackled one issue at a time. She added logging to find where the app crashed, rewrote the button-handling code to be more robust, and fixed the logic in the tracker so it stored progress reliably.

A week later, Maya rolled out an update—and this time, everything worked flawlessly. Users praised the smooth experience and shared stories of how they were finally keeping up with their language goals. Maya watched the download numbers climb and felt a surge of pride. She realized that perseverance, careful planning, and steady effort could turn frustration into success.

And so, Maya's app became a favorite among language learners everywhere, all because she refused to let setbacks stop her. The end.`,
    difficulty: 'intermediate',
    words: 255
  },
  {
    id: 'story-2',
    title: 'The First Day',
    content: `It was Sarah's first day at her new job. She woke up early and prepared a healthy breakfast. She was excited but also nervous. The office was in a tall building downtown. 

She arrived fifteen minutes early and took the elevator to the tenth floor. Her new boss greeted her with a warm smile and showed her to her desk. Everyone was friendly and helpful. 

By lunchtime, Sarah had already learned many new things. She felt happy about her decision to take this job. At the end of the day, she was tired but satisfied. She knew tomorrow would be even better.`,
    difficulty: 'beginner',
    words: 98
  },
  {
    id: 'story-3',
    title: 'The Quantum Paradox',
    content: `Professor Elena Nakamura scrutinized the quantum readings fluctuating across her holographic display. The entanglement pattern exhibited unprecedented stability despite the gravitational interference from the nearby neutron star. Her groundbreaking experiment—combining quantum teleportation with relativistic frame-dragging—was yielding results that contradicted three established laws of physics simultaneously.

"The paradox suggests a fundamental misunderstanding in our model of quantum gravity," she explained to her bewildered graduate students. "The non-locality principle isn't being violated; rather, it's operating within a higher-dimensional framework that our instruments are only now capable of detecting."

Elena's colleagues at CERN and the Perimeter Institute had initially dismissed her theoretical framework as mathematically elegant but experimentally unfeasible. Now, as her quantum processor maintained coherence at temperatures approaching 80 Kelvin—far above the predicted thermal decoherence threshold—the scientific community would have to reconsider the very foundations of quantum mechanics.`,
    difficulty: 'advanced',
    words: 143
  }
];

export default function StoriesPage() {
  // State for stories and reading practice
  const [selectedStory, setSelectedStory] = useState<Story>(STORIES[0]);
  const [isReading, setIsReading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userSpeech, setUserSpeech] = useState("");
  const [missedWords, setMissedWords] = useState<string[]>([]);
  const [matchedWords, setMatchedWords] = useState<WordMatch[]>([]);
  const [accuracy, setAccuracy] = useState(0);
  const [readingAttempts, setReadingAttempts] = useState<ReadingAttempt[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for managing speech recognition
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const storyContentRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  
  // Speech synthesis for reading the story
  const { speak, stop } = useSpeechSynthesis();

  // Load reading attempts from localStorage
  useEffect(() => {
    const loadAttempts = () => {
      try {
        const savedAttempts = localStorage.getItem("readingAttempts");
        if (savedAttempts) {
          const parsed: ReadingAttempt[] = JSON.parse(savedAttempts);
          setReadingAttempts(parsed);
        }
      } catch (error) {
        console.error("Error loading reading attempts:", error);
      }
    };

    loadAttempts();
  }, []);

  // Initialize speech recognition
  const initSpeechRecognition = useCallback(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setError("Your browser doesn't support speech recognition. Try using Chrome.");
        return false;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setUserSpeech("");
        setMissedWords([]);
        setMatchedWords([]);
        setError(null);
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + " ";
        }
        setUserSpeech(transcript.trim());
        // Process speech in real-time to provide feedback
        processSpeech(transcript.trim());
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setError(`Speech recognition error: ${event.error}`);
        stopListening();
      };

      recognition.onend = () => {
        // This can be triggered even when there's an error
        if (isListening) {
          stopListening();
        }
      };

      recognitionRef.current = recognition;
      return true;
    } catch (error) {
      console.error("Error initializing speech recognition:", error);
      setError("Failed to initialize speech recognition. Please try a different browser.");
      return false;
    }
  }, [isListening]);

  // Start listening for speech
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      if (!initSpeechRecognition()) {
        return;
      }
    }

    try {
      // Reset state
      setUserSpeech("");
      setMissedWords([]);
      setMatchedWords([]);
      setShowResults(false);
      setIsListening(true);
      audioChunksRef.current = [];
      startTimeRef.current = Date.now();

      // Start recording audio
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.start(200); // Collect chunks every 200ms
        })
        .catch(err => {
          console.error("Error accessing microphone:", err);
          setError("Could not access your microphone. Please check permissions.");
          setIsListening(false);
        });

      // Start speech recognition
      recognitionRef.current.start();
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setError("Failed to start speech recognition. Please try again.");
      setIsListening(false);
    }
  }, [initSpeechRecognition]);

  // Stop listening for speech
  const stopListening = useCallback(() => {
    setIsListening(false);

    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_e: unknown) {
        console.log("Recognition already stopped", _e);
      }
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      
      // Stop all tracks in the stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }

    // Calculate final results
    if (userSpeech) {
      const finalResults = processSpeech(userSpeech, true);
      const duration = (Date.now() - startTimeRef.current) / 1000; // in seconds
      
      // Save reading attempt
      saveReadingAttempt({
        storyId: selectedStory.id,
        date: Date.now(),
        accuracy: finalResults.accuracy,
        duration,
        missedWords: finalResults.missedWords,
        matchedWords: finalResults.matchedWords
      });

      setShowResults(true);
    }
  }, [userSpeech, selectedStory.id]);

  // Process speech for word matching
  const processSpeech = useCallback((speech: string, isFinal: boolean = false) => {
    if (!speech || !selectedStory) return { accuracy: 0, missedWords: [], matchedWords: [] };

    // Normalize text by removing punctuation and converting to lowercase
    const normalizeText = (text: string) => {
      return text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    // Get all words from the story
    const storyWords = normalizeText(selectedStory.content)
      .split(' ')
      .filter(word => word.length > 0);
    
    // Get words from user speech
    const userWords = normalizeText(speech)
      .split(' ')
      .filter(word => word.length > 0);

    // Track which words were matched
    const storyWordsMatched = new Set<number>();
    const matchedWordsWithTimestamp: WordMatch[] = [];
    const currentTime = Date.now();

    // For each user word, find if it appears in the story
    userWords.forEach(userWord => {
      if (userWord.length < 2) return; // Skip very short words
      
      // Find the first unmatched occurrence of this word in the story
      const storyIndex = storyWords.findIndex((storyWord, index) => 
        !storyWordsMatched.has(index) && storyWord === userWord
      );

      if (storyIndex !== -1) {
        storyWordsMatched.add(storyIndex);
        matchedWordsWithTimestamp.push({
          word: userWord,
          matched: true,
          timestamp: currentTime
        });
      }
    });

    // Find missed words
    const missed = storyWords
      .filter((word, index) => !storyWordsMatched.has(index) && word.length > 2); // Ignore small words
    
    // Calculate accuracy
    const accuracyPercent = storyWords.length > 0 
      ? Math.round((storyWordsMatched.size / storyWords.length) * 100) 
      : 0;

    // Update state if this is final processing
    if (isFinal) {
      setMissedWords(missed);
      setMatchedWords(matchedWordsWithTimestamp);
      setAccuracy(accuracyPercent);
    }

    return {
      accuracy: accuracyPercent,
      missedWords: missed,
      matchedWords: matchedWordsWithTimestamp
    };
  }, [selectedStory]);

  // Save reading attempt to localStorage
  const saveReadingAttempt = useCallback((attempt: ReadingAttempt) => {
    try {
      const updatedAttempts = [...readingAttempts, attempt];
      setReadingAttempts(updatedAttempts);
      localStorage.setItem("readingAttempts", JSON.stringify(updatedAttempts));
    } catch (error) {
      console.error("Error saving reading attempt:", error);
    }
  }, [readingAttempts]);

  // Play the selected story using text-to-speech
  const playStory = useCallback(() => {
    setIsReading(true);
    speak(selectedStory.content, false);
  }, [selectedStory, speak]);

  // Stop playback
  const stopPlayback = useCallback(() => {
    stop();
    setIsReading(false);
  }, [stop]);

  // Generate highlighted text with matched and missed words
  const getHighlightedText = useCallback(() => {
    if (!showResults || !selectedStory) return selectedStory.content;
    
    const normalizeText = (text: string) => {
      return text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    const storyWords = normalizeText(selectedStory.content).split(' ');
    const missedWordsSet = new Set(missedWords);
    
    // Create spans with appropriate classes for highlighting
    return selectedStory.content.split(/\b/).map((part) => {
      const normalized = normalizeText(part);
      if (!normalized || normalized.length < 2) return part;
      
      if (missedWordsSet.has(normalized)) {
        return `<span class="text-red-500 font-bold">${part}</span>`;
      } 
      
      if (storyWords.includes(normalized)) {
        return `<span class="text-green-500">${part}</span>`;
      }
      
      return part;
    }).join('');
  }, [selectedStory, missedWords, showResults]);

  // Toggle the reading practice mode
  const toggleReading = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Reset the reading practice
  const resetReading = useCallback(() => {
    setUserSpeech("");
    setMissedWords([]);
    setMatchedWords([]);
    setAccuracy(0);
    setShowResults(false);
    setError(null);
  }, []);

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
            {/* Story selection */}
            <div className="mb-6">
              <h2 className="text-xl font-medium mb-3">Select a Story</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {STORIES.map((story) => (
                  <div
                    key={story.id}
                    onClick={() => {
                      if (!isListening && !isReading) {
                        setSelectedStory(story);
                        resetReading();
                      }
                    }}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedStory.id === story.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    } ${(isListening || isReading) ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <h3 className="font-medium">{story.title}</h3>
                    <div className="flex justify-between mt-2 text-sm">
                      <span className={`px-2 py-0.5 rounded ${
                        story.difficulty === 'beginner' 
                          ? 'bg-green-100 text-green-800' 
                          : story.difficulty === 'intermediate'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {story.difficulty}
                      </span>
                      <span className="text-gray-500">{story.words} words</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reading controls */}
            <div className="mb-4 flex flex-wrap gap-3 justify-center">
              <button
                onClick={playStory}
                disabled={isListening || isReading}
                className={`flex items-center px-4 py-2 bg-green-500 text-white rounded-lg transition-colors ${
                  isListening || isReading ? "opacity-50 cursor-not-allowed" : "hover:bg-green-600"
                }`}
              >
                <Sound /> 
                <span className="ml-2">Listen to Story</span>
              </button>

              <button
                onClick={toggleReading}
                disabled={isReading}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  isListening
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                } ${isReading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Mic isListening={isListening} />
                <span className="ml-2">{isListening ? "Stop Reading" : "Start Reading"}</span>
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
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Reading results */}
            {showResults && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Your Reading Results</h3>
                <div className="flex flex-wrap gap-4 mb-3">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Accuracy</div>
                    <div className="text-2xl font-bold">{accuracy}%</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Words Read</div>
                    <div className="text-2xl font-bold">{matchedWords.length}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-500">Words Missed</div>
                    <div className="text-2xl font-bold">{missedWords.length}</div>
                  </div>
                </div>

                {missedWords.length > 0 && (
                  <div className="mb-3">
                    <h4 className="font-medium mb-1">Words you missed:</h4>
                    <div className="flex flex-wrap gap-2">
                      {missedWords.map((word, index) => (
                        <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Story content */}
            <div className="relative">
              <h3 className="text-lg font-medium mb-2">
                {selectedStory.title}
              </h3>
              
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
                style={{ maxHeight: "400px", whiteSpace: "pre-wrap", lineHeight: "1.8" }}
              >
                {showResults ? (
                  <div dangerouslySetInnerHTML={{ __html: getHighlightedText() }} />
                ) : (
                  selectedStory.content.split('\n').map((line, lineIndex) => (
                    <p key={lineIndex} className="mb-2">
                      {line.split(' ').map((word, wordIndex) => (
                        <span key={`${lineIndex}-${wordIndex}`} className="inline-block mr-1">
                          {word}
                        </span>
                      ))}
                    </p>
                  ))
                )}
              </div>
            </div>

            {/* User speech output for debugging */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium mb-1">Voice-to-Text Debug Output:</h4>
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
              <h2 className="text-xl font-medium mb-3">Your Reading History</h2>
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
                        const story = STORIES.find(s => s.id === attempt.storyId) || STORIES[0];
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
                                  (attempt.missedWords.length > 3 ? `... (+${attempt.missedWords.length - 3} more)` : "")
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