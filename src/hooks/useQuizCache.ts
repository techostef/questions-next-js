import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type FetchCacheOptions = {
  message: string;
  cacheIndex?: number;
};

// Keys for React Query cache
export const QUIZ_CACHE_KEYS = {
  all: ['quiz-cache'] as const,
  count: () => [...QUIZ_CACHE_KEYS.all, 'count'] as const,
  specific: (message: string) => [...QUIZ_CACHE_KEYS.all, 'specific', message] as const,
  all_cache: () => [...QUIZ_CACHE_KEYS.all, 'all-cache'] as const,
};

// Function to fetch quiz from cache
const fetchQuizFromCache = async (options: FetchCacheOptions) => {
  const { message, cacheIndex } = options;
  
  const response = await fetch('/api/cache-quiz', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: message,
      cacheIndex,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch quiz from cache');
  }
  
  return response.json();
};

// Function to fetch all cached quizzes
const fetchAllCachedQuizzes = async () => {
  const response = await fetch('/api/cache-quiz', {
    method: 'GET',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch all cached quizzes');
  }
  
  return response.json();
};

export const useQuizCache = () => {
  // We'll use queryClient for cache invalidation
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Mutation for fetching a specific quiz from cache
  const quizFromCacheMutation = useMutation({
    mutationFn: fetchQuizFromCache,
    onError: (error: Error) => {
      setErrorMessage(error.message);
    },
    onSuccess: () => {
      // Invalidate related queries when we successfully fetch from cache
      queryClient.invalidateQueries({ queryKey: QUIZ_CACHE_KEYS.all_cache() });
    },
  });
  
  // Query for fetching all cached quizzes
  const { data, isLoading: isLoadingAllCache, refetch: refetchAllCache } = useQuery({
    queryKey: QUIZ_CACHE_KEYS.all_cache(),
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
    isLoading: quizFromCacheMutation.isPending || isLoadingAllCache,
    errorMessage,
    clearError: () => setErrorMessage(''),
  };
};
