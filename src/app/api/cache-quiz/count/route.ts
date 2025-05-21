/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getAllCachedResults,
  setAllCachedResults,
} from "@/lib/cache";

const URL_CACHE =
  "https://gist.githubusercontent.com/techostef/ad1d8a1f85b5e6f4fa5092b0b5b982d4/raw/english.json";

function isNotEmptyObject(obj) {
  if (!obj) return false;
  return Object.keys(obj).length > 0;
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const cachedResults = getAllCachedResults();
    if (!isNotEmptyObject(cachedResults)) {
      // fetch api
      const response = await fetch(URL_CACHE);
      const data = await response.json();
      const result = data?.result ? { ...data?.result } : { ...data };
      setAllCachedResults(result);
      return Response.json(result[messages].length);
    }
    return Response.json(cachedResults[messages].length);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
