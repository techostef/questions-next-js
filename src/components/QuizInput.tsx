import React, { useState } from 'react';
import { QuizData } from './Quiz';

interface QuizInputProps {
  onQuizSubmit: (data: QuizData) => void;
}

export default function QuizInput({ onQuizSubmit }: QuizInputProps) {
  const [jsonInput, setJsonInput] = useState('');

  const handleJsonSubmit = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      onQuizSubmit(parsed);
    } catch (err) {
      console.error('Invalid JSON format. Please check your input.', err);
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-xl mb-3">Paste your JSON quiz data</h2>
      <textarea
        className="w-full h-64 border p-2 rounded mb-3"
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
        placeholder="Paste JSON quiz data here..."
      />
      <button
        onClick={handleJsonSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Load Quiz
      </button>
    </div>
  );
}
