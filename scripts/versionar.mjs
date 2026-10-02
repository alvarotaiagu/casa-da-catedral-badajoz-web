/* GitHub Pages sirve CSS/JS con max-age=600: tras un push el navegador mezcla
   durante 10 minutos la hoja vieja con el HTML nuevo. Cada referencia a los
   CSS/JS propios lleva ?v=<huella del contenido>; este script la recalcula.

   Anclado al atributo (href="…" / src="…"), nunca a una mención suelta en un
   comentario. Idempotente. construir.mjs lo aplica también a lo que genera,
   así que normalmente basta con  node scripts/construir.mjs.
   Si se ha quitado el libro de visitas, sus archivos ya no están: se saltan.

   node scripts/versionar.mjs [carpeta]
*/
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const ARCHIVOS = ['css/estilos.css', 'css/libro.css', 'js/main.js', 'js/libro.js'];
export const PAGINAS = ['index.html', 'ramona.html', 'jeronimo.html', 'aviso-legal.html', 'privacidad.html', '404.html'];
const escapar = s => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

export function versiones(raiz) {
  return Object.fromEntries(ARCHIVOS.filter(f => fs.existsSync(path.join(raiz, f)))
    .map(f => [f, crypto.createHash('sha1').update(fs.readFileSync(path.join(raiz, f))).digest('hex').slice(0, 8)]));
}
export function versionarHtml(html, v) {
  for (const [archivo, h] of Object.entries(v)) {
    html = html.replace(new RegExp('((?:href|src)="' + escapar(archivo) + ')(\\?v=[0-9a-f]*)?"', 'g'), '$1?v=' + h + '"');
  }
  return html;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const raiz = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const v = versiones(raiz);
  for (const pagina of PAGINAS) {
    const ruta = path.join(raiz, pagina);
    if (!fs.existsSync(ruta)) continue;
    const antes = fs.readFileSync(ruta, 'utf8');
    const html = versionarHtml(antes, v);
    if (html !== antes) fs.writeFileSync(ruta, html);
    console.log((html !== antes ? 'actualizado ' : 'sin cambios ') + pagina);
  }
  console.log(v);
}
