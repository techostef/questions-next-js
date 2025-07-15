/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAI } from "openai";

// Initialize OpenAI with runtime environment variables
const getOpenAIClient = () => {
  // Ensure this runs at request time, not build time
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

export async function POST(req: Request) {
  try {
    // Get OpenAI client at runtime
    const openai = getOpenAIClient();
    
    const { image } = await req.json();
    
    if (!image) {
      return new Response(JSON.stringify({ error: "Image data is required" }), {
        status: 400,
      });
    }

    // Call OpenAI's vision model to analyze the image
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using a model with vision capabilities
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that analyzes images. Provide a detailed description of what you see in the image, including objects, colors, composition, style, and any notable elements. Keep your description under 150 words. Focus on details that would be helpful for someone wanting to generate a similar or improved version of this image."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Please describe this image in detail." },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ],
      max_tokens: 300,
    });

    return Response.json({
      analysis: response.choices[0].message.content
    });
  } catch (error: any) {
    console.error("Image analysis error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
