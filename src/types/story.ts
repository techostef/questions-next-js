export interface Story {
  id: string;
  title: string;
  content: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  words: number;
}
