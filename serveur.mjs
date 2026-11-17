// Petit serveur statique pour prévisualiser le site : node serveur.mjs [port]
// Aucune dépendance. En production, n'importe quel hébergement statique convient.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = resolve(fileURLToPath(new URL('.', import.meta.url)));
const port = Number(process.argv[2]) || Number(process.env.PORT) || 4173;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

createServer(async (req, res) => {
  try {
    let chemin = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (chemin.endsWith('/')) chemin += 'index.html';
    const fichier = resolve(racine, '.' + chemin);
    if (fichier !== racine && !fichier.startsWith(racine + sep)) {
      res.writeHead(403).end();
      return;
    }
    const contenu = await readFile(fichier);
    res.writeHead(200, {
      'Content-Type': types[extname(fichier).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(contenu);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Page introuvable');
  }
}).listen(port, () => {
  console.log(`VR Fast Food : http://localhost:${port}`);
});
