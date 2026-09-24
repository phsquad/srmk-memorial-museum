import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Seamless fallback for hero images: if .jpg is requested but only .svg exists, serve .svg
app.get('/assets/images/heroes/:filename', (req, res, next) => {
  const reqPath = path.join(__dirname, 'assets', 'images', 'heroes', req.params.filename);
  if (fs.existsSync(reqPath)) {
    return next();
  }
  const baseName = req.params.filename.replace(/\.[^.]+$/, '');
  const svgPath = path.join(__dirname, 'assets', 'images', 'heroes', `${baseName}.svg`);
  if (fs.existsSync(svgPath)) {
    res.type('image/svg+xml');
    return res.sendFile(svgPath);
  }
  next();
});

// Serve static assets from project root
app.use(express.static(__dirname, {
  extensions: ['html', 'htm']
}));

// Route handler for index
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 fallback to index.html
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Виртуальный музей ГБПОУ СРМК запущен на http://${HOST}:${PORT}`);
});
