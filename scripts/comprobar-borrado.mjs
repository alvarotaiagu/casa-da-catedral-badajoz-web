/* Comprueba contra los archivos que el mando de maqueta ya no está.
   La receta del README no se escribe de memoria: se comprueba.

   node scripts/comprobar-borrado.mjs ../casa-da-catedral-entrega
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raizMaqueta = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raiz = process.argv[2] ? path.resolve(process.argv[2]) : raizMaqueta;
const paginas = ['index.html', 'ramona.html', 'jeronimo.html', 'aviso-legal.html', 'privacidad.html', '404.html'];

const rastros = [];
for (const p of paginas) {
  rastros.push([p, /\[MANDO DE MAQUETA\]/, 'marcas [MANDO DE MAQUETA]']);
  rastros.push([p, /id="mando"/, 'el <div class="mando">']);
  rastros.push([p, /cdc-densidad/, 'la densidad guardada']);
  rastros.push([p, /[?&]revision|es-revision/, 'cualquier mención al modo ?revision']);
  rastros.push([p, /solo-revision|\[VERIFICAR/, 'marcas de revisión ([VERIFICAR], fotos pendientes)']);
}
rastros.push(['index.html', /id="comparar"|solo-sobria/, 'la tabla comparativa (solo existe en la sobria)']);
rastros.push(['css/estilos.css', /\[MANDO DE MAQUETA\]/, 'el bloque CSS del mando']);
rastros.push(['css/estilos.css', /densidad-sobria|solo-sobria/, 'las reglas de la versión sobria']);
rastros.push(['css/estilos.css', /\.mando\b/, 'los estilos del mando']);
rastros.push(['css/estilos.css', /solo-revision/, 'las marcas de ?revision']);
rastros.push(['css/libro.css', /densidad-sobria/, 'las reglas sobrias del libro']);
rastros.push(['js/main.js', /\[MANDO DE MAQUETA\]/, 'el bloque JS del mando']);
rastros.push(['js/main.js', /mandoMaqueta/, 'la función mandoMaqueta()']);
rastros.push(['js/main.js', /cdc-densidad/, 'la clave guardada de la densidad']);

let quedan = 0;
console.log('Rastros del mando de maqueta en ' + raiz);
console.log('-'.repeat(78));
for (const [archivo, patron, que] of rastros) {
  const ruta = path.join(raiz, archivo);
  if (!fs.existsSync(ruta)) { console.log('no está ' + archivo.padEnd(18) + '(módulo quitado)'); continue; }
  const hay = patron.test(fs.readFileSync(ruta, 'utf8'));
  if (hay) quedan++;
  console.log((hay ? 'QUEDA ' : 'limpio') + '  ' + archivo.padEnd(18) + que);
}
console.log('-'.repeat(78));
if (quedan) { console.log(quedan + ' rastro(s). No entregar todavía.'); process.exitCode = 1; }
else console.log('Sin rastros del mando. Se puede entregar.');
