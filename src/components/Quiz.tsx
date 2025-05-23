import React, { useState, useMemo, useEffect, useRef } from "react";
import QuizQuestion from "./QuizQuestion";
import { useQuizStore } from "@/store/quizStore";

export default function Quiz() {
  // Get quizData and allQuizData from global store
  const { quizData, allQuizData } = useQuizStore();
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [useAllQuizzes, setUseAllQuizzes] = useState(false);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Effect to manage dialog open/close state
  useEffect(() => {
    if (dialogRef.current) {
      if (isQuizDialogOpen) {
        dialogRef.current.showModal();
      } else {
        dialogRef.current.close();
      }
    }
  }, [isQuizDialogOpen]);

  // Combine all questions when useAllQuizzes is true
  const activeQuizData = useMemo(() => {
    if (!useAllQuizzes) return quizData;
    // If using all quizzes, combine them
    if (Object.keys(allQuizData).length === 0) return quizData;

    // Merge all questions from all quizzes
    const allQuestions = allQuizData.flatMap((quiz) =>
      quiz ? quiz.questions : []
    );

    // Create a combined quiz data object
    return allQuestions.length > 0 ? { questions: allQuestions } : quizData;
  }, [quizData, allQuizData, useAllQuizzes]);

  // Return null if there's no quiz data
  if (!activeQuizData) return null;

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
    return activeQuizData.questions.reduce((score, question, index) => {
      return userAnswers[index] === question.answer ? score + 1 : score;
    }, 0);
  };

  console.log("isQuizDialogOpen", isQuizDialogOpen);

  return (
    <>
      <button
        onClick={() => setIsQuizDialogOpen(true)}
        className="mt-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
      >
        Open Quiz
      </button>
      {isQuizDialogOpen && (
        <dialog
          ref={dialogRef}
          className="w-full h-full max-w-4xl p-6 rounded-lg shadow-xl backdrop:bg-opacity-50 m-auto"
          onClose={() => setIsQuizDialogOpen(false)}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Quiz</h2>
            <button
              onClick={() => setIsQuizDialogOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto max-h-[80vh]">
            <div className="mb-6 mt-4">
              <div className="flex flex-col items-center mb-4">
                <h2 className="text-xl">Questions</h2>

                {/* Toggle between current quiz and all quizzes */}
                <div className="mb-3">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAllQuizzes}
                      onChange={() => {
                        setUseAllQuizzes(!useAllQuizzes);
                        // Reset answers when switching between modes
                        setUserAnswers({});
                        setShowResults(false);
                      }}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ms-3 text-sm font-medium">
                      {useAllQuizzes
                        ? "Using All Quizzes"
                        : "Using Current Quiz"}
                    </span>
                  </label>
                </div>

                <div className="flex">
                  {showResults && (
                    <span className="mr-4 font-bold">
                      Score: {getScore()}/{activeQuizData.questions.length}
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`space-y-8 overflow-y-auto`}
                style={{ height: showResults ? "calc(100vh - 324px)" : "calc(100vh - 300px)" }}
              >
                {activeQuizData.questions.map((question, qIndex) => (
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
          </div>
          <div className="mt-auto flex gap-1">
            {!showResults ? (
              <button
                onClick={checkAnswers}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                disabled={
                  Object.keys(userAnswers).length <
                  activeQuizData.questions.length
                }
              >
                Check Answers
              </button>
            ) : (
              <button
                onClick={resetQuiz}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Try Again
              </button>
            )}
            <button
              onClick={() => setIsQuizDialogOpen(false)}
              className="ml-auto px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
