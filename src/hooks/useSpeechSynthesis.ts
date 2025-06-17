import { cleanMarkdown, isMarkdown } from '@/lib/markdown';
import { splitTextIntoChunks } from '@/lib/string';
import { useState, useEffect, useCallback, useRef } from 'react';

type VoiceType = 'default' | 'male' | 'female';

const DELAY_BETWEEN_CHUNKS = 50;

/**
 * Custom hook for speech synthesis functionality
 * @returns Speech synthesis functions and state
 */
export function useSpeechSynthesis() {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceType, setVoiceType] = useState<VoiceType>(() => {
    // Load cached voice type on initial render
    if (typeof window !== 'undefined') {
      try {
        const cachedVoiceType = localStorage.getItem('ai_voice_preference');
        if (cachedVoiceType && ['male', 'female', 'default'].includes(cachedVoiceType)) {
          return cachedVoiceType as VoiceType;
        }
      } catch (error) {
        console.error('Error loading cached voice preference:', error);
      }
    }
    return 'default';
  });

  // Load available voices when component mounts
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if speech synthesis is supported
    if (!("speechSynthesis" in window)) {
      return; // Exit early if not supported
    }

    try {
      // Function to load voices
      const loadVoices = () => {
        try {
          const voices = window.speechSynthesis.getVoices();
          setAvailableVoices(voices || []);
        } catch (error) {
          console.error("Error loading voices:", error);
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

  // Update voice type and persist to localStorage
  const updateVoiceType = useCallback((type: VoiceType) => {
    setVoiceType(type);
    
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ai_voice_preference", type);
      } catch (error) {
        console.error("Error saving voice preference:", error);
      }
    }
  }, []);

  // Maximum length for each speech chunk (around 200 characters works well)
  const MAX_CHUNK_LENGTH = 200;

  // Referenced to track if we're currently speaking
  const isSpeakingRef = useRef(false);
  const chunksToSpeakRef = useRef<string[]>([]);
  // Track when speech is intentionally stopped
  const isIntentionallyStopped = useRef(false);

  // Speech synthesis function
  const speak = useCallback((text: string, isSSML: boolean = false) => {
    // Reset the intentionally stopped flag when starting new speech
    isIntentionallyStopped.current = false;
    if (typeof window === "undefined") return;
    
    // Check if speech synthesis is supported
    if (!("speechSynthesis" in window)) {
      return; // Exit early if not supported
    }

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
      
      // Process text based on content type
      let processedText = text;
      
      if (isSSML) {
        // For SSML content, check if we need to strip the tags
        // Most browsers don't support SSML directly
        const isEdge = typeof window !== 'undefined' && navigator.userAgent.indexOf('Edg') !== -1;
        const ssmlSupported = isEdge; // Only Edge has good SSML support currently
        
        if (!ssmlSupported) {
          // Strip SSML tags for browsers that don't support it
          processedText = text
            .replace(/<speak>|<\/speak>/g, '')
            .replace(/<break[^>]*>/g, ' ') // Replace breaks with spaces instead of periods
            .replace(/<emphasis[^>]*>([^<]*)<\/emphasis>/g, '$1')
            .replace(/<prosody[^>]*>([^<]*)<\/prosody>/g, '$1')
            .replace(/<[^>]*>/g, '');
          
          // Clean up multiple spaces that might have been introduced
          processedText = processedText.replace(/\s+/g, ' ').trim();
        }
      } else {
        // For non-SSML content, clean markdown if present
        if (isMarkdown(text)) {
          processedText = cleanMarkdown(text);
        }
      }
      
      // Split text into chunks
      const chunks = splitTextIntoChunks(processedText, MAX_CHUNK_LENGTH);
      chunksToSpeakRef.current = [...chunks];
      
      // Function to speak the next chunk
      const speakNextChunk = () => {
        if (chunksToSpeakRef.current.length === 0) {
          isSpeakingRef.current = false;
          return;
        }
        
        isSpeakingRef.current = true;
        const chunk = chunksToSpeakRef.current.shift() || '';
        
        // Create a new utterance for this chunk
        const utterance = new SpeechSynthesisUtterance(chunk);
        
        // Set SSML mode if supported and if the content is SSML
        // Microsoft Edge is the main browser with good SSML support
        const isEdge = typeof window !== 'undefined' && navigator.userAgent.indexOf('Edg') !== -1;
        
        if (isSSML && isEdge && 'SpeechSynthesisUtterance' in window) {
          try {
            // For Edge browser which supports SSML
            // @ts-expect-error - this is a non-standard property supported in Microsoft Edge
            utterance.inputType = 'ssml';
          } catch (error) {
            console.warn('SSML inputType not supported in this browser', error);
          }
        }
        
        // Set up event for when this chunk is done
        utterance.onend = () => {
          setTimeout(speakNextChunk, DELAY_BETWEEN_CHUNKS); // Small delay between chunks
        };
        
        utterance.onerror = () => {
          // Only continue to the next chunk if we haven't intentionally stopped
          if (!isIntentionallyStopped.current) {
            setTimeout(speakNextChunk, DELAY_BETWEEN_CHUNKS); // Try next chunk only if not stopped
          }
        };

        // Find the appropriate voice based on user preference
        if (availableVoices.length > 0) {
          // Default behavior: use the browser's default voice
          if (voiceType === "default") {
            // No need to set a voice, browser will use default
          } 
          // Try to find a male voice
          else if (voiceType === "male") {
            const maleVoice = availableVoices.find(
              (voice) => voice.name.includes("Male") || voice.name.includes("male")
            );
            if (maleVoice) utterance.voice = maleVoice;
          } 
          // Try to find a female voice
          else if (voiceType === "female") {
            const femaleVoice = availableVoices.find(
              (voice) => voice.name.includes("Female") || voice.name.includes("female")
            );
            if (femaleVoice) utterance.voice = femaleVoice;
          }
        }

        // Start speaking this chunk
        window.speechSynthesis.speak(utterance);
      };
      
      // Start speaking the first chunk
      speakNextChunk();
      
      return; // No need to return utterance since we're handling them internally
    } catch (error) {
      console.error("Speech synthesis error:", error);
      return null;
    }
  }, [voiceType, availableVoices]);

  // Stop any ongoing speech
  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    
    if (!("speechSynthesis" in window)) return;
    
    try {
      // Mark that we're intentionally stopping
      isIntentionallyStopped.current = true;
      // Clear any remaining chunks
      chunksToSpeakRef.current = [];
      // Cancel current speech
      window.speechSynthesis.cancel();
      // Reset speaking state
      isSpeakingRef.current = false;
    } catch (error) {
      console.error("Error stopping speech:", error);
    }
  }, []);

  return {
    speak,      // Function to speak text
    stop,       // Function to stop speaking
    voiceType,  // Current voice type
    updateVoiceType, // Function to update voice type
    availableVoices, // Available voices
    isSupported: typeof window !== "undefined" && "speechSynthesis" in window
  };
}
