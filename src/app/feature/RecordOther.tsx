'use client';

"use client"; 
import Button from '@/components/Button';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

export default function RecordPage() {
  // Speech recognition for listening to the user
  const { 
    transcript, 
    isListening,
    startListening, 
    stopListening, 
  } = useSpeechRecognition({
    language: 'en-US',
    continuous: true,
    interimResults: true
  });

  const toggleListening = () => {
    if (!isListening) {
      startListening();
    } else {
      stopListening()
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Speech to Text (Web Speech API)</h1>
      <Button
        onClick={toggleListening}
        variant="primary"
      >
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </Button>

      <div className="mt-4 p-4 border rounded bg-gray-100">
        <strong>Transcript:</strong>
        <p>{transcript}</p>
      </div>
    </div>
  );
}
