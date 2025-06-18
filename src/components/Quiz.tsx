import React, { useState, useMemo } from "react";
import QuizQuestion from "./QuizQuestion";
import Dialog from "./Dialog";
import { useQuizStore } from "@/store/quizStore";
import Button from "./Button";

export default function Quiz() {
  // Get quizData and allQuizData from global store
  const { quizData, allQuizData } = useQuizStore();
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [useAllQuizzes, setUseAllQuizzes] = useState(false);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);

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

  return (
    <>
      <button
        onClick={() => setIsQuizDialogOpen(true)}
        className="mt-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
      >
        Open Quiz
      </button>
      <Dialog
        isOpen={isQuizDialogOpen}
        onClose={() => setIsQuizDialogOpen(false)}
        title="Quiz"
        maxWidth="max-w-4xl"
        footer={
          <div className="flex gap-1 w-full">
            {!showResults ? (
              <Button
                onClick={checkAnswers}
                variant="secondary"
                disabled={
                  Object.keys(userAnswers).length <
                  activeQuizData.questions.length
                }
              >
                Check Answers
              </Button>
            ) : (
              <Button onClick={resetQuiz} variant="primary">
                Try Again
              </Button>
            )}
            <Button
              onClick={() => setIsQuizDialogOpen(false)}
              variant="danger"
              className="ml-auto"
            >
              Close
            </Button>
          </div>
        }
      >
        <div className="mb-2">
          <div className="flex flex-col items-center mb-1">
            {/* Toggle between current quiz and all quizzes */}
            <div className="mb-3 flex gap-4">
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
                <span className="ms-3 text-sm font-medium">All Quizzes</span>
              </label>
              <div className="flex">
                <span className="mr-4 font-bold">
                  Score:{" "}
                  {showResults
                    ? `${getScore()}/${activeQuizData.questions.length}`
                    : "-"}
                </span>
              </div>
            </div>
          </div>

          <div
            className={`space-y-8 overflow-y-auto`}
            style={{ height: "calc(100vh - 300px)" }}
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
      </Dialog>
    </>
  );
}
