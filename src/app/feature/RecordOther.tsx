'use client';

import { useEffect, useRef, useState } from 'react';

export default function RecordPage() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      console.log("webkitSpeechRecognition", window.webkitSpeechRecognition)
      console.log("SpeechRecognition", window.SpeechRecognition)
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setTranscript((prev) => prev + transcriptPiece + ' ');
          } else {
            interim += transcriptPiece;
          }
        }
        // Optional: show interim results
        console.log('Interim:', interim);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('Speech Recognition not supported in this browser.');
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (!isListening) {
      recognitionRef.current.start();
      setIsListening(true);
    } else {
      recognitionRef.current.stop();
      setIsListening(false);
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

      <div className="mt-4 p-4 border rounded bg-gray-100">
        <strong>Transcript:</strong>
        <p>{transcript}</p>
      </div>
    </div>
  );
}
