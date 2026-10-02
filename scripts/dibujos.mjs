/* Los dibujos de la marca, hechos con geometría y medidas, no calcados:

     torre   La torre de la Catedral de Badajoz en alzado, medida sobre las
             fotos 870507584 (Jerónimo) y 248101584 / 248117591 (Ramona).
             Una silueta continua + detalles aparte (almenas, vanos, reloj…).
     reja    La reja de rombos de sus balcones, medida en 248106674 y 248101584.
     lis     La flor de lis del sello (ref/ig/_sello.jpg), por mitades reflejadas.
     laurel  La corona: dos ramas que suben desde abajo, abiertas arriba.
     adornos La «R» con su corona de flores secas (puerta de Ramona) y la
             campanita (puerta de Jerónimo), en línea.
     iconos  Trazo de 1,5 px en 24 × 24, dibujados a mano.

   node scripts/dibujos.mjs  → assets/dibujos/*.svg, assets/favicon.svg y
                               plantillas/_simbolos.svg (sprite que construir.mjs
                               mete en cada página).
   Los demás scripts importan las funciones (torreSVG, rejaHero, rejaFriso…).
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const f = n => (Math.round(n * 100) / 100).toString();
const P = pts => pts.map(p => f(p[0]) + ' ' + f(p[1])).join(' ');

/* ═══════════════════════════ LA TORRE ═══════════════════════════
   Medidas en unidades de la cara visible: ancho de cara W = 160 (x 40…200).
   Proporciones tomadas de 248101584 (la toma más frontal), donde la cara mide
   ~405 px a la altura de las campanas:
     almenas      9 en la cara visible (contadas en 101, 591 y 870, esquinas incluidas), alto 28
     cornisa      15 de alto, vuela 4
     campanas     97 de alto · 2 vanos de arco de 35 × 69 · una saetera de 12 × 36 entre ellos
     imposta      6 · vuela 4
     fuste alto   122 · el reloj en marco de conopio, 42 × 66 con remate; esfera de 24
     friso        16 · vuela 5 · con crestería
     fuste bajo   la ventana de la venera; sigue hasta abajo (abierto)
     sillares     los «dientes» de piedra de las aristas, de 16 y 9 de vuelo, alternos  */
export const TORRE = { ancho: 240, alto: 480 };
const X0 = 40, X1 = 200;

export function torrePiezas() {
  const silueta = 'M40 480V294H35V278H40V156H36V150H40V53H36V38H204V53H200V150H204V156H200V278H205V294H200V480';

  /* almenas: base, collar, cuerpo bulboso y bola de remate (media almena reflejada) */
  const almenas = [];
  for (let i = 0; i < 9; i++) {
    const c = 41 + i * (158 / 8);
    almenas.push(
      `M${f(c - 5.5)} 38V30H${f(c - 6.5)}V28.3H${f(c - 4.6)}` +
      `C${f(c - 7)} 26 ${f(c - 7.2)} 19.5 ${f(c - 2)} 16L${f(c - 1.6)} 15` +
      `A2.4 2.4 0 1 1 ${f(c + 1.6)} 15L${f(c + 2)} 16` +
      `C${f(c + 7.2)} 19.5 ${f(c + 7)} 26 ${f(c + 4.6)} 28.3H${f(c + 6.5)}V30H${f(c + 5.5)}V38`
    );
  }
  /* dentículos de la cornisa */
  let dent = '';
  for (let x = 42; x <= 196; x += 7) dent += `M${x} 44.5h3.4v4.2h-${3.4}z`;

  /* vanos: dos arcos de medio punto y la saetera, con su campana dentro */
  const arco = (a, b, alto, base) => { const r = (b - a) / 2; return `M${f(a)} ${base}V${f(alto + r)}A${f(r)} ${f(r)} 0 0 1 ${f(b)} ${f(alto + r)}V${base}Z`; };
  const campana = cx => `M${f(cx - 7)} 124C${f(cx - 7)} 115 ${f(cx - 5)} 107 ${f(cx)} 106C${f(cx + 5)} 107 ${f(cx + 7)} 115 ${f(cx + 7)} 124L${f(cx + 8.5)} 126.5H${f(cx - 8.5)}ZM${f(cx)} 106V100`;
  const vanos = [arco(58, 93, 70, 139), arco(114, 126, 66, 102), arco(147, 182, 70, 139)];
  const campanas = [campana(75.5), campana(164.5)];

  /* reloj: marco con remate de conopio, esfera y agujas (casi las doce, como en la foto) */
  const marco = 'M99 278V232C99 225 108 223.5 112.5 220.5C116.5 218 119 215 120 212C121 215 123.5 218 127.5 220.5C132 223.5 141 225 141 232V278M120 212V206';
  const esfera = 'M132 253A12 12 0 1 1 108 253A12 12 0 1 1 132 253Z';
  const agujas = 'M120 253V243.6M120 253L115.2 247.4';

  /* friso con crestería y la ventana de la venera (marco, concha y dintel) */
  let cresta = 'M37 291';
  for (let x = 37; x < 203; x += 8.3) cresta += `A4.15 4.15 0 0 1 ${f(Math.min(x + 8.3, 203))} 291`;
  const venera = 'M100 386V316H140V386ZM106 344A14 14 0 0 1 134 344ZM120 344V330M120 344L110.6 333.6M120 344L129.4 333.6M120 344L106.6 339.4M120 344L133.4 339.4M106 360H134';
  const puerta = 'M110 432V406A10 10 0 0 1 130 406V432';

  /* sillares de esquina: una línea dentada que corre paralela a cada arista */
  const dientes = (y0, y1, lado) => {
    const x = lado < 0 ? X0 : X1;
    let d = `M${x} ${y0}`, largo = true;
    for (let y = y0; y < y1 - 0.5; y += 11) {
      const L = largo ? 13 : 7; largo = !largo;
      d += `H${f(x - lado * L)}V${f(Math.min(y + 11, y1))}`;
    }
    return d + `H${x}`;
  };
  const sillares = dientes(158, 278, -1) + dientes(158, 278, 1) + dientes(296, 478, -1) + dientes(296, 478, 1);
  return { silueta, almenas, dent, vanos, campanas, marco, esfera, agujas, cresta, venera, puerta, sillares };
}

/* La torre como SVG de línea. clase: prefijo de las clases para animarla.
   Cada pieza es su propio <path> con pathLength="1" (el guion no se reparte
   bien entre subtrazados de un mismo path). */
export function torreSVG({ id = '', clase = 'torre', titulo = null, recorte = 480 } = {}) {
  const p = torrePiezas();
  const pl = (d, c) => `<path class="${clase}__${c}" pathLength="1" d="${d}"/>`;
  const partes = [
    pl(p.silueta, 'silueta'),
    `<g class="${clase}__almenas">${p.almenas.map(d => pl(d, 'almena')).join('')}</g>`,
    `<g class="${clase}__vanos">${p.vanos.map(d => pl(d, 'vano')).join('')}${p.campanas.map(d => pl(d, 'campana')).join('')}</g>`,
    `<g class="${clase}__reloj">${pl(p.marco, 'marco')}${pl(p.esfera, 'esfera')}${pl(p.agujas, 'agujas')}</g>`,
    `<g class="${clase}__molduras">${pl(p.dent, 'dent')}${pl(p.cresta, 'cresta')}${pl(p.venera, 'venera')}${pl(p.puerta, 'puerta')}</g>`,
    pl(p.sillares, 'sillares')
  ];
  const t = titulo ? `<title>${titulo}</title>` : '';
  return `<svg${id ? ` id="${id}"` : ''} class="${clase}" viewBox="0 0 ${TORRE.ancho} ${recorte}" ${titulo ? 'role="img"' : 'aria-hidden="true"'} fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${t}${partes.join('')}</svg>`;
}

/* ═══════════════════════════ LA REJA ═══════════════════════════
   Medida en 248106674 (balcón de Ramona, casi de frente) y 248101584:
     - montantes verticales a paso constante S;
     - arriba y abajo, una banda de rombos alargados centrados en cada
       montante: el vértice de arriba toca el pasamanos y el de abajo es la
       cabeza del montante («montantes en los vértices»); rombos vecinos se
       cruzan a media altura;
     - proporción del rombo alto/ancho = 2,2 (674: 190/85 px; 101: 160/72 px);
     - la banda de montantes mide el doble que la de rombos (101: 330/160 px);
     - pasamanos arriba y barrote abajo.
   En la foto frontal (248106674) caben 12 rombos en el hueco del balcón; con
   la reja de ~1 m de alto (4 rombos de alto), salen ~9 rombos por metro.
   Grosores relativos al paso S (también medidos): montante 0,09·S,
   pletina del rombo 0,065·S, pasamanos 0,32·S, barrote 0,18·S.          */
export const REJA = { proporcion: 2.2, porMetro: 9, enHueco: 12 };

export function rejaPatron(id, S, color = 'currentColor') {
  const h = S * REJA.proporcion;
  const alto = h * 4;
  const m = S / 2;
  const gm = S * 0.09, gp = S * 0.065;
  const rombo = y0 => `M${f(m)} ${f(y0)}L${f(S)} ${f(y0 + h / 2)}L${f(m)} ${f(y0 + h)}L0 ${f(y0 + h / 2)}Z`;
  return {
    h, alto,
    patron: `<pattern id="${id}" width="${f(S)}" height="${f(alto)}" patternUnits="userSpaceOnUse">` +
      `<path d="${rombo(0)}${rombo(3 * h)}" fill="none" stroke="${color}" stroke-width="${f(gp)}" stroke-linejoin="miter"/>` +
      `<path d="M${f(m)} ${f(h)}V${f(3 * h)}" stroke="${color}" stroke-width="${f(gm)}"/>` +
      `</pattern>`
  };
}

/* Reja del hero: viewBox de 1440 de ancho, paso S = 52 (≈ 28 rombos a lo ancho).
   La caja del SVG escala con el ancho, así que las barras también. */
export function rejaHero({ id = 'reja-hero', ancho = 1440, S = 52, clase = 'reja' } = {}) {
  const { h, alto, patron } = rejaPatron(id + '-p', S, 'currentColor');
  const pas = S * 0.32, bar = S * 0.18;
  const y0 = pas;                        /* el rombo empieza justo bajo el pasamanos */
  const total = y0 + alto + bar;
  /* el patrón se desplaza medio paso para que la reja quede centrada */
  const desfase = ((ancho / 2) % S) - S / 2;
  return `<svg class="${clase}" viewBox="0 0 ${ancho} ${f(total)}" preserveAspectRatio="xMidYMin meet" aria-hidden="true" focusable="false">` +
    `<defs>${patron.replace('patternUnits', `x="${f(desfase)}" y="${f(y0)}" patternUnits`)}</defs>` +
    `<rect x="0" y="${f(y0)}" width="${ancho}" height="${f(alto)}" fill="url(#${id}-p)"/>` +
    `<rect x="0" y="0" width="${ancho}" height="${f(pas)}" fill="currentColor"/>` +
    `<rect x="0" y="${f(pas * 0.18)}" width="${ancho}" height="${f(pas * 0.14)}" fill="#fff" opacity=".07"/>` +
    `<rect x="0" y="${f(y0 + alto)}" width="${ancho}" height="${f(bar)}" fill="currentColor"/>` +
    `</svg>`;
}

/* Friso de 42 px: la banda de rombos entre pasamanos y barrote, con la misma
   proporción 2,2 (rombo de 38 de alto → paso 17,27). */
export function rejaFriso({ id = 'friso', clase = 'friso' } = {}) {
  const H = 42, alto = 38, S = alto / REJA.proporcion, m = S / 2;
  return `<svg class="${clase}" width="100%" height="${H}" aria-hidden="true" focusable="false">` +
    `<defs><pattern id="${id}-p" width="${f(S)}" height="${H}" patternUnits="userSpaceOnUse">` +
    `<path d="M${f(m)} 2L${f(S)} 21L${f(m)} 40L0 21Z" fill="none" stroke="currentColor" stroke-width="1.4"/></pattern></defs>` +
    `<rect width="100%" height="${H}" fill="url(#${id}-p)"/>` +
    `<rect width="100%" height="2.2" fill="currentColor"/><rect y="39.8" width="100%" height="2.2" fill="currentColor"/>` +
    `</svg>`;
}

/* ═══════════════════════════ LA FLOR DE LIS ═══════════════════════════
   viewBox 0 0 100 112 (proporción del sello: 450 × 505 px a 3x).
   Se dibuja la mitad derecha y se refleja en x = 50. Piezas, como en el sello:
   pétalo central, dos laterales que se enroscan hacia abajo, banda y pie
   (punta central y dos volutas pequeñas).                                 */
const espejo = d => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, x, y) => f(100 - parseFloat(x)) + ' ' + y);

export function lisPiezas() {
  /* pétalo central, completo (es simétrico por construcción) */
  const centralDer = 'C55.6 9 66.5 22 66 34C65.6 46 57.5 58 55.4 68.4';
  const central = 'M50 0' + centralDer + 'L44.6 68.4' + 'C42.5 58 34.4 46 34 34C33.5 22 44.4 9 50 0Z';
  /* pétalo lateral derecho: sube desde la banda, se curva hacia fuera y se enrosca */
  const lateral = 'M58.2 68.4C60.8 58 66.4 47.2 75.4 42.4C84.8 37.4 96.4 39.4 99.4 49.6' +
    'C102 58.6 97.4 69.4 88.6 71.6C82 73.2 76.2 69.6 76.6 64C77 59 82.6 56.6 86.4 59.6' +
    'C88.8 61.6 88 65 85.4 65.6C88.6 64.4 91.6 60 89.6 55.4C87.4 50.4 80.8 49.8 75.6 53' +
    'C69.4 55.4 65 62.6 63.6 68.4Z';
  const banda = 'M36.4 68.2H63.6C65.6 68.2 66.4 69.4 66.4 71V73.6C66.4 75.2 65.6 76.4 63.6 76.4H36.4C34.4 76.4 33.6 75.2 33.6 73.6V71C33.6 69.4 34.4 68.2 36.4 68.2Z';
  /* pie: punta central y volutas pequeñas que se abren hacia fuera */
  const pie = 'M41.6 76.4H58.4C58 88 54.6 100.4 50 112C45.4 100.4 42 88 41.6 76.4Z';
  /* volutas del pie: bajan hacia fuera y se enroscan hacia dentro, como un eco pequeño de las de arriba */
  const voluta = 'M58.6 76.4C66.4 78.4 76.6 82.2 79.2 89.4C81.2 95 77.4 99.4 72.4 98.4C68.2 97.6 67.2 92.6 70.6 90.6C73 89.2 75.6 90.8 75 93C76.4 89.6 72.4 85.6 66.4 83.2C62.8 81.8 59.8 80.6 57.8 79.4Z';
  return { central, lateralDer: lateral, lateralIzq: espejo(lateral), banda, pie, volutaDer: voluta, volutaIzq: espejo(voluta) };
}
export function lisPaths() {
  const p = lisPiezas();
  return [p.central, p.lateralDer, p.lateralIzq, p.banda, p.pie, p.volutaDer, p.volutaIzq];
}
/* Una sola forma con todas las piezas, cada una su <path> (la regla nonzero agujerea las piezas fundidas) */
export function lisGrupo(attrs = '') {
  return `<g${attrs}>${lisPaths().map(d => `<path d="${d}"/>`).join('')}</g>`;
}

/* ═══════════════════════════ EL LAUREL ═══════════════════════════
   viewBox del sello 0 0 200 200. Dos ramas sobre una circunferencia de radio
   80 centrada en (100, 101): nacen abajo sin tocarse (±5º del eje), suben por
   los lados y se abren arriba (puntas a ±21º de la vertical, como en el sello).
   Hojas contadas en el JPG ampliado: 10 pares por rama + la hoja terminal.
   Cada hoja es una almendra que apunta hacia la punta de la rama.          */
export const LAUREL = { pares: 10, radio: 80, centro: [100, 101], cruce: -5, hasta: 21 };

function hoja(x, y, ang, L, w) {
  /* almendra de base (0,0) a punta (L,0), girada ang radianes */
  const c = Math.cos(ang), s = Math.sin(ang);
  const t = (u, v) => [x + u * c - v * s, y + u * s + v * c];
  const a = t(L * 0.38, -w), b = t(L * 0.78, -w * 0.78), d = t(L * 0.78, w * 0.78), e = t(L * 0.38, w), p = t(L, 0);
  return `M${P([[x, y]])}C${P([a, b, p])}C${P([d, e, [x, y]])}Z`;
}
export function laurelPaths() {
  const { pares, radio: R, centro: [cx, cy], cruce, hasta } = LAUREL;
  const rama = lado => {
    /* φ en grados desde arriba, sentido horario; lado −1 = izquierda */
    const pt = (phi, r = R) => { const a = phi * Math.PI / 180; return [cx + lado * r * Math.sin(a), cy - r * Math.cos(a)]; };
    const out = [];
    /* tallo: una banda fina (dos arcos) que nace pasado el eje, para que las
       ramas se crucen abajo, y se afila hacia la punta */
    const g0 = 1.05, g1 = 0.4;
    const a0 = pt(180 + cruce, R + g0), a1 = pt(hasta, R + g1), b1 = pt(hasta, R - g1), b0 = pt(180 + cruce, R - g0);
    const s = lado < 0 ? 1 : 0;
    out.push(`M${P([a0])}A${f(R + g0)} ${f(R + g0)} 0 0 ${s} ${P([a1])}L${P([b1])}A${f(R - g0)} ${f(R - g0)} 0 0 ${1 - s} ${P([b0])}Z`);
    for (let k = 0; k < pares; k++) {
      const t = k / (pares - 1);
      const phi = 165 - t * (165 - hasta - 10);          /* de abajo arriba */
      const [x, y] = pt(phi);
      const r = phi * Math.PI / 180;
      /* tangente hacia la punta (φ decreciente) */
      const tx = -lado * Math.cos(r), ty = -Math.sin(r);
      const angT = Math.atan2(ty, tx);
      const L = 19 - t * 7, w = L * 0.27;
      out.push(hoja(x, y, angT + lado * 0.66, L, w));           /* hacia fuera, la más larga */
      out.push(hoja(x, y, angT - lado * 0.58, L * 0.8, w * 0.9));  /* hacia dentro */
    }
    /* hoja terminal, en la dirección del tallo */
    const [x, y] = pt(hasta), r = hasta * Math.PI / 180;
    out.push(hoja(x, y, Math.atan2(-Math.sin(r), -lado * Math.cos(r)), 10, 3));
    return out;
  };
  return [...rama(-1), ...rama(1)];
}

/* El sello: corona + flor de lis. En el JPG la lis mide el 55 % del ancho de
   la corona y queda centrada, un poco por encima del centro de la corona. */
export function selloGrupo() {
  const k = 1, w = 100 * k, h = 112 * k;
  const tx = 100 - w / 2, ty = 97 - h / 2;
  return `<g class="sello__laurel">${laurelPaths().map(d => `<path d="${d}"/>`).join('')}</g>` +
    `<g class="sello__lis" transform="translate(${f(tx)} ${f(ty)}) scale(${k})">${lisPaths().map(d => `<path d="${d}"/>`).join('')}</g>`;
}

/* ═══════════════════════════ LOS ADORNOS DE LAS PUERTAS ═══════════════════════════
   En línea, viewBox 0 0 120 150, trazo en currentColor.
   Ramona (583881411): una «R» blanca de remates rectos dentro de un aro fino
   con flores y espigas secas (sobre todo arriba y a la derecha), atado abajo
   con cordel, del que cuelga la pizarrita.
   Jerónimo (335339645): una placa en forma de campana colgada de un lazo.    */
export function adornoRamona() {
  const cx = 60, cy = 60, r = 38;
  const enAro = (g, d = 0) => { const a = (g - 90) * Math.PI / 180; return [cx + (r + d) * Math.cos(a), cy + (r + d) * Math.sin(a)]; };
  /* espigas plumosas (como las de pampa de su corona): tallo curvo que sale
     del aro hacia fuera y hacia arriba, con barbas cortas a los dos lados
     que se acortan hacia la punta */
  const espiga = (g, largo, giro, curva = 4) => {
    const [x, y] = enAro(g);
    const a = (g - 90 + giro) * Math.PI / 180;            /* hacia fuera del aro, girado */
    const n = [Math.cos(a + Math.PI / 2), Math.sin(a + Math.PI / 2)];
    const e = [x + Math.cos(a) * largo, y + Math.sin(a) * largo];
    const c = [x + Math.cos(a) * largo * 0.55 + n[0] * curva, y + Math.sin(a) * largo * 0.55 + n[1] * curva];
    let d = `M${P([[x, y]])}Q${P([c, e])}`;
    const barbas = 7;
    for (let k = 0; k < barbas; k++) {
      const t = 0.35 + k * (0.62 / barbas);
      /* punto de la cuadrática y su tangente */
      const px = (1 - t) ** 2 * x + 2 * (1 - t) * t * c[0] + t * t * e[0];
      const py = (1 - t) ** 2 * y + 2 * (1 - t) * t * c[1] + t * t * e[1];
      const tx = 2 * (1 - t) * (c[0] - x) + 2 * t * (e[0] - c[0]), ty = 2 * (1 - t) * (c[1] - y) + 2 * t * (e[1] - c[1]);
      const ang = Math.atan2(ty, tx), L = 4.2 * (1 - k / (barbas + 2));
      for (const s of [-1, 1]) d += `M${P([[px, py]])}l${f(Math.cos(ang + s * 0.55) * L)} ${f(Math.sin(ang + s * 0.55) * L)}`;
    }
    return d;
  };
  const flores = [espiga(-72, 26, -38, 5), espiga(-50, 30, -30, 4), espiga(-30, 24, -22, 3),
    espiga(16, 28, 26, -4), espiga(34, 32, 30, -5), espiga(52, 26, 34, -4), espiga(72, 20, 30, -3),
    espiga(-104, 18, -30, 3)].join('');
  /* bolitas de flor seca (paniculata) entre las espigas */
  let bolas = '';
  [[-60, 3], [-40, -4], [-18, 2], [-6, -3], [6, 3], [26, -3], [44, 3], [62, -2], [-90, 3]].forEach(([g, d]) => {
    const [x, y] = enAro(g, d);
    bolas += `M${f(x + 1.7)} ${f(y)}A1.7 1.7 0 1 1 ${f(x - 1.7)} ${f(y)}A1.7 1.7 0 1 1 ${f(x + 1.7)} ${f(y)}`;
  });
  const aro = `M${cx + r} ${cy}A${r} ${r} 0 1 1 ${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}`;
  /* la «R» de remates rectos: asta doble (la letra es gruesa), panza, pierna y remates */
  const R = 'M46.5 37V83M50.5 37V83M41 37H64C73.5 37 78.5 42.4 78.5 49.6C78.5 56.8 73.5 62 64 62H50.5M41 83H56M60 62L75.5 83M71 83H81';
  /* lazo de cordel y la pizarrita */
  const lazo = 'M60 98C55 93 49 94 50.5 98.5C52 102 57 100 60 98C63 100 68 102 69.5 98.5C71 94 65 93 60 98ZM60 98L52 108M60 98L69 107M58.5 99L44 126M61.5 99L76 126';
  const pizarra = 'M38 126H82V146H38ZM44 133H76M44 139H70';
  return { aro, R, flores, bolas, lazo, pizarra };
}
export function adornoJeronimo() {
  const argolla = 'M63 12A3 3 0 1 1 57 12A3 3 0 1 1 63 12';
  const lazo = 'M60 22C53 13 42 15 45.5 22C48 27 55 25 60 22C65 25 72 27 74.5 22C78 15 67 13 60 22ZM60 22L50 38M60 22L71 36M60 15V22';
  /* campana: cabeza redonda, hombros, faldón que se abre y labio */
  const campana = 'M60 34C66 34 69.5 38 69.5 43C76 46 80.5 54 82 66C83.6 79 86 90 95 97.5C97.5 99.6 96.8 103 93.5 103H26.5C23.2 103 22.5 99.6 25 97.5C34 90 36.4 79 38 66C39.5 54 44 46 50.5 43C50.5 38 54 34 60 34Z';
  const labio = 'M31 95.5C48 91.5 72 91.5 89 95.5';
  const ojal = 'M63 40A3 3 0 1 1 57 40A3 3 0 1 1 63 40';
  return { argolla, lazo, campana, labio, ojal };
}
export function adornoSVG(casa, { clase = 'adorno', titulo = '' } = {}) {
  const p = casa === 'ramona' ? adornoRamona() : adornoJeronimo();
  const t = titulo ? `<title>${titulo}</title>` : '';
  return `<svg class="${clase} ${clase}--${casa}" viewBox="0 0 120 150" ${titulo ? 'role="img"' : 'aria-hidden="true"'} fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${t}` +
    Object.entries(p).map(([k, d]) => `<path class="${clase}__${k}" pathLength="1" d="${d}"/>`).join('') + `</svg>`;
}

/* ═══════════════════════════ ICONOS (24 × 24, trazo 1,5) ═══════════════════════════ */
export const ICONOS = {
  ascensor: 'M3 11L12 3.6L21 11M4.6 9.7V20.5H19.4V9.7M8.6 20.5V12H15.4V20.5M12 12V20.5M10.6 9.4L12 7.8L13.4 9.4',
  llave: 'M11.4 12A4.4 4.4 0 1 1 2.6 12A4.4 4.4 0 1 1 11.4 12ZM7 9.6V12L8.7 13.1M11.4 12H21.2M17.4 12V15M20 12V14.4',
  huella: 'M8.4 17.6C8.4 14.8 10 12.8 12 12.8S15.6 14.8 15.6 17.6C15.6 19.3 14.1 20.2 12 20.2S8.4 19.3 8.4 17.6ZM8.2 11.4A1.7 2 0 1 1 4.8 11.4A1.7 2 0 1 1 8.2 11.4ZM11.2 7.6A1.7 2.1 0 1 1 7.8 7.6A1.7 2.1 0 1 1 11.2 7.6ZM16.2 7.6A1.7 2.1 0 1 1 12.8 7.6A1.7 2.1 0 1 1 16.2 7.6ZM19.2 11.4A1.7 2 0 1 1 15.8 11.4A1.7 2 0 1 1 19.2 11.4Z',
  ducha: 'M4.5 21V7A3.5 3.5 0 0 1 8 3.5H10.5A3.5 3.5 0 0 1 14 7V8.5M10 8.5H18L17 11.2H11ZM12 14V15.4M14.5 14.4V15.8M17 14V15.4M13.2 17.8V19.2M15.8 17.8V19.2',
  pantalla: 'M3 5H21V16.5H3ZM8.5 20H15.5M12 16.5V20M10.4 8.3V13.2L14.6 10.75Z',
  cama: 'M3 6V19M3 15.5H21V19M21 15.5V12.6C21 11.2 19.9 10 18.5 10H10.8V15.5M5.6 12.6A1.9 1.9 0 1 1 9.4 12.6A1.9 1.9 0 1 1 5.6 12.6',
  toallas: 'M4.5 7.5H19.5V11.2H4.5ZM5.5 11.2H18.5V15H5.5ZM4.5 15H19.5V18.8H4.5ZM15.5 7.5V11.2M8.5 11.2V15M15.5 15V18.8',
  ventana: 'M4 3.5H20V20.5H4ZM6.6 6.1H17.4V17.9H6.6ZM12 6.1V17.9M6.6 12H17.4',
  mesa: 'M2.5 10H21.5M5 10V19M19 10V19M8.5 10V6.2H11V10M13 10V6.2H15.5V10M2.5 13H5M19 13H21.5',
  portatil: 'M5 5.5H19V15H5ZM2.8 18.5H21.2L19.6 15H4.4Z',
  olla: 'M5 11H19V16.8A3.2 3.2 0 0 1 15.8 20H8.2A3.2 3.2 0 0 1 5 16.8ZM2.8 11H5M19 11H21.2M9 8.4C9 7.2 10 7.2 10 6M12.2 8.4C12.2 7.2 13.2 7.2 13.2 6M15.4 8.4C15.4 7.2 16.4 7.2 16.4 6',
  lavadora: 'M5 3H19V21H5ZM5 7.2H19M8 5.1H9.4M11.6 5.1H16M16.4 13.6A4.4 4.4 0 1 1 7.6 13.6A4.4 4.4 0 1 1 16.4 13.6Z',
  cuna: 'M4 6.5V20.5M20 6.5V20.5M4 10H20M4 17H20M8 10V17M12 10V17M16 10V17',
  plancha: 'M3.5 17H20.5C20.5 12.5 17.8 10 13.6 10H8.8C5.6 10 3.5 13 3.5 17ZM8.8 10V7H18M7 13.6H9M11 13.6H13',
  suelo: 'M3 3.5H21V20.5H3ZM3 9.2H21M3 14.8H21M9 3.5V9.2M16 9.2V14.8M7 14.8V20.5M14 14.8V20.5',
  /* utilidades */
  flecha: 'M4 12H20M14 6L20 12L14 18',
  izquierda: 'M15 5L8 12L15 19',
  derecha: 'M9 5L16 12L9 19',
  cerrar: 'M6 6L18 18M18 6L6 18',
  copiar: 'M8.5 8.5H19.5V19.5H8.5ZM15.5 8.5V4.5H4.5V15.5H8.5',
  sobre: 'M3 5.5H21V18.5H3ZM3 6L12 13L21 6',
  telefono: 'M7.2 3.5L9.8 3.8L11 8.2L8.8 9.8C9.9 12.3 11.7 14.1 14.2 15.2L15.8 13L20.2 14.2L20.5 16.8C20.5 18.8 18.9 20.5 16.8 20.4C9.7 19.9 4.1 14.3 3.6 7.2C3.5 5.1 5.2 3.5 7.2 3.5Z',
  mensaje: 'M4 5H20V16H11L6.5 19.8V16H4ZM8 9.4H16M8 12.2H13.4',
  instagram: 'M3.8 8.2A4.4 4.4 0 0 1 8.2 3.8H15.8A4.4 4.4 0 0 1 20.2 8.2V15.8A4.4 4.4 0 0 1 15.8 20.2H8.2A4.4 4.4 0 0 1 3.8 15.8ZM16 12A4 4 0 1 1 8 12A4 4 0 1 1 16 12ZM17 7.1V7.2',
  pin: 'M12 21C12 21 5.5 14.8 5.5 9.8A6.5 6.5 0 0 1 18.5 9.8C18.5 14.8 12 21 12 21ZM14.4 9.8A2.4 2.4 0 1 1 9.6 9.8A2.4 2.4 0 1 1 14.4 9.8Z',
  externo: 'M13 4.5H19.5V11M19.5 4.5L11 13M10 5.5H4.5V19.5H18.5V14'
};
export function iconoSimbolo(n) {
  return `<symbol id="i-${n}" viewBox="0 0 24 24"><path d="${ICONOS[n]}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></symbol>`;
}

/* El sprite que va al principio de cada <body> (lo inserta construir.mjs) */
export function sprite() {
  return `<svg class="simbolos" aria-hidden="true" focusable="false" width="0" height="0"><defs>` +
    `<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E4E3DF"/><stop offset=".35" stop-color="#9C9B97"/><stop offset=".55" stop-color="#D2D1CC"/><stop offset="1" stop-color="#6E6D69"/></linearGradient>` +
    `</defs>` +
    `<symbol id="lis" viewBox="0 0 100 112">${lisGrupo(' fill="currentColor"')}</symbol>` +
    `<symbol id="sello" viewBox="0 0 200 200"><g fill="currentColor">${selloGrupo()}</g></symbol>` +
    `<symbol id="anilla" viewBox="0 0 40 40"><circle cx="20" cy="20" r="15.5" fill="none" stroke="url(#metal)" stroke-width="4.2"/><circle cx="20" cy="20" r="17.6" fill="none" stroke="rgba(0,0,0,.18)" stroke-width=".6"/><path d="M6.2 25.6A15.5 15.5 0 0 1 9 11" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1"/></symbol>` +
    Object.keys(ICONOS).map(iconoSimbolo).join('') +
    `</svg>`;
}

/* ═══════════════════════════ CUANDO SE EJECUTA SOLO ═══════════════════════════ */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = path.join(raiz, 'assets', 'dibujos');
  fs.mkdirSync(dir, { recursive: true });
  const HIERRO = '#1D1B19', CAL = '#F4EFE7', PIEDRA = '#C9AE86';
  const escribir = (n, s) => { fs.writeFileSync(path.join(raiz, n), s + '\n'); console.log(n); };
  const ns = s => s.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  escribir('assets/dibujos/lis.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 112" fill="${HIERRO}"><title>Flor de lis</title>${lisGrupo()}</svg>`);
  escribir('assets/dibujos/sello.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="${HIERRO}"><title>Casa da Catedral: flor de lis con corona de laurel</title>${selloGrupo()}</svg>`);
  escribir('assets/dibujos/sello-claro.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="${CAL}"><title>Casa da Catedral: flor de lis con corona de laurel</title>${selloGrupo()}</svg>`);
  escribir('assets/dibujos/torre.svg', ns(torreSVG({ titulo: 'Torre de la Catedral de Badajoz' })).replace('stroke="currentColor"', `stroke="${HIERRO}" stroke-width="1.6"`));
  escribir('assets/dibujos/adorno-ramona.svg', ns(adornoSVG('ramona', { titulo: 'La «R» de la puerta de Ramona' })).replace('stroke="currentColor"', `stroke="${HIERRO}" stroke-width="1.8"`));
  escribir('assets/dibujos/adorno-jeronimo.svg', ns(adornoSVG('jeronimo', { titulo: 'La campanita de la puerta de Jerónimo' })).replace('stroke="currentColor"', `stroke="${HIERRO}" stroke-width="1.8"`));
  /* favicon: la lis sola, hierro sobre claro; piedra en modo oscuro */
  escribir('assets/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -2 116 116"><style>g{fill:${HIERRO}}@media (prefers-color-scheme:dark){g{fill:${PIEDRA}}}</style>${lisGrupo()}</svg>`);
  escribir('plantillas/_simbolos.svg', sprite());
}
