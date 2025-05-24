/**
 * Utility functions for working with GitHub Gists
 */

/**
 * Updates a GitHub Gist with new content
 * @param gistId - The ID of the Gist to update
 * @param fileName - The name of the file in the Gist to update
 * @param content - The content to update the file with (will be stringified)
 * @param description - Optional custom description (defaults to timestamp)
 * @returns Promise that resolves when the update is complete
 */
export async function updateGist<T>(
  gistId: string,
  fileName: string,
  content: T,
  description?: string
): Promise<Response> {
  // Format date in Jakarta timezone (UTC+7)
  const jakartaTime = new Date();
  jakartaTime.setHours(jakartaTime.getHours() + 7);
  const jakartaTimeString = jakartaTime.toISOString().replace('Z', '+07:00');
  
  // Prepare update data
  const updateData = {
    description: description || `Updated via API on ${jakartaTimeString}`,
    files: {
      [fileName]: {
        content: JSON.stringify(content)
      }
    }
  };
  
  // Get GitHub token from environment
  const githubToken = process.env.GIT_UPDATE_SECRET;
  
  if (!githubToken) {
    throw new Error('GitHub token not found in environment variables');
  }
  
  // Call GitHub API to update the Gist
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${githubToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    },
    body: JSON.stringify(updateData)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update Gist: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response;
}

/**
 * Retrieves content from a GitHub Gist
 * @param gistId - The ID of the Gist to fetch
 * @param fileName - The name of the file in the Gist to retrieve
 * @returns Promise that resolves with the parsed content
 */
export async function getGistContent<T>(
  gistId: string,
  fileName: string
): Promise<T> {
  // Get GitHub token from environment
  const githubToken = process.env.GIT_UPDATE_SECRET;
  
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json'
  };
  
  // Add auth token if available
  if (githubToken) {
    headers['Authorization'] = `token ${githubToken}`;
  }
  
  // Call GitHub API to get the Gist
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Gist: ${response.status} ${response.statusText}`);
  }
  
  const gistData = await response.json();
  
  if (!gistData.files || !gistData.files[fileName]) {
    throw new Error(`File "${fileName}" not found in Gist`);
  }
  
  // Parse and return the content
  return JSON.parse(gistData.files[fileName].content) as T;
}
