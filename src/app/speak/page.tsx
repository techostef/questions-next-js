/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import VoiceSelector from "@/components/VoiceSelector";
import Navigation from "@/components/Navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Mic } from "@/assets/mic";
import io from "socket.io-client";
import { Sound } from "@/assets/sound";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function StreamPage() {
  // State variables
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  // Refs for handling recording and connections
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const socketRef = useRef<any>(null);
  const minRecordTimeReachedRef = useRef<boolean>(false);
  const recordingStartTimeRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling

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
          // Send audio data to server
          if (socketRef.current?.connected) {
            socketRef.current.emit("audio-chunk", event.data);
          }
        }
      };

      // Handle recording stop
      recorder.onstop = () => {};

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

  // Reset conversation
  function resetConversation() {
    setMessages([]);
    setTranscript("");
    setAiResponse("");
    setError(null);
    stop(); // Stop any ongoing speech
  }

  // Load saved conversation history from localStorage on initial mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('streamChatHistory');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as Message[];
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          setMessages(parsedHistory);
          setIsHistoryLoaded(true);
        }
      }
    } catch (err) {
      console.error('Error loading chat history from localStorage:', err);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('streamChatHistory', JSON.stringify(messages));
    }
  }, [messages]);

  // Initialize socket connection
  useEffect(() => {
    // Use existing socket or create new one
    // We use a singleton socket to prevent multiple connections
    if (!socketRef.current) {
      const socket = io({
        // Prevent reconnection attempts from creating multiple connections
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        // Do not auto-close the connection if it appears inactive
        timeout: 60000,
      });
      socketRef.current = socket;
    }

    // Store stopRecording in a ref to avoid dependencies issues
    const handleStopRecording = () => {
      if (isRecording && mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();

          if (mediaRecorderRef.current.stream) {
            mediaRecorderRef.current.stream
              .getTracks()
              .forEach((track) => track.stop());
          }
        }
        setIsRecording(false);
        minRecordTimeReachedRef.current = false;
      }
    };

    // Set up all socket event handlers
    const socket = socketRef.current;

    // Basic socket lifecycle events
    socket.on("connect", () => {
      // When we connect to the server, send our saved history if we have it
      if (messages.length > 0) {
        socket.emit('load_conversation', messages);
      }
    });

    socket.on("disconnect", () => {});
    
    // Listen for conversation history from the server
    socket.on("conversation_history", (serverHistory) => {
      if (Array.isArray(serverHistory) && serverHistory.length > 0 && !isHistoryLoaded) {
        // Only set messages if we don't already have a history loaded from localStorage
        setMessages(serverHistory);
        setIsHistoryLoaded(true);
      }
    });

    // Handle transcript from server
    socket.on("transcript", (text) => {
      setTranscript(text);

      // Add to messages
      setMessages((prev) => [...prev, { role: "user", content: text }]);

      // Stop recording if minimum time has passed
      if (minRecordTimeReachedRef.current && isRecording) {
        handleStopRecording();
      }
    });

    // Handle AI response chunks
    socket.on("ai-text-chunk", (chunk) => {
      setAiResponse((prev) => prev + chunk);
    });

    // Handle complete AI response
    socket.on("ai-text-complete", (text) => {
      setAiResponse(text);
      setMessages((prev) => [...prev, { role: "assistant", content: text }]);
      speak(text);
      setIsProcessing(false);
    });

    // Handle errors
    socket.on("error", (errorMsg) => {
      setError(errorMsg);
      setIsProcessing(false);

      if (isRecording) {
        handleStopRecording();
      }
    });

    // Clean up event listeners on re-render, but keep socket alive
    return () => {
      // Remove current listeners to prevent duplicates
      socket.off("transcript");
      socket.off("ai-text-chunk");
      socket.off("ai-text-complete");
      socket.off("error");
      socket.off("conversation_history");

      // Stop recording if active
      if (isRecording && mediaRecorderRef.current) {
        handleStopRecording();
      }

      // Note: We're not disconnecting the socket here to prevent disconnection
      // during page transitions. Socket will be reused on reconnect.
    };
  }, [isRecording, speak, messages, isHistoryLoaded]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Voice Streaming with OpenAI
          </h1>

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
                    className={`p-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-blue-100 ml-12"
                        : "bg-gray-100 mr-12"
                    }`}
                  >
                    <div className="font-semibold mb-1 flex justify-between items-center">
                      <span>
                        {msg.role === "user" ? "You" : "AI Assistant"}
                      </span>
                      {msg.role === "assistant" && (
                        <button
                          onClick={() => speak(msg.content)}
                          className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-gray-200 transition-colors"
                          title="Play audio again"
                          aria-label="Play message audio"
                        >
                          <Sound />
                        </button>
                      )}
                    </div>
                    <div>{msg.content}</div>
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
                  <div className="text-gray-700">{aiResponse}</div>
                </div>
              )}
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`flex items-center justify-center p-4 rounded-full ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white transition-colors`}
            >
              <Mic isListening={isRecording} />
            </button>

            <button
              onClick={resetConversation}
              className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
