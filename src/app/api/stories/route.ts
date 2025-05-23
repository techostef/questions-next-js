export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log("messages", messages)
    return Response.json({ message: 'Conversation saved successfully' });
  } catch (error) {
    console.error('Error occurred while processing the request:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}