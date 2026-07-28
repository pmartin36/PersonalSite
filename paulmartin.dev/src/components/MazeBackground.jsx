import { useEffect, useRef } from 'react'

// The hidden interactive maze, rendered as a fixed full-viewport metallic-shimmer
// background. Dark at rest; it only reveals on mouse move (directional wake), scroll
// (a wave that sets out from the pointer and breaks down the page), or ball impact.
// Controls are U/L/D/R (the letters hidden in "paulmartin.dev" - no arrow-key
// workaround). Reaching the exit calls onSolve.
export default function MazeBackground({ onSolve }) {
  const canvasRef = useRef(null)
  const fgCanvasRef = useRef(null)
  const onSolveRef = useRef(onSolve)
  onSolveRef.current = onSolve

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const fgCanvas = fgCanvasRef.current
    const fgCtx = fgCanvas.getContext('2d')
    const wall = document.createElement('canvas'), wctx = wall.getContext('2d')
    const mask = document.createElement('canvas'), mctx = mask.getContext('2d')
    const waveC = document.createElement('canvas'), vctx = waveC.getContext('2d')

    let W, H, DPR, CELL, cols, rows, offX, offY, WALL_THICK, WALL_HALF, BALL_R
    let right = [], down = [], segs = []
    let startR, startC, exitR, exitC
    const DESIRED_CELL = 46
    const ball = { x: 0, y: 0 }
    let cr = 0, cc = 0 // current cell
    const tween = { active: false, fromX: 0, fromY: 0, toX: 0, toY: 0, tr: 0, tc: 0, t0: 0, dur: 1 }
    let solved = false, nowT = 0
    let rafId = 0

    const X = (c) => offX + c * CELL, Y = (r) => offY + r * CELL
    const cellCenter = (r, c) => [X(c) + CELL / 2, Y(r) + CELL / 2]

    function buildMaze() {
      CELL = DESIRED_CELL
      cols = Math.max(6, Math.ceil(W / CELL))
      rows = Math.max(4, Math.ceil(H / CELL))
      offX = (W - cols * CELL) / 2
      offY = (H - rows * CELL) / 2
      WALL_THICK = Math.round(CELL * 0.44)
      WALL_HALF = WALL_THICK / 2
      BALL_R = (CELL - WALL_THICK) / 2 - 3

      const rnd = Math.random // fresh maze every load

      right = Array.from({ length: rows }, () => Array(cols).fill(true))
      down = Array.from({ length: rows }, () => Array(cols).fill(true))
      const onPath = Array.from({ length: rows }, () => Array(cols).fill(false))
      const openB = (r1, c1, r2, c2) => {
        if (r1 === r2) right[r1][Math.min(c1, c2)] = false
        else down[Math.min(r1, r2)][c1] = false
      }

      const DR = { N: [-1, 0], S: [1, 0], W: [0, -1], E: [0, 1] }
      const tryWalk = (accept) => {
        for (let r = 0; r < rows; r++) { right[r].fill(true); down[r].fill(true); onPath[r].fill(false) }
        const firstR = 1 + ((rnd() * (rows - 2)) | 0)
        let r = firstR, c = 0, axis = 'H', seg = 0, reached = false
        const used = {}
        onPath[r][c] = true
        let minR = firstR, maxR = firstR, sumR = firstR, cnt = 1
        const runLen = (d) => {
          const [dr, dc] = DR[d]; let nr = r, nc = c, steps = 0
          const want = 4 + ((rnd() * (axis === 'H' ? 8 : 7)) | 0)
          while (steps < want) {
            const tr = nr + dr, tc = nc + dc
            // keep the route inside the visible interior: never the outermost rows
            // (top/bottom borders bleed off-screen) and never column 0 (left border is
            // off-screen); column cols-1 stays reachable as the exit cell.
            if (tr < 1 || tr > rows - 2 || tc < 1 || tc >= cols || onPath[tr][tc]) break
            nr = tr; nc = tc; steps++
          }
          return steps
        }
        while (seg < 13) {
          let dir
          if (axis === 'H') dir = rnd() < 0.7 ? 'E' : 'W'
          else { const toC = r < rows / 2 ? 'S' : 'N'; dir = rnd() < 0.58 ? toC : toC === 'S' ? 'N' : 'S' }
          let steps = runLen(dir)
          if (steps === 0) { dir = axis === 'H' ? (dir === 'E' ? 'W' : 'E') : (dir === 'N' ? 'S' : 'N'); steps = runLen(dir) }
          if (steps === 0) break
          const [dr, dc] = DR[dir]
          for (let s = 0; s < steps; s++) { const tr = r + dr, tc = c + dc; openB(r, c, tr, tc); onPath[tr][tc] = true; r = tr; c = tc; if (tr < minR) minR = tr; if (tr > maxR) maxR = tr; sumR += tr; cnt++ }
          used[dir] = (used[dir] || 0) + 1; seg++; axis = axis === 'H' ? 'V' : 'H'
          if (c === cols - 1) { reached = true; break }
        }
        const all4 = used.E && used.W && used.N && used.S
        const meanR = sumR / cnt, span = maxR - minR
        const balanced = span >= rows * 0.45 && meanR >= rows * 0.28 && meanR <= rows * 0.72
        const split = used.W >= 2 && used.N >= 2 && used.S >= 2 && used.E > used.W
        if (reached && accept(seg, all4, balanced, split)) { startR = firstR; startC = 0; exitR = r; exitC = c; return true }
        return false
      }
      const genPath = () => {
        for (let a = 0; a < 6000; a++) if (tryWalk((s, all, bal, sp) => s >= 10 && s <= 12 && all && bal && sp)) return true
        for (let a = 0; a < 6000; a++) if (tryWalk((s, all, bal, sp) => s >= 10 && s <= 13 && all && bal && sp)) return true
        for (let a = 0; a < 4000; a++) if (tryWalk((s, all, bal, sp) => s >= 8 && s <= 13 && all && bal && sp)) return true
        for (let a = 0; a < 3000; a++) if (tryWalk((s, all, bal) => s >= 8 && all && bal)) return true
        for (let a = 0; a < 2000; a++) if (tryWalk(() => true)) return true
        return false
      }
      const straightFallback = () => {
        const mr = (rows / 2) | 0
        for (let r = 0; r < rows; r++) { right[r].fill(true); down[r].fill(true); onPath[r].fill(false) }
        for (let c = 0; c < cols; c++) { onPath[mr][c] = true; if (c > 0) right[mr][c - 1] = false }
        startR = mr; startC = 0; exitR = mr; exitC = cols - 1
      }
      if (!genPath()) straightFallback()

      // guarantee the route is solvable by corner-to-corner sliding (BFS over slide moves)
      const canGoRC = (r, c, d) =>
        d === 'N' ? (r > 0 && !down[r - 1][c]) :
        d === 'S' ? (r < rows - 1 && !down[r][c]) :
        d === 'W' ? (c > 0 && !right[r][c - 1]) :
        (c < cols - 1 && !right[r][c])
      const solvable = () => {
        const seen = Array.from({ length: rows }, () => Array(cols).fill(false))
        const q = [[startR, startC]]; seen[startR][startC] = true
        for (let h = 0; h < q.length; h++) {
          const [r, c] = q[h]
          if (r === exitR && c === exitC) return true
          for (const d in DR) {
            const [dr, dc] = DR[d]; let nr = r, nc = c
            while (canGoRC(nr, nc, d)) { nr += dr; nc += dc }
            if ((nr !== r || nc !== c) && !seen[nr][nc]) { seen[nr][nc] = true; q.push([nr, nc]) }
          }
        }
        return false
      }
      let solveGuard = 0
      while (!solvable() && solveGuard++ < 25) { if (!genPath()) { straightFallback(); break } }

      // --- decoy maze filling every dead pocket, SEALED from the real path ---
      const dvis = Array.from({ length: rows }, () => Array(cols).fill(false))
      for (let sr = 0; sr < rows; sr++)
        for (let sc = 0; sc < cols; sc++) {
          if (onPath[sr][sc] || dvis[sr][sc]) continue
          const stack = [[sr, sc, null]]; dvis[sr][sc] = true
          while (stack.length) {
            const [r, c, last] = stack[stack.length - 1]
            const opts = []
            if (r > 0 && !onPath[r - 1][c] && !dvis[r - 1][c]) opts.push('N')
            if (r < rows - 1 && !onPath[r + 1][c] && !dvis[r + 1][c]) opts.push('S')
            if (c > 0 && !onPath[r][c - 1] && !dvis[r][c - 1]) opts.push('W')
            if (c < cols - 1 && !onPath[r][c + 1] && !dvis[r][c + 1]) opts.push('E')
            if (!opts.length) { stack.pop(); continue }
            const d = last && opts.includes(last) && rnd() < 0.78 ? last : opts[(rnd() * opts.length) | 0]
            const [dr, dc] = DR[d]
            openB(r, c, r + dr, c + dc); dvis[r + dr][c + dc] = true; stack.push([r + dr, c + dc, d])
          }
        }

      // segments for the baked wall art
      segs = []
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          if (right[r][c] && c < cols - 1) segs.push({ v: 1, x: X(c + 1), a: Y(r), b: Y(r + 1) })
          if (down[r][c] && r < rows - 1) segs.push({ v: 0, y: Y(r + 1), a: X(c), b: X(c + 1) })
        }
      for (let c = 0; c < cols; c++) {
        segs.push({ v: 0, y: Y(0), a: X(c), b: X(c + 1) })
        segs.push({ v: 0, y: Y(rows), a: X(c), b: X(c + 1) })
      }
      for (let r = 0; r < rows; r++) {
        segs.push({ v: 1, x: X(0), a: Y(r), b: Y(r + 1) })
        segs.push({ v: 1, x: X(cols), a: Y(r), b: Y(r + 1) })
      }

      cr = startR; cc = startC
      ;[ball.x, ball.y] = cellCenter(cr, cc)
      tween.active = false; solved = false
      bakeWalls()
    }

    function bakeWalls() {
      wctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      wctx.clearRect(0, 0, W, H)
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i]
        let rx, ry, rw, rh
        if (s.v) {
          rx = s.x - WALL_HALF; ry = Math.min(s.a, s.b) - WALL_HALF; rw = WALL_THICK; rh = Math.abs(s.b - s.a) + WALL_THICK
        } else {
          rx = Math.min(s.a, s.b) - WALL_HALF; ry = s.y - WALL_HALF; rw = Math.abs(s.b - s.a) + WALL_THICK; rh = WALL_THICK
        }
        // NO solid body — only scattered metallic glints, so the reveal never traces the
        // wall lines. Points cluster where walls are but read as shimmer, not a maze.
        const flakes = Math.min(430, (rw * rh) / 48 | 0)
        for (let k = 0; k < flakes; k++) {
          const a = 0.5 + Math.random() * 0.5
          const sz = Math.random() < 0.16 ? 3 : Math.random() < 0.5 ? 2 : 1
          wctx.fillStyle = `rgba(246,247,255,${a})`
          wctx.fillRect(rx + Math.random() * rw, ry + Math.random() * rh, sz, sz)
        }
      }
    }

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth; H = window.innerHeight
      for (const cv of [canvas, fgCanvas, wall, mask, waveC]) { cv.width = W * DPR; cv.height = H * DPR }
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
      fgCanvas.style.width = W + 'px'; fgCanvas.style.height = H + 'px'
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      fgCtx.setTransform(DPR, 0, 0, DPR, 0, 0)
      buildMaze()
    }

    // ---- corner-to-corner movement (keyboard U/L/D/R only) ----
    const DV = { N: [-1, 0], S: [1, 0], W: [0, -1], E: [0, 1] }
    const canGo = (r, c, d) =>
      d === 'N' ? (r > 0 && !down[r - 1][c]) :
      d === 'S' ? (r < rows - 1 && !down[r][c]) :
      d === 'W' ? (c > 0 && !right[r][c - 1]) :
                  (c < cols - 1 && !right[r][c])
    function slide(d) {
      if (tween.active) return
      const [dr, dc] = DV[d]
      let nr = cr, nc = cc
      while (canGo(nr, nc, d)) { nr += dr; nc += dc } // run to the next corner
      if (nr === cr && nc === cc) return
      tween.fromX = ball.x; tween.fromY = ball.y
      ;[tween.toX, tween.toY] = cellCenter(nr, nc)
      tween.tr = nr; tween.tc = nc
      // open a reveal at the destination; delay it when travel is long so it finishes a beat
      // before the ball arrives. Its open/hold/seal timeline is fixed (see the update loop),
      // so a fast short move still shows a full reveal. Doesn't disturb prior reveals.
      reveals.push({ x: tween.toX, y: tween.toY, t0: nowT, revealDelay: Math.max(0, tween.dur - REVEAL_MS - BEAT_MS), amt: 0 })
      if (reveals.length > 6) reveals.shift()
      const dist = Math.abs(nr - cr) + Math.abs(nc - cc)
      tween.dur = Math.min(340, 45 * dist + 60) // quick slide
      tween.t0 = nowT; tween.active = true
    }

    const KEY = { u: 'N', d: 'S', l: 'W', r: 'E' } // letters only — no arrow-key workaround
    const onKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return // never hijack Cmd/Ctrl+R etc.
      const el = e.target
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return
      const dir = KEY[e.key.toLowerCase()]
      if (dir) { e.preventDefault(); slide(dir) }
    }

    // ---- mouse-wake reveal ----
    let pmx = -1, pmy = -1, lastDir = 0, distAcc = 0
    const wake = [] // wavelets {x, y, age, dir, phase, full, spd, life}
    const SPAWN_DIST = 26 // one wavelet per this many px of travel -> density independent of speed
    // Reveals open at the DESTINATION cell (not following the ball). Each is a soft porthole
    // that dims that spot to ~25% so the shimmer + ball show through; it opens (scheduled to
    // finish a beat before arrival) while the ball is in transit, then seals. Keeping a LIST
    // means a new move's porthole opens while the previous one is still sealing, instead of
    // snapping the old one off.
    const reveals = [] // {x, y, t0, revealDelay, amt} — full time-based lifecycle, distance-independent
    const ballGlints = []
    for (let k = 0; k < 38; k++) {
      const ang = Math.random() * 6.283, rr = Math.sqrt(Math.random()) * 15
      ballGlints.push({ dx: Math.cos(ang) * rr, dy: Math.sin(ang) * rr, sz: Math.random() < 0.32 ? 2 : 1 })
    }
    const onMouseMove = (e) => {
      const nx = e.clientX, ny = e.clientY
      const dx = pmx >= 0 ? nx - pmx : 0, dy = pmx >= 0 ? ny - pmy : 0
      const d = Math.hypot(dx, dy)
      if (d > 0.5) lastDir = Math.atan2(dy, dx)
      pmx = nx; pmy = ny
      distAcc += d
      let guard = 0
      while (distAcc >= SPAWN_DIST && guard++ < 4) {
        wake.push({ x: nx, y: ny, age: 0, dir: lastDir, phase: Math.random() * 6.283, full: false, spd: WAKE_SPEED, life: WAKE_LIFE })
        if (wake.length > 16) wake.shift()
        distAcc -= SPAWN_DIST
      }
    }

    // ---- scroll reveal ----
    // Driven by window.scrollY sampled in the rAF loop, never by wheel events. Wheel,
    // trackpad, touch drag, keyboard and anchor jumps all move scrollY, so one source covers
    // every input and the response is continuous with the page's motion.
    let lastSY = window.scrollY
    let sVel = 0        // |px| moved this frame
    let sDir = 1        // last non-zero scroll direction
    let env = 0         // 0..1 smoothed scroll energy: fast attack, slow release
    const SCROLL_FULL = 42 // px/frame that counts as "full tilt"

    function readScroll() {
      const sy = window.scrollY
      const dy = sy - lastSY
      lastSY = sy
      sVel = Math.abs(dy)
      if (sVel > 0.5) sDir = dy > 0 ? 1 : -1
      const t = Math.min(1, sVel / SCROLL_FULL)
      env += (t - env) * (t > env ? 0.34 : 0.055)
      if (env < 0.002) env = 0
    }

    // Soft-edged alpha sprite. Drawing a stretched sprite gives two-axis softness in one
    // call, which a canvas gradient cannot do; the reveal mask is what defines the shape, so
    // the colour pass on top only needs to cover it and can stay a plain gradient.
    const makeSprite = (w, h, f) => {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h
      const c = cv.getContext('2d'), img = c.createImageData(w, h)
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4
        img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 255
        img.data[i + 3] = Math.max(0, Math.min(255, f(x / (w - 1), y / (h - 1)) * 255)) | 0
      }
      c.putImageData(img, 0, 0); return cv
    }
    // symmetric falloff; p=2 is a bell, higher p is a plateau with soft shoulders
    const plateau = (t, p) => Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * t - 1), p)), 1.4)
    const SPR_BLOB = makeSprite(48, 48, (x, y) => plateau(x, 3) * plateau(y, 2))

    // A swell sets out from the pointer and breaks further down the page, like a wave
    // running up a shore. The pointer sets only WHERE it starts; scroll decides when one
    // sets out. It is a row of soft stamps along an irregular crest rather than one shape,
    // so the crest never has an edge to alias and the break can travel along its length.
    //
    // The crest is a CIRCULAR front centred on the origin, which is what makes it start as a
    // point and radiate out: early on only the segments near the origin are inside the
    // front, and as it advances the arc widens and flattens into a shore-parallel line.
    //
    // Everything affecting TIMING is fixed, so every wave paces identically. Only shape is
    // random: how wide it is, how the crest undulates, and the order the break travels.
    const SPREAD = 2.6      // curvature of the front, not how fast it opens out
    const WIDEN_AT = 0.75   // full width reached at this fraction of the total travel
    const WIDEN_EASE = 0.9
    const WAVE_SPD = 5.2    // px/frame, constant
    const BREAK_AT = 92     // px of travel before the crest starts to curl
    const BREAK_LEN = 70    // px over which a segment goes from crest to full foam
    const DISSIPATE = 48    // px more before the foam is gone
    const BREAK_SLOW = 0.30 // the wave slows by this much as it piles up
    const FADE_POW = 1.6    // >1 trims the dim tail so the wave does not linger
    const WAVE_MAX = 2
    const GAP_MIN = 260, GAP_RND = 300 // px of scroll before the next wave is due
    // A floor in TIME as well. Lifetime is wall-clock but the distance gap is not, so
    // scrolling faster would otherwise shrink the gap while the wave lasted just as long,
    // and they would run together with the screen never empty.
    const GAP_MS = 1300
    const WAVE_TOTAL = BREAK_AT * 1.4 + BREAK_LEN + DISSIPATE // travel before it is spent
    const WAVE_GAIN = 1.7   // the wave covers little of the screen, so it needs to carry more

    const waves = []
    let waveDist = 0, waveNext = GAP_MIN, lastWaveT = -1e9
    function spawnWave() {
      // at the cap, SKIP rather than drop the oldest: shifting one out kills a wave mid-life
      if (waves.length >= WAVE_MAX) return
      // pointer if we have one, otherwise a sensible spot high on the viewport
      const ox = pmx >= 0 ? pmx : W * 0.5
      const oy = pmy >= 0 ? pmy : H * 0.32
      const span = 128 + Math.random() * 247
      const n = Math.max(10, (span * 2 / 13) | 0)
      const segs = new Array(n)
      for (let i = 0; i < n; i++) {
        segs[i] = {
          u: (i / (n - 1)) * 2 - 1,
          // stagger each segment's break so the collapse travels along the crest
          breakOff: (Math.random() - 0.5) * BREAK_AT * 0.8,
          sprayX: (Math.random() - 0.5) * 44, sprayY: 12 + Math.random() * 30,
          sprayS: 0.4 + Math.random() * 0.5,
        }
      }
      waves.push({
        ox, oy, span, segs, dir: sDir, travel: 0, age: 0,
        k1: 2.4 + Math.random() * 3, p1: Math.random() * 6.283, a1: 5 + Math.random() * 9,
        k2: 6 + Math.random() * 7, p2: Math.random() * 6.283, a2: 3 + Math.random() * 5,
      })
    }
    // how far a segment at lateral offset dx has advanced along the elliptical front
    const segFwd = (w, dx) => {
      const reach = w.travel * SPREAD
      const adx = Math.min(Math.abs(dx), reach * 0.98)
      return Math.sqrt(reach * reach - adx * adx) / SPREAD
    }
    // half-width the wave has opened out to so far, 0..1 of its span
    const widthT = (w) => Math.min(1, Math.pow(w.travel / (WAVE_TOTAL * WIDEN_AT), WIDEN_EASE))
    function stepWave() {
      if (env > 0.05) {
        waveDist += sVel
        if (waveDist >= waveNext && nowT - lastWaveT >= GAP_MS) {
          spawnWave()
          waveDist = 0; lastWaveT = nowT
          waveNext = GAP_MIN + Math.random() * GAP_RND
        }
      }
      for (let i = waves.length - 1; i >= 0; i--) {
        const w = waves[i]
        w.age++
        const b = Math.min(1, Math.max(0, (w.travel - BREAK_AT) / BREAK_LEN))
        w.travel += WAVE_SPD * (1 - BREAK_SLOW * b)
        // Gate on the CENTRE's travel. The outer segments lag well behind on the elliptical
        // front, so gating on them would tie the duration to the random span.
        if (w.travel > WAVE_TOTAL || w.age > 200) waves.splice(i, 1)
      }
    }
    function waveAlpha(c2) {
      for (const w of waves) {
        const born = Math.min(1, w.age / 4)
        const wt = widthT(w)
        for (const s of w.segs) {
          const au = Math.abs(s.u)
          if (au > wt) continue // the wave has not opened out this far yet
          const dx = s.u * w.span
          const fwd = segFwd(w, dx)
          const edge = Math.pow(Math.max(0, 1 - s.u * s.u), 0.7) // fade out toward the ends
          if (edge <= 0.01) continue
          const tip = Math.min(1, (wt - au) * w.span / 55) // soft opening tip, no pop-in
          const b = Math.min(1, Math.max(0, (fwd - BREAK_AT - s.breakOff) / BREAK_LEN))
          const over = fwd - BREAK_AT - s.breakOff - BREAK_LEN
          // Clamp the base BEFORE the power. Past full dissipation this goes negative, and a
          // fractional exponent on a negative base is NaN, which slips through a `<= 0.01`
          // guard and then silently voids the globalAlpha assignment, so spent segments
          // repaint at the previous alpha and flash.
          const dis = over <= 0 ? 1 : Math.pow(Math.max(0, 1 - over / DISSIPATE), FADE_POW)
          if (dis <= 0.01) continue
          // brightest right as it curls, then the foam dims as it spreads
          const bright = 0.62 + 0.95 * Math.exp(-Math.pow((b - 0.2) / 0.19, 2))
          // an unbroken crest still needs height to catch glints, or the run-up is lost
          const thick = 12 + 44 * b
          const x = w.ox + dx
          const y = w.oy + w.dir * fwd + w.a1 * Math.sin(s.u * w.k1 + w.p1) + w.a2 * Math.sin(s.u * w.k2 + w.p2)
          c2.globalAlpha = Math.min(1, edge * tip * bright * dis * born * 0.9)
          c2.drawImage(SPR_BLOB, x - 15, y - thick / 2, 30, thick)
          if (b > 0.15) { // foam thrown forward off the crest
            c2.globalAlpha = Math.min(1, edge * tip * dis * born * b * 0.45)
            c2.drawImage(SPR_BLOB, x - 11 + s.sprayX * b, y + w.dir * s.sprayY * b, 22, 14 * s.sprayS + 10 * b)
          }
        }
      }
      c2.globalAlpha = 1
    }
    function waveTint(c2) {
      // colour runs ALONG each wave, so one swell is a single ribbon of spectrum
      for (const w of waves) {
        const g = c2.createLinearGradient(w.ox - w.span, 0, w.ox + w.span, 0)
        const STOPS = 16, stops = specStops(STOPS, Math.min(120, w.age), 190)
        for (let k = 0; k <= STOPS; k++) g.addColorStop(k / STOPS, stops[k])
        c2.fillStyle = g
        // cover the whole arc: the leading centre back to where the outer tails lag
        const yLead = w.oy + w.dir * w.travel
        const yA = yLead + w.dir * 90, yB = yLead - w.dir * (w.travel + 200)
        c2.fillRect(w.ox - w.span - 50, Math.min(yA, yB), w.span * 2 + 100, Math.abs(yA - yB))
      }
    }

    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

    const WAKE_SPEED = 2.2, WAKE_LIFE = 52, RING_W = 38, REVEAL = 0.5
    const CUT_MAX = 132 // reveal porthole radius
    const REVEAL_MS = 170 // time for the destination porthole to open
    const BEAT_MS = 90    // the ball should arrive this long AFTER the porthole finishes opening
    const HOLD_MS = 260   // then it stays fully open this long — so even a 1-cell move is clearly seen
    const SEAL_MS = 520   // then seals over this long. Lifecycle is time-based, NOT tied to travel
    const spectrumStop = (t, drift, A) => {
      const raw = Math.sin(2 * Math.PI * (t * 2.5 + drift))
      const shaped = Math.sign(raw) * Math.pow(Math.abs(raw), 1.5)
      const hue = 268 + 76 * shaped // blue(192) <-> purple(268) <-> pink(344)
      const li = 58 + ((hue - 192) / 152) * 5
      return `hsla(${hue.toFixed(1)},100%,${li.toFixed(1)}%,${A.toFixed(3)})`
    }
    // Memoise the STOPS+1 spectrum strings per (STOPS, age, life) — every render-loop
    // call derives from discrete integers, so cached output is byte-identical.
    const specCache = new Map()
    const specStops = (STOPS, age, life) => {
      const key = STOPS * 1e6 + age * 100 + life
      let arr = specCache.get(key)
      if (arr) return arr
      const drift = age * 0.014, A = Math.min(1, 2.2 * (1 - age / life))
      arr = new Array(STOPS + 1)
      for (let s = 0; s <= STOPS; s++) arr[s] = spectrumStop(s / STOPS, drift, A)
      specCache.set(key, arr)
      return arr
    }

    const wedge = (c2, w, rOuter) => {
      c2.beginPath()
      if (w.full) {
        c2.arc(w.x, w.y, rOuter, 0, 6.2832)
      } else {
        const back = w.dir + Math.PI, spread = 1.15
        c2.moveTo(w.x, w.y)
        c2.arc(w.x, w.y, rOuter, back - spread, back + spread)
      }
      c2.closePath()
    }
    const warp = (c2, img) => {
      const strip = 6
      for (let y = 0; y < H; y += strip) {
        const h = Math.min(strip, H - y)
        const off = 3.5 * Math.sin(y * 0.03 + nowT * 0.0016) + 1.8 * Math.sin(y * 0.09 - nowT * 0.0011)
        c2.drawImage(img, 0, y * DPR, W * DPR, h * DPR, off, y, W, h)
      }
    }

    // Render one reveal pass into `target`. wantFull selects impact ripples (full wakes,
    // rendered on the FRONT layer with a black cut-through) vs ambient mouse wakes (BACK).
    // blackBack paints an opaque #030304 punched to the reveal mask so the shimmer shows
    // THROUGH any content in front — the ball's wall-hit tears a shimmer-on-black hole.
    const renderReveal = (target, wantFull, includeScroll, blackBack) => {
      // 1) reveal alpha into waveC
      vctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      vctx.clearRect(0, 0, W, H)
      vctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < wake.length; i++) {
        const w = wake[i]; if (!!w.full !== wantFull) continue
        const rad = w.age * (w.spd || WAKE_SPEED), fade = 1 - w.age / (w.life || WAKE_LIFE)
        const ring = w.full ? 66 : RING_W, peak = (w.full ? 1.0 : 0.5) * fade
        const g = vctx.createRadialGradient(w.x, w.y, Math.max(0, rad - ring), w.x, w.y, rad + ring)
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${peak})`); g.addColorStop(1, 'rgba(255,255,255,0)')
        vctx.fillStyle = g; wedge(vctx, w, rad + ring); vctx.fill()
      }
      if (includeScroll) waveAlpha(vctx)

      // 2) metal glints -> spectrum tint -> ball blue -> clip to the reveal mask
      mctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      mctx.clearRect(0, 0, W, H)
      mctx.globalCompositeOperation = 'source-over'
      warp(mctx, wall)
      mctx.fillStyle = 'rgba(246,247,255,0.9)'
      for (const gl of ballGlints) mctx.fillRect(ball.x + gl.dx, ball.y + gl.dy, gl.sz, gl.sz)
      mctx.globalCompositeOperation = 'source-atop'
      for (let i = 0; i < wake.length; i++) {
        const w = wake[i]; if (!!w.full !== wantFull) continue
        const rad = w.age * (w.spd || WAKE_SPEED)
        const ring = w.full ? 66 : RING_W, inner = Math.max(0, rad - ring), outer = rad + ring
        const cg = mctx.createRadialGradient(w.x, w.y, inner, w.x, w.y, outer)
        const STOPS = 26, stops = specStops(STOPS, w.age, w.life || WAKE_LIFE)
        for (let s = 0; s <= STOPS; s++) cg.addColorStop(s / STOPS, stops[s])
        mctx.fillStyle = cg; wedge(mctx, w, outer); mctx.fill()
      }
      if (includeScroll) waveTint(mctx)
      { // the ball's own distinct blue, painted last so it pops however it's revealed
        const cg = mctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, 18)
        cg.addColorStop(0, 'hsla(197,100%,73%,1)')
        cg.addColorStop(0.6, 'hsla(211,100%,62%,1)')
        cg.addColorStop(1, 'hsla(224,96%,54%,1)')
        mctx.fillStyle = cg; mctx.beginPath(); mctx.arc(ball.x, ball.y, 18, 0, 7); mctx.fill()
      }
      mctx.globalCompositeOperation = 'destination-in'
      mctx.drawImage(waveC, 0, 0, W, H)

      // 3) composite into the target layer
      if (blackBack) {
        // opaque cut-through: fill black, punch it to the reveal mask -> content behind is
        // hidden inside the ripple, then the shimmer is drawn on that black.
        target.globalCompositeOperation = 'source-over'; target.fillStyle = '#030304'; target.fillRect(0, 0, W, H)
        target.globalCompositeOperation = 'destination-in'; target.drawImage(waveC, 0, 0, W, H)
        target.globalCompositeOperation = 'source-over'
      }
      const gain = includeScroll ? WAVE_GAIN : 1
      target.globalAlpha = Math.min(1, REVEAL * gain); target.drawImage(mask, 0, 0, W, H); target.globalAlpha = 1
    }

    // The ball's porthole (FRONT layer): a FIXED-size soft disc centred on the ball that
    // dims the content down to ~25% opacity so the shimmer + ball show through. Its opacity
    // is `dimAmt` — opens fast while the ball is in transit (you watch it travel), already
    // open at impact, then lerps back once it stops. NOT a hard cut.
    const DIM = 0.75      // peak dim: content drops to ~1-DIM opacity in the disc
    const SHIMMER = 0.5   // shimmer brightness over the dimmed area (kept modest, not blinding)
    const renderReveals = (target) => {
      const R = CUT_MAX
      // 1) union of the reveal discs (each at its own amt) into waveC
      vctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      vctx.clearRect(0, 0, W, H)
      vctx.globalCompositeOperation = 'lighter'
      let maxAmt = 0
      for (const rv of reveals) {
        if (rv.amt <= 0.005) continue
        const g = vctx.createRadialGradient(rv.x, rv.y, 0, rv.x, rv.y, R)
        g.addColorStop(0, `rgba(255,255,255,${rv.amt.toFixed(3)})`)
        g.addColorStop(0.72, `rgba(255,255,255,${(rv.amt * 0.85).toFixed(3)})`)
        g.addColorStop(1, 'rgba(255,255,255,0)')
        vctx.fillStyle = g; vctx.beginPath(); vctx.arc(rv.x, rv.y, R, 0, 6.2832); vctx.fill()
        if (rv.amt > maxAmt) maxAmt = rv.amt
      }
      if (maxAmt <= 0.005) return

      // 2) shimmer clipped to the disc(s): wall glints + per-disc spectrum, but the ball's own
      //    glints/blue at its ACTUAL position, so it reveals as it slides into the destination
      mctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      mctx.clearRect(0, 0, W, H)
      mctx.globalCompositeOperation = 'source-over'
      warp(mctx, wall)
      mctx.fillStyle = 'rgba(246,247,255,0.9)'
      for (const gl of ballGlints) mctx.fillRect(ball.x + gl.dx, ball.y + gl.dy, gl.sz, gl.sz)
      mctx.globalCompositeOperation = 'source-atop'
      const STOPS = 24, drift = nowT * 0.00016
      for (const rv of reveals) {
        if (rv.amt <= 0.005) continue
        const cg = mctx.createRadialGradient(rv.x, rv.y, 0, rv.x, rv.y, R)
        for (let s = 0; s <= STOPS; s++) cg.addColorStop(s / STOPS, spectrumStop(s / STOPS, drift, 0.9))
        mctx.fillStyle = cg; mctx.beginPath(); mctx.arc(rv.x, rv.y, R, 0, 6.2832); mctx.fill()
      }
      { const bg = mctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, 18)
        bg.addColorStop(0, 'hsla(197,100%,73%,1)'); bg.addColorStop(0.6, 'hsla(211,100%,62%,1)'); bg.addColorStop(1, 'hsla(224,96%,54%,1)')
        mctx.fillStyle = bg; mctx.beginPath(); mctx.arc(ball.x, ball.y, 18, 0, 6.2832); mctx.fill() }
      mctx.globalCompositeOperation = 'destination-in'
      mctx.drawImage(waveC, 0, 0, W, H)

      // 3) front: dim the content (bg colour at DIM, masked to the disc[s]) + gentle shimmer
      target.globalCompositeOperation = 'source-over'; target.globalAlpha = DIM; target.fillStyle = '#030304'; target.fillRect(0, 0, W, H); target.globalAlpha = 1
      target.globalCompositeOperation = 'destination-in'; target.drawImage(waveC, 0, 0, W, H)
      target.globalCompositeOperation = 'source-over'
      target.globalAlpha = SHIMMER; target.drawImage(mask, 0, 0, W, H); target.globalAlpha = 1
    }

    function frame(now) {
      nowT = now
      readScroll()
      stepWave()

      if (tween.active) {
        const t = (now - tween.t0) / tween.dur
        if (t >= 1) {
          ball.x = tween.toX; ball.y = tween.toY; cr = tween.tr; cc = tween.tc; tween.active = false
          if (!solved && cr === exitR && cc === exitC) { solved = true; if (onSolveRef.current) onSolveRef.current() }
        } else {
          const e = ease(t)
          ball.x = tween.fromX + (tween.toX - tween.fromX) * e
          ball.y = tween.fromY + (tween.toY - tween.fromY) * e
        }
      }
      // advance each reveal on its fixed timeline: wait(revealDelay) -> open(REVEAL_MS) ->
      // hold(HOLD_MS) -> seal(SEAL_MS). Distance-independent, so short moves are fully seen.
      for (let i = reveals.length - 1; i >= 0; i--) {
        const rv = reveals[i], te = now - rv.t0
        const openEnd = rv.revealDelay + REVEAL_MS, holdEnd = openEnd + HOLD_MS, sealEnd = holdEnd + SEAL_MS
        if (te < rv.revealDelay) rv.amt = 0
        else if (te < openEnd) rv.amt = (te - rv.revealDelay) / REVEAL_MS
        else if (te < holdEnd) rv.amt = 1
        else if (te < sealEnd) rv.amt = 1 - (te - holdEnd) / SEAL_MS
        else reveals.splice(i, 1)
      }

      for (let i = wake.length - 1; i >= 0; i--) if (++wake[i].age > (wake[i].life || WAKE_LIFE)) wake.splice(i, 1)

      ctx.clearRect(0, 0, W, H)       // back layer (ambient, behind content)
      fgCtx.clearRect(0, 0, W, H)     // front layer (ball porthole, over content)

      let hasNonFull = false
      for (let i = 0; i < wake.length; i++) if (!wake[i].full) hasNonFull = true

      // BACK: ambient mouse wakes + the scroll reveal, revealed behind the content
      if (hasNonFull || waves.length) renderReveal(ctx, false, true, false)
      // FRONT: the destination porthole(s) — dim content so the shimmer + ball show through
      if (reveals.length) renderReveals(fgCtx)

      rafId = requestAnimationFrame(frame)
    }

    window.addEventListener('resize', resize)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    resize()
    rafId = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="maze-bg" aria-hidden="true" />
      <canvas ref={fgCanvasRef} className="maze-fg" aria-hidden="true" />
    </>
  )
}
