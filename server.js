/* eslint-disable @typescript-eslint/no-require-imports */
// Custom Next.js server with Socket.io integration
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Track active client connections and processing status
// Track active client connections and their conversation history
const activeConnections = new Map();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize socket.io server
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Handle socket connections
  io.on('connection', (socket) => {
    // Store this connection if it's not already tracked
    if (!activeConnections.has(socket.id)) {
      // Check if the client sent a previous conversation history
      socket.on('load_conversation', (clientHistory) => {
        try {
          // Validate that the history is a proper array
          if (Array.isArray(clientHistory) && clientHistory.length > 0) {
            // Make sure the system message is preserved
            const hasSystemMessage = clientHistory.some(msg => msg.role === 'system');
            const history = hasSystemMessage ? clientHistory : [
              { 
                role: 'system', 
                content: 'You are a helpful voice assistant. Provide clear, concise responses suitable for speech output.'
              },
              ...clientHistory
            ];
            
            // Update the connection with the client's history
            const connInfo = activeConnections.get(socket.id);
            if (connInfo) {
              connInfo.conversationHistory = history;
            }
          }
        } catch (err) {
          // If anything goes wrong, we'll keep the default history
          console.error('Error loading conversation history:', err);
        }
      });
      
      // Create new connection with default history
      activeConnections.set(socket.id, {
        socket,
        processing: false,
        lastAudioTimestamp: 0,
        // Add conversation history to maintain context
        conversationHistory: [
          { 
            role: 'system', 
            content: 'You are a helpful voice assistant. Provide clear, concise responses suitable for speech output.'
          }
        ]
      });
      
      // Send the current conversation history to the client for syncing
      socket.emit('conversation_history', [
        // Skip the system message when sending to client
        ...activeConnections.get(socket.id).conversationHistory.filter(msg => msg.role !== 'system')
      ]);
    }
    
    // Handle disconnection
    socket.on('disconnect', () => {
      activeConnections.delete(socket.id);
    });
    
    let audioBuffer = [];
    
    // Handle audio chunk from client
    socket.on('audio-chunk', async (chunk) => {
      try {
        // Get this connection's info
        const connectionInfo = activeConnections.get(socket.id);
        if (!connectionInfo) {
          return;
        }
        
        // Prevent duplicate processing - if this connection is already processing audio, ignore new chunks
        if (connectionInfo.processing) {
          return;
        }
        
        // Add chunk to buffer
        audioBuffer.push(Buffer.from(chunk));
        
        // Process audio after collecting enough chunks (increased to 5 chunks = ~5 seconds)
        if (audioBuffer.length >= 5) {
          // Mark this connection as processing to prevent duplicate processing
          connectionInfo.processing = true;
          connectionInfo.lastAudioTimestamp = Date.now();
          
          try {
            // Concatenate audio chunks
            const audioBlob = Buffer.concat(audioBuffer);
            
            // Create OpenAI client
            const openai = new (require('openai')).OpenAI({
              apiKey: process.env.OPENAI_API_KEY,
            });
            
            // 1. Create a temporary file from the buffer
            const fs = require('fs');
            const tempFilePath = `./temp-audio-${Date.now()}.webm`;
            fs.writeFileSync(tempFilePath, audioBlob);
            
            let transcript;
            try {
              // Using the audio transcription API (more efficient for voice-to-text)
              const transcriptionResult = await openai.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: 'whisper-1',
                language: 'en',
              });
              transcript = transcriptionResult.text;
            } catch (transcriptError) {
              throw new Error('Failed to transcribe audio', transcriptError);
            } finally {
              // Clean up temp file
              try { fs.unlinkSync(tempFilePath); } catch { /* ignore cleanup errors */ }
            }
            
            // Get this connection's info and conversation history
            const connectionInfo = activeConnections.get(socket.id);
            if (!connectionInfo) return;
            
            // Add user's transcript to conversation history
            connectionInfo.conversationHistory.push({
              role: 'user',
              content: transcript
            });
            
            // 3. Send transcript to client
            socket.emit('transcript', transcript);
            
            // Make sure the client is still connected before proceeding
            if (!socket.connected) {
              return;
            }
            
            try {
                // We already have connectionInfo from above, no need to get it again
              if (!connectionInfo) return;
              // Create streaming chat completion request using full conversation history
              const chatCompletion = await openai.chat.completions.create({
                model: 'gpt-4.1-mini', 
                stream: true,
                messages: connectionInfo.conversationHistory,
              });
              
              let aiResponse = '';
              
              if (socket.connected) {
                socket.emit('ai-text-chunk', ''); // Empty chunk just to test connection
              } else {
                return;
              }
              
              // Iterate through the stream chunks
              for await (const chunk of chatCompletion) {
                
                // Extract the content from the chunk
                const content = chunk.choices[0]?.delta?.content || '';
                
                if (content) {
                  aiResponse += content;
                  
                  // Send chunk to client if still connected
                  if (socket.connected) {
                    socket.emit('ai-text-chunk', content);
                  } else {
                    break;
                  }
                }
              }
              
              // Send the complete response if client is still connected
              if (socket.connected) {
                if (aiResponse) {
                  // Save the AI's response to conversation history
                  connectionInfo.conversationHistory.push({
                    role: 'assistant',
                    content: aiResponse
                  });
                  
                  // Send the complete response to the client
                  socket.emit('ai-text-complete', aiResponse);
                  
                  // Limit conversation history to prevent token limits (keep last 10 exchanges)
                  if (connectionInfo.conversationHistory.length > 21) { // 1 system + 10 user/assistant pairs
                    // Always keep the system message
                    const systemMessage = connectionInfo.conversationHistory[0];
                    connectionInfo.conversationHistory = [
                      systemMessage,
                      ...connectionInfo.conversationHistory.slice(-20) // Keep last 20 messages
                    ];
                  }
                } else {
                  const fallbackResponse = "I'm sorry, I couldn't process your request properly. Could you please try again?";
                  socket.emit('ai-text-complete', fallbackResponse);
                  
                  // Add fallback response to history as well
                  connectionInfo.conversationHistory.push({
                    role: 'assistant',
                    content: fallbackResponse
                  });
                }
              }
              
              // Reset processing flag to allow future recordings
              if (connectionInfo) {
                connectionInfo.processing = false;
              }
            } catch (error) {
              
              if (socket.connected) {
                const errorResponse = "I'm sorry, I encountered an error while processing your request.";
                socket.emit('ai-text-complete', errorResponse);
                socket.emit('error', `OpenAI error: ${error.message || 'Unknown error'}`);
              }
              
              // Reset processing flag on error as well
              // Use the same connectionInfo variable from above
              if (connectionInfo) {
                connectionInfo.processing = false;
              }
            }
          } catch (error) {
            socket.emit('error', `Error processing audio: ${error.message || 'Unknown error'}`);
            
            // Reset processing flag in the outer error handler
            // Get the connection info here since we're in a different try/catch block
            const connInfo = activeConnections.get(socket.id);
            if (connInfo) {
              connInfo.processing = false;
            }
          }
          
          // Reset buffer for next batch
          audioBuffer = [];
        }
      } catch (error) {
        socket.emit('error', `Server error: ${error.message || 'Unknown error'}`);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
    });
  });

  server.listen(3000, () => {
    console.log('> Server listening on http://localhost:3000');
  });
});
