import { useEffect, useRef, useState } from 'react'

// Adds the reveal-on-scroll behavior: an element starts hidden and becomes
// visible once it scrolls into view. Honors prefers-reduced-motion (visible
// immediately) and only fires once.
export function useReveal(options = {}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !ref.current) {
      setShown(true)
      return
    }
    const el = ref.current
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px', ...options },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, shown]
}
