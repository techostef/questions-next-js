import React, { useState } from "react";
import QuizQuestion from "./QuizQuestion";

interface Option {
  a: string;
  b: string;
  c: string;
  d: string;
}

interface Question {
  question: string;
  options: Option;
  answer: string;
  reason: string;
}

export interface QuizData {
  questions: Question[];
}

interface QuizProps {
  quizData: QuizData;
  onLoadDifferentQuiz: () => void;
}

export default function Quiz({ quizData, onLoadDifferentQuiz }: QuizProps) {
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswerSelect = (questionIndex: number, option: string) => {
    setUserAnswers({
      ...userAnswers,
      [questionIndex]: option,
    });
  };

  const checkAnswers = () => {
    setShowResults(true);
  };

  const resetQuiz = () => {
    setUserAnswers({});
    setShowResults(false);
  };

  const getScore = () => {
    return quizData.questions.reduce((score, question, index) => {
      return userAnswers[index] === question.answer ? score + 1 : score;
    }, 0);
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col items-center mb-4">
        <h2 className="text-xl">Questions</h2>
        <div className="flex">
          {showResults && (
            <span className="mr-4 font-bold">
              Score: {getScore()}/{quizData.questions.length}
            </span>
          )}
          {!showResults ? (
            <>
              <button
                onClick={onLoadDifferentQuiz}
                className="bg-gray-500 text-white px-3 py-1 rounded mr-2 text-sm"
              >
                Load Different Quiz
              </button>
              <button
                onClick={checkAnswers}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                disabled={
                  Object.keys(userAnswers).length < quizData.questions.length
                }
              >
                Check Answers
              </button>
            </>
          ) : (
            <button
              onClick={resetQuiz}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          )}
        </div>
      </div>

      <div className="space-y-8 h-[calc(100vh-400px)] overflow-y-auto">
        {quizData.questions.map((question, qIndex) => (
          <QuizQuestion
            key={qIndex}
            index={qIndex}
            question={question.question}
            options={question.options}
            answer={question.answer}
            reason={question.reason}
            userAnswer={userAnswers[qIndex]}
            showResults={showResults}
            onAnswerSelect={handleAnswerSelect}
          />
        ))}
      </div>
    </div>
  );
}
