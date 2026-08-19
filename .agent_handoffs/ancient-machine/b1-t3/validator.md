---
feature: ancient-machine
task: b1-t3
agent: tdd-validator
updated: 2026-08-19T19:40:00Z
iteration: 1
---

## Gate run
COMMAND: `npm --prefix paulmartin.dev test && npm --prefix paulmartin.dev run build`
EXIT_CODE: 0
GATE_PASSED: yes
OUTPUT:
- vitest: Test Files 4 passed (4); Tests 39 passed (39). Machine.test.jsx's 10 cases all green.
- vite build: 86 modules transformed, built in 589ms, no errors.

## Behavioral evidence
EXERCISED: n/a — tests were WRITTEN (not skipped). The BEHAVIORAL contract is exercised by
Machine.test.jsx (jsdom + @testing-library/react):
- rotateTo wrap/reversibility: wrapIndex(5)=0, wrapIndex(-1)=4; stepDelta(4,0)=+1, (0,4)=-1, (0,3)=-2.
- snap-on-settle routed through the single rotateTo settle timer — pip click + advanceTimersByTime
  fires play('snap') exactly once (thunk not re-fired).
- intro plays play('thunk') once on mount, never 'snap'; rests on Face I (pip[0] aria-current, active
  region = Face I).
- reduced-motion path: matchMedia(reduce) -> [data-reduced] hook present, no thunk/snap on mount,
  all five regions still in DOM order I..V.
The real CSS-3D tumble geometry (front-fills-viewport, edges mid-turn) is inherently visual and not
assertable in jsdom; per the plan's notes it is reserved for Playwright evidence, and the state
machine / audio routing / reduced-motion branch that this task owns are covered by the passing suite.

## Simplification review
BLOCKING: none
ADVISORY:
- Machine.jsx:115-121,136-142,155-161 — the `[...].filter(Boolean).join(' ')` className-join idiom
  repeats three times. A small `cx()` helper would DRY it, but the pattern is a common, readable
  React idiom; not worth a route.
- Machine.jsx:74-77 — rotateTo reads `from` by nesting setRotationSteps inside the setCurrentFace
  updater to avoid a currentFace dependency. Works and is dependency-clean; slightly unusual shape.

## Verdict
GREEN
DIAGNOSIS: Gate ran and exited 0 (39/39 tests + build). The snap SFX is emitted from the single
rotateTo settle timer so every current/future caller inherits it (no per-caller snap, no analogous
unfixed sibling site); intro fires thunk not snap; reduced-motion selects the crossfade path with all
five regions mounted in DOM order; main.jsx "/" repointed to Machine with Landing dropped. Tests are
genuine behavioral assertions, not over-asserting implementation detail. No blocking simplification
findings. No new out-of-scope defects observed.

STATUS: GREEN
