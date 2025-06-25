/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAllWords } from '@/lib/supabase-bank-english';

export async function GET() {
  try {
    const words = await getAllWords();
    return Response.json(words);
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
