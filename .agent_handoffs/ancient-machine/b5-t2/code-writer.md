---
feature: ancient-machine
task: b5-t2
agent: tdd-code-writer
updated: 2026-08-19T22:21:05Z
iteration: 1
---

## Implementation
FILES:
- paulmartin.dev/e2e/puzzle-a11y.mjs (new) — captured-evidence Playwright script
- paulmartin.dev/e2e/.gitignore (new) — ignores e2e/output/ (screenshots/log), mirroring the
  repo's existing plans/-is-local-only convention
- paulmartin.dev/e2e/output/*.png, result.json (new, gitignored) — captured artifacts for the
  validator: pre-solve.png, solved.png, result.json

No production source under paulmartin.dev/src was edited. The GATED proof
(paulmartin.dev/src/machine/wholePuzzle.test.jsx) was already written by the test-writer and is
GREEN against the real, unmodified code — every upstream face already wires its clue hook
correctly, so this task's only remaining deliverable was the Playwright evidence script.

SUMMARY:
puzzle-a11y.mjs launches Chromium with `reducedMotion: 'reduce'`, loads the built site (`vite
preview`), asserts the five face regions are present as `<section aria-label>` elements in DOM
order, reads the document h1, screenshots the resting (Face I) frame, collects the six
`data-clue-*` hooks straight from the page (never a literal), reaches Face V by keyboard via its
"Go to Face V" wayfinding pip (focus + Enter), then enters the collected sequence into Face V's
pad by keyboard (focus + Enter on each arrow button), waits for the reduced-motion opacity
transitions to settle before each screenshot, and writes a JSON summary
(regions/h1/sequence/solved/errors/pass) plus pre-solve.png and solved.png to e2e/output/.

MAPS_TO_BLUEPRINT:
- Deliverable (1), the GATED vitest proof — already satisfied by test-writer's file; re-verified
  green (5/5) and re-confirmed it goes RED on a temporary mutation (see below), then reverted.
- Deliverable (2), the Playwright evidence script — implemented at e2e/puzzle-a11y.mjs exactly per
  blueprint: reduced-motion context, five regions in DOM order, keyboard-only solve using the
  page's own hooks, screenshots of a pre-solve and the solved celebration frame.
- INTERFACES: none added, per blueprint (consumes Machine/SEQUENCE/DOM hooks only).

DEVIATIONS:
- The blueprint's SUGGESTED_EVIDENCE didn't call out CSS-transition timing. An early version of
  the script screenshotted immediately after the keyboard presses and captured a mid-transition
  frame (still showing Face I's content despite Face V already being the React-active face) because
  the reduced-motion opacity crossfade (0.3s) hadn't settled yet. Fixed by waiting on
  `getComputedStyle(...).opacity === '1'` for both the face crossfade and the solved-panel
  crossfade before each screenshot. Purely an evidence-script correctness fix, not a blueprint
  deviation in scope.

REUSED:
- SEQUENCE (model.js) and Machine (Machine.jsx) — evidence script imports neither directly (runs
  against the built page) but reconstructs the sequence from the same six DOM hooks the vitest
  proof reads, per blueprint.
- Testing Library patterns already used by wholePuzzle.test.jsx (test-writer's file, unedited) —
  region-scoped queries, no hardcoded direction/order literals.
- Playwright-via-createRequire pattern for resolving the app's own node_modules/playwright —
  matches plans/intro-path/shoot.mjs and plans/intro-path/check-escort.mjs.

## Expected result
TESTS: npx vitest run src/machine/wholePuzzle.test.jsx (from paulmartin.dev/) — 5/5 pass against
the real, unmodified code.
BUILD: `npm --prefix paulmartin.dev test` — 13 files / 119 tests pass. `npx vite build` (from
paulmartin.dev/) succeeds.

## Evidence captured (behavioral, task is BEHAVIORAL)
Ran: `npx vite build && npx vite preview --port 4173` then
`BASE=http://localhost:4173/ node e2e/puzzle-a11y.mjs` (from paulmartin.dev/).
Output: `PASS` — regions ["Face I".."Face V"] in DOM order, h1 "Paul Martin", collected sequence
[Up,Right,Left,Up,Down,Left] (read from the live page, matches SEQUENCE), solved: true, no page
errors.
Artifacts: paulmartin.dev/e2e/output/pre-solve.png (resting on Face I, no shake/tumble — reduced
motion), paulmartin.dev/e2e/output/solved.png (Face V celebration, "You found the way through."),
paulmartin.dev/e2e/output/result.json (machine-readable summary).

## RED-on-mutation demonstration (temporary, reverted)
Per the task's own contract ("must FAIL if any hook is mutated to a wrong direction"), re-ran the
demonstration test-writer already used: in FaceII.jsx changed `<Clue order={3} .../>` to
`<Clue order={4} .../>` (line 68). Re-running wholePuzzle.test.jsx: 3 of 5 tests failed exactly as
expected —
  hook-count-and-orders: `[1,2,4,4,5,6]` != `[1,2,3,4,5,6]`
  reconstruct-sequence: `[Up,Right,Up,Up,Down,Left]` != SEQUENCE
  solve-from-collected: `data-solved` stayed `false`
The two DOM-order/semantics tests were unaffected, as expected. Reverted immediately via
`git checkout -- src/machine/faces/FaceII.jsx` (confirmed clean diff after revert; full suite
re-ran green, 119/119).

STATUS: READY_TO_VALIDATE
