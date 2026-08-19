---
feature: ancient-machine
task: b4-t3
agent: tdd-test-writer
updated: 2026-08-19
iteration: 1
---

## Decision
WROTE
REASON: Behavioral state machine (sequence lock with reset-on-wrong-press, audio side effects,
flip-to-solved reveal) per TEST_RECOMMENDATION and blueprint SUGGESTED_TESTS.

## Tests
FILES: [paulmartin.dev/src/machine/faces/FaceV.test.jsx]
CASES:
  - "renders exactly four arrow buttons..." — asserts: four `[data-direction]` buttons, one per
    DIRECTION_GLYPH key, button text === derived glyph (not hand-typed)
  - "solves on the full correct SEQUENCE..." — asserts: clicking SEQUENCE (read from model.js, not
    a literal) sets `[data-solved]="true"` and renders the celebration heading text
  - "a wrong first press resets progress to 0..." — asserts: one wrong press -> data-lock-progress
    "0", not solved
  - "a wrong press at step 3 resets... even when it equals SEQUENCE[0]" — asserts: a wrong press
    that happens to equal SEQUENCE[0] still resets to 0, not to 1 (pins "no re-evaluation as a
    fresh first press")
  - "one Up press from a fresh state advances progress to 1" — asserts: gimme move 1 reachable by
    mashing
  - "an extra press after solving leaves the solved state unchanged" — asserts: no-op once solved
  - "plays shake and thunk on a correct advance" — asserts: play('shake'), play('thunk'), not
    play('deadThunk')
  - "plays deadThunk, not shake, on a wrong press" — asserts: play('deadThunk'), not play('shake')
  - "plays seam in addition to shake and thunk on the completing press" — asserts: the 6th correct
    press also calls play('seam')
  - "emits exactly one clue hook equal to MOVES order 1 (Up)" — asserts: exactly one
    `[data-clue-order]`, value === moveByOrder(1).order/.direction
RUN: npx vitest run src/machine/faces/FaceV.test.jsx  (from paulmartin.dev/)
RED_CONFIRMED: yes
RED_OUTPUT: All 10 tests fail against the current FaceV.jsx stub (renders only `<h2>Face V</h2>` in
a FaceSurface, no arrow pad / lock / clue). Failures are assertion-level, each pinning one contract:
  - "arrow button for Up exists: expected null not to be null" (pad-buttons / lock / audio /
    gimme / no-op-after-solved cases) — no `[data-direction]` buttons exist yet
  - "expected +0 to be 1 // Object.is equality" (clue-hook case) — no `[data-clue-order]` element
    exists yet
No stub needed: FaceV.jsx already exists and compiles (it's b1-t3's rendered stub); the tests fail
on missing DOM contract, not a missing symbol.

## Stale tests
PRUNED: none
UPDATED: none
(FaceV.jsx is an unfilled stub with no prior asserted behavior; Machine.test.jsx's "Face V" aria-
label assertions target FaceSurface's aria-label, which this task's blueprint does not change —
verified unaffected.)

## Contract
FaceV must render, inside `<FaceSurface aria-label="Face V">`:
- An always-mounted lock wrapper carrying `data-solved` ("true"|"false") and `data-lock-progress`
  (integer as string).
- Four `<button data-direction={dir} aria-label={dir}>{DIRECTION_GLYPH[dir]}</button>`, one per
  direction in DIRECTION_GLYPH (Clue.jsx), laid out in a single row.
- press(direction): if solved, no-op. Else compare to SEQUENCE[progress] (model.js). Correct ->
  progress+1, play('shake'), play('thunk'); on reaching SEQUENCE.length also play('seam') and set
  solved=true. Wrong (any mismatch, including a press equal to SEQUENCE[0]) -> progress resets to
  0, play('deadThunk').
- Exactly one `<Clue order={1} />` hook (order 1 = Up, per moveByOrder(1)), always mounted.
- On solved=true, an always-mounted celebration panel renders the /solved message (heading "You
  found the way through.", lede + mailto, and the solvers list when non-empty) with no
  react-router Link.

STATUS: TESTS_RED
