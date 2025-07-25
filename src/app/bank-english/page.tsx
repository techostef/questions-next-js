"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import VoiceSelector from "@/components/VoiceSelector";
import AddWordDialog from "@/components/AddWordDialog";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { Sound } from "@/assets/sound";
import { EnglishWord, useVocabulary, VOCABULARY_QUERY_KEY } from "@/hooks/useVocabulary";
import { useQueryClient } from "@tanstack/react-query";
import { DEFAULT_CHAT_MODEL } from "@/constants/listModelsOpenAI";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { toPascalCase } from "@/lib/string";

// Now using the EnglishWord interface from useVocabulary hook

export default function BankEnglishPage() {
  // Access the query client for cache invalidation
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showMeaning, setShowMeaning] = useState<boolean>(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isAddingWords, setIsAddingWords] = useState<boolean>(false);
  const [addWordStatus, setAddWordStatus] = useState<{success?: boolean, message?: string}>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<EnglishWord[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_CHAT_MODEL);
  const { speak } = useSpeechSynthesis();
  
  // Using React Query to fetch vocabulary data
  const { data: words = [], isLoading: loading, error: queryError } = useVocabulary();

  // Function to speak the current word and its details
  const speakCurrentWord = (textToSpeak: string) => {
    speak(textToSpeak);
  };

  // Error handling for React Query
  const error = queryError ? "Failed to load vocabulary data. Please try again later." : null;

  // No longer need manual fetchWords function or useEffect since React Query handles that
  
  // Handle word search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    const lowercaseQuery = query.toLowerCase();
    const results = words.filter(word => 
      word.word.toLowerCase().includes(lowercaseQuery) ||
      word.synonyms?.toLowerCase().includes(lowercaseQuery) ||
      word.mean?.toLowerCase().includes(lowercaseQuery)
    );
    
    setSearchResults(results);
    
    // If there are results, navigate to the first result
    if (results.length > 0) {
      const firstResultIndex = words.findIndex(word => word.word === results[0].word);
      if (firstResultIndex !== -1) {
        setCurrentIndex(firstResultIndex);
      }
    }
  };
  
  // Get the queryClient to invalidate queries
  const handleAddWords = async (wordsList: string[]) => {
    const newWordsList = wordsList.map(word => toPascalCase(word));
    try {
      setIsAddingWords(true);
      
      const response = await fetch('/api/bank-english/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-chat-model': selectedModel,
        },
        body: JSON.stringify({ 
          words: newWordsList,
          model: selectedModel 
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to add words');
      }
      
      setAddWordStatus({
        success: true,
        message: result.message || 'Words added successfully'
      });
      
      // React Query will automatically refetch when we invalidate the query
      // This replaces the manual fetchWords() call
      queryClient.invalidateQueries({ queryKey: VOCABULARY_QUERY_KEY });
      
      // Clear status message after 5 seconds
      setTimeout(() => setAddWordStatus({}), 5000);
    } catch (err) {
      console.error('Error adding words:', err);
      setAddWordStatus({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to add words'
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => setAddWordStatus({}), 5000);
    } finally {
      setIsAddingWords(false);
    }
  };

  const goToFirst = () => {
    setCurrentIndex(0);
  };

  // Handle navigation
  const goToPrevious = () => {
    if (isSearching && searchResults.length > 0) {
      const currentResultIndex = searchResults.findIndex(w => w.word === words[currentIndex].word);
      if (currentResultIndex > 0) {
        // Go to previous search result
        const prevResultIndex = words.findIndex(w => w.word === searchResults[currentResultIndex - 1].word);
        setCurrentIndex(prevResultIndex);
      } else {
        // Wrap around to the last search result
        const lastResultIndex = words.findIndex(w => w.word === searchResults[searchResults.length - 1].word);
        setCurrentIndex(lastResultIndex);
      }
    } else {
      // Regular navigation without search
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else {
        setCurrentIndex(words.length - 1);
      }
    }
  };

  const goToNext = () => {
    if (isSearching && searchResults.length > 0) {
      const currentResultIndex = searchResults.findIndex(w => w.word === words[currentIndex].word);
      if (currentResultIndex < searchResults.length - 1) {
        // Go to next search result
        const nextResultIndex = words.findIndex(w => w.word === searchResults[currentResultIndex + 1].word);
        setCurrentIndex(nextResultIndex);
      } else {
        // Wrap around to the first search result
        const firstResultIndex = words.findIndex(w => w.word === searchResults[0].word);
        setCurrentIndex(firstResultIndex);
      }
    } else {
      // Regular navigation without search
      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0);
      }
    }
  };

  const goToRandom = () => {
    if (isSearching && searchResults.length > 0) {
      // Pick a random result from search results
      const randomResultIndex = Math.floor(Math.random() * searchResults.length);
      const wordIndex = words.findIndex(w => w.word === searchResults[randomResultIndex].word);
      setCurrentIndex(wordIndex);
    } else {
      // Regular random without search
      const randomIndex = Math.floor(Math.random() * words.length);
      setCurrentIndex(randomIndex);
    }
  };

  // Current word to display
  const currentWord = words[currentIndex];

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4 max-w-4xl">
        <Navigation />
        <div className="flex justify-between items-center mt-6 mb-4">
          <h1 className="text-3xl font-bold text-center flex-grow">
            English Vocabulary Bank
          </h1>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            variant="secondary"
          >
            Add Words
          </Button>
        </div>
        
        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <Input
              placeholder="Search for words, meanings, or synonyms..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchQuery && (
              <div
                onClick={() => handleSearch('')}
                className="cursor-pointer absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                ×
              </div>
            )}
          </div>
          {isSearching && (
            <div className="mt-2 text-sm text-gray-600">
              Found {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
              {searchResults.length > 0 && 
                <span 
                  onClick={() => {
                    setIsSearching(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="ml-2 cursor-pointer text-blue-500 hover:text-blue-700 underline"
                >
                  Clear search
                </span>
              }
            </div>
          )}
        </div>
        
        {/* Status message */}
        {addWordStatus.message && (
          <div className={`p-4 mb-4 rounded-lg text-center ${addWordStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {addWordStatus.message}
          </div>
        )}

        {/* Voice selector component */}
        <VoiceSelector />

        {isSearching && searchResults.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No words match your search query.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg text-red-600 text-center">
            <p>{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="primary"
            >
              Try Again
            </Button>
          </div>
        ) : words.length > 0 ? (
          <div className="mb-8">
            {/* Card for current word */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center flex-col md:flex-row mb-6">
                  <span className="text-sm text-gray-500 mb-2">
                    {isSearching 
                      ? `Result ${searchResults.findIndex(w => w.word === currentWord.word) + 1} of ${searchResults.length}` 
                      : `Word ${currentIndex + 1} of ${words.length}`}
                  </span>
                  <div className="flex justify-end space-x-2">
                    <Button
                      onClick={goToFirst}
                      variant="primary"
                    >
                      First
                    </Button>
                    <Button
                      onClick={goToPrevious}
                      variant="primary"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={goToNext}
                      variant="primary"
                    >
                      Next
                    </Button>
                    <Button
                      onClick={goToRandom}
                      variant="primary"
                    >
                      Random
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-3xl font-bold text-blue-600">
                    {currentWord.word}
                  </h2>
                  <div
                    onClick={() => speakCurrentWord(currentWord.word)}
                    className="cursor-pointer p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                    title="Listen to pronunciation and meaning"
                  >
                    <Sound />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-700">
                        Definition
                      </h3>
                      <Button
                        onClick={() => setShowMeaning(!showMeaning)}
                        variant="default"
                        size="small"
                      >
                        {showMeaning ? "Hide" : "Show"}
                      </Button>
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
                        <p className="text-gray-600 wrap-break-word">
                          {currentWord.synonyms || "None"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                          Antonyms
                        </h3>
                        <p className="text-gray-600 wrap-break-word">
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
                        <div
                          onClick={() => speakCurrentWord(currentWord.v1 || currentWord.word)}
                          className="cursor-pointer max-w-fit p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                          title="Listen to pronunciation and meaning"
                        >
                          <Sound />
                        </div>
                      </div>
                      <div className="p-2 bg-gray-50 rounded flex flex-col">
                        <span className="block text-xs text-gray-500">
                          Verb 2
                        </span>
                        <span className="font-medium">
                          {currentWord.v2 || "-"}
                        </span>
                        <div
                          onClick={() => speakCurrentWord(currentWord.v2 || "-")}
                          className="cursor-pointer max-w-fit p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                          title="Listen to pronunciation and meaning"
                        >
                          <Sound />
                        </div>
                      </div>
                      <div className="p-2 bg-gray-50 rounded flex flex-col">
                        <span className="block text-xs text-gray-500">
                          Verb 3
                        </span>
                        <span className="font-medium">
                          {currentWord.v3 || "-"}
                        </span>
                        <div
                          onClick={() => speakCurrentWord(currentWord.v3 || "-")}
                          className="cursor-pointer max-w-fit p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                          title="Listen to pronunciation and meaning"
                        >
                          <Sound />
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Example Sentences
                    </h3>
                    <div className="space-y-2 text-gray-600">
                      {currentWord.example_sentence1 && (
                        <div className="bg-blue-50">
                          <div className="p-2 pb-0 bg-blue-50 rounded">
                            {currentWord.example_sentence1}
                          </div>
                          <div
                            onClick={() =>
                              speakCurrentWord(currentWord.example_sentence1)
                            }
                            className="cursor-pointer p-2 rounded-full hover:bg-blue-200 transition-colors"
                            title="Listen to pronunciation and meaning"
                          >
                            <Sound />
                          </div>
                        </div>
                      )}
                      {currentWord.example_sentence2 && (
                        <div className="bg-blue-50">
                          <div className="p-2 pb-0 bg-blue-50 rounded">
                            {currentWord.example_sentence2}
                          </div>
                          <div
                            onClick={() =>
                              speakCurrentWord(currentWord.example_sentence2)
                            }
                            className="cursor-pointer p-2 rounded-full hover:bg-blue-200 transition-colors"
                            title="Listen to pronunciation and meaning"
                          >
                            <Sound />
                          </div>
                        </div>
                      )}
                      {currentWord.example_sentence3 && (
                        <div className="bg-blue-50">
                          <div className="p-2 pb-0 bg-blue-50 rounded">
                            {currentWord.example_sentence3}
                          </div>
                          <div
                            onClick={() =>
                              speakCurrentWord(currentWord.example_sentence3)
                            }
                            className="cursor-pointer p-2 rounded-full hover:bg-blue-200 transition-colors"
                            title="Listen to pronunciation and meaning"
                          >
                            <Sound />
                          </div>
                        </div>
                      )}
                      {!currentWord.example_sentence1 &&
                        !currentWord.example_sentence2 &&
                        !currentWord.example_sentence3 && (
                          <div className="italic text-gray-500">
                            No example sentences available
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation buttons for mobile view */}
            <div className="mt-6 flex justify-center space-x-4 md:hidden">
              <Button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                variant="primary"
              >
                ← Previous
              </Button>
              <Button
                onClick={goToNext}
                disabled={currentIndex === words.length - 1}
                variant="primary"
              >
                Next →
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No vocabulary words found.</p>
          </div>
        )}
        
        {/* Add Word Dialog */}
        <AddWordDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSubmit={handleAddWords}
          isLoading={isAddingWords}
          setSelectedModel={setSelectedModel}
        />
      </div>
    </ProtectedRoute>
  );
}
