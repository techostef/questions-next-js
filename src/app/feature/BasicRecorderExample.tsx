"use client";

import { useBasicRecorder } from '@/hooks/useBasicRecorder';
import Button from '@/components/Button';

export default function BasicRecorderExample() {
  const { isRecording, audioUrl, startRecording, stopRecording, clearRecording } = useBasicRecorder();

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-semibold">Basic Audio Recorder</h2>
      
      <div className="flex space-x-2">
        {!isRecording ? (
          <Button 
            onClick={startRecording}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Start Recording
          </Button>
        ) : (
          <Button 
            onClick={stopRecording}
            className="bg-gray-500 hover:bg-gray-600 text-white"
          >
            Stop Recording
          </Button>
        )}
        
        {audioUrl && (
          <Button 
            onClick={clearRecording}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800"
          >
            Clear Recording
          </Button>
        )}
      </div>
      
      {audioUrl && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Recording Playback</h3>
          <audio src={audioUrl} controls className="w-full" />
        </div>
      )}
    </div>
  );
}
