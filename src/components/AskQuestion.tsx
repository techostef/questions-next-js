"use client";

import { cleanUpResult } from "@/lib/string";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuizCache } from "@/hooks/useQuizCache";
import ModelSelector from "@/components/ModelSelector";
import { DEFAULT_CHAT_MODEL } from "@/constants/listModelsOpenAI";
import Quiz from "./Quiz";
import { Questions, useQuizStore } from "@/store/quizStore";
import { v4 as uuidv4 } from "uuid";

// Questions interface is now imported from the quizStore

export interface AskQuestionMethods {
  sendMessage: (customPrompt?: string) => Promise<void>;
  loadDifferentQuiz: () => Promise<void>;
}

const CACHE_KEY = "english_quiz_cached_questions";
const MAX_CACHED_QUESTIONS = 100; // Maximum number of questions to store

const AskQuestion = () => {
  const [isLoadingMain, setIsLoadingMain] = useState(false);
  const [cachedQuestions, setCachedQuestions] = useState<string[]>([]);
  const [showCachedQuestions, setShowCachedQuestions] = useState(false);
  const [selectedCacheIndex, setSelectedCacheIndex] = useState<number>(0);
  const [countCacheQuestions, setCountCacheQuestions] = useState<number>(0);
  const [selectedModel, setSelectedModel] =
    useState<string>(DEFAULT_CHAT_MODEL);
  // Using global state from Zustand store instead of local state
  const { quizData, setQuizData, setAllQuizData, addQuizToCollection } =
    useQuizStore();

  // Initialize the quiz cache hook
  const {
    data,
    getAllFromCache,
    isLoading: isLoadingAllCache,
    errorMessage,
    clearError,
  } = useQuizCache();

  // Setup react-hook-form
  const {
    register,
    handleSubmit,
    setValue,
    setError: setFormError,
    watch,
    formState: { errors },
    reset,
  } = useForm<{ question: string }>({ defaultValues: { question: "" } });
  const questionValue = watch("question");

  const isLoading = isLoadingMain || isLoadingAllCache;

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/categories", {
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
  }, []);

  useEffect(() => {
    if (data && questionValue && data[questionValue]) {
      const cleanedResult = cleanUpResult(
        data[questionValue][selectedCacheIndex]
      );
      setQuizData(cleanedResult);

      // Add to allQuizData collection with unique ID
      const quizId = `quiz-${questionValue.substring(
        0,
        15
      )}-${uuidv4().substring(0, 8)}`;
      addQuizToCollection(quizId, cleanedResult);
    }
  }, [
    data,
    questionValue,
    selectedCacheIndex,
    setQuizData,
    addQuizToCollection,
  ]);

  useEffect(() => {
    if (data && questionValue && data[questionValue]) {
      const newData: Questions[] = [];
      for (const value of data[questionValue]) {
        newData.push(cleanUpResult(value));
      }
      setAllQuizData(newData);
    }
  }, [data, questionValue, setAllQuizData]);

  const updateCountCacheQuestions = async (customQuestion?: string) => {
    setCountCacheQuestions(
      data?.[customQuestion || questionValue]?.length || 0
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
    // Create a new array without the selected question (if it exists)
    const filteredQuestions = cachedQuestions.filter((q) => q !== newQuestion);

    // Add the question to the beginning (most recently used)
    const updatedQuestions = [newQuestion, ...filteredQuestions].slice(
      0,
      MAX_CACHED_QUESTIONS
    );

    // Update state and localStorage
    setCachedQuestions(updatedQuestions);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(updatedQuestions));
    } catch (error) {
      console.error("Error saving cached questions:", error);
    }
  };

  const handleGetAllFromCache = async () => {
    clearError();
    await getAllFromCache();
  };

  const sendMessage = async (customPrompt?: string) => {
    try {
      setIsLoadingMain(true);
      const messageContent = customPrompt || questionValue;
      if (!customPrompt) reset({ question: "" });

      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-chat-model": selectedModel,
        },
        body: JSON.stringify({
          messages: messageContent,
          model: selectedModel,
        }),
      });
      if (res.status !== 200) {
        throw new Error("Failed to fetch data");
      }

      // Update cached questions list with the new message
      updateCachedQuestions(messageContent);
    } catch (error) {
      console.error("Error sending message:", error);
      if (error instanceof Error) {
        setFormError("question", {
          type: "server",
          message: error.message,
        });
      }
    } finally {
      setIsLoadingMain(false);
    }
  };

  return (
    <>
      <div className="pt-4">
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
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
            pageName="quiz"
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
              readOnly
              className="border p-2 w-full"
              placeholder="Ask something..."
              disabled={isLoading}
              {...register("question", { required: "Please enter a question" })}
            />
            {countCacheQuestions > 0 && (
              <div className="flex flex-col w-full my-2">
                <label className="text-sm">
                  Max index: {countCacheQuestions}
                </label>
                <select
                  className="border p-2 bg-white"
                  value={selectedCacheIndex}
                  onChange={(e) =>
                    setSelectedCacheIndex(Number(e.target.value))
                  }
                  disabled={isLoading || countCacheQuestions === 0}
                  title="Select which cache entry to use"
                >
                  {Array.from({ length: countCacheQuestions }, (_, i) => (
                    <option key={i} value={i}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {errors.question && (
            <div className="text-red-500 text-sm mb-2">
              {errors.question?.message}
            </div>
          )}
          <div className="flex space-x-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
            <button
              type="button"
              onClick={() => handleGetAllFromCache()}
              className="px-4 py-2 bg-blue-500 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Get from all cache"}
            </button>
          </div>
        </form>
      </div>
      {quizData && <Quiz />}
    </>
  );
};

// Add display name for the component
AskQuestion.displayName = "AskQuestion";

export default AskQuestion;
