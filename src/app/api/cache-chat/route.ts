/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getCachedResult,
  getAllCachedResults,
  setAllCachedResults,
} from "@/lib/cache";

const URL_CACHE =
  "https://gist.githubusercontent.com/techostef/ad1d8a1f85b5e6f4fa5092b0b5b982d4/raw/english.json";

// GET handler to retrieve all cached results or specific results by key
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log("messages", messages);

    // If a key is provided, return the specific cached result
    if (messages) {
      const cachedResults = getCachedResult(messages);
      console.log("cachedResults.length", cachedResults?.length);
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
      const randomIndex = Math.floor(Math.random() * cachedResultLength);
      console.log("randomIndex", randomIndex);
      const randomCached = cachedResults[randomIndex];
      if (randomIndex === 0) {
        console.log("randomCached", randomCached);
      }

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

function isNotEmptyObject(obj) {
  if (!obj) return false;
  return Object.keys(obj).length > 0;
}

export async function GET() {
  try {
    const cachedResults = getAllCachedResults();
    console.log("cachedResults", cachedResults);
    if (!isNotEmptyObject(cachedResults)) {
      // fetch api
      const response = await fetch(URL_CACHE);
      const data = await response.json();
      const result = data?.result ? { ...data?.result } : { ...data };
      setAllCachedResults(result);
      return Response.json(result);
    }
    return Response.json(cachedResults);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
