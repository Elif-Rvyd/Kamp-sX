/** Test-only static host. It never creates an auth user or writes to Supabase. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const directory = path.join(root, 'dist/apps/shell/browser');
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const headers = Object.fromEntries(
  vercel.headers.find((rule) => rule.source === '/(.*)').headers.map(({ key, value }) => [key, value]),
);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};
if (!fs.existsSync(path.join(directory, 'index.html')))
  throw Error('Build production output before running security tests.');
const server = http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1:4400').pathname);
    const target = path.resolve(directory, '.' + pathname);
    if (!target.startsWith(directory + path.sep) && target !== directory) {
      response.writeHead(403).end();
      return;
    }
    const file =
      fs.existsSync(target) && fs.statSync(target).isFile() ? target : path.join(directory, 'index.html');
    response.writeHead(200, {
      ...headers,
      'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(fs.readFileSync(file));
  } catch {
    response.writeHead(400).end();
  }
});
server.listen(4400, '127.0.0.1');
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
