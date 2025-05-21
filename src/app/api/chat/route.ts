/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
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
