"use client";

import { useState, forwardRef, useImperativeHandle, useEffect } from "react";

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

const formatJSON = `
{
  questions: {
    question: string
    options: {
      a: string
      b: string
      c: string
      d: string
    }
    answer: string
    reason: string
  }[]
}
`;

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
    const [messages, setMessages] = useState([
      {
        role: "system",
        content:
          "You are a teacher of English. Any question should be a, b, c, d and at least 10 questions, please include the answer and reason the answer. Response in JSON format like this: " +
          formatJSON,
      },
    ]);
    const [cacheInput, setCacheInput] = useState("");
    const [cachedQuestions, setCachedQuestions] = useState<string[]>([]);
    const [showCachedQuestions, setShowCachedQuestions] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showMessages, setShowMessages] = useState(false);
    
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
        console.error('Error loading cached questions:', error);
      }
    }, []);
    
    // Function to select a cached question
    const selectCachedQuestion = (question: string) => {
      setCacheInput(question);
      setInput(question);
      setShowCachedQuestions(false);
      
      // Move the selected question to the top of the list (most recently used)
      updateCachedQuestions(question);
    };
    
    // Update the cached questions list with MRU sorting
    const updateCachedQuestions = (newQuestion: string) => {
      // Create a new array without the selected question (if it exists)
      const filteredQuestions = cachedQuestions.filter(q => q !== newQuestion);
      
      // Add the question to the beginning (most recently used)
      const updatedQuestions = [newQuestion, ...filteredQuestions].slice(0, MAX_CACHED_QUESTIONS);
      
      // Update state and localStorage
      setCachedQuestions(updatedQuestions);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(updatedQuestions));
      } catch (error) {
        console.error('Error saving cached questions:', error);
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
      setLoading(true);
      const messageContent = customPrompt || input;
      const newMessages = [...messages, { role: "user", content: messageContent }];
      setMessages(newMessages);
      if (!customPrompt) setInput("");

      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      setMessages([...newMessages, data.result]);
      setLoading(false);
      const cleanedResult = cleanUpResult(data.result);
      onSuccess(cleanedResult);
      
      // Update cached questions list with the new message
      updateCachedQuestions(messageContent);
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
                  {index + 1}. {question.length > 50 ? question.substring(0, 50) + '...' : question}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Messages */}
        {showMessages && (
          <div className="space-y-2 mb-4">
            {messages.map((m, i) => (
              <p key={i}>
                <strong>{m.role}:</strong> {m.content}
              </p>
            ))}
          </div>
        )}
        {/* Input */}
        <input
          className="border p-2 w-full"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    );
  }
);

// Add display name for the component
AskQuestion.displayName = 'AskQuestion';

export default AskQuestion;
