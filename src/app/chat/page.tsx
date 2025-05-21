/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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

  // Load cached voice type from localStorage (if any)
  const loadCachedVoiceType = (): "male" | "female" | "default" => {
    if (typeof window === "undefined") return "default";

    try {
      const cachedVoiceType = localStorage.getItem("ai_voice_preference");
      if (
        cachedVoiceType &&
        ["male", "female", "default"].includes(cachedVoiceType)
      ) {
        return cachedVoiceType as "male" | "female" | "default";
      }
    } catch (error) {
      console.error("Error loading cached voice type:", error);
    }
    return "default";
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceType, setVoiceType] = useState<"male" | "female" | "default">(
    loadCachedVoiceType()
  );
  const [availableVoices, setAvailableVoices] = useState<
    SpeechSynthesisVoice[]
  >([]);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load cached messages on initial render
  useEffect(() => {
    const cachedMessages = loadCachedMessages();
    if (cachedMessages.length > 0) {
      setMessages(cachedMessages);
    }
  }, []);
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // If not authenticated, redirect to login page
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Define speakText using useCallback to avoid recreation on each render
  const speakText = useCallback(
    (text: string) => {
      if (typeof window === "undefined") return;

      // Check if speech synthesis is supported
      if (!("speechSynthesis" in window)) {
        console.log("Speech synthesis not supported in this browser");
        return; // Exit early if not supported
      }

      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Create a new utterance
        const utterance = new SpeechSynthesisUtterance(text);

        // Select voice based on gender preference
        if (voiceType !== "default" && availableVoices.length > 0) {
          // Try to find English voices first
          let filteredVoices = availableVoices.filter(
            (voice) =>
              voice.lang.includes("en") &&
              ((voiceType === "female" &&
                (voice.name.includes("Female") ||
                  voice.name.includes("female") ||
                  (!voice.name.includes("Male") &&
                    !voice.name.includes("David") &&
                    !voice.name.includes("Hazel") &&
                    !voice.name.includes("George") &&
                    !voice.name.includes("Mark") &&
                    !voice.name.includes("male")))) ||
                (voiceType === "male" &&
                  (voice.name.includes("Male") || voice.name.includes("male"))))
          );

          // If no English voices found, try any voice matching the gender
          if (filteredVoices.length === 0) {
            filteredVoices = availableVoices.filter(
              (voice) =>
                (voiceType === "female" &&
                  (voice.name.includes("Female") ||
                    voice.name.includes("female") ||
                    (!voice.name.includes("Male") &&
                      !voice.name.includes("male")))) ||
                (voiceType === "male" &&
                  (voice.name.includes("Male") || voice.name.includes("male")))
            );
          }

          // Set the voice if we found a matching one
          if (filteredVoices.length > 0) {
            if (voiceType === "female") {
              utterance.voice = filteredVoices[2] ?? filteredVoices[0];
            } else {
              utterance.voice = filteredVoices[0];
            }
          }
          console.log("filteredVoices", filteredVoices);
        }

        // Optional: configure voice properties
        utterance.rate = 1.0; // Speed of speech (0.1 to 10)
        utterance.pitch =
          voiceType === "female" ? 0.8 : voiceType === "male" ? 0.8 : 1.0; // Adjust pitch based on gender
        utterance.volume = 1.0; // Volume (0 to 1)

        // Start speaking
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        sendErrorToServer(error, { componentStack: "speechSynthesis.speak" });
        console.error("Speech synthesis error:", error);
      }
    },
    [voiceType, availableVoices]
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize speech recognition when component mounts
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") return;

    // Check for browser support
    try {
      // Check if we're in Firefox (which doesn't support SpeechRecognition well)
      const isFirefox = navigator.userAgent.indexOf("Firefox") !== -1;
      
      // Firefox detection - show notice in console but don't try to initialize
      if (isFirefox) {
        console.log("Firefox detected. Speech recognition may not work properly.");
        // We'll still attempt to initialize but warn the user
      }
      
      const SpeechRecognition =
        window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error("Speech Recognition API not supported in this browser");
        sendErrorToServer(new Error("Speech Recognition not supported"), { 
          componentStack: "Browser doesn't support SpeechRecognition or webkitSpeechRecognition",
          browser: navigator.userAgent
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
            console.log("Auto-stopping after 2 seconds of silence");
            recognitionRef.current.stop();
            // Don't set isListening here, we'll update it in onend handler
          }
        }, 2000);
      };

      // This event fires when recognition stops for any reason
      recognitionRef.current.onend = () => {
        console.log("Speech recognition ended");
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

  // Load available voices when component mounts
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if speech synthesis is supported
    if (!("speechSynthesis" in window)) {
      console.log("Speech synthesis not supported in this browser");
      return; // Exit early if not supported
    }

    try {
      // Function to load voices
      const loadVoices = () => {
        try {
          const voices = window.speechSynthesis.getVoices();
          setAvailableVoices(voices || []);
        } catch (error) {
          sendErrorToServer(error, { componentStack: "speechSynthesis.getVoices" });
        }
      };

      // Load voices initially
      loadVoices();

      // Some browsers (like Chrome) load voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    } catch (error) {
      console.error("Speech synthesis error:", error);
    }

    return () => {
      // Cleanup: cancel any ongoing speech when component unmounts
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (error) {
          console.error("Error canceling speech synthesis:", error);
        }
      }
    };
  }, []);

  // Auto-scroll to bottom of messages and speak new assistant messages
  useEffect(() => {
    scrollToBottom();

    // Cache conversation history in localStorage
    if (typeof window !== "undefined" && messages.length > 0) {
      try {
        localStorage.setItem(
          "ai_conversation_history",
          JSON.stringify(messages)
        );
      } catch (error) {
        console.error("Error caching conversation history:", error);
      }
    }
  }, [messages]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      console.error("Speech recognition not initialized");
      sendErrorToServer(new Error("Speech recognition not initialized"), {
        componentStack: "toggleListening failed because recognitionRef is null"
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
        },
        body: JSON.stringify({
          messages: input,
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

  // Show nothing while checking authentication
  if (!isAuthenticated) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4 max-w-3xl">
        <Navigation />
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold ml-1">Conversation with AI</h1>
          <div className="flex items-center">
            <span className="mr-2">Welcome, {user?.username}</span>
            <button
              onClick={logout}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Voice selection controls */}
        <VoiceSelector 
          onChange={(type) => setVoiceType(type)}
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
                    {message.content}
                    {message.role === "assistant" && (
                      <>
                        <br />
                        <button
                          onClick={() => speakText(message.content)}
                          className="mt-2 text-gray-500 hover:text-gray-700 inline-flex items-center"
                          title="Listen to this response"
                        >
                          <Sound />
                        </button>
                      </>
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

          {messages.length > 0 && (
            <div className="border-t border-gray-200 p-2 bg-gray-50">
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("ai_conversation_history");
                    setMessages([]);
                  }
                }}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Clear Conversation History
              </button>
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
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your message..."
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Add TypeScript global declaration for Web Speech API
