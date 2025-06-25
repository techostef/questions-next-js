import { supabase } from './supabase';

// Define the WordDictionaryItem type based on what's in the existing code
export interface WordDictionaryItem {
  id?: number;
  word: string;
  mean: string;
  description: string;
  antonym: string;
  synonyms: string;
  v1: string;
  v2: string;
  v3: string;
  example_sentence1: string;
  example_sentence2: string;
  example_sentence3: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetches all words from the bank_english table
 * @returns Promise that resolves with array of dictionary items
 */
export async function getAllWords(): Promise<WordDictionaryItem[]> {
  const { data, error } = await supabase
    .from('bank_english')
    .select('*')
    .order('id');
  
  if (error) {
    throw new Error(`Failed to fetch words: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Adds new words to the bank_english table
 * @param words - Array of words to add
 * @returns Promise with insertion result
 */
export async function addWords(words: WordDictionaryItem[]): Promise<{
  success: boolean;
  addedCount: number;
  error?: string;
}> {
  try {
    // Insert the words into the database
    const { error, count } = await supabase
      .from('bank_english')
      .insert(words)
      .select();
    
    if (error) {
      return {
        success: false,
        addedCount: 0,
        error: error.message
      };
    }
    
    return {
      success: true,
      addedCount: count || 0
    };
  } catch (error) {
    return {
      success: false,
      addedCount: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Checks if a word already exists in the bank_english table
 * @param word - Word to check
 * @returns Promise that resolves with boolean indicating existence
 */
export async function wordExists(word: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('bank_english')
    .select('id')
    .eq('word', word)
    .maybeSingle();
  
  if (error) {
    throw new Error(`Error checking word existence: ${error.message}`);
  }
  
  return data !== null;
}
