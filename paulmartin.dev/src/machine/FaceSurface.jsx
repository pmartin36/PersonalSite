import { useMemo } from 'react'
import './machine.css'

const MOSS_IMAGES = [
  '/machine/moss-1.png',
  '/machine/moss-2.png',
  '/machine/moss-3.png',
  '/machine/moss-4.png',
]

const MOSS_DECAL_COUNT = 7

function randomBetween(min, max) {
  return min + Math.random() * (max - min)
}

function scatterMoss() {
  const decals = []
  for (let i = 0; i < MOSS_DECAL_COUNT; i++) {
    const alongBottom = Math.random() < 0.6
    decals.push({
      img: MOSS_IMAGES[Math.floor(Math.random() * MOSS_IMAGES.length)],
      topPct: alongBottom ? randomBetween(80, 98) : randomBetween(0, 12),
      leftPct: randomBetween(2, 92),
      rotateDeg: randomBetween(-30, 30),
      scale: randomBetween(0.5, 1.1),
    })
  }
  return decals
}

export default function FaceSurface({ children, className, ...rest }) {
  const classes = ['face-surface', className].filter(Boolean).join(' ')
  const moss = useMemo(scatterMoss, [])

  return (
    <section className={classes} {...rest}>
      <div className="face-surface__frame" aria-hidden="true" />
      <div className="face-surface__moss" aria-hidden="true">
        {moss.map((decal, i) => (
          <span
            key={i}
            className="face-surface__moss-decal"
            style={{
              backgroundImage: `url(${decal.img})`,
              top: `${decal.topPct}%`,
              left: `${decal.leftPct}%`,
              transform: `translate(-50%, -50%) rotate(${decal.rotateDeg}deg) scale(${decal.scale})`,
            }}
          />
        ))}
      </div>
      <div className="face-surface__content">{children}</div>
    </section>
  )
}
