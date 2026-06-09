import { Hono } from 'hono';
import { createChatRoutes } from './routes/chat.js';
import { createUploadRoutes } from './routes/upload.js';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const app = new Hono();

// CORS middleware
app.use('*', async (c, next) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (c.req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  return next();
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok', service: 'ssos-chatbot' }));

// Mount API routes
app.route('/api/chat', createChatRoutes());
app.route('/api/chat', createUploadRoutes());

// Static file serving for web frontend (P3: APP WebView)
const WEB_DIR = join(process.cwd(), '..', 'web', 'dist');
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

app.get('/chatbot', (c) => serveStatic('index.html'));
app.get('/chatbot/*', (c) => {
  const path = c.req.path.replace('/chatbot/', '');
  return serveStatic(path || 'index.html');
});

function serveStatic(filePath: string): Response {
  const fullPath = join(WEB_DIR, filePath);
  if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
    // SPA fallback
    const indexPath = join(WEB_DIR, 'index.html');
    if (existsSync(indexPath)) {
      const content = readFileSync(indexPath, 'utf-8');
      return new Response(content, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    return new Response('Not Found', { status: 404 });
  }

  const content = readFileSync(fullPath);
  const ext = extname(fullPath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  return new Response(content, {
    headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' },
  });
}

const PORT = parseInt(process.env.CHATBOT_PORT || '4001');

// Node-compatible server start
const { createServer } = await import('node:http');

createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v);
      } else {
        headers.set(key, value);
      }
    }
  }

  const body = ['POST', 'PUT', 'PATCH'].includes(req.method || '')
    ? await readBody(req)
    : undefined;

  const init: RequestInit = {
    method: req.method,
    headers,
    body,
  };

  const request = new Request(url.toString(), init);
  const response = await app.fetch(request);

  res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
  if (response.body) {
    const reader = response.body.getReader();
    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { res.end(); break; }
        res.write(value);
      }
    };
    pump();
  } else {
    res.end();
  }
}).listen(PORT, () => {
  console.log(`Startup OS Chatbot server running on http://localhost:${PORT}`);
  console.log(`Web UI: http://localhost:${PORT}/chatbot`);
});

function readBody(req: any): Promise<string | undefined> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(chunks.length > 0 ? Buffer.concat(chunks).toString() : undefined));
    req.on('error', () => resolve(undefined));
  });
}
