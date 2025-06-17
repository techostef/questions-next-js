/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAI } from "openai";
import { getGistContent, updateGist } from "@/utils/githubGist";
import { getCachedResult, setCachedResult } from "@/lib/cache";

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

const GIST_ID = "bc9350af3cd7821a465e5b4ece52da02";

export async function GET() {
  try {
    const data = await getGistContent(GIST_ID, "listening.json");
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
      // Get data list questions from gists
      const data = await getGistContent(GIST_ID, "listening.json");

      if (data[messages]) {
        data[messages].push(completion.choices[0].message);
      } else {
        data[messages] = [completion.choices[0].message];
      }

      // Use the utility function to update the Gist
      await updateGist(GIST_ID, "listening.json", data);
    } catch (error) {
      console.error("Error updating gist:", error);
      // Continue even if gist update fails
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
