// Overflow-based scroll arbitration + debounced one-gesture-one-step drum
// stepping. See findScrollableAncestor/isScrollable for the arbitration
// predicate and createScrollNavController for the debounce/inertia state
// machine.

import { useEffect } from 'react'

const THRESHOLD = 40
const IDLE_MS = 160

// True when `el` has computed auto/scroll overflow on some axis AND that
// axis actually overflows (scroll size exceeds client size). Never reads a
// class/data-* marker -- the drum vs. content decision is overflow-only.
export function isScrollable(el) {
  const cs = getComputedStyle(el)
  const okY =
    (cs.overflowY === 'auto' || cs.overflowY === 'scroll') &&
    el.scrollHeight > el.clientHeight
  const okX =
    (cs.overflowX === 'auto' || cs.overflowX === 'scroll') &&
    el.scrollWidth > el.clientWidth
  return okY || okX
}

// Walks `startEl`'s ancestor chain (parentElement, exclusive of `boundary`)
// for the nearest element `isScrollable` accepts. Returns null if none is
// found before reaching (or without) `boundary`.
export function findScrollableAncestor(startEl, boundary) {
  let el = startEl instanceof Element ? startEl.parentElement : null
  while (el && el !== boundary) {
    if (isScrollable(el)) return el
    el = el.parentElement
  }
  return null
}

// Pure gesture controller: arbitrates each wheel event between the content
// path (a real scrollable ancestor handles it natively) and the drum path
// (accumulate deltaY, debounce, commit one onStep per gesture). No React,
// no DOM ownership -- driven entirely by the events and timers it's given.
export function createScrollNavController({
  onStep,
  getBoundary,
  threshold = THRESHOLD,
  idleMs = IDLE_MS,
} = {}) {
  let idleTimer = null
  let locked = false
  let accum = 0

  function release() {
    idleTimer = null
    locked = false
    accum = 0
  }

  function handleWheel(event) {
    const scrollable = findScrollableAncestor(event.target, getBoundary())
    if (scrollable) return

    event.preventDefault?.()
    clearTimeout(idleTimer)
    idleTimer = setTimeout(release, idleMs)

    if (locked) return

    accum += event.deltaY
    if (Math.abs(accum) >= threshold) {
      onStep(Math.sign(accum))
      locked = true
      accum = 0
    }
  }

  function cancel() {
    clearTimeout(idleTimer)
  }

  return { handleWheel, cancel }
}

// React hook: attaches a non-passive wheel listener to `rootRef.current` so
// drum turns can preventDefault the page scroll, with `rootRef.current`
// itself as the arbitration boundary. Cleans up on unmount.
export default function useScrollNav(rootRef, { onStep }) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const controller = createScrollNavController({
      onStep,
      getBoundary: () => root,
    })
    root.addEventListener('wheel', controller.handleWheel, { passive: false })

    return () => {
      root.removeEventListener('wheel', controller.handleWheel)
      controller.cancel()
    }
  }, [rootRef, onStep])
}
