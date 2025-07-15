/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAI } from "openai";

// Initialize OpenAI with runtime environment variables
const getOpenAIClient = () => {
  // Ensure this runs at request time, not build time
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

// Default model for image generation
const DEFAULT_IMAGE_MODEL = "dall-e-3";

export async function POST(req: Request) {
  try {
    // Get OpenAI client at runtime
    const openai = getOpenAIClient();
    
    const { prompt, model, size = "1024x1024", quality = "standard", referenceImage } = await req.json();
    
    // Validate required parameters
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
      });
    }

    // Get model from request body or use default
    const selectedModel = model || DEFAULT_IMAGE_MODEL;

    // Check if we have a reference image and it's DALL-E 3 (which supports image references)
    let finalPrompt = prompt;
    if (referenceImage && selectedModel === "dall-e-3") {
      // Append a note that there's a reference image if the user hasn't mentioned it
      // This helps OpenAI understand that we want to reference the image analysis
      if (!finalPrompt.toLowerCase().includes("reference image")) {
        const analysisResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an assistant that helps craft image generation prompts. You'll be given a user's instruction and a reference image. Your job is to create a prompt that incorporates details from the reference image but applies the changes the user wants."
            },
            {
              role: "user",
              content: [
                { 
                  type: "text", 
                  text: `User prompt: ${prompt}\n\nPlease create an effective DALL-E 3 prompt that incorporates the reference image details but applies the changes requested. Respond only with the prompt, no explanations.` 
                },
                { 
                  type: "image_url", 
                  image_url: { url: referenceImage } 
                }
              ]
            }
          ],
          max_tokens: 300,
        });
        
        // Use the enhanced prompt if available
        if (analysisResponse.choices[0]?.message?.content) {
          finalPrompt = analysisResponse.choices[0].message.content;
          console.log("Enhanced prompt with GPT-4o:", finalPrompt);
        }
      }
    }

    // Call OpenAI image generation API
    const response = await openai.images.generate({
      model: selectedModel,
      prompt: finalPrompt,
      n: 1,
      size: size as "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792",
      quality: quality as "standard" | "hd",
      response_format: "url",
    });

    return Response.json({
      url: response.data[0].url,
      revised_prompt: response.data[0].revised_prompt
    });
  } catch (error: any) {
    console.error("Image generation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
