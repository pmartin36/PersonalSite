import { useEffect, useRef } from 'react'
import { makeScheduler } from '../devClock'

// The hidden interactive maze, rendered as a fixed full-viewport metallic-shimmer
// background. Dark at rest; it only reveals on mouse move (directional wake) or ball
// impact. Controls are U/L/D/R (the letters hidden in "paulmartin.dev" - no arrow-key
// workaround). Reaching the exit calls onSolve.
//
// pointerApi is a ref this fills with { moveTo, seedAt, setMuted }. The intro drives the wake
// from its own positions through the same code the mouse uses, drops single wavelets where its
// particles land, and silences the real mouse while it plays.
export default function MazeBackground({ onSolve, pointerApi }) {
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
    const sched = makeScheduler()

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
    // Shared by the real mouse and by the intro's scripted sweep, so the intro's wake is not
    // a lookalike — it is this, spawned from a different source of positions.
    const feedPointer = (nx, ny) => {
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
    // The intro mutes this while it plays: it is driving the wake itself, and a real mouse
    // moving at the same time fires a second, unrelated one over the top of it.
    let mouseMuted = false
    const onMouseMove = (e) => { if (!mouseMuted) feedPointer(e.clientX, e.clientY) }
    // Drop a single wavelet at a point, with no travel-distance bookkeeping. feedPointer is
    // wrong for scattered points: it spawns per SPAWN_DIST of movement, so jumping around the
    // screen fires a burst per call. The intro seeds the maze one dot at a time with this.
    const seedAt = (x, y) => {
      wake.push({ x, y, age: 0, dir: Math.random() * 6.283, phase: Math.random() * 6.283,
                  full: false, spd: WAKE_SPEED, life: WAKE_LIFE })
      if (wake.length > 16) wake.shift()
    }
    if (pointerApi) pointerApi.current = {
      moveTo: feedPointer,
      seedAt,
      // resetting the last-position tracking matters on UNMUTE: without it the first real
      // move after the intro looks like one enormous jump and spawns a burst of wavelets
      setMuted: (v) => { mouseMuted = !!v; pmx = -1; pmy = -1; distAcc = 0 },
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
    const renderReveal = (target, wantFull, blackBack) => {
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
      target.globalAlpha = REVEAL; target.drawImage(mask, 0, 0, W, H); target.globalAlpha = 1
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

      // BACK: ambient mouse wakes, revealed behind the content
      if (hasNonFull) renderReveal(ctx, false, false)
      // FRONT: the destination porthole(s) — dim content so the shimmer + ball show through
      if (reveals.length) renderReveals(fgCtx)

      sched.request(frame)
    }

    window.addEventListener('resize', resize)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    resize()
    sched.request(frame)

    return () => {
      sched.cancel()
      if (pointerApi) pointerApi.current = null
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
