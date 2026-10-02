/* Servidor estático para revisar la web en el navegador.
   Hace falta servirla por HTTP para que data/config.json se relea al cargar
   (con doble clic vale lo incrustado) y para las View Transitions entre páginas.

   node scripts/servir.mjs          → http://127.0.0.1:4231
   node scripts/servir.mjs 5000     → otro puerto
*/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const puerto = Number(process.argv[2]) || 4231;
export const tipos = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.json': 'application/json', '.md': 'text/plain; charset=utf-8'
};

http.createServer((req, res) => {
  /* también bajo el prefijo de GitHub Pages, como el 404 (que usa <base href="/casa-da-catedral-badajoz-web/">) */
  const limpia = decodeURIComponent(req.url.split('?')[0]).replace(/^\/casa-da-catedral-badajoz-web(?=\/|$)/, '') || '/';
  const destino = path.join(raiz, limpia === '/' ? 'index.html' : limpia);
  if (!destino.startsWith(raiz)) { res.writeHead(403).end('no'); return; }
  if (!fs.existsSync(destino) || fs.statSync(destino).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(fs.existsSync(path.join(raiz, '404.html')) ? fs.readFileSync(path.join(raiz, '404.html')) : 'no está');
    return;
  }
  res.writeHead(200, { 'content-type': tipos[path.extname(destino)] || 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(fs.readFileSync(destino));
}).on('error', e => {
  /* otra web de la carpeta puede tener ya este puerto: avisar en vez de morir en silencio */
  console.error(e.code === 'EADDRINUSE' ? `El puerto ${puerto} está ocupado (¿otra web de la carpeta?). Prueba: node scripts/servir.mjs ${puerto + 10}` : e.message);
  process.exit(1);
}).listen(puerto, '127.0.0.1', () => {
  console.log('Casa da Catedral en http://127.0.0.1:' + puerto);
  console.log('Ctrl+C para parar.');
});
