/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import OpenAI from 'openai';

// Socket.io server instance for audio streaming
let io: SocketIOServer | null = null;

// Initialize OpenAI client
let openai: OpenAI | null = null;

export const initSocketServer = (server: NetServer) => {
  if (io) return io;
  
  // Create new Socket.io server
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });
  
  // Initialize OpenAI client
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not defined in environment variables');
    } else {
      openai = new OpenAI({ apiKey });
    }
  }

  // Handle socket connections
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    let audioBuffer: Buffer[] = [];
    
    // Handle audio chunk from client
    socket.on('audio-chunk', async (chunk: Buffer) => {
      try {
        audioBuffer.push(Buffer.from(chunk));
        
        // Process audio after collecting enough chunks (about 3 seconds worth)
        if (audioBuffer.length >= 3) {
          console.log(`Processing ${audioBuffer.length} audio chunks`);
          
          // Concatenate audio chunks
          const audioBlob = Buffer.concat(audioBuffer);
          
          // Reset buffer for next batch
          audioBuffer = [];
          
          if (!openai) {
            socket.emit('error', 'OpenAI client not initialized');
            return;
          }
          
          try {
            // Create a temporary file with the audio data
            // const audioBase64 = audioBlob.toString('base64');
            
            // 1. Send to OpenAI for transcription
            const transcriptionResponse = await openai.audio.transcriptions.create({
              file: new File([audioBlob], 'audio.webm', { type: 'audio/webm' }),
              model: 'whisper-1',
            });
            
            const transcript = transcriptionResponse.text;
            console.log('Transcription:', transcript);
            
            // Send transcript to client
            socket.emit('transcript', transcript);
            
            if (!transcript || transcript.trim() === '') {
              return; // No text to process
            }
            
            // 2. Get AI response with streaming
            const chatStream = await openai.chat.completions.create({
              model: 'gpt-3.5-turbo',
              stream: true,
              messages: [{ 
                role: 'system', 
                content: 'You are a helpful voice assistant. Provide clear, concise responses suitable for speech output.'
              }, {
                role: 'user', 
                content: transcript 
              }],
            });
            
            // Process the stream chunks
            let aiResponse = '';
            for await (const part of chatStream) {
              const content = part.choices[0]?.delta?.content || '';
              aiResponse += content;
              
              // Send each chunk to client for real-time display
              if (content) {
                socket.emit('ai-text-chunk', content);
              }
            }
            
            // Send complete response when done
            socket.emit('ai-text-complete', aiResponse);
            
          } catch (error: any) {
            console.error('Error processing audio:', error);
            socket.emit('error', `Error processing audio: ${error.message || 'Unknown error'}`);
          }
        }
      } catch (error: any) {
        console.error('Error handling audio chunk:', error);
        socket.emit('error', `Server error: ${error.message || 'Unknown error'}`);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
  
  console.log('Socket.io server initialized');
  return io;
};

export const getSocketServer = () => io;
