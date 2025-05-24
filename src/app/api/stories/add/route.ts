import { NextResponse } from 'next/server';
import type { Story } from '@/types/story';
import { updateGist } from '@/utils/githubGist';

// Gist ID for stories
const GIST_ID = "3bb901e5cc649b71412f45aa9540aea7";
const FILE_NAME = "stories.json";

export async function POST(req: Request) {
  try {
    const { story } = await req.json();
    
    if (!story || !story.id || !story.title || !story.content || !story.difficulty) {
      return NextResponse.json({ error: 'Missing required story fields' }, { status: 400 });
    }
    
    // Calculate word count
    const wordCount = story.content
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
    
    // Set word count
    story.words = wordCount;
    
    // Get existing stories from Gist
    let stories: Story[] = [];
    try {
      // Try to fetch existing stories
      const response = await fetch(`https://gist.githubusercontent.com/techostef/${GIST_ID}/raw/${FILE_NAME}`);
      if (response.ok) {
        stories = await response.json();
      }
    } catch (error) {
      console.error('Error fetching existing stories:', error);
      // Continue with empty stories array if fetch fails
    }
    
    // Check if story with same ID already exists
    const existingIndex = stories.findIndex((s: Story) => s.id === story.id);
    if (existingIndex >= 0) {
      // Update existing story
      stories[existingIndex] = story;
    } else {
      // Add new story
      stories.push(story);
    }
    
    // Update Gist with new stories
    await updateGist(GIST_ID, FILE_NAME, stories);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Story saved successfully',
      story: story
    });
    
  } catch (error) {
    console.error('Error adding story:', error);
    return NextResponse.json({ 
      error: 'Failed to add story',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
