"""Corrección suave de las fotos de Booking (memoria «food photo consistency»).

Son DOS reportajes profesionales con gradaciones distintas, y la diferencia es
el carácter de cada casa (el díptico vive de ella):
  - Ramona, 2020: sepia y oscura.
  - Jerónimo, 2022: clara y fría.
  - La terraza, 2026: foto de móvil con el cielo azul muy saturado.

Aquí NO se igualan. Solo se hace lo justo para que, puestas lado a lado,
compartan los blancos y no choquen:

  1. Blancos compartidos. Se mide el «blanco» de cada foto (píxeles claros y
     poco saturados: paredes, sábanas, cielo nublado) y se lleva A MEDIAS hacia
     el blanco de la cal (#F4EFE7). La corrección pesa solo en las luces
     (máscara por luminancia): las sombras y los medios conservan el sepia de
     Ramona y el frío de Jerónimo.
  2. Luces a la misma altura. El percentil 99 de luminancia se acerca a un
     objetivo común, también a medias y solo en las luces.
  3. Terraza: el azul del cielo baja un poco de saturación y de brillo, sin
     dejar de ser azul. Es la única foto con cielo azul de la web.

Entrada: casa-da-catedral-badajoz-bocetos/ref/booking*/<id>.jpg (no se tocan)
Salida:  scripts/fuentes/graduadas/<id>.jpg (máster, q 94)
Lista:   scripts/fotos-lista.json (ids, recortes y tipo de cada foto)

  python scripts/gradar.py              (todas)
  python scripts/gradar.py 248106320    (una, para probar)
"""
import os, sys, json
import numpy as np
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
REF = os.path.normpath(os.path.join(AQUI, '..', '..', 'casa-da-catedral-badajoz-bocetos', 'ref'))
CARPETA = {'ramona': 'booking', 'jeronimo': 'booking-jeronimo'}
DESTINO = os.path.join(AQUI, 'fuentes', 'graduadas')
os.makedirs(DESTINO, exist_ok=True)

CAL = np.array([244, 239, 231]) / 255.0

def a_lineal(c): return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def a_srgb(c): return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(np.clip(c, 0, None), 1 / 2.4) - 0.055)
def suave(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)

def gradar(im, tipo):
    x = np.asarray(im.convert('RGB')).astype(np.float64) / 255.0
    lin = a_lineal(x)
    lum = 0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]
    mx, mn = x.max(-1), x.min(-1)
    sat = (mx - mn) / np.maximum(mx, 1e-6)
    luz = suave(0.18, 0.75, lum)[..., None]          # máscara de luces (lineal)

    # 1 · blancos compartidos, a medias y solo en las luces
    p90, p995 = np.percentile(lum, 90), np.percentile(lum, 99.5)
    neutros = (lum >= p90) & (lum <= p995) & (sat < 0.25)
    if neutros.mean() > 0.002:
        blanco = lin[neutros].mean(0)
        objetivo = a_lineal(CAL) * (blanco.mean() / a_lineal(CAL).mean())   # mismo brillo, otro tono
        ganancia = np.clip(objetivo / np.maximum(blanco, 1e-4), 0.85, 1.18)
        ganancia = 1 + (ganancia - 1) * 0.55
        lin = lin * (1 + (ganancia - 1) * luz)

    # 2 · luces a la misma altura (Ramona sube un poco, Jerónimo casi nada)
    lum = 0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]
    p99 = np.percentile(lum, 99)
    objetivo99 = 0.80
    k = 1 + (np.clip(objetivo99 / max(p99, 1e-3), 0.85, 1.25) - 1) * 0.5
    lin = lin * (1 + (k - 1) * luz)

    x = np.clip(a_srgb(np.clip(lin, 0, 1)), 0, 1)

    # 3 · terraza: el cielo azul, un poco más quieto
    if tipo == 'azotea':
        r, g, b = x[..., 0], x[..., 1], x[..., 2]
        mx = x.max(-1); mn = x.min(-1); d = np.maximum(mx - mn, 1e-6)
        h = np.where(mx == b, 4 + (r - g) / d, np.where(mx == g, 2 + (b - r) / d, ((g - b) / d) % 6)) * 60
        s = (mx - mn) / np.maximum(mx, 1e-6)
        azul = np.clip(1 - np.abs(h - 212) / 34, 0, 1) * np.clip((s - 0.18) / 0.35, 0, 1)
        L = (0.299 * r + 0.587 * g + 0.114 * b)[..., None]
        x = L + (x - L) * (1 - 0.38 * azul[..., None])
        x = x * (1 - 0.05 * azul[..., None])

    return Image.fromarray((np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8))

if __name__ == '__main__':
    lista = json.load(open(os.path.join(AQUI, 'fotos-lista.json'), encoding='utf-8'))['fotos']
    pedidas = set(sys.argv[1:])
    n = 0
    for f in lista:
        if pedidas and f['id'] not in pedidas: continue
        origen = f.get('origen', f['id'])
        im = Image.open(os.path.join(REF, CARPETA[f['casa']], origen + '.jpg'))
        if f.get('recorte'): im = im.crop(tuple(f['recorte']))
        gradar(im, f['tipo']).save(os.path.join(DESTINO, f['id'] + '.jpg'), quality=94, subsampling=0)
        n += 1
    print(n, 'fotos graduadas en', DESTINO)
