/* ═══════════════════════════════════════════════════════════════════════════
   Módulo «El libro de visitas». SE PUEDE QUITAR (README → «Quitar el libro de
   visitas»): si este archivo falta, la sección no está o el JS falla, la web
   sigue igual. No depende de main.js ni main.js de él.

   - Pestañas «Las dos · Ramona · Jerónimo» (aria-pressed) y el cambio se
     anuncia en una región aria-live="polite".
   - En «Catedral de vecina», con movimiento: cada cita se escribe renglón a
     renglón (clip-path) cuando el papel entra en pantalla y, al acabar, cae
     el sello rojo. Sin movimiento o en la sobria, todo en su sitio.
   - El hueco de la foto pegada solo aparece si config.libro_foto tiene ruta.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var libro = document.getElementById('libro');
  if (!libro) return;
  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function todos(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function sobria() { return html.classList.contains('densidad-sobria'); }

  var entradas = todos('.libro__entrada', libro);
  var botones = todos('.libro__pestana', libro);
  var aviso = document.getElementById('libro-aviso');
  var sello = document.getElementById('libro-sello');
  var hoja = libro.querySelector('.libro__hoja');
  var NOMBRES = { ramona: 'Ramona', jeronimo: 'Jerónimo' };
  var api = window.CDCLibro = { filtro: 'todas', escrito: false };

  /* ── la foto pegada con cinta: solo con permiso (config.libro_foto) ── */
  (function foto() {
    var fig = document.getElementById('libro-foto');
    var datos = document.getElementById('config-datos');
    if (!fig || !datos) return;
    var ruta = null;
    try { ruta = JSON.parse(datos.textContent).libro_foto; } catch (e) {}
    if (!ruta) { fig.hidden = true; return; }
    var img = fig.querySelector('img');
    img.src = ruta;
    img.alt = 'Una página del libro de visitas de la casa';
    fig.hidden = false;
  })();

  /* ── filtro por casa ── */
  function filtrar(f) {
    api.filtro = f;
    botones.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-filtro') === f ? 'true' : 'false'); });
    var n = 0;
    entradas.forEach(function (e) {
      var si = f === 'todas' || e.getAttribute('data-casa') === f;
      e.hidden = !si;
      if (si) n++;
    });
    aviso.textContent = f === 'todas'
      ? 'Mostrando las ' + n + ' opiniones de las dos casas.'
      : 'Mostrando ' + n + ' opiniones de ' + NOMBRES[f] + '.';
    /* lo que se enseña después de escribir ya está escrito */
    if (api.escrito || !escribiendo) entradas.forEach(terminar);
  }
  botones.forEach(function (b) { b.addEventListener('click', function () { filtrar(b.getAttribute('data-filtro')); }); });

  /* ── escritura renglón a renglón ── */
  var escribiendo = false;
  function terminar(e) {
    if (e._original != null) { e.querySelector('.libro__texto').innerHTML = e._original; e._original = null; }
    todos('.es-pendiente, .es-escrita', e).forEach(function (n) { n.classList.remove('es-pendiente', 'es-escrita'); n.style.removeProperty('--dur'); });
  }
  /* parte el texto en sus renglones reales (los mide el navegador) */
  function enRenglones(e) {
    var p = e.querySelector('.libro__texto');
    e._original = p.innerHTML;
    var palabras = p.textContent.split(/\s+/).filter(Boolean);
    p.innerHTML = palabras.map(function (w) { return '<span class="libro__palabra">' + w.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>'; }).join(' ');
    var lineas = [], top = null;
    todos('.libro__palabra', p).forEach(function (s) {
      var t = s.offsetTop;
      if (top === null || Math.abs(t - top) > 4) { lineas.push([]); top = t; }
      lineas[lineas.length - 1].push(s.textContent);
    });
    p.innerHTML = lineas.map(function (l) { return '<span class="libro__renglon es-pendiente">' + l.join(' ').replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>'; }).join('');
    var firma = e.querySelector('.libro__firma');
    firma.classList.add('es-pendiente');
    return todos('.libro__renglon', p).concat([firma]);
  }
  function escribir() {
    escribiendo = true;
    var visibles = entradas.filter(function (e) { return !e.hidden; });
    /* cada cita empieza un poco después de la anterior y escribe sus renglones seguidos:
       el libro se llena en unos 5 s, no en lo que tardaría una mano */
    var fin = 0;
    visibles.forEach(function (e, k) {
      var t = k * 0.34;
      enRenglones(e).forEach(function (r) {
        var dur = Math.max(0.18, Math.min(0.62, r.textContent.length * 0.0095));
        r.style.setProperty('--dur', dur.toFixed(2) + 's');
        setTimeout(function () { r.classList.remove('es-pendiente'); r.classList.add('es-escrita'); }, t * 1000);
        t += dur * 0.9;
      });
      fin = Math.max(fin, t);
    });
    setTimeout(function () {
      api.escrito = true;
      sello.classList.remove('es-por-caer');
      sello.classList.add('es-caido');
      setTimeout(function () { entradas.forEach(terminar); }, 700);
    }, fin * 1000 + 120);
  }

  filtrar('todas');
  var conMovimiento = !reduce && !sobria() && 'IntersectionObserver' in window;
  if (!conMovimiento) { api.escrito = true; return; }
  /* el sello espera arriba; las citas, sin escribir (solo cuando ya hay observador) */
  sello.classList.add('es-por-caer');
  entradas.forEach(function (e) { e.querySelector('.libro__texto').classList.add('es-oculta-hasta-medir'); });
  var obs = new IntersectionObserver(function (en) {
    if (!en[0].isIntersecting) return;
    obs.disconnect();
    entradas.forEach(function (e) { e.querySelector('.libro__texto').classList.remove('es-oculta-hasta-medir'); });
    escribir();
  }, { threshold: 0, rootMargin: '0px 0px -15% 0px' });
  obs.observe(hoja);
  /* si cambian a la sobria a mitad, todo a su sitio */
  document.addEventListener('densidad-cambiada', function () {
    if (!sobria()) return;
    obs.disconnect();
    api.escrito = true;
    sello.classList.remove('es-por-caer', 'es-caido');
    entradas.forEach(function (e) { e.querySelector('.libro__texto').classList.remove('es-oculta-hasta-medir'); terminar(e); });
  });
})();
