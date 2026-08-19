---
feature: ancient-machine
task: b1-t1
agent: tdd-test-writer
updated: 2026-08-19
iteration: 1
---

## Decision
WROTE
REASON: MOVES/SEQUENCE/moveByOrder and the Clue renderer are the clue-integrity mechanism the
whole puzzle depends on; a wrong table entry or a glyph/hook divergence silently breaks the solve.
Per TEST_RECOMMENDATION: write.

## Harness (owned by this task per research.md gap note)
- paulmartin.dev/package.json — added `"test": "vitest run"` and devDependencies vitest@4.1.11,
  jsdom@30.0.1, @testing-library/react@16.3.2, @testing-library/dom@10.4.1,
  @testing-library/jest-dom@7.0.1, @testing-library/user-event@14.6.5 (installed).
- paulmartin.dev/vite.config.js — switched to `vitest/config`, added `test: { environment: 'jsdom',
  globals: true, setupFiles: './vitest.setup.js', css: true }`.
- paulmartin.dev/vitest.setup.js (new) — `import '@testing-library/jest-dom/vitest'`.
- Verified `npm --prefix paulmartin.dev run build` still passes with the new vite.config.js.

## Tests
FILES:
  - paulmartin.dev/src/machine/model.test.js (new)
  - paulmartin.dev/src/machine/Clue.test.jsx (new)
FILES (minimal signature stubs, so tests compile/run and fail at assertion/throw, not at
module-resolution — code-writer fills these in):
  - paulmartin.dev/src/machine/model.js (new) — MOVES/SEQUENCE/RESUME_URL = undefined,
    moveByOrder throws 'unimplemented'
  - paulmartin.dev/src/machine/Clue.jsx (new) — DIRECTION_GLYPH = undefined, directionLetter and
    default Clue both throw 'unimplemented'
  - paulmartin.dev/src/machine/FaceSurface.jsx (new) — default export throws 'unimplemented'

CASES:
  - model.test.js: MOVES equals the exact 6-entry order/direction/faceId table — asserts: full
    table 1..6 (1/Up/V, 2/Right/III, 3/Left/II, 4/Up/I, 5/Down/IV, 6/Left/III)
  - model.test.js: MOVES orders are unique and span 1..6
  - model.test.js: SEQUENCE equals [Up,Right,Left,Up,Down,Left]
  - model.test.js: SEQUENCE equals MOVES sorted-by-order mapped to direction (derivation, not a
    standalone literal)
  - model.test.js: RESUME_URL equals the exact shared drive URL
  - model.test.js: moveByOrder(3) returns the order-3 entry
  - model.test.js: moveByOrder(9) throws
  - Clue.test.jsx: for each order 1..6, rendered data-clue-order/data-clue-direction equal that
    MOVES entry (6 parametrized cases)
  - Clue.test.jsx: rendered glyph contains DIRECTION_GLYPH[direction] derived from the MOVES entry
    (not an independently typed literal)
  - Clue.test.jsx: omitting `order` throws (fail-fast)
  - Clue.test.jsx: two different `variant`s for the same order emit identical data-clue-order/
    data-clue-direction (styling doesn't touch the hooks)
  - Clue.test.jsx: render-prop `children` is called with derived {order, direction} for that order
  - Clue.test.jsx: no aria-label/accessible-text path exposes the direction word
  - Clue.test.jsx (FaceSurface): renders children inside a `.face-surface` bordered panel

RUN: `npm --prefix paulmartin.dev test`
RED_CONFIRMED: yes
RED_OUTPUT:
  - model.test.js > MOVES > has 6 entries...: `AssertionError: expected undefined to deeply equal
    [...]` (MOVES undefined in stub)
  - model.test.js > SEQUENCE > is derived...: `TypeError: MOVES is not iterable`
  - model.test.js > moveByOrder > returns the entry...: `Error: unimplemented` thrown from
    model.js:8 (stub body)
  - Clue.test.jsx > order N emits data-clue-*: `Error: unimplemented` thrown from Clue.jsx:8
    during render, propagated through React's renderWithHooks/beginWork
  - Clue.test.jsx > FaceSurface > renders children...: `Error: unimplemented` thrown from
    FaceSurface.jsx:2 during render
  - 17 of 19 cases failed this way (assertion/thrown-stub, not module-resolution). The remaining 2
    (`moveByOrder(9) throws`, `Clue with omitted order throws`) pass trivially against an
    always-throwing stub — real coverage forces the code-writer to keep them true while making the
    other 17 pass with real values.
  - Full run: `Test Files 2 failed (2) | Tests 17 failed | 2 passed (19)`

## Stale tests
PRUNED: none
UPDATED: none
(No test files existed anywhere in the repo before this task — confirmed via `find . -iname
"*.test.*" -o -iname "*.spec.*"` outside node_modules/dist returning only the two files above.)

## Contract
model.js must export the real MOVES table (6 entries, order/direction/faceId per above), SEQUENCE
derived from it by sorting on order and mapping to direction, RESUME_URL as the exact shared drive
string, and moveByOrder(order) returning the matching entry or throwing for an order not present.
Clue.jsx must export a default `Clue({ order, variant, children, className, ...rest })` that
derives its entry via moveByOrder(order) (so a missing/invalid order throws), renders a wrapper
carrying `data-clue-order`/`data-clue-direction` from that entry, a glyph derived from
DIRECTION_GLYPH[direction] (never a re-typed literal), supports a render-prop `children` receiving
the derived values, keeps hooks identical across `variant`s, and exposes no aria-label / direction
text to assistive tech. FaceSurface.jsx must export a default component rendering its children
inside a bordered `.face-surface` panel.

STATUS: TESTS_RED
