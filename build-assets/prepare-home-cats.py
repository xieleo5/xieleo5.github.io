"""Prepare home-cat shelf icons and background sprites from generated source art.

Requires Pillow. Usage: python3 build-assets/prepare-home-cats.py
Sources live in output/imagegen/ (not published). Each pose is cropped, scaled so
the cat's head size matches across poses, and saved with its foot baseline at the
bottom edge. The anchor (ax) is the eye position, so switching poses keeps the
head in place.
"""
from pathlib import Path
import json
from PIL import Image

root = Path(__file__).resolve().parent.parent
src = root / 'output/imagegen'
out = root / 'dist/assets/home-cats'
icons = root / 'dist/assets/menu-icons'
out.mkdir(parents=True, exist_ok=True)

CATS = {
    'elu': {
        'icon': 'elu-shelf-v3-playful.png',
        'poses': 'elu-12-poses-v1',
        # Generated poses are drawn at slightly different zoom levels; these
        # factors equalise head size (measured from iris size, tuned by eye).
        'scale': {'loaf': 0.78, 'sleep': 0.78, 'groom': 0.88},
        'iris': lambda r, g, b: b > r + 18 and b > 110,  # pale icy blue
    },
    'eevee': {
        'icon': 'eevee-shelf-v2.png',
        'poses': 'eevee-12-poses-v1',
        'scale': {'loaf': 0.8, 'sleep': 0.8, 'groom': 0.84},
        'iris': lambda r, g, b: g >= r - 2 and g > b + 20 and r < 190,  # olive green
    },
}
POSES = ['walk-contact', 'walk-passing', 'walk-opposite-contact', 'walk-opposite-passing',
         'run', 'pounce', 'sit', 'groom', 'loaf', 'sleep', 'stretch', 'play']
OUTPUT_SCALE = 0.13  # walking cat ~140px tall: crisp at 2x for a ~70px sprite


def eye_x(im, iris):
    """Mean x of the iris-coloured pixels in the front half of the image."""
    px, (w, h) = im.load(), im.size
    xs = [x for y in range(0, h, 2) for x in range(w // 2, w, 2)
          if px[x, y][3] > 200 and iris(*px[x, y][:3])]
    return sum(xs) / len(xs) if xs else None


def square_icon(path, target):
    im = Image.open(path).convert('RGBA')
    im = im.crop(im.getbbox())
    side = max(im.size)
    canvas = Image.new('RGBA', (side, side))
    canvas.alpha_composite(im, ((side - im.width) // 2, side - im.height))
    canvas.resize((256, 256), Image.LANCZOS).save(target, optimize=True)


manifest = {}
for cat, cfg in CATS.items():
    square_icon(src / cfg['icon'], icons / f'cat-{cat}.png')
    sprites = {}
    for i, pose in enumerate(POSES, 1):
        im = Image.open(src / cfg['poses'] / f'{i:02d}-{pose}.png').convert('RGBA')
        ex = eye_x(im, cfg['iris'])
        box = im.getbbox()
        im = im.crop(box)
        k = OUTPUT_SCALE * cfg['scale'].get(pose, 1)
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        if ex is None:  # eyes closed: the head sits at the front of the body
            ax = im.width * 0.86
        else:
            ax = (ex - box[0]) * k
        name = f'{cat}-{pose}.webp'
        im.save(out / name, lossless=False, quality=88, method=6)
        sprites[pose] = {'src': name, 'w': im.width, 'h': im.height, 'ax': round(ax, 1)}
    manifest[cat] = sprites
(out / 'sprites.json').write_text(json.dumps(manifest, indent=1))
print('Prepared', ', '.join(manifest), 'with', len(POSES), 'poses each')
