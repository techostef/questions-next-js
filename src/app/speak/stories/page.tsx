"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Navigation from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import TabNavigation from "@/components/TabNavigation";
import { Sound } from "@/assets/sound";
// Mic component is now used in StoryReader
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
// No longer using speech recognition directly - now using StoryReader component
import StoryReader from "@/app/feature/StoryReader";
import { TABS } from "../constants";
import { STORIES } from "./mockData";
import AddStories from "@/app/feature/stories/addStories";
import HistoryAttempts from "@/app/feature/stories/historyAttemps";
import { findMistakes } from "@/lib/string";
import ListStories from "@/app/feature/stories/listStories";
import { MissedWord, ReadingAttempt, Story, StoryPart, WordMatch } from "@/types/story";
import { StoryContent } from "@/app/feature/stories/StoryContent";
import ControlStories from "@/app/feature/stories/ControlStories";

export default function StoriesPage() {
  // State for stories and reading practice
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [storyParts, setStoryParts] = useState<StoryPart[]>([]);
  const [selectedPartIndex, setSelectedPartIndex] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [userSpeech, setUserSpeech] = useState("");
  const [isFullStoryView, setIsFullStoryView] = useState(false);
  const [missedWords, setMissedWords] = useState<MissedWord[]>([]);
  const [matchedWords, setMatchedWords] = useState<WordMatch[]>([]);
  const [accuracy, setAccuracy] = useState(0);
  const [readingAttempts, setReadingAttempts] = useState<ReadingAttempt[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [componentError, setComponentError] = useState<string | null>(null);
  const [isStoryDialogOpen, setIsStoryDialogOpen] = useState(false);
  const [isAddStoryDialogOpen, setIsAddStoryDialogOpen] = useState(false);
  const [isLoading] = useState(false);

  // Story content ref for scrolling
  const storyContentRef = useRef<HTMLDivElement>(null);

  // Speech synthesis for reading the story
  const { speak, stop } = useSpeechSynthesis();

  // Define state to track recording status (replaced speech recognition)
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported] = useState(true); // Assume supported by default

  // Listen for errors from the StoryReader component
  // The StoryReader component will handle its own errors internally

  // Function to split story content into parts (paragraphs)
  const splitStoryIntoParts = useCallback((content: string) => {
    // Split by paragraphs (empty lines)
    const paragraphs = content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // If no paragraphs are found, treat the whole content as one part
    if (paragraphs.length === 0) {
      return [
        {
          part: 1,
          content: content,
          words: content.split(/\s+/).filter((word) => word.length > 0).length,
        },
      ];
    }

    // Create story parts from paragraphs
    return paragraphs.map((paragraph, index) => ({
      part: index + 1,
      content: paragraph,
      words: paragraph.split(/\s+/).filter((word) => word.length > 0).length,
    }));
  }, []);

  // Custom setter for selected story that also caches
  const setSelectedStoryWithCache = useCallback(
    (story: Story) => {
      setSelectedStory(story);
      localStorage.setItem("selectedStoryId", story.id);

      // Split the story into parts
      const parts = splitStoryIntoParts(story.content);
      setStoryParts(parts);
      setSelectedPartIndex(0);
    },
    [splitStoryIntoParts]
  );

  // Fetch stories from API
  const fetchStories = useCallback(async () => {
    setStories([...STORIES]);
    return [...STORIES];
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
  const saveReadingAttempt = useCallback((attempt: ReadingAttempt) => {
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
  }, []);

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
        const isMissed = listMissedWords.some(
          (missed) => missed.index === index
        );

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
      const accuracy =
        storyWords.length > 0
          ? Math.round((storyWordsMatched.size / storyWords.length) * 100)
          : 0;

      // Always update accuracy
      setAccuracy(accuracy);

      return {
        accuracy,
        missedWords: listMissedWords,
        matchedWords: matchedWordsWithTimestamp,
      };
    },
    [selectedStory, storyParts, selectedPartIndex]
  );

  // This is now handled by the StoryReader component's onTranscriptReceived callback

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
    // No need to clear transcript anymore - handled by StoryReader
  }, []);

  // Process final results
  const processResults = useCallback(
    (userSpeech: string) => {
      if (userSpeech.trim().length > 0) {
        // Get accuracy based on missed words
        const finalResults = processSpeech(userSpeech);

        // Calculate duration (just an example, in a real app this would be more accurate)
        const duration =
          matchedWords.length > 0
            ? matchedWords[matchedWords.length - 1].timestamp -
              matchedWords[0].timestamp
            : 0;

        // Save reading attempt
        saveReadingAttempt({
          storyId: selectedStory?.id || "",
          date: Date.now(),
          accuracy: finalResults.accuracy,
          duration,
          missedWords: missedWords,
          matchedWords: matchedWords,
        });

        setShowResults(true);
      }
    },
    [
      selectedStory?.id,
      processSpeech,
      saveReadingAttempt,
      matchedWords,
      missedWords,
    ]
  );

  useEffect(() => {
    if (userSpeech.trim().length > 0) {
      processResults(userSpeech);
    }
  }, [userSpeech]);

  // Set the selected part index and save to localStorage
  const setPartIndexWithCache = useCallback(
    (index: number) => {
      if (index >= 0 && index < storyParts.length) {
        setSelectedPartIndex(index);
        try {
          localStorage.setItem("selectedPartIndex", index.toString());
        } catch (error) {
          console.error("Error saving selected part index:", error);
        }
      }
    },
    [storyParts.length]
  );

  // Play the selected story part using text-to-speech
  const playStory = useCallback(() => {
    setIsReading(true);
    const contentToRead =
      storyParts.length > 0
        ? storyParts[selectedPartIndex].content
        : selectedStory?.content || "";
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
        const skipMatch = !normalized || normalized.length < 2;
        const skipWord = normalized === ", " || normalized === ",";
        const excludeSkip = normalized !== "a" && normalized !== "i";
        if (skipWord) return part;
        if (skipMatch && excludeSkip) return part;
        indexWord++;

        const findMissedWord = missedWords.find(
          (_value, index) => indexWord === index
        );
        if (findMissedWord?.word === normalized) {
          return `<span class="text-red-500 font-bold">${part}</span>`;
        }

        const userWord = userSpeechWords[indexWord];
        if (!userWord) {
          return part;
        }
        if (userWord === normalized) {
          return `<span class="text-green-500">${part}</span>`;
        } else {
          return `<span class="text-red-500 font-bold">${part}</span>`;
        }
      })
      .join("");
  }, [
    selectedStory,
    missedWords,
    showResults,
    userSpeech,
    storyParts,
    selectedPartIndex,
  ]);

  // Reset the reading practice
  const resetReading = useCallback(() => {
    resetRecognitionState();
    setAccuracy(0);
    setShowResults(false);
  }, [resetRecognitionState]);

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
            <ControlStories
              isRecording={isRecording}
              isReading={isReading}
              setIsAddStoryDialogOpen={setIsAddStoryDialogOpen}
              setIsStoryDialogOpen={setIsStoryDialogOpen}
              selectedStory={selectedStory}
              storyParts={storyParts}
              selectedPartIndex={selectedPartIndex}
              setPartIndexWithCache={setPartIndexWithCache}
              isFullStoryView={isFullStoryView}
              setIsFullStoryView={setIsFullStoryView}
            />

            <ListStories
              isStoryDialogOpen={isStoryDialogOpen}
              onClose={() => setIsStoryDialogOpen(false)}
              isLoading={isLoading}
              stories={stories}
              setSelectedStoryWithCache={setSelectedStoryWithCache}
              resetReading={resetReading}
              selectedStory={selectedStory}
            />

            <AddStories
              isAddStoryDialogOpen={isAddStoryDialogOpen}
              onCloseAddStoryDialog={() => setIsAddStoryDialogOpen(false)}
              setStories={setStories}
              setSelectedStoryWithCache={setSelectedStory}
            />

            {/* Reading controls */}
            <div className="mb-4 flex flex-wrap gap-3 justify-center">
              <button
                onClick={playStory}
                disabled={isRecording || isReading}
                className={`flex items-center px-4 py-2 bg-green-500 text-white rounded-lg transition-colors ${
                  isRecording || isReading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-green-600"
                }`}
              >
                <Sound />
                <span className="ml-2">Listen to Story</span>
              </button>

              <StoryReader
                storyText={selectedStory?.content || ""}
                onTranscriptReceived={(transcript) => {
                  setUserSpeech(transcript);
                  setIsRecording(false);
                }}
                onRecordingStateChange={(isRecording) => {
                  setIsRecording(isRecording);
                }}
                isReading={isReading}
                disabled={!isSupported}
              />

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
                {!isSupported
                  ? "Your browser doesn't support speech recognition. Try using Chrome or Edge."
                  : componentError}
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
            <StoryContent
              selectedStory={selectedStory}
              storyParts={storyParts}
              selectedPartIndex={selectedPartIndex}
              isRecording={isRecording}
              storyContentRef={storyContentRef}
              showResults={showResults}
              getHighlightedText={getHighlightedText}
              isFullStoryView={isFullStoryView}
            />

            {/* User speech output for debugging */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium mb-1">
                Voice-to-Text Debug Output:
              </h4>
              <div className="text-gray-700">
                {userSpeech ? userSpeech : "No speech detected yet"}
              </div>
              {isRecording && (
                <div className="mt-2 text-xs text-blue-600 animate-pulse">
                  Recording active...
                </div>
              )}
            </div>
            
            <HistoryAttempts 
              readingAttempts={readingAttempts}
              clearReadingHistory={clearReadingHistory}
              stories={stories}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
