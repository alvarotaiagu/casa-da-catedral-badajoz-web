/* ═══════════════════════════════════════════════════════════════════════════
   Casa da Catedral · «La Catedral de vecina»
   La web te asoma al balcón: la torre de fondo y la reja delante. La cortina
   traza la torre y deja caer un llavero; al subir, la reja del hero sube con
   ella. Al bajar das un paso fuera: la reja baja y la torre se acerca.

   Banderas separadas a propósito (memoria «reduced-motion: contenido vs movimiento»):
     gsapReady  → hay motor de animación (GSAP + ScrollTrigger cargados)
     movimiento → además el usuario NO ha pedido reducir el movimiento
   Con movimiento reducido el CONTENIDO sigue (la reja, los llaveros, las
   citas y el sello en su sitio); lo que se apaga es el viaje.

   Todos los trazos con pathLength="1" llevan autoRound:false (si no, GSAP
   redondea 1px → 0px y el trazo aparece de golpe).
   El libro de visitas vive en js/libro.js: este archivo no depende de él.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esTactil = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var gsapReady = !!(window.gsap && window.ScrollTrigger);
  var movimiento = gsapReady && !reduce;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;

  if (gsapReady) gsap.registerPlugin(ST);
  html.classList.add(movimiento ? 'con-movimiento' : 'sin-movimiento');
  if (!gsapReady) html.classList.add('sin-gsap');

  var esPortada = document.body.classList.contains('pagina-portada');

  function $(s, r) { return (r || document).querySelector(s); }
  function todos(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function densidad() { return html.classList.contains('densidad-sobria') ? 'sobria' : 'vecina'; }
  function esMovil() { return window.matchMedia('(max-width: 860px)').matches; }
  function alturaCabecera() { var c = $('#cabecera'); return c ? c.offsetHeight : 72; }
  function refrescar() { if (ST) ST.refresh(); }
  function limitar(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esperar(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  /* «una sola vez al entrar»: IntersectionObserver sobre el BLOQUE, umbral 0
     (un umbral en % de una sección alta no se alcanza nunca en móvil) */
  function cuandoVisible(nodos, alEntrar, margen) {
    if (!('IntersectionObserver' in window)) { nodos.forEach(alEntrar); return; }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        obs.unobserve(en.target);
        alEntrar(en.target);
      });
    }, { threshold: 0, rootMargin: margen || '0px 0px -12% 0px' });
    nodos.forEach(function (n) { obs.observe(n); });
  }

  var CDC = window.CDC = window.CDC || {};
  CDC.densidad = densidad;
  CDC.movimiento = movimiento;

  /* ───────────────────────── contacto: data/config.json ─────────────────────────
     Viene incrustado en la página (lo escribe construir.mjs) y, si se sirve por
     HTTP, se vuelve a leer del JSON: así rellenar un dato enciende su botón sin
     tocar nada más. */
  var CONFIG = { telefono: null, email: null, whatsapp: null, instagram: null, libro_foto: null };
  try { var incrustada = JSON.parse(($('#config-datos') || {}).textContent || '{}'); Object.keys(incrustada).forEach(function (k) { CONFIG[k] = incrustada[k]; }); } catch (e) {}
  CDC.config = CONFIG;
  if (window.fetch && location.protocol !== 'file:') {
    fetch('data/config.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (c) {
      if (!c) return;
      Object.keys(CONFIG).forEach(function (k) { if (k in c) CONFIG[k] = c[k]; });
      document.dispatchEvent(new CustomEvent('config-cargada'));
    }).catch(function () {});
  }

  /* ───────────────────────── Lenis ───────────────────────── */
  var lenis = null;
  if (movimiento && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  }
  CDC.lenis = lenis;

  function irA(destino) {
    var desfase = -alturaCabecera() + 1;
    var el = typeof destino === 'string' ? document.querySelector(destino) : destino;
    if (!el) return;
    if (el.id === 'inicio') { if (lenis) lenis.scrollTo(0, { duration: 1.3 }); else window.scrollTo(0, 0); return; }
    if (lenis) { lenis.scrollTo(el, { offset: desfase, duration: 1.4 }); return; }
    window.scrollTo(0, el.getBoundingClientRect().top + window.pageYOffset + desfase);
  }
  /* enlaces «./#seccion»: si la sección está en esta página, se baja suave */
  function rutaLimpia(p) { return p.replace(/index\.html$/, ''); }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a || a.target === '_blank') return;
    var url;
    try { url = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
    if (url.origin !== location.origin || rutaLimpia(url.pathname) !== rutaLimpia(location.pathname) || !url.hash) return;
    var el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!el) return;
    e.preventDefault();
    cerrarMenu();
    irA(el);
  });

  /* ───────────────────── titulares partidos (char-reveal) ───────────────────── */
  function partir(el) {
    var modo = el.dataset.revelar;
    var texto = el.textContent.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', texto);
    var piezas = [];
    function trocear(cadena, destino) {
      cadena.split(/(\s+)/).forEach(function (trozo) {
        if (!trozo) return;
        if (/^\s+$/.test(trozo)) { destino.appendChild(document.createTextNode(' ')); return; }
        var caja = document.createElement('span');
        caja.className = 'palabra';
        caja.setAttribute('aria-hidden', 'true');
        if (modo === 'letras') {
          Array.from(trozo).forEach(function (c) {
            var s = document.createElement('span');
            s.className = 'letra'; s.textContent = c;
            caja.appendChild(s); piezas.push(s);
          });
        } else {
          var s = document.createElement('span');
          s.className = 'palabra-int'; s.textContent = trozo;
          caja.appendChild(s); piezas.push(s);
        }
        destino.appendChild(caja);
      });
    }
    var hijos = Array.prototype.slice.call(el.childNodes);
    el.textContent = '';
    hijos.forEach(function (n) {
      if (n.nodeType === 3) { trocear(n.textContent, el); return; }
      if (n.nodeType === 1) {
        var envoltura = n.cloneNode(false);
        envoltura.setAttribute('aria-hidden', 'true');
        el.appendChild(envoltura);
        trocear(n.textContent, envoltura);
      }
    });
    return piezas;
  }
  function revelar(el, piezas, retardo) {
    var letras = el.dataset.revelar === 'letras';
    /* el «vacío» viene del CSS (translate3d 112 %): GSAP lo lee como y en px → se anima y:0 */
    gsap.to(piezas, {
      y: 0, yPercent: 0, duration: 1.15, ease: 'expo.out', delay: retardo || 0,
      stagger: letras ? Math.min(0.034, 1.1 / piezas.length) : 0.08
    });
  }

  /* ─────────────────── la cortina avisa cuando EMPIEZA a subir ─────────────────── */
  var cortinaAbierta = false;
  function avisarApertura() {
    if (cortinaAbierta) return;
    cortinaAbierta = true;
    document.dispatchEvent(new CustomEvent('cortina-abre'));
  }
  function alAbrirse(fn) { if (cortinaAbierta) fn(); else document.addEventListener('cortina-abre', fn, { once: true }); }
  CDC.alAbrirse = alAbrirse;

  todos('[data-revelar]').forEach(function (el) {
    var piezas = partir(el);
    if (!movimiento) return;
    if (el.closest('.hero, .casa-hero')) { alAbrirse(function () { revelar(el, piezas, el.closest('.hero') ? 0.3 : 0.15); }); return; }
    cuandoVisible([el], function () { revelar(el, piezas); });
  });

  /* ═══════════════ CORTINA: la torre, la cinta y la reja ═══════════════ */
  (function cortina() {
    var cort = $('#cortina');
    var hecho = false;
    function retirar() {
      if (hecho) return;
      hecho = true;
      avisarApertura();
      if (cort) cort.classList.add('es-fuera');
      html.classList.remove('cortina-activa');
      html.classList.add('cortina-fuera');
      /* con Lenis, lagSmoothing(0) al retirarla, nunca antes (el tirón de la carga saltaría el trazo) */
      if (gsapReady && lenis) gsap.ticker.lagSmoothing(0);
      if (lenis) lenis.start();
      refrescar();
      document.dispatchEvent(new CustomEvent('cortina-retirada'));
    }
    CDC.retirarCortina = retirar;

    if (!cort || html.classList.contains('sin-cortina') || html.classList.contains('cortina-fuera')) { retirar(); return; }
    if (!movimiento) {
      /* sin GSAP o con movimiento reducido se retira igual: nunca tapa la página */
      setTimeout(retirar, reduce ? 0 : 40);
      return;
    }
    html.classList.add('cortina-activa');
    if (lenis) lenis.stop();

    var capa = $('#cortina-capa'), dentro = $('#cortina-dentro'), borde = $('#cortina-borde');
    var cuelga = $('#cortina-llavero'), llav = $('.llavero', cuelga), nombre = $('.cortina__nombre', cort);
    var torre = $('#torre-cortina');
    var silueta = $('.torre__silueta', torre);
    var almenas = todos('.torre__almena', torre);
    var vanos = todos('.torre__vanos path', torre);
    var reloj = todos('.torre__reloj path', torre);
    var molduras = todos('.torre__molduras path', torre);
    var sillares = $('.torre__sillares', torre);
    var conLlavero = densidad() === 'vecina';

    var curva = { c: 0 };
    function pintarBorde() { borde.setAttribute('d', 'M0 0H100V0.01Q50 ' + Math.max(0.01, curva.c).toFixed(2) + ' 0 0.01Z'); }

    var tl = gsap.timeline({ paused: true, onComplete: retirar });
    CDC.cortina = { get tl() { return tl; } };
    /* 1 · la torre se traza: primero la silueta, luego almenas, vanos, reloj (~1,1 s) */
    tl.to(silueta, { strokeDashoffset: 0, duration: 0.64, ease: 'power2.inOut', autoRound: false }, 0.05)
      .to(almenas, { strokeDashoffset: 0, duration: 0.26, ease: 'power2.out', autoRound: false, stagger: 0.034 }, 0.46)
      .to(vanos, { strokeDashoffset: 0, duration: 0.42, ease: 'power2.inOut', autoRound: false, stagger: 0.04 }, 0.56)
      .to(molduras, { strokeDashoffset: 0, duration: 0.4, ease: 'power1.inOut', autoRound: false, stagger: 0.03 }, 0.62)
      .to(sillares, { strokeDashoffset: 0, duration: 0.5, ease: 'power1.inOut', autoRound: false }, 0.6)
      .to(reloj, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.inOut', autoRound: false, stagger: 0.07 }, 0.8)
      .to(nombre, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.82)
      .fromTo(nombre, { letterSpacing: '.7em' }, { letterSpacing: '.46em', duration: 0.9, ease: 'expo.out', immediateRender: false }, 0.82);
    var T = 1.18;
    /* 2 · cae la cinta: un llavero con «CASA DA CATEDRAL», se balancea una vez y se para */
    if (conLlavero) {
      tl.to(cuelga, { y: 0, duration: 0.44, ease: 'power3.in' }, 0.9)
        .to(llav, {
          keyframes: [
            { rotation: 8.5, duration: 0.18, ease: 'sine.out' },
            { rotation: -4.5, duration: 0.24, ease: 'sine.inOut' },
            { rotation: 1.6, duration: 0.2, ease: 'sine.inOut' },
            { rotation: 0, duration: 0.16, ease: 'sine.out' }
          ]
        }, 1.34);
      T = 1.62;
    }
    /* 3 · retirada: la capa sube con borde curvo y paralaje interno, la cinta se
       recoge hacia arriba y la reja del hero sube desde abajo (alAbrirse) */
    tl.call(avisarApertura, null, T)
      .to(capa, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, T)
      .to(dentro, { yPercent: -16, duration: 1, ease: 'expo.inOut' }, T)
      .to(curva, { keyframes: [{ c: 20, duration: 0.42, ease: 'power2.out' }, { c: 0, duration: 0.58, ease: 'power2.inOut' }], onUpdate: pintarBorde }, T);
    if (conLlavero) tl.to(cuelga, { y: function () { return -window.innerHeight * 1.25; }, duration: 0.72, ease: 'power3.in' }, T);

    var arrancada = false;
    function arrancar() { if (!arrancada) { arrancada = true; tl.play(); } }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(arrancar);
    setTimeout(arrancar, 450);
    /* quien empieza a bajar no espera: la cortina acelera, no se corta */
    function prisa() { if (!hecho) tl.timeScale(3); }
    ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, prisa, { passive: true, once: true }); });
    /* red de seguridad: pase lo que pase, a los 6 s la cortina se va */
    setTimeout(retirar, 6000);
  })();

  /* ═══════════════ HERO de la portada: el paso al balcón ═══════════════ */
  (function hero() {
    var hero = $('.hero');
    if (!hero) return;
    var reja = $('.hero__reja'), rejaRaton = $('.hero__reja-raton'), rejaEntrada = $('.hero__reja-entrada');
    var foto = $('.hero__foto'), fotoRaton = $('.hero__foto-raton'), velo = $('.hero__velo'), contenido = $('.hero__contenido');
    CDC.hero = { anclado: false, st: null };
    if (!movimiento) return;

    /* entrada: la reja sube desde abajo en el mismo gesto que la cortina */
    var acompana = todos('.hero__marca, .hero__entradilla, .hero__botones, .hero__dato', hero);
    gsap.set(rejaEntrada, { yPercent: 101 });
    gsap.set(acompana, { opacity: 0, y: 18 });
    alAbrirse(function () {
      gsap.to(rejaEntrada, { yPercent: 0, duration: 1.05, ease: 'expo.inOut' });
      gsap.to(acompana, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.09, delay: 0.5, clearProps: 'opacity,transform' });
    });

    /* scroll: en escritorio (y en «Catedral de vecina») pin corto con scrub;
       en móvil y en la sobria, sin pin: la reja solo tiene un paralaje ligero */
    var mm = null;
    function montar() {
      if (mm) mm.revert();
      CDC.hero.anclado = false; CDC.hero.st = null;
      mm = gsap.matchMedia();
      mm.add({ ancho: '(min-width: 861px)', estrecho: '(max-width: 860px)' }, function (c) {
        if (c.conditions.ancho && densidad() === 'vecina') {
          var tl = gsap.timeline({ defaults: { ease: 'none' } });
          tl.to(reja, { yPercent: 118, duration: 1 }, 0)
            .to(foto, { scale: 1.08, duration: 1 }, 0)
            .to(velo, { opacity: 0.38, duration: 1 }, 0)
            .to(contenido, { y: -70, autoAlpha: 0, duration: 0.42, ease: 'power1.in' }, 0.5);
          CDC.hero.st = ST.create({
            trigger: hero, start: 'top top', end: '+=70%', pin: true, scrub: true, animation: tl, anticipatePin: 1,
            onToggle: function (s) { CDC.hero.anclado = s.isActive; }
          });
        } else {
          gsap.to(reja, { yPercent: 22, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
        }
      });
    }
    montar();
    document.addEventListener('densidad-cambiada', function () { montar(); refrescar(); });

    /* puntero fino: paralaje suave, la reja se mueve más que la foto */
    if (!esTactil) {
      var fx = gsap.quickTo(fotoRaton, 'x', { duration: 0.9, ease: 'power3.out' });
      var fy = gsap.quickTo(fotoRaton, 'y', { duration: 0.9, ease: 'power3.out' });
      var rx = gsap.quickTo(rejaRaton, 'x', { duration: 0.9, ease: 'power3.out' });
      var ry = gsap.quickTo(rejaRaton, 'y', { duration: 0.9, ease: 'power3.out' });
      hero.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = hero.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
        fx(-nx * 14); fy(-ny * 8); rx(-nx * 34); ry(-ny * 10);
      });
      hero.addEventListener('pointerleave', function () { fx(0); fy(0); rx(0); ry(0); });
    }
  })();

  /* ═══════════════ HERO de cada casa: su torre, la reja sube ═══════════════ */
  (function casaHero() {
    var ent = $('.casa-hero__reja-entrada');
    if (!ent || !movimiento) return;
    gsap.set(ent, { yPercent: 101 });
    alAbrirse(function () { gsap.to(ent, { yPercent: 0, duration: 1.1, ease: 'expo.inOut', delay: 0.15 }); });
  })();

  /* ═══════════════ LLAVEROS: muelle amortiguado con pivote en la anilla ═══════════════
     2-3 oscilaciones al entrar en pantalla y al pasar por encima. Con
     movimiento reducido o en la versión sobria, quietos. Escriben su propio
     transform (ningún tween de GSAP toca estos elementos). */
  (function llaveros() {
    var lista = todos('[data-llavero]').filter(function (l) { return !l.closest('.cortina'); });
    if (!lista.length) return;
    var W = 2 * Math.PI * 1.15;      /* pulsación: ~0,87 s por vaivén */
    var Z = 0.17;                    /* amortiguamiento: a los 3 vaivenes queda < 5 % */
    var estados = lista.map(function (el) { return { el: el, a: 0, v: 0 }; });
    var corriendo = false, previo = 0;
    CDC.llaveros = estados;
    function quietos() { return reduce || densidad() === 'sobria'; }
    function paso(t) {
      var dt = previo ? (t - previo) / 1000 : 1 / 60;
      previo = t;
      if (dt > 0.1) dt = 1 / 30;     /* un atasco no se convierte en un salto */
      var vivos = 0;
      estados.forEach(function (s) {
        if (s.a === 0 && s.v === 0) return;
        var n = 4, h = dt / n;
        for (var i = 0; i < n; i++) { var acc = -W * W * s.a - 2 * Z * W * s.v; s.v += acc * h; s.a += s.v * h; }
        if (Math.abs(s.a) < 0.02 && Math.abs(s.v) < 0.2) { s.a = 0; s.v = 0; }
        else vivos++;
        s.el.style.transform = s.a ? 'rotate(' + s.a.toFixed(3) + 'deg)' : '';
      });
      if (vivos) requestAnimationFrame(paso); else { corriendo = false; previo = 0; }
    }
    function empujar(el, vel) {
      if (quietos()) return;
      var s = estados.filter(function (x) { return x.el === el; })[0];
      if (!s) return;
      s.v += vel;
      if (!corriendo) { corriendo = true; requestAnimationFrame(paso); }
    }
    CDC.empujarLlavero = empujar;
    cuandoVisible(lista, function (el) { empujar(el, 64); }, '0px 0px -8% 0px');
    lista.forEach(function (el) {
      var zona = el.closest('a, .donde__llavero, .casa-hero__figura') || el;
      var ultimoX = null;
      zona.addEventListener('pointerenter', function (e) { ultimoX = e.clientX; empujar(el, (Math.random() > 0.5 ? 1 : -1) * 46); });
      zona.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || ultimoX === null) return;
        var r = el.getBoundingClientRect();
        if (e.clientY < r.top || e.clientY > r.bottom || Math.abs(e.clientX - (r.left + r.width / 2)) > 40) { ultimoX = e.clientX; return; }
        var d = e.clientX - ultimoX; ultimoX = e.clientX;
        if (Math.abs(d) > 2) empujar(el, limitar(d * 2.2, -60, 60));
      });
    });
    document.addEventListener('densidad-cambiada', function () {
      if (!quietos()) return;
      estados.forEach(function (s) { s.a = 0; s.v = 0; s.el.style.transform = ''; });
    });
  })();

  /* ═══════════════ LA VISTA: paralaje suave por foto ═══════════════ */
  (function vista() {
    if (!movimiento) return;
    todos('.vista__foto').forEach(function (f) {
      var img = $('img', f);
      if (!img) return;
      var k = limitar(parseFloat(f.getAttribute('data-paralaje')) || 5, -5.5, 5.5);
      gsap.fromTo(img, { yPercent: -k }, { yPercent: k, ease: 'none', immediateRender: false, scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    var az = $('.azotea img');
    if (az) gsap.fromTo(az, { scale: 1.12 }, { scale: 1, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '.azotea', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  })();

  /* ═══════════════ LOS DETALLES: marquee doble, sentidos opuestos ═══════════════ */
  (function detalles() {
    var filas = todos('.fila');
    if (!filas.length || !movimiento) return;
    filas.forEach(function (fila) {
      var pista = $('.fila__pista', fila);
      var originales = todos(':scope > li', pista);
      var copias = Math.max(1, Math.ceil((window.innerWidth * 2) / Math.max(1, pista.scrollWidth)));
      for (var c = 0; c < copias; c++) {
        originales.forEach(function (li) {
          var x = li.cloneNode(true);
          x.setAttribute('aria-hidden', 'true');
          todos('img', x).forEach(function (im) { im.alt = ''; im.loading = 'lazy'; });
          pista.appendChild(x);
        });
      }
      fila._ancho = function () {
        var hueco = parseFloat(getComputedStyle(pista).columnGap) || 0;
        return originales.reduce(function (a, li) { return a + li.offsetWidth + hueco; }, 0);
      };
    });
    var parado = false, visible = true, extra = 0;
    var zona = $('#detalles-filas');
    zona.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') parado = true; });
    zona.addEventListener('pointerleave', function () { parado = false; });
    zona.addEventListener('focusin', function () { parado = true; });
    zona.addEventListener('focusout', function () { parado = false; });
    if (lenis) lenis.on('scroll', function (e) { extra = Math.min(Math.abs(e.velocity || 0) * 0.2, 6); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(zona);
    var pos = filas.map(function (f) { return f.getAttribute('data-sentido') === '-1' ? -f._ancho() : 0; });
    CDC.marquee = { get parado() { return parado; }, pos: pos };
    (function paso() {
      if (visible && !parado) {
        filas.forEach(function (f, i) {
          var ancho = f._ancho(), s = parseFloat(f.getAttribute('data-sentido'));
          pos[i] -= s * (0.42 + extra);
          if (pos[i] <= -ancho) pos[i] += ancho;
          if (pos[i] > 0) pos[i] -= ancho;
          f.firstElementChild.style.transform = 'translate3d(' + pos[i].toFixed(2) + 'px,0,0)';
        });
        extra *= 0.94;
      }
      requestAnimationFrame(paso);
    })();
  })();

  /* ═══════════════ NOTAS (páginas de casa): la reja crece hasta la nota ═══════════════ */
  (function notas() {
    var b = $('.notas__barras');
    if (!b) return;
    if (!movimiento) { b.classList.add('es-vista'); return; }
    cuandoVisible([b], function () { b.classList.add('es-vista'); });
  })();

  /* ═══════════════ GALERÍA de una estancia (<dialog>) ═══════════════ */
  (function galeria() {
    var dlg = $('#galeria');
    var datos = $('#estancias-datos');
    if (!dlg || !datos || typeof dlg.showModal !== 'function') return;
    var estancias = {};
    try { JSON.parse(datos.textContent).forEach(function (e) { estancias[e.id] = e; }); } catch (e) { return; }
    var nombre = $('#galeria-nombre'), cuenta = $('#galeria-cuenta'), figura = $('#galeria-figura'), minis = $('#galeria-miniaturas');
    var lista = [], i = 0, origen = null;
    function picture(f, sizes, carga, alt) {
      var set = function (ext) { return f.anchos.map(function (a) { return 'assets/fotos/' + f.id + '-' + a + '.' + ext + ' ' + a + 'w'; }).join(', '); };
      var mayor = f.anchos[f.anchos.length - 1];
      var p = document.createElement('picture');
      ['avif', 'webp'].forEach(function (ext) { var s = document.createElement('source'); s.type = 'image/' + ext; s.srcset = set(ext); s.sizes = sizes; p.appendChild(s); });
      var img = document.createElement('img');
      img.src = 'assets/fotos/' + f.id + '-' + mayor + '.jpg'; img.srcset = set('jpg'); img.sizes = sizes;
      img.width = mayor; img.height = Math.round(f.h * mayor / f.w);
      img.alt = alt == null ? f.alt : alt; img.decoding = 'async';
      if (carga !== 'eager') img.loading = 'lazy';
      p.appendChild(img);
      return p;
    }
    function pintar() {
      var f = lista[i];
      figura.textContent = '';
      figura.appendChild(picture(f, '(max-width: 860px) 100vw, 1200px', 'eager'));
      cuenta.textContent = 'Foto ' + (i + 1) + ' de ' + lista.length;
      todos('button', minis).forEach(function (b, k) { b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      var activa = minis.children[i];
      if (activa && activa.scrollIntoView) activa.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    function ir(d) { if (!lista.length) return; i = (i + d + lista.length) % lista.length; pintar(); }
    function abrir(id, desde) {
      var e = estancias[id];
      if (!e) return;
      lista = e.fotos; i = 0; origen = desde || document.activeElement;
      nombre.textContent = e.nombre;
      minis.textContent = '';
      lista.forEach(function (f, k) {
        var li = document.createElement('li'), b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Foto ' + (k + 1) + ': ' + f.alt);
        b.appendChild(picture(f, '64px', 'lazy', ''));
        b.addEventListener('click', function () { i = k; pintar(); });
        li.appendChild(b); minis.appendChild(li);
      });
      pintar();
      dlg.showModal();
      if (lenis) lenis.stop();
      $('#galeria-sig').focus({ preventScroll: true });
    }
    todos('[data-estancia]').forEach(function (b) { b.addEventListener('click', function () { abrir(b.getAttribute('data-estancia'), b); }); });
    $('#galeria-ant').addEventListener('click', function () { ir(-1); });
    $('#galeria-sig').addEventListener('click', function () { ir(1); });
    $('#galeria-cerrar').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); ir(-1); }
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    /* Escape cierra (lo hace el propio <dialog>) y el foco vuelve a la estancia */
    dlg.addEventListener('close', function () {
      if (lenis) lenis.start();
      if (origen && origen.focus) origen.focus({ preventScroll: true });
    });
    var x0 = null;
    figura.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    figura.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) ir(dx < 0 ? 1 : -1);
    });
    CDC.galeria = { abrir: abrir, get indice() { return i; }, get lista() { return lista.slice(); } };
  })();

  /* ───────────────── botones magnéticos ───────────────── */
  (function imanes() {
    if (!movimiento || esTactil) return;
    todos('.iman').forEach(function (el) {
      var aX = gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3.out' });
      var aY = gsap.quickTo(el, 'y', { duration: 0.55, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var c = el.getBoundingClientRect();
        aX((e.clientX - (c.left + c.width / 2)) * 0.32);
        aY((e.clientY - (c.top + c.height / 2)) * 0.42);
      });
      el.addEventListener('pointerleave', function () { aX(0); aY(0); });
    });
  })();

  /* ───────────────── cursor propio: punto de hierro + aro de piedra ───────────────── */
  (function cursor() {
    if (!movimiento || esTactil) return;
    var aro = document.createElement('div');
    var pt = document.createElement('div');
    aro.className = 'cursor';
    pt.className = 'cursor-punto';
    [aro, pt].forEach(function (n) { n.setAttribute('aria-hidden', 'true'); document.body.appendChild(n); });
    var aX = gsap.quickTo(aro, 'x', { duration: 0.28, ease: 'power3.out' });
    var aY = gsap.quickTo(aro, 'y', { duration: 0.28, ease: 'power3.out' });
    var ultimo = null;
    function mostrar(si) { aro.classList.toggle('es-vivo', si); pt.classList.toggle('es-vivo', si); }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (!aro.classList.contains('es-vivo')) { gsap.set(aro, { x: e.clientX, y: e.clientY }); mostrar(true); }
      /* el del sistema se oculta solo cuando el propio ya se ve */
      if (!html.classList.contains('con-cursor')) html.classList.add('con-cursor');
      gsap.set(pt, { x: e.clientX, y: e.clientY });
      aX(e.clientX); aY(e.clientY);
      if (e.target !== ultimo) {
        ultimo = e.target;
        var sobre = !!(e.target.closest && e.target.closest('a, button, label, input, select, textarea, summary, [role="button"]'));
        aro.classList.toggle('es-activo', sobre);
        pt.classList.toggle('es-activo', sobre);
      }
    });
    html.addEventListener('mouseleave', function () { mostrar(false); });
    html.addEventListener('mouseenter', function () { if (html.classList.contains('con-cursor')) mostrar(true); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) mostrar(false); });
  })();

  /* ───────────────── cabecera fija y menú móvil ───────────────── */
  var cabecera = $('#cabecera');
  var boton = $('#hamburguesa');
  (function cabeceraFija() {
    if (!cabecera) return;
    function actualizar() { cabecera.classList.toggle('es-fija', window.pageYOffset > 40 || !esPortada); }
    window.addEventListener('scroll', actualizar, { passive: true });
    actualizar();
  })();
  function cerrarMenu() {
    if (!cabecera || !boton || !cabecera.classList.contains('es-abierta')) return;
    cabecera.classList.remove('es-abierta');
    boton.setAttribute('aria-expanded', 'false');
    $('.visualmente-oculto', boton).textContent = 'Abrir menú';
    if (lenis) lenis.start();
  }
  if (boton) {
    boton.addEventListener('click', function () {
      var abierto = cabecera.classList.toggle('es-abierta');
      boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      $('.visualmente-oculto', boton).textContent = abierto ? 'Cerrar menú' : 'Abrir menú';
      if (lenis) { if (abierto) lenis.stop(); else lenis.start(); }
    });
    todos('#menu a').forEach(function (a) { a.addEventListener('click', cerrarMenu); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarMenu(); });

  /* ───────────────── mapa: Google solo bajo clic ───────────────── */
  (function mapa() {
    var btn = $('#mapa-boton'), caja = $('#mapa-consentimiento');
    if (!btn || !caja) return;
    btn.addEventListener('click', function () {
      var marco = document.createElement('iframe');
      marco.src = 'https://www.google.com/maps?q=Calle+Mel%C3%A9ndez+Vald%C3%A9s+1+Badajoz&output=embed';
      marco.loading = 'lazy';
      marco.title = 'Mapa: Casa da Catedral, C/ Meléndez Valdés 1, Badajoz';
      marco.allowFullscreen = true;
      marco.referrerPolicy = 'no-referrer-when-downgrade';
      caja.parentNode.replaceChild(marco, caja);
      setTimeout(refrescar, 60);
    });
  })();

  /* ───────────────── consultar fechas: el mensaje para Verónica ───────────────── */
  /* mailto según RFC 6068: saltos de línea como CRLF y todo codificado */
  function mailto(asunto, cuerpo) {
    return 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(cuerpo.replace(/\r?\n/g, '\r\n'));
  }
  function copiarViejo(texto) {
    var t = document.createElement('textarea');
    t.value = texto; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(t);
    return ok;
  }
  function copiar(texto) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(texto).then(function () { return true; }, function () { return copiarViejo(texto); });
    }
    return Promise.resolve(copiarViejo(texto));
  }
  CDC.mailto = mailto;

  (function consulta() {
    var form = $('#consulta');
    if (!form) return;
    var llegada = $('#llegada'), salida = $('#salida');
    var errFechas = $('#fechas-error'), errNombre = $('#nombre-error'), aviso = $('#plazas-aviso');
    var caja = $('#mensaje'), salidaTxt = $('#mensaje-texto'), estado = $('#mensaje-estado'), pronto = $('#mensaje-pronto');
    var bEmail = $('#enviar-email'), bWa = $('#enviar-whatsapp'), bTel = $('#enviar-telefono');
    var texto = '', asunto = '';
    var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    function aFecha(v) { var p = v.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
    function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    function largo(d, conAnio) { return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()] + (conAnio ? ' de ' + d.getFullYear() : ''); }
    function corto(d) { return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear(); }
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    llegada.min = iso(hoy);

    /* desde la página de una casa: ./?casa=ramona#fechas */
    var pedida = (location.search.match(/[?&]casa=(ramona|jeronimo)\b/) || [])[1];
    if (pedida) { var r = form.querySelector('input[name="casa"][value="' + pedida + '"]'); if (r) r.checked = true; }

    function comprobarFechas(final) {
      llegada.removeAttribute('aria-invalid'); salida.removeAttribute('aria-invalid');
      if (!llegada.value || !salida.value) {
        errFechas.textContent = final ? 'Elige la fecha de llegada y la de salida.' : '';
        if (final) (llegada.value ? salida : llegada).setAttribute('aria-invalid', 'true');
        return false;
      }
      if (aFecha(salida.value) <= aFecha(llegada.value)) {
        errFechas.textContent = 'La salida tiene que ser posterior a la llegada.';
        salida.setAttribute('aria-invalid', 'true');
        return false;
      }
      errFechas.textContent = '';
      return true;
    }
    llegada.addEventListener('change', function () {
      if (llegada.value) { var a = aFecha(llegada.value); a.setDate(a.getDate() + 1); salida.min = iso(a); }
      if (salida.value) comprobarFechas(false);
    });
    salida.addEventListener('change', function () { comprobarFechas(false); });
    function plazas() {
      var n = (parseInt(form.elements.adultos.value, 10) || 0) + (parseInt(form.elements.ninos.value, 10) || 0);
      aviso.textContent = n > 5 ? 'Cada casa es para hasta 5 personas. Si sois más, cuéntaselo a Verónica en el mensaje: hay dos casas en el mismo edificio.' : '';
    }
    form.elements.adultos.addEventListener('input', plazas);
    form.elements.ninos.addEventListener('input', plazas);

    function apagar(b, si) {
      b.classList.toggle('es-apagado', si);
      if (si) { b.removeAttribute('href'); b.setAttribute('aria-disabled', 'true'); b.setAttribute('tabindex', '-1'); }
      else { b.removeAttribute('aria-disabled'); b.removeAttribute('tabindex'); }
    }
    function pintarEnvios() {
      apagar(bEmail, !CONFIG.email);
      apagar(bWa, !CONFIG.whatsapp);
      apagar(bTel, !CONFIG.telefono);
      if (CONFIG.email && texto) bEmail.href = mailto(asunto, texto);
      if (CONFIG.whatsapp && texto) { bWa.href = 'https://wa.me/' + String(CONFIG.whatsapp).replace(/\D/g, '') + '?text=' + encodeURIComponent(texto); bWa.target = '_blank'; bWa.rel = 'noopener'; }
      if (CONFIG.telefono) bTel.href = 'tel:' + String(CONFIG.telefono).replace(/[^\d+]/g, '');
      pronto.hidden = !!(CONFIG.email || CONFIG.whatsapp || CONFIG.telefono);
    }
    pintarEnvios();
    document.addEventListener('config-cargada', pintarEnvios);
    [bEmail, bWa, bTel].forEach(function (b) { b.addEventListener('click', function (e) { if (b.classList.contains('es-apagado')) e.preventDefault(); }); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var okFechas = comprobarFechas(true);
      var nombre = form.elements.nombre.value.trim();
      form.elements.nombre.toggleAttribute('aria-invalid', !nombre);
      errNombre.textContent = nombre ? '' : 'Falta tu nombre, para que Verónica sepa quién escribe.';
      if (!okFechas || !nombre) { caja.hidden = true; return; }
      var a = aFecha(llegada.value), b = aFecha(salida.value);
      var noches = Math.round((b - a) / 864e5);
      var ad = Math.max(1, parseInt(form.elements.adultos.value, 10) || 1);
      var ni = Math.max(0, parseInt(form.elements.ninos.value, 10) || 0);
      var quienes = ad + (ad === 1 ? ' adulto' : ' adultos') + (ni ? ' y ' + ni + (ni === 1 ? ' niño' : ' niños') : '');
      var casa = (form.querySelector('input[name="casa"]:checked') || {}).value || 'igual';
      var que = casa === 'ramona' ? 'Ramona' : casa === 'jeronimo' ? 'Jerónimo' : 'una de las dos casas, Ramona o Jerónimo,';
      var mismoAnio = a.getFullYear() === b.getFullYear();
      var lineas = [
        'Hola Verónica, ' + (ad + ni === 1 ? 'soy ' + nombre + ' y quiero ' : 'somos ' + quienes + ' y queremos ') + que +
          ' del ' + largo(a, !mismoAnio) + ' al ' + largo(b, true) + ' (' + noches + (noches === 1 ? ' noche' : ' noches') + ').'
      ];
      if (form.elements.mascota.checked) lineas.push('Venimos con mascota.');
      var msg = form.elements.mensaje.value.trim();
      if (msg) lineas.push('', msg);
      lineas.push('', casa === 'igual' ? '¿Hay alguna libre esas fechas?' : '¿Está libre esas fechas?', '', 'Un saludo,', nombre);
      texto = lineas.join('\n');
      asunto = 'Consulta de fechas · ' + (casa === 'igual' ? 'Casa da Catedral' : que) + ' · ' + corto(a) + ' – ' + corto(b);
      salidaTxt.textContent = texto;
      estado.textContent = '';
      caja.hidden = false;
      pintarEnvios();
      setTimeout(refrescar, 30);
      if (caja.scrollIntoView) caja.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    });
    $('#mensaje-copiar').addEventListener('click', function () {
      copiar(texto).then(function (ok) {
        estado.textContent = ok ? 'Mensaje copiado. Pégalo donde quieras.' : 'No se ha podido copiar: selecciona el texto y cópialo a mano.';
      });
    });
    CDC.consulta = { get texto() { return texto; } };
  })();

  /* ───────────────── aviso de cookies ───────────────── */
  (function cookies() {
    var caja = $('#cookies'), ok = $('#cookies-aceptar'), reabrir = $('#cookies-reabrir');
    if (!caja || !ok) return;
    function ver(si) {
      caja.hidden = !si;                       /* el CSS pone display solo si NO hay [hidden] */
      document.body.classList.toggle('cookies-visibles', si);
    }
    var guardado = null;
    try { guardado = localStorage.getItem('cdc-cookies'); } catch (e) {}
    if (guardado !== 'ok') ver(true);
    ok.addEventListener('click', function () {
      ver(false);
      try { localStorage.setItem('cdc-cookies', 'ok'); } catch (e) {}
    });
    if (reabrir) reabrir.addEventListener('click', function () { ver(true); ok.focus(); });
  })();

  var anio = $('#anio');
  if (anio) anio.textContent = new Date().getFullYear();

  if (gsapReady && document.fonts && document.fonts.ready) document.fonts.ready.then(refrescar);
  /* contenido que cambia de alto (mensaje, mapa, tabla): el fin de página de ScrollTrigger se queda viejo */
  if (gsapReady && 'ResizeObserver' in window) {
    var altoPrevio = 0;
    var refrescarTarde = esperar(refrescar, 150);
    new ResizeObserver(function () {
      var a = document.body.offsetHeight;
      if (Math.abs(a - altoPrevio) < 40) return;
      altoPrevio = a;
      refrescarTarde();
    }).observe(document.body);
  }
  /* llegada con #ancla (desde la página de una casa): el pin cambia las medidas, se recoloca */
  if (location.hash && location.hash.length > 1) {
    var anclaje = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (anclaje) document.addEventListener('cortina-retirada', function () { setTimeout(function () { refrescar(); irA(anclaje); }, 120); }, { once: true });
  }

  /* ═══════════════════════════════════════════════════════════════════════
     [MANDO DE MAQUETA] — SOLO REVISIÓN INTERNA. NO PUBLICAR.
     Borrar este bloque entero, el bloque CSS marcado igual en estilos.css,
     el <div class="mando"> y la parte de densidad del script bloqueante del
     <head>. Receta en el README (node scripts/quitar-mando.mjs).
     ═══════════════════════════════════════════════════════════════════════ */
  (function mandoMaqueta() {
    var mando = $('#mando');
    if (!mando) return;
    /* solo con ?revision: el enlace que recibe el cliente sale limpio */
    if (!/[?&]revision\b/.test(window.location.search)) return;
    mando.hidden = false;                       /* sin JS no haría nada: lo enseña el JS */
    var botones = todos('[data-densidad]', mando);
    function aplicar(d) {
      html.classList.remove('densidad-vecina', 'densidad-sobria');
      html.classList.add('densidad-' + d);
      botones.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-densidad') === d ? 'true' : 'false'); });
      try { localStorage.setItem('cdc-densidad', d); } catch (e) {}
      document.dispatchEvent(new CustomEvent('densidad-cambiada', { detail: d }));
      setTimeout(refrescar, 90);
    }
    var actual = densidad();
    botones.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-densidad') === actual ? 'true' : 'false');
      b.addEventListener('click', function () { aplicar(b.getAttribute('data-densidad')); });
    });
    /* la revisión se mantiene al pasar de página (díptico → casa → portada) */
    todos('a[href]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (!h || /^(https?:|mailto:|tel:|#)/.test(h) || /revision/.test(h)) return;
      var partes = h.split('#');
      a.setAttribute('href', partes[0] + (partes[0].indexOf('?') >= 0 ? '&' : '?') + 'revision' + (partes[1] !== undefined ? '#' + partes[1] : ''));
    });
    /* en la sobria no hay View Transitions */
    window.addEventListener('pageswap', function (e) { if (e.viewTransition && densidad() === 'sobria') e.viewTransition.skipTransition(); });
  })();
  /* ═══════════ fin del bloque [MANDO DE MAQUETA] ═══════════ */
})();
