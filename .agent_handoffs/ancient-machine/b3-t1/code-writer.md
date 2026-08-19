---
feature: ancient-machine
task: b3-t1
agent: tdd-code-writer
updated: 2026-08-19T20:20:00Z
iteration: 1
---

## Implementation
FILES:
- paulmartin.dev/src/machine/faces/FaceIII.jsx (replaced 9-line stub)
- paulmartin.dev/src/machine/faces/FaceIII.css (new)

SUMMARY:
Implemented the three-reel slot machine for Face III plus the order-6 colored clue pair.
`REELS` is a 3x3 array built from `getProject(slug)` (reel 1: stargazer, pong, blank; reel 2:
the-16-spaces, solar-express, blank; reel 3: all blank). Local state `positions:[0,0,0]`;
`spin(reelIndex)` advances that index mod 3 and calls `play('grind')`. Each reel is one
`<button data-reel data-position>` wrapping a `.face3-reel__wheel` that rotates via inline
`rotateX(-120deg*position)`, containing three always-mounted `.face3-reel__slot` layers (each
`rotateX(120deg*i) translateZ(9rem)`) holding a `ReelFace` (`data-reel-face data-active
data-blank`). The order-6 clue hook is `<Clue order={6}>` with a render-prop returning only
`orderGlyph`, placed in reel 1 face 0 (Stargazer); the paired tinted letter is a plain `<span>`
rendering `directionLetter(moveByOrder(6).direction)`, placed in reel 2 face 0 (The 16 Spaces).
Both share the `.face3-clue-tint` class. Reduced motion is handled purely in CSS
(`.face3-reel__wheel` transition disabled under the media query); no JS branch.

MAPS_TO_BLUEPRINT:
- REELS content, positions state, spin/wrap, DIGIT_SLOT/LETTER_SLOT, Reel/ReelFace subcomponents,
  single FaceSurface region, org-as-text (no OrgTag), Clue reuse for the digit hook, directionLetter
  reuse for the paired letter — all as specified.
- One deviation from the interface sketch: research suggested `Reel({ faces, position, onSpin,
  digitClue, letterClue })`; I added an `index` prop (used for `data-reel={index}` and the click
  handler `onSpin={() => spin(reelIndex)}` built in the parent) — a labeling addition, not a
  behavior change; DOM order still identifies each reel per the test suite's `reelButtons(container)`
  ordering.

DEVIATIONS: none beyond the labeling addition above.

REUSED:
- machine/Clue.jsx (default + `directionLetter` export)
- machine/model.js `moveByOrder`
- machine/audio.jsx `useAudio().play`
- components/Still.jsx
- data/projects.js `getProject`
- machine/FaceSurface.jsx

## Expected result
TESTS: src/machine/faces/FaceIII.test.jsx (10 cases) — all pass.
BUILD: `npm --prefix paulmartin.dev test && npm --prefix paulmartin.dev run build` — both succeed
(full suite: 8 files / 79 tests passed; production build completes with no errors).

STATUS: READY_TO_VALIDATE
