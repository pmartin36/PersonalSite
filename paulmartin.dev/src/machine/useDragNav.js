// Touch-swipe rotation for the drum. A swipe that starts below the top zone
// turns the drum a whole face at a time, either direction (the first turn easy,
// each further turn in the same drag needs a longer pull, so a flick turns one
// face not five). A swipe that starts IN the top zone (top 40% of the height)
// AND on empty scene (not the drum or a control) is left to the browser, so
// pull-to-refresh works there; grabbing the device always turns it. Touch only
// -- desktop keeps the wheel/pip/keyboard
// paths. Mirrors useScrollNav's scroll arbitration: a swipe that starts inside a
// genuinely scrollable area (e.g. Face V's reveal) is left alone.

import { useEffect } from 'react'
import { findScrollableAncestor } from './useScrollNav.js'

// React hook: attaches touch handlers to `rootRef.current`. `firstPx()` is the
// travel that triggers the first turn; `subsequentPx()` the (larger) travel each
// further turn needs. `onStep(dir)` turns one face (+1 forward on an up-swipe,
// matching the wheel; -1 back on a down-swipe). `canInteract` gates out the
// opening spin and the locked (Face V open) state.
export default function useDragNav(
  rootRef,
  { onStep, canInteract, firstPx, subsequentPx },
) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    let active = false
    let cede = false
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
      const y = event.touches[0].clientY
      // Cede to the browser (pull-to-refresh) only for a swipe that starts high
      // (top third in portrait, top 40% in landscape) AND on empty scene, not on
      // the drum or any interactive control. Grabbing the device always turns it.
      const t = event.target
      const onDeviceOrUI = !!(
        t.closest &&
        t.closest('.machine__drum, a, button, [role="button"], input, select, textarea, label')
      )
      const zone = 0.4 * window.innerHeight
      cede = y < zone && !onDeviceOrUI
      active = true
      steps = 0
      refY = y
    }

    function onTouchMove(event) {
      if (!active || cede) return
      const y = event.touches[0].clientY
      // Own the gesture below the top zone (both directions), blocking native
      // scroll/refresh so a turn never also pulls the page.
      event.preventDefault()
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
      cede = false
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
