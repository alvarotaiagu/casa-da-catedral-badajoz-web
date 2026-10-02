/* Construye la web desde data/*.json. Idempotente: la segunda pasada no cambia nada.

     1. index.html  — rellena sus regiones ⟦gen:…⟧ (díptico, tabla, horarios,
                      libro, Booking, JSON-LD, dibujos…) y cada <picture data-foto>.
     2. ramona.html y jeronimo.html — se GENERAN enteras desde plantillas/casa.html
                      y data/casas.json, en HTML estático (nada depende del JS).
     3. Todas las páginas — copia las regiones ⟦comun:…⟧ desde plantillas/_*.html
                      (arranque del <head>, cortina, cabecera, pie y avisos).

   node scripts/construir.mjs
   node scripts/construir.mjs --comprobar   (no escribe; falla si algo cambiaría)

   Reglas de los datos:
     - planta / origen_nombre en null → no se enseña nada (ni «pendiente»).
     - contacto en null (data/config.json) → envíos apagados; Booking manda.
     - una estancia sin fotos → tarjeta sin botón (el hueco va anotado en el README).
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as D from './dibujos.mjs';
import { versiones, versionarHtml } from './versionar.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = f => fs.readFileSync(path.join(raiz, f), 'utf8');
const json = f => JSON.parse(leer(f));
const comprobar = process.argv.includes('--comprobar');

const { casas, comun } = json('data/casas.json');
const config = json('data/config.json');
const opiniones = json('data/opiniones.json');
const fotos = Object.fromEntries(json('data/fotos.json').fotos.map(f => [f.id, f]));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const num = n => String(n).replace('.', ',');
const nota = n => Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
const porSlug = Object.fromEntries(casas.map(c => [c.slug, c]));
const otraDe = c => casas.find(x => x.slug !== c.slug);

/* ───────────────────────── fotos ───────────────────────── */
function foto(id) { const f = fotos[id]; if (!f) throw new Error('No está en data/fotos.json: ' + id); return f; }
function srcset(id, ext) { const f = foto(id); return f.anchos.map(a => `assets/fotos/${id}-${a}.${ext} ${a}w`).join(', '); }
export function pictureDentro(id, { sizes = '100vw', carga = 'lazy', alt = null, movil = null, posicion = null, sangria = '' } = {}) {
  const f = foto(id);
  const mayor = f.anchos[f.anchos.length - 1];
  const alto = Math.round(f.h * mayor / f.w);
  const extra = carga === 'eager' ? ' fetchpriority="high"' : ' loading="lazy"';
  const lineas = [];
  if (movil) {
    foto(movil);
    lineas.push(`<source media="(max-width: 700px)" type="image/avif" srcset="${srcset(movil, 'avif')}" sizes="${sizes}">`);
    lineas.push(`<source media="(max-width: 700px)" type="image/webp" srcset="${srcset(movil, 'webp')}" sizes="${sizes}">`);
    lineas.push(`<source media="(max-width: 700px)" srcset="${srcset(movil, 'jpg')}" sizes="${sizes}">`);
  }
  lineas.push(`<source type="image/avif" srcset="${srcset(id, 'avif')}" sizes="${sizes}">`);
  lineas.push(`<source type="image/webp" srcset="${srcset(id, 'webp')}" sizes="${sizes}">`);
  const estilo = posicion ? ` style="object-position:${posicion}"` : '';
  lineas.push(`<img src="assets/fotos/${id}-${mayor}.jpg" srcset="${srcset(id, 'jpg')}" sizes="${sizes}" width="${mayor}" height="${alto}" alt="${esc(alt ?? f.alt)}" decoding="async"${extra}${estilo}>`);
  return lineas.map(l => sangria + l).join('\n');
}
const pic = (id, o = {}) => `<picture data-foto="${id}"${o.sizes ? ` data-sizes="${o.sizes}"` : ''}${o.carga ? ` data-carga="${o.carga}"` : ''}${o.alt != null ? ` data-alt="${esc(o.alt)}"` : ''}${o.posicion ? ` data-posicion="${o.posicion}"` : ''}${o.movil ? ` data-movil="${o.movil}"` : ''}></picture>`;

const attr = (t, n) => { const m = t.match(new RegExp('\\s' + n + '="([^"]*)"')); return m ? m[1] : null; };
function rellenarPictures(html) {
  return html.replace(/([ \t]*)<picture([^>]*\sdata-foto="([\w-]+)"[^>]*)>[\s\S]*?<\/picture>/g, (todo, sangria, atributos, id) => {
    const alt = attr(atributos, 'data-alt');
    const dentro = pictureDentro(id, {
      sizes: attr(atributos, 'data-sizes') || '100vw',
      carga: attr(atributos, 'data-carga') || 'lazy',
      alt: alt == null ? null : alt.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'),
      movil: attr(atributos, 'data-movil'),
      posicion: attr(atributos, 'data-posicion'),
      sangria: sangria + '  '
    });
    return `${sangria}<picture${atributos}>\n${dentro}\n${sangria}</picture>`;
  });
}

/* ───────────────────────── piezas ───────────────────────── */
const lis = '<svg class="lis" aria-hidden="true"><use href="#lis"/></svg>';

/* el llavero: anilla de metal y la cinta con el nombre en vertical (se lee de abajo arriba, con la lis en el extremo libre, como los suyos) */
function llavero(texto, { clase = '', largo = '' } = {}) {
  return `<div class="llavero${clase ? ' ' + clase : ''}" data-llavero aria-hidden="true">` +
    `<svg class="llavero__anilla" viewBox="0 0 40 40"><use href="#anilla"/></svg>` +
    `<span class="llavero__cinta cinta-tela${largo ? ' llavero__cinta--' + largo : ''}"><span class="llavero__texto">${lis}<span>${esc(texto)}</span></span></span>` +
    `</div>`;
}
/* la cinta como separador: tramo que corre, repetido dos veces para el bucle */
function cinta() {
  const trozo = ['Casa da Catedral', 'Ramona', 'Jerónimo'].map(t => `<span>${t}</span>${lis}`).join('');
  const grupo = `<span class="cinta__grupo">${trozo.repeat(3)}</span>`;
  return `<div class="cinta cinta-tela"><div class="cinta__pista">${grupo}${grupo}</div></div>`;
}
function datosCasa(c, { conNota = true } = {}) {
  const partes = [];
  if (c.planta) partes.push(`<span>${esc(c.planta)} planta</span>`);
  partes.push(`<span>${c.metros} m²</span>`, `<span>${c.dormitorios} dormitorios</span>`, `<span>hasta ${c.personas}</span>`);
  if (conNota) partes.push(`<span><b>${nota(c.nota)}</b> en Booking</span>`);
  return partes.join('<i aria-hidden="true"> · </i>');
}
function botonBooking(c, texto, clase = 'boton boton--booking') {
  return `<a class="${clase}" href="${esc(c.booking)}" target="_blank" rel="noopener" data-booking="${c.slug}"><span>${esc(texto)}</span><svg aria-hidden="true"><use href="#i-externo"/></svg></a>`;
}

function diptico() {
  const mitad = c => `
    <a class="mitad mitad--${c.slug}" href="./${c.slug}.html" aria-label="${esc(c.nombre)}: ${esc(c.metros + ' m², hasta ' + c.personas + ' personas, ' + nota(c.nota) + ' en Booking')}">
      <div class="mitad__foto">${pic(c.fotos.diptico, { sizes: '(max-width: 860px) 100vw, 70vw', posicion: c.fotos.diptico_posicion, alt: '' })}</div>
      <div class="mitad__velo" aria-hidden="true"></div>
      <div class="mitad__llavero">${llavero(c.nombre)}</div>
      <div class="mitad__texto">
        ${D.adornoSVG(c.adorno, { clase: 'adorno' })}
        <h3 class="mitad__nombre" data-revelar="letras">${esc(c.nombre)}</h3>
        <p class="mitad__datos">${datosCasa(c)}</p>
        <span class="mitad__ir">Ver ${esc(c.nombre)} <svg aria-hidden="true"><use href="#i-flecha"/></svg></span>
      </div>
    </a>`;
  return `<div class="diptico" id="diptico">${casas.map(mitad).join('')}\n    </div>`;
}

function tabla() {
  const [a, b] = casas;
  const fila = (th, fa, fb) => `<tr><th scope="row">${th}</th><td>${fa}</td><td>${fb}</td></tr>`;
  const camas = c => c.camas.filter(x => x.donde !== 'Salón').map(x => esc(x.que)).join('<br>');
  const filas = [];
  if (a.planta && b.planta) filas.push(fila('Planta', esc(a.planta), esc(b.planta)));
  filas.push(fila('Tamaño', `${a.metros} m²`, `${b.metros} m²`));
  filas.push(fila('Dormitorios', camas(a), camas(b)));
  filas.push(fila('Salón', 'sofá cama', 'sofá cama'));
  filas.push(fila('Baños', `${a.banos}, con ducha`, `${b.banos}, con ducha`));
  filas.push(fila('Personas', `hasta ${a.personas}`, `hasta ${b.personas}`));
  filas.push(fila('Entrada', `de ${a.entrada.desde} a ${a.entrada.hasta}`, `de ${b.entrada.desde} a ${b.entrada.hasta}`));
  filas.push(fila('Salida', `hasta las ${a.salida.hasta}`, `hasta las ${b.salida.hasta}`));
  filas.push(fila('Nota en Booking', `<b>${nota(a.nota)}</b> · ${a.comentarios} comentarios`, `<b>${nota(b.nota)}</b> · ${b.comentarios} comentarios`));
  a.categorias.forEach((cat, i) => {
    const otra = b.categorias[i];
    const va = cat.nota, vb = otra.nota;
    const marca = (v, w) => v > w ? `<b>${nota(v)}</b>` : nota(v);
    filas.push(fila(esc(cat.nombre), marca(va, vb), marca(vb, va)));
  });
  return `
    <div class="comparar ancho solo-sobria" id="comparar">
      <h3 class="comparar__titulo">Lado a lado</h3>
      <div class="comparar__marco" role="group" aria-label="Tabla comparativa de las dos casas">
        <table class="comparar__tabla">
          <caption class="visualmente-oculto">Ramona y Jerónimo comparadas: tamaño, camas, horarios y notas de Booking por categoría</caption>
          <thead><tr><td></td><th scope="col">${esc(a.nombre)}</th><th scope="col">${esc(b.nombre)}</th></tr></thead>
          <tbody>
            ${filas.join('\n            ')}
          </tbody>
          <tfoot><tr><td></td><td>${botonBooking(a, 'Reservar ' + a.nombre, 'boton boton--booking boton--mini')}</td><td>${botonBooking(b, 'Reservar ' + b.nombre, 'boton boton--booking boton--mini')}</td></tr></tfoot>
        </table>
      </div>
      <p class="comparar__nota">En negrita, la nota más alta de cada fila. Notas de Booking comprobadas el 2 de octubre de 2026.</p>
    </div>`;
}

function detalles() {
  const [r, j] = casas;
  const item = (c, m) => `<li class="detalle detalle--${c.slug}"><div class="detalle__foto">${pic(m.foto, { sizes: '(max-width: 860px) 46vw, 260px', alt: '' })}</div><p class="detalle__pie"><b>${esc(c.nombre)}</b> · ${esc(m.texto)}</p></li>`;
  const fila1 = [], fila2 = [];
  for (let i = 0; i < r.marquee.length; i++) {
    const a = [r, r.marquee[i]], b = [j, j.marquee[i]];
    (i % 2 ? fila2 : fila1).push(item(...a));
    (i % 2 ? fila1 : fila2).push(item(...b));
  }
  /* la primera fila empieza por Ramona y la segunda por Jerónimo: se alternan */
  fila2.unshift(fila2.pop());
  return `
    <div class="detalles__filas" id="detalles-filas" role="group" aria-label="Detalles de las dos casas">
      <div class="fila" data-sentido="1"><ul class="fila__pista">${fila1.join('')}</ul></div>
      <div class="fila" data-sentido="-1"><ul class="fila__pista">${fila2.join('')}</ul></div>
    </div>`;
}

function libroCitas() {
  return `<ol class="libro__citas" id="libro-citas">\n` + opiniones.citas.map(c =>
    `              <li class="libro__entrada" data-casa="${c.casa}"><p class="libro__texto">«${esc(c.texto)}»</p><p class="libro__firma">${esc(porSlug[c.casa].nombre)} · opinión en Booking</p></li>`
  ).join('\n') + `\n            </ol>`;
}
function libroEnlaces() {
  return casas.map(c => `<a class="enlace" href="${esc(c.booking)}#tab-reviews" target="_blank" rel="noopener">${esc(c.nombre)}</a>`).join(' · ');
}

function horarioCasa(c) {
  return `<div class="horario__casa horario__casa--${c.slug}"><dt>${esc(c.nombre)}</dt><dd>Entrada de ${c.entrada.desde} a ${c.entrada.hasta}</dd><dd>Salida hasta las ${c.salida.hasta}</dd></div>`;
}
function horarios() {
  return `      <div class="normas__bloque normas__bloque--horario">
        <h3><svg aria-hidden="true"><use href="#i-llave"/></svg>Horarios</h3>
        <dl class="horario">${casas.map(horarioCasa).join('')}</dl>
      </div>`;
}
function bookingBotones() {
  return `<div class="fechas__botones">${casas.map(c => botonBooking(c, `Reservar ${c.nombre} en Booking`)).join('')}</div>
        <p class="fechas__nota">Se abre la ficha de cada casa en Booking, con sus fechas libres.</p>`;
}

/* JSON-LD: LodgingBusiness con las dos casas dentro. Sin aggregateRating; sin teléfono mientras sea null. */
function alojamiento(c, conUrl = true) {
  const o = {
    '@type': 'Accommodation',
    name: c.nombre,
    description: c.caracter,
    floorSize: { '@type': 'QuantitativeValue', value: c.metros, unitCode: 'MTK' },
    numberOfRooms: c.dormitorios,
    numberOfBedrooms: c.dormitorios,
    numberOfBathroomsTotal: c.banos,
    occupancy: { '@type': 'QuantitativeValue', maxValue: c.personas },
    petsAllowed: true,
    image: `assets/og/og-${c.slug}.jpg`
  };
  if (conUrl) o.url = `${c.slug}.html`;
  if (c.planta) o.floorLevel = c.planta;
  o.sameAs = c.booking;
  return o;
}
function negocio(conCasas = true) {
  const o = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    '@id': '#casa-da-catedral',
    name: 'Casa da Catedral',
    slogan: 'Apartamentos que son hogar',
    description: 'Dos apartamentos turísticos, Ramona y Jerónimo, en la Plaza de España de Badajoz, frente a la Catedral.',
    image: 'assets/og/og-portada.jpg',
    address: { '@type': 'PostalAddress', streetAddress: comun.direccion, postalCode: comun.cp, addressLocality: comun.ciudad, addressRegion: 'Badajoz', addressCountry: 'ES' },
    geo: { '@type': 'GeoCoordinates', latitude: comun.geo[0], longitude: comun.geo[1] },
    sameAs: [config.instagram, ...casas.map(c => c.booking)],
    petsAllowed: true,
    knowsLanguage: ['es', 'en']
  };
  if (config.telefono) o.telephone = config.telefono;
  if (config.email) o.email = config.email;
  if (conCasas) o.containsPlace = casas.map(c => alojamiento(c));
  return o;
}
const ldScript = o => `<script type="application/ld+json" id="datos-estructurados">\n${JSON.stringify(o, null, 2)}\n</script>`;

/* pendientes para el mando (?revision), según lo que siga en null */
function pendientes() {
  const p = [];
  if (!config.telefono && !config.email && !config.whatsapp) p.push('Sin contacto directo: ni teléfono, ni email, ni WhatsApp');
  p.push('La azotea: ¿compartida o de cada casa? [VERIFICAR]');
  casas.filter(c => !c.planta).forEach(c => p.push(`La planta de ${c.nombre}`));
  if (casas.some(c => c.origen_nombre == null)) p.push('Por qué se llaman Ramona y Jerónimo');
  p.push(`La licencia ${comun.licencia} sale en las dos fichas: ¿una para las dos?`);
  if (!config.libro_foto) p.push('Permiso para la foto del libro de visitas');
  return p.map(t => `      <li>${esc(t)}</li>`).join('\n');
}

/* ───────────────────────── regiones ───────────────────────── */
function region(html, tipo, nombre, contenido, obligatoria = false) {
  const re = new RegExp(`(<!-- ⟦${tipo}:${nombre}⟧ -->)[\\s\\S]*?(<!-- ⟦/${tipo}:${nombre}⟧ -->)`, 'g');
  if (!re.test(html)) { if (obligatoria) throw new Error('Falta la región ' + tipo + ':' + nombre); return html; }
  return html.replace(re, (m, a, b) => `${a}\n${contenido}\n${b}`);
}
const parcial = (n, vars = {}) => leer(`plantillas/_${n}.html`).replace(/\{\{([\w-]+)\}\}/g, (m, k) => { if (!(k in vars)) throw new Error(`_${n}.html: falta {{${k}}}`); return vars[k]; }).trimEnd();

const simbolos = D.sprite().replace('</defs>',
  `<pattern id="friso-oscuro" width="17.27" height="42" patternUnits="userSpaceOnUse"><path d="M8.64 2L17.27 21L8.64 40L0 21Z" fill="none" stroke="#1D1B19" stroke-width="1.3"/><rect width="17.27" height="2.2" fill="#1D1B19"/><rect y="39.8" width="17.27" height="2.2" fill="#1D1B19"/></pattern>` +
  `<pattern id="friso-claro" width="17.27" height="42" patternUnits="userSpaceOnUse"><path d="M8.64 2L17.27 21L8.64 40L0 21Z" fill="none" stroke="#A18265" stroke-width="1.3"/><rect width="17.27" height="2.2" fill="#A18265"/><rect y="39.8" width="17.27" height="2.2" fill="#A18265"/></pattern>` +
  `</defs>`);
const configPublica = { telefono: config.telefono, email: config.email, whatsapp: config.whatsapp, instagram: config.instagram, libro_foto: config.libro_foto };
const comunes = {
  arranque: parcial('arranque'),
  cortina: parcial('cortina', {
    'torre-cortina': D.torreSVG({ id: 'torre-cortina', clase: 'torre' }),
    'llavero-cortina': llavero('Casa da Catedral', { clase: 'llavero--marca', largo: 'largo' })
  }),
  cabecera: parcial('cabecera'),
  pie: parcial('pie', { licencia: comun.licencia, instagram: esc(config.instagram) }),
  avisos: parcial('avisos', { config: JSON.stringify(configPublica).replace(/</g, '\\u003c'), pendientes: pendientes() })
};
function ponerComunes(html) {
  for (const [n, c] of Object.entries(comunes)) html = region(html, 'comun', n, c);
  return html;
}

/* ───────────────────────── páginas de casa ───────────────────────── */
function paginaCasa(c) {
  const otra = otraDe(c);
  const mias = opiniones.citas.filter(o => o.casa === c.slug);
  const estancias = c.estancias.map((e, i) => {
    const portada = e.fotos[0];
    if (!portada) {
      /* sin foto: la tarjeta existe (la casa tiene la estancia) pero no abre nada */
      return `        <li class="estancia estancia--sin-foto"><div class="estancia__hueco" aria-hidden="true"><svg><use href="#i-ducha"/></svg></div><h3 class="estancia__nombre">${esc(e.nombre)}</h3><p class="estancia__texto">${esc(e.texto)}</p><p class="solo-revision marca-revision">[PENDIENTE: no hay foto de los baños de ${esc(c.nombre)} en Booking]</p></li>`;
    }
    return `        <li class="estancia"><button class="estancia__boton" type="button" data-estancia="${e.id}" aria-haspopup="dialog">` +
      `<span class="estancia__foto">${pic(portada, { sizes: '(max-width: 640px) 92vw, (max-width: 1100px) 46vw, 380px', alt: '' })}</span>` +
      `<span class="estancia__nombre">${esc(e.nombre)}</span><span class="estancia__texto">${esc(e.texto)}</span>` +
      `<span class="estancia__cuenta">${e.fotos.length} ${e.fotos.length === 1 ? 'foto' : 'fotos'}</span></button></li>`;
  }).join('\n');
  const estanciasJson = c.estancias.filter(e => e.fotos.length).map(e => ({
    id: e.id, nombre: e.nombre,
    fotos: e.fotos.map(id => { const f = foto(id); return { id, alt: f.alt, w: f.w, h: f.h, anchos: f.anchos }; })
  }));
  const camas = c.camas.map(x => `          <div><dt>${esc(x.donde)}</dt><dd>${esc(x.que)}</dd></div>`).join('\n');
  const detallesCasa = c.detalles.map(d => `        <li class="caracter__item"><div class="caracter__foto">${pic(d.foto, { sizes: '(max-width: 860px) 92vw, 30vw', alt: '' })}</div><h3>${esc(d.titulo)}</h3><p>${esc(d.texto)}</p></li>`).join('\n');
  const categorias = c.categorias.map(k => `        <li class="barra"><span class="barra__nombre">${esc(k.nombre)}</span><span class="barra__valor">${nota(k.nota)}</span><span class="barra__pista" aria-hidden="true"><span class="barra__relleno" style="--v:${(k.nota / 10).toFixed(3)}"></span></span></li>`).join('\n');
  const citas = mias.map(o => `        <li class="cita"><blockquote><p>«${esc(o.texto)}»</p></blockquote><p class="cita__firma">${esc(c.nombre)} · opinión en Booking</p></li>`).join('\n');
  const horario = horarioCasa(c);
  const otraTarjeta = `<a class="otra__tarjeta otra__tarjeta--${otra.slug}" href="./${otra.slug}.html">
        <span class="otra__foto">${pic(otra.fotos.diptico, { sizes: '(max-width: 860px) 92vw, 520px', posicion: otra.fotos.diptico_posicion, alt: '' })}</span>
        <span class="otra__texto">${D.adornoSVG(otra.adorno, { clase: 'adorno' })}<span class="otra__nombre">${esc(otra.nombre)}</span><span class="otra__datos">${datosCasa(otra)}</span><span class="otra__ir">Ver ${esc(otra.nombre)} <svg aria-hidden="true"><use href="#i-flecha"/></svg></span></span>
        <span class="otra__llavero">${llavero(otra.nombre)}</span>
      </a>`;
  const resumen = `${c.metros} m² · ${c.dormitorios} dormitorios · ${c.banos} baños con ducha · hasta ${c.personas} personas`;
  const vars = {
    nombre: esc(c.nombre), slug: c.slug, titulo: esc(c.titulo_pagina), descripcion: esc(c.descripcion),
    jsonld: ldScript({ '@context': 'https://schema.org', ...alojamiento(c, false), containedInPlace: (({ '@context': _, ...n }) => n)(negocio(false)) }),
    simbolos,
    adorno: D.adornoSVG(c.adorno, { clase: 'adorno', titulo: c.adorno_texto }),
    datos: datosCasa(c),
    caracter: esc(c.caracter),
    origen: c.origen_nombre ? `<p class="casa-hero__origen">${esc(c.origen_nombre)}</p>` : '',
    booking: esc(c.booking),
    'hero-foto': pic(c.fotos.hero, { sizes: '(max-width: 860px) 100vw, 50vw', carga: 'eager', posicion: c.fotos.hero_posicion }),
    'hero-pie': `La torre desde ${esc(c.nombre)}`,
    reja: D.rejaHero({ id: 'reja-' + c.slug, ancho: 720, S: 40, clase: 'reja' }),
    llavero: llavero(c.nombre),
    estancias, camas, resumen,
    detalles: detallesCasa,
    nota: nota(c.nota), comentarios: c.comentarios,
    categorias, citas, horario,
    'otra-nombre': esc(otra.nombre),
    otra: otraTarjeta,
    'estancias-json': JSON.stringify(estanciasJson).replace(/</g, '\\u003c')
  };
  let html = leer('plantillas/casa.html').replace(/\{\{([\w-]+)\}\}/g, (m, k) => { if (!(k in vars)) throw new Error(`casa.html: falta {{${k}}}`); return String(vars[k]); });
  html = ponerComunes(html);
  return rellenarPictures(html);
}

/* ───────────────────────── escribir ───────────────────────── */
const cambios = [];
const V = versiones(raiz);
function escribir(archivo, nuevo) {
  nuevo = versionarHtml(nuevo, V);          /* ?v=<huella> en los CSS/JS propios */
  const ruta = path.join(raiz, archivo);
  const antes = fs.existsSync(ruta) ? fs.readFileSync(ruta, 'utf8') : '';
  if (antes && nuevo.length < antes.length * 0.6) throw new Error('Me niego: ' + archivo + ' perdería demasiado');
  if (/\{\{[\w-]+\}\}/.test(nuevo)) throw new Error(archivo + ': queda un {{marcador}} sin rellenar');
  if (antes === nuevo) { console.log('sin cambios  ' + archivo); return; }
  cambios.push(archivo);
  if (!comprobar) fs.writeFileSync(ruta, nuevo);
  console.log((comprobar ? 'CAMBIARÍA   ' : 'actualizado  ') + archivo);
}

/* 1 · portada */
let portada = leer('index.html');
portada = region(portada, 'gen', 'simbolos', simbolos, true);
portada = region(portada, 'gen', 'jsonld', ldScript(negocio()), true);
portada = region(portada, 'gen', 'reja-hero', D.rejaHero({ id: 'reja-hero' }), true);
portada = region(portada, 'gen', 'cinta', cinta());
portada = region(portada, 'gen', 'diptico', diptico(), true);
portada = region(portada, 'gen', 'tabla', tabla());
portada = region(portada, 'gen', 'detalles', detalles());
portada = region(portada, 'gen', 'libro-citas', libroCitas());
portada = region(portada, 'gen', 'libro-enlaces', libroEnlaces());
portada = region(portada, 'gen', 'horarios', horarios(), true);
portada = region(portada, 'gen', 'booking', bookingBotones(), true);
portada = region(portada, 'gen', 'llavero-marca', llavero('Casa da Catedral', { clase: 'llavero--marca', largo: 'largo' }));
portada = ponerComunes(portada);
escribir('index.html', rellenarPictures(portada));

/* 2 · páginas de casa */
for (const c of casas) escribir(c.slug + '.html', paginaCasa(c));

/* 3 · páginas secundarias: solo las regiones comunes (y los símbolos) */
for (const p of ['aviso-legal.html', 'privacidad.html', '404.html']) {
  if (!fs.existsSync(path.join(raiz, p))) continue;
  let html = leer(p);
  html = region(html, 'gen', 'simbolos', simbolos);
  html = region(html, 'gen', 'torre-404', D.torreSVG({ id: 'torre-404', clase: 'torre', titulo: 'La torre de la Catedral de Badajoz' }));
  escribir(p, ponerComunes(html));
}

if (comprobar && cambios.length) { console.log('\nLa web no está al día con los datos: ' + cambios.join(', ')); process.exitCode = 1; }
