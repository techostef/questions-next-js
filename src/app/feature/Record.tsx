'use client';

import Button from '@/components/Button';
import { useEffect, useRef, useState } from 'react';

export default function RecordPage() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [isClient, setIsClient] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setIsClient(typeof window !== 'undefined' && !!navigator.mediaDevices);
  }, []);

  const startRecording = async () => {
    if (!isClient) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Microphone access denied or error:', err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Voice Recorder</h1>
      {!isClient && <p>Loading...</p>}
      {isClient && (
        <>
          <Button
            onClick={recording ? stopRecording : startRecording}
            variant={recording ? "danger" : "primary"}
          >
            {recording ? 'Stop Recording' : 'Start Recording'}
          </Button>

          {audioURL && (
            <div className="mt-4">
              <audio controls src={audioURL} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
