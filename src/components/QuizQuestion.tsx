import React from 'react';

interface Option {
  a: string;
  b: string;
  c: string;
  d: string;
}

interface QuestionProps {
  index: number;
  question: string;
  options: Option;
  answer: string;
  reason: string;
  userAnswer?: string;
  showResults: boolean;
  onAnswerSelect: (index: number, option: string) => void;
}

export default function QuizQuestion({
  index,
  question,
  options,
  answer,
  reason,
  userAnswer,
  showResults,
  onAnswerSelect
}: QuestionProps) {
  return (
    <div 
      className={`max-h-[calc(100vh-335px)] overflow-y-auto p-4 border rounded ${
        showResults 
          ? userAnswer === answer 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
          : 'bg-white'
      }`}
    >
      <p className="font-medium mb-3">
        {index + 1}. {question}
      </p>
      <div className="space-y-2 ml-4">
        {Object.entries(options).map(([option, text]) => (
          <div key={option} className="flex items-center">
            <input
              type="radio"
              id={`q${index}-${option}`}
              name={`question-${index}`}
              value={option}
              checked={userAnswer === option}
              onChange={() => onAnswerSelect(index, option)}
              disabled={showResults}
              className="mr-2"
            />
            <label 
              htmlFor={`q${index}-${option}`}
              className={`
                ${showResults && option === answer ? 'font-bold text-green-700' : ''}
                ${showResults && userAnswer === option && option !== answer ? 'line-through text-red-700' : ''}
              `}
            >
              {option}) {text}
            </label>
          </div>
        ))}
      </div>
      {showResults && (
        <div className="mt-2 text-sm">
          {userAnswer === answer ? (
            <p className="text-green-700">Correct!</p>
          ) : (
            <p className="text-red-700">
              Incorrect. The correct answer is {answer}).
            </p>
          )}
          {reason && (
            <p className=" mt-1">
              {reason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
