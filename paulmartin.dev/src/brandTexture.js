// The maze's own look, baked into a strip that the brand multiplies into its letterforms.
//
// MazeBackground draws walls as scattered 1-3px flecks and then tints them through
// spectrumStop, which sweeps blue(192) - purple(268) - pink(344). Reproducing both here,
// rather than approximating with a CSS gradient, is what makes the highlighted letters read
// as the maze showing through rather than as coloured text.

// same curve MazeBackground uses, so the hues match the shimmer exactly
const spectrumHue = (t) => {
  const raw = Math.sin(2 * Math.PI * t)
  const shaped = Math.sign(raw) * Math.pow(Math.abs(raw), 1.5)
  return 268 + 76 * shaped
}

// Starts at the sine trough (blue) and runs CYCLES half-sweeps from there. A single
// half-sweep across the whole wordmark leaves each letter sampling a slice too narrow to
// vary, so every letter comes out one flat colour. Running several means one letter spans a
// real span of hue and carries a gradient of its own, while sitting at a different point of
// the spectrum from its neighbours.
const CYCLES = 3.1
const hueAtX = (u) => spectrumHue(0.75 + u * 0.5 * CYCLES)

// The strip is multiplied into the letter rather than drawn over it, so it needs no fade at
// the ".dev" end: multiplying against that letter's darker grey mutes it on its own, and by
// exactly the ratio the two text colours differ by.
export function makeBrandTexture({ w = 480, h = 90, density = 9 } = {}) {
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  const c = cv.getContext('2d')

  // A wash under the flecks: it carries the letterform while the flecks carry the shimmer.
  // Flecks alone leave the glyph too sparse to read at brand size.
  const wash = c.createLinearGradient(0, 0, w, 0)
  const STOPS = 48
  for (let s = 0; s <= STOPS; s++) {
    const hue = hueAtX(s / STOPS)
    const li = 46 + ((hue - 192) / 152) * 5
    wash.addColorStop(s / STOPS, `hsla(${hue.toFixed(1)},100%,${li.toFixed(1)}%,0.94)`)
  }
  c.fillStyle = wash
  c.fillRect(0, 0, w, h)

  const n = Math.round((w * h) / density)
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w
    const y = Math.random() * h
    const hue = hueAtX(x / w)
    const li = 50 + ((hue - 192) / 152) * 5
    const a = 0.45 + Math.random() * 0.55
    const sz = Math.random() < 0.16 ? 3 : Math.random() < 0.5 ? 2 : 1
    c.fillStyle = `hsla(${hue.toFixed(1)},100%,${li.toFixed(1)}%,${a.toFixed(3)})`
    c.fillRect(x, y, sz, sz)
  }

  return cv.toDataURL('image/png')
}
