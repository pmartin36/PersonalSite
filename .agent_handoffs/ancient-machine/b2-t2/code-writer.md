---
feature: ancient-machine
task: b2-t2
agent: tdd-code-writer
updated: 2026-08-19
iteration: 1
---

## Implementation
FILES: [paulmartin.dev/src/machine/faces/FaceII.jsx, paulmartin.dev/src/machine/faces/FaceII.css]
SUMMARY:
Replaced the FaceII stub with three `Card` components mapped from `currentProjects`. Each card
root carries `data-flipped`, a `.face2-card` with front/back faces both always mounted
(`backface-visibility: hidden`, back at `rotateY(180deg)`), and a corner `<button
aria-pressed={flipped}>` sibling of the front's `Details` button that toggles local `flipped`
state and calls `useAudio().play('flip')` on every click. The Details button calls
`onOpen(project)` which lifts `modalProject` state in `FaceII` and conditionally renders
`<DetailModal project={modalProject} onClose={...} />`. Only the card at `CLUE_CARD_INDEX = 0`
renders `<Clue order={3} variant="seven-seg">` on its back with a render-prop that concatenates
`orderGlyph` + `directionLetter.toUpperCase()` ("3L"); the other two backs carry no clue element.
FaceII.css adds the 3D flip transform, a corner-hover wobble keyframe, and a
`prefers-reduced-motion: reduce` override that removes both the flip transition and the wobble.
MAPS_TO_BLUEPRINT:
- FaceII default export, no props, mounted via existing `<FaceSurface aria-label="Face II">` — honored.
- `Card({ project, showClue })` subcomponent, `CLUE_CARD_INDEX = 0` single const — honored (passed
  `onOpen` as an additional prop since the blueprint's DATA_FLOW requires the child to notify the
  parent which modal to open; not a deviation from the described data flow, just the prop needed
  to implement it).
- DOM contract `data-flipped`, corner `<button aria-label>` + `aria-pressed={flipped}` — honored.
- Reuse: `Still`, `OrgTag`, `DetailModal`, `Clue`, `useAudio`, `currentProjects` — all imported
  as-is, no re-implementation.
- `order={3}` is the only place move 3 is named; glyph text comes from the render-prop, never typed literally.
DEVIATIONS: none
REUSED: [src/components/Still.jsx, src/components/OrgTag.jsx, src/machine/DetailModal.jsx:47,
src/machine/Clue.jsx:36, src/machine/audio.jsx (useAudio/SOUNDS.flip), src/data/projects.js:currentProjects,
src/machine/FaceSurface.jsx]

## Expected result
TESTS: paulmartin.dev/src/machine/faces/FaceII.test.jsx (7 tests) — all pass.
BUILD: `npx vite build` from paulmartin.dev/ — succeeds.

Full suite (`npx vitest run` from paulmartin.dev/): 7 files, 69 tests, all pass — no regressions.

STATUS: READY_TO_VALIDATE
