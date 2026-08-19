---
feature: ancient-machine
task: b1-t4
agent: tdd-code-writer
updated: 2026-08-19T15:31:00Z
iteration: 1
---

## Implementation
FILES:
  - paulmartin.dev/src/machine/useScrollNav.js (filled in the four stub bodies)
  - paulmartin.dev/src/machine/Machine.jsx (wired the hook into MachineShell)

SUMMARY:
- `isScrollable(el)`: computed `overflowY`/`overflowX` is `auto`/`scroll` AND the matching
  scroll metric exceeds the matching client metric. No class/data-* read.
- `findScrollableAncestor(startEl, boundary)`: walks `startEl.parentElement` upward, returns
  the first `isScrollable` ancestor, stops (exclusive) at `boundary`, null if none.
- `createScrollNavController({ onStep, getBoundary, threshold = 40, idleMs = 160 })`: arbitrates
  each `handleWheel(event)` via `findScrollableAncestor(event.target, getBoundary())`. Content
  path (ancestor found) is a no-op. Drum path calls `preventDefault()`, resets an idle timer on
  every event, accumulates `deltaY` while `!locked`, and once `|accum| >= threshold` calls
  `onStep(Math.sign(accum))` and locks until the idle timer (idleMs after the last event) clears
  `locked`/`accum`. `cancel()` clears the idle timer.
- Default `useScrollNav(rootRef, { onStep })`: in a `useEffect`, builds one controller bound to
  `rootRef.current` as both listener target and arbitration boundary, attaches
  `{ passive: false }` `wheel`, cleans up (`removeEventListener` + `controller.cancel()`) on
  unmount/dep change.
- Machine.jsx (MachineShell): added `rootRef` (attached to the outer `.machine` div),
  `currentFaceRef` synced from `currentFace` via a `useEffect`, a stable
  `handleStep = useCallback((dir) => rotateTo(currentFaceRef.current + dir), [rotateTo])`, and
  `useScrollNav(rootRef, { onStep: handleStep })`. No change to `rotateTo`, snap timing, or audio.

MAPS_TO_BLUEPRINT: All four blueprint interfaces implemented exactly per the pseudocode
(isScrollable predicate, findScrollableAncestor walk, controller debounce/lock state machine,
useScrollNav wiring). Machine.jsx edit matches FILES_EDIT precisely: rootRef, currentFaceRef,
handleStep, useScrollNav call, ~10 lines added (Machine.jsx now 191 lines, well under budget).
DEVIATIONS: none
REUSED:
  - `rotateTo` (Machine.jsx) is the sole drum-stepping entry point `handleStep` calls; the hook
    contains no `play(...)` call, inheriting the on-settle snap from `rotateTo` per the
    single-owner audio API.
  - `wrapIndex` (used internally by `rotateTo`) — `handleStep` passes an unbounded
    `currentFaceRef.current + dir`; no separate wrap logic added in the hook.

## Expected result
TESTS: paulmartin.dev/src/machine/useScrollNav.test.js — all 12 cases green. Full suite (51
tests across 5 files) green, confirming no regression in audio/Clue/Machine/model tests.
BUILD: `cd paulmartin.dev && npx vite build` succeeds (87 modules transformed, no errors).

STATUS: READY_TO_VALIDATE
