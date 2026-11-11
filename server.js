import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  let filePath = path.join(__dirname, pathname);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(filePath, res);
  }

  if (fs.existsSync(`${filePath}.html`) && fs.statSync(`${filePath}.html`).isFile()) {
    return serveFile(`${filePath}.html`, res);
  }

  if (pathname.startsWith('/assets/images/heroes/')) {
    const baseWithoutExt = filePath.replace(/\.[^.]+$/, '');
    const svgPath = `${baseWithoutExt}.svg`;
    if (fs.existsSync(svgPath)) {
      return serveFile(svgPath, res);
    }
  }

  const notFoundPath = path.join(__dirname, '404.html');
  if (fs.existsSync(notFoundPath)) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(notFoundPath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache'
  });
  
  fs.createReadStream(filePath).pipe(res);
}

server.listen(PORT, HOST, () => {
  console.log(`\n==================================================`);
  console.log(`Виртуальный музей ГБПОУ СРМК «Быть воином — жить вечно»`);
  console.log(`Сервер разработки запущен: http://localhost:${PORT}`);
  console.log(`Статический сайт готов к деплою на GitHub Pages!`);
  console.log(`==================================================\n`);
});
