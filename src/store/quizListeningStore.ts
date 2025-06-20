import { create } from 'zustand';

// Define the structure for listening quiz questions
export interface ListeningQuizQuestion {
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
}

// Define the structure for listening quiz data
export interface ListeningQuizData {
  questions: ListeningQuizQuestion[];
}

// Interface for the quiz listening store
interface QuizListeningStore {
  quizData: ListeningQuizData | null;
  allQuizData: ListeningQuizData[];
  quizCollection: Record<string, ListeningQuizData>;
  currentAudioIndex: number;
  setQuizData: (data: ListeningQuizData | null) => void;
  setAllQuizData: (data: ListeningQuizData[]) => void;
  setCurrentAudioIndex: (index: number) => void;
}

// Create the quiz listening store
const useQuizListeningStore = create<QuizListeningStore>((set) => ({
  quizData: null,
  allQuizData: [],
  quizCollection: {},
  currentAudioIndex: -1,
  
  setQuizData: (data) => set({ quizData: data }),
  
  setAllQuizData: (data) => set({ allQuizData: data }),
  
  setCurrentAudioIndex: (index) => set({ currentAudioIndex: index }),
  
}));

export { useQuizListeningStore };
