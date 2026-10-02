# Casa da Catedral · Badajoz · «La Catedral de vecina»

Web para **Casa da Catedral**: dos apartamentos turísticos con nombre propio, **Ramona** y **Jerónimo**, en el mismo edificio de C/ Meléndez Valdés, 1 · 06002 Badajoz, en la Plaza de España, frente a la Catedral. Los lleva su anfitriona, **Verónica**. Licencia **AT-BA-00139** (la misma en las dos fichas de Booking).

**Estado:** construida el 2 de octubre de 2026, **en local y sin publicar** (no hay repo ni Pages: hay que preguntar antes de crearlos).
- Lleva `noindex, nofollow` en todas las páginas.
- Lleva el mando de dos versiones, que solo se enseña con `?revision` en la URL.
- Antes de entregarla, sigue «Quitar el mando de maqueta».

```
node scripts/servir.mjs                 → http://127.0.0.1:4231   (servida por HTTP: config.json se relee y hay View Transitions)
http://127.0.0.1:4231/?revision         → con el mando de las dos versiones y los avisos pendientes
node scripts/construir.mjs              → rehace las páginas desde data/*.json (idempotente)
node scripts/verificar.mjs --capturas   → 200 comprobaciones + 94 capturas en screenshots/ (200 bien, 2-10-2026)
```

---

## El concepto: «La Catedral de vecina»

Lo que tienen y nadie más es **la torre de la Catedral al otro lado de la reja de su balcón**. Sus mejores fotos la enseñan así y el nombre ya lo dice. La web te asoma al balcón: la torre de fondo y la **reja de rombos** delante. La forja hace de friso entre secciones. Encima van dos objetos suyos: **la cinta de sus llaveros** y **el sello de la flor de lis con laurel**.

1. **Cortina** (hierro, ~2,5 s). La torre se traza en línea de piedra: primero la silueta, luego las nueve almenas, los vanos con sus campanas y el reloj. Cae un llavero con «CASA DA CATEDRAL», se balancea una vez y se para. La capa sube con borde curvo y paralaje interno, la cinta se recoge hacia arriba y **la reja del hero sube desde abajo en el mismo gesto**.
2. **Hero.** La torre a sangre (870507584, recortada por encima de su propia reja) y la reja SVG delante, en el 30 % de abajo. Al bajar das un paso fuera: pin corto, la reja baja y sale de cuadro, la torre se acerca de 1 a 1,08 y el velo se aclara. En móvil, sin pin.
3. **Las casas** (el díptico): Ramona a la izquierda, Jerónimo a la derecha, con el mismo peso. Cada mitad lleva su foto de carácter, su velo de color, **el adorno de su puerta** redibujado en línea, el nombre en cursiva enorme y **su llavero colgando**. La mitad señalada se abre a 1,38; la otra se recoge a 0,62. Con View Transitions, la foto de la mitad es la foto del hero de su página.
4. **La vista**, **lo que tienen las dos**, **los detalles** (marquee doble), **el libro de visitas** (módulo quitable), **para que todo vaya bien**, **consultar fechas** y **dónde**.

## Qué es real y qué es provisional

| Dato | Estado | Fuente |
|---|---|---|
| Nombre «Casa da Catedral» (con «da») | **Real** | Booking, Instagram, sus llaveros |
| Dirección, coordenadas | **Real** | Booking, OpenStreetMap |
| Las dos casas: 90 m², 2 dormitorios, 2 baños, hasta 5, camas, horarios | **Real** | Booking |
| Notas 9,6 (116 y 81 comentarios) y categorías | **Real** a 2 de octubre de 2026 | Booking |
| Las 10 citas | **Reales y literales**, sin nombre (comprobadas en `ref/booking*/texto.txt`) | Booking |
| Ascensor que entra en casa, entrada autónoma, terraza con ducha, mascotas, equipamiento | **Real** | Texto de Verónica y servicios de Booking |
| Aviso del ruido en fiestas, normas, parking San Atón con Telpark, distancias | **Real** (su texto) | Booking |
| Fotos | **Reales**: las 90 de sus dos fichas; se usan 48 + 3 recortes | Booking |
| **Contacto directo** | **Provisional**: no hay ninguno público. `config.json` en `null` | — |
| **La azotea**: ¿compartida o de cada casa? | **Provisional**: «la terraza con ducha, y la torre al lado», sin decirlo | — |
| **Planta de Jerónimo** | **Provisional**: `null`, no se enseña | — |
| **Licencia** AT-BA-00139 en las dos fichas | **Por confirmar** | Booking |
| Sello, flor de lis, laurel, torre, reja, adornos de las puertas | **Redibujados** con medidas (ver abajo); falta el original del sello | Instagram, fotos |
| Titular y NIF (aviso legal) | `[PENDIENTE]` | — |
| Ficha de Google | **No hay**: nada de Google en la web | — |

Con `?revision` se ven las marcas `[VERIFICAR]` de la azotea y `[PENDIENTE]` de la foto de los baños de Jerónimo, el aviso «Sin contacto directo» en el formulario, y el mando lista lo que falta.

## Pendientes para Verónica

1. **Contacto directo**: teléfono, email y/o WhatsApp, y si acepta reserva directa. Basta con rellenarlo en `data/config.json`: cada dato enciende su botón (y el JSON-LD lleva el teléfono si lo hay).
2. **El sello original** (flor de lis con laurel) y cualquier versión vectorial. El de la web está redibujado desde un JPG de 690 × 405.
3. **Por qué se llaman Ramona y Jerónimo**, si quiere contarlo. Va en `"origen_nombre"` de cada casa en `data/casas.json` y aparece una línea en su página.
4. **La planta de Jerónimo** (`"planta"` en `casas.json`: aparece en el díptico, su página, la tabla y el JSON-LD).
5. **Si la azotea es compartida** o de cada casa. Las fotos de 2026 enseñan la misma en las dos fichas.
6. **La licencia**: AT-BA-00139 sale en las dos fichas, ¿es una para las dos?
7. **Permiso para citar opiniones con nombre** y para usar **la foto del libro de visitas** (y al huésped que dibujó la plaza). La foto va en `config.libro_foto`; mientras sea `null`, el hueco no se ve.
8. **Si quiere salir con nombre o foto.** Ahora aparece solo «Verónica», como en las opiniones, sin foto ni biografía.
9. **La ficha de Google**. Si tiene pocas reseñas, se enseñará la nota sin cifra.
10. **Versión en inglés** (`/en/`, segunda fase) y **variante de Navidad** con la foto del árbol de la plaza desde el balcón (`../casa-da-catedral-badajoz-bocetos/ref/ig/DEQhnXruEm7.jpg`).
11. **El dominio** (`casadacatedral.es` / `.com`).
12. **Titular y NIF** para el aviso legal y la privacidad.
13. **La campana de la puerta de Jerónimo**: en la foto de 2022 (335339645) es un adorno de Navidad («Merry Christmas» con un reno). La web la dibuja como su emblema, como pedía el encargo, pero conviene preguntarle si sigue en la puerta o si prefiere otro.
14. **Faltan fotos de los baños de Jerónimo**: no hay ninguna en su ficha. La estancia sale como tarjeta sin galería (con un dibujo de ducha), no se ha rellenado con fotos de otro sitio.

## Mapa de secciones

**Portada (`index.html`)**
1. Hero (`#inicio`) · torre + reja + pin.
2. Cinta separadora (solo «Catedral de vecina»).
3. Las casas (`#casas`) · sello + «Elige casa» + díptico. En la sobria, además, la tabla comparativa (`#comparar`).
4. La vista (`#vista`) · rejilla asimétrica con paralaje y la terraza a sangre.
5. Lo que tienen las dos (`#comun`) · ascensor, entrada autónoma y mascotas, con el mismo peso; equipamiento; «una parada en el camino».
6. Los detalles (`#detalles`) · marquee doble en sentidos opuestos, alternando casas; se para con el ratón encima.
7. El libro de visitas (`#libro`) · **módulo quitable**.
8. Para que todo vaya bien (`#normas`) · horarios por casa, llegada, la plaza (su aviso de ruido), normas, parking.
9. Consultar fechas (`#fechas`) · formulario que compone el mensaje + los dos botones de Booking.
10. Dónde (`#donde`) · dirección, mapa bajo consentimiento y el llavero de la marca.
11. Pie · friso de reja, sello, licencia, Instagram, legal, «Hablamos español e inglés».

**Páginas de cada casa (`ramona.html`, `jeronimo.html`)**, generadas con la misma plantilla:
hero (su torre con la reja, el adorno, su llavero, datos y CTAs) → la casa por estancias (cada una abre un `<dialog>` con su galería) → camas → su carácter (tres detalles) → sus notas (categorías como tramos de reja y sus citas) → lo común y su horario → la otra casa.

## Los datos: todo sale de `data/`

- **`data/casas.json`** — nombre, slug, planta, camas, horarios, notas, categorías, fotos (díptico, hero, estancias, detalles, marquee), carácter, URL de Booking y adorno de la puerta. `node scripts/construir.mjs` genera `ramona.html` y `jeronimo.html` desde `plantillas/casa.html` y rellena en `index.html` las regiones `⟦gen:…⟧` (díptico, tabla, horarios, Booking, libro, detalles, JSON-LD). Todo queda en HTML estático: nada se ve solo con JS.
- **`data/opiniones.json`** — las 10 citas. Las usan el libro (portada) y las páginas de casa.
- **`data/config.json`** — contacto (`telefono`, `email`, `whatsapp`), Instagram y `libro_foto`. Va incrustado en cada página al construir y además `main.js` lo relee al cargar: rellenar un dato enciende su botón sin tocar nada más.
- **`data/fotos.json`** — lo genera `scripts/fotos.mjs` desde `scripts/fotos-lista.json` (ids, recortes y `alt`).
- Las partes comunes (arranque del `<head>`, cortina, cabecera, pie, avisos) viven en `plantillas/_*.html` y se copian a todas las páginas. **No editar `ramona.html` ni `jeronimo.html` a mano.**

Cambiar una foto: el id en `casas.json` (debe estar en `fotos-lista.json`; si es nueva, `python scripts/gradar.py <id>` y `node scripts/fotos.mjs`) y `node scripts/construir.mjs`.

## Los dibujos: medidos, no calcados (`scripts/dibujos.mjs`)

- **La reja** (248106674, 248101584). Montantes a paso constante; arriba y abajo una banda de rombos alargados centrados en cada montante (el vértice de arriba toca el pasamanos y el de abajo es la cabeza del montante); proporción del rombo **alto/ancho = 2,2** (674: 190/85 px; 101: 160/72 px); la banda de montantes mide el doble que la de rombos. En la foto frontal caben 12 rombos en el hueco del balcón: con la reja de ~1 m, **~9 rombos por metro**. Es un `<pattern>` cuyo grosor de barra escala con el ancho, y un friso de 42 px con la misma proporción.
- **La torre** (870507584, 248101584, 248117591). Alzado con la cara de 160 unidades: **9 almenas** en la cara visible (contadas en las tres fotos, esquinas incluidas), cornisa con dentículos, cuerpo de campanas con dos vanos de arco y la saetera, imposta, reloj en marco de conopio, friso con crestería, la venera y los sillares de las aristas. Una silueta continua y cada detalle en su propio `<path>` con `pathLength="1"`.
- **La flor de lis y el laurel** (`ref/ig/_sello.jpg`). Mitad derecha reflejada: pétalo central, laterales que se enroscan, banda y pie con dos volutas. Corona de dos ramas que nacen abajo sin tocarse y se abren arriba (±21º), con **10 pares de hojas por rama + la terminal**, contadas en el JPG ampliado. Comparado a 3x contra el JPG. Piezas: `assets/dibujos/sello.svg`, `sello-claro.svg`, `lis.svg` y el favicon.
- **Los adornos de las puertas**: la «R» de remates rectos en su aro con espigas y la pizarrita (583881411) y la campanita con su lazo (335339645).

## Las fotos

Son las de las dos fichas de Booking, a resolución original. `scripts/gradar.py` hace **solo una corrección suave**: los blancos de las dos casas se acercan a medias al blanco de la cal (y solo en las luces), para que no choquen lado a lado; el sepia de Ramona (2020) y el frío de Jerónimo (2022) se quedan, porque el díptico vive de esa diferencia. En la terraza (2026) el azul del cielo baja un poco de saturación. `scripts/fotos.mjs` saca AVIF + WebP + JPG a 480/960/1440 (y 1920 en las de a sangre). No se ha usado ninguna foto con portada de revista reconocible ni la del libro de visitas.

## Quitar el libro de visitas

```
node scripts/quitar-libro.mjs
```
Borra la `<section id="libro" data-modulo="libro">` entera, su `<link>` de `css/libro.css` y su `<script>` de `js/libro.js`, el enlace «Opiniones» del menú (`<li data-modulo="libro">`, también en `plantillas/_cabecera.html`) y los dos archivos; después reconstruye. `data/opiniones.json` se queda: las páginas de casa siguen con sus citas. `verificar.mjs` lo prueba en una copia temporal (portada entera, consola limpia, sin 404).

## Quitar el mando de maqueta

**Caso A (entrega la versión cargada, «Catedral de vecina»):**
```
node scripts/quitar-mando.mjs ../casa-da-catedral-entrega
node scripts/comprobar-borrado.mjs ../casa-da-catedral-entrega
```
`quitar-mando.mjs` no toca esta carpeta: escribe una copia limpia (sin `scripts/`, `plantillas/` ni `screenshots/`) quitando todo lo marcado `[MANDO DE MAQUETA] … fin del bloque [MANDO DE MAQUETA]` en las seis páginas, `css/estilos.css`, `css/libro.css` y `js/main.js`; las marcas `solo-revision`; la tabla comparativa; y la fila `cdc-densidad` de la privacidad. Vuelve a versionar. `comprobar-borrado.mjs` busca 39 rastros contra los archivos: en la maqueta salen todos y en la copia, ninguno.

**Caso B (Verónica elige la sobria):** antes de copiar, en `css/estilos.css` saca del bloque del mando las reglas `.densidad-sobria …` y quítales el prefijo (y en `css/libro.css` igual); en `js/main.js`, el hero debe montar siempre la rama sin pin y los llaveros quedar quietos; quita la cinta (`.cinta-sep`) y los frisos salvo el del pie del HTML; y deja la tabla `#comparar` sin la clase `solo-sobria`. Después, caso A.

## Cómo se trabaja

| Script | Para qué |
|---|---|
| `scripts/servir.mjs` | Servidor local en el **4231** (el 4196/4197 los usan otras webs de la carpeta). También sirve bajo `/casa-da-catedral-badajoz-web/`, como Pages, para el 404. |
| `scripts/construir.mjs` | Páginas desde los JSON + partes comunes + `?v=` de CSS/JS. `--comprobar` falla si algo no está al día. |
| `scripts/dibujos.mjs` | Torre, reja, lis, laurel, sello, adornos, iconos y sprite. |
| `scripts/gradar.py` → `scripts/fotos.mjs` | Gradación suave y versiones responsive. |
| `scripts/generar-og.mjs` | Las tres `og:image` (1200 × 630). |
| `scripts/versionar.mjs` | `?v=<huella>` en `href`/`src` (lo aplica también `construir.mjs`). |
| `scripts/quitar-libro.mjs`, `quitar-mando.mjs`, `comprobar-borrado.mjs` | Recetas de borrado, comprobadas. |
| `scripts/verificar.mjs` | La batería de pruebas (Playwright, bajando con la rueda). |

## Contraste (medido en `verificar.mjs`, componiendo el alfa)

Tokens de texto: tinta, apagado y acento-texto sobre cal, cal en sombra y papel; claro y claro apagado sobre hierro; tinta del sello sobre papel: todos ≥ 4,5. Piedra, cinta y los colores de cada casa no van en texto pequeño. `--acento-texto` sale de la piedra en sombra con `color-mix` (62 % con hierro).
El texto claro del hero se mide sobre la foto real con su velo (se quita el texto, se fotografía el fondo y se toma el percentil 92 de luminancia, el peor caso): el velo oscurece donde hay letra (bloque de la izquierda y dato de la derecha) y deja la torre limpia.

## Qué la separa del resto de la carpeta

- **El Sótano** (a 116 m): aquí no hay listones de madera, ni almagre, ni sombra que siga al ratón, ni radar de distancias, ni League Gothic + Epilogue. La ubicación se cuenta como **vista** (la torre tras la reja), no como metros.
- **Casa de la Judería**: sin elegidor con preguntas, sin letra grande por apartamento (aquí cada casa lleva **el adorno de su puerta**), sin anillos de minutos, sin Commissioner.
- **Casa María y Las Dehesillas**: sin hilo de cobre, sin marcos con forma de tejado, sin casa abierta en corte, sin mazo de notas, sin zócalo; sin Gilda + Mulish ni Anton + Spectral.
- **Pazo do Souto**: nada se abre como puerta o portón; el díptico es un **corte** que se reparte el ancho.
- **Marabú y Melao v2**: sin cambio de tema día/noche.
- Letra propia: **Marcellus** (inscripción en piedra) + **Crimson Pro**, y **Brygada 1918** solo en la cinta.

## Decisiones

- **Una cortina por visita.** Las páginas de casa la tienen para quien llega directo (desde Booking o un enlace), pero no para quien viene de otra página de la web (`sin-cortina`, decidido en el `<head>` por el `referrer`): así la View Transition del díptico a la casa no queda tapada.
- **La foto del díptico y la del hero de la casa no son la misma** (el encargo pide el sillón / los arcos en el díptico y la torre desde esa casa en su página): la View Transition reparte la caja y funde una foto en otra.
- **Sin precios, sin condiciones**: ni «desde X €», ni «cancelación gratis», ni «sin comisiones». La cuna se escribe «para bebés de 0 a 2 años», sin «gratis».
- **Parking y bicis**: solo su texto (San Atón, Telpark). Nada de bicis.
- **Google**: nada hasta tener la ficha.
- **Mando de paleta**: no lleva. El PLIEGO lo pide para plantillas ficticias; aquí la paleta está medida en sus fotos y en su marca, como en el resto de webs de clientes reales de la carpeta.
- **«Lo que tienen las dos»**: ascensor, entrada autónoma y mascotas con el mismo peso; la entrada autónoma no dice «a cualquier hora» para no contradecir el horario de entrada de Booking (14:00/15:00–23:30).
