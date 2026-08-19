import { useEffect, useRef } from 'react'
import { nebulaColor } from '../shimmer'

// An EXTERIOR-ONLY outline of the name, coloured with the nebula palette as a vertical
// blue -> violet gradient that drifts slowly. A plain strokeText would trace every contour
// (letter counters, the t crossbar); instead we flood-fill the exterior so the letters read as
// solid silhouettes, then draw the band just OUTSIDE that silhouette — so only the outer edge is
// outlined. aria-hidden; the real text stays in the target for accessibility.
export default function NameShimmer({ targetRef, text, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const cv = ref.current
    const target = targetRef.current
    if (!cv || !target) return
    const ctx = cv.getContext('2d')
    const mask = document.createElement('canvas'), mctx = mask.getContext('2d')
    const sil = document.createElement('canvas'), sctx = sil.getContext('2d')
    const band = document.createElement('canvas'), bctx = band.getContext('2d')
    const cnt = document.createElement('canvas'), cntx = cnt.getContext('2d')
    const cband = document.createElement('canvas'), cbctx = cband.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // border opacity, overridable live with ?border=<0..1> (case-insensitive)
    let bOpacity = 0.4
    for (const [k, v] of new URLSearchParams(window.location.search)) {
      if (k.toLowerCase() === 'border') {
        const n = +v
        if (v !== '' && !Number.isNaN(n)) bOpacity = Math.max(0, Math.min(1, n))
      }
    }

    let W = 0, H = 0, raf = 0

    const build = () => {
      const cs = getComputedStyle(target)
      const fs = parseFloat(cs.fontSize) || 64
      const weight = cs.fontWeight || '800'
      const family = cs.fontFamily || 'sans-serif'
      const ls = cs.letterSpacing
      const DPR = Math.min(window.devicePixelRatio || 1, 2)
      const nameW = target.offsetWidth
      const nameH = target.offsetHeight
      if (!nameW || !nameH) return
      const lineW = Math.max(1.3, fs * 0.016) // outline thickness (css px)
      const PAD = Math.ceil(lineW) + 4        // guarantee a clear exterior border to flood from
      W = nameW + PAD * 2
      H = nameH + PAD * 2
      for (const c of [cv, mask, sil, band, cnt, cband]) { c.width = W * DPR; c.height = H * DPR }
      cv.style.width = W + 'px'
      cv.style.height = H + 'px'
      cv.style.left = -PAD + 'px'
      cv.style.top = -PAD + 'px'
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)

      // 1) filled text into the mask
      mctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      mctx.clearRect(0, 0, W, H)
      mctx.fillStyle = '#fff'
      mctx.font = `${weight} ${fs}px ${family}`
      if (ls && ls !== 'normal') mctx.letterSpacing = ls
      mctx.textAlign = 'center'
      mctx.textBaseline = 'alphabetic'
      const m = mctx.measureText(text)
      const asc = m.actualBoundingBoxAscent || fs * 0.72
      const desc = m.actualBoundingBoxDescent || fs * 0.2
      mctx.fillText(text, W / 2, H / 2 + (asc - desc) / 2)

      // 2) flood-fill the exterior (non-ink reachable from the border); everything else is the
      //    solid silhouette (glyph bodies AND their enclosed counters)
      const sw = W * DPR, sh = H * DPR
      const d = mctx.getImageData(0, 0, sw, sh).data
      const ink = (i) => d[i * 4 + 3] > 128
      const ext = new Uint8Array(sw * sh)
      const stack = []
      const seed = (x, y) => {
        const i = y * sw + x
        if (!ext[i] && !ink(i)) { ext[i] = 1; stack.push(i) }
      }
      for (let x = 0; x < sw; x++) { seed(x, 0); seed(x, sh - 1) }
      for (let y = 0; y < sh; y++) { seed(0, y); seed(sw - 1, y) }
      while (stack.length) {
        const i = stack.pop(), x = i % sw, y = (i / sw) | 0
        if (x > 0) seed(x - 1, y)
        if (x < sw - 1) seed(x + 1, y)
        if (y > 0) seed(x, y - 1)
        if (y < sh - 1) seed(x, y + 1)
      }
      // silhouette = NOT exterior; counters = the enclosed non-ink regions (holes in P, a, ...)
      const simg = mctx.createImageData(sw, sh)
      const cimg = mctx.createImageData(sw, sh)
      const sd = simg.data, cd = cimg.data
      for (let i = 0; i < sw * sh; i++) {
        if (!ext[i]) { sd[i * 4] = sd[i * 4 + 1] = sd[i * 4 + 2] = sd[i * 4 + 3] = 255 }
        if (!ext[i] && d[i * 4 + 3] <= 128) { cd[i * 4] = cd[i * 4 + 1] = cd[i * 4 + 2] = cd[i * 4 + 3] = 255 }
      }
      sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, sw, sh); sctx.putImageData(simg, 0, 0)
      cntx.setTransform(1, 0, 0, 1, 0, 0); cntx.clearRect(0, 0, sw, sh); cntx.putImageData(cimg, 0, 0)

      // 3) a ring = dilate(shape) minus shape. Around the silhouette it gives the exterior
      //    outline; around each counter it gives the hole's outline. No stroke-junction doubling.
      const r = lineW * DPR
      const ringBand = (dst, src) => {
        dst.setTransform(1, 0, 0, 1, 0, 0)
        dst.clearRect(0, 0, sw, sh)
        for (const rr of [r, r * 0.6]) {
          for (let a = 0; a < 16; a++) {
            const ang = (a / 16) * Math.PI * 2
            dst.drawImage(src, Math.cos(ang) * rr, Math.sin(ang) * rr)
          }
        }
        dst.globalCompositeOperation = 'destination-out'
        dst.drawImage(src, 0, 0)
        dst.globalCompositeOperation = 'source-over'
      }
      ringBand(bctx, sil)         // exterior outline
      ringBand(cbctx, cnt)        // counter (hole) outlines
      bctx.drawImage(cband, 0, 0) // combine both into `band`
    }

    const draw = (now) => {
      ctx.clearRect(0, 0, W, H)
      const t = reduce ? 0 : now * 0.0004
      const g = ctx.createLinearGradient(0, 0, 0, H) // vertical
      const STOPS = 8
      for (let s = 0; s <= STOPS; s++) {
        const pos = s / STOPS
        const gg = 0.5 + 0.5 * Math.sin(pos * Math.PI * 1.2 - t)
        // held to blue -> violet (no magenta), so it never reads pink at the ends
        g.addColorStop(pos, nebulaColor(0.05 + 0.62 * gg, bOpacity, { sat: 82, li: 64 }))
      }
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'destination-in'
      ctx.drawImage(band, 0, 0, W, H)
      ctx.globalCompositeOperation = 'source-over'
      if (!reduce) raf = requestAnimationFrame(draw)
    }

    const start = () => {
      build()
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(draw)
    }
    if (document.fonts && document.fonts.status !== 'loaded') {
      document.fonts.ready.then(start).catch(start)
    } else {
      start()
    }
    const ro = new ResizeObserver(start)
    ro.observe(target)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [text])

  return <canvas ref={ref} className={`name-shimmer ${className}`.trim()} aria-hidden="true" />
}
