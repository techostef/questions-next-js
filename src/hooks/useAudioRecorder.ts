/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioRecorderOptions {
  /**
   * Maximum recording duration in milliseconds
   */
  maxDuration?: number;
  /**
   * Minimum recording duration in milliseconds before considering the recording valid
   */
  minDuration?: number;
  /**
   * Chunk size in milliseconds for data collection
   */
  chunkSize?: number;
  /**
   * MIME type for the recording
   */
  mimeType?: string;
  /**
   * Audio bit rate in bits per second
   */
  audioBitsPerSecond?: number;
  /**
   * Whether to enable echo cancellation
   */
  echoCancellation?: boolean;
  /**
   * Whether to enable noise suppression
   */
  noiseSuppression?: boolean;
  /**
   * Whether to enable auto gain control
   */
  autoGainControl?: boolean;
}

interface UseAudioRecorderReturn {
  /**
   * Whether recording is currently active
   */
  isRecording: boolean;
  /**
   * Whether recorded audio is being processed
   */
  isProcessing: boolean;
  /**
   * Any error that occurred during recording
   */
  error: string | null;
  /**
   * Start recording from the microphone
   */
  startRecording: () => Promise<void>;
  /**
   * Stop recording and process the audio
   */
  stopRecording: () => void;
  /**
   * Cancel recording without processing the audio
   */
  cancelRecording: () => void;
  /**
   * The audio blob created from the recording
   */
  audioBlob: Blob | null;
  /**
   * Clear the current recorded audio and reset state
   */
  clearRecording: () => void;
  /**
   * Get the raw audio chunks if needed
   */
  getAudioChunks: () => Blob[];
}

/**
 * Custom hook for recording audio using MediaRecorder API
 * @param options Configuration options for audio recording
 * @returns Audio recording functions and state
 */
export function useAudioRecorder(
  options: AudioRecorderOptions = {}
): UseAudioRecorderReturn {
  const {
    maxDuration = 60000, // Default 60 seconds
    minDuration = 3000,  // Default 3 seconds
    chunkSize = 1000,    // Default 1 second chunks
    mimeType = "audio/webm;codecs=opus",
    audioBitsPerSecond = 128000,
    echoCancellation = true,
    noiseSuppression = true,
    autoGainControl = true,
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const minRecordTimeReachedRef = useRef<boolean>(false);
  const maxRecordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all state and refs
  const cleanupResources = useCallback(() => {
    // Stop all tracks in the stream to release microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear the maximum recording timer
    if (maxRecordingTimerRef.current) {
      clearTimeout(maxRecordingTimerRef.current);
      maxRecordingTimerRef.current = null;
    }
    
    // Reset media recorder
    mediaRecorderRef.current = null;
  }, []);

  // Clear recording without processing
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Error stopping media recorder:', err);
      }
    }
    
    // Clear audio chunks and reset state
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsProcessing(false);
    cleanupResources();
  }, [isRecording, cleanupResources]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRecording();
    };
  }, [cancelRecording]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      // Reset state
      setError(null);
      setAudioBlob(null);
      audioChunksRef.current = [];
      minRecordTimeReachedRef.current = false;
      recordingStartTimeRef.current = Date.now();

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation,
          noiseSuppression,
          autoGainControl,
        },
      });
      
      streamRef.current = stream;

      // Configure media recorder with optimal settings
      let recorderOptions = {};
      try {
        recorderOptions = {
          mimeType,
          audioBitsPerSecond,
        };
      } catch {
        // Fallback to default options if specified mimeType is not supported
        console.warn('Specified mimeType not supported, using default');
      }

      // Create new MediaRecorder
      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;

      // Set minimum recording duration
      setTimeout(() => {
        minRecordTimeReachedRef.current = true;
      }, minDuration);

      // Handle audio data
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          // Store audio chunks for later processing
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      recorder.onstop = async () => {
        // Only process if we have audio chunks and we're not cancelling
        if (audioChunksRef.current.length > 0 && isRecording) {
          setIsProcessing(true);

          try {
            // Create an audio blob from all chunks
            const blob = new Blob(audioChunksRef.current, {
              type: mimeType.split(';')[0] || 'audio/webm',
            });
            
            // Set the audio blob for external use
            setAudioBlob(blob);
          } catch (err: any) {
            setError(`Error processing audio: ${err.message || "Unknown error"}`);
            console.error("Audio processing error:", err);
          } finally {
            setIsProcessing(false);
            setIsRecording(false);
          }
        } else {
          setIsRecording(false);
        }
        
        // Always clean up resources
        cleanupResources();
      };

      // Start recording
      recorder.start(chunkSize);
      setIsRecording(true);

      // Set maximum recording time
      maxRecordingTimerRef.current = setTimeout(() => {
        if (isRecording && mediaRecorderRef.current) {
          try {
            mediaRecorderRef.current.stop();
          } catch (err) {
            console.error('Error stopping recorder on max duration:', err);
            setIsRecording(false);
            cleanupResources();
          }
        }
      }, maxDuration);
      
    } catch (err: any) {
      setError(`Microphone error: ${err.message || "Unknown error"}`);
      setIsRecording(false);
      cleanupResources();
    }
  }, [
    mimeType, 
    audioBitsPerSecond, 
    echoCancellation, 
    noiseSuppression, 
    autoGainControl,
    minDuration, 
    maxDuration, 
    chunkSize, 
    isRecording, 
    cleanupResources
  ]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording) {
      return;
    }

    // Only stop if minimum recording time is reached
    if (minRecordTimeReachedRef.current) {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Error stopping media recorder:', err);
        setIsRecording(false);
        cleanupResources();
      }
    } else {
      const timeElapsed = Date.now() - recordingStartTimeRef.current;
      const timeRemaining = minDuration - timeElapsed;
      
      setError(`Recording too short. Please speak for at least ${Math.ceil(minDuration / 1000)} seconds.`);
      
      // Wait until minimum duration is reached before stopping
      setTimeout(() => {
        if (mediaRecorderRef.current) {
          try {
            mediaRecorderRef.current.stop();
          } catch (err) {
            console.error('Error stopping recorder after min duration:', err);
            setIsRecording(false);
            cleanupResources();
          }
        }
      }, Math.max(0, timeRemaining));
    }
  }, [isRecording, minDuration, cleanupResources]);

  // Clear recorded audio
  const clearRecording = useCallback(() => {
    audioChunksRef.current = [];
    setAudioBlob(null);
    setError(null);
  }, []);

  // Get the raw audio chunks
  const getAudioChunks = useCallback(() => {
    return [...audioChunksRef.current];
  }, []);

  return {
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    audioBlob,
    clearRecording,
    getAudioChunks
  };
}
