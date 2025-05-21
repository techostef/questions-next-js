/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getCachedResult,
  setAllCachedResults,
} from "@/lib/cache";

const URL_CACHE =
  "https://gist.githubusercontent.com/techostef/ad1d8a1f85b5e6f4fa5092b0b5b982d4/raw/english.json";

// GET handler to retrieve all cached results or specific results by key
export async function POST(req: Request) {
  try {
    const { messages, cacheIndex } = await req.json();
    // If a key is provided, return the specific cached result
    if (messages) {
      const cachedResults = getCachedResult(messages);
      if (!cachedResults) {
        return new Response(
          JSON.stringify({ error: "No cached data found for this key" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const cachedResultLength = cachedResults.length;
      const randomIndex = cacheIndex || Math.floor(Math.random() * cachedResultLength);
      const randomCached = cachedResults[randomIndex];

      return Response.json({ ...randomCached });
    }

    return new Response(
      JSON.stringify({ error: "No cached data found for this key" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET() {
  try {
    const response = await fetch(URL_CACHE);
    const data = await response.json();
    const result = data?.result ? { ...data?.result } : { ...data };
    setAllCachedResults(result);
    return Response.json(result);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
