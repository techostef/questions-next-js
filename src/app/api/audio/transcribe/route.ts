import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI with runtime environment variables
const getOpenAIClient = () => {
  // Ensure this runs at request time, not build time
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

export async function POST(request: Request) {
  try {
    // Get OpenAI client at runtime
    const openai = getOpenAIClient();
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const expectedText = formData.get('expectedText') as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Convert the file to a Buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    // Create a temporary file for OpenAI
    const fileName = `audio_${Date.now()}.webm`;

    // Transcribe the audio using OpenAI
    const transcription = await openai.audio.transcriptions.create({
      file: new File([audioBuffer], fileName, { type: 'audio/webm' }),
      model: 'whisper-1',
      language: 'en',
    });

    // Return the transcription
    return NextResponse.json({
      transcript: transcription.text,
      expectedText
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error processing audio:', err.message);
    
    return NextResponse.json(
      { error: err.message || 'Failed to process audio' },
      { status: 500 }
    );
  }
}
