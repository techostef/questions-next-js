import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocketServer } from './socket-server';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

export async function startServer() {
  await app.prepare();
  
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });
  
  // Initialize socket.io
  initSocketServer(server);
  
  // Start listening
  server.listen(3000, () => {
    console.log('> Server started on http://localhost:3000');
  });
  
  return server;
}
