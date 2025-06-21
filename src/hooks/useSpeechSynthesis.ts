import { cleanMarkdown, isMarkdown } from '@/lib/markdown';
import { splitTextIntoChunks } from '@/lib/string';
import { useState, useEffect, useCallback, useRef } from 'react';

type VoiceType = 'default' | 'male' | 'female';

const DELAY_BETWEEN_CHUNKS = 50;

function convertConversationToArray(conversation) {
  const manKeywords = ['man', 'boy', 'dad', 'daddy', 'father', 'sir', 'brother', 'uncle', 'he', 'him', 'his'];
  let isFirst = true;
  let firstType = 'male';

  return conversation
    .split('\n')
    .map((line: string, index: number) => {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const speaker = match[1].trim();
        const text = match[2].trim();
        const lowercaseText = text.toLowerCase();

        const isMan = manKeywords.findIndex(keyword => lowercaseText.includes(keyword));
        let type = 'male';
        if (isFirst) {
          isFirst = false;
          type = isMan !== -1 ? 'male' : 'female';
          firstType = type;
        } else {
          type = firstType === 'male' ? (index % 2 === 0 ? 'male' : 'female') : (index % 2 === 0 ? 'female' : 'male');
        }
        return {
          speaker,
          text,
          type
        };
      }
      return null;
    })
    .filter(entry => entry !== null);
}

// function alternateGender(data) {
//   return data.map((value, index) => {
//     if (index === 0) return value;
//     return data[0].type === 'male' ? (index % 2 === 0 ? 'male' : 'female') : (index % 2 === 0 ? 'female' : 'male');
//   });
// }

/**
 * Custom hook for speech synthesis functionality
 * @returns Speech synthesis functions and state
 */
export function useSpeechSynthesis() {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
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
    setIsPlaying(true);
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
      
      // Check if this is a conversation with "Man:" and "Woman:" prefixes
      const isConversation = processedText.includes('\n');
      
      if (isConversation) {
        // Handle conversation with different voices
        // Split the text by speaker markers
        const conversationParts = convertConversationToArray(processedText);
        
        // Process each conversation part separately
        const conversationChunks: { voice: 'male' | 'female' | 'default', text: string }[] = [];
        
        conversationParts.forEach((part) => {
          const partChunks = splitTextIntoChunks(part.text, MAX_CHUNK_LENGTH);
          partChunks.forEach((chunk) => {
            conversationChunks.push({ voice: part.type, text: chunk });
          });
        });
        
        // Function to speak the next conversation chunk with appropriate voice
        const speakNextConversationChunk = () => {
          if (conversationChunks.length === 0) {
            isSpeakingRef.current = false;
            return;
          }
          
          isSpeakingRef.current = true;
          const { voice: chunkVoice, text: chunkText } = conversationChunks.shift()!;
          // Create a new utterance for this chunk
          const utterance = new SpeechSynthesisUtterance(chunkText);
          
          // Reset pitch to default for each new utterance
          utterance.pitch = 1.0;
          
          // Set voice based on the speaker
          if (availableVoices.length > 0) {
            if (chunkVoice === 'male') {
              // Enhanced male voice detection
              const maleCandidates = availableVoices.filter(voice => {
                const name = voice.name.toLowerCase();
                // Check for common male voice indicators
                return name.includes('male') || 
                       name.includes('man') || 
                       name.includes('guy') || 
                       name.includes('david') || 
                       name.includes('tom') || 
                       name.includes('jack') ||
                       name.includes('richard') ||
                       name.includes('daniel') ||
                       // If voice has gender property (some implementations have this)
                       // @ts-expect-error - non-standard property
                       (voice.gender === 'male');
              });
              // Use the first male candidate if found
              if (maleCandidates.length > 0) {
                utterance.voice = maleCandidates.find(v => v.name.includes('Google UK English Male')) ?? maleCandidates[0];
                // Enforce a lower pitch for male voice
                utterance.pitch = 0.8;
              } else {
                // If no specific male voice found, try to find a deeper voice
                // as a fallback (some voices may not have male/female in name)
                utterance.pitch = 0.8; // Lower pitch for male sound
              }
            } else if (chunkVoice === 'female') {
              // Enhanced female voice detection
              const femaleCandidates = availableVoices.filter(voice => {
                const name = voice.name.toLowerCase();
                // Check for common female voice indicators
                return name.includes('female') || 
                       name.includes('woman') ||
                       name.includes('girl') ||
                       name.includes('lisa') ||
                       name.includes('mary') ||
                       name.includes('sarah') ||
                       name.includes('julia') ||
                       // Exclude explicit male voices
                       (!name.includes('male') && !name.includes('man')) ||
                       // If voice has gender property
                       // @ts-expect-error - non-standard property
                       (voice.gender === 'female');
              });
              // First try to find an explicit female voice
              const explicitFemaleVoice = femaleCandidates.find(voice => {
                const name = voice.name.toLowerCase();
                return name.includes('female') || name.includes('woman');
              });
              
              if (explicitFemaleVoice) {
                utterance.voice = explicitFemaleVoice;
              } else if (femaleCandidates.length > 0) {
                // Otherwise use any candidate that matched
                utterance.voice = femaleCandidates[0];
              } else {
                // As last resort, try to use a different voice than the male one
                // Find a voice that's not explicitly male
                const nonMaleVoice = availableVoices.find(voice => {
                  const name = voice.name.toLowerCase();
                  return !name.includes('male') && !name.includes('man');
                });
                
                if (nonMaleVoice) {
                  utterance.voice = nonMaleVoice;
                }
                
                // Fallback - try to create a higher pitched voice
                utterance.pitch = 1.3; // Higher pitch for female sound
                utterance.rate = 1.05; // Slightly faster rate
              }
            } else {
              // Use the user's preferred voice type for unspecified speaker parts
              if (voiceType === 'male') {
                const maleVoice = availableVoices.find(
                  (voice) => voice.name.toLowerCase().includes("male") || 
                             voice.name.toLowerCase().includes("man")
                );
                if (maleVoice) utterance.voice = maleVoice;
              } else if (voiceType === 'female') {
                const femaleVoice = availableVoices.find(
                  (voice) => voice.name.toLowerCase().includes("female") || 
                             voice.name.toLowerCase().includes("woman")
                );
                if (femaleVoice) utterance.voice = femaleVoice;
              }
            }
          }
          
          // Set SSML mode if supported and if the content is SSML
          const isEdge = typeof window !== 'undefined' && navigator.userAgent.indexOf('Edg') !== -1;
          if (isSSML && isEdge && 'SpeechSynthesisUtterance' in window) {
            try {
              // @ts-expect-error - this is a non-standard property supported in Microsoft Edge
              utterance.inputType = 'ssml';
            } catch (error) {
              console.warn('SSML inputType not supported in this browser', error);
            }
          }
          
          // Set up event for when this chunk is done
          utterance.onend = () => {
            setTimeout(speakNextConversationChunk, DELAY_BETWEEN_CHUNKS); // Small delay between chunks
          };
          
          utterance.onerror = () => {
            // Only continue to the next chunk if we haven't intentionally stopped
            if (!isIntentionallyStopped.current) {
              setTimeout(speakNextConversationChunk, DELAY_BETWEEN_CHUNKS); // Try next chunk only if not stopped
            }
          };
          
          // Start speaking this chunk
          window.speechSynthesis.speak(utterance);
        };
        
        // Start speaking the first conversation chunk
        speakNextConversationChunk();
      } else {
        // Regular non-conversation text processing
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
              // Enhanced male voice detection
              const maleCandidates = availableVoices.filter(voice => {
                const name = voice.name.toLowerCase();
                return name.includes('male') || 
                       name.includes('man') || 
                       name.includes('guy') || 
                       name.includes('david') || 
                       name.includes('tom') || 
                       name.includes('jack') ||
                       // @ts-expect-error - non-standard property
                       (voice.gender === 'male');
              });
              
              if (maleCandidates.length > 0) {
                utterance.voice = maleCandidates[2];
              } else {
                // Fallback to pitch adjustment
                utterance.pitch = 0.8;
              }
            } 
            // Try to find a female voice
            else if (voiceType === "female") {
              // Enhanced female voice detection
              const femaleCandidates = availableVoices.filter(voice => {
                const name = voice.name.toLowerCase();
                return name.includes('female') || 
                       name.includes('woman') ||
                       name.includes('girl') ||
                       name.includes('lisa') ||
                       name.includes('mary') ||
                       // @ts-expect-error - non-standard property
                       (voice.gender === 'female');
              });
              
              if (femaleCandidates.length > 0) {
                utterance.voice = femaleCandidates[0];
              } else {
                // Fallback to pitch adjustment
                utterance.pitch = 1.2;
              }
            }
          }

          // Start speaking this chunk
          window.speechSynthesis.speak(utterance);
        };
        
        // Start speaking the first chunk
        speakNextChunk();
      }
      const checkSpeechEnd = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          setIsPlaying(false);
          clearInterval(checkSpeechEnd);
        }
      }, 100);
      
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
    isPlaying,
    speak,      // Function to speak text
    stop,       // Function to stop speaking
    voiceType,  // Current voice type
    updateVoiceType, // Function to update voice type
    availableVoices, // Available voices
    isSupported: typeof window !== "undefined" && "speechSynthesis" in window
  };
}
