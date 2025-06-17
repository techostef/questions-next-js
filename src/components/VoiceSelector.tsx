'use client';

import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import Button from './Button';

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
          <Button
            onClick={() => handleVoiceChange('default')}
            variant={voiceType === 'default' ? 'primary' : 'default'}
            size="small"
          >
            Default
          </Button>
          <Button
            onClick={() => handleVoiceChange('male')}
            variant={voiceType === 'male' ? 'primary' : 'default'}
            size="small"
          >
            Male
          </Button>
          <Button
            onClick={() => handleVoiceChange('female')}
            variant={voiceType === 'female' ? 'primary' : 'default'}
            size="small"
          >
            Female
          </Button>
        </div>
      </div>
    </div>
  );
}
