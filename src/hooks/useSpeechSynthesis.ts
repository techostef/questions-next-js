import { useState, useEffect, useCallback } from 'react';

type VoiceType = 'default' | 'male' | 'female';

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

  // Speech synthesis function
  const speak = useCallback((text: string) => {
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

      // Start speaking
      window.speechSynthesis.speak(utterance);
      
      return utterance; // Return the utterance for potential further customization
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
      window.speechSynthesis.cancel();
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
