import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { DEFAULT_CHAT_MODEL } from '@/constants/listModelsOpenAI';
import { updateGist } from '@/utils/githubGist';

// Gist ID for bank-english
const GIST_ID = '1556b6ba9012fab30e737c03bade8c7e';

// URL to fetch the current content
const URL_CACHE = `https://gist.githubusercontent.com/techostef/${GIST_ID}/raw/bankenglish.json`;

// Initialize OpenAI with runtime environment variables
const getOpenAIClient = () => {
  // Ensure this runs at request time, not build time
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

export async function POST(request: Request) {
  try {
    // Initialize OpenAI client at runtime, not build time
    const openai = getOpenAIClient();
    // Get model preference from headers or use default
    const modelFromHeader = request.headers.get('x-chat-model');
    
    // Parse the request body
    const body = await request.json();
    
    // Determine which model to use (in order of preference: body, header, default)
    const model = body.model || modelFromHeader || DEFAULT_CHAT_MODEL;
    
    if (!body.words || !Array.isArray(body.words) || body.words.length === 0 || body.words.length > 5) {
      return NextResponse.json({
        success: false,
        message: 'Please provide between 1 and 5 words'
      }, { status: 400 });
    }

    // Fetch existing dictionary data
    const existingDataResponse = await fetch(URL_CACHE);
    const data = await existingDataResponse.json();
    const wordList = data?.result ? data.result : data;

    // Process each word
    const newWords = [];
    
    for (const word of body.words) {
      // Define interface for word structure
      interface WordDictionaryItem {
        word: string;
        mean: string;
        description: string;
        antonym: string;
        synonyms: string;
        v1: string;
        v2: string;
        v3: string;
        exampleSentence1: string;
        exampleSentence2: string;
        exampleSentence3: string;
      }
      
      // Check if word already exists
      const exists = wordList.some((item: WordDictionaryItem) => 
        item.word.toLowerCase() === word.toLowerCase()
      );
      
      if (exists) {
        continue; // Skip existing words
      }

      // Query OpenAI for word information
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "system",
            content: `You are a helpful English dictionary assistant. Provide detailed information about the given word in JSON format with these fields exactly:
            {
              "word": "the word itself",
              "mean": "translate to Bahasa Indonesia",
              "description": "more detailed description in English",
              "antonym": "comma-separated list of antonyms",
              "synonyms": "comma-separated list of synonyms",
              "v1": "present form (if applicable for verbs)",
              "v2": "past form (if applicable for verbs)",
              "v3": "past participle form (if applicable for verbs)",
              "exampleSentence1": "first example sentence using the word",
              "exampleSentence2": "second example sentence using the word",
              "exampleSentence3": "third example sentence using the word"
            }`
          },
          {
            role: "user",
            content: `Provide information about the word "${word}" in the exact JSON format. Do not include any explanatory text, just the JSON.`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      try {
        const wordData = JSON.parse(completion.choices[0].message.content);
        newWords.push(wordData);
      } catch (error) {
        console.error(`Error parsing OpenAI response for word "${word}":`, error);
      }
    }
    
    // Add new words to the list
    const updatedWordList = [...wordList, ...newWords];
    
    // Update the gist
    const githubToken = process.env.GIT_UPDATE_SECRET;
    
    if (!githubToken) {
      return NextResponse.json({
        success: false,
        message: 'GitHub token not found in environment variables'
      }, { status: 500 });
    }
    
    await updateGist(GIST_ID, 'bankenglish.json', updatedWordList);
    
    return NextResponse.json({
      success: true,
      message: `Successfully added ${newWords.length} new words`,
      addedWords: newWords.map(w => w.word)
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to process request',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
