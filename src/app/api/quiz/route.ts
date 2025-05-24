/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAI } from "openai";
import { updateGist } from '@/utils/githubGist';
import { getCachedResult, setCachedResult } from "@/lib/cache";

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default model selection
const DEFAULT_MODEL = "gpt-4.1-mini";

const GIST_ID = 'ad1d8a1f85b5e6f4fa5092b0b5b982d4';

const URL_CACHE =
  `https://gist.githubusercontent.com/techostef/${GIST_ID}/raw/english.json`;

export async function POST(req) {
  try {
    const { messages, model } = await req.json();
    
    // Get model from request body, headers, or use default
    const selectedModel = model || req.headers.get('x-chat-model') || DEFAULT_MODEL;

    const cachedResult = getCachedResult(messages);
    const additionalMessage = cachedResult ? ".Please give me another questions." : "";

    const completion = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        ...messagesWithSystem,
        { role: "user" as any, content: messages + additionalMessage },
      ],
      response_format: { type: 'text' },
    });

    // Get data list questions from gists
    const response = await fetch(URL_CACHE);
    const data = await response.json();
    const result = data?.result ? { ...data?.result } : { ...data };
    if (result[messages]) {
      result[messages].push(completion.choices[0].message);
    } else {
      result[messages] = [completion.choices[0].message];
    }

    // Use the utility function to update the Gist
    await updateGist(GIST_ID, 'english.json', result);

    // Store the result in our shared cache
    setCachedResult(messages, completion.choices[0].message);

    return Response.json(completion.choices[0].message);
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
