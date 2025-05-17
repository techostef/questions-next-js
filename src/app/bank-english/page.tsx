"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import VoiceSelector from "@/components/VoiceSelector";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { Sound } from "@/assets/sound";

interface EnglishWord {
  word: string;
  mean: string;
  description: string;
  antonym: string;
  synonyms: string;
  v1: string;
  v2: string;
  v3: string;
  exampleSentence1: string;
  exampleSentence2: string;
  exampleSentence3: string;
}

export default function BankEnglishPage() {
  const [words, setWords] = useState<EnglishWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showMeaning, setShowMeaning] = useState<boolean>(false);
  const { speak } = useSpeechSynthesis();

  // Function to speak the current word and its details
  const speakCurrentWord = (textToSpeak: string) => {
    speak(textToSpeak);
  };

  // Fetch vocabulary data from API
  useEffect(() => {
    const fetchWords = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/bank-english");

        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setWords(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch vocabulary data:", err);
        setError("Failed to load vocabulary data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchWords();
  }, []);

  // Handle navigation
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(words.length - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const goToRandom = () => {
    const randomIndex = Math.floor(Math.random() * words.length);
    setCurrentIndex(randomIndex);
  };

  // Current word to display
  const currentWord = words[currentIndex];

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4 max-w-4xl">
        <Navigation />
        <h1 className="text-3xl font-bold mt-6 mb-4 text-center">
          English Vocabulary Bank
        </h1>

        {/* Voice selector component */}
        <VoiceSelector />

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg text-red-600 text-center">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : words.length > 0 ? (
          <div className="mb-8">
            {/* Card for current word */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center flex-col md:flex-row mb-6">
                  <span className="text-sm text-gray-500 mb-2">
                    Word {currentIndex + 1} of {words.length}
                  </span>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={goToPrevious}
                      className={`px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={goToNext}
                      className={`px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors`}
                    >
                      Next
                    </button>
                    <button
                      onClick={goToRandom}
                      className={`px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors`}
                    >
                      Random
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-3xl font-bold text-blue-600">
                    {currentWord.word}
                  </h2>
                  <button
                    onClick={() => speakCurrentWord(currentWord.word)}
                    className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                    title="Listen to pronunciation and meaning"
                  >
                    <Sound />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-700">
                        Definition
                      </h3>
                      <button
                        onClick={() => setShowMeaning(!showMeaning)}
                        className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        {showMeaning ? "Hide" : "Show"}
                      </button>
                    </div>
                    {showMeaning ? (
                      <p className="text-gray-600 mb-4 animate-fade-in">
                        {currentWord.mean}
                      </p>
                    ) : (
                      <div
                        className="border-2 border-dashed border-gray-300 rounded p-3 mb-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setShowMeaning(true)}
                      >
                        <p className="text-gray-400">
                          Click to reveal definition
                        </p>
                      </div>
                    )}

                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {currentWord.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          Synonyms
                        </h3>
                        <p className="text-gray-600">
                          {currentWord.synonyms || "None"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          Antonyms
                        </h3>
                        <p className="text-gray-600">
                          {currentWord.antonym || "None"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Verb Forms
                    </h3>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="p-2 bg-gray-50 rounded flex flex-col">
                        <span className="block text-xs text-gray-500">
                          Base Form
                        </span>
                        <span className="font-medium">
                          {currentWord.v1 || currentWord.word}
                        </span>
                        <button
                          onClick={() => speakCurrentWord(currentWord.v1 || currentWord.word)}
                          className="max-w-fit p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                          title="Listen to pronunciation and meaning"
                        >
                          <Sound />
                        </button>
                      </div>
                      <div className="p-2 bg-gray-50 rounded flex flex-col">
                        <span className="block text-xs text-gray-500">
                          Verb 2
                        </span>
                        <span className="font-medium">
                          {currentWord.v2 || "-"}
                        </span>
                        <button
                          onClick={() => speakCurrentWord(currentWord.v2 || "-")}
                          className="max-w-fit p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                          title="Listen to pronunciation and meaning"
                        >
                          <Sound />
                        </button>
                      </div>
                      <div className="p-2 bg-gray-50 rounded flex flex-col">
                        <span className="block text-xs text-gray-500">
                          Verb 3
                        </span>
                        <span className="font-medium">
                          {currentWord.v3 || "-"}
                        </span>
                        <button
                          onClick={() => speakCurrentWord(currentWord.v3 || "-")}
                          className="max-w-fit p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                          title="Listen to pronunciation and meaning"
                        >
                          <Sound />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Example Sentences
                    </h3>
                    <div className="space-y-2 text-gray-600">
                      {currentWord.exampleSentence1 && (
                        <div className="bg-blue-50">
                          <div className="p-2 pb-0 bg-blue-50 rounded">
                            {currentWord.exampleSentence1}
                          </div>
                          <button
                            onClick={() =>
                              speakCurrentWord(currentWord.exampleSentence1)
                            }
                            className="p-2 rounded-full hover:bg-blue-200 transition-colors"
                            title="Listen to pronunciation and meaning"
                          >
                            <Sound />
                          </button>
                        </div>
                      )}
                      {currentWord.exampleSentence2 && (
                        <div className="bg-blue-50">
                          <div className="p-2 pb-0 bg-blue-50 rounded">
                            {currentWord.exampleSentence2}
                          </div>
                          <button
                            onClick={() =>
                              speakCurrentWord(currentWord.exampleSentence2)
                            }
                            className="p-2 rounded-full hover:bg-blue-200 transition-colors"
                            title="Listen to pronunciation and meaning"
                          >
                            <Sound />
                          </button>
                        </div>
                      )}
                      {currentWord.exampleSentence3 && (
                        <div className="bg-blue-50">
                          <div className="p-2 pb-0 bg-blue-50 rounded">
                            {currentWord.exampleSentence3}
                          </div>
                          <button
                            onClick={() =>
                              speakCurrentWord(currentWord.exampleSentence3)
                            }
                            className="p-2 rounded-full hover:bg-blue-200 transition-colors"
                            title="Listen to pronunciation and meaning"
                          >
                            <Sound />
                          </button>
                        </div>
                      )}
                      {!currentWord.exampleSentence1 &&
                        !currentWord.exampleSentence2 &&
                        !currentWord.exampleSentence3 && (
                          <div className="italic text-gray-500">
                            No example sentences available
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pagination controls for mobile (bottom) */}
            <div className="mt-6 flex justify-center space-x-4 md:hidden">
              <button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className={`px-6 py-2 rounded-full ${
                  currentIndex === 0
                    ? "bg-gray-200 text-gray-500"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                } transition-colors`}
              >
                ← Previous
              </button>
              <button
                onClick={goToNext}
                disabled={currentIndex === words.length - 1}
                className={`px-6 py-2 rounded-full ${
                  currentIndex === words.length - 1
                    ? "bg-gray-200 text-gray-500"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                } transition-colors`}
              >
                Next →
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No vocabulary words found.</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
