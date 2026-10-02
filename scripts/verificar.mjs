/* Verificación de Casa da Catedral · «La Catedral de vecina».
   Levanta un servidor estático propio, abre la web con Playwright (Chromium) y comprueba:
     · un test por cada punto del checklist de web desde cero;
     · la cortina: muestrea stroke-dashoffset de la torre (no la captura final),
       la cinta cayendo, y la retirada sin CDN, sin JS y con movimiento reducido;
     · el hero: la reja sale de cuadro con el pin en escritorio, sin pin en
       móvil, y el texto no se pisa a 360×640, 375×667, 390×844 y 768×1024;
     · el contraste de los tokens y el del texto claro sobre la foto con su velo;
     · el díptico: expansión con ratón y con teclado, enlaces, mitades iguales;
     · las páginas de casa: se generan desde casas.json, cada estancia abre su
       <dialog>, Escape lo cierra y devuelve el foco, y un cambio en el JSON
       llega a la página tras construir (en una copia temporal);
     · el contacto: todo null → envíos apagados y Booking visible; con email,
       el mailto se enciende bien codificado;
     · el libro: filtro y aria-live, ninguna etiqueta pisa una raya en móvil,
       el hueco de la foto oculto, y su borrado (en una copia temporal);
     · las dos densidades, y que sin ?revision no hay mando;
     · textos prohibidos, citas sin nombre, «Casa da Catedral» bien escrito.
   Se baja con mouse.wheel: con Lenis, window.scrollTo no dispara ScrollTrigger.

   node scripts/verificar.mjs            (todo)
   node scripts/verificar.mjs --capturas (además guarda screenshots/)
*/
import { chromium } from 'file:///C:/Users/alvar/Desktop/WEBS%20NEGOCIOS/alvarotaiagu.github.io/node_modules/playwright/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire('C:/Users/alvar/Desktop/WEBS NEGOCIOS/alvarotaiagu.github.io/package.json');
const sharp = require('sharp');
const conCapturas = process.argv.includes('--capturas');
const dirCapturas = path.join(raiz, 'screenshots');
if (conCapturas) fs.mkdirSync(dirCapturas, { recursive: true });
const captura = n => path.join(dirCapturas, n);

const tipos = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.json': 'application/json'
};
function servir(dir, puerto) {
  const s = http.createServer((req, res) => {
    const limpia = decodeURIComponent(req.url.split('?')[0]).replace(/^\/casa-da-catedral-badajoz-web(?=\/|$)/, '') || '/';
    const destino = path.join(dir, limpia === '/' ? 'index.html' : limpia);
    if (!destino.startsWith(dir)) { res.writeHead(403).end(); return; }
    if (!fs.existsSync(destino) || fs.statSync(destino).isDirectory()) {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(path.join(dir, '404.html')));
      return;
    }
    res.writeHead(200, { 'content-type': tipos[path.extname(destino)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(fs.readFileSync(destino));
  });
  return new Promise(r => s.listen(puerto, '127.0.0.1', () => r(s)));
}

const fallos = [], notas = [];
function comprobar(ok, mensaje) { (ok ? notas : fallos).push((ok ? 'OK   ' : 'FALLA') + ' · ' + mensaje); }
async function hastaAbajo(page, paso = 700) {
  let ant = -1;
  for (let i = 0; i < 220; i++) {
    await page.mouse.wheel(0, paso);
    await page.waitForTimeout(130);
    const y = await page.evaluate(() => Math.round(window.scrollY));
    if (y === ant) break;
    ant = y;
  }
  await page.waitForTimeout(2600);
}
/* ir a un elemento con la rueda, llevando la cuenta de lo despachado (Lenis va por detrás de scrollY) */
async function irA(page, selector, margen = 0.15) {
  const destino = await page.evaluate(([s, m]) => {
    const el = document.querySelector(s); if (!el) return null;
    return Math.round(el.getBoundingClientRect().top + window.scrollY - innerHeight * m);
  }, [selector, margen]);
  if (destino == null) return false;
  let restante = destino - await page.evaluate(() => window.scrollY);
  while (Math.abs(restante) > 12) {
    const d = Math.sign(restante) * Math.min(Math.abs(restante), 420);
    await page.mouse.wheel(0, d); restante -= d;
    await page.waitForTimeout(55);
  }
  await page.waitForTimeout(1500);
  return true;
}
const PUERTO = 4232, PUERTO_COPIA = 4233;
const BASE = `http://127.0.0.1:${PUERTO}/`;
const CDN = /cdn\.jsdelivr\.net\/npm\/(gsap|lenis)/;
const TAMANOS = [[360, 640], [375, 667], [390, 844], [768, 1024], [1440, 900]];

const casasJson = JSON.parse(fs.readFileSync(path.join(raiz, 'data/casas.json'), 'utf8'));
const opiniones = JSON.parse(fs.readFileSync(path.join(raiz, 'data/opiniones.json'), 'utf8')).citas;
const configJson = JSON.parse(fs.readFileSync(path.join(raiz, 'data/config.json'), 'utf8'));
const PAGINAS = ['index.html', 'ramona.html', 'jeronimo.html', 'aviso-legal.html', 'privacidad.html', '404.html'];

const servidor = await servir(raiz, PUERTO);
const navegador = await chromium.launch();
const todasLasPaginas = [];
async function nuevaPagina(opciones = {}, { cookiesVistas = true, bloquearCDN = false, config = null } = {}) {
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, ...opciones });
  if (cookiesVistas) await ctx.addInitScript(() => { try { localStorage.setItem('cdc-cookies', 'ok'); } catch (e) {} });
  if (bloquearCDN) await ctx.route(CDN, r => r.abort());
  if (config) await ctx.route('**/data/config.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(config) }));
  const page = await ctx.newPage();
  page.errores = []; page.respuestas = [];
  page.on('console', m => { if (m.type() === 'error') page.errores.push(m.text()); });
  page.on('pageerror', e => page.errores.push('pageerror: ' + e.message));
  page.on('response', r => { if (r.status() >= 400) page.respuestas.push(r.status() + ' ' + r.url()); });
  page.bloqueaCDN = bloquearCDN;
  todasLasPaginas.push(page);
  return { ctx, page };
}
async function abrir(page, ruta = '', espera = 3400) {
  await page.goto(BASE + ruta, { waitUntil: 'networkidle' });
  await page.waitForTimeout(espera);
}
function lum(r, g, b) {
  const c = [r, g, b].map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contraste = (a, b) => { const [x, y] = [lum(...a), lum(...b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

try {
  /* ═══════════════ 0 · comprobaciones de archivo (sin navegador) ═══════════════ */
  {
    for (const p of PAGINAS) {
      const t = fs.readFileSync(path.join(raiz, p), 'utf8');
      comprobar(/<head>\s*<meta charset="utf-8">\s*<meta name="robots" content="noindex, nofollow">/.test(t), `noindex justo detrás del charset en ${p}`);
      comprobar(!/cdnjs\.cloudflare\.com\/ajax\/libs\/lenis/.test(t), `Lenis no viene de cdnjs en ${p}`);
    }
    for (const f of ['.nojekyll', 'manifest.json', 'assets/favicon.svg', 'assets/og/og-portada.jpg', 'assets/og/og-ramona.jpg', 'assets/og/og-jeronimo.jpg', 'assets/dibujos/sello.svg', 'assets/dibujos/sello-claro.svg', 'assets/dibujos/lis.svg', 'assets/dibujos/torre.svg'])
      comprobar(fs.existsSync(path.join(raiz, f)), 'existe ' + f);
    for (const n of ['og-portada', 'og-ramona', 'og-jeronimo']) {
      const m = await sharp(path.join(raiz, `assets/og/${n}.jpg`)).metadata();
      comprobar(m.width === 1200 && m.height === 630, `og:image ${n} de 1200×630 (${m.width}×${m.height})`);
    }
    /* la web está al día con los JSON */
    let alDia = true;
    try { execFileSync(process.execPath, [path.join(raiz, 'scripts/construir.mjs'), '--comprobar'], { stdio: 'pipe' }); } catch (e) { alDia = false; }
    comprobar(alDia, 'construir.mjs --comprobar: las páginas están al día con data/*.json');
    /* JSON-LD: LodgingBusiness + 2 Accommodation, sin aggregateRating, sin teléfono mientras sea null */
    const ld = JSON.parse(fs.readFileSync(path.join(raiz, 'index.html'), 'utf8').match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]);
    comprobar(ld['@type'] === 'LodgingBusiness' && ld.name === 'Casa da Catedral' && ld.geo && ld.address, 'JSON-LD: LodgingBusiness «Casa da Catedral» con dirección y geo');
    comprobar(Array.isArray(ld.sameAs) && ld.sameAs.length === 3, 'JSON-LD: sameAs con Instagram y las dos fichas de Booking');
    comprobar(ld.containsPlace && ld.containsPlace.length === 2 && ld.containsPlace.every(a => a['@type'] === 'Accommodation' && a.floorSize.value === 90 && a.floorSize.unitCode === 'MTK' && a.numberOfRooms === 2 && a.occupancy.maxValue === 5 && a.petsAllowed === true), 'JSON-LD: dos Accommodation con 90 m², 2 habitaciones, hasta 5 y mascotas');
    const ldTexto = PAGINAS.map(p => (fs.readFileSync(path.join(raiz, p), 'utf8').match(/application\/ld\+json[\s\S]*?<\/script>/) || [''])[0]).join('');
    comprobar(!/aggregateRating/.test(ldTexto), 'JSON-LD: sin aggregateRating en ninguna página');
    comprobar(configJson.telefono !== null || !/"telephone"/.test(ldTexto), 'JSON-LD: sin teléfono mientras config.telefono sea null');
    /* checklist 9 · clases de estado con prefijo */
    const permitidas = new Set(['con-movimiento', 'sin-movimiento', 'sin-gsap', 'con-cursor', 'cortina-activa', 'cortina-fuera', 'densidad-vecina', 'densidad-sobria', 'cookies-visibles', 'cursor', 'cursor-punto', 'con-js', 'sin-js', 'sin-cortina', 'es-revision']);
    const raras = [];
    for (const f of ['js/main.js', 'js/libro.js', 'plantillas/_arranque.html']) {
      const t = fs.readFileSync(path.join(raiz, f), 'utf8');
      for (const m of t.matchAll(/classList\.(?:add|remove|toggle)\(([^)]*)\)/g))
        for (const s of m[1].matchAll(/'([\w-]+)'/g)) if (!s[1].startsWith('es-') && !permitidas.has(s[1]) && !/^densidad-$/.test(s[1])) raras.push(f + ': ' + s[1]);
    }
    comprobar(!raras.length, 'checklist 9 · clases de estado con prefijo es- (o de página): ' + (raras.join(', ') || 'todas'));
    /* «Casa da Catedral» nunca como «Casa de la Catedral» */
    const fuentes = [...PAGINAS, 'plantillas/casa.html', 'data/casas.json', 'data/opiniones.json', 'js/main.js', 'js/libro.js'];
    const mal = fuentes.filter(f => /Casa de la Catedral/i.test(fs.readFileSync(path.join(raiz, f), 'utf8')));
    comprobar(!mal.length, '«Casa da Catedral» no aparece como «Casa de la Catedral» ' + (mal.join(', ') || ''));
  }

  /* ═══════════════ 1 · la cortina, muestreada dentro de la página ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina();
    await ctx.addInitScript(() => {
      window.__m = { trazo: [], almena: [], cuelga: [], capa: [], alCargar: null, fondo: null, fin: null };
      document.addEventListener('DOMContentLoaded', () => {
        const c = document.getElementById('cortina');
        window.__m.alCargar = c ? getComputedStyle(c).display : 'sin cortina';
        window.__m.fondo = c ? getComputedStyle(document.getElementById('cortina-capa')).backgroundColor : null;
        (function paso() {
          const s = document.querySelector('#torre-cortina .torre__silueta');
          const al = document.querySelectorAll('#torre-cortina .torre__almena');
          if (s) window.__m.trazo.push(parseFloat(getComputedStyle(s).strokeDashoffset));
          if (al.length) window.__m.almena.push(parseFloat(getComputedStyle(al[al.length - 1]).strokeDashoffset));
          const cu = document.getElementById('cortina-llavero');
          if (cu) window.__m.cuelga.push(new DOMMatrix(getComputedStyle(cu).transform).m42);
          const capa = document.getElementById('cortina-capa');
          if (capa) window.__m.capa.push(new DOMMatrix(getComputedStyle(capa).transform).m42);
          if (c && getComputedStyle(c).display === 'none' && window.__m.fin === null) window.__m.fin = performance.now();
          if (!c || getComputedStyle(c).display !== 'none' || performance.now() < 4500) requestAnimationFrame(paso);
        })();
      });
    });
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4600);
    const m = await page.evaluate(() => window.__m);
    comprobar(m.alCargar === 'block', 'checklist 5 · la cortina tapa la página al cargar (display ' + m.alCargar + ')');
    comprobar(m.fondo === 'rgb(29, 27, 25)', 'checklist 5 · la cortina es de hierro (' + m.fondo + '), distinta de la foto del hero');
    const medios = v => v.filter(x => x > 0.03 && x < 0.97);
    comprobar(new Set(medios(m.trazo).map(x => x.toFixed(3))).size >= 6, 'checklist 8 · la torre se TRAZA (autoRound:false): ' + medios(m.trazo).length + ' valores intermedios de stroke-dashoffset');
    comprobar(medios(m.almena).length >= 2, 'cortina: la última almena también se traza (' + medios(m.almena).length + ' valores intermedios)');
    const cayendo = m.cuelga.filter(y => y < -20 && y > -600);
    comprobar(cayendo.length >= 3, 'cortina: la cinta cae desde arriba (' + cayendo.length + ' fotogramas a medio caer)');
    comprobar(m.capa.some(y => y < -50 && y > -800), 'cortina: la capa sube (expo.inOut) en vez de desaparecer de golpe');
    const fin = await page.evaluate(() => ({
      display: getComputedStyle(document.getElementById('cortina')).display,
      clase: document.documentElement.classList.contains('cortina-fuera'),
      reja: new DOMMatrix(getComputedStyle(document.querySelector('.hero__reja-entrada')).transform).m42,
      bloqueo: document.documentElement.classList.contains('cortina-activa'),
      mov: document.documentElement.classList.contains('con-movimiento')
    }));
    comprobar(fin.display === 'none' && fin.clase && !fin.bloqueo, 'cortina: acaba en display:none y suelta el scroll');
    comprobar(Math.abs(fin.reja) < 1, 'cortina: la reja del hero ha subido a su sitio (' + fin.reja.toFixed(1) + ' px)');
    comprobar(fin.mov, 'checklist 7 · con GSAP y sin movimiento reducido: html.con-movimiento');
    comprobar(m.fin !== null && m.fin < 4300, 'cortina: se retira en unos 2,5 s (' + (m.fin ? Math.round(m.fin) + ' ms desde la navegación' : 'no se retiró') + ')');
    await ctx.close();
  }

  /* fotogramas fijos de la cortina (para mirarlos) */
  if (conCapturas) {
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const { ctx, page } = await nuevaPagina({ viewport: { width: w, height: h } });
      await page.goto(BASE, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.CDC && window.CDC.cortina && window.CDC.cortina.tl);
      for (const [t, n] of [[0.42, 'torre-a-medias'], [1.3, 'cinta-cayendo'], [2.05, 'retirada']]) {
        /* la línea de tiempo puede haber acabado ya (y la retirada pone display:none):
           se vuelve a poner la cortina en escena y se busca el instante. La reja del hero
           sube con su propio tween: se coloca a mano en el mismo punto del gesto */
        await page.evaluate(t => {
          const tl = window.CDC.cortina.tl; tl.pause();
          document.getElementById('cortina').classList.remove('es-fuera');
          document.documentElement.classList.remove('cortina-fuera');
          tl.seek(t, false);
          const p = Math.min(1, Math.max(0, (t - 1.62) / 1.05));
          window.gsap.set('.hero__reja-entrada', { yPercent: 101 * (1 - window.gsap.parseEase('expo.inOut')(p)) });
        }, t);
        await page.waitForTimeout(150);
        await page.screenshot({ path: captura(`cortina-${n}-${w}.png`) });
      }
      await ctx.close();
    }
  }

  /* ═══════════════ 2 · sin CDN (GSAP/Lenis caídos), sin JS y con movimiento reducido ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina({}, { bloquearCDN: true });
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);
    const r = await page.evaluate(() => ({
      display: getComputedStyle(document.getElementById('cortina')).display,
      sinGsap: document.documentElement.classList.contains('sin-gsap'),
      mov: document.documentElement.classList.contains('con-movimiento'),
      letras: [...document.querySelectorAll('.hero__titulo .letra')].every(l => getComputedStyle(l).transform === 'none'),
      reja: getComputedStyle(document.querySelector('.hero__reja-entrada')).transform
    }));
    comprobar(r.display === 'none', 'sin CDN: la cortina se retira (display ' + r.display + ')');
    comprobar(r.sinGsap && !r.mov, 'checklist 7 · sin GSAP no hay html.con-movimiento');
    comprobar(r.letras, 'sin CDN: el titular del hero se ve entero (letras sin desplazar)');
    comprobar(r.reja === 'none', 'sin CDN: la reja del hero está en su sitio');
    if (conCapturas) { await page.waitForTimeout(800); await page.screenshot({ path: captura('sin-gsap-1440.png') }); }
    await ctx.close();
  }
  {
    const { ctx, page } = await nuevaPagina({ javaScriptEnabled: false });
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    const d = await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display);
    comprobar(d === 'none', 'sin JS: la cortina no tapa nada (<noscript>), display ' + d);
    await ctx.close();
  }
  {
    const { ctx, page } = await nuevaPagina({ reducedMotion: 'reduce' });
    await ctx.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { window.__alCargar = getComputedStyle(document.getElementById('cortina')).display; }); });
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    const r = await page.evaluate(() => ({
      alCargar: window.__alCargar,
      despues: getComputedStyle(document.getElementById('cortina')).display,
      mov: document.documentElement.classList.contains('con-movimiento'),
      letras: [...document.querySelectorAll('[data-revelar] .letra, [data-revelar] .palabra-int')].every(l => getComputedStyle(l).transform === 'none')
    }));
    comprobar(r.alCargar === 'none' && r.despues === 'none', 'movimiento reducido: la cortina no pinta ni un fotograma (al cargar: ' + r.alCargar + ')');
    comprobar(!r.mov && r.letras, 'checklist 7 · con movimiento reducido no hay con-movimiento y los titulares se ven');
    await irA(page, '#libro', 0.05);
    const libro = await page.evaluate(() => ({
      sello: document.getElementById('libro-sello').className,
      clip: [...document.querySelectorAll('.libro__texto, .libro__firma')].filter(e => getComputedStyle(e).clipPath !== 'none').length,
      llaveros: [...document.querySelectorAll('[data-llavero]')].filter(l => l.style.transform).length
    }));
    comprobar(!/es-por-caer/.test(libro.sello) && libro.clip === 0, 'movimiento reducido: las citas y el sello del libro, en su sitio');
    await page.hover('.mitad--ramona');
    await page.waitForTimeout(400);
    comprobar(await page.evaluate(() => [...document.querySelectorAll('[data-llavero]')].every(l => !l.style.transform)), 'movimiento reducido: los llaveros, quietos');
    if (conCapturas) await page.screenshot({ path: captura('movimiento-reducido-1440.png') });
    await ctx.close();
  }

  /* ═══════════════ 3 · hero: pin en escritorio, sin pin en móvil, texto que no se pisa ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina();
    await abrir(page);
    await page.mouse.move(700, 450);
    const muestras = [];
    for (let i = 0; i < 16; i++) {
      await page.mouse.wheel(0, 90);
      await page.waitForTimeout(110);
      muestras.push(await page.evaluate(() => ({
        y: Math.round(scrollY), anclado: window.CDC.hero.anclado, progreso: window.CDC.hero.st ? window.CDC.hero.st.progress : 0, vh: innerHeight,
        rejaTop: Math.round(document.querySelector('.hero__reja').getBoundingClientRect().top),
        escala: new DOMMatrix(getComputedStyle(document.querySelector('.hero__foto')).transform).a,
        heroTop: Math.round(document.querySelector('.hero').getBoundingClientRect().top)
      })));
    }
    const enPin = muestras.filter(m => m.anclado);
    comprobar(enPin.length >= 3 && enPin.every(m => Math.abs(m.heroTop) <= 1), 'hero (1440): se ancla (pin) al bajar: ' + enPin.length + ' muestras ancladas con el hero quieto');
    /* el final del pin: la muestra anclada de más progreso */
    const finPin = muestras.filter(m => m.anclado).sort((a, b) => b.progreso - a.progreso)[0] || {};
    const spacer = await page.evaluate(() => !!document.querySelector('.pin-spacer'));
    comprobar(spacer && finPin.progreso > 0.9 && finPin.rejaTop >= finPin.vh * (finPin.progreso > 0.99 ? 0.99 : 0.9), `hero (1440): al final del pin (progreso ${(finPin.progreso || 0).toFixed(2)}) la reja sale de cuadro (top ${finPin.rejaTop} de ${finPin.vh})`);
    comprobar(finPin.escala > 1.07 && Math.abs(finPin.escala - (1 + 0.08 * finPin.progreso)) < 0.012, 'hero (1440): la torre escala de 1 a 1,08 (' + (finPin.escala || 0).toFixed(3) + ')');
    await ctx.close();
  }
  {
    const { ctx, page } = await nuevaPagina({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await abrir(page);
    const r = await page.evaluate(() => ({ st: window.CDC.hero.st, spacer: !!document.querySelector('.pin-spacer'), cursor: !!document.querySelector('.cursor') }));
    comprobar(r.st === null && !r.spacer, 'hero (390, táctil): sin pin');
    comprobar(!r.cursor, 'checklist 1 · en táctil no hay cursor propio');
    await ctx.close();
  }
  for (const [w, h] of [[360, 640], [375, 667], [390, 844], [768, 1024]]) {
    const { ctx, page } = await nuevaPagina({ viewport: { width: w, height: h } });
    await abrir(page);
    const r = await page.evaluate(() => {
      const rect = s => document.querySelector(s).getBoundingClientRect();
      const reja = rect('.hero__reja');
      const cab = rect('#cabecera');
      const piezas = ['.hero__marca', '.hero__titulo', '.hero__entradilla', '.hero__botones', '.hero__dato'].map(s => [s, rect(s)]);
      const pisan = piezas.filter(([s, r]) => r.bottom > reja.top + 1 || r.top < cab.bottom - 1 || r.right > innerWidth + 1).map(([s, r]) => `${s} (${Math.round(r.top)}–${Math.round(r.bottom)})`);
      return { pisan, rejaTop: Math.round(reja.top), ancho: document.documentElement.scrollWidth };
    });
    comprobar(!r.pisan.length, `checklist 6 · hero a ${w}×${h}: ningún texto pisa la reja ni la cabecera ${r.pisan.join(', ')}`);
    comprobar(r.ancho <= w, `hero a ${w}×${h}: sin desbordamiento horizontal (${r.ancho})`);
    await ctx.close();
  }

  /* ═══════════════ 4 · contraste: tokens y texto claro sobre la foto con su velo ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina();
    await abrir(page, '', 4200);
    const tokens = await page.evaluate(() => {
      const parse = c => { const m = c.match(/[\d.]+/g).map(Number); return c.startsWith('color(') ? [m[0] * 255, m[1] * 255, m[2] * 255, m[3] ?? 1] : [m[0], m[1], m[2], m[3] ?? 1]; };
      const prueba = (color, fondo) => { const d = document.createElement('div'); d.style.color = color; d.style.background = fondo; document.body.appendChild(d); const c = parse(getComputedStyle(d).color), f = parse(getComputedStyle(d).backgroundColor); d.remove(); return { c, f }; };
      const v = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
      return [['tinta', 'cal'], ['apagado', 'cal'], ['apagado', 'cal-2'], ['acento-texto', 'cal'], ['acento-texto', 'cal-2'], ['en-oscuro', 'hierro'], ['en-oscuro-apagado', 'hierro'], ['tinta-sello', 'papel'], ['apagado', 'papel'], ['acento-texto', 'papel']].map(([a, b]) => ({ a, b, ...prueba(v('--' + a), v('--' + b)) }));
    });
    for (const t of tokens) {
      const c = t.c.slice(0, 3).map((x, i) => x * t.c[3] + t.f[i] * (1 - t.c[3]));   /* alfa compuesto sobre el fondo */
      const k = contraste(c, t.f.slice(0, 3));
      comprobar(k >= 4.5, `contraste --${t.a} sobre --${t.b}: ${k.toFixed(2)} (AA ≥ 4,5)`);
    }
    /* el texto claro del hero sobre la foto con su velo: se quita el texto, se fotografía lo de detrás
       y se toma el percentil 92 de luminancia (lo más claro, el peor caso para letra clara) */
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.mouse.wheel(0, -3000); await page.waitForTimeout(1600);
      const cajas = await page.evaluate(() => [['.hero__titulo', 3], ['.hero__entradilla', 4.5], ['.hero__marca', 4.5], ['.hero__dato-eti', 4.5], ['.hero__dato-cifras', 3]].map(([s, min]) => { const r = document.querySelector(s).getBoundingClientRect(); return { s, min, x: Math.max(0, r.left), y: Math.max(0, r.top), w: Math.min(r.width, innerWidth - r.left), h: r.height }; }));
      await page.addStyleTag({ content: '.hero__contenido, .hero__contenido *{color:transparent!important;text-shadow:none!important}.hero__botones{visibility:hidden}.lis{visibility:hidden}' });
      await page.waitForTimeout(200);
      for (const c of cajas) {
        const buf = await page.screenshot({ clip: { x: c.x, y: c.y, width: Math.max(4, c.w), height: Math.max(4, c.h) } });
        const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
        const ls = [];
        for (let i = 0; i < data.length; i += info.channels) ls.push(lum(data[i], data[i + 1], data[i + 2]));
        ls.sort((a, b) => a - b);
        const peor = ls[Math.floor(ls.length * 0.92)];
        const k = (lum(244, 239, 231) + 0.05) / (peor + 0.05);
        comprobar(k >= c.min, `contraste del texto claro sobre la foto (${w}): ${c.s} ${k.toFixed(2)} (≥ ${c.min})`);
      }
      await page.evaluate(() => document.querySelectorAll('style').forEach(s => { if (/color:transparent!important/.test(s.textContent)) s.remove(); }));
    }
    await ctx.close();
  }

  /* ═══════════════ 5 · el díptico ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina();
    await abrir(page);
    await irA(page, '#diptico', 0.05);
    await page.mouse.move(5, 5); await page.waitForTimeout(1200);
    const reposo = await page.evaluate(() => [...document.querySelectorAll('.mitad')].map(m => m.getBoundingClientRect().width));
    comprobar(Math.abs(reposo[0] - reposo[1]) <= 1, `díptico: en reposo las dos mitades miden lo mismo (${reposo.map(Math.round).join(' / ')})`);
    const hrefs = await page.evaluate(() => [...document.querySelectorAll('.mitad')].map(m => m.getAttribute('href')));
    comprobar(hrefs[0] === './ramona.html' && hrefs[1] === './jeronimo.html', 'díptico: cada mitad enlaza a su página (' + hrefs.join(', ') + ')');
    const b = await page.locator('.mitad--ramona').boundingBox();
    await page.mouse.move(b.x + b.width * 0.4, b.y + b.height * 0.5);
    await page.waitForTimeout(1200);
    const raton = await page.evaluate(() => [...document.querySelectorAll('.mitad')].map(m => m.getBoundingClientRect().width));
    comprobar(Math.abs(raton[0] / raton[1] - 1.38 / 0.62) < 0.12, `díptico: con el ratón, Ramona se abre a 1,38 y Jerónimo se recoge a 0,62 (${(raton[0] / raton[1]).toFixed(2)} ≈ 2,23)`);
    const llav = await page.evaluate(() => window.CDC.llaveros.some(s => s.a !== 0 || s.v !== 0) || [...document.querySelectorAll('.mitad [data-llavero]')].some(l => l.style.transform));
    comprobar(llav, 'llaveros: el de la mitad señalada se balancea (muelle amortiguado)');
    if (conCapturas) await page.screenshot({ path: captura('diptico-abierto-1440.png') });
    await page.mouse.move(5, 5); await page.waitForTimeout(1200);
    /* teclado: tabulando hasta Jerónimo */
    let enfoca = '';
    for (let i = 0; i < 40 && !/mitad--jeronimo/.test(enfoca); i++) { await page.keyboard.press('Tab'); enfoca = await page.evaluate(() => document.activeElement.className || ''); }
    await page.waitForTimeout(1200);
    const teclado = await page.evaluate(() => [...document.querySelectorAll('.mitad')].map(m => m.getBoundingClientRect().width));
    comprobar(/mitad--jeronimo/.test(enfoca) && teclado[1] / teclado[0] > 2, `díptico: con el foco de teclado, Jerónimo se abre igual (${(teclado[1] / teclado[0]).toFixed(2)})`);
    const vt = await page.evaluate(() => [getComputedStyle(document.querySelector('.mitad--ramona .mitad__foto')).viewTransitionName, getComputedStyle(document.querySelector('.mitad--jeronimo .mitad__foto')).viewTransitionName]);
    comprobar(vt[0] === 'foto-ramona' && vt[1] === 'foto-jeronimo', 'díptico: la foto de cada mitad lleva su view-transition-name (' + vt.join(', ') + ')');
    /* navegar: la página de la casa llega sin cortina (ya se vio) y con la misma foto nombrada */
    await page.keyboard.press('Enter');
    await page.waitForURL(/jeronimo\.html/, { timeout: 8000 });
    await page.waitForTimeout(1500);
    const casa = await page.evaluate(() => ({ sin: document.documentElement.classList.contains('sin-cortina'), vt: getComputedStyle(document.querySelector('.casa-hero__foto')).viewTransitionName, cortina: getComputedStyle(document.getElementById('cortina')).display }));
    comprobar(casa.sin && casa.cortina === 'none' && casa.vt === 'foto-jeronimo', 'díptico → jeronimo.html: sin cortina y la foto del hero comparte view-transition-name (' + casa.vt + ')');
    await ctx.close();
  }
  {
    const { ctx, page } = await nuevaPagina({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await abrir(page);
    const r = await page.evaluate(() => [...document.querySelectorAll('.mitad')].map(m => { const b = m.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; }));
    comprobar(r.every(([w]) => w === 390) && r.every(([, h]) => Math.abs(h - 0.55 * 844) < 8), 'díptico (390): dos franjas apiladas de ~55svh (' + r.map(x => x.join('×')).join(', ') + ')');
    await ctx.close();
  }

  /* ═══════════════ 6 · páginas de casa: estancias en <dialog> ═══════════════ */
  for (const c of casasJson.casas) {
    const { ctx, page } = await nuevaPagina();
    await abrir(page, c.slug + '.html', 2400);
    const d = await page.evaluate(() => ({
      h1: document.querySelector('.casa-hero__nombre').getAttribute('aria-label'),
      datos: document.querySelector('.casa-hero__datos').textContent,
      generada: /PÁGINA GENERADA por scripts\/construir\.mjs/.test(document.documentElement.outerHTML) || /GENERADA/.test(document.firstChild && document.firstChild.nextSibling ? document.firstChild.nextSibling.textContent : ''),
      botones: [...document.querySelectorAll('[data-estancia]')].map(b => b.getAttribute('data-estancia')),
      sinFoto: document.querySelectorAll('.estancia--sin-foto').length,
      citas: document.querySelectorAll('.notas__citas .cita').length,
      barras: [...document.querySelectorAll('.barra__relleno')].map(b => b.style.getPropertyValue('--v')),
      cortina: getComputedStyle(document.getElementById('cortina')).display,
      horario: [...document.querySelectorAll('.horario__casa')].filter(e => e.getBoundingClientRect().height > 0).length
    }));
    comprobar(d.h1 === c.nombre && d.datos.includes(c.metros + ' m²'), `${c.slug}.html: nombre y datos desde casas.json («${d.h1}»)`);
    const conFotos = c.estancias.filter(e => e.fotos.length);
    comprobar(d.botones.length === conFotos.length && d.sinFoto === c.estancias.length - conFotos.length, `${c.slug}.html: ${d.botones.length} estancias con galería y ${d.sinFoto} sin foto (hueco anotado)`);
    comprobar(d.citas === opiniones.filter(o => o.casa === c.slug).length, `${c.slug}.html: sus ${d.citas} citas salen de opiniones.json`);
    comprobar(d.barras.length === 7 && d.barras.every((v, i) => Math.abs(parseFloat(v) - c.categorias[i].nota / 10) < 0.001), `${c.slug}.html: las 7 categorías como barras de reja proporcionales a la nota`);
    comprobar(d.horario === 1, `checklist 9 · ${c.slug}.html: su horario se ve (1 bloque visible)`);
    for (const e of conFotos) {
      const boton = page.locator(`[data-estancia="${e.id}"]`);
      await boton.scrollIntoViewIfNeeded();
      await boton.click();
      await page.waitForTimeout(450);
      const abierta = await page.evaluate(() => ({ open: document.getElementById('galeria').open, minis: document.querySelectorAll('#galeria-miniaturas button').length, cuenta: document.getElementById('galeria-cuenta').textContent, img: !!document.querySelector('#galeria-figura img') }));
      comprobar(abierta.open && abierta.minis === e.fotos.length && abierta.img, `${c.slug}.html · ${e.nombre}: el <dialog> se abre con sus ${e.fotos.length} fotos (${abierta.cuenta})`);
      if (e.fotos.length > 1) {
        await page.keyboard.press('ArrowRight'); await page.waitForTimeout(150);
        const t = await page.evaluate(() => document.getElementById('galeria-cuenta').textContent);
        comprobar(/^Foto 2 de/.test(t), `${c.slug}.html · ${e.nombre}: la flecha del teclado pasa de foto (${t})`);
      }
      if (conCapturas && e.id === 'salon') await page.screenshot({ path: captura(`${c.slug}-dialogo-1440.png`) });
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      const cerrada = await page.evaluate(id => ({ open: document.getElementById('galeria').open, foco: document.activeElement && document.activeElement.getAttribute('data-estancia') }), e.id);
      comprobar(!cerrada.open && cerrada.foco === e.id, `${c.slug}.html · ${e.nombre}: Escape cierra y el foco vuelve a la estancia`);
    }
    await ctx.close();
  }

  /* un cambio en casas.json llega a la página tras construir (en una copia temporal) */
  {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cdc-json-'));
    const fuera = new Set(['screenshots', 'fotos', 'fuentes', 'node_modules', '.git', 'og']);
    (function copiar(de, a) { fs.mkdirSync(a, { recursive: true }); for (const e of fs.readdirSync(de, { withFileTypes: true })) { if (fuera.has(e.name)) continue; const o = path.join(de, e.name), d = path.join(a, e.name); if (e.isDirectory()) copiar(o, d); else fs.copyFileSync(o, d); } })(raiz, tmp);
    const j = JSON.parse(fs.readFileSync(path.join(tmp, 'data/casas.json'), 'utf8'));
    j.casas[0].comentarios = 117;
    j.casas[0].caracter = 'Frase de prueba del verificador.';
    j.casas[1].planta = '1.º';
    fs.writeFileSync(path.join(tmp, 'data/casas.json'), JSON.stringify(j, null, 1));
    execFileSync(process.execPath, [path.join(tmp, 'scripts/construir.mjs')], { stdio: 'pipe' });
    const r = fs.readFileSync(path.join(tmp, 'ramona.html'), 'utf8'), jj = fs.readFileSync(path.join(tmp, 'jeronimo.html'), 'utf8'), ix = fs.readFileSync(path.join(tmp, 'index.html'), 'utf8');
    comprobar(r.includes('117 comentarios en Booking') && r.includes('Frase de prueba del verificador.'), 'casas.json → construir: el cambio de Ramona llega a ramona.html');
    comprobar(jj.includes('1.º planta') && ix.includes('1.º planta'), 'casas.json → construir: la planta de Jerónimo, al rellenarla, aparece en su página y en el díptico');
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  /* ═══════════════ 7 · contacto: todo null, y con email ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina();
    await abrir(page);
    await irA(page, '#fechas', 0.05);
    const booking = await page.evaluate(() => [...document.querySelectorAll('.fechas__botones a')].map(a => ({ t: a.textContent.trim(), h: a.href, v: a.getBoundingClientRect().height > 0 })));
    comprobar(booking.length === 2 && booking.every(b => b.v) && /Ramona/.test(booking[0].t) && /casa-da-catedral\.es\.html/.test(booking[0].h) && /Jerónimo/.test(booking[1].t) && /jeronimo/.test(booking[1].h), 'contacto: «Reservar Ramona en Booking» y «Reservar Jerónimo en Booking», visibles y bien enlazados');
    /* validación de fechas */
    await page.fill('#llegada', '2026-12-12'); await page.fill('#salida', '2026-12-10');
    await page.dispatchEvent('#salida', 'change');
    const err = await page.evaluate(() => [document.getElementById('fechas-error').textContent, document.getElementById('salida').getAttribute('aria-invalid')]);
    comprobar(/posterior/.test(err[0]) && err[1] === 'true', 'formulario: la salida tiene que ser posterior a la llegada (mensaje en línea)');
    await page.fill('#salida', '2026-12-14'); await page.dispatchEvent('#salida', 'change');
    await page.check('input[name="casa"][value="jeronimo"]', { force: true });
    await page.fill('input[name="adultos"]', '3');
    await page.fill('input[name="nombre"]', 'Prueba');
    await page.click('#consulta button[type="submit"]');
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({
      texto: document.getElementById('mensaje-texto').textContent,
      apagados: ['enviar-email', 'enviar-whatsapp', 'enviar-telefono'].map(id => { const b = document.getElementById(id); return b.getAttribute('aria-disabled') === 'true' && !b.hasAttribute('href'); }),
      pronto: !document.getElementById('mensaje-pronto').hidden
    }));
    comprobar(/^Hola Verónica, somos 3 adultos y queremos Jerónimo del sábado 12 de diciembre al lunes 14 de diciembre de 2026 \(2 noches\)\./.test(r.texto), 'formulario: compone un mensaje legible («' + r.texto.split('\n')[0] + '»)');
    comprobar(r.apagados.every(Boolean) && r.pronto, 'contacto: con teléfono, email y WhatsApp en null, los tres envíos apagados y «Pronto podrás escribirnos directamente»');
    await ctx.close();
  }
  {
    const email = 'hola@casadacatedral.es';
    const { ctx, page } = await nuevaPagina({}, { config: { ...configJson, email } });
    await abrir(page);
    await irA(page, '#fechas', 0.05);
    await page.fill('#llegada', '2026-11-03'); await page.fill('#salida', '2026-11-05');
    await page.fill('input[name="nombre"]', 'María & José');
    await page.fill('textarea[name="mensaje"]', '¿Hay cuna? Línea 2');
    await page.click('#consulta button[type="submit"]');
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({ href: document.getElementById('enviar-email').getAttribute('href'), dis: document.getElementById('enviar-email').getAttribute('aria-disabled'), wa: document.getElementById('enviar-whatsapp').getAttribute('aria-disabled'), texto: document.getElementById('mensaje-texto').textContent, pronto: document.getElementById('mensaje-pronto').hidden }));
    const ok = r.href && r.href.startsWith('mailto:' + email + '?subject=') && decodeURIComponent(r.href.split('&body=')[1]) === r.texto.replace(/\n/g, '\r\n') && !/[\s&#]/.test(r.href.split('?')[1].replace(/&body=/, ''));
    comprobar(ok && r.dis === null, 'contacto: al rellenar el email, «Enviar por email» se enciende con un mailto bien codificado (CRLF, & y ¿ escapados)');
    comprobar(r.wa === 'true' && r.pronto, 'contacto: los demás siguen apagados y el aviso desaparece porque ya hay un canal');
    await ctx.close();
  }

  /* ═══════════════ 8 · el libro de visitas ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina();
    await abrir(page);
    await irA(page, '.libro__hoja', 0.1);
    await page.waitForTimeout(6500);
    const escrito = await page.evaluate(() => ({ sello: document.getElementById('libro-sello').className, api: window.CDCLibro && window.CDCLibro.escrito, foto: document.getElementById('libro-foto').hidden, selloAncho: Math.round(document.querySelector('.libro__sello').getBoundingClientRect().width) }));
    comprobar(escrito.api && /es-caido/.test(escrito.sello), 'libro: las citas se escriben y al final cae el sello rojo');
    comprobar(escrito.foto && escrito.selloAncho >= 170, `libro: con libro_foto en null el hueco de la foto no se ve y el sello es más grande (${escrito.selloAncho} px)`);
    if (conCapturas) await page.screenshot({ path: captura('libro-sello-caido-1440.png') });
    for (const [f, n] of [['ramona', 5], ['jeronimo', 5], ['todas', 10]]) {
      await page.click(`.libro__pestana[data-filtro="${f}"]`);
      await page.waitForTimeout(150);
      const r = await page.evaluate(f => ({ vis: [...document.querySelectorAll('.libro__entrada')].filter(e => !e.hidden).length, casas: [...document.querySelectorAll('.libro__entrada')].filter(e => !e.hidden).map(e => e.dataset.casa), pulsado: document.querySelector(`.libro__pestana[data-filtro="${f}"]`).getAttribute('aria-pressed'), vivo: document.getElementById('libro-aviso').textContent, rol: document.getElementById('libro-aviso').getAttribute('aria-live') }), f);
      comprobar(r.vis === n && (f === 'todas' || r.casas.every(c => c === f)) && r.pulsado === 'true' && r.rol === 'polite' && /Mostrando/.test(r.vivo), `libro: filtro «${f}» → ${r.vis} citas, aria-pressed y aviso aria-live («${r.vivo}»)`);
    }
    const alternan = await page.evaluate(() => [...document.querySelectorAll('.libro__entrada')].map(e => e.dataset.casa).every((c, i, a) => i === 0 || c !== a[i - 1]));
    comprobar(alternan, 'libro: las citas alternan Ramona y Jerónimo');
    await ctx.close();
  }
  for (const [w, h] of [[390, 844], [360, 640]]) {
    const { ctx, page } = await nuevaPagina({ viewport: { width: w, height: h } });
    await abrir(page);
    await irA(page, '.libro__hoja', 0.1);
    await page.waitForTimeout(6500);
    const r = await page.evaluate(() => {
      const hoja = document.querySelector('.libro__hoja');
      const R = parseFloat(getComputedStyle(hoja.closest('.libro__pagina--der')).getPropertyValue('--renglon'));
      const top = hoja.getBoundingClientRect().top;
      const rayas = []; for (let y = top + R - 1; y < hoja.getBoundingClientRect().bottom; y += R) rayas.push(y);
      const pisan = [];
      const mirar = (el, nombre) => {
        const rg = document.createRange(); rg.selectNodeContents(el);
        for (const b of rg.getClientRects()) { if (b.height < 2) continue; if (rayas.some(y => y > b.top + 0.5 && y < b.bottom - 0.5)) pisan.push(nombre + ' «' + el.textContent.slice(0, 24) + '»'); }
      };
      document.querySelectorAll('.libro__firma').forEach(e => mirar(e, 'firma'));
      document.querySelectorAll('.libro__cabecera span').forEach(e => mirar(e, 'cabecera'));
      document.querySelectorAll('.libro__texto').forEach(e => mirar(e, 'cita'));
      return { R, pisan, una: getComputedStyle(document.querySelector('.libro__abierto')).gridTemplateColumns.split(' ').length };
    });
    comprobar(!r.pisan.length && r.R > 0, `libro (${w}): ninguna etiqueta ni renglón pisa una raya (renglón ${r.R} px) ${r.pisan.slice(0, 3).join(', ')}`);
    comprobar(r.una === 1, `libro (${w}): una sola página, con el sello arriba`);
    if (conCapturas) await page.screenshot({ path: captura(`libro-sello-caido-${w}.png`) });
    await ctx.close();
  }

  /* borrado del libro, en una copia temporal */
  {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cdc-libro-'));
    const fuera = new Set(['screenshots', 'fuentes', 'node_modules', '.git']);
    (function copiar(de, a) { fs.mkdirSync(a, { recursive: true }); for (const e of fs.readdirSync(de, { withFileTypes: true })) { if (fuera.has(e.name)) continue; const o = path.join(de, e.name), d = path.join(a, e.name); if (e.isDirectory()) copiar(o, d); else fs.copyFileSync(o, d); } })(raiz, tmp);
    let salida = '';
    try { salida = execFileSync(process.execPath, [path.join(tmp, 'scripts/quitar-libro.mjs')], { cwd: tmp, encoding: 'utf8' }); } catch (e) { salida = 'ERROR ' + e.message; }
    const srv = await servir(tmp, PUERTO_COPIA);
    const { ctx, page } = await nuevaPagina();
    await page.goto(`http://127.0.0.1:${PUERTO_COPIA}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3200);
    await hastaAbajo(page);
    const r = await page.evaluate(() => ({ libro: !!document.getElementById('libro'), menu: [...document.querySelectorAll('#menu a')].some(a => /Opiniones/.test(a.textContent)), normas: !!document.getElementById('normas'), css: !!document.querySelector('link[href*="libro.css"]') }));
    comprobar(/Libro de visitas quitado/.test(salida) && !r.libro && !r.menu && !r.css && r.normas, 'libro: quitar-libro.mjs lo borra (sección, CSS, JS y enlace del menú) y la portada sigue entera');
    comprobar(!page.errores.length && !page.respuestas.length, 'libro: sin el módulo, consola limpia y sin 404 (' + [...page.errores, ...page.respuestas].join(' | ') + ')');
    await page.goto(`http://127.0.0.1:${PUERTO_COPIA}/ramona.html`, { waitUntil: 'networkidle' });
    const citas = await page.evaluate(() => document.querySelectorAll('.notas__citas .cita').length);
    comprobar(citas === 5, 'libro: sin el módulo, las páginas de casa siguen con sus citas (opiniones.json)');
    await ctx.close();
    page.errores = []; page.respuestas = [];
    await new Promise(r => srv.close(r));
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  /* ═══════════════ 9 · las dos densidades (?revision) ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina();
    await abrir(page);
    const sin = await page.evaluate(() => { const m = document.getElementById('mando'); return m.hidden && getComputedStyle(m).display === 'none'; });
    comprobar(sin, 'densidades: sin ?revision no hay mando (hidden y display:none)');
    const marcas = await page.evaluate(() => [...document.querySelectorAll('.solo-revision')].every(e => getComputedStyle(e).display === 'none'));
    comprobar(marcas, 'revisión: sin ?revision las marcas [VERIFICAR]/[PENDIENTE] no se ven');
    await ctx.close();
  }
  {
    const { ctx, page } = await nuevaPagina({}, { cookiesVistas: false });
    await abrir(page, '?revision');
    const conCookies = await page.evaluate(() => getComputedStyle(document.getElementById('mando')).display);
    comprobar(conCookies === 'none', 'densidades: el mando se aparta mientras está el aviso de cookies');
    await page.click('#cookies-aceptar');
    const r0 = await page.evaluate(() => ({ mando: getComputedStyle(document.getElementById('mando')).display, cookies: getComputedStyle(document.getElementById('cookies')).display, marcas: [...document.querySelectorAll('.solo-revision')].filter(e => getComputedStyle(e).display !== 'none').length, pend: document.querySelectorAll('.mando__pendientes li').length }));
    comprobar(r0.cookies === 'none' && r0.mando !== 'none', 'checklist 4 · el botón de cookies las cierra (display none) y aparece el mando');
    comprobar(r0.marcas >= 2 && r0.pend >= 5, `revisión: se ven las marcas (${r0.marcas}) y el mando lista los pendientes de Verónica (${r0.pend})`);
    if (conCapturas) { await page.screenshot({ path: captura('densidad-vecina-1440.png') }); }
    await page.click('[data-densidad="sobria"]');
    await page.waitForTimeout(700);
    const s = await page.evaluate(() => ({
      clase: document.documentElement.classList.contains('densidad-sobria'),
      cinta: [...document.querySelectorAll('.cinta-sep')].every(e => getComputedStyle(e).display === 'none'),
      frisos: [...document.querySelectorAll('.friso-sep')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.className),
      tabla: getComputedStyle(document.getElementById('comparar')).display,
      filasTabla: document.querySelectorAll('#comparar tbody tr').length,
      bookingTabla: document.querySelectorAll('#comparar tfoot a[data-booking]').length,
      pin: window.CDC.hero.st,
      rayado: getComputedStyle(document.querySelector('.libro__hoja')).backgroundImage,
      ancho: document.documentElement.scrollWidth <= innerWidth,
      guardada: localStorage.getItem('cdc-densidad')
    }));
    comprobar(s.clase && s.cinta, 'sobria: sin cinta separadora');
    comprobar(s.frisos.length === 1 && /friso-sep--pie/.test(s.frisos[0]), 'sobria: el friso de reja solo encima del pie (' + s.frisos.length + ' visible)');
    comprobar(s.tabla === 'block' && s.filasTabla >= 14 && s.bookingTabla === 2, `sobria: añade la tabla comparativa (${s.filasTabla} filas y un Booking por columna)`);
    comprobar(s.pin === null, 'sobria: la reja del hero sin pin');
    comprobar(s.rayado === 'none', 'sobria: el libro, como lista limpia (sin rayado)');
    comprobar(s.ancho, 'sobria: sin desbordamiento horizontal');
    comprobar(s.guardada === 'sobria', 'densidades: la elección se guarda (cdc-densidad)');
    await irA(page, '#diptico', 0.05);
    const b = await page.locator('.mitad--ramona').boundingBox();
    await page.mouse.move(b.x + 30, b.y + 30); await page.mouse.move(b.x + 200, b.y + 120); await page.waitForTimeout(500);
    comprobar(await page.evaluate(() => window.CDC.llaveros.every(s => s.a === 0 && s.v === 0)), 'sobria: los llaveros, quietos');
    if (conCapturas) { await page.mouse.wheel(0, -20000); await page.waitForTimeout(1500); await page.screenshot({ path: captura('densidad-sobria-1440.png') }); await irA(page, '#comparar', 0.1); await page.screenshot({ path: captura('densidad-sobria-tabla-1440.png') }); }
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
    comprobar(await page.evaluate(() => document.documentElement.classList.contains('densidad-sobria')), 'densidades: con ?revision, al recargar se aplica la guardada sin salto (desde el <head>)');
    await page.click('[data-densidad="vecina"]'); await page.waitForTimeout(600);
    comprobar(await page.evaluate(() => document.documentElement.classList.contains('densidad-vecina') && getComputedStyle(document.getElementById('comparar')).display === 'none'), 'densidades: se puede volver a «Catedral de vecina»');
    await page.click('[data-densidad="sobria"]'); await page.waitForTimeout(300);
    await page.goto(BASE, { waitUntil: 'networkidle' });
    comprobar(await page.evaluate(() => document.documentElement.classList.contains('densidad-vecina')), 'densidades: sin ?revision NO se aplica la guardada (el cliente ve siempre la cargada)');
    await ctx.close();
  }

  /* ═══════════════ 10 · checklist: cursor, menú móvil, sticky, recorrido completo ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina();
    await abrir(page);
    await page.mouse.move(300, 300); await page.mouse.move(320, 310);
    await page.waitForTimeout(200);
    const b = await page.locator('.hero__botones .boton--claro').boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.move(b.x + b.width / 2 + 2, b.y + b.height / 2);
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const aro = document.querySelector('.cursor');
      const fondo = getComputedStyle(aro).backgroundColor.match(/[\d.]+/g).map(Number);
      return { body: getComputedStyle(document.body).cursor, boton: getComputedStyle(document.querySelector('.hero__botones .boton')).cursor, activo: aro.classList.contains('es-activo'), alfa: fondo[3] ?? 1, vivo: aro.classList.contains('es-vivo') };
    });
    comprobar(r.body === 'none' && r.boton === 'none', 'checklist 1 · cursor propio: el del sistema oculto (body y botones: cursor none)');
    comprobar(r.vivo && r.activo && r.alfa >= 0.35, `checklist 1 · sobre un botón, el aro se llena (alfa ${r.alfa})`);
    /* sticky: ningún ancestro con overflow hidden/auto (memoria «overflow:hidden rompe sticky») */
    const sticky = await page.evaluate(() => {
      const malos = [];
      document.querySelectorAll('*').forEach(el => {
        if (getComputedStyle(el).position !== 'sticky') return;
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a).overflowY; if (o === 'hidden' || o === 'auto' || o === 'scroll') malos.push(el.className + ' ← ' + a.className); }
      });
      return { n: document.querySelectorAll('.libro__izq-dentro').length, malos };
    });
    comprobar(!sticky.malos.length, 'checklist 2 · no hay pila sticky; el único sticky (la página izquierda del libro) no tiene ancestros con overflow hidden ' + sticky.malos.join(', '));
    /* recorrido completo con la rueda: todo lo que se revela, revelado */
    await hastaAbajo(page);
    const rev = await page.evaluate(() => {
      const sin = [...document.querySelectorAll('[data-revelar] .letra, [data-revelar] .palabra-int')].filter(l => { const m = new DOMMatrix(getComputedStyle(l).transform); return Math.abs(m.m42) > 1; });
      return { sin: sin.length, total: document.querySelectorAll('[data-revelar] .letra, [data-revelar] .palabra-int').length, escritas: window.CDCLibro.escrito };
    });
    comprobar(rev.sin === 0 && rev.escritas, `recorrido completo (1440): los ${rev.total} trozos de titular revelados y el libro escrito`);
    comprobar(await page.evaluate(() => { const i = document.querySelector('.donde__mapa iframe'); return !i; }), 'mapa: el iframe de Google no existe hasta pulsar');
    await page.click('#mapa-boton'); await page.waitForTimeout(300);
    const ifr = await page.evaluate(() => { const i = document.querySelector('.donde__mapa iframe'); return i ? i.src : ''; });
    comprobar(/google\.com\/maps\?q=Calle\+Mel%C3%A9ndez\+Vald%C3%A9s\+1\+Badajoz&output=embed/.test(ifr), 'mapa: al pulsar, iframe maps?q=…&output=embed');
    if (conCapturas) await page.screenshot({ path: captura('pie-1440.png') });
    await ctx.close();
  }
  {
    const { ctx, page } = await nuevaPagina({ viewport: { width: 375, height: 740 } });
    await abrir(page);
    await hastaAbajo(page, 500);
    const rev = await page.evaluate(() => ({ sin: [...document.querySelectorAll('[data-revelar] .letra, [data-revelar] .palabra-int')].filter(l => Math.abs(new DOMMatrix(getComputedStyle(l).transform).m42) > 1).length, escritas: window.CDCLibro.escrito }));
    comprobar(rev.sin === 0 && rev.escritas, 'recorrido completo (375×740): todo revelado (observadores con umbral 0 sobre el bloque)');
    /* menú móvil con la cabecera YA fija */
    const m = await page.evaluate(() => { const n = document.getElementById('menu').getBoundingClientRect(); return { fija: document.getElementById('cabecera').classList.contains('es-fija'), bottom: n.bottom, alto: n.height, vh: innerHeight }; });
    comprobar(m.fija && m.bottom <= 1 && m.alto >= m.vh - 1, `checklist 3 · menú móvil cerrado con la cabecera fija: fuera de pantalla (bottom ${Math.round(m.bottom)}) y de alto completo (${Math.round(m.alto)} ≥ ${m.vh})`);
    await page.click('#hamburguesa'); await page.waitForTimeout(800);
    const ab = await page.evaluate(() => { const n = document.getElementById('menu').getBoundingClientRect(); return { top: n.top, alto: n.height, exp: document.getElementById('hamburguesa').getAttribute('aria-expanded'), vis: getComputedStyle(document.getElementById('menu')).visibility }; });
    comprobar(Math.abs(ab.top) < 1 && ab.alto >= 739 && ab.exp === 'true' && ab.vis === 'visible', 'checklist 3 · menú móvil abierto: cubre la pantalla (100dvh) y aria-expanded=true');
    if (conCapturas) await page.screenshot({ path: captura('menu-movil-375.png') });
    await page.click('#hamburguesa'); await page.waitForTimeout(800);
    comprobar(await page.evaluate(() => document.getElementById('hamburguesa').getAttribute('aria-expanded') === 'false' && document.getElementById('menu').getBoundingClientRect().bottom <= 1), 'checklist 3 · el botón cierra el menú (no queda tapado por el panel)');
    await ctx.close();
  }
  {
    const { ctx, page } = await nuevaPagina({}, { cookiesVistas: false });
    await abrir(page);
    const a = await page.evaluate(() => getComputedStyle(document.getElementById('cookies')).display);
    await page.click('#cookies-aceptar');
    const b = await page.evaluate(() => getComputedStyle(document.getElementById('cookies')).display);
    await page.reload({ waitUntil: 'networkidle' });
    const c = await page.evaluate(() => getComputedStyle(document.getElementById('cookies')).display);
    comprobar(a === 'flex' && b === 'none' && c === 'none', `checklist 4 · cookies: se ve (${a}), el botón la cierra (${b}) y no vuelve (${c})`);
    await ctx.close();
  }

  /* ═══════════════ 11 · textos ═══════════════ */
  {
    const { ctx, page } = await nuevaPagina();
    const prohibidos = [/desde\s+\d+[\s,.\d]*€/i, /más barato/i, /sin comisiones/i, /parking gratis/i, /bicicletas? gratis/i, /experiencia irrepetible/i, /\blujo/i, /exclusiv[oa]/i, /inolvidable/i, /[a-záéíóúñ]@[a-záéíóúñ]/i, /\d+\s*(reseñas|opiniones|valoraciones)\s*(en\s+)?Google/i, /Google[^.]{0,30}\d[,.]\d/i, /cancelación gratis/i, /\b(1|una) (sola |única )?reseña/i, /Casa de la Catedral/i];
    const nombres = /\b(Pilar|Santiago|Barbara|Bárbara|Ines|Inés|Manuel|Jaione|José|Juan)\b/;
    for (const p of ['', 'ramona.html', 'jeronimo.html', 'aviso-legal.html', 'privacidad.html']) {
      await page.goto(BASE + p, { waitUntil: 'networkidle' });
      const t = await page.evaluate(() => { const c = document.body.cloneNode(true); c.querySelectorAll('script, style, .solo-revision, .mando').forEach(n => n.remove()); return c.textContent.replace(/\s+/g, ' '); });
      const malos = prohibidos.filter(re => re.test(t)).map(re => (t.match(re) || [''])[0]);
      comprobar(!malos.length, `textos de ${p || 'index.html'}: nada prohibido ${malos.join(' | ')}`);
      const firmas = await page.evaluate(() => [...document.querySelectorAll('.libro__firma, .cita__firma, .destacada__cita cite')].map(e => e.textContent.trim()));
      comprobar(firmas.every(f => /^(Ramona|Jerónimo) · opinión en Booking$/.test(f)), `${p || 'index.html'}: las ${firmas.length} citas se firman con la casa, sin nombre de cliente`);
      const citas = await page.evaluate(() => [...document.querySelectorAll('.libro__texto, .cita p, .destacada__cita p')].map(e => e.textContent));
      comprobar(!citas.some(c => nombres.test(c.replace(/San Juan/g, ''))), `${p || 'index.html'}: ninguna cita lleva nombre de cliente`);
      /* TODO en mayúsculas y sin /i: «todo» es una palabra del texto */
      const pend = await page.evaluate(() => { const c = document.body.cloneNode(true); c.querySelectorAll('script, .solo-revision, .mando').forEach(n => n.remove()); const t = c.textContent; return [...(t.match(/\[PENDIENTE[^\]]*\]/g) || []), ...(t.match(/\bTODO\b/g) || []), ...(t.match(/lorem ipsum/gi) || [])]; });
      const legal = /aviso-legal|privacidad/.test(p);
      comprobar(legal ? pend.every(x => /PENDIENTE/.test(x)) : !pend.length, `${p || 'index.html'}: ${legal ? 'solo los [PENDIENTE] de titular/NIF/contacto (' + pend.length + ')' : 'sin [PENDIENTE], TODO ni relleno'}`);
    }
    /* las citas de la regla 8, literales */
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const libro = await page.evaluate(() => [...document.querySelectorAll('.libro__texto')].map(e => e.textContent));
    comprobar(opiniones.every(o => libro.includes('«' + o.texto + '»')), 'libro: las 10 citas, literales y sin corregir («comodisima», «Super céntrico . …»)');
    await ctx.close();
  }

  /* ═══════════════ 12 · capturas a los cinco tamaños ═══════════════ */
  if (conCapturas) {
    for (const [w, h] of TAMANOS) {
      const movil = w < 800;
      const { ctx, page } = await nuevaPagina({ viewport: { width: w, height: h } });
      await abrir(page);
      await page.screenshot({ path: captura(`portada-hero-${w}.png`) });
      await irA(page, '#diptico', 0.02);
      if (!movil) { const b = await page.locator('.mitad--jeronimo').boundingBox(); await page.mouse.move(b.x + b.width * 0.5, b.y + b.height * 0.4); await page.waitForTimeout(1200); }
      await page.screenshot({ path: captura(`portada-diptico-${w}.png`) });
      await page.mouse.move(2, 2);
      for (const [s, n] of [['#vista', 'vista'], ['#comun', 'comun'], ['#detalles', 'detalles'], ['#normas', 'normas'], ['#fechas', 'fechas'], ['#donde', 'donde']]) { await irA(page, s, 0.02); await page.screenshot({ path: captura(`portada-${n}-${w}.png`) }); }
      await irA(page, '.libro__hoja', 0.1); await page.waitForTimeout(6500);
      await irA(page, '#libro-sello', 0.6);
      await page.screenshot({ path: captura(`portada-libro-${w}.png`) });
      for (const c of ['ramona', 'jeronimo']) {
        await page.goto(BASE + c + '.html', { waitUntil: 'networkidle' }); await page.waitForTimeout(2600);
        await page.screenshot({ path: captura(`${c}-hero-${w}.png`) });
        const boton = page.locator('[data-estancia="salon"]'); await boton.scrollIntoViewIfNeeded(); await boton.click(); await page.waitForTimeout(700);
        await page.screenshot({ path: captura(`${c}-dialogo-${w}.png`) });
        await page.keyboard.press('Escape'); await page.waitForTimeout(200);
        await irA(page, '#notas', 0.02); await page.waitForTimeout(1300);
        await page.screenshot({ path: captura(`${c}-notas-${w}.png`) });
      }
      await ctx.close();
    }
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const { ctx, page } = await nuevaPagina({ viewport: { width: w, height: h } });
      await page.goto(BASE + 'no-existe', { waitUntil: 'networkidle' }); await page.waitForTimeout(2600);
      await page.screenshot({ path: captura(`404-${w}.png`) });
      page.respuestas = page.respuestas.filter(x => !/no-existe$/.test(x));
      page.errores = page.errores.filter(x => !/Failed to load resource.*404/.test(x));
      await ctx.close();
    }
  }

  /* ═══════════════ consola limpia en todas las pasadas ═══════════════ */
  const errores = todasLasPaginas.flatMap(p => p.errores.filter(e => !(p.bloqueaCDN && /Failed to load resource|net::ERR_FAILED/.test(e))));
  const http404 = todasLasPaginas.flatMap(p => p.respuestas);
  comprobar(!errores.length, 'consola limpia en todas las pasadas ' + [...new Set(errores)].slice(0, 5).join(' | '));
  comprobar(!http404.length, 'sin 404 en todas las pasadas ' + [...new Set(http404)].slice(0, 5).join(' | '));
} catch (e) {
  fallos.push('FALLA · el verificador se ha roto: ' + (e.stack || e.message));
} finally {
  await navegador.close();
  servidor.close();
}

console.log(notas.join('\n'));
if (fallos.length) console.log('\n' + fallos.join('\n'));
console.log(`\n${notas.length} bien · ${fallos.length} mal`);
process.exitCode = fallos.length ? 1 : 0;
