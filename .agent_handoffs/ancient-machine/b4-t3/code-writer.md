---
feature: ancient-machine
task: b4-t3
agent: tdd-code-writer
updated: 2026-08-19T17:02:33-04:00
iteration: 1
---

## Implementation
FILES: [paulmartin.dev/src/machine/faces/FaceV.jsx, paulmartin.dev/src/machine/faces/FaceV.css]
SUMMARY: Replaced the FaceV stub with a sealed-slate sequence lock. `PAD_ORDER` (Left, Up, Right,
Down) drives four `[data-direction]` buttons whose glyphs come from `DIRECTION_GLYPH`, guarded at
module load against `DIRECTION_GLYPH`'s key set. `press(direction)` compares against
`SEQUENCE[progress]` (model.js): correct advances progress and plays shake+thunk (plus seam on the
6th/completing press, setting solved=true); any wrong press resets progress to 0 and plays
deadThunk, with no re-evaluation of the wrong press as a fresh match. A no-op guard on `solved`
freezes the lock once solved. A `.face5-slab` wrapper carries `data-solved` / `data-lock-progress`
and always mounts both `.face5-slab__sealed` (arrow pad + one `<Clue order={1} />` hook) and
`.face5-slab__solved` (celebration), flipping via a CSS class; FaceV.css crossfades instead of
flipping under `prefers-reduced-motion: reduce`, matching FaceII's pattern. The celebration reuses
`solvers` from data/solvers.js and mirrors Solved.jsx's copy (heading, lede, mailto CTA, conditional
solvers list) with no react-router Link, as an `<h2>` (FaceI keeps the page's single `<h1>`).
MAPS_TO_BLUEPRINT: All six blueprint points honored 1:1 (pad, state machine, flip-to-solved,
move-1 clue hook, celebration, audio). DOM contract for b5-t2 matches: four `[data-direction]`
buttons, `[data-solved]` wrapper, one `[data-clue-order]` hook (order 1 / Up).
DEVIATIONS: none
REUSED: SEQUENCE/moveByOrder (model.js), Clue + DIRECTION_GLYPH (Clue.jsx), useAudio (audio.jsx),
FaceSurface, solvers data (data/solvers.js). No audio.jsx or model.js edits.

## Expected result
TESTS: paulmartin.dev/src/machine/faces/FaceV.test.jsx — all 10 cases pass (verified: `npx vitest
run src/machine/faces/FaceV.test.jsx` -> 10 passed).
BUILD: `npm --prefix paulmartin.dev test` (113/113 passed) and `npm --prefix paulmartin.dev run
build` (succeeds) — both run and confirmed green.

STATUS: READY_TO_VALIDATE
