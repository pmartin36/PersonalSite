---
feature: ancient-machine
task: b1-t4
agent: tdd-validator
updated: 2026-08-19T15:34:00Z
iteration: 1
---

## Gate run
COMMAND: `npm --prefix paulmartin.dev test && npm --prefix paulmartin.dev run build`
EXIT_CODE: 0
GATE_PASSED: yes
OUTPUT: |
  vitest run -> Test Files 5 passed (5), Tests 51 passed (51), 518ms.
  vite build -> 87 modules transformed, built in 565ms, no errors.
  useScrollNav.test.js contributes 12 green cases (isScrollable x3, findScrollableAncestor x3,
  createScrollNavController x6).

## Behavioral evidence
EXERCISED: Tests were WROTE (not skipped), so the behavioral logic is pinned by the gated
jsdom suite rather than requiring a separate artifact. The deliverable's named assertions are
all covered as green gate tests: debounce collapse (burst within idleMs -> onStep once),
reversibility (negative burst -> onStep(-1)), single large notch -> one step, idle-release ->
second flick steps again, arbitration content path (scrollable-overflow ancestor -> no onStep,
no preventDefault), and overflow-not-marker (marker class/data with no real overflow -> drum
path). Boundary-exclusive walk asserted. The React wiring (useScrollNav -> handleStep ->
rotateTo) is a verified ~5-line integration reading currentFaceRef and delegating to the
already-tested rotateTo (Machine.jsx:74-88, ref attached at :142). rotateTo owns the on-settle
snap; the hook contains no play(...) call, so all turns inherit audio per the single-owner API.

## Simplification review
BLOCKING: none
ADVISORY: none
  - useScrollNav.js is minimal and clear: pure predicate (isScrollable), pure ancestor walk
    (findScrollableAncestor), pure debounce/lock controller (createScrollNavController), thin
    React hook. No nested ternaries, no duplication, no reinvention. Machine.jsx edit is exactly
    the blueprint's rootRef + currentFaceRef + handleStep + hook call.
  - "two-finger drag" in the DESCRIPTION is trackpad momentum = wheel events with an inertia
    tail, handled by the lock swallowing the tail; not a separate unfixed sibling. Touch
    (touchmove) is not named as deferred by code/report and is not in the deliverable or research
    scope (wheel-only). No analogous-site route.

## Verdict
GREEN
DIAGNOSIS: Gate ran and exited 0 (51/51 tests, clean build). The implementation maps 1:1 to the
research blueprint; overflow-based arbitration is keyed purely on computed style + scroll metrics
(never a marker), one gesture commits exactly one reversible step via rotateTo (inheriting the
snap SFX), and the boundary walk is exclusive. All deliverable-named behaviors are covered by
green gated tests. No blocking simplification findings.

STATUS: GREEN
