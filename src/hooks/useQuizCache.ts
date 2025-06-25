import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// Keys for React Query cache
export const QUIZ_CACHE_KEYS = {
  all: ['quiz-cache'] as const,
};

// Function to fetch all cached quizzes
const fetchAllCachedQuizzes = async () => {
  const response = await fetch('/api/quiz-admin', {
    method: 'GET',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch all cached quizzes');
  }
  
  return response.json();
};

export const useQuizCache = () => {
  // We'll use queryClient for cache invalidation
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Query for fetching all cached quizzes
  const { data, isLoading: isLoadingAllCache, refetch: refetchAllCache } = useQuery({
    queryKey: QUIZ_CACHE_KEYS.all,
    queryFn: fetchAllCachedQuizzes,
    enabled: false, // Don't fetch on component mount
    staleTime: 60 * 60 * 1000, // Consider data fresh for 1 hour
    gcTime: 60 * 60 * 1000, // 1 hour
  });
  
  // Function to get all cached quizzes
  const getAllFromCache = async () => {
    setErrorMessage('');
    try {
      const result = await refetchAllCache();
      // Use the result directly without storing in a variable
      return { data: result.data };
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
        return { error: error.message };
      }
      return { error: 'An unknown error occurred' };
    }
  };
  
  return {
    data,
    getAllFromCache,
    isLoading: isLoadingAllCache,
    errorMessage,
    clearError: () => setErrorMessage(''),
  };
};
