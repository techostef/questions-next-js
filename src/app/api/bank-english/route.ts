/* eslint-disable @typescript-eslint/no-explicit-any */
const URL_CACHE =
  "https://gist.githubusercontent.com/techostef/1556b6ba9012fab30e737c03bade8c7e/raw/bankenglish.json";

export async function GET() {
  try {
    const response = await fetch(URL_CACHE);
    const data = await response.json();
    return Response.json(data);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
