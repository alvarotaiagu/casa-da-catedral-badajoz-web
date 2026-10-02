/* og:image hechas a propósito (1200 × 630), una por página:
     og-portada.jpg   la torre con la reja delante y el sello
     og-ramona.jpg    la foto de su díptico con su nombre, su adorno y su llavero
     og-jeronimo.jpg  ídem
   Se componen en HTML (con las mismas piezas de dibujos.mjs) y se fotografían
   con Playwright.

   node scripts/generar-og.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'file:///C:/Users/alvar/Desktop/WEBS%20NEGOCIOS/alvarotaiagu.github.io/node_modules/playwright/index.mjs';
import * as D from './dibujos.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { casas } = JSON.parse(fs.readFileSync(path.join(raiz, 'data/casas.json'), 'utf8'));
const W = 1200, H = 630;
/* en base64: una página about:blank no puede leer file:// */
const foto = (id, a = 1440) => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(raiz, `assets/fotos/${id}-${a}.jpg`)).toString('base64');
const fuentes = '<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;1,400&family=Marcellus&family=Brygada+1918:wght@700&display=swap" rel="stylesheet">';
const base = `*{box-sizing:border-box;margin:0}body{width:${W}px;height:${H}px;overflow:hidden;position:relative;background:#1D1B19;color:#F4EFE7;font-family:'Crimson Pro',serif}
  .cinta-tela{background-color:#B9A47F;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.11) 0 1.3px,transparent 1.3px 3.4px),repeating-linear-gradient(-45deg,rgba(74,52,22,.09) 0 1.3px,transparent 1.3px 3.4px);color:#1D1B19;box-shadow:inset 1px 0 0 rgba(255,255,255,.22),inset -1px 0 0 rgba(70,48,20,.22),0 10px 20px -14px rgba(30,20,10,.6)}
  .llavero{position:absolute;width:46px}.llavero svg.anilla{position:absolute;left:3px;top:0;width:40px;height:40px;z-index:1}
  .llavero .tira{position:absolute;left:4px;top:30px;width:38px;display:flex;align-items:center;justify-content:center}
  .llavero b{writing-mode:vertical-rl;transform:rotate(180deg);font:700 17px/1 'Brygada 1918';letter-spacing:.04em;display:flex;align-items:center;gap:9px;white-space:nowrap}
  .llavero b svg{width:13px;height:15px;transform:rotate(90deg);fill:currentColor}
  .adorno path{stroke-width:1.6px;vector-effect:non-scaling-stroke}`;
const llavero = (txt, alto, x, y, mayus = false) => `<div class="llavero" style="left:${x}px;top:${y}px;height:${alto + 30}px"><svg class="anilla" viewBox="0 0 40 40"><use href="#anilla"/></svg><span class="tira cinta-tela" style="height:${alto}px"><b style="${mayus ? 'text-transform:uppercase;letter-spacing:.1em;font-size:15px' : ''}"><svg viewBox="0 0 100 112"><use href="#lis"/></svg>${txt}</b></span></div>`;

const paginas = {
  'og-portada.jpg': `<!doctype html><html><head><meta charset="utf-8">${fuentes}<style>${base}
    .foto{position:absolute;inset:0;background:url('${foto('870507584-alto')}') 58% 42%/cover}
    .velo{position:absolute;inset:0;background:linear-gradient(90deg,rgba(22,18,14,.82) 0%,rgba(22,18,14,.55) 40%,rgba(22,18,14,0) 70%),linear-gradient(180deg,rgba(22,18,14,.3),rgba(22,18,14,0) 40%)}
    .rejabox{position:absolute;left:0;right:0;top:${Math.round(H * .74)}px;color:#1D1B19}.rejabox svg{width:100%;height:auto;display:block;filter:drop-shadow(0 -2px 10px rgba(0,0,0,.3))}
    .texto{position:absolute;left:64px;top:44px;width:600px}
    .sello{width:96px;height:96px;color:#C9AE86}
    .marca{margin-top:18px;font:400 22px/1 Marcellus;letter-spacing:.32em;text-transform:uppercase}
    h1{margin-top:16px;font:400 64px/1.04 Marcellus;text-transform:uppercase;letter-spacing:.02em}
    p{margin-top:16px;font:italic 400 27px/1.3 'Crimson Pro';max-width:22ch}
  </style></head><body>${D.sprite()}<div class="foto"></div><div class="velo"></div>
    <div class="texto"><svg class="sello"><use href="#sello"/></svg><p class="marca">Casa da Catedral</p><h1>Frente a la Catedral</h1><p>Ramona y Jerónimo · Badajoz</p></div>
    <div class="rejabox">${D.rejaHero({ id: 'og-reja', ancho: 1200, S: 46 })}</div>
  </body></html>`
};
for (const c of casas) {
  const tono = c.slug === 'ramona' ? 'linear-gradient(180deg,rgba(74,22,20,.1),rgba(46,14,12,.55))' : 'linear-gradient(180deg,rgba(42,54,64,.08),rgba(24,32,40,.5))';
  const datos = [c.planta ? `${c.planta} planta` : null, `${c.metros} m²`, `hasta ${c.personas}`, `${String(c.nota).replace('.', ',')} en Booking`].filter(Boolean).join(' · ');
  paginas[`og-${c.slug}.jpg`] = `<!doctype html><html><head><meta charset="utf-8">${fuentes}<style>${base}
    body{background:#F4EFE7;color:#1D1B19}
    .foto{position:absolute;left:0;top:0;bottom:0;width:640px;background:url('${foto(c.fotos.og)}') ${c.fotos.diptico_posicion}/cover}
    .foto::after{content:"";position:absolute;inset:0;background:${tono}}
    .texto{position:absolute;left:700px;top:70px;right:60px}
    .adorno{width:96px;height:auto;color:#1D1B19;overflow:visible}
    h1{margin-top:14px;font:italic 400 128px/.95 'Crimson Pro';letter-spacing:-.01em}
    .datos{margin-top:20px;font:400 17px/1.5 Marcellus;letter-spacing:.16em;text-transform:uppercase}
    .marca{position:absolute;left:700px;bottom:56px;display:flex;align-items:center;gap:12px;font:400 17px/1 Marcellus;letter-spacing:.3em;text-transform:uppercase;color:#6F5B48}
    .marca svg{width:16px;height:18px;fill:#A18265}
  </style></head><body>${D.sprite()}<div class="foto"></div>
    ${llavero(c.nombre, 190, 560, 0)}
    <div class="texto">${D.adornoSVG(c.adorno, { clase: 'adorno' })}<h1>${c.nombre}</h1><p class="datos">${datos}</p></div>
    <p class="marca"><svg viewBox="0 0 100 112"><use href="#lis"/></svg>Casa da Catedral · Badajoz</p>
  </body></html>`;
}

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: W, height: H } });
fs.mkdirSync(path.join(raiz, 'assets/og'), { recursive: true });
for (const [nombre, html] of Object.entries(paginas)) {
  await pagina.setContent(html, { waitUntil: 'networkidle' });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.screenshot({ path: path.join(raiz, 'assets/og', nombre), type: 'jpeg', quality: 86 });
  console.log('assets/og/' + nombre);
}
await navegador.close();
