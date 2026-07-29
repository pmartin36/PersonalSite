// Deterministic clock for capturing the intro. With ?t=<ms> in the URL, every animation
// loop that schedules through here is driven by one shared virtual clock that steps in
// fixed 1/60s ticks from zero and halts at that millisecond — so a given URL always
// produces the same frame, and the intro pointer and the maze wake it feeds stay in
// step. Ticks are pumped through a MessageChannel: setTimeout(0) is clamped to ~4ms
// once nested, and a plain synchronous loop would run one component's whole timeline
// before the other's first frame.
//
// Without ?t= this is requestAnimationFrame with a wrapper around it.
const raw = new URLSearchParams(window.location.search).get('t')
export const FREEZE_MS = raw === null || raw === '' ? null : Math.max(0, +raw || 0)

const STEP = 1000 / 60
let live = 0

export function makeScheduler() {
  if (FREEZE_MS === null) {
    let id = 0
    return {
      t0: () => performance.now(),
      request: (fn) => { id = requestAnimationFrame(fn) },
      cancel: () => cancelAnimationFrame(id),
    }
  }
  let vt = 0, stopped = false
  const ch = new MessageChannel()
  let pending = null
  ch.port1.onmessage = () => { const fn = pending; pending = null; if (fn && !stopped) fn(vt) }
  live++
  const retire = () => {
    if (stopped) return
    stopped = true
    // Only a loop that ran to the target counts as done. A cancel is StrictMode tearing
    // down the first mount, and must not raise the flag before the real run starts.
    if (--live === 0) window.__introFrozen = true
  }
  return {
    t0: () => 0,
    request: (fn) => {
      if (stopped) return
      if (vt >= FREEZE_MS) { retire(); return }
      vt = Math.min(vt + STEP, FREEZE_MS)
      pending = fn
      ch.port2.postMessage(0)
    },
    cancel: () => { if (!stopped) { stopped = true; live-- } ; pending = null },
  }
}
