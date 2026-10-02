/* Quita el módulo «El libro de visitas» (opiniones de la portada).

   node scripts/quitar-libro.mjs            → en esta carpeta
   node scripts/quitar-libro.mjs <carpeta>  → en otra copia (verificar.mjs lo
                                              prueba así, en una copia temporal)

   Qué hace:
     1. index.html: borra <section id="libro" data-modulo="libro"> entera (con
        sus comentarios de inicio y fin), su <link> de css/libro.css y su
        <script> de js/libro.js (los dos con data-modulo="libro").
     2. plantillas/_cabecera.html y todas las páginas: borra el enlace
        «Opiniones» del menú (<li data-modulo="libro">).
     3. Borra css/libro.css y js/libro.js.
     4. Vuelve a construir (node scripts/construir.mjs), que versiona y copia
        la cabecera nueva a todas las páginas.
   No toca data/opiniones.json: las páginas de cada casa siguen enseñando sus citas.
*/
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const aqui = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raiz = process.argv[2] ? path.resolve(process.argv[2]) : aqui;
const ruta = f => path.join(raiz, f);

function editar(archivo, cambios) {
  if (!fs.existsSync(ruta(archivo))) return;
  const antes = fs.readFileSync(ruta(archivo), 'utf8');
  let t = antes;
  for (const [re, que] of cambios) {
    const n = (t.match(re) || []).length;
    t = t.replace(re, '');
    console.log(`  ${archivo}: ${que} (${n})`);
  }
  if (t.length < antes.length * 0.6) { console.error('Me niego: ' + archivo + ' perdería demasiado.'); process.exit(1); }
  fs.writeFileSync(ruta(archivo), t);
}

const seccion = /[ \t]*<!-- ═+ 6 · EL LIBRO DE VISITAS[\s\S]*?<!-- ═+ fin del módulo «El libro de visitas» ═+ -->\r?\n?/g;
const enlaceCss = /[ \t]*<link[^>]*data-modulo="libro"[^>]*>\r?\n?/g;
const guion = /[ \t]*<script[^>]*data-modulo="libro"[^>]*><\/script>\r?\n?/g;
const menu = /[ \t]*<li data-modulo="libro">[\s\S]*?<\/li>\r?\n?/g;

console.log('Quitando el libro de visitas en ' + raiz);
editar('index.html', [[seccion, 'sección #libro'], [enlaceCss, 'css/libro.css'], [guion, 'js/libro.js'], [menu, 'enlace del menú']]);
for (const p of ['plantillas/_cabecera.html', 'ramona.html', 'jeronimo.html', 'aviso-legal.html', 'privacidad.html', '404.html']) editar(p, [[menu, 'enlace del menú']]);
for (const f of ['css/libro.css', 'js/libro.js']) if (fs.existsSync(ruta(f))) { fs.rmSync(ruta(f)); console.log('  borrado ' + f); }

if (fs.existsSync(ruta('scripts/construir.mjs'))) execFileSync(process.execPath, [ruta('scripts/construir.mjs')], { stdio: 'inherit', cwd: raiz });
else execFileSync(process.execPath, [path.join(aqui, 'scripts/versionar.mjs'), raiz], { stdio: 'inherit' });

const queda = fs.readFileSync(ruta('index.html'), 'utf8');
if (/id="libro"|data-modulo="libro"|libro\.(css|js)/.test(queda)) { console.error('Queda algo del libro en index.html'); process.exit(1); }
console.log('Libro de visitas quitado.');
