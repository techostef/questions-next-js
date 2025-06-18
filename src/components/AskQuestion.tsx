"use client";

import { cleanUpResult } from "@/lib/string";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuizCache } from "@/hooks/useQuizCache";
import ModelSelector from "@/components/ModelSelector";
import { DEFAULT_CHAT_MODEL } from "@/constants/listModelsOpenAI";
import Quiz from "./Quiz";
import { Questions, useQuizStore } from "@/store/quizStore";
import { v4 as uuidv4 } from "uuid";
import Button from "./Button";
import Input from "./Input";
import Select from "./Select";

// Questions interface is now imported from the quizStore

export interface AskQuestionMethods {
  sendMessage: (customPrompt?: string) => Promise<void>;
  loadDifferentQuiz: () => Promise<void>;
}

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

  const updateCountCacheQuestions = useCallback(
    (customQuestion?: string) => {
      setCountCacheQuestions(
        data?.[customQuestion || questionValue]?.length || 0
      );
      setSelectedCacheIndex(0);
    },
    [data, questionValue]
  );

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
      updateCountCacheQuestions(questionValue);
    }
  }, [
    data,
    questionValue,
    selectedCacheIndex,
    setQuizData,
    addQuizToCollection,
    updateCountCacheQuestions,
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

  // Function to select a cached question
  const selectCachedQuestion = useCallback(
    (question: string) => {
      setValue("question", question);
      setShowCachedQuestions(false);

      updateCountCacheQuestions(question);
      if (data[question]?.[selectedCacheIndex]) {
        const cleanedResult = cleanUpResult(data[question][selectedCacheIndex]);
        setQuizData(cleanedResult);
      } else {
        setQuizData(null);
      }
    },
    [data, selectedCacheIndex, setValue, updateCountCacheQuestions, setQuizData]
  );

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
                const questionText = question.length > 50
                ? question.substring(0, 50) + "..."
                : question;
                const lengthData = data?.[question]?.length || 0;
                return (
                  <button
                    key={index}
                    onClick={() => selectCachedQuestion(question)}
                    className="block w-full text-left p-1 text-sm hover:bg-blue-50 rounded truncate"
                    title={question}
                  >
                    {index + 1}.{" "}
                    {`${questionText} (${lengthData})`}
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
              readOnly
              placeholder="Ask something..."
              disabled={isLoading}
              {...register("question", { required: "Please enter a question" })}
            />
            {countCacheQuestions > 0 && (
              <div className="flex flex-col w-full my-2">
                <label className="text-sm">
                  Max index: {countCacheQuestions}
                </label>
                <Select
                  value={selectedCacheIndex}
                  onChange={(e) =>
                    setSelectedCacheIndex(Number(e.target.value))
                  }
                  disabled={isLoading || countCacheQuestions === 0}
                  title="Select which cache entry to use"
                  options={Array.from(
                    { length: countCacheQuestions },
                    (_, i) => ({
                      value: i,
                      label: `${i + 1}`,
                    })
                  )}
                />
              </div>
            )}
          </div>
          {errors.question && (
            <div className="text-red-500 text-sm mb-2">
              {errors.question?.message}
            </div>
          )}
          <div className="flex space-x-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Generate Quiz"}
            </Button>
            <Button
              type="button"
              onClick={() => handleGetAllFromCache()}
              disabled={isLoading}
              variant="secondary"
            >
              {isLoading ? "Sending..." : "Get from all cache"}
            </Button>
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
