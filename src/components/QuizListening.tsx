import React, { useState, useMemo } from "react";
import Dialog from "./Dialog";
import { useQuizListeningStore } from "@/store/quizListeningStore";
import QuizListeningQuestion from "./QuizListeningQuestion";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import Button from "./Button";

export default function QuizListening() {
  // Get quizData and allQuizData from global store
  const {
    quizData,
    allQuizData,
    currentAudioIndex,
    setCurrentAudioIndex,
    setIsAudioPlaying,
  } = useQuizListeningStore();
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [useAllQuizzes, setUseAllQuizzes] = useState(false);
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Initialize speech synthesis hook
  const { speak, stop, isSupported } = useSpeechSynthesis();

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
    setCurrentQuestionIndex(0);
  };

  const getScore = () => {
    return activeQuizData.questions.reduce((score, question, index) => {
      return userAnswers[index] === question.answer ? score + 1 : score;
    }, 0);
  };

  const handlePlayAudio = async (index: number, audioPrompt: string) => {
    try {
      // If already playing this audio, pause it
      if (currentAudioIndex === index && isPlaying) {
        stop();
        setIsPlaying(false);
        setIsAudioPlaying(false);
        return;
      }

      // Stop any currently playing audio
      if (isPlaying) {
        stop();
        setIsPlaying(false);
        setIsAudioPlaying(false);
      }

      // Update the current audio index
      setCurrentAudioIndex(index);

      // Use speech synthesis to speak the text
      if (isSupported) {
        speak(audioPrompt);
        setIsPlaying(true);
        setIsAudioPlaying(true);

        // Set up event to detect when speech ends
        const checkSpeechEnd = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            setIsPlaying(false);
            setIsAudioPlaying(false);
            clearInterval(checkSpeechEnd);
          }
        }, 100);
      } else {
        console.error("Speech synthesis is not supported in this browser");
      }
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsQuizDialogOpen(true)}
        className="mt-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
      >
        Open Listening Quiz
      </button>
      <Dialog
        isOpen={isQuizDialogOpen}
        onClose={() => setIsQuizDialogOpen(false)}
        title={
          <div className="flex gap-4">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useAllQuizzes}
                onChange={() => {
                  setUseAllQuizzes(!useAllQuizzes);
                  // Reset answers when switching between modes
                  setUserAnswers({});
                  setShowResults(false);
                  setCurrentQuestionIndex(0);
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
        }
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
        <div className="relative h-full">
          <div className="flex flex-col">
            {/* Current question display */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">
                Question {currentQuestionIndex + 1} of {activeQuizData.questions.length}
              </p>
              <QuizListeningQuestion
                key={currentQuestionIndex}
                index={currentQuestionIndex}
                audioPrompt={activeQuizData.questions[currentQuestionIndex].audioPrompt}
                question={activeQuizData.questions[currentQuestionIndex].question}
                options={activeQuizData.questions[currentQuestionIndex].options}
                answer={activeQuizData.questions[currentQuestionIndex].answer}
                reason={activeQuizData.questions[currentQuestionIndex].reason}
                userAnswer={userAnswers[currentQuestionIndex]}
                showResults={showResults}
                onAnswerSelect={handleAnswerSelect}
                onPlayAudio={() =>
                  handlePlayAudio(currentQuestionIndex, activeQuizData.questions[currentQuestionIndex].audioPrompt)
                }
                isPlaying={currentAudioIndex === currentQuestionIndex && isPlaying}
              />
            </div>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between mt-4 absolute bottom-0 w-full">
            <Button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              variant="default"
              disabled={currentQuestionIndex === 0}
            >
              Previous Question
            </Button>
            <Button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(activeQuizData.questions.length - 1, prev + 1))}
              variant="default"
              disabled={currentQuestionIndex === activeQuizData.questions.length - 1}
            >
              Next Question
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
