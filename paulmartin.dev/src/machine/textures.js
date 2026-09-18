// Optimized machine textures imported through Vite, so each gets a content hash
// and the URL warmed here is the exact one the CSS image-set() / <img> paints.
// Warming decodes them ahead of need: the reveal-critical few before the opening
// reveal, and every other drum-surface texture right after (non-blocking), so a
// turn paints the incoming face and its decorations from cache instead of
// fetching them as the face swings in.
import ruinsBgAvif from './assets/ruins-bg.avif'
import ruinsBgWebp from './assets/ruins-bg.webp'
import ruinsFgAvif from './assets/ruins-fg.avif'
import ruinsFgWebp from './assets/ruins-fg.webp'
import face1Avif from './assets/face1.avif'
import face1Webp from './assets/face1.webp'
import face1CarveWebp from './assets/face1-carve-stone.webp'
import leavesMoveAvif from './assets/leaves_moveable.avif'
import leavesMoveWebp from './assets/leaves_moveable.webp'
import stone02Avif from './assets/stone_face_02.avif'
import stone02Webp from './assets/stone_face_02.webp'
import bg03Avif from './assets/background_face_03.avif'
import bg03Webp from './assets/background_face_03.webp'
import stone04Avif from './assets/stone_face_04.avif'
import stone04Webp from './assets/stone_face_04.webp'
import stone05Avif from './assets/stone_face_05.avif'
import stone05Webp from './assets/stone_face_05.webp'
import leaves03Avif from './assets/leaves_face_03.avif'
import leaves03Webp from './assets/leaves_face_03.webp'
import capFaceAvif from './assets/cap_face_05.avif'
import capFaceWebp from './assets/cap_face_05.webp'
import capUndersideAvif from './assets/cap_underside_05.avif'
import capUndersideWebp from './assets/cap_underside_05.webp'
import holderLeftAvif from './assets/holder_left.avif'
import holderLeftWebp from './assets/holder_left.webp'
import holderRightAvif from './assets/holder_right.avif'
import holderRightWebp from './assets/holder_right.webp'
import backStone1 from './assets/back_stone_1.webp'
import backStone2 from './assets/back_stone_2.webp'
import backStone3 from './assets/back_stone_3.webp'
import tile01 from './assets/tile_01.webp'
import tile02 from './assets/tile_02.webp'
import tile03 from './assets/tile_03.webp'
import tile04 from './assets/tile_04.webp'
import tile05 from './assets/tile_05.webp'
import buttonLeft from './assets/button_left.webp'
import buttonUp from './assets/button_up.webp'
import buttonRight from './assets/button_right.webp'
import buttonDown from './assets/button_down.webp'

const pair = (avif, webp) => ({ avif, webp })

// Reveal-critical: the scene background (gates the reveal), Face I's stone, and
// its carve source, so the opening face shows up whole and already carved.
export const REVEAL_TEXTURES = [
  pair(ruinsBgAvif, ruinsBgWebp),
  pair(face1Avif, face1Webp),
  face1CarveWebp,
  pair(leavesMoveAvif, leavesMoveWebp),
]

// Every other drum-surface texture: the stone under faces II-V and the
// decorations painted on them (foliage, tray/reel tiles, lid caps, back-stones,
// keypad buttons) plus the foreground and holders. Warmed right after the reveal,
// fire-and-forget, so nothing loads late as a face swings in. Small enough that
// warming them all costs little; a face texture is 11-35 KB, a decoration a few KB.
export const SECONDARY_TEXTURES = [
  pair(stone02Avif, stone02Webp),
  pair(bg03Avif, bg03Webp),
  pair(stone04Avif, stone04Webp),
  pair(stone05Avif, stone05Webp),
  pair(leaves03Avif, leaves03Webp),
  pair(capFaceAvif, capFaceWebp),
  pair(capUndersideAvif, capUndersideWebp),
  pair(ruinsFgAvif, ruinsFgWebp),
  pair(holderLeftAvif, holderLeftWebp),
  pair(holderRightAvif, holderRightWebp),
  backStone1,
  backStone2,
  backStone3,
  tile01,
  tile02,
  tile03,
  tile04,
  tile05,
  buttonLeft,
  buttonUp,
  buttonRight,
  buttonDown,
]

// Decode one texture. A {avif, webp} pair prefers AVIF (what image-set() picks on
// AVIF-capable browsers) and falls back to WebP; a bare string is a single-format
// asset. Resolves, never rejects, so a warm-up can never stall the scene.
export function warmTexture(entry) {
  if (typeof Image === 'undefined') return Promise.resolve()
  const decode = (src) => {
    const img = new Image()
    img.src = src
    return img.decode ? img.decode() : Promise.resolve()
  }
  if (typeof entry === 'string') return decode(entry).catch(() => {})
  return decode(entry.avif).catch(() => decode(entry.webp)).catch(() => {})
}

export function warmTextures(list) {
  return Promise.allSettled(list.map(warmTexture))
}
