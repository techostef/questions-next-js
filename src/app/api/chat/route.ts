/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAI } from "openai";

// Initialize OpenAI with runtime environment variables
const getOpenAIClient = () => {
  // Ensure this runs at request time, not build time
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

// Default model selection
const DEFAULT_MODEL = "gpt-4.1-mini";

export async function POST(req: Request) {
  try {
    // Get OpenAI client at runtime
    const openai = getOpenAIClient();
    
    const { messages, model } = await req.json();
    
    // Get model from request body, headers, or use default
    const selectedModel = model || req.headers.get('x-chat-model') || DEFAULT_MODEL;

    const completion = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Provide clear and concise responses. Format your responses in markdown for better readability."
        },
        { role: "user", content: messages }
      ],
      response_format: { type: 'text' },
    });

    return Response.json(completion.choices[0].message);
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
