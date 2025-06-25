import { create } from 'zustand';

export interface Question {
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  answer: string;
  reason: string;
}

// Using the same Questions interface as in AskQuestion.tsx
export interface Questions {
  questions: Question[];
}

interface QuizState {
  // Current active quiz data
  quizData: Questions | null;
  setQuizData: (data: Questions | null) => void;
  
  // Collection of all quiz data
  allQuizData: Questions[];
  setAllQuizData: (data: Questions[]) => void;
  removeQuizFromCollection: (key: string) => void;
}

// Create the store with the state and actions
export const useQuizStore = create<QuizState>((set) => ({
  // Current active quiz data
  quizData: null,
  setQuizData: (data) => set({ quizData: data }),
  
  // Collection of all quiz data
  allQuizData: [],
  setAllQuizData: (data) => set({ allQuizData: data }),
  
  // Remove a quiz from the collection
  removeQuizFromCollection: (key) => set((state) => {
    const newAllQuizData = { ...state.allQuizData };
    delete newAllQuizData[key];
    return { allQuizData: newAllQuizData };
  }),
}));
