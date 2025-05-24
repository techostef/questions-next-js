"use client";

import React, { useCallback } from 'react';
import { useBasicRecorder } from '@/hooks/useBasicRecorder';

export interface StoryReaderProps {
  storyText: string;
  onTranscriptReceived: (transcript: string) => void;
  isReading: boolean;
  disabled?: boolean;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

export const StoryReader: React.FC<StoryReaderProps> = ({ 
  onTranscriptReceived, 
  isReading: externalIsReading, 
  disabled = false,
  onRecordingStateChange
}) => {
  // Track transcript internally (used for display in the component)
  
  const {
    isRecording,
    startRecording,
    stopRecording,
  } = useBasicRecorder({
    onBlobReceived: (blob: Blob) => {
      console.log('Recording complete, processing audio...');
      processAudioRecording(blob);
    },
  });
  
  const processAudioRecording = useCallback(async (blob: Blob) => {
    if (!blob) return;
    
    console.log('Processing audio recording:', blob.size, 'bytes');
    
    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");
    
    try {
      // Ensure we signal recording has stopped
      onRecordingStateChange?.(false);
      // Recording is done
      
      const response = await fetch("/api/audio/transcribe", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      const transcript = data.transcript;
      
      if (transcript) {
        onTranscriptReceived(transcript);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    }
  }, [onTranscriptReceived, onRecordingStateChange]);

  // Handle start reading
  const handleStartReading = useCallback(() => {
    console.log('Starting reading session');
    // Start recording
    startRecording();
    onRecordingStateChange?.(true);
  }, [startRecording, onRecordingStateChange]);

  // Handle stop reading
  const handleStopReading = useCallback(() => {
    console.log('Stopping reading session');
    stopRecording();
    onRecordingStateChange?.(false);
  }, [stopRecording, onRecordingStateChange]);

  return (
    <div className="w-full flex flex-col items-center">
      <button
        onClick={isRecording ? handleStopReading : handleStartReading}
        disabled={disabled || externalIsReading}
        className={`px-4 py-2 ml-auto mr-auto rounded-lg transition-colors ${isRecording ? 
          "bg-red-500 text-white hover:bg-red-600" : 
          "bg-blue-500 text-white hover:bg-blue-600"} ${(disabled || externalIsReading) ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isRecording 
          ? "Stop Reading" 
          : "Start Reading"}
      </button>
      
      {isRecording && (
        <div className="flex ml-auto mr-auto items-center mt-2 text-red-500">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
          <span>Recording now... (speak clearly)</span>
        </div>
      )}
    </div>
  );
}

export default StoryReader;
