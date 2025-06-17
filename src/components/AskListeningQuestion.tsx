"use client";

import { cleanUpResult } from "@/lib/string";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import ModelSelector from "@/components/ModelSelector";
import { DEFAULT_CHAT_MODEL } from "@/constants/listModelsOpenAI";
import QuizListening from "./QuizListening";
import { ListeningQuizData, useQuizListeningStore } from "@/store/quizListeningStore";
import { v4 as uuidv4 } from "uuid";

export interface AskListeningQuestionMethods {
  sendMessage: (customPrompt?: string) => Promise<void>;
  loadDifferentQuiz: () => Promise<void>;
}

const CACHE_KEY = "english_listening_quiz_cached_questions";
const MAX_CACHED_QUESTIONS = 100; // Maximum number of questions to store

const AskListeningQuestion = () => {
  const [isLoadingMain, setIsLoadingMain] = useState(false);
  const [cachedQuestions, setCachedQuestions] = useState<string[]>([]);
  const [showCachedQuestions, setShowCachedQuestions] = useState(false);
  const [selectedCacheIndex, setSelectedCacheIndex] = useState<number>(0);
  const [countCacheQuestions, setCountCacheQuestions] = useState<number>(0);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_CHAT_MODEL);
  const [listeningData, setListeningData] = useState<Record<string, Array<unknown>>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Using global state from Zustand store
  const { quizData, setQuizData, setAllQuizData, addQuizToCollection } =
    useQuizListeningStore();

  // Setup react-hook-form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
  } = useForm<{ question: string }>({ defaultValues: { question: "" } });
  const questionValue = watch("question");

  const isLoading = isLoadingMain;

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/categories-listening", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.status !== 200) {
        throw new Error("Failed to fetch data");
      }
      const data = await res.json();
      setCachedQuestions(data);
    } catch (error) {
      console.error("Error loading cached questions:", error);
    }
  };

  useEffect(() => {
    loadCategories();
    // Load cached questions from localStorage
    const savedQuestions = localStorage.getItem(CACHE_KEY);
    if (savedQuestions) {
      try {
        setCachedQuestions(JSON.parse(savedQuestions));
      } catch (error) {
        console.error("Error parsing saved questions:", error);
        localStorage.removeItem(CACHE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (listeningData && questionValue && listeningData[questionValue]) {
      const cleanedResult = cleanUpResult(
        listeningData[questionValue][selectedCacheIndex]
      );
      setQuizData(cleanedResult);

      // Add to allQuizData collection with unique ID
      const quizId = `listening-${questionValue.substring(
        0,
        15
      )}-${uuidv4().substring(0, 8)}`;
      addQuizToCollection(quizId, cleanedResult);
    }
  }, [
    listeningData,
    questionValue,
    selectedCacheIndex,
    setQuizData,
    addQuizToCollection,
  ]);

  const handleGetFromCache = async () => {
    try {
      setIsLoadingMain(true);
      const res = await fetch("/api/quiz-listening", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await res.json();
      setListeningData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoadingMain(false);
    }
  };

  useEffect(() => {
    if (listeningData && questionValue && listeningData[questionValue]) {
      const newData: ListeningQuizData[] = [];
      for (const value of listeningData[questionValue]) {
        newData.push(cleanUpResult(value));
      }
      setAllQuizData(newData);
    }
  }, [listeningData, questionValue, setAllQuizData]);

  const updateCountCacheQuestions = async (customQuestion?: string) => {
    setCountCacheQuestions(
      listeningData?.[customQuestion || questionValue]?.length || 0
    );
    setSelectedCacheIndex(0);
  };

  // Function to select a cached question
  const selectCachedQuestion = (question: string) => {
    setValue("question", question);
    setShowCachedQuestions(false);

    // Move the selected question to the top of the list (most recently used)
    updateCachedQuestions(question);
    updateCountCacheQuestions(question);
  };

  // Update the cached questions list with MRU sorting
  const updateCachedQuestions = (newQuestion: string) => {
    setCachedQuestions((prevQuestions) => {
      // Remove the question if it already exists
      const filteredQuestions = prevQuestions.filter(q => q !== newQuestion);
      
      // Add the new question at the beginning
      const updatedQuestions = [newQuestion, ...filteredQuestions];
      
      // Limit to MAX_CACHED_QUESTIONS
      const limitedQuestions = updatedQuestions.slice(0, MAX_CACHED_QUESTIONS);
      
      // Save to localStorage
      localStorage.setItem(CACHE_KEY, JSON.stringify(limitedQuestions));
      
      return limitedQuestions;
    });
  };

  // Function to send message to API
  const sendMessage = async (customPrompt?: string) => {
    const prompt = customPrompt || questionValue;
    if (!prompt.trim()) {
      setErrorMessage("Please enter a question.");
      return;
    }

    try {
      setIsLoadingMain(true);
      setErrorMessage(null);

      const response = await fetch("/api/quiz-listening", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-chat-model": selectedModel,
        },
        body: JSON.stringify({ messages: prompt, model: selectedModel }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch quiz data");
      }

      const data = await response.json();
      
      // Update state with new response
      setListeningData((prevData) => ({
        ...prevData,
        [prompt]: [...(prevData[prompt] || []), data],
      }));

      // Update cached questions
      updateCachedQuestions(prompt);
      updateCountCacheQuestions(prompt);

    } catch (error) {
      console.error("Error sending message:", error);
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingMain(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h2 className="text-xl font-semibold mb-4">Listening Quiz</h2>
        
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error:</strong> {errorMessage}
          </div>
        )}
        
        {/* Model Selection */}
        <div className="mb-4 bg-white rounded-lg p-4 shadow-sm">
          <ModelSelector
            type="chat"
            defaultModel={DEFAULT_CHAT_MODEL}
            onChange={setSelectedModel}
            showFullList={false}
            pageName="quiz-listening"
          />
        </div>

        {/* Controls */}
        <div className="flex space-x-2 mb-2">
          <button
            onClick={() => setShowCachedQuestions(!showCachedQuestions)}
            className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-sm"
          >
            {showCachedQuestions ? "Hide History" : "Show History"}
          </button>
        </div>

        {/* Cached questions history */}
        {showCachedQuestions && cachedQuestions.length > 0 && (
          <div className="mb-3 border rounded p-2 bg-gray-50">
            <h3 className="text-sm font-medium mb-1">Previous Questions:</h3>
            <div className="max-h-40 overflow-y-auto">
              {cachedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => selectCachedQuestion(question)}
                  className="block w-full text-left p-1 text-sm hover:bg-blue-50 rounded truncate"
                  title={question}
                >
                  {index + 1}.{" "}
                  {question.length > 50
                    ? question.substring(0, 50) + "..."
                    : question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form with react-hook-form */}
        <form
          onSubmit={handleSubmit((data) => sendMessage(data.question))}
          className="space-y-2"
        >
          <div className="flex flex-col gap-2">
            <input
              className="border p-2 w-full"
              placeholder="Enter a listening topic (e.g., 'Daily Conversations', 'Business English', 'Travel Scenarios')"
              disabled={isLoading}
              {...register("question", { required: "Please enter a topic" })}
            />
            {countCacheQuestions > 0 && (
              <div className="flex flex-col w-full my-2">
                <label className="text-sm">
                  Available variations: {countCacheQuestions}
                </label>
                <select
                  className="border p-2 bg-white"
                  value={selectedCacheIndex}
                  onChange={(e) =>
                    setSelectedCacheIndex(Number(e.target.value))
                  }
                  disabled={isLoading || countCacheQuestions === 0}
                  title="Select which variation to use"
                >
                  {Array.from({ length: countCacheQuestions }, (_, i) => (
                    <option key={i} value={i}>
                      Variation {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate Listening Quiz"}
            </button>
            <button
              type="button"
              onClick={handleGetFromCache}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Get from cache"}
            </button>
          </div>
        </form>
      </div>
      
      {quizData && <QuizListening />}
    </>
  );
};

AskListeningQuestion.displayName = "AskListeningQuestion";

export default AskListeningQuestion;
