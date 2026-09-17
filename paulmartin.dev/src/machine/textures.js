// Optimized machine textures imported through Vite, so each gets a content hash
// and the URL warmed here is the exact one the CSS image-set() paints. Warming
// decodes them ahead of need: the background before the opening reveal, and the
// stone under faces II-V right after, so a turn paints the incoming face from
// cache instead of decoding a fresh texture mid-spin (which showed a hole
// straight through the drum on slower phones).
import ruinsBgAvif from './assets/ruins-bg.avif'
import ruinsBgWebp from './assets/ruins-bg.webp'
import face1Avif from './assets/face1.avif'
import face1Webp from './assets/face1.webp'
import stone02Avif from './assets/stone_face_02.avif'
import stone02Webp from './assets/stone_face_02.webp'
import bg03Avif from './assets/background_face_03.avif'
import bg03Webp from './assets/background_face_03.webp'
import stone04Avif from './assets/stone_face_04.avif'
import stone04Webp from './assets/stone_face_04.webp'
import stone05Avif from './assets/stone_face_05.avif'
import stone05Webp from './assets/stone_face_05.webp'

const pair = (avif, webp) => ({ avif, webp })

// Reveal-critical: the scene background (gates the opening reveal) and Face I's
// stone (the face held through the hold), both wanted painted before reveal.
export const REVEAL_TEXTURES = [
  pair(ruinsBgAvif, ruinsBgWebp),
  pair(face1Avif, face1Webp),
]

// The stone under faces II-V, warmed after the reveal so it never decodes on a
// turn. Face I is already covered by REVEAL_TEXTURES.
export const REST_FACE_TEXTURES = [
  pair(stone02Avif, stone02Webp),
  pair(bg03Avif, bg03Webp),
  pair(stone04Avif, stone04Webp),
  pair(stone05Avif, stone05Webp),
]

// Decode one texture, preferring AVIF (what image-set() picks on AVIF-capable
// browsers) and falling back to WebP for the rest. Resolves, never rejects, so a
// warm-up can never stall the scene.
export function warmTexture({ avif, webp }) {
  if (typeof Image === 'undefined') return Promise.resolve()
  const decode = (src) => {
    const img = new Image()
    img.src = src
    return img.decode ? img.decode() : Promise.resolve()
  }
  return decode(avif).catch(() => decode(webp)).catch(() => {})
}

export function warmTextures(list) {
  return Promise.allSettled(list.map(warmTexture))
}
