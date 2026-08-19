import { useEffect, useRef } from 'react'
import { nebulaColor } from '../shimmer'

// Two small stacked chevrons of maze flecks. The flecks stay in place and wiggle; a downward
// activation wave lights them (through opacity AND color, like the maze wake), sweeping through
// the top chevron then the bottom, so the pair reads as a "scroll down" that ripples downward.
export default function ChevronDots({ className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const cv = ref.current
    const ctx = cv.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    const W = 118, H = 104
    cv.width = W * DPR
    cv.height = H * DPR
    cv.style.width = W + 'px'
    cv.style.height = H + 'px'
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)

    const rand = (a, b) => a + Math.random() * (b - a)
    const PER_ARM = 40, HALF_THICK = 6
    const flecks = []
    const addChevron = (topY, botY, pad) => {
      const midX = W / 2
      const arms = [
        { ax: pad, ay: topY, bx: midX, by: botY },
        { ax: W - pad, ay: topY, bx: midX, by: botY },
      ]
      for (const a of arms) {
        const vx = a.bx - a.ax, vy = a.by - a.ay
        const len = Math.hypot(vx, vy) || 1
        const px = -vy / len, py = vx / len
        for (let i = 0; i < PER_ARM; i++) {
          const f = Math.random()
          const off = rand(-1, 1) * HALF_THICK
          const x = a.ax + vx * f + px * off + rand(-1.4, 1.4)
          const y = a.ay + vy * f + py * off + rand(-1.4, 1.4)
          flecks.push({
            x, y,
            d: y / H,
            ph: Math.random() * 0.7,
            pale: Math.random() < 0.16,
            sz: Math.random() < 0.5 ? 1 : Math.random() < 0.85 ? 2 : 3,
            wamp: 2.2 + Math.random() * 1.8,
            wfx: 0.0009 + Math.random() * 0.0009,
            wfy: 0.0008 + Math.random() * 0.0009,
            wpx: Math.random() * 6.2832,
            wpy: Math.random() * 6.2832,
          })
        }
      }
    }
    addChevron(8, 46, 22)   // top chevron
    addChevron(56, 94, 22)  // bottom chevron

    const SWEEP = 0.0011 // downward activation speed — a bit faster than before
    const SPAN = 7       // how much of the stack the lit band covers at once
    let raf = 0
    const draw = (now) => {
      ctx.clearRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'lighter'
      const t = reduce ? 0 : now
      for (const fk of flecks) {
        const phase = t * SWEEP - fk.d * SPAN + fk.ph
        const drive = 0.5 + 0.5 * Math.sin(phase)
        // low exponent + higher floor -> the lit band is wider, so more flecks are on at once
        const a = 0.24 + 0.62 * Math.pow(drive, 0.9)
        if (a < 0.03) continue
        const wx = reduce ? 0 : Math.sin(t * fk.wfx + fk.wpx) * fk.wamp
        const wy = reduce ? 0 : Math.sin(t * fk.wfy + fk.wpy) * fk.wamp
        if (fk.pale) {
          ctx.fillStyle = `rgba(246,247,255,${a.toFixed(3)})`
        } else {
          // blue -> violet only (no pink)
          ctx.fillStyle = nebulaColor(0.05 + 0.6 * (0.5 + 0.5 * Math.sin(phase - 1.4)), a)
        }
        ctx.fillRect(fk.x + wx - fk.sz / 2, fk.y + wy - fk.sz / 2, fk.sz, fk.sz)
      }
      ctx.globalCompositeOperation = 'source-over'
      if (!reduce) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={ref} className={`chevron-dots ${className}`.trim()} aria-hidden="true" />
}
