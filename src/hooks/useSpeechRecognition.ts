"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react';
import { sendErrorToServer } from '@/lib/error';
import {
  SpeechRecognition,
  SpeechRecognitionErrorEvent,
  SpeechRecognitionEvent,
  SpeechRecognitionResultItem,
} from '@/app/chat/type';

interface UseSpeechRecognitionOptions {
  /**
   * Time in milliseconds of silence before automatically stopping recognition
   */
  silenceTimeout?: number;
  /**
   * Language for speech recognition
   */
  language?: string;
  /**
   * Whether to use continuous recognition
   */
  continuous?: boolean;
  /**
   * Whether to show interim results
   */
  interimResults?: boolean;
}

interface UseSpeechRecognitionReturn {
  /**
   * Current transcribed text
   */
  transcript: string;
  /**
   * Whether speech recognition is currently active
   */
  isListening: boolean;
  /**
   * Whether speech recognition is supported in this browser
   */
  isSupported: boolean;
  /**
   * Start listening for speech
   */
  startListening: () => void;
  /**
   * Stop listening for speech
   */
  stopListening: () => void;
  /**
   * Toggle between listening and not listening
   */
  toggleListening: () => void;
  /**
   * Clear the current transcript
   */
  clearTranscript: () => void;
  /**
   * Any error that occurred during speech recognition
   */
  error: string | null;
}

/**
 * Custom hook for speech recognition functionality
 * @param options Configuration options for speech recognition
 * @returns Speech recognition functions and state
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    silenceTimeout = 2000,
    language = 'en-US',
    continuous = false,
    interimResults = true,
  } = options;

  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);

  // Set up event handlers for the recognition object
  const setupRecognitionHandlers = useCallback(() => {
    if (!recognitionRef.current) return;

    // Handle speech recognition results
    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      lastSpeechTimeRef.current = Date.now();
      
      // Check if this is a mobile Android device - different handling needed
      const isAndroid = /android/i.test(navigator.userAgent);
      
      if (isAndroid) {
        // For Android, we need to handle interim results differently to prevent duplication
        let finalTranscript = '';
        let interimTranscript = '';
        
        // Process each result individually
        // resultIndex might not be directly available in the type definition
        // but it exists in the actual implementation
        const resultIndex = (event as any).resultIndex || 0;
        
        for (let i = resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcriptText = result[0].transcript;
          
          // Check if this result is final
          if (result.isFinal) {
            finalTranscript += transcriptText;
          } else {
            interimTranscript += transcriptText;
          }
        }
        
        // For Android, only use final results to prevent duplication
        if (finalTranscript.trim()) {
          setTranscript(prevTranscript => {
            // Avoid duplicating text that's already in the transcript
            if (prevTranscript.endsWith(finalTranscript)) {
              return prevTranscript;
            }
            return finalTranscript;
          });
        }
      } else {
        // For other platforms, use the original approach
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: SpeechRecognitionResultItem) => result.transcript)
          .join('');
          
        setTranscript(transcript);
      }

      // Start the auto-stop timer after getting results
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      silenceTimerRef.current = setTimeout(() => {
        if (silenceTimeout !== 0 && recognitionRef.current && Date.now() - lastSpeechTimeRef.current >= silenceTimeout) {
          recognitionRef.current.stop();
          // Don't set isListening here, we'll update it in onend handler
        }
      }, silenceTimeout);
    };

    // This event fires when recognition stops for any reason
    recognitionRef.current.onend = () => {
      // Check if we're on Android and the stopping was unexpected
      const isAndroid = /android/i.test(navigator.userAgent);
      
      if (isAndroid && isListening) {
        // Small delay to allow the previous session to fully terminate
        setTimeout(() => {
          try {
            if (recognitionRef.current) {
              recognitionRef.current.start();
            }
          } catch (err) {
            console.error('Error restarting speech recognition:', err);
            setIsListening(false);
            setError('Failed to restart speech recognition');
          }
        }, 300);
      } else {
        // Normal behavior for non-Android or when manually stopped
        setIsListening(false);

        // Clear the silence timer if it exists
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      }
    };

    // Handle errors in speech recognition
    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setError(event.error);

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
    };
  }, [silenceTimeout, isListening]);
  
  // Initialize speech recognition
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    try {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        
      if (!SpeechRecognitionAPI) {
        console.error('Speech Recognition API not supported in this browser');
        setIsSupported(false);
        setError('Speech Recognition not supported in this browser');
        
        sendErrorToServer(new Error('Speech Recognition not supported'), {
          componentStack: "Browser doesn't support SpeechRecognition or webkitSpeechRecognition",
          browser: navigator.userAgent,
        });
        return;
      }

      setIsSupported(true);
      recognitionRef.current = new SpeechRecognitionAPI();
      
      // Set initial configuration
      recognitionRef.current.continuous = continuous;
      recognitionRef.current.interimResults = interimResults;
      recognitionRef.current.lang = language;
      
      // Set up handlers
      setupRecognitionHandlers();
    } catch (err) {
      console.error('Error initializing speech recognition:', err);
      setError('Failed to initialize speech recognition');
      setIsSupported(false);
      
      sendErrorToServer(err as Error, { 
        componentStack: 'useSpeechRecognition initialization'
      });
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          // Ignore errors when stopping on cleanup
        }
      }
      
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
  }, [continuous, interimResults, language, setupRecognitionHandlers]);

  // Start listening for speech
  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      console.error('Speech recognition not initialized or not supported');
      return;
    }

    setError(null);
    setIsListening(true);
    
    // Check if we're on Android
    const isAndroid = /android/i.test(navigator.userAgent);
    
    try {
      // On Android, we may need to set shorter recognition segments
      if (isAndroid) {
        // Android often has shorter timeouts for speech recognition
        recognitionRef.current.maxAlternatives = 1; // Reduce processing load
      }
      
      recognitionRef.current.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setIsListening(false);
      setError('Failed to start speech recognition');
      
      sendErrorToServer(err as Error, { 
        componentStack: 'recognitionRef.current.start()' 
      });
    }
  }, [isSupported]);

  // Stop listening for speech
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    // Clear any existing silence timer when manually stopping
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
      
      // Force update the listening state since the onend might not fire
      setIsListening(false);
      
      sendErrorToServer(err as Error, { 
        componentStack: 'recognitionRef.current.stop()' 
      });
    }
  }, []);

  // Toggle between listening and not listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Clear the current transcript
  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
    error
  };
}
