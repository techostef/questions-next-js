import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default models
const DEFAULT_CHAT_MODEL = 'gpt-4.1-mini';
const DEFAULT_AUDIO_MODEL = 'whisper-1';

// Store active conversations
const activeConversations = new Map();

// Get or create a conversation based on session ID
function getConversation(sessionId: string) {
  if (!activeConversations.has(sessionId)) {
    activeConversations.set(sessionId, {
      conversationHistory: [
        { 
          role: 'system', 
          content: 'You are a helpful voice assistant. Provide clear, concise responses suitable for speech output. Format your responses in markdown.'
        }
      ],
      processing: false,
      lastRequestTime: Date.now()
    });
  }
  return activeConversations.get(sessionId);
}

// Clean up old conversations (run this periodically)
function cleanupOldConversations() {
  const now = Date.now();
  activeConversations.forEach((conversation, sessionId) => {
    // If conversation hasn't been used in 30 minutes, remove it
    if (now - conversation.lastRequestTime > 30 * 60 * 1000) {
      activeConversations.delete(sessionId);
    }
  });
}

// Run cleanup every 15 minutes
setInterval(cleanupOldConversations, 15 * 60 * 1000);

export async function POST(req: NextRequest) {
  try {
    // Extract session ID from cookies or headers
    const sessionId = req.cookies.get('session-id')?.value || req.headers.get('x-session-id') || 'default';
    
    // Get conversation for this session
    const conversation = getConversation(sessionId);
    
    // Update last request time
    conversation.lastRequestTime = Date.now();
    
    // If already processing, return busy status
    if (conversation.processing) {
      return NextResponse.json({ 
        error: 'Currently processing another request' 
      }, { status: 429 });
    }
    
    // Mark as processing
    conversation.processing = true;
    
    // Get the audio data from the request
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      conversation.processing = false;
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    
    // Create a temporary file to save the audio
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `audio-${Date.now()}.webm`);
    
    // Write the audio file to disk
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    fs.writeFileSync(tempFilePath, buffer);
    
    try {
      // Get audio model from headers or use default
      const audioModel = req.headers.get('x-audio-model') || DEFAULT_AUDIO_MODEL;
      
      // Transcribe the audio
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: audioModel,
        language: 'en',
      });
      
      const transcript = transcription.text;
      
      // Add user's transcript to conversation history
      conversation.conversationHistory.push({
        role: 'user',
        content: transcript
      });
      
      // Clean up temp file
      try { fs.unlinkSync(tempFilePath); } catch { /* ignore cleanup errors */ }
      
      // Get chat model from headers or use default
      const chatModel = req.headers.get('x-chat-model') || DEFAULT_CHAT_MODEL;
      
      // Generate AI response
      const chatCompletion = await openai.chat.completions.create({
        model: chatModel,
        messages: conversation.conversationHistory,
        response_format: { type: 'text' },
      });
      
      const aiResponse = chatCompletion.choices[0].message.content;
      
      // Add AI response to conversation history
      conversation.conversationHistory.push({
        role: 'assistant',
        content: aiResponse
      });
      
      // Limit conversation history to prevent token limits (keep last 10 exchanges)
      if (conversation.conversationHistory.length > 21) { // 1 system + 10 user/assistant pairs
        // Always keep the system message
        const systemMessage = conversation.conversationHistory[0];
        conversation.conversationHistory = [
          systemMessage,
          ...conversation.conversationHistory.slice(-20) // Keep last 20 messages
        ];
      }
      
      // Reset processing flag
      conversation.processing = false;
      
      // Return both transcript and AI response
      return NextResponse.json({ 
        transcript,
        aiResponse,
        conversationHistory: conversation.conversationHistory.filter(msg => msg.role !== 'system')
      });
      
    } catch (error) {
      // Clean up temp file on error
      try { fs.unlinkSync(tempFilePath); } catch { /* ignore cleanup errors */ }
      
      // Reset processing flag
      conversation.processing = false;
      
      return NextResponse.json({ 
        error: `Error processing audio: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }, { status: 500 });
    }
    
  } catch (error) {
    return NextResponse.json({ 
      error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}

// Get conversation history
export async function GET(req: NextRequest) {
  // Extract session ID from cookies or headers
  const sessionId = req.cookies.get('session-id')?.value || req.headers.get('x-session-id') || 'default';
  
  // Get conversation for this session
  const conversation = getConversation(sessionId);
  
  // Return conversation history without system message
  return NextResponse.json({ 
    conversationHistory: conversation.conversationHistory.filter(msg => msg.role !== 'system') 
  });
}

// Clear conversation history
export async function DELETE(req: NextRequest) {
  try {
    // Extract session ID from cookies or headers
    const sessionId = req.cookies.get('session-id')?.value || req.headers.get('x-session-id') || 'default';
    
    // Check if we have this conversation
    if (activeConversations.has(sessionId)) {
      // Reset to initial state with just the system message
      activeConversations.set(sessionId, {
        conversationHistory: [
          { 
            role: 'system', 
            content: 'You are a helpful voice assistant. Provide clear, concise responses suitable for speech output. Format your responses in markdown.'
          }
        ],
        processing: false,
        lastRequestTime: Date.now()
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Conversation history cleared successfully' 
      });
    } else {
      // If no conversation exists, just return success
      return NextResponse.json({ 
        success: true, 
        message: 'No conversation found to clear'
      });
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: `Error clearing conversation: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
