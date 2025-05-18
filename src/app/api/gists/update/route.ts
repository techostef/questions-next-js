import { NextResponse } from 'next/server';

// Gist ID from your URL
const GIST_ID = 'ad1d8a1f85b5e6f4fa5092b0b5b982d4';

export async function GET() {
  try {
    // Parse the request body

    // Get GitHub token - use the GIT_UPDATE_SECRET as GitHub personal access token
    const githubToken = process.env.GIT_UPDATE_SECRET;
    
    if (!githubToken) {
      return NextResponse.json({
        success: false,
        message: 'GitHub token not found in environment variables'
      }, { status: 500 });
    }

    // Prepare the API request to update the Gist
    
    // Format date in Jakarta timezone (UTC+7)
    const jakartaTime = new Date();
    jakartaTime.setHours(jakartaTime.getHours() + 7);
    const jakartaTimeString = jakartaTime.toISOString().replace('Z', '+07:00');
    
    const updateData = {
      description: `Updated via API on ${jakartaTimeString}`,
      files: {
        'english.json': {
          content: JSON.stringify({})
        }
      }
    };
    
    // Call GitHub API to update the Gist
    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`GitHub API error: ${response.status} ${JSON.stringify(errorData)}`);
    }
    
    const updatedGist = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Gist updated successfully',
      gistUrl: updatedGist.html_url,
      updatedAt: updatedGist.updated_at
    });
    
  } catch (error) {
    console.error('Error updating Gist:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to update Gist',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
