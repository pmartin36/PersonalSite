import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

// Ordered reveal orchestrator. Items register with an `order`; the provider
// reveals them strictly in order, paced by `stagger`, but never before an item
// is in the viewport. So the initial view cascades top-down, and sections below
// the fold cascade when you scroll to them (picking up where the sequence left
// off) instead of everything appearing at once.
const RevealContext = createContext(null)

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function RevealProvider({ active = true, stagger = 220, children }) {
  const s = useRef({ entries: [], io: null, timer: null, active }).current

  function pump() {
    if (!s.active || s.timer) return
    // Cascade among items currently in view, lowest order first. Reveal every
    // item sharing that order together (a "row" lands at once). We deliberately
    // do NOT block on out-of-view earlier items, so jumping straight to a
    // section (e.g. the Contact nav) still reveals it instead of stalling.
    const eligible = s.entries
      .filter((r) => !r.revealed && r.inView)
      .sort((a, b) => a.order - b.order)
    if (!eligible.length) return
    const nextOrder = eligible[0].order
    eligible
      .filter((r) => r.order === nextOrder)
      .forEach((r) => {
        r.revealed = true
        r.reveal()
      })
    s.timer = setTimeout(() => {
      s.timer = null
      pump()
    }, stagger)
  }

  useEffect(() => {
    s.active = active
    if (active) pump()
  }, [active])

  useEffect(() => {
    if (prefersReduced()) return
    s.io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const entry = s.entries.find((r) => r.el === e.target)
          if (entry) entry.inView = e.isIntersecting
        }
        pump()
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    s.entries.forEach((r) => s.io.observe(r.el))
    return () => {
      if (s.io) s.io.disconnect()
      if (s.timer) clearTimeout(s.timer)
    }
  }, [])

  const api = useRef({
    register(el, order, reveal) {
      if (prefersReduced()) {
        reveal()
        return () => {}
      }
      const entry = { el, order, reveal, inView: false, revealed: false }
      s.entries.push(entry)
      if (s.io) s.io.observe(el)
      return () => {
        if (s.io) s.io.unobserve(el)
        s.entries = s.entries.filter((r) => r !== entry)
      }
    },
  }).current

  return (
    <RevealContext.Provider value={api}>{children}</RevealContext.Provider>
  )
}

export function useReveal(order = 0) {
  const api = useContext(RevealContext)
  const ref = useRef(null)
  const [shown, setShown] = useState(!api)

  useEffect(() => {
    if (!api || !ref.current) {
      setShown(true)
      return
    }
    return api.register(ref.current, order, () => setShown(true))
  }, [order])

  return [ref, shown]
}

export function Reveal({
  order = 0,
  as: Tag = 'div',
  className = '',
  children,
  ...rest
}) {
  const [ref, shown] = useReveal(order)
  return (
    <Tag
      ref={ref}
      className={`reveal ${className} ${shown ? 'in' : ''}`
        .replace(/\s+/g, ' ')
        .trim()}
      {...rest}
    >
      {children}
    </Tag>
  )
}
