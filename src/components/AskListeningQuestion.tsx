"use client";

import { cleanUpResult } from "@/lib/string";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import ModelSelector from "@/components/ModelSelector";
import { DEFAULT_CHAT_MODEL } from "@/constants/listModelsOpenAI";
import {
  useQuizListeningStore,
  ListeningQuizData,
} from "@/store/quizListeningStore";
import Button from "./Button";
import Input from "./Input";
import Select from "./Select";
import QuizListening from "./QuizListening";

export interface AskListeningQuestionMethods {
  sendMessage: (customPrompt?: string) => Promise<void>;
  loadDifferentQuiz: () => Promise<void>;
}

interface ListeningData {
  query: string
  responses: Response[]
}

interface Response {
  role: string
  content: string
}

const AskListeningQuestion = () => {
  const [isLoadingMain, setIsLoadingMain] = useState(false);
  const [cachedQuestions, setCachedQuestions] = useState<string[]>([]);
  const [showCachedQuestions, setShowCachedQuestions] = useState(false);
  const [selectedCacheIndex, setSelectedCacheIndex] = useState<number>(0);
  const [countCacheQuestions, setCountCacheQuestions] = useState<number>(0);
  const [selectedModel, setSelectedModel] =
    useState<string>(DEFAULT_CHAT_MODEL);
  const [listeningData, setListeningData] = useState<
     Array<ListeningData>
  >([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Using global state from Zustand store
  const { quizData, setQuizData, setAllQuizData } =
    useQuizListeningStore();

  // Setup react-hook-form
  const { register, handleSubmit, setValue, watch } = useForm<{
    question: string;
  }>({ defaultValues: { question: "" } });
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
  }, []);

  const updateCountCacheQuestions = useCallback(
    (customQuestion?: string) => {
      const selectedData = listeningData?.find((item) => item.query === customQuestion || item.query === questionValue);
      setCountCacheQuestions(
        selectedData?.responses?.length || 0
      );
    },
    [listeningData, questionValue]
  );

  useEffect(() => {
    const selectedData = listeningData?.find((item) => item.query === questionValue);
    if (selectedData?.responses?.[selectedCacheIndex]) {
      const cleanedResult = cleanUpResult(
        selectedData.responses[selectedCacheIndex]
      );
      setQuizData(cleanedResult);

      updateCountCacheQuestions(questionValue);
    }
  }, [
    listeningData,
    questionValue,
    selectedCacheIndex,
    setQuizData,
    updateCountCacheQuestions,
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
    const selectedData = listeningData?.find((item) => item.query === questionValue);
    if (selectedData) {
      const newData: ListeningQuizData[] = [];
      for (const item of selectedData.responses) {
        newData.push(cleanUpResult(item));
      }
      setAllQuizData(newData);
    }
  }, [listeningData, questionValue, setAllQuizData]);

  // Function to select a cached question
  const selectCachedQuestion = (question: string) => {
    setValue("question", question);
    setShowCachedQuestions(false);

    updateCountCacheQuestions(question);
    const selectedData = listeningData?.find((item) => item.query === question);
    if (selectedData?.responses?.[selectedCacheIndex]) {
      const cleanedResult = cleanUpResult(
        selectedData.responses[selectedCacheIndex]
      );
      setQuizData(cleanedResult);
    } else {
      setQuizData(null);
    }
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
        <Button
          onClick={() => setShowCachedQuestions(!showCachedQuestions)}
          variant="default"
          size="small"
        >
          {showCachedQuestions ? "Hide History" : "Show History"}
        </Button>
      </div>

      {/* Cached questions history */}
      {showCachedQuestions && cachedQuestions.length > 0 && (
        <div className="mb-3 border rounded p-2 bg-gray-50">
          <h3 className="text-sm font-medium mb-1">Previous Questions:</h3>
          <div className="max-h-40 overflow-y-auto">
            {cachedQuestions.map((question, index) => {
              const questionText =
                question.length > 50
                  ? question.substring(0, 50) + "..."
                  : question;
              const lengthData = listeningData?.find((item) => item.query === question)?.responses.length || 0;
              return (
                <button
                  key={index}
                  onClick={() => selectCachedQuestion(question)}
                  className="block w-full text-left p-1 text-sm hover:bg-blue-50 rounded truncate"
                  title={question}
                >
                  {index + 1}. {`${questionText} (${lengthData})`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Form with react-hook-form */}
      <form
        onSubmit={handleSubmit((data) => sendMessage(data.question))}
        className="space-y-2"
      >
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Enter a listening topic (e.g., 'Daily Conversations', 'Business English', 'Travel Scenarios')"
            disabled={isLoading}
            {...register("question", { required: "Please enter a topic" })}
          />
          {countCacheQuestions > 0 && (
            <div className="flex flex-col w-full my-2">
              <label className="text-sm">
                Available variations: {countCacheQuestions}
              </label>
              <Select
                value={selectedCacheIndex}
                onChange={(e) => setSelectedCacheIndex(Number(e.target.value))}
                disabled={isLoading || countCacheQuestions === 0}
                title="Select which variation to use"
                options={Array.from(
                  { length: countCacheQuestions },
                  (_, i) => ({
                    value: i,
                    label: `Variation ${i + 1}`,
                  })
                )}
              />
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Generate Listening Quiz"}
          </Button>
          <Button
            type="button"
            onClick={handleGetFromCache}
            disabled={isLoading}
            variant="secondary"
          >
            {isLoading ? "Loading..." : "Get from cache"}
          </Button>
        </div>
      </form>

      {quizData && <QuizListening />}
    </>
  );
};

AskListeningQuestion.displayName = "AskListeningQuestion";

export default AskListeningQuestion;
