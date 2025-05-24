'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import {
  SpeechRecognition,
  SpeechRecognitionErrorEvent,
  SpeechRecognitionEvent,
  SpeechRecognitionResultItem,
} from "../chat/type";
import { sendErrorToServer } from "@/lib/error";

export default function RecordPage() {

  // We'll use the useSpeechSynthesis hook instead of this function

  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Speech to Text (Web Speech API)</h1>
      
      <button
        onClick={toggleListening}
        className={`px-4 py-2 text-white rounded ${isListening ? 'bg-red-600' : 'bg-green-600'}`}
      >
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>
      
      {isListening && (
        <div className="mt-2">
          <small className="text-green-600">Listening... (will auto-restart if it stops)</small>
        </div>
      )}

      <div className="mt-4 p-4 border rounded bg-gray-100 min-h-[100px]">
        <strong>Transcript:</strong>
        <p>{input || 'Say something...'}</p>
      </div>
    </div>
  );
}
