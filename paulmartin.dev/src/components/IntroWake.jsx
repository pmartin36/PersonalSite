import { useEffect, useRef, useState } from 'react'

// "Wake" intro (ported from plans/intro-prototype.html, Wake style only): on a #030304 field
// the name emerges as a turbulent wake of dim iridescent sequins, a second wake smooths them
// into dim metal, then it shrinks up ONTO the real header brand and brightens to a soft gray.
//
// Mounted over the Landing on a normal visit as a TRANSPARENT canvas — the maze background
// shows and stays interactive underneath (the real brand is hidden until handoff). The parent
// gates it (skips on ?from=ulmartin / reduced-motion). At T_DONE it calls onReveal (parent
// shows the real brand + arms the content cascade), fades the canvas out, then calls onDone.
export default function IntroWake({ onReveal, onDone }) {
  const canvasRef = useRef(null)
  const [hide, setHide] = useState(false)
  const cbRef = useRef({ onReveal, onDone })
  cbRef.current = { onReveal, onDone }

  useEffect(() => {
    const cv = canvasRef.current, ctx = cv.getContext('2d')
    const mk = () => document.createElement('canvas')
    const tmask = mk(), tctx = tmask.getContext('2d')   // white name (letter mask + ink sampling)
    const buf = mk(), bctx = buf.getContext('2d')       // letter composite (clipped to letters)
    const sc = mk(), scctx = sc.getContext('2d')        // polish-coverage mask
    const pol = mk(), polctx = pol.getContext('2d')     // polished-metal layer

    const NAME = 'Paul Martin'
    let W, H, DPR, hero, cx, cy, tw
    let bx, by, bw, bh, originY
    let pts = [], beads = [], blob = null, metalSrc = null, grayAmt = 0
    // settle target — measured from the real header brand
    let brandCx = 0, brandCy = 42, brandPx = 27, brandWeight = '800', brandFamily = 'system-ui, sans-serif', brandColor = '#f1f1f4', brandLSem = 0
    let t0 = performance.now(), rafId = 0, revealed = false

    // --- timeline ---
    const HOLD1 = 250, DEVELOP = 4200, T_DEV = HOLD1 // short black beat, then the wake starts
    const T_SHRINK = T_DEV + Math.round(DEVELOP * 0.53) + 200
    const SHRINK = 1050, T_DONE = T_SHRINK + SHRINK

    const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t)
    const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
    const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t) }
    const hueAt = (u) => 200 + u * 140 // deep blue -> ... -> magenta/pink
    const hcss = (h) => (((h % 360) + 360) % 360)
    const NHUE = 24
    // match the real brand's font so the shrink lands seamlessly (falls back until measured)
    const font = (px) => `${brandWeight} ${px}px ${brandFamily}`

    function makeBead(hue, sat, li) {
      const D = 16, c = mk(); c.width = D; c.height = D; const g = c.getContext('2d')
      const r = D * 0.46, h = hcss(hue)
      const grd = g.createRadialGradient(D * 0.40, D * 0.34, r * 0.08, D * 0.5, D * 0.54, r)
      grd.addColorStop(0, `hsl(${h}, ${Math.max(0, sat - 28)}%, ${Math.min(96, li + 40)}%)`)
      grd.addColorStop(0.5, `hsl(${h}, ${sat}%, ${li}%)`)
      grd.addColorStop(1, `hsl(${h}, ${Math.min(100, sat + 12)}%, ${Math.max(5, li - 26)}%)`)
      g.fillStyle = grd; g.beginPath(); g.arc(D / 2, D / 2, r, 0, 6.2832); g.fill()
      return c
    }

    function measureBrand() {
      const el = document.querySelector('.site-header .brand')
      if (!el) return
      const r = el.getBoundingClientRect()
      if (r.width > 0) { brandCx = r.left + r.width / 2; brandCy = r.top + r.height / 2 }
      const cs = getComputedStyle(el)
      brandPx = parseFloat(cs.fontSize) || 27
      brandWeight = cs.fontWeight || '800'
      brandFamily = cs.fontFamily || 'system-ui, sans-serif'
      brandColor = cs.color || brandColor
      const ls = cs.letterSpacing // normalise to an em ratio so it scales with the draw size
      brandLSem = ls && ls !== 'normal' ? parseFloat(ls) / brandPx : 0
    }

    function layout() {
      measureBrand()
      DPR = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth; H = window.innerHeight
      for (const c of [cv, tmask, buf, sc, pol]) { c.width = W * DPR; c.height = H * DPR }
      cv.style.width = W + 'px'; cv.style.height = H + 'px'
      for (const c of [ctx, tctx, bctx, scctx, polctx]) c.setTransform(DPR, 0, 0, DPR, 0, 0)

      hero = Math.min(W * 0.11, 132); cx = W / 2; cy = H / 2
      const LS = (brandLSem * hero).toFixed(3) + 'px' // brand letter-spacing at draw scale
      ctx.font = font(hero); ctx.letterSpacing = LS; tw = ctx.measureText(NAME).width
      bx = cx - tw / 2; bw = tw; bh = hero * 1.5; by = cy - bh / 2

      tctx.clearRect(0, 0, W, H)
      tctx.font = font(hero); tctx.letterSpacing = LS; tctx.textAlign = 'center'; tctx.textBaseline = 'middle'
      tctx.fillStyle = '#fff'; tctx.fillText(NAME, cx, cy)
      const sw = W * DPR, d = tctx.getImageData(0, 0, sw, H * DPR).data
      const inkAt = (x, y) => {
        const px = (x * DPR) | 0, py = (y * DPR) | 0
        if (px < 0 || py < 0 || px >= sw) return 0
        return d[(py * sw + px) * 4 + 3]
      }

      let minY = 1e9, maxY = -1e9, sumY = 0, cnt = 0
      for (let y = by | 0; y < (by + bh) | 0; y += 2)
        for (let x = bx - 2; x < bx + bw + 2; x += 2)
          if (inkAt(x, y) > 130) { if (y < minY) minY = y; if (y > maxY) maxY = y; sumY += y; cnt++ }
      originY = cnt ? sumY / cnt : cy

      beads = []
      for (let i = 0; i < NHUE; i++) beads.push(makeBead(hueAt(i / (NHUE - 1)), 52, 54))
      { const D = 32; blob = mk(); blob.width = D; blob.height = D; const g = blob.getContext('2d')
        const gr = g.createRadialGradient(D / 2, D / 2, 0, D / 2, D / 2, D / 2)
        gr.addColorStop(0, '#fff'); gr.addColorStop(0.72, 'rgba(255,255,255,0.98)'); gr.addColorStop(1, 'rgba(255,255,255,0)')
        g.fillStyle = gr; g.beginPath(); g.arc(D / 2, D / 2, D / 2, 0, 6.2832); g.fill() }

      const SS = Math.max(3.0, hero * 0.028)
      pts = []
      for (let y = by; y <= by + bh; y += SS)
        for (let x = bx - SS; x <= bx + bw + SS; x += SS) {
          if (inkAt(x, y) <= 120) continue
          const jx = x + (Math.random() - 0.5) * SS * 0.8
          const jy = y + (Math.random() - 0.5) * SS * 0.8
          const u = clamp01((jx - bx) / bw)
          const hi = Math.max(0, Math.min(NHUE - 1, Math.round((u + (Math.random() - 0.5) * 0.13) * (NHUE - 1))))
          const d = SS * (1.3 + Math.random() * 0.7)
          const ph = Math.random() * 6.2832, sp = 0.6 + Math.random() * 0.9, bf = 0.6 + Math.random() * 0.4
          const appear = Math.random(), big = Math.random() < 0.10
          // per-point constants (depend only on static jx/jy) — precomputed once, read every frame
          const turb = Math.sin(jx * 0.055 + jy * 0.100 + 1.3)
            + 0.7 * Math.sin(jx * 0.130 - jy * 0.045 + 4.2)
            + 0.5 * Math.sin(jy * 0.170 - jx * 0.022)
          pts.push({ x: jx, y: jy, hi, ph, sp, bf, appear, big,
            turb26: turb * 2.6,                          // band phase offset: age*30 + turb*2.6
            foamPhase: jx * 0.08 - jy * 0.06 + turb * 1.5, // foam base phase (+ wc*0.0012 live)
            wxPhase: jy * 0.06, wyPhase: jx * 0.05,        // wobble base phases (+ wc term live)
            dd: d * (big ? 1.2 : 0.88) })                  // bead draw size
        }

      // Wake reveal timing: a drifting source throws off ripples; each sequin's reveal time is the
      // earliest a ripple reaches it. Level sets of this field form the wake's curved arcs.
      const NS = 60, pad = hero * 0.35
      const pathX = (u) => (bx - pad) + u * (bw + 2 * pad)
      const pathY = (u) => originY + Math.sin(u * Math.PI * 1.1 + 0.4) * hero * 0.55
      const C = bw * 0.45
      let rtMax = 1e-6
      for (const s of pts) {
        let best = 1e9
        for (let k = 0; k <= NS; k++) {
          const u = k / NS, t = u + Math.hypot(s.x - pathX(u), s.y - pathY(u)) / C
          if (t < best) best = t
        }
        s.rt = best; if (best > rtMax) rtMax = best
      }
      for (const s of pts) s.rt /= rtMax

      // pre-render the "polished" surface: solid iridescent base + blurred sequins added on top
      const sharp = mk(); sharp.width = W * DPR; sharp.height = H * DPR
      const shc = sharp.getContext('2d'); shc.setTransform(DPR, 0, 0, DPR, 0, 0)
      const mr = SS * 1.4
      for (const s of pts) shc.drawImage(beads[s.hi], s.x - mr, s.y - mr, mr * 2, mr * 2)
      metalSrc = mk(); metalSrc.width = W * DPR; metalSrc.height = H * DPR
      const mc = metalSrc.getContext('2d'); mc.setTransform(DPR, 0, 0, DPR, 0, 0)
      const hgm = mc.createLinearGradient(bx, 0, bx + bw, 0)
      for (let k = 0; k <= 12; k++) { const u = k / 12; hgm.addColorStop(u, `hsl(${hcss(hueAt(u))}, 28%, 16%)`) }
      mc.fillStyle = hgm; mc.fillRect(bx - 8, by - 6, bw + 16, bh + 12)
      mc.globalCompositeOperation = 'lighter'; mc.globalAlpha = 0.12
      mc.filter = `blur(${Math.round(hero * 0.05 * DPR)}px)`
      mc.setTransform(1, 0, 0, 1, 0, 0); mc.drawImage(sharp, 0, 0); mc.setTransform(DPR, 0, 0, DPR, 0, 0)
      mc.filter = 'none'; mc.globalAlpha = 1; mc.globalCompositeOperation = 'source-over'
    }

    function clipAndBlit(g) {
      bctx.globalCompositeOperation = 'destination-in'
      bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.drawImage(tmask, 0, 0); bctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      bctx.globalCompositeOperation = 'source-over'
      g.drawImage(buf, 0, 0, W * DPR, H * DPR, 0, 0, W, H)
    }

    function paintWake(g, te, wc) {
      const p = clamp01(te / DEVELOP)
      const rp1 = 1.14 * easeIO(clamp01(p / 0.42))
      const rp2 = 1.14 * easeIO(clamp01((p - 0.17) / 0.42))
      const softP = 0.06, softP2 = 0.11
      const br = Math.max(3, hero * 0.028) * 1.9

      bctx.clearRect(bx - 8, by - 8, bw + 16, bh + 16)
      scctx.clearRect(bx - 8, by - 8, bw + 16, bh + 16)
      for (let i = 0; i < pts.length; i++) {
        const s = pts[i]
        const age = rp1 - s.rt + (s.appear - 0.5) * softP * 0.5
        if (age <= -softP) continue
        const rv = smooth(age / softP)
        if (rv <= 0.01) continue
        const polish = smooth((rp2 - s.rt) / softP2)

        if (polish < 0.985) {
          const band = Math.max(0, Math.cos(age * 30 + s.turb26)) * Math.max(0, 1 - age / 0.55)
          const foam = 0.30 + 0.70 * (0.5 + 0.5 * Math.sin(s.foamPhase + wc * 0.0012)) * s.bf
          const crest = band * band * foam
          const twk = 0.7 + 0.3 * Math.sin(wc * 0.003 * s.sp + s.ph)
          const a = rv * (s.big ? 0.28 : 0.14) * (1 + 3.6 * crest) * twk * (1 - polish)
          if (a > 0.008) {
            const wx = 2.6 * Math.sin(s.wxPhase + wc * 0.0021), wy = 1.8 * Math.sin(s.wyPhase - wc * 0.0017)
            const dd = s.dd
            bctx.globalAlpha = Math.min(0.8, a)
            bctx.drawImage(beads[s.hi], s.x + wx - dd / 2, s.y + wy - dd / 2, dd, dd)
          }
        }
        if (polish > 0.02) { scctx.globalAlpha = polish; scctx.drawImage(blob, s.x - br, s.y - br, br * 2, br * 2) }
      }
      bctx.globalAlpha = 1; scctx.globalAlpha = 1

      polctx.globalCompositeOperation = 'source-over'
      polctx.clearRect(bx - 8, by - 8, bw + 16, bh + 16)
      polctx.drawImage(metalSrc, 0, 0, W * DPR, H * DPR, 0, 0, W, H)
      polctx.globalCompositeOperation = 'destination-in'
      polctx.drawImage(sc, 0, 0, W * DPR, H * DPR, 0, 0, W, H)
      polctx.globalCompositeOperation = 'source-over'
      bctx.drawImage(pol, 0, 0, W * DPR, H * DPR, 0, 0, W, H)
      if (grayAmt > 0) {
        bctx.globalAlpha = grayAmt; bctx.fillStyle = '#d9dbe1'
        bctx.fillRect(bx - 8, by - 8, bw + 16, bh + 16); bctx.globalAlpha = 1
      }
      clipAndBlit(g)
    }

    function frame(now) {
      const e = now - t0
      ctx.clearRect(0, 0, W, H)

      const te = Math.max(0, Math.min(DEVELOP, e - T_DEV))
      const wc = Math.min(e, T_SHRINK) - T_DEV

      let S = 1, tx = cx, ty = cy; grayAmt = 0
      if (e >= T_SHRINK) {
        const sp = Math.min(1, (e - T_SHRINK) / SHRINK), pp = easeIO(sp)
        const targetS = brandPx / hero
        S = 1 + (targetS - 1) * pp
        tx = cx + (brandCx - cx) * pp; ty = cy + (brandCy - cy) * pp
        grayAmt = smooth(clamp01((sp - 0.25) / 0.62)) // hold, then brighten to gray ~25% into the shrink
      }
      ctx.save()
      if (S !== 1 || tx !== cx || ty !== cy) { ctx.translate(tx, ty); ctx.scale(S, S); ctx.translate(-cx, -cy) }
      paintWake(ctx, te, wc)
      // As it settles, fade in the name as CRISP native text (drawn under the same transform, so
      // it's sharp at the final size) in the brand's exact colour. This lands the canvas name
      // pixel-matched to the real brand, so the handoff crossfade is seamless (no soft->crisp pop).
      if (grayAmt > 0.001) {
        ctx.globalAlpha = grayAmt
        ctx.fillStyle = brandColor
        ctx.font = font(hero); ctx.letterSpacing = (brandLSem * hero).toFixed(3) + 'px'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(NAME, cx, cy)
        ctx.globalAlpha = 1
      }
      ctx.restore()
      ctx.globalAlpha = 1

      if (!revealed && e >= T_DONE) {
        revealed = true
        if (cbRef.current.onReveal) cbRef.current.onReveal() // real brand + content appear underneath
        setHide(true)                                        // fade this opaque layer out
      }
      rafId = requestAnimationFrame(frame)
    }

    const resize = () => layout()
    window.addEventListener('resize', resize)
    layout()
    // if the brand webfont isn't ready yet, re-layout once it is (during the black hold, invisible)
    if (document.fonts && document.fonts.status !== 'loaded') {
      document.fonts.ready.then(() => { layout(); t0 = performance.now() }).catch(() => {})
    }
    rafId = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`intro-wake${hide ? ' intro-wake--hide' : ''}`}
      aria-hidden="true"
      onTransitionEnd={() => { if (hide && cbRef.current.onDone) cbRef.current.onDone() }}
    />
  )
}
