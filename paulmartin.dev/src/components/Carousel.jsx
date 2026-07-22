import { useEffect, useRef, useState } from 'react'

// Placeholder "screenshot" — a hue-tinted gradient with an abstract app UI, so
// the carousel visibly cycles. Swap MockShot for real <img> screenshots later.
function MockShot({ hue, index, total }) {
  return (
    <div
      className="shot"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 68% 56%), hsl(${(hue + 45) % 360} 62% 40%))`,
      }}
    >
      <div className="shot-ui">
        <span className="shot-bar" />
        <span className="shot-chip" />
        <span className="shot-block b1" />
        <span className="shot-block b2" />
        <span className="shot-block b3" />
      </div>
      <span className="shot-count">
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </div>
  )
}

// SVG chevron — centers perfectly inside .icon-btn (no font side-bearing games).
function Chevron({ dir }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
  )
}

// Auto-advances while on screen; pauses on hover and while scrolled out of view;
// honors prefers-reduced-motion. A single steady interval reads refs each tick,
// so pause/visibility changes never tear it down or reset its phase.
export default function Carousel({ hue = 200, shots = 3, interval = 3200 }) {
  const [i, setI] = useState(0)
  const ref = useRef(null)
  const pausedRef = useRef(false)
  const inViewRef = useRef(false)

  const go = (n, e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setI(((n % shots) + shots) % shots)
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (shots <= 1) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // per-card phase offset so a screenful of carousels doesn't flip in unison
    const offset = (hue % 6) * 400
    let id
    const start = setTimeout(() => {
      id = setInterval(() => {
        if (inViewRef.current && !pausedRef.current) {
          setI((v) => (v + 1) % shots)
        }
      }, interval)
    }, offset)
    return () => {
      clearTimeout(start)
      clearInterval(id)
    }
  }, [shots, interval, hue])

  return (
    <div
      className="carousel"
      ref={ref}
      onMouseEnter={() => {
        pausedRef.current = true
      }}
      onMouseLeave={() => {
        pausedRef.current = false
      }}
    >
      <div
        className="carousel-track"
        style={{ transform: `translateX(-${i * 100}%)` }}
      >
        {Array.from({ length: shots }).map((_, k) => (
          <MockShot key={k} hue={(hue + k * 42) % 360} index={k} total={shots} />
        ))}
      </div>

      {shots > 1 && (
        <>
          <button
            type="button"
            className="icon-btn car-arrow left"
            onClick={(e) => go(i - 1, e)}
            aria-label="Previous image"
          >
            <Chevron dir="left" />
          </button>
          <button
            type="button"
            className="icon-btn car-arrow right"
            onClick={(e) => go(i + 1, e)}
            aria-label="Next image"
          >
            <Chevron dir="right" />
          </button>
          <div className="car-dots">
            {Array.from({ length: shots }).map((_, k) => (
              <button
                type="button"
                key={k}
                className={`dot${k === i ? ' on' : ''}`}
                onClick={(e) => go(k, e)}
                aria-label={`Go to image ${k + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
