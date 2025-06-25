/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { OpenAI } from "openai";
import { supabase } from '@/lib/supabase';

// GET - List all quiz queries or get specific quiz data
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (query) {
      // Get specific quiz data
      const { data, error } = await supabase
        .from('quiz_cache')
        .select('*')
        .eq('query', query)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Response.json({ error: 'Quiz not found' }, { status: 404 });
        }
        throw error;
      }

      return Response.json(data);
    } else {
      // Get all quiz queries
      const { data, error } = await supabase
        .from('quiz_cache')
        .select('id, language, query, responses, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return Response.json(data);
    }
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}


const formatChoosenJSON = `
{
  questions: {
    question: string
    options: {
      a: string
      b: string
      c: string
      d: string
    }
    answer: string
    reason: string
  }[]
}
`;
const messagesWithSystem = [
  {
    role: "system",
    content:
      "You are a teacher of English. Any question should be a, b, c, d and at least 10 questions, please include the answer and reason the answer. Response in JSON format like this: " +
      formatChoosenJSON,
  },
];
const DEFAULT_MODEL = "gpt-4.1-mini";
// Initialize OpenAI with runtime environment variables
const getOpenAIClient = () => {
  // Ensure this runs at request time, not build time
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};
// POST - Add or update quiz data
export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json();

    const { data: dataGet, error: errorGet } = await supabase
        .from('quiz_cache')
        .select('*')
        .eq('query', messages)
        .single();
    
    if (errorGet) {
      throw errorGet;
    }
      
    // Get model from request body, headers, or use default
    const selectedModel = model || req.headers.get('x-chat-model') || DEFAULT_MODEL;

    // Get OpenAI client at runtime
    const openai = getOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        ...messagesWithSystem,
        { role: "user" as any, content: messages },
      ],
      response_format: { type: 'text' },
    });
   
    const responses = completion.choices[0].message;

    // merge dataGet and responses
    const mergedResponses = [...(dataGet?.responses ?? []), responses];

    const { data, error } = await supabase
      .from('quiz_cache')
      .upsert({
        query: messages,
        language: dataGet?.language,
        responses: mergedResponses
      }, {
        onConflict: 'query'
      })
      .select();

    if (error) {
      throw error;
    }

    return Response.json({ 
      message: 'Quiz data saved successfully', 
      data 
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove quiz data
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query) {
      return Response.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('quiz_cache')
      .delete()
      .eq('query', query);

    if (error) {
      throw error;
    }

    return Response.json({ 
      message: 'Quiz data deleted successfully' 
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
