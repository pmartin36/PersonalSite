---
feature: ancient-machine
agent: tdd-scope-validator
updated: 2026-08-19T17:07:00-04:00
iteration: 1
---

## Scope
BUCKET: b4
TASKS_REVIEWED: [b4-t1, b4-t2, b4-t3]

## Seam checks
- b4-t1 -> b1-t3 (Contact -> rotateTo, cross-bucket): FaceI.jsx:3,10,46 imports the real
  {useMachine, faceIndex} from Machine.jsx and calls rotateTo(faceIndex('IV')). Machine.jsx:42-46
  exports faceIndex (FACES ['I','II','III','IV','V'] -> 'IV'=3) and useMachine():59-61 supplies the
  live rotateTo:74-88. In production FaceI mounts inside MachineContext.Provider (Machine.jsx:140,163)
  so rotateTo is real. Circular import (Machine<->FaceI) resolves: bindings used only at
  render/click time, build transformed 97 modules clean. — OK
- b4-t1 -> b1-t1 (RESUME_URL + move-4 clue): imports shared RESUME_URL (model.js:12), routes the
  clue through Clue order=4 (moveByOrder(4)={4,Up,I}); render-prop fail-fast confirms
  'resume'[3]==='u'. data-clue-order=4/direction=Up emitted by Clue span. No re-typed literal. — OK
- b4-t2 -> b1-t1 (move-5 tally clue): FaceIV.jsx:112 Clue order=5 (moveByOrder(5)={5,Down,IV}),
  renders `order` strokes + directionGlyph; data-clue-order=5/direction=Down from MOVES. — OK
- b4-t2 -> b1-t2 (slide audio): play('grind'); 'grind' is a real SOUNDS key (audio.jsx:57). — OK
- b4-t3 -> b1-t1 (lock vs SEQUENCE + move-1 hook): FaceV.jsx:5,74 validates presses against
  SEQUENCE[progress] (model.js:10); Clue order=1 emits data-clue-order=1/direction=Up. PAD_ORDER
  carries all four directions, guarded against DIRECTION_GLYPH. — OK
- b4-t3 -> b1-t2 (lock audio): play('shake'|'thunk'|'seam'|'deadThunk') all real SOUNDS keys
  (audio.jsx:53-61); play() throws on unknown, so a typo would fail the gate. — OK
- Whole-puzzle hook seam (feeds b5-t2): b4 owns 3 of 6 hooks — I:4/Up, IV:5/Down, V:1/Up — each a
  single data-clue-* pair sourced from MOVES, consistent with SEQUENCE reconstruction. — OK
INTEGRATION_TESTED: `npm --prefix paulmartin.dev test` -> 12 files / 113 tests passed;
`npm --prefix paulmartin.dev run build` -> 97 modules, built in 589ms, exit 0. Targeted
FaceI/FaceIV/FaceV suites -> 25/25 passed. Full suite read for cross-task drift: zero failures.

## Findings
none — every dependency edge wires into the real, current API of its dependency; all three
code-writers reported DEVIATIONS none and the code confirms it; no stale test surfaced in the
full-suite run (there are no pre-existing tests to drift, per tasks.md).

## Verdict
PASS

STATUS: PASS
