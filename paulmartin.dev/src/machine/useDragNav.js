// Touch-swipe rotation for the drum. Each swipe turns the drum a whole face at a
// time (it does not follow the finger -- it just turns over, like the desktop
// wheel). The first turn of a drag comes easily; every further turn in the same
// unbroken drag needs a much longer pull, so a fast flick can't spin through
// several faces at once. Touch only -- desktop keeps the wheel/pip/keyboard
// paths. Mirrors useScrollNav's scroll arbitration: a swipe that starts inside a
// genuinely scrollable area (e.g. Face V's reveal) is left to scroll natively.

import { useEffect } from 'react'
import { findScrollableAncestor } from './useScrollNav.js'

// Below this the touch is still a tap (buttons/reels/pips fire). Past ~10px of
// vertical travel we claim the gesture and stop the page from scrolling.
const CLAIM_PX = 10

// React hook: attaches touch handlers to `rootRef.current`. `firstPx()` is the
// travel that triggers the first turn; `subsequentPx()` the (larger) travel each
// further turn needs. Each `onStep(dir)` turns one face (dir +1 forward,
// matching the wheel: dragging up = next). `canInteract` gates out the opening
// spin and the locked (Face V open) state.
export default function useDragNav(
  rootRef,
  { onStep, canInteract, firstPx, subsequentPx },
) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    let active = false
    let claimed = false
    let steps = 0
    let refY = 0
    // A swipe can synthesise a click on release; swallow the next one so a turn
    // that lifts over a button/reel doesn't also tap it.
    let swallowClick = false

    function onTouchStart(event) {
      if (active) return
      if (event.touches.length !== 1) return
      if (!canInteract()) return
      if (findScrollableAncestor(event.target, root)) return
      active = true
      claimed = false
      steps = 0
      refY = event.touches[0].clientY
    }

    function onTouchMove(event) {
      if (!active) return
      const y = event.touches[0].clientY
      if (!claimed && Math.abs(y - refY) < CLAIM_PX) return
      claimed = true
      // Committed to a vertical drum gesture: stop the page/content scrolling
      // (the listener is non-passive so this takes effect).
      event.preventDefault()
      // Fire as many turns as the travel has earned, the first cheap and the
      // rest dear, resetting the reference by each turn's cost so the thresholds
      // stay evenly spaced through a long drag.
      for (;;) {
        const need = Math.max(1, steps === 0 ? firstPx() : subsequentPx())
        if (refY - y >= need) {
          onStep(1) // dragging up = next face
          refY -= need
        } else if (y - refY >= need) {
          onStep(-1) // dragging down = previous face
          refY += need
        } else {
          break
        }
        steps += 1
        swallowClick = true
      }
    }

    function endDrag() {
      active = false
      claimed = false
      steps = 0
    }

    function onClickCapture(event) {
      if (!swallowClick) return
      swallowClick = false
      event.preventDefault()
      event.stopPropagation()
    }

    root.addEventListener('touchstart', onTouchStart, { passive: true })
    root.addEventListener('touchmove', onTouchMove, { passive: false })
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
