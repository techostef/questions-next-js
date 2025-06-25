import { supabase, type QuizResponse } from '../lib/supabase';

// Function to add or update quiz data in Supabase
export async function addQuizData(query: string, responses: QuizResponse[]) {
  try {
    const { data, error } = await supabase
      .from('quiz_cache')
      .upsert({
        query,
        responses
      }, {
        onConflict: 'query'
      })
      .select();

    if (error) {
      throw new Error(`Failed to add quiz data: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error adding quiz data:', error);
    throw error;
  }
}

// Function to get all quiz queries
export async function getAllQuizQueries() {
  try {
    const { data, error } = await supabase
      .from('quiz_cache')
      .select('query, created_at, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get quiz queries: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error getting quiz queries:', error);
    throw error;
  }
}

// Function to get specific quiz data by query
export async function getQuizDataByQuery(query: string) {
  try {
    const { data, error } = await supabase
      .from('quiz_cache')
      .select('*')
      .eq('query', query)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No data found
      }
      throw new Error(`Failed to get quiz data: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error getting quiz data:', error);
    throw error;
  }
}

// Function to delete quiz data by query
export async function deleteQuizData(query: string) {
  try {
    const { error } = await supabase
      .from('quiz_cache')
      .delete()
      .eq('query', query);

    if (error) {
      throw new Error(`Failed to delete quiz data: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting quiz data:', error);
    throw error;
  }
}
