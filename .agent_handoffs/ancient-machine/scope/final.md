---
feature: ancient-machine
agent: tdd-scope-validator
updated: 2026-08-19T18:40:00Z
iteration: 1
---

## Scope
BUCKET: FINAL (all buckets)
TASKS_REVIEWED: [b1-t1, b1-t2, b1-t3, b1-t4, b2-t1, b2-t2, b3-t1, b3-t2, b4-t1, b4-t2, b4-t3, b5-t1, b5-t2]

## Un-executed routes
All 13 tasks' latest validator.md STATUS == GREEN; 0 history entries (no task cycled). No
un-fixed named defect stands. Prior bucket reviews scope/bucket-b2..b5.md all Verdict PASS.

## Cross-bucket seam checks
- b4-t1 -> b1-t3 (Contact -> rotateTo, cross-bucket): FaceI imports real {useMachine, faceIndex}
  from Machine.jsx; rotateTo(faceIndex('IV'))=index 3. Build transforms clean despite the
  Machine<->FaceI circular import (bindings used at render/click time). — OK
- b2-t1 -> b1-t4 (modal vs scroll arbitration, cross-bucket): DetailModal portals to document.body,
  outside the machine root where useScrollNav's wheel listener attaches, so modal wheel never
  reaches the drum; bounded body scrolls natively. — OK
- b5-t2 -> every clue-bearing face + Face V lock (the whole-puzzle integration): wholePuzzle.test.jsx
  renders real <Machine/>, collects [data-clue-order] hooks, sorts by order, maps to
  data-clue-direction, asserts orders==[1..6] and reconstruct==SEQUENCE, then enters the COLLECTED
  (not literal) sequence into the Face V region and asserts data-solved="true" + celebration copy.
  Genuinely exercises the six-face seam. — OK
- Clue-integrity invariant (cross-cutting): grep confirms data-clue-order/data-clue-direction are
  emitted ONLY inside Clue.jsx:47-48 (from moveByOrder(order)); zero hand-typed hooks in any face
  or elsewhere. All five faces (I,II,III,IV,V) import and route clues through Clue. Glyph and hook
  cannot diverge by construction. Clue spans are aria-hidden (do not announce the answer). — OK
- Deliverable wiring: main.jsx routes "/" to <Machine/> (b1-t3). SEQUENCE derived from MOVES =
  [Up,Right,Left,Up,Down,Left] (model.js:1-10). Five faces exposed as regions in DOM order I..V;
  document h1 == "Paul Martin". Face V solved reveal renders /solved copy + solvers list. e2e
  evidence paulmartin.dev/e2e/puzzle-a11y.mjs exists; moss-1..4.png present in public/machine/.

INTEGRATION_TESTED: `npm --prefix paulmartin.dev test && npm --prefix paulmartin.dev run build`
-> Test Files 13 passed (13), Tests 119 passed (119), 0 failed; vite build 97 modules, exit 0.
Every failure line read: none. No cross-task stale-test drift (repo had no pre-existing tests;
all 119 are this feature's and green).

## Findings
- SEVERITY low — TASK b1-t1 — vitest.setup.js (owned by b1-t1's harness; broadened by b2-t1)
  stubs window.matchMedia to return `matches:true` for EVERY query, not only
  prefers-reduced-motion. Non-behavioral (production has real matchMedia; whole suite green), but
  a future test querying an unrelated media feature silently gets matches:true. Re-verified present
  in current tree. Already recorded in scope/bucket-b2.md. Nit — ROUTE → test-writer

## Verdict
PASS

STATUS: PASS
