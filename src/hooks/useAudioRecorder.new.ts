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
   * URL for the audio blob, for playback
   */
  audioUrl: string | null;
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
  // Add debugging to track component lifecycle
  console.log('useAudioRecorder hook initialized or re-rendered');
  const {
    maxDuration = 60000, // Default 60 seconds
    minDuration = 1000,  // Default 1 second minimum
    chunkSize = 1000,    // Default 1 second chunks
    mimeType: preferredMimeType = "audio/webm;codecs=opus",
    audioBitsPerSecond = 128000,
    echoCancellation = true,
    noiseSuppression = true,
    autoGainControl = true,
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const minRecordTimeReachedRef = useRef<boolean>(false);
  const maxRecordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const minRecordTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle data available event from media recorder
  const handleDataAvailable = useCallback((event: BlobEvent) => {
    if (event.data && event.data.size > 0) {
      console.log(`Audio data available: ${event.data.size} bytes`);
      if (!audioChunksRef.current) {
        audioChunksRef.current = [];
      }
      audioChunksRef.current.push(event.data);
    } else {
      console.log(`Empty audio data received: ${event.data?.size || 0} bytes`);
    }
  }, []);

  // Clear all state and refs
  const cleanupResources = useCallback(() => {
    // Clear the maximum recording timer
    if (maxRecordingTimerRef.current) {
      clearTimeout(maxRecordingTimerRef.current);
      maxRecordingTimerRef.current = null;
    }
    
    // Clear the minimum recording timer
    if (minRecordTimeoutRef.current) {
      clearTimeout(minRecordTimeoutRef.current);
      minRecordTimeoutRef.current = null;
    }
    
    // Stop all tracks in the stream to release microphone
    // Only do this after we've processed the recording data
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log(`Stopping track: ${track.label} (${track.kind})`);
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Reset media recorder
    mediaRecorderRef.current = null;
  }, []);

  // Clear recording without processing
  const cancelRecording = useCallback(() => {
    console.log('Canceling recording');
    
    // Clear audio chunks and reset state first
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsProcessing(false);
    
    // Then stop the media recorder if it's active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        console.log('Stopping media recorder during cancellation');
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Error stopping media recorder:', err);
      }
    }
    
    // Clean up resources last
    cleanupResources();
  }, [cleanupResources]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only cancel if we're still recording
      if (isRecording) {
        cancelRecording();
      } else {
        // Just clean up resources without canceling the recording
        cleanupResources();
      }
      
      // Clean up audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [cancelRecording, isRecording, audioUrl, cleanupResources]);


  // Process recorded audio into a single blob
  const handleRecordingStop = useCallback(() => {
    console.log(`MediaRecorder stopped, processing chunks: ${audioChunksRef.current?.length || 0}`);
    
    // Clear the minimum recording time timeout
    if (minRecordTimeoutRef.current) {
      clearTimeout(minRecordTimeoutRef.current);
      minRecordTimeoutRef.current = null;
    }
    
    // Set recording state to false
    setIsRecording(false);
    
    // Check if we have any audio chunks
    if (!audioChunksRef.current || audioChunksRef.current.length === 0) {
      console.log('No audio chunks recorded');
      setError('No audio was recorded. Please try again and ensure your microphone is working.');
      setIsProcessing(false);
      
      // Clean up resources now that we're done processing
      cleanupResources();
      return;
    }
    
    try {
      // Log the chunks we have
      console.log(`Processing ${audioChunksRef.current.length} audio chunks:`, 
        audioChunksRef.current.map(chunk => chunk.size));
      
      // Create a single blob from all the chunks
      // Use the same MIME type that was detected during recording
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      
      console.log(`Created audio blob: ${blob.size} bytes, type: ${blob.type}`);
      
      if (blob.size < 100) {
        // If the blob is too small, it probably didn't record properly
        console.warn('Audio blob is too small, likely no actual audio recorded');
        setError('Recording too short or no audio captured. Please try again and speak clearly.');
        setIsProcessing(false);
        
        // Clean up resources now that we're done processing
        cleanupResources();
        return;
      }
      
      // Set the blob in state
      setAudioBlob(blob);
      
      // Create audio URL for playback
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      
    } catch (err) {
      console.error('Error processing audio chunks:', err);
      setError(`Failed to process recording: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      // Set processing to false
      setIsProcessing(false);
      
      // Clean up resources now that we're done processing
      cleanupResources();
    }
  }, [cleanupResources]);

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log('Stopping recording, recorder state:', mediaRecorderRef.current?.state, 'isRecording:', isRecording);
    
    if (!mediaRecorderRef.current || !isRecording) {
      console.log('No active recorder or not recording, cannot stop');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Only stop if minimum recording time is reached or force stop
      if (minRecordTimeReachedRef.current) {
        // Make sure the recorder is in the recording state before stopping
        if (mediaRecorderRef.current.state === 'recording') {
          console.log('Stopping media recorder');
          mediaRecorderRef.current.stop();
          // Don't cleanup resources here - handleRecordingStop will do it
        } else {
          console.log('MediaRecorder not in recording state, cannot stop');
          setIsRecording(false);
          setIsProcessing(false);
          cleanupResources();
        }
      } else {
        // Recording is too short, wait until minimum duration is reached
        const timeElapsed = Date.now() - recordingStartTimeRef.current;
        const timeRemaining = minDuration - timeElapsed;
        
        console.log(`Recording too short (${timeElapsed}ms), waiting ${timeRemaining}ms more`);
        setError(`Recording too short. Please record for at least ${Math.ceil(minDuration / 1000)} seconds.`);
        
        // Wait until minimum duration is reached before stopping
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            console.log('Stopping recorder after minimum duration');
            try {
              mediaRecorderRef.current.stop();
              // Don't cleanup resources here - handleRecordingStop will do it
            } catch (err) {
              console.error('Error stopping recorder after min duration:', err);
              setIsRecording(false);
              setIsProcessing(false);
              cleanupResources();
            }
          } else {
            console.log('Recorder no longer active after waiting for minimum duration');
            setIsRecording(false);
            setIsProcessing(false);
            cleanupResources();
          }
        }, Math.max(0, timeRemaining));
      }
    } catch (err) {
      console.error('Error stopping media recorder:', err);
      setIsRecording(false);
      setIsProcessing(false);
      cleanupResources();
    }
  }, [isRecording, minDuration, cleanupResources]);

  // Start recording
  const startRecording = useCallback(async () => {
    // Skip if already recording
    if (isRecording || mediaRecorderRef.current) {
      console.log('Already recording, cannot start again');
      return;
    }

    try {
      // Reset previous recordings and errors
      setError(null);
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      audioChunksRef.current = [];
      setIsProcessing(true);
      
      console.log('Starting recording...');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation,
          noiseSuppression,
          autoGainControl
        }
      });
      
      // Ensure we have audio tracks
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks available in the media stream');
      }
      
      console.log(`Got ${audioTracks.length} audio tracks:`, 
        audioTracks.map(track => `${track.label} (enabled: ${track.enabled})`));
      
      // Keep track of stream to stop it later
      streamRef.current = stream;
      
      // Determine supported MIME type
      let supportedMimeType = 'audio/webm';
      
      // Check if preferred MIME type is supported
      if (MediaRecorder.isTypeSupported(preferredMimeType)) {
        supportedMimeType = preferredMimeType;
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        supportedMimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        supportedMimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        supportedMimeType = 'audio/ogg;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        supportedMimeType = 'audio/mp4';
      }
      
      console.log(`Using MIME type: ${supportedMimeType}`);
      
      // Create media recorder
      const recorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
        audioBitsPerSecond
      });
      
      // Store recorder instance
      mediaRecorderRef.current = recorder;
      
      // Set up event handlers
      recorder.ondataavailable = handleDataAvailable;
      recorder.onstop = handleRecordingStop;
      recorder.onerror = (event: Event) => {
        console.error('MediaRecorder error:', event);
        setError('Error recording audio');
        setIsRecording(false);
        setIsProcessing(false);
        // Only clean up resources after error handling is complete
        setTimeout(() => cleanupResources(), 100);
      };
      
      // Record start time
      recordingStartTimeRef.current = Date.now();
      minRecordTimeReachedRef.current = false;
      
      // Set minimum recording time timeout
      minRecordTimeoutRef.current = setTimeout(() => {
        console.log('Minimum recording time reached');
        minRecordTimeReachedRef.current = true;
      }, minDuration);
      
      // Set maximum recording time timer
      maxRecordingTimerRef.current = setTimeout(() => {
        console.log('Maximum recording time reached, stopping');
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, maxDuration);
      
      // Start recording
      setIsRecording(true);
      
      // Start the recorder with timeslice to get data periodically
      recorder.start(chunkSize);
      console.log(`MediaRecorder started with chunk size: ${chunkSize}ms`);
      
      // No longer processing (initializing)
      setIsProcessing(false);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(`Could not access microphone: ${err instanceof Error ? err.message : String(err)}`);
      setIsRecording(false);
      setIsProcessing(false);
      cleanupResources();
    }
  }, [isRecording, audioUrl, echoCancellation, noiseSuppression, autoGainControl, preferredMimeType, audioBitsPerSecond, handleDataAvailable, handleRecordingStop, minDuration, maxDuration, chunkSize, cleanupResources, stopRecording]);

  // Clear recorded audio
  const clearRecording = useCallback(() => {
    audioChunksRef.current = [];
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setError(null);
  }, [audioUrl]);

  // Get the raw audio chunks
  const getAudioChunks = useCallback(() => {
    return audioChunksRef.current ? [...audioChunksRef.current] : [];
  }, []);

  return {
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    audioBlob,
    audioUrl,
    clearRecording,
    getAudioChunks
  };
}
