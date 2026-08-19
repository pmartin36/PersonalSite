---
feature: ancient-machine
task: b5-t2
agent: tdd-test-writer
updated: 2026-08-19T22:14:43Z
iteration: 1
---

## Decision
WROTE
REASON: This is the spec's gated clue-integrity build contract (a mislabeled clue must fail the
build, not surface at solve time) plus DOM-order/keyboard-semantics proof; TEST_RECOMMENDATION is
write and the task exists solely to author this proof.

## Tests
FILES: [paulmartin.dev/src/machine/wholePuzzle.test.jsx (new)]
CASES:
  - hook-count-and-orders — asserts: sorted data-clue-order values across the whole rendered
    <Machine/> tree equal [1..SEQUENCE.length] (no duplicate, none missing)
  - reconstruct-sequence — asserts: the six hooks, ordered by data-clue-order, map to directions
    equal to SEQUENCE (imported from model.js, never a literal)
  - solve-from-collected — asserts: entering the COLLECTED sequence into Face V's pad (scoped to
    the Face V region) flips [data-solved] to "true" and shows the celebration copy
  - regions-in-dom-order — asserts: the five face regions' aria-labels are Face I..Face V in DOM order
  - name-is-h1 — asserts: the document's level-1 heading is "Paul Martin"
RUN: npx vitest run src/machine/wholePuzzle.test.jsx  (from paulmartin.dev/)
RED_CONFIRMED: yes
RED_OUTPUT: |
  All dependency tasks (b1-t3, b1-t4, b2-t2, b3-t1, b3-t2, b4-t1, b4-t2, b4-t3) are already
  implemented, so against the real, unmodified code the five tests above are GREEN today — the
  puzzle is honestly wired. Per this task's own contract ("the proof must FAIL if any hook is
  mutated to a wrong direction"), RED was confirmed by a temporary, reverted mutation instead: in
  FaceII.jsx the seven-seg clue's `<Clue order={3} .../>` was changed to `<Clue order={4} .../>`
  (simulating a face wiring its clue to the wrong MOVES entry). Re-running against that mutation:

    FAIL hook-count-and-orders
      expected [ 1, 2, 4, 4, 5, 6 ] to deeply equal [ 1, 2, 3, 4, 5, 6 ]
    FAIL reconstruct-sequence
      expected [ 'Up', 'Right', 'Up', 'Up', 'Down', 'Left' ] to deeply equal
      [ 'Up', 'Right', 'Left', 'Up', 'Down', 'Left' ]
    FAIL solve-from-collected
      expected 'false' to be 'true'

  All three clue-integrity assertions failed for the injected defect and nothing else; the two
  DOM-order/semantics tests were unaffected, as expected. The mutation was reverted immediately
  after capturing this output (`git diff` on FaceII.jsx is empty); the committed test file asserts
  against the real code, which is currently GREEN because every upstream face task already wired
  its hook correctly.

## Stale tests
PRUNED: none
UPDATED: none
(This task adds a new cross-component proof; it changes no existing contract, so nothing in the
suite goes stale. Grepped the suite for direct callers of Clue/moveByOrder outside their own face
test files — none found; each face's own test still exercises that face's own hooks in isolation,
which is a different, still-valid concern from this whole-assembly reconstruction.)

## Contract
Render the whole assembled <Machine/>. Across the tree there must be exactly one data-clue-order
per SEQUENCE position (no duplicate, none missing); ordered by data-clue-order the hooks'
data-clue-direction values must equal SEQUENCE (imported, never a literal); entering that collected
sequence into Face V's pad must reach [data-solved="true"] with the celebration shown; the five
face regions must appear in DOM order Face I..Face V; the document's h1 must read "Paul Martin".
No production code is required for this contract — it already holds. If a future change to any
face's clue wiring, to model.js, or to Face V's lock breaks any of these five assertions, that
failure routes back to the owning face task, not to this one. The remaining deliverable for this
task, `paulmartin.dev/e2e/puzzle-a11y.mjs` (captured Playwright evidence for reduced-motion +
keyboard solvability, not part of the gate), is left for the code-writer per the blueprint.

STATUS: TESTS_RED
