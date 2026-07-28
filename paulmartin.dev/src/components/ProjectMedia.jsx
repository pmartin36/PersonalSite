import { useEffect, useRef } from 'react'
import Still from './Still'
import Carousel from './Carousel'

// Muted looping clip. It only plays while on screen — a detail page has one of
// these, but there is no reason to burn a decode on it before it is scrolled to.
// Controls stay available so a clip with a soundtrack can be unmuted, and
// prefers-reduced-motion holds it on its poster frame until the visitor asks.
function Clip({ media }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {})
        else el.pause()
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <video
      ref={ref}
      className="media-video"
      poster={media.poster}
      aria-label={media.alt}
      muted
      loop
      playsInline
      controls
      preload="metadata"
    >
      <source src={media.webm} type="video/webm" />
      <source src={media.mp4} type="video/mp4" />
    </video>
  )
}

// `start` seeks to the moment the project actually appears, for the press
// videos where it is partway into a longer review.
function Trailer({ media }) {
  const src =
    `https://www.youtube-nocookie.com/embed/${media.id}` +
    (media.start ? `?start=${media.start}` : '')

  return (
    <div className="media-embed">
      <iframe
        src={src}
        title={media.title}
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  )
}

// The detail-page hero. Kind is declared in the data, not sniffed from a URL.
// `gallery` is how a project shows more than one still — the carousel drops its
// arrows and dots on its own when handed a single image.
export default function ProjectMedia({ media }) {
  if (media.kind === 'video') return <Clip media={media} />
  if (media.kind === 'youtube') return <Trailer media={media} />
  if (media.kind === 'gallery') return <Carousel images={media.images} />
  return <Still image={media} className="media-still" eager />
}
