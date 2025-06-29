/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import VoiceSelector from "@/components/VoiceSelector";
import Navigation from "@/components/Navigation";
import TabNavigation from "@/components/TabNavigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Mic } from "@/assets/mic";
import { Sound } from "@/assets/sound";
import ReactMarkdown from "react-markdown";
import ModelSelector from "@/components/ModelSelector";
import {
  DEFAULT_AUDIO_MODEL,
  DEFAULT_CHAT_MODEL,
} from "@/constants/listModelsOpenAI";
import { TABS } from "./constants";

interface Message {
  role: "user" | "assistant";
  content: string;
  ssml?: string; // Optional SSML version for better speech synthesis
}

export default function StreamPage() {
  // State variables
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatModel, setChatModel] = useState<string>(DEFAULT_CHAT_MODEL);
  const [audioModel, setAudioModel] = useState<string>(DEFAULT_AUDIO_MODEL);

  // Refs for handling recording and connections
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const minRecordTimeReachedRef = useRef<boolean>(false);
  const recordingStartTimeRef = useRef<number>(0);
  const sessionIdRef = useRef<string>(""); // For tracking API session

  // Speech synthesis hook for voice output
  const { speak, stop } = useSpeechSynthesis();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Function to stop recording
  function stopRecording() {
    if (!isRecording) return;

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      try {
        // Stop media recorder
        mediaRecorderRef.current.stop();

        // Stop all tracks in the stream
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream
            .getTracks()
            .forEach((track) => track.stop());
        }
      } catch (err) {
        console.error("Error stopping recording:", err);
      }
    }

    setIsRecording(false);
    minRecordTimeReachedRef.current = false;
  }

  // Start audio recording
  async function startRecording() {
    try {
      // Reset state
      setError(null);
      setAiResponse("");
      minRecordTimeReachedRef.current = false;
      recordingStartTimeRef.current = Date.now();

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Configure media recorder with optimal settings
      let options = {};
      try {
        options = {
          mimeType: "audio/webm;codecs=opus",
          audioBitsPerSecond: 128000,
        };
      } catch {}

      // Create new MediaRecorder
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      // Set minimum recording duration
      setTimeout(() => {
        minRecordTimeReachedRef.current = true;
      }, 3000);

      // Handle audio data
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          // Store audio chunks for later processing
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      recorder.onstop = async () => {
        // Process the recorded audio after stopping
        if (audioChunksRef.current.length > 0) {
          setIsProcessing(true);

          try {
            // Create an audio blob from all chunks
            const audioBlob = new Blob(audioChunksRef.current, {
              type: "audio/webm",
            });

            // Create form data for API request
            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.webm");

            // Add session ID to headers if available
            const headers: HeadersInit = {};
            if (sessionIdRef.current) {
              headers["x-session-id"] = sessionIdRef.current;
            }

            // Send to our API endpoint with model selections
            const response = await fetch("/api/audio/transcript", {
              method: "POST",
              body: formData,
              headers: {
                ...headers,
                "x-audio-model": audioModel,
                "x-chat-model": chatModel,
              },
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Failed to process audio");
            }

            const data = await response.json();

            // Set transcript and AI response
            setTranscript(data.transcript);
            setAiResponse(data.aiResponse);

            // Add messages to conversation
            setMessages((prev) => [
              ...prev,
              { role: "user", content: data.transcript },
              { 
                role: "assistant", 
                content: data.aiResponse,
                ssml: data.ssmlResponse // Store SSML version for speech
              },
            ]);

            // Save conversation history from server if provided
            if (
              data.conversationHistory &&
              Array.isArray(data.conversationHistory)
            ) {
              localStorage.setItem(
                "streamChatHistory",
                JSON.stringify(data.conversationHistory)
              );
            }

            // Speak the AI response using SSML if available
            if (data.ssmlResponse) {
              speak(data.ssmlResponse, true); // true indicates SSML content
            } else {
              speak(data.aiResponse);
            }
          } catch (err: any) {
            setError(`Error: ${err.message || "Something went wrong"}`);
            console.error("Audio processing error:", err);
          } finally {
            setIsProcessing(false);
            audioChunksRef.current = []; // Clear chunks for next recording
          }
        }
      };

      // Start recording
      recorder.start(1000); // Capture in 1-second chunks
      setIsRecording(true);

      // Set maximum recording time (60 seconds)
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
          setIsProcessing(true);
        }
      }, 60000);
    } catch (err: any) {
      setError(`Microphone error: ${err.message || "Unknown error"}`);
    }
  }

  // Toggle recording state
  function toggleRecording() {
    if (isRecording) {
      stopRecording();
      setIsProcessing(true);
    } else {
      startRecording();
    }
  }

  // Reset current conversation (just the UI state)
  function resetConversation() {
    setTranscript("");
    setAiResponse("");
    setMessages([]);
    setError(null);
    stop(); // Stop any ongoing speech
  }

  // Clear conversation history (both local and server storage)
  async function clearHistory() {
    setIsProcessing(true);
    stop(); // Stop any ongoing speech if playing

    try {
      // Clear local storage
      localStorage.removeItem("streamChatHistory");

      // Reset messages in UI
      setMessages([]);
      setTranscript("");
      setAiResponse("");
      setError(null);

      // Clear server-side conversation history
      const headers: HeadersInit = {};
      if (sessionIdRef.current) {
        headers["x-session-id"] = sessionIdRef.current;
      }

      // Call the DELETE endpoint to clear server-side history
      const response = await fetch("/api/audio/transcript", {
        method: "DELETE",
        headers: {
          ...headers,
          "x-audio-model": audioModel,
          "x-chat-model": chatModel,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to clear conversation history"
        );
      }

      // Show temporary success message
      setError("Conversation history cleared successfully");
      setTimeout(() => setError(null), 3000);
    } catch (err: any) {
      setError(
        `Error clearing history: ${err.message || "Something went wrong"}`
      );
      console.error("History clearing error:", err);
    } finally {
      setIsProcessing(false);
    }
  }

  // Load saved conversation history from localStorage on initial mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("streamChatHistory");
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as Message[];
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          setMessages(parsedHistory);
        }
      }
    } catch (err) {
      console.error("Error loading chat history from localStorage:", err);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("streamChatHistory", JSON.stringify(messages));
    }
  }, [messages]);

  // Load conversation history on initial render
  useEffect(() => {
    // Generate a persistent session ID if we don't have one
    if (!sessionIdRef.current) {
      const storedSessionId = localStorage.getItem("speakSessionId");
      if (storedSessionId) {
        sessionIdRef.current = storedSessionId;
      } else {
        // Generate a random session ID
        sessionIdRef.current = Math.random().toString(36).substring(2);
        localStorage.setItem("speakSessionId", sessionIdRef.current);
      }
    }

    const loadConversationHistory = async () => {
      // First try to load from localStorage
      try {
        const savedHistory = localStorage.getItem("streamChatHistory");
        if (savedHistory) {
          const history = JSON.parse(savedHistory);
          if (Array.isArray(history) && history.length > 0) {
            setMessages(history);
            return; // Don't fetch from API if we have local history
          }
        }
      } catch (err) {
        console.error("Error loading from localStorage:", err);
      }

      // If no local history, try to get from API
      try {
        const response = await fetch("/api/audio/transcript", {
          headers: {
            ...(sessionIdRef.current
              ? { "x-session-id": sessionIdRef.current }
              : {}),
            "x-audio-model": audioModel,
            "x-chat-model": chatModel,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (
            data.conversationHistory &&
            Array.isArray(data.conversationHistory)
          ) {
            setMessages(data.conversationHistory);

            // Also save to localStorage
            localStorage.setItem(
              "streamChatHistory",
              JSON.stringify(data.conversationHistory)
            );
          }
        }
      } catch (err) {
        console.error("Error fetching conversation history:", err);
      }
    };

    loadConversationHistory();
  }, [audioModel, chatModel]);

  return (
    <ProtectedRoute>
      <div className="container min-h-screen p-4 max-w-3xl mx-auto">
        <Navigation />
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Voice Streaming with OpenAI
          </h1>

          {/* Tab Navigation */}
          <TabNavigation tabs={TABS} />

          {/* AI Model selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <ModelSelector
              type="chat"
              defaultModel={DEFAULT_CHAT_MODEL}
              onChange={setChatModel}
              className="bg-white rounded-lg shadow-sm p-4"
              pageName="speak"
            />
            <ModelSelector
              type="audio"
              defaultModel={DEFAULT_AUDIO_MODEL}
              onChange={setAudioModel}
              className="bg-white rounded-lg shadow-sm p-4"
              pageName="speak"
            />
          </div>

          {/* VoiceSelector component for voice selection */}
          <VoiceSelector />

          {/* Messages display */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4 min-h-[300px] max-h-[500px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <p>
                  Start recording to have a conversation with AI using audio
                  streaming
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg shadow-sm ${
                      msg.role === "user"
                        ? "bg-blue-100 ml-12 border-l-4 border-blue-300"
                        : "bg-gray-100 mr-12 border-l-4 border-green-400"
                    }`}
                  >
                    <div className="font-semibold mb-1 flex justify-between items-center">
                      <span>
                        {msg.role === "user" ? "You" : "AI Assistant"}
                      </span>
                      {msg.role === "assistant" && (
                        <div
                          onClick={() => msg.ssml ? speak(msg.ssml, true) : speak(msg.content)}
                          className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-gray-200 transition-colors"
                          title="Play audio again"
                          aria-label="Play message audio"
                        >
                          <Sound />
                        </div>
                      )}
                    </div>
                    <div>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-md max-w-none dark:prose-invert leading-relaxed">
                          {/* English teacher context - add visual cues */}
                          {msg.content.includes("correct") || msg.content.includes("grammar") || msg.content.includes("mistake") ? (
                            <div className="mb-2 text-sm text-green-600 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>English correction provided</span>
                            </div>
                          ) : null}
                          
                          <ReactMarkdown
                            components={{
                              p: ({children}) => (
                                <p className="mb-4 text-base leading-7">{children}</p>
                              ),
                              ul: ({children}) => (
                                <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>
                              ),
                              li: ({children}) => (
                                <li className="mb-2">{children}</li>
                              ),
                              strong: ({children}) => (
                                <strong className="font-semibold text-blue-700">{children}</strong>
                              ),
                              h1: ({children}) => (
                                <h1 className="text-xl font-bold mb-3 mt-2 text-gray-800">{children}</h1>
                              ),
                              h2: ({children}) => (
                                <h2 className="text-lg font-bold mb-3 mt-2 text-gray-800">{children}</h2>
                              ),
                              blockquote: ({children}) => (
                                <blockquote className="border-l-4 border-blue-300 pl-4 italic my-4 text-gray-600">{children}</blockquote>
                              ),
                              code: ({children}) => (
                                <code className="bg-gray-100 px-1 py-0.5 rounded text-red-500">{children}</code>
                              )
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="text-base">{msg.content}</div>
                      )}
                    </div>
                  </div>
                ))}
                {/* This empty div is used as a reference point to scroll to */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Transcript display */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-4 min-h-[100px]">
            <div className="font-semibold mb-2">Your Voice Input:</div>
            <div className="min-h-[50px]">
              {transcript ||
                (isRecording
                  ? "Listening..."
                  : "Press the microphone button to speak")}
            </div>
            {aiResponse &&
              !messages.some(
                (m) => m.role === "assistant" && m.content === aiResponse
              ) && (
                <div className="mt-4">
                  <div className="font-semibold mb-2">AI is responding:</div>
                  <div className="text-gray-700">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{aiResponse}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Loading indicator */}
          {isProcessing && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-lg font-medium">Processing your audio...</p>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center items-center gap-4 flex-wrap">
            <button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`flex items-center justify-center p-4 rounded-full ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white transition-colors relative z-10 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isRecording ? "Stop recording" : "Start recording"}
            >
              <Mic isListening={isRecording} />
            </button>

            {/* Full-screen recording overlay - only visible when recording */}
            {isRecording && (
              <div
                onClick={toggleRecording}
                className="fixed inset-0 z-50 bg-red-500 opacity-100 flex flex-col items-center justify-center md:hidden"
              >
                <div className="text-white text-xl mb-8 flex items-center">
                  <div className="animate-pulse mr-3">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                  <span className="font-bold">Recording in progress...</span>
                </div>
                <button className="bg-white text-red-600 px-8 py-4 rounded-full font-bold text-lg shadow-lg transform transition hover:scale-105 active:scale-95">
                  STOP RECORDING
                </button>
                <p className="text-white mt-4 opacity-80">
                  Tap the button to stop recording
                </p>
              </div>
            )}

            <button
              onClick={resetConversation}
              disabled={isProcessing}
              className={`px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Reset current conversation"
            >
              Reset
            </button>

            <button
              onClick={clearHistory}
              disabled={isProcessing || messages.length === 0}
              className={`px-6 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors flex items-center gap-2 ${isProcessing || messages.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Clear all conversation history from both local storage and server"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                <path
                  fillRule="evenodd"
                  d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                />
              </svg>
              Clear History
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
