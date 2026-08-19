---
feature: ancient-machine
task: b1-t4
agent: tdd-test-writer
updated: 2026-08-19T19:29:05Z
iteration: 1
---

## Decision
WROTE
REASON: TEST_RECOMMENDATION=write and blueprint calls it correctly — one-gesture-one-step
debounce and overflow-vs-marker arbitration are exactly the regression-prone gesture logic a
spec-mandated fixed contract needs pinned before implementation.

## Tests
FILES:
  - paulmartin.dev/src/machine/useScrollNav.js (new — minimal signature stub, bodies throw
    "not implemented"; code-writer fills them in)
  - paulmartin.dev/src/machine/useScrollNav.test.js (new)

CASES:
  - isScrollable: overflow-y auto + scrollHeight>clientHeight — asserts: true (real overflow)
  - isScrollable: overflow-y auto + scrollHeight===clientHeight — asserts: false (no real overflow)
  - isScrollable: class="scrollable" + data-scroll, overflow visible — asserts: false (not marker-keyed)
  - findScrollableAncestor: deep child under a nested scrollable — asserts: returns the nearest
    scrollable ancestor, not a farther one
  - findScrollableAncestor: no scrollable ancestor anywhere — asserts: null
  - findScrollableAncestor: the only scrollable node IS the boundary — asserts: null (boundary
    exclusive)
  - createScrollNavController: burst of 3 events summing past threshold, all before idleMs —
    asserts: onStep called once with +1, preventDefault called on each drum-path event
  - createScrollNavController: negative-deltaY burst — asserts: onStep called once with -1
  - createScrollNavController: single large-deltaY event — asserts: onStep called exactly once
  - createScrollNavController: flick, advance fake timers past idleMs, second flick — asserts:
    onStep called twice total (lock released after idle)
  - createScrollNavController: target under a real scrollable-overflow ancestor — asserts: onStep
    NOT called, preventDefault NOT called (content path)
  - createScrollNavController: target under a marker-class-but-no-overflow ancestor — asserts:
    onStep called (drum path — proves overflow, not marker, drives the decision)

RUN: cd paulmartin.dev && npx vitest run src/machine/useScrollNav.test.js
RED_CONFIRMED: yes
RED_OUTPUT: |
  12/12 tests fail, each at its own call site, on the stub's deliberate panic:
    Error: findScrollableAncestor: not implemented
     ❯ findScrollableAncestor src/machine/useScrollNav.js:12:9
    Error: createScrollNavController: not implemented
     ❯ createScrollNavController src/machine/useScrollNav.js:16:9
  (isScrollable cases fail identically at useScrollNav.js:8.) Every case fails for the one reason
  under test — the symbol it exercises is unimplemented — nothing masked by an earlier assertion
  or a mis-seeded fixture. Rest of the suite (audio/Clue/Machine/model, 39 tests) stays green
  with these two new files present, confirming no collateral breakage from adding the stub.

## Stale tests
PRUNED: none
UPDATED: none
No prior test in the suite touches wheel/deltaY/scroll-arbitration (`rg "wheel|deltaY|useScrollNav|scrollable"`
across all *.test.* files returns only hits inside the new useScrollNav.test.js). This task adds a
new module; it edits no existing exported contract, so nothing goes stale.

## Contract
Implement the three bodies in paulmartin.dev/src/machine/useScrollNav.js per research.md's
Blueprint pseudocode:
- `isScrollable(el)`: computed overflow-y/x is auto or scroll AND the matching scroll metric
  exceeds the matching client metric (scrollHeight>clientHeight or scrollWidth>clientWidth).
  Never reads a class/data-* marker.
- `findScrollableAncestor(startEl, boundary)`: walks `parentElement` from `startEl`, returns the
  first ancestor for which `isScrollable` is true, stopping strictly before `boundary` (exclusive
  — a scrollable node at or above boundary must not be returned); null if none found.
- `createScrollNavController({ onStep, getBoundary, threshold, idleMs })`: returns
  `{ handleWheel(event), cancel() }`. `handleWheel` arbitrates via `findScrollableAncestor`; on
  the content path (scrollable ancestor found) it does nothing (no preventDefault, no onStep). On
  the drum path it calls `preventDefault()`, accumulates `deltaY` while debouncing (resetting an
  idle timer on every event), and once the running accumulator's magnitude reaches `threshold`
  calls `onStep(Math.sign(accum))` and locks further steps until the idle timer fires (idleMs
  after the last event in the gesture), then clears the lock and accumulator. `cancel()` clears
  the idle timer.
- Default export `useScrollNav(rootRef, { onStep })` wires `handleWheel` as a non-passive `wheel`
  listener on `rootRef.current`, boundary = that same root; cleans up on unmount. (Not covered by
  this pure test file per the blueprint — it needs a DOM ref lifecycle, exercised instead by
  wiring it into Machine.jsx and the deliverable's behavioral evidence.)
- Wire into Machine.jsx per research.md FILES_EDIT: add `rootRef` on `.machine`, a `currentFaceRef`
  synced from `currentFace`, a stable `handleStep` that calls `rotateTo(currentFaceRef.current + dir)`,
  and `useScrollNav(rootRef, { onStep: handleStep })`. The hook must never call `play(...)` directly
  — the snap comes from `rotateTo`.

STATUS: TESTS_RED
