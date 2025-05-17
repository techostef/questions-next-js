'use client';

import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

interface VoiceSelectorProps {
  onChange?: (voiceType: 'default' | 'male' | 'female') => void;
}

export default function VoiceSelector({ onChange }: VoiceSelectorProps) {
  const { voiceType, updateVoiceType } = useSpeechSynthesis();
  
  // Handle voice type changes with parent callback
  const handleVoiceChange = (type: 'default' | 'male' | 'female') => {
    updateVoiceType(type);
    
    // Notify parent component if callback is provided
    if (onChange) {
      onChange(type);
    }
  };

  return (
    <div className="mb-4 p-3 bg-gray-100 rounded-lg">
      <div className="flex items-center">
        <span className="mr-3 font-medium">AI Voice:</span>
        <div className="flex space-x-2">
          <button
            onClick={() => handleVoiceChange('default')}
            className={`px-3 py-1 rounded ${
              voiceType === 'default'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200'
            }`}
          >
            Default
          </button>
          <button
            onClick={() => handleVoiceChange('male')}
            className={`px-3 py-1 rounded ${
              voiceType === 'male'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200'
            }`}
          >
            Male
          </button>
          <button
            onClick={() => handleVoiceChange('female')}
            className={`px-3 py-1 rounded ${
              voiceType === 'female'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200'
            }`}
          >
            Female
          </button>
        </div>
      </div>
    </div>
  );
}
