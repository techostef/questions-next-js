/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'

// Check if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Add error handling for missing environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase environment variables are missing!')
  console.error('Please make sure your .env file contains:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types for the quiz data structure
export interface QuizOption {
  a: string
  b: string
  c: string
  d: string
}

export interface QuizQuestion {
  question: string
  options: QuizOption
  answer: string
  reason: string
}

export interface QuizResponse {
  role: 'assistant'
  content: string
  refusal: null
  annotations: any[]
}

export interface QuizData {
  questions: QuizQuestion[]
}

export interface CacheEntry {
  id?: number
  query: string
  responses: QuizResponse[]
  created_at?: string
  updated_at?: string
}
