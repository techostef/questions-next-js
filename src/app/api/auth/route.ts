export async function POST(req) {
  try {
    const usersJSON = process.env.USERS_JSON;
    if (!usersJSON) {
      console.error('USERS_JSON environment variable is not set');
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Parse the request body
    const body = await req.json();
    console.log("Request body:", body);
    
    // Parse the users from environment variable
    const users = JSON.parse(usersJSON);
    console.log("Available users:", users);
    
    // Find the matching user
    const findUser = users.find(
      (user) => user.username === body.username && user.password === body.password
    );

    if (findUser) {
      return Response.json({ user: findUser });
    }

    return Response.json({ error: 'Invalid username or password' }, { status: 401 });
  } catch (error) {
    console.error('Error occurred while processing the request:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}