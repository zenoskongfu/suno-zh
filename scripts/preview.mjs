import http from 'node:http';
import { readFile } from 'node:fs/promises';
http.createServer(async (req, res) => {
  try {
    const isScript = req.url === '/suno-zh.js';
    const body = await readFile(isScript ? 'dist/suno-zh.user.js' : 'tests/fixtures/preview.html');
    res.writeHead(200, { 'Content-Type': isScript ? 'application/javascript; charset=utf-8' : 'text/html; charset=utf-8' });
    res.end(body);
  } catch { res.writeHead(500); res.end('Fixture unavailable'); }
}).listen(4319, '127.0.0.1', () => console.log('Fixture: http://127.0.0.1:4319/create'));
