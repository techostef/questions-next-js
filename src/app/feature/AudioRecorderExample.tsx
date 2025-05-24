"use client";

import { useEffect, useState } from 'react';
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
  // Track transcript text
  const [transcript, setTranscript] = useState('');
  
  const {
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    clearRecording,
    audioBlob,
    audioUrl
  } = useAudioRecorder({
    // Set a shorter minimum duration for testing
    minDuration: 500
  });

  // Process audio when recording is complete
  useEffect(() => {
    const processAudio = async () => {
      if (audioBlob && !isRecording && !isProcessing) {
        console.log('Processing audio blob:', audioBlob.size, 'bytes');
        
        try {
          // Create form data for sending to API
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          
          // Send to our transcription API
          const response = await fetch('/api/audio/transcribe', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
          }
          
          const data = await response.json();
          console.log('Transcription received:', data);
          
          // Update transcript state
          if (data.text) {
            setTranscript(data.text);
            
            // Call the callback with the transcript if provided
            if (onTranscriptReceived) {
              onTranscriptReceived(data.text);
            }
          }
          
          // Call the recording complete callback if provided
          if (onRecordingComplete) {
            onRecordingComplete(audioBlob);
          }
        } catch (err) {
          console.error('Error processing audio:', err);
        }
      }
    };
    
    processAudio();
  }, [audioBlob, isRecording, isProcessing, audioUrl, onRecordingComplete, onTranscriptReceived]);


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
      
      {audioBlob && audioUrl && (
        <div className="mt-4">
          <h3 className="text-lg font-medium">Recording Complete</h3>
          <p>Audio size: {audioBlob.size} bytes</p>
          <p>Audio type: {audioBlob.type}</p>
          <audio className="mt-2" controls src={audioUrl} />
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
