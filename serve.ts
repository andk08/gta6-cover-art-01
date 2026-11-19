// Vice Cover Studio — tiny static file server for local development.
//
// Serves app/ on http://localhost:8080 (or $PORT when set) so the cover
// maker can be tried in a desktop browser with no build step and no network.
// Run it from the repository root: `node serve.ts`
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(new URL('./app', import.meta.url).pathname);
const PORT = Number(process.env.PORT || 8080);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function safePath(urlPath: string): string | null {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const rel = normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const full = join(ROOT, rel);
  if (!full.startsWith(ROOT)) return null;
  return full;
}

const server = createServer((req, res) => {
  const method = req.method || 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    res.writeHead(405, { 'content-type': 'text/plain' });
    res.end('method not allowed\n');
    return;
  }
  let file = safePath(req.url || '/');
  if (file === null) {
    res.writeHead(400, { 'content-type': 'text/plain' });
    res.end('bad path\n');
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) {
    file = join(file, 'index.html');
  }
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found\n');
    console.log(`${method} ${req.url} -> 404`);
    return;
  }
  const body = readFileSync(file);
  res.writeHead(200, {
    'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
    'content-length': body.length,
  });
  res.end(method === 'HEAD' ? undefined : body);
  console.log(`${method} ${req.url} -> 200 (${body.length} bytes)`);
});

server.listen(PORT, () => {
  console.log(`Vice Cover Studio serving ${ROOT} on http://localhost:${PORT}`);
});
