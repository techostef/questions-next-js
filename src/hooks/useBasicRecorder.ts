/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface UseBasicRecorderReturn {
  /**
   * Whether recording is currently active
   */
  isRecording: boolean;
  /**
   * URL for the audio blob, for playback
   */
  audioUrl: string;
  /**
   * Start recording from the microphone
   */
  startRecording: () => Promise<void>;
  /**
   * Stop recording and process the audio
   */
  stopRecording: () => void;
  /**
   * Clear the current recording and URL
   */
  clearRecording: () => void;
}

interface UseBasicRecorderParams {
  onBlobReceived?: (blob: Blob) => void;
}

/**
 * A simple hook for basic audio recording functionality
 * @returns Recording control functions and state
 */
export function useBasicRecorder({
  onBlobReceived,
}: UseBasicRecorderParams = {}): UseBasicRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [isClient, setIsClient] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Check if we're running in a browser with MediaRecorder support
  useEffect(() => {
    setIsClient(typeof window !== "undefined" && !!navigator.mediaDevices);
  }, []);

  // Start recording audio
  const startRecording = useCallback(async () => {
    if (!isClient) return;

    // Clear previous recording if it exists
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl("");
    }

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create a new media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop event
      mediaRecorder.onstop = () => {
        // Create a blob from the audio chunks
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        onBlobReceived(audioBlob);
        // Create a URL for the blob
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Stop all tracks in the stream
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
    }
  }, [isClient, audioUrl]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Clear recording
  const clearRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl("");
    }
  }, [audioUrl]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Stop recording if it's still going
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }

      // Clean up audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [isRecording, audioUrl]);

  return {
    isRecording,
    audioUrl,
    startRecording,
    stopRecording,
    clearRecording,
  };
}
