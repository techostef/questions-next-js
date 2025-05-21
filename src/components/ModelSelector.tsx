"use client";

import React, { useEffect, useState } from 'react';
import { getModelsByType, getRecommendedModelsByType } from '@/constants/listModelsOpenAI';

interface ModelSelectorProps {
  type: 'chat' | 'audio' | 'both';
  defaultModel?: string;
  onChange: (model: string) => void;
  showFullList?: boolean;
  className?: string;
  pageName?: string; // Page identifier for caching model preferences by page
}

export default function ModelSelector({
  type,
  defaultModel,
  onChange,
  showFullList = false,
  className = '',
  pageName = 'default', // Default to 'default' if no page name provided
}: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState<string>(defaultModel || '');
  const [showAllModels, setShowAllModels] = useState<boolean>(showFullList);
  
  // Get models based on current display preference
  const models = showAllModels
    ? getModelsByType(type)
    : getRecommendedModelsByType(type);
  
  // Load cached model selection on component mount
  useEffect(() => {
    const cacheKey = `ai_${pageName}_${type}_model_preference`;
    try {
      const cachedModel = localStorage.getItem(cacheKey);
      if (cachedModel) {
        setSelectedModel(cachedModel);
        onChange(cachedModel);
      } else if (defaultModel) {
        setSelectedModel(defaultModel);
        onChange(defaultModel);
      }
    } catch (error) {
      console.error('Error loading cached model preference:', error);
    }
  }, [pageName, type, defaultModel, onChange]);
  
  // Handle selection change
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = event.target.value;
    setSelectedModel(newModel);
    onChange(newModel);
    
    // Cache the selection with page-specific key
    try {
      localStorage.setItem(`ai_${pageName}_${type}_model_preference`, newModel);
    } catch (error) {
      console.error('Error saving model preference:', error);
    }
  };
  
  // Toggle between recommended and all models
  const toggleModelDisplay = () => {
    setShowAllModels(!showAllModels);
  };
  
  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <label htmlFor="model-selector" className="text-sm font-medium text-gray-700">
          {type === 'chat' ? 'Chat Model:' : type === 'audio' ? 'Audio Model:' : 'AI Model:'}
        </label>
        <select
          id="model-selector"
          value={selectedModel}
          onChange={handleChange}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="" disabled>Select a model</option>
          {models.map((model) => (
            <option key={model.name} value={model.name}>
              {model.name} {model.isRecommended ? '(Recommended)' : ''}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex justify-end">
        <button
          type="button"
          onClick={toggleModelDisplay}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {showAllModels ? 'Show recommended models only' : 'Show all available models'}
        </button>
      </div>
      
      {selectedModel && (
        <div className="text-xs text-gray-500 italic">
          {models.find(m => m.name === selectedModel)?.description || ''}
        </div>
      )}
    </div>
  );
}
