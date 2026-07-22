import { useState } from 'react'

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

// Manual carousel (arrows on hover + dots). Controls stop propagation so it can
// live inside a clickable card without triggering navigation.
export default function Carousel({ hue = 200, shots = 3 }) {
  const [i, setI] = useState(0)
  const go = (n, e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setI(((n % shots) + shots) % shots)
  }

  return (
    <div className="carousel">
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
            className="car-arrow left"
            onClick={(e) => go(i - 1, e)}
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            className="car-arrow right"
            onClick={(e) => go(i + 1, e)}
            aria-label="Next image"
          >
            ›
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
