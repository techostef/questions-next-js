/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import Navigation from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import VoiceSelector from "@/components/VoiceSelector";
import {
  SpeechRecognition,
  SpeechRecognitionErrorEvent,
  SpeechRecognitionEvent,
  SpeechRecognitionResultItem,
} from "./type";
import { Sound } from "@/assets/sound";
import { sendErrorToServer } from "@/lib/error";
import { Mic } from "@/assets/mic";
import ReactMarkdown from "react-markdown";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import ModelSelector from "@/components/ModelSelector";
import { DEFAULT_CHAT_MODEL } from "@/constants/listModelsOpenAI";
import Button from "@/components/Button";
import Input from "@/components/Input";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  // Load cached messages from localStorage (if any)
  const loadCachedMessages = (): Message[] => {
    if (typeof window === "undefined") return [];

    try {
      const cachedMessages = localStorage.getItem("ai_conversation_history");
      if (cachedMessages) {
        return JSON.parse(cachedMessages);
      }
    } catch (error) {
      console.error("Error loading cached messages:", error);
    }
    return [];
  };

  // We'll use the useSpeechSynthesis hook instead of this function

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_CHAT_MODEL);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use the speech synthesis hook
  const { speak, updateVoiceType } = useSpeechSynthesis();

  // Load cached messages on initial render
  useEffect(() => {
    const cachedMessages = loadCachedMessages();
    if (cachedMessages.length > 0) {
      setMessages(cachedMessages);
    }
  }, []);
  const { user, logout } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize speech recognition when component mounts
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") return;

    // Check for browser support
    try {
      const SpeechRecognition =
        window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error("Speech Recognition API not supported in this browser");
        sendErrorToServer(new Error("Speech Recognition not supported"), {
          componentStack: "Browser doesn't support SpeechRecognition or webkitSpeechRecognition",
          browser: navigator.userAgent,
        });
        return;
      }

      recognitionRef.current = new (SpeechRecognition as any)();
      recognitionRef.current.continuous = false; // Changed to false for better silence detection
      recognitionRef.current.interimResults = true;

      // Add language setting to improve recognition
      recognitionRef.current.lang = "en-US";

      // Track the last speech detection time
      let lastSpeechTime = 0;

      // Set up speech detection and end events
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        lastSpeechTime = Date.now();

        const transcript = Array.from(event.results)
          .map((result: SpeechRecognitionResult) => result[0])
          .map((result: SpeechRecognitionResultItem) => result.transcript)
          .join("");

        setInput(transcript);

        // Start the auto-stop timer after getting results
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        silenceTimerRef.current = setTimeout(() => {
          if (recognitionRef.current && Date.now() - lastSpeechTime >= 2000) {
            recognitionRef.current.stop();
            // Don't set isListening here, we'll update it in onend handler
          }
        }, 2000);
      };

      // This event fires when recognition stops for any reason
      recognitionRef.current.onend = () => {
        setIsListening(false);

        // Clear the silence timer if it exists
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      };

      // Handle errors in speech recognition
      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);

        // Send detailed error info to the server
        sendErrorToServer(
          new Error(`Speech recognition error: ${event.error}`),
          { componentStack: `SpeechRecognition.onerror: ${event.error}` }
        );

        // Clear any timers
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        setIsListening(false);
      };
    } catch (error) {
      console.error("Error initializing speech recognition:", error);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Auto-scroll to bottom of messages and speak new assistant messages
  useEffect(() => {
    scrollToBottom();

    // Cache conversation history in localStorage
    if (typeof window !== "undefined" && messages.length > 0) {
      try {
        localStorage.setItem("ai_conversation_history", JSON.stringify(messages));
      } catch (error) {
        console.error("Error caching conversation history:", error);
      }
    }
  }, [messages]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      console.error("Speech recognition not initialized");
      sendErrorToServer(new Error("Speech recognition not initialized"), {
        componentStack: "toggleListening failed because recognitionRef is null",
      });
      return;
    }

    if (isListening) {
      // Clear any existing silence timer when manually stopping
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
        sendErrorToServer(error as Error, { componentStack: "recognitionRef.current.stop()" });
        // Force update the listening state since the onend might not fire
        setIsListening(false);
      }
      // Don't set isListening here, let the onend handler do it
    } else {
      // Only update state and start recognition when turning on
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        sendErrorToServer(error as Error, { componentStack: "recognitionRef.current.start()" });
        // Reset the state since we failed to start
        setIsListening(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-chat-model": selectedModel,
        },
        body: JSON.stringify({
          messages: input,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response");
      }

      const data = await response.json();
      const aiMessage = { role: "assistant" as const, content: data.content };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4 max-w-3xl">
        <Navigation />
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold ml-1">Conversation with AI</h1>
          <div className="flex items-center">
            <span className="mr-2">Welcome, {user?.username}</span>
            <Button
              onClick={logout}
              variant="danger"
              size="small"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Voice selection controls */}
        <VoiceSelector
          onChange={(newType) => updateVoiceType(newType)}
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-96 overflow-y-auto p-4 bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center mt-32">
                Start a conversation with the AI assistant...
              </p>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    message.role === "user" ? "text-right" : "text-left"
                  }`}
                >
                  <div
                    className={`inline-block max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                        <div
                          onClick={() => speak(message.content)}
                          className="cursor-pointer mt-2 text-gray-500 hover:text-gray-700 inline-flex items-center"
                          title="Listen to this response"
                        >
                          <Sound />
                        </div>
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="text-left mb-4">
                <div className="inline-block max-w-[80%] rounded-lg p-3 bg-gray-200 text-gray-800">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                    <div
                      className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Model Selection */}
          <div className="border-b border-gray-200 p-4 bg-white rounded-t-lg">
            <ModelSelector
              type="chat"
              defaultModel={DEFAULT_CHAT_MODEL}
              onChange={setSelectedModel}
              showFullList={false}
              pageName="chat"
            />
          </div>
          
          {messages.length > 0 && (
            <div className="border-t border-gray-200 p-2 bg-gray-50">
              <Button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("ai_conversation_history");
                    setMessages([]);
                  }
                }}
                className="w-full"
                variant="danger"
              >
                Clear Conversation History
              </Button>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-gray-200"
          >
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-full ${isListening ? "bg-red-500" : "bg-green-500"} text-white mr-2`}
                title={isListening ? "Stop listening" : "Start listening"}
                disabled={!recognitionRef.current}
              >
                <Mic isListening={isListening} />
              </button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                variant="primary"
              >
                Send
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Add TypeScript global declaration for Web Speech API
