import { getGistContent } from "@/utils/githubGist";

const GIST_ID = "3bb901e5cc649b71412f45aa9540aea7";
const FILE_NAME = "stories.json"

export async function GET() {
  try {
    const data = await getGistContent(GIST_ID, FILE_NAME);
    return Response.json(data);
  } catch (error) {
    console.error('Error occurred while processing the request:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}