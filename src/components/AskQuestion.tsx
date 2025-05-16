"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useForm } from "react-hook-form";

interface Questions {
  questions: {
    question: string;
    options: {
      a: string;
      b: string;
      c: string;
      d: string;
    };
    answer: string;
    reason: string;
  }[];
}

interface AskQuestionProps {
  onSuccess: (data: Questions) => void;
}

export interface AskQuestionMethods {
  sendMessage: (customPrompt?: string) => Promise<void>;
  loadDifferentQuiz: () => Promise<void>;
}

// Define proper types for the data in cleanUpResult
type ContentObject = { content?: string };
type APIResponse = string | ContentObject;

const CACHE_KEY = "english_quiz_cached_questions";
const MAX_CACHED_QUESTIONS = 10; // Maximum number of questions to store

const AskQuestion = forwardRef<AskQuestionMethods, AskQuestionProps>(
  ({ onSuccess }, ref) => {
    const [cacheInput, setCacheInput] = useState("");
    const [cachedQuestions, setCachedQuestions] = useState<string[]>([]);
    const [showCachedQuestions, setShowCachedQuestions] = useState(false);
    // Setup react-hook-form
    const {
      register,
      handleSubmit,
      setValue,
      setError,
      watch,
      formState: { errors },
      reset
    } = useForm<{ question: string }>({ defaultValues: { question: "" } });
    const questionValue = watch("question");
    const [loading, setLoading] = useState(false);
    const [showMessages, setShowMessages] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Load cached questions from localStorage on component mount
    useEffect(() => {
      try {
        const cachedQuestionsJson = localStorage.getItem(CACHE_KEY);
        if (cachedQuestionsJson) {
          const questions: string[] = JSON.parse(cachedQuestionsJson);
          setCachedQuestions(questions);

          // Set the most recently used question as the current cache input
          if (questions.length > 0) {
            setCacheInput(questions[0]);
          }
        }
      } catch (error) {
        console.error("Error loading cached questions:", error);
      }
    }, []);

    // Function to select a cached question
    const selectCachedQuestion = (question: string) => {
      setCacheInput(question);
      setValue("question", question);
      setShowCachedQuestions(false);

      // Move the selected question to the top of the list (most recently used)
      updateCachedQuestions(question);
    };

    // Update the cached questions list with MRU sorting
    const updateCachedQuestions = (newQuestion: string) => {
      // Create a new array without the selected question (if it exists)
      const filteredQuestions = cachedQuestions.filter(
        (q) => q !== newQuestion
      );

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

    const getCategories = async () => {
      try {
        const res = await fetch("/api/categories", {
          method: "GET",
        });
        if (res.status !== 200) {
          throw new Error("Failed to fetch data");
        }
        const data = await res.json();
        const filteredData = data.filter((item: string) => !cachedQuestions.includes(item));
        setCachedQuestions(filteredData);
      } catch (error) {
        console.error("Error getting categories:", error);
        return [];
      }
    };

    useEffect(() => {
      getCategories();
    }, []);

    const getAllFromCache = async () => {
      setErrorMessage("")
      try {
        setLoading(true);
        const res = await fetch("/api/cache-chat", {
          method: "GET",
        });
        if (res.status !== 200) {
          throw new Error("Failed to fetch data");
        }

        alert("All cached data retrieved successfully");
      } catch (error) {
        console.error("Error getting cached data:", error);
        if (error instanceof Error) {
          setErrorMessage(error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    const getFromCache = async (customPrompt?: string) => {
      setErrorMessage("")
      if (!questionValue) {
        setError("question", {
          type: "required",
          message: "Please enter a question",
        });
        return;
      }
      try {
        setLoading(true);
        const messageContent = customPrompt || questionValue;

        const res = await fetch("/api/cache-chat", {
          method: "POST",
          body: JSON.stringify({ messages: messageContent }),
        });
        if (res.status !== 200) {
          throw new Error("Failed to fetch data");
        }

        const data = await res.json();
        const cleanedResult = cleanUpResult(data);
        onSuccess(cleanedResult);

        // Update cached questions list with the new message
        updateCachedQuestions(messageContent);
      } catch (error) {
        console.error("Error getting cached data:", error);
        if (error instanceof Error) {
          setErrorMessage(error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    const cleanUpResult = (data: APIResponse) => {
      try {
        // Handle object with content property
        if (typeof data !== "string") {
          if (!data.content) {
            return data.content;
          }
          if (typeof data.content === "string") {
            if (data.content.includes("```json")) {
              const jsonContent = data.content
                .split("```json")[1]
                .split("```")[0];
              return JSON.parse(jsonContent);
            } else {
              return JSON.parse(data.content);
            }
          }
          return null;
        }

        // Handle string data
        if (!data.includes("```json")) {
          return JSON.parse(data);
        }
        const jsonContent = data.split("```json")[1].split("```")[0];
        return JSON.parse(jsonContent);
      } catch (error) {
        console.error("Invalid JSON format. Please check your input.", error);
        return null;
      }
    };

    const sendMessage = async (customPrompt?: string) => {
      try {
        setLoading(true);
        const messageContent = customPrompt || questionValue;
        if (!customPrompt) reset({ question: "" });

        const res = await fetch("/api/chat", {
          method: "POST",
          body: JSON.stringify({ messages: messageContent }),
        });
        if (res.status !== 200) {
          throw new Error("Failed to fetch data");
        }

        const data = await res.json();
        const cleanedResult = cleanUpResult(data);
        onSuccess(cleanedResult);

        // Update cached questions list with the new message
        updateCachedQuestions(messageContent);
      } catch (error) {
        console.error("Error sending message:", error);
        if (error instanceof Error) {
          setErrorMessage(error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    const loadDifferentQuiz = async () => {
      await sendMessage(cacheInput);
    };

    // Expose the sendMessage method to parent components
    useImperativeHandle(ref, () => ({
      sendMessage,
      loadDifferentQuiz,
    }));

    return (
      <div className="p-4">
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <strong className="font-bold">Error:</strong> {errorMessage}
          </div>
        )}
        {/* Controls */}
        <div className="flex space-x-2 mb-2">
          <button
            onClick={() => setShowMessages(!showMessages)}
            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
          >
            {showMessages ? "Hide Messages" : "Show Messages"}
          </button>

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
        <form onSubmit={handleSubmit(data => sendMessage(data.question))} className="space-y-2">
          <input
            className="border p-2 w-full"
            placeholder="Ask something..."
            disabled={loading}
            {...register("question", { required: "Please enter a question" })}
          />
          {errors.question && <div className="text-red-500 text-sm mb-2">{errors.question?.message}</div>}
          <div className="flex space-x-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send"}
            </button>
            <button
              type="button"
              onClick={() => getFromCache()}
              className="px-4 py-2 bg-blue-500 text-white"
              disabled={loading}
            >
              {loading ? "Sending..." : "Get from cache"}
            </button>
            <button
              type="button"
              onClick={() => getAllFromCache()}
              className="px-4 py-2 bg-blue-500 text-white"
              disabled={loading}
            >
              {loading ? "Sending..." : "Get from all cache"}
            </button>
          </div>
        </form>
      </div>
    );
  }
);

// Add display name for the component
AskQuestion.displayName = "AskQuestion";

export default AskQuestion;
