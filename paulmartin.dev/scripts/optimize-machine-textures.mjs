// One-shot texture optimizer for the machine landing.
//
// Reads the authored PNGs in public/machine and writes AVIF+WebP (or WebP-only
// for the luminance-sensitive carve source and the small UI sprites) into
// src/machine/assets, where they are imported through Vite so they are
// content-hashed and only the referenced files ship.
//
// Run: node scripts/optimize-machine-textures.mjs
// Requires python3 with Pillow (AVIF + WebP support).

import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

// CSS-background textures: AVIF (primary) + WebP (fallback), picked by the
// browser via image-set(). [source, outBase, targetWidth]
const DUAL = [
  ['ruins-bg.png', 'ruins-bg', 1920],
  ['ruins-fg.png', 'ruins-fg', 1920],
  ['face1.png', 'face1', 1280],
  ['leaves_moveable.png', 'leaves_moveable', 230],
  ['stone_face_02.png', 'stone_face_02', 1280],
  ['background_face_03.png', 'background_face_03', 1280],
  ['stone_face_04.png', 'stone_face_04', 1280],
  ['stone_face_05.png', 'stone_face_05', 1280],
  ['leaves_face_03.png', 'leaves_face_03', 1280],
  ['cap_face_05.png', 'cap_face_05', 1280],
  ['cap_underside_05.png', 'cap_underside_05', 1280],
  ['holder_left.png', 'holder_left', 362],
  ['holder_right.png', 'holder_right', 362],
]

// Single-format WebP: SVG <image href> and JSX string refs can't negotiate
// formats. [source, outBase, targetWidth, quality]
const WEBP_ONLY = [
  // Face I carve source: sunk into the name by a per-channel brightness
  // subtraction, so keep it high quality and full resolution.
  ['face1.png', 'face1-carve-stone', 1820, 90],
  ['back_stone_1.png', 'back_stone_1', 460, 82],
  ['back_stone_2.png', 'back_stone_2', 460, 82],
  ['back_stone_3.png', 'back_stone_3', 460, 82],
  ['tile_01.png', 'tile_01', 422, 82],
  ['tile_02.png', 'tile_02', 422, 82],
  ['tile_03.png', 'tile_03', 422, 82],
  ['tile_04.png', 'tile_04', 422, 82],
  ['tile_05.png', 'tile_05', 422, 82],
  ['button_left.png', 'button_left', 114, 85],
  ['button_up.png', 'button_up', 114, 85],
  ['button_right.png', 'button_right', 114, 85],
  ['button_down.png', 'button_down', 114, 85],
]

const py = `
import sys, os
from PIL import Image

src_dir = ${JSON.stringify(resolve(root, 'public/machine'))}
out_dir = ${JSON.stringify(resolve(root, 'src/machine/assets'))}
os.makedirs(out_dir, exist_ok=True)

dual = ${JSON.stringify(DUAL)}
webp_only = ${JSON.stringify(WEBP_ONLY)}

def load(name, target_w):
    im = Image.open(os.path.join(src_dir, name))
    if im.width > target_w:
        h = round(im.height * target_w / im.width)
        im = im.resize((target_w, h), Image.LANCZOS)
    return im

def sz(p):
    return f"{os.path.getsize(p)//1024}KB"

for name, base, w in dual:
    im = load(name, w)
    avif = os.path.join(out_dir, base + '.avif')
    webp = os.path.join(out_dir, base + '.webp')
    im.save(avif, format='AVIF', quality=50)
    im.save(webp, format='WEBP', quality=80, method=6)
    print(f"{name:34s} {im.width}x{im.height:4d}  avif {sz(avif):>7s}  webp {sz(webp):>7s}")

for name, base, w, q in webp_only:
    im = load(name, w)
    webp = os.path.join(out_dir, base + '.webp')
    im.save(webp, format='WEBP', quality=q, method=6)
    print(f"{name:34s} {im.width}x{im.height:4d}  webp {sz(webp):>7s}  (q{q})")
`

execFileSync('python3', ['-c', py], { stdio: 'inherit' })
