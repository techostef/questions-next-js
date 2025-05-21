export interface Option {
  a: string;
  b: string;
  c: string;
  d: string;
}

export type AllQuestions = Record<string, Question>

export interface Question {
  question: string;
  options: Option;
  answer: string;
  reason: string;
}

export interface QuizData {
  questions: Question[];
}

export interface QuizProps {
  quizData: QuizData;
}