/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAI } from "openai";
import { getCachedResult, setCachedResult } from "@/lib/cache";
import { supabase } from "@/lib/supabase";

const formatChoosenJSON = `
{
  questions: {
    audioPrompt: string
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
      "You are a teacher of English listening skills. Create audio-based English listening quizzes. Each question should have an audio prompt (text that will be converted to speech), a related question, options a, b, c, d, the correct answer, and explanation. Create at least 5 questions. Response in JSON format like this: " +
      formatChoosenJSON,
  },
];

// Initialize OpenAI with runtime environment variables
const getOpenAIClient = () => {
  // Ensure this runs at request time, not build time
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

// Default model selection
const DEFAULT_MODEL = "gpt-4.1-mini";

// Topic identifier for the quiz data in Supabase

export async function GET() {
  try {
    // Get all quiz listening data from Supabase
    const { data, error } = await supabase
      .from('quiz_listening')
      .select('query, responses')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return Response.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    const { messages, model } = await req.json();

    // Get model from request body, headers, or use default
    const selectedModel =
      model || req.headers.get("x-chat-model") || DEFAULT_MODEL;

    // Get OpenAI client at runtime
    const openai = getOpenAIClient();

    const cachedResult = getCachedResult(`listening_${messages}`);
    const additionalMessage = cachedResult
      ? " Please give me another set of listening questions."
      : "";

    const completion = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        ...messagesWithSystem,
        { role: "user" as any, content: messages + additionalMessage },
      ],
      response_format: { type: "text" },
    });

    try {
      // Get existing responses for this query if they exist
      const { data: existingData, error: fetchError } = await supabase
        .from('quiz_listening')
        .select('responses, language')
        .eq('query', messages)
        .limit(1);
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error fetching existing data:", fetchError);
        throw fetchError;
      }

      // Format the new response
      const newResponse = completion.choices[0].message;
      
      // If we have existing responses for this query, append the new one
      if (existingData && existingData.length > 0 && Array.isArray(existingData[0].responses)) {
        // Update the existing record with the appended response
        const { error: updateError } = await supabase
          .from('quiz_listening')
          .update({ 
            language: existingData[0].language,
            responses: [...existingData[0].responses, newResponse],
            updated_at: new Date().toISOString()
          })
          .eq('query', messages);
          
        if (updateError) {
          console.error("Error updating Supabase:", updateError);
          throw updateError;
        }
      } else {
        // Insert a new record
        const { error: insertError } = await supabase
          .from('quiz_listening')
          .insert({
            query: messages,
            language: "English",
            responses: [newResponse],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (insertError) {
          console.error("Error inserting into Supabase:", insertError);
          throw insertError;
        }
      }
    } catch (error) {
      console.error("Error updating Supabase:", error);
      // Continue even if Supabase update fails
    }

    // Store the result in our shared cache
    setCachedResult(`listening_${messages}`, completion.choices[0].message);

    return Response.json(completion.choices[0].message);
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
