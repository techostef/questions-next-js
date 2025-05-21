import { useQuery } from '@tanstack/react-query';

export interface EnglishWord {
  word: string;
  mean: string;
  description: string;
  antonym: string;
  synonyms: string;
  v1: string;
  v2: string;
  v3: string;
  exampleSentence1: string;
  exampleSentence2: string;
  exampleSentence3: string;
}

// React Query key for vocabulary data
export const VOCABULARY_QUERY_KEY = ['vocabulary-data'];

// Function to fetch vocabulary data from the API
const fetchVocabulary = async (): Promise<EnglishWord[]> => {
  const response = await fetch('/api/bank-english');
  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

// Custom hook to fetch vocabulary data with React Query
export const useVocabulary = () => {
  return useQuery({
    queryKey: VOCABULARY_QUERY_KEY,
    queryFn: fetchVocabulary,
    staleTime: 60 * 60 * 1000, // Consider data fresh for 1 hour
    gcTime: 60 * 60 * 1000, // Keep unused data in cache for 1 hour
  });
};
