import { useEffect, useRef, useState } from 'react'
import Still from './Still'

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
// A single-image project renders the still alone, with no chrome to operate.
export default function Carousel({ images = [], interval = 6400 }) {
  const [i, setI] = useState(0)
  const ref = useRef(null)
  const pausedRef = useRef(false)
  const inViewRef = useRef(false)
  const shots = images.length

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
    const offset = (shots % 6) * 400
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
  }, [shots, interval])

  if (shots === 0) return null
  if (shots === 1) return <Still image={images[0]} className="media-still" />

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
        {images.map((img) => (
          <Still key={img.webp} image={img} className="shot" />
        ))}
      </div>

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
        {images.map((img, k) => (
          <button
            type="button"
            key={img.webp}
            className={`dot${k === i ? ' on' : ''}`}
            onClick={(e) => go(k, e)}
            aria-label={`Go to image ${k + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
