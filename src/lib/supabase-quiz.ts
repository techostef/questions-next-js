// Supabase quiz utilities for working with quiz listening data
import { supabase } from './supabase';
import { QuizResponse } from './supabase';

const TABLE_NAME = 'quiz_listening';

/**
 * Gets quiz listening data from Supabase
 * @param topic - The topic to get data for
 * @returns Promise that resolves with the quiz data
 */
export async function getQuizListeningData<T>(query: string): Promise<T> {
  // Query Supabase for the most recent entry matching the topic
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('responses')
    .eq('query', query)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // If entry doesn't exist yet, return an empty object
    if (error.code === 'PGRST116') {
      return {} as T;
    }
    throw new Error(`Failed to fetch quiz data: ${error.message}`);
  }

  return data.responses as T;
}

/**
 * Updates or inserts quiz listening data in Supabase
 * @param topic - The topic for the quiz data
 * @param data - The quiz data to store
 * @returns Promise that resolves when the update is complete
 */
export async function updateQuizListeningData<T>(query: string, data: T): Promise<void> {
  // Format date in Jakarta timezone (UTC+7) for consistency with the original code
  const jakartaTime = new Date();
  jakartaTime.setHours(jakartaTime.getHours() + 7);
  
  // Check if an entry for this topic already exists
  const { data: existingData, error: queryError } = await supabase
    .from(TABLE_NAME)
    .select('id')
    .eq('query', query)
    .limit(1);

  if (queryError && queryError.code !== 'PGRST116') {
    throw new Error(`Failed to query quiz data: ${queryError.message}`);
  }

  let error;
  
  if (existingData && existingData.length > 0) {
    // Update existing record
    const { error: updateError } = await supabase
      .from(TABLE_NAME)
      .update({ 
        responses: data,
        updated_at: jakartaTime.toISOString()
      })
      .eq('query', query);
    
    error = updateError;
  } else {
    // Insert new record
    const { error: insertError } = await supabase
      .from(TABLE_NAME)
      .insert({ 
        query, 
        responses: data,
        created_at: jakartaTime.toISOString(),
        updated_at: jakartaTime.toISOString()
      });
    
    error = insertError;
  }

  if (error) {
    throw new Error(`Failed to update quiz data: ${error.message}`);
  }
}

/**
 * Adds a new response to an existing topic in Supabase
 * @param topic - The topic to add the response to
 * @param response - The response to add
 */
export async function addQuizResponse(query: string, response: QuizResponse): Promise<void> {
  // Get existing data
  const data = await getQuizListeningData<Record<string, QuizResponse[]>>(query);

  // Add new response to the data
  if (data[query]) {
    data[query].push(response);
  } else {
    data[query] = [response];
  }

  // Update the data in Supabase
  await updateQuizListeningData(query, data);
}
