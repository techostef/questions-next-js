/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAI } from "openai";
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

// Cache is now managed by the shared cache module

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const cachedResult = getCachedResult(messages);
    const additionalMessage = cachedResult ? ".Please give me another questions." : "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        ...messagesWithSystem,
        { role: "user" as any, content: messages + additionalMessage },
      ],
    });

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
