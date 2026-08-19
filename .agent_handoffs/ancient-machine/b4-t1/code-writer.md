---
feature: ancient-machine
task: b4-t1
agent: tdd-code-writer
updated: 2026-08-19T16:43:00-04:00
iteration: 1
---

## Implementation
FILES: [paulmartin.dev/src/machine/faces/FaceI.jsx (replaced stub), paulmartin.dev/src/machine/faces/FaceI.css (new)]
SUMMARY:
Filled the FaceI stub per blueprint: name h1 "Paul Martin"; Resume `<a>` (RESUME_URL from
model.js, target="_blank", rel="noopener noreferrer", aria-label="Resume") with the visible
label "resume" rendered through Clue (order=4, variant="underline") as one span per character,
underlining only the char at index order-1 via a `face1-resume__tell` class, with the fail-fast
check that "resume"[order-1] === directionLetter; Contact `<button>` wired to
`rotateTo(faceIndex('IV'))` via useMachine, no local audio call. FaceI.css adds the name/link/
button styling plus a specificity override (`.face1-resume__clue.clue--underline`) so the
Clue wrapper's own underline variant doesn't double-underline the whole word — only
`.face1-resume__tell` carries the underline.
MAPS_TO_BLUEPRINT: All four blueprint interfaces honored as specified — FaceI default export,
RESUME_URL import (not re-declared), Clue render-prop with the derived tell index and
fail-fast direction check, useMachine/faceIndex for the Contact->rotateTo seam. No new
exported module APIs, matching blueprint.
DEVIATIONS: none
REUSED: RESUME_URL (model.js:12-13), Clue render-prop mechanism (Clue.jsx:26-55), FaceSurface
(FaceSurface.jsx:3-11), useMachine + faceIndex (Machine.jsx:42-61, 59-61).

## Expected result
TESTS: paulmartin.dev/src/machine/faces/FaceI.test.jsx — all 5 cases (name-is-h1, resume-href,
resume-underline-tell, clue-hooks, contact-rotates-to-IV)
BUILD: `npx vitest run` (full suite, from paulmartin.dev/) and `npx vite build`

## Verification run
`npx vitest run src/machine/faces/FaceI.test.jsx` -> 1 file / 5 tests passed.
`npx vitest run` (full suite) -> 10 files / 93 tests passed.
`npx vite build` -> succeeded, 95 modules transformed, no errors.

STATUS: READY_TO_VALIDATE
