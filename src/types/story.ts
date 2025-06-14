export interface Story {
  id: string;
  title: string;
  content: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "custom";
  words: number;
}

export interface StoryPart {
  part: number;
  content: string;
  words: number;
}

export interface WordMatch {
  word: string;
  matched: boolean;
  timestamp: number;
}

export interface ReadingAttempt {
  storyId: string;
  date: number;
  recordedAudio?: string; // Base64 encoded audio
  accuracy: number;
  duration: number;
  missedWords: MissedWord[];
  matchedWords: WordMatch[];
}

export interface MissedWord {
  index: number;
  word: string;
}