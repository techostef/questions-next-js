import React from "react";

interface QuizListeningQuestionProps {
  index: number;
  audioPrompt: string;
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  answer: string;
  reason: string;
  userAnswer?: string;
  showResults: boolean;
  onAnswerSelect: (index: number, option: string) => void;
  onPlayAudio: () => void;
  isPlaying: boolean;
}

export default function QuizListeningQuestion({
  index,
  audioPrompt,
  question,
  options,
  answer,
  reason,
  userAnswer,
  showResults,
  onAnswerSelect,
  onPlayAudio,
  isPlaying,
}: QuizListeningQuestionProps) {
  // Function to determine option status class
  const getOptionClass = (option: string) => {
    if (!showResults) {
      return userAnswer === option ? "bg-blue-100 border-blue-300" : "hover:bg-gray-50";
    }
    
    if (option === answer) {
      return "bg-green-100 border-green-300";
    }
    
    if (userAnswer === option && option !== answer) {
      return "bg-red-100 border-red-300";
    }
    
    return "opacity-70";
  };

  return (
    <div className="max-h-[calc(100vh-290px)] overflow-y-auto bg-white rounded-lg shadow-sm border p-4 border-gray-300">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2 text-sm">
          <h3 className="font-medium text-lg">Question {index + 1}</h3>
          <button
            onClick={onPlayAudio}
            className={`flex items-center gap-1 px-3 py-1 rounded-full ${isPlaying ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>
            {isPlaying ? 'Playing' : 'Listen'}
          </button>
        </div>
        <p className="text-gray-700">{question}</p>
      </div>

      <div className="space-y-2 mb-3">
        {Object.entries(options).map(([key, value]) => (
          <div
            key={key}
            className={`border border-gray-300 rounded-lg p-2 px-3 cursor-pointer transition-colors ${getOptionClass(key)}`}
            onClick={() => !showResults && onAnswerSelect(index, key)}
          >
            <div className="flex items-start text-sm">
              <span className="font-medium mr-2">{key.toUpperCase()}</span>
              <span>{value}</span>
            </div>
          </div>
        ))}
      </div>

      {showResults && (
        <div className="mt-4 bg-gray-50 p-3 rounded-lg">
          <div className="font-medium text-green-700">
            Correct Answer: {answer.toUpperCase()}
          </div>
          <div className="mt-2 text-sm">
            <span className="font-medium text-sm">Explanation:</span> {reason}
          </div>
          
          <div className="mt-2 text-sm text-gray-500 border-t pt-2">
            <span className="font-medium text-sm">Audio Text:</span> {audioPrompt}
          </div>
        </div>
      )}
    </div>
  );
}
