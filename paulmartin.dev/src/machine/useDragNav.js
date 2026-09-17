// Touch-swipe rotation for the drum. An upward swipe turns the drum forward, one
// face at a time (the first turn easy, each further turn in the same drag needs
// a longer pull, so a flick turns one face not five). Downward swipes are left
// to the browser, so pull-to-refresh and overscroll behave like any other page;
// every face is still reachable by swiping forward (it wraps), plus the pips and
// tap paths. Touch only -- desktop keeps the wheel/pip/keyboard paths. Listeners
// are passive so no native gesture is ever blocked. Mirrors useScrollNav's scroll
// arbitration: a swipe that starts inside a genuinely scrollable area (e.g. Face
// V's reveal) is left alone.

import { useEffect } from 'react'
import { findScrollableAncestor } from './useScrollNav.js'

// React hook: attaches touch handlers to `rootRef.current`. `firstPx()` is the
// upward travel that triggers the first turn; `subsequentPx()` the (larger)
// travel each further turn needs. Each `onStep(1)` turns one face forward.
// `canInteract` gates out the opening spin and the locked (Face V open) state.
export default function useDragNav(
  rootRef,
  { onStep, canInteract, firstPx, subsequentPx },
) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    let active = false
    let steps = 0
    let refY = 0
    // An up-swipe can synthesise a click on release; swallow the next one so a
    // turn that lifts over a button/reel doesn't also tap it.
    let swallowClick = false

    function onTouchStart(event) {
      if (active) return
      if (event.touches.length !== 1) return
      if (!canInteract()) return
      if (findScrollableAncestor(event.target, root)) return
      active = true
      steps = 0
      refY = event.touches[0].clientY
    }

    function onTouchMove(event) {
      if (!active) return
      const y = event.touches[0].clientY
      // Only upward travel turns the drum: refY - y reaches the threshold only
      // when the finger moves up. Downward travel never steps and is ceded to
      // the browser (pull-to-refresh).
      for (;;) {
        const need = Math.max(1, steps === 0 ? firstPx() : subsequentPx())
        if (refY - y >= need) {
          onStep(1)
          refY -= need
          steps += 1
          swallowClick = true
        } else {
          break
        }
      }
    }

    function endDrag() {
      active = false
      steps = 0
    }

    function onClickCapture(event) {
      if (!swallowClick) return
      swallowClick = false
      event.preventDefault()
      event.stopPropagation()
    }

    root.addEventListener('touchstart', onTouchStart, { passive: true })
    root.addEventListener('touchmove', onTouchMove, { passive: true })
    root.addEventListener('touchend', endDrag)
    root.addEventListener('touchcancel', endDrag)
    root.addEventListener('click', onClickCapture, true)

    return () => {
      root.removeEventListener('touchstart', onTouchStart)
      root.removeEventListener('touchmove', onTouchMove)
      root.removeEventListener('touchend', endDrag)
      root.removeEventListener('touchcancel', endDrag)
      root.removeEventListener('click', onClickCapture, true)
    }
  }, [rootRef, onStep, canInteract, firstPx, subsequentPx])
}
