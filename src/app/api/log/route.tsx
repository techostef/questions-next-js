/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Log the error to server console with timestamp and full details
    console.error("Client error logged:", {
      timestamp: new Date().toISOString(),
      ...data
    });
    
    // Here you could also store errors in a database or send to monitoring service
    // For example: await db.errors.create({ data })
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error("Error in logging endpoint:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
