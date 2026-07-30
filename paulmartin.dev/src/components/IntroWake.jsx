import { useEffect, useRef, useState } from 'react'
import { makeScheduler, FREEZE_MS } from '../devClock'

// Intro: the name forms out of fine iridescent sequins, left to right, and a second wave chases
// the first — each part of the name comes apart shortly after it forms, sliding gently until it
// is gone. The dots that slide away are the maze's dots. The name is where the maze comes from.
//
// Two things that took a while to get right, both counter-intuitive:
//
// Nothing radiates. Every version that measured direction from a centre read as an explosion no
// matter how slow it ran, because arbitrary headings average out to net expansion and expansion
// is what the eye calls a blast. Motion here is the CURL of a smooth field — divergence-free,
// so neighbours shear past each other and separate locally while the group never inflates.
//
// The dots go PALE, not colourful. A maze fleck is rgba(246,247,255) and carries no colour of
// its own; the blue/purple/pink you see in the maze is a wake tinting it as it sweeps past. So
// a sequin loses its hue as it lets go and settles at the dim level the maze's dots rest at.
// Giving each dot its own hue makes the whole thing read as confetti.
//
// The dissolve front also feeds the maze's real wake through the same feedPointer() the mouse
// calls, so the genuine effect fires along the same line the name is coming apart on.
//
// Mounted over the Landing as a TRANSPARENT canvas; the maze shows and stays interactive
// underneath. The parent gates it (skips on ?from=ulmartin / reduced-motion). It calls onReveal
// (real brand + content cascade), fades the canvas out, then calls onDone.

// Override live with a lowercase query param, e.g. ?span=1.6&travel=0.35
const TUNE = {
  hold: 80,   // black beat before the name starts forming
  wipe: 800,  // time for the forming front to cross the NAME itself; the run is longer than
              // this by the tail the last dots need, so linger/span move the end rather than
              // speeding the front up
  reveal: 0,  // when brand + content come up, ms. 0 means "as the run ends"

  // Both waves are measured in FRONT UNITS — fractions of the name's width — because they hang
  // off the same travelling front. A dot forms when the front reaches it, holds for `linger`,
  // then slides and fades over `span`. Dispersal is a second wave chasing the first, so no two
  // parts of the name ever let go together; everything releasing at once is a burst however
  // slowly it moves. `linger` is the readability dial: higher keeps more of the name intact.
  linger: 0.5,
  span: 1.1,

  // Where a dot slides. Direction is the curl of a smooth field, so clumps shear past each
  // other without the group expanding. `travel` over `span` IS the slide speed: at 0.5 and 1.1
  // a dot covers ~45px over ~880ms, about 50px/s.
  clump: 1.0,
  travel: 0.5,
  noise: 0.5,   // radians of jitter on its heading, so a clump frays rather than moving rigid
  sag: 0.18,    // slight downward bias, in cap-heights: melting rather than only shearing
  meander: 0.5, // per-particle wander, in cap-heights. Kept near `travel`, or it outruns the
                // slide it is riding on and everything looks flicky

  // Turning from sequin into maze fleck: over this share of the slide, and settling to `rest`.
  pale: 0.35,
  rest: 0.22,

  // How the maze gets lit as the name comes apart.
  //   1 = a wake running along the dissolve front, one moving point on the centre line
  //   2 = a wavelet at each dot's own position as it goes, so the maze is seeded across the
  //       whole area the letters covered rather than along a single line
  feed: 2,
  seeds: 70,     // roughly how many dots seed the maze, spread evenly through the run
  seedat: 0.72,  // how far into a dot's slide it seeds, as a share of `span`
  gap: 26,       // px of front travel between wavelets, for feed=1 (the maze's SPAWN_DIST)

  density: 0.75, // particle spacing multiple; count goes as the inverse square
  wave: 0.045,   // bends the forming front along a smooth field so it is not a ruled line
  grain: 0.07,   // per-sequin scatter on that front
  bead: 3.0,     // brightness of a formed sequin
  wobble: 0.18,  // per-sequin jitter while it is still part of the name
  twinkle: 1.0,  // brightness flicker; moves nothing
  warp: 1.0,     // the maze's own Y-and-time horizontal sway, arriving as a dot lets go
}

const q = new URLSearchParams(window.location.search)
const T = { ...TUNE }
for (const k in T) { const v = q.get(k); if (v !== null && v !== '' && !Number.isNaN(+v)) T[k] = +v }
const DEV_TUNE = FREEZE_MS !== null || q.has('tune')

export default function IntroWake({ pointer, onReveal, onDone }) {
  const canvasRef = useRef(null)
  const [hide, setHide] = useState(false)
  const cbRef = useRef({ onReveal, onDone })
  cbRef.current = { onReveal, onDone }

  useEffect(() => {
    const cv = canvasRef.current, ctx = cv.getContext('2d')
    const mk = () => document.createElement('canvas')
    const tmask = mk(), tctx = tmask.getContext('2d') // white name, for sampling where the ink is

    const NAME = 'Paul Martin'
    let W, H, DPR, hero, cx, cy, tw
    let bx, by, bw, bh, CAP, lineY = 0
    let pts = [], beads = []
    let brandPx = 27, brandWeight = '800', brandFamily = 'system-ui, sans-serif', brandLSem = 0
    const sched = makeScheduler()
    let t0 = sched.t0(), revealed = false, hidden = false

    const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t)
    const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t) }
    const hueAt = (u) => 200 + u * 140 // deep blue -> ... -> magenta/pink, across the name
    const hcss = (h) => (((h % 360) + 360) % 360)
    const NHUE = 24
    const font = (px) => `${brandWeight} ${px}px ${brandFamily}`

    const SOFT = 0.06 // forming front width, in fractions of the name's width

    // --- timeline ---
    const HOLD1 = T.hold, WIPE = T.wipe
    // the front keeps going past the last sequin, long enough for it to wait out `linger` and
    // finish its `span` — otherwise the right-hand end never gets to come apart
    const REACH = 1 + T.linger + T.span + SOFT
    const T_END = HOLD1 + WIPE * REACH
    const T_REVEAL = T.reveal > 0 ? Math.min(T.reveal, T_END) : T_END

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
      const cs = getComputedStyle(el)
      brandPx = parseFloat(cs.fontSize) || 27
      brandWeight = cs.fontWeight || '800'
      brandFamily = cs.fontFamily || 'system-ui, sans-serif'
      const ls = cs.letterSpacing
      brandLSem = ls && ls !== 'normal' ? parseFloat(ls) / brandPx : 0
    }

    function layout() {
      measureBrand()
      DPR = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth; H = window.innerHeight
      for (const c of [cv, tmask]) { c.width = W * DPR; c.height = H * DPR }
      cv.style.width = W + 'px'; cv.style.height = H + 'px'
      for (const c of [ctx, tctx]) c.setTransform(DPR, 0, 0, DPR, 0, 0)

      // Size the hero from the NAME's own measured width rather than from the viewport
      // alone, so it fills a set share of the screen instead of a set fraction of the width.
      // A flat W * 0.11 left the name at 55% of a phone's width — the narrower the screen,
      // the more of it was margin. Measuring at a reference size and scaling means the
      // proportion holds whatever the font metrics are. The cap is what keeps big screens
      // where they were: above roughly 750px wide it binds and this has no effect.
      const NAME_SPAN = 0.88
      ctx.font = font(100); ctx.letterSpacing = (brandLSem * 100).toFixed(3) + 'px'
      const per100 = ctx.measureText(NAME).width / 100
      hero = Math.min(132, Math.max(W * 0.11, (W * NAME_SPAN) / per100))
      cx = W / 2; cy = H / 2
      const LS = (brandLSem * hero).toFixed(3) + 'px'
      ctx.font = font(hero); ctx.letterSpacing = LS; tw = ctx.measureText(NAME).width
      bx = cx - tw / 2; bw = tw; bh = hero * 1.5; by = cy - bh / 2

      tctx.clearRect(0, 0, W, H)
      tctx.font = font(hero); tctx.letterSpacing = LS; tctx.textAlign = 'center'; tctx.textBaseline = 'middle'
      tctx.fillStyle = '#fff'; tctx.fillText(NAME, cx, cy)
      const sw = W * DPR, data = tctx.getImageData(0, 0, sw, H * DPR).data
      const inkAt = (x, y) => {
        const px = (x * DPR) | 0, py = (y * DPR) | 0
        if (px < 0 || py < 0 || px >= sw) return 0
        return data[(py * sw + px) * 4 + 3]
      }

      let minY = 1e9, maxY = -1e9, sumY = 0, cnt = 0
      for (let y = by | 0; y < (by + bh) | 0; y += 2)
        for (let x = bx - 2; x < bx + bw + 2; x += 2)
          if (inkAt(x, y) > 130) { if (y < minY) minY = y; if (y > maxY) maxY = y; sumY += y; cnt++ }
      CAP = cnt ? maxY - minY : hero * 0.72
      lineY = cnt ? sumY / cnt : cy

      beads = []
      for (let i = 0; i < NHUE; i++) beads.push(makeBead(hueAt(i / (NHUE - 1)), 52, 54))

      const SS = Math.max(2.0, hero * 0.028 * T.density)
      pts = []
      for (let y = by; y <= by + bh; y += SS)
        for (let x = bx - SS; x <= bx + bw + SS; x += SS) {
          if (inkAt(x, y) <= 120) continue
          const jx = x + (Math.random() - 0.5) * SS * 0.8
          const jy = y + (Math.random() - 0.5) * SS * 0.8
          const u = clamp01((jx - bx) / bw)
          const hi = Math.max(0, Math.min(NHUE - 1, Math.round((u + (Math.random() - 0.5) * 0.13) * (NHUE - 1))))
          const d0 = SS * (1.3 + Math.random() * 0.7)

          // Reveal order: mostly the dot's own x, so the front sweeps left to right — bent
          // along a smooth field and scattered per dot, so the edge is ragged rather than a
          // ruled line. This is also its clock: everything it does keys off how far the front
          // has travelled past its own rt.
          const turb = Math.sin(jx * 0.055 + jy * 0.100 + 1.3)
            + 0.7 * Math.sin(jx * 0.130 - jy * 0.045 + 4.2)
            + 0.5 * Math.sin(jy * 0.170 - jx * 0.022)
          const rt = u + turb * T.wave + (Math.random() - 0.5) * T.grain

          // Curl of a two-octave scalar field: v = (dPsi/dy, -dPsi/dx). Taking the
          // perpendicular of the gradient is what kills the divergence — dots slide along the
          // field's contours instead of down its slope, so neighbours shear past each other
          // and the group never puffs outward.
          const cf = T.clump * 0.02
          const f1x = 0.9 * cf, f1y = 1.3 * cf, f2x = 1.7 * cf, f2y = 0.7 * cf
          const c1 = Math.cos(f1x * jx + f1y * jy + 1.7)
          const c2 = Math.cos(f2x * jx - f2y * jy + 4.1)
          const vx = f1y * c1 - 0.7 * f2y * c2
          const vy = -(f1x * c1 + 0.7 * f2x * c2)
          const vlen = Math.hypot(vx, vy) || 1
          // where the field is flat a dot barely moves at all, which is what stops this
          // reading as every dot leaving at once
          const mag = Math.min(1, vlen / (f1y + 0.7 * f2y))
          const jit = (Math.random() - 0.5) * T.noise
          const ca = Math.cos(jit), sa = Math.sin(jit)
          const ux = (vx * ca - vy * sa) / vlen, uy = (vx * sa + vy * ca) / vlen
          const dist = T.travel * CAP * (0.35 + 0.65 * mag) * (0.7 + Math.random() * 0.6)

          pts.push({
            x: jx, y: jy, hi, rt,
            dx: ux * dist,
            dy: uy * dist + T.sag * CAP * (0.5 + Math.random()),
            dd: d0 * (Math.random() < 0.10 ? 1.2 : 0.88),
            ph: Math.random() * 6.2832, sp: 0.6 + Math.random() * 0.9,
            wxPhase: jy * 0.06, wyPhase: jx * 0.05,
            fsz: Math.random() < 0.16 ? 3 : Math.random() < 0.5 ? 2 : 1,
            fa: 0.5 + Math.random() * 0.5,
            mfx: 0.0004 + Math.random() * 0.0008, mfy: 0.0003 + Math.random() * 0.0007,
            mpx: Math.random() * 6.2832, mpy: Math.random() * 6.2832,
            mamp: 0.5 + Math.random() * 1.1,
            seeds: false, // whether this dot lights the maze on its way out
          })
        }

      // Mark an even scattering of dots as maze-seeders. Every dot doing it would be 3300
      // wavelets against a wake list that holds 16 — they would evict each other within a
      // frame and nothing would be visible.
      if (T.feed === 2 && T.seeds > 0) {
        const step = Math.max(1, Math.floor(pts.length / T.seeds))
        for (let i = 0; i < pts.length; i += step) pts[i].seeds = true
      }

      // Every field below feeds a coordinate or an alpha, and canvas ignores NaN draws in
      // silence — one missing field renders a blank screen with no error anywhere.
      if (pts.length) {
        const p0 = pts[0]
        for (const key of ['x', 'y', 'rt', 'dx', 'dy', 'dd', 'fa', 'fsz', 'mamp']) {
          if (!Number.isFinite(p0[key])) throw new Error(`IntroWake: particle.${key} is ${p0[key]}`)
        }
      }

      if (DEV_TUNE) window.__introTiming = {
        hold: HOLD1, wipe: WIPE, linger: T.linger, span: T.span,
        end: Math.round(T_END), reveal: Math.round(T_REVEAL), particles: pts.length,
      }
    }

    // the dissolve front, handed to the maze so its real wake fires along the same line
    let lastFx = -1, spawnAcc = 0
    function feedWake(front) {
      if (T.feed !== 1 || !pointer || !pointer.current) return
      const fx = bx + front * bw
      if (fx < bx - CAP || fx > bx + bw + CAP) return
      if (lastFx >= 0) spawnAcc += Math.abs(fx - lastFx)
      lastFx = fx
      let guard = 0
      while (spawnAcc >= T.gap && guard++ < 4) {
        pointer.current.moveTo(fx, lineY)
        spawnAcc -= T.gap
      }
    }

    function frame(now) {
      const e = now - t0
      ctx.clearRect(0, 0, W, H)

      // One front, crossing at a constant rate; both waves hang off it. Linear on purpose —
      // an eased front sweeps unevenly, and uneven is what reads as a burst.
      const rp1 = e < HOLD1 ? -1 : (e - HOLD1) / WIPE - SOFT
      if (rp1 > T.linger) feedWake(rp1 - T.linger)

      for (let i = 0; i < pts.length; i++) {
        const s = pts[i]
        const age = rp1 - s.rt
        if (age <= -SOFT) continue
        const rv = smooth(age / SOFT)
        if (rv <= 0.01) continue

        // holds for `linger`, then slides and fades over `span`
        const d = clamp01((age - T.linger) / T.span)
        if (d >= 1) continue

        const mw = T.meander * CAP * s.mamp * d
        const bx0 = s.x + s.dx * d
        const by0 = s.y + s.dy * d
        // the maze's own sway, arriving as the dot lets go rather than shaking the held name
        const wv = d * T.warp * (3.5 * Math.sin(by0 * 0.03 + e * 0.0016) + 1.8 * Math.sin(by0 * 0.09 - e * 0.0011))
        const px = bx0 + wv + 2.6 * T.wobble * Math.sin(s.wxPhase + e * 0.0021)
                 + mw * Math.sin(s.mpx + e * s.mfx)
        const py = by0 + 1.8 * T.wobble * Math.sin(s.wyPhase - e * 0.0017)
                 + mw * Math.cos(s.mpy + e * s.mfy)

        // as it goes, it lights the maze where it is — the dot becomes a maze particle at
        // that spot, rather than the maze being lit along a line somewhere else
        if (s.seeds && d >= T.seedat && pointer && pointer.current) {
          s.seeds = false
          pointer.current.seedAt(px, py)
        }

        const twk = 1 - T.twinkle * 0.3 * (1 - Math.sin(e * 0.003 * s.sp + s.ph))
        const asFleck = smooth(d / T.pale) // sequin -> colourless maze fleck
        const env = 1 - d                  // and gone by the end of the slide

        if (asFleck < 0.99) {
          const a = rv * 0.14 * T.bead * twk * (1 - asFleck) * (d > 0 ? env : 1)
          if (a > 0.008) {
            ctx.globalAlpha = Math.min(0.95, a)
            ctx.drawImage(beads[s.hi], px - s.dd / 2, py - s.dd / 2, s.dd, s.dd)
          }
        }
        if (asFleck > 0.01) {
          // settles toward the dim level the maze's dots sit at, then goes out
          const level = T.rest + (1 - T.rest) * (1 - asFleck)
          const fl = rv * s.fa * asFleck * level * env * twk
          if (fl > 0.01) {
            ctx.globalAlpha = Math.min(1, fl)
            ctx.fillStyle = 'rgb(246,247,255)'
            ctx.fillRect(px, py, s.fsz, s.fsz)
          }
        }
      }
      ctx.globalAlpha = 1

      if (!revealed && e >= T_REVEAL) {
        revealed = true
        if (cbRef.current.onReveal) cbRef.current.onReveal()
      }
      if (!hidden && e >= T_END) { hidden = true; setHide(true) }
      sched.request(frame)
    }

    // silence the real mouse for as long as the intro is on screen
    const muted = pointer && pointer.current && pointer.current.setMuted
    if (muted) pointer.current.setMuted(true)

    const resize = () => layout()
    window.addEventListener('resize', resize)

    const begin = () => { layout(); t0 = sched.t0(); sched.request(frame) }
    if (document.fonts && document.fonts.status !== 'loaded') {
      if (FREEZE_MS !== null) document.fonts.ready.then(begin).catch(begin)
      else { begin(); document.fonts.ready.then(() => { layout(); t0 = sched.t0() }).catch(() => {}) }
    } else begin()

    return () => {
      sched.cancel()
      window.removeEventListener('resize', resize)
      if (pointer && pointer.current && pointer.current.setMuted) pointer.current.setMuted(false)
    }
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
