# Créditos

## Fotografías

Son las de las dos fichas públicas de Casa da Catedral en Booking (Ramona y Jerónimo), hechas por la propia casa. Se descargaron el 2 de octubre de 2026 a resolución original. No hay ninguna foto de banco de imágenes.

- Originales: `../casa-da-catedral-badajoz-bocetos/ref/booking/` (Ramona) y `ref/booking-jeronimo/` (Jerónimo). Las hojas numeradas son `_hoja.jpg`.
- Están corregidas con `scripts/gradar.py`, muy suavemente: blancos compartidos, cada casa con su tono y el cielo de la terraza algo más quieto. No se ha cambiado ningún fondo.
- Hay que pedirle a Verónica permiso para usarlas en su web: son suyas, pero ahora están publicadas en Booking.

## Marca y dibujos

- El sello (flor de lis con laurel) está **redibujado** con geometría simétrica desde el JPG de su Instagram (`ref/ig/_sello.jpg`). Si existe el original, hay que sustituirlo.
- La torre de la Catedral, la reja de su balcón, la cinta de los llaveros y los adornos de las puertas están dibujados para esta web, con medidas tomadas de sus fotos (`scripts/dibujos.mjs`).
- Los iconos son propios, de trazo de 1,5 px.

## Tipografías

- Marcellus, de Astigmatic (Brian J. Bonislawsky). SIL Open Font License, vía Google Fonts.
- Crimson Pro, de Jacques Le Bailly. SIL Open Font License, vía Google Fonts.
- Brygada 1918, de Mateusz Machalski y el equipo de Brygada. SIL Open Font License, vía Google Fonts (solo los glifos de la cinta).

## Librerías

- GSAP 3.12.5 y ScrollTrigger, de GreenSock. Licencia estándar «no charge», desde jsDelivr.
- Lenis 1.1.13, de darkroom.engineering. Licencia MIT, desde jsDelivr.

## Herramientas

- Python con Pillow y NumPy (gradación), sharp (versiones responsive) y Playwright (`og:image` y verificación).
