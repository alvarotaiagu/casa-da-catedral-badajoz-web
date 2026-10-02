/* Versiones responsive de las fotos graduadas: AVIF + WebP + JPG a 480, 960 y
   1440 px de ancho (1920 en las que van a sangre), sin pasar del original.
   Lee los másteres de scripts/fuentes/graduadas/ (los saca scripts/gradar.py)
   y la lista de scripts/fotos-lista.json. Escribe:

     assets/fotos/<id>-<ancho>.avif|webp|jpg
     data/fotos.json   ← id, casa, alt, w, h y anchos de cada foto

   node scripts/fotos.mjs
   Usa sharp del node_modules de alvarotaiagu.github.io (no hay npm en este repo).
*/
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire('C:/Users/alvar/Desktop/WEBS NEGOCIOS/alvarotaiagu.github.io/package.json');
const sharp = require('sharp');

const origen = path.join(raiz, 'scripts', 'fuentes', 'graduadas');
const destino = path.join(raiz, 'assets', 'fotos');
fs.mkdirSync(destino, { recursive: true });
const lista = JSON.parse(fs.readFileSync(path.join(raiz, 'scripts', 'fotos-lista.json'), 'utf8')).fotos;
/* las que se ven a sangre en pantallas grandes */
const A_SANGRE = new Set(['870507584-alto', '870507584-movil', '894933741', '894943460', '248101584-alto']);

const salida = [];
let bytes = 0;
for (const f of lista) {
  const src = path.join(origen, f.id + '.jpg');
  const meta = await sharp(src).metadata();
  const base = A_SANGRE.has(f.id) ? [480, 960, 1440, 1920] : [480, 960, 1440];
  let anchos = base.filter(a => a < meta.width - 40);
  if (!anchos.length || meta.width - anchos[anchos.length - 1] > 160) anchos.push(Math.min(meta.width, base[base.length - 1]));
  anchos = [...new Set(anchos)].sort((a, b) => a - b);
  for (const a of anchos) {
    const img = sharp(src).resize({ width: a, withoutEnlargement: true });
    const salidas = [
      [img.clone().avif({ quality: 50, effort: 5 }), 'avif'],
      [img.clone().webp({ quality: 72 }), 'webp'],
      [img.clone().jpeg({ quality: 76, mozjpeg: true, progressive: true }), 'jpg']
    ];
    for (const [s, ext] of salidas) {
      const out = path.join(destino, `${f.id}-${a}.${ext}`);
      await s.toFile(out);
      bytes += fs.statSync(out).size;
    }
  }
  salida.push({ id: f.id, casa: f.casa, alt: f.alt, w: meta.width, h: meta.height, anchos });
}
fs.writeFileSync(path.join(raiz, 'data', 'fotos.json'), JSON.stringify({ _nota: 'Generado por scripts/fotos.mjs desde scripts/fotos-lista.json. No editar a mano: cambiar la lista y volver a ejecutar.', fotos: salida }, null, 1) + '\n');
console.log(salida.length, 'fotos ·', (bytes / 1048576).toFixed(1), 'MB en assets/fotos');
