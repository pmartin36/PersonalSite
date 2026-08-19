---
feature: ancient-machine
task: b5-t2
agent: tdd-validator
updated: 2026-08-19T22:30:00Z
iteration: 1
---

## Gate run
COMMAND: `npm --prefix paulmartin.dev test && npm --prefix paulmartin.dev run build`
EXIT_CODE: 0
GATE_PASSED: yes
OUTPUT:
- vitest: Test Files 13 passed (13); Tests 119 passed (119).
- The gated whole-puzzle proof (src/machine/wholePuzzle.test.jsx) ran inside the suite and passed:
  hook-count/orders == [1..6], hooks ordered by data-clue-order reconstruct SEQUENCE
  [Up,Right,Left,Up,Down,Left], entering the collected sequence into Face V flips data-solved="true"
  and shows the celebration; five regions Face I..Face V in DOM order; h1 == "Paul Martin".
- vite build: 97 modules transformed, built in ~570ms, dist emitted. Exit 0.

## Behavioral evidence
EXERCISED: Independently re-ran the reduced-motion + keyboard solvability evidence (NOT part of the
gate) against a fresh `vite build` + `vite preview` on port 4173:
`BASE=http://localhost:4173/ node e2e/puzzle-a11y.mjs` -> exit 0, printed PASS. Chromium launched with
reducedMotion:'reduce'; regions ["Face I".."Face V"] in DOM order; h1 "Paul Martin"; sequence read
from the live page's own data-clue-* hooks == [Up,Right,Left,Up,Down,Left]; Face V reached by keyboard
(pip focus + Enter) and solved by keyboard (arrow-button focus + Enter each); solved == "true"; zero
page/console errors. Artifacts (regenerated this run):
- paulmartin.dev/e2e/output/result.json (pass:true)
- paulmartin.dev/e2e/output/pre-solve.png — Face I resting, "Paul Martin" h1, resume link, Contact
  button, wayfinding pips (first lit), static frame, no shake/tumble (reduced motion).
- paulmartin.dev/e2e/output/solved.png — Face V celebration "You found the way through." + mailto,
  last pip lit.
Both screenshots visually inspected and show the real deliverable (settled frames, not blank/mid-fade).
The clue-integrity FAIL-on-mutation contract is demonstrated by the RED-on-mutation record in
test-writer.md/code-writer.md (order-3 -> order-4 flip broke 3 assertions, reverted); FaceII.jsx is
unmodified in git working tree, confirming revert.

## Simplification review
BLOCKING: none
ADVISORY:
- e2e/puzzle-a11y.mjs collects both pageerror and console-error into one `errors` array; fine for an
  evidence script. No change needed.
- wholePuzzle.test.jsx has two small sort-by-data-clue-order duplications (collectSequence + the
  first test's inline sort); acceptable for readability in a test file. No change needed.

## Verdict
GREEN
DIAGNOSIS: Gate ran and exited 0 (119/119 tests + build). The behavioral half not covered by the gate
(reduced-motion, keyboard-only solve, DOM-order regions) was independently reproduced against a fresh
preview and visually confirmed via the two settled screenshots. b5-t2 added only its proof test and the
e2e evidence script; no production source changed (the M-marked machine files belong to sibling b5-t1).
No blocking simplification findings. Out-of-scope LOW defects were already registered in tasks.md
DEFECTS by upstream tasks; none owned by b5-t2.

STATUS: GREEN
