/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import Button from '@/components/Button';

interface AudioRecorderExampleProps {
  onRecordingComplete?: (audioBlob: Blob) => void;
  onTranscriptReceived?: (transcript: string) => void;
}

export default function AudioRecorderExample({
  onRecordingComplete,
  onTranscriptReceived
}: AudioRecorderExampleProps) {
  const [transcript, setTranscript] = useState('');
  
  const {
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    audioBlob,
    clearRecording
  } = useAudioRecorder({
    maxDuration: 60000, // 60 seconds
    minDuration: 3000,  // 3 seconds
    audioBitsPerSecond: 128000
  });

  // Process the recording after it's complete
  const processRecording = useCallback(async () => {
    if (!audioBlob) return;
    
    try {
      // Create form data for API request
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      // Send to API endpoint
      const response = await fetch("/api/audio/transcript", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process audio");
      }

      const data = await response.json();
      setTranscript(data.transcript);
      
      // Call the callback if provided
      if (onTranscriptReceived) {
        onTranscriptReceived(data.transcript);
      }
      
    } catch (err: any) {
      console.error("Error processing audio:", err);
    }
  }, [audioBlob, onTranscriptReceived]);

  // When recording stops and we have a blob, process it
  useEffect(() => {
    if (audioBlob && !isRecording && !isProcessing) {
      processRecording();
      
      // Call the callback if provided
      if (onRecordingComplete) {
        onRecordingComplete(audioBlob);
      }
    }
  }, [audioBlob, isRecording, isProcessing, processRecording, onRecordingComplete]);

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">Audio Recorder</h3>
      
      {error && (
        <div className="text-red-500 p-2 bg-red-50 rounded">
          {error}
        </div>
      )}
      
      <div className="flex gap-2">
        {!isRecording ? (
          <Button 
            onClick={startRecording}
            disabled={isProcessing}
          >
            Start Recording
          </Button>
        ) : (
          <Button 
            onClick={stopRecording}
          >
            Stop Recording
          </Button>
        )}
        
        {isRecording && (
          <Button 
            onClick={cancelRecording}
          >
            Cancel
          </Button>
        )}
        
        {audioBlob && !isRecording && (
          <Button 
            onClick={clearRecording}
          >
            Clear Recording
          </Button>
        )}
      </div>
      
      {isProcessing && (
        <div className="text-blue-500">
          Processing audio...
        </div>
      )}
      
      {transcript && (
        <div className="mt-4">
          <h4 className="font-medium">Transcript:</h4>
          <p className="p-2 bg-gray-50 rounded">{transcript}</p>
        </div>
      )}
      
      {audioBlob && !isRecording && !isProcessing && (
        <div className="mt-4">
          <h4 className="font-medium">Recorded Audio:</h4>
          <audio 
            controls 
            src={URL.createObjectURL(audioBlob)} 
            className="w-full mt-2"
          />
        </div>
      )}
      
      {isRecording && (
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
          <span>Recording...</span>
        </div>
      )}
    </div>
  );
}
