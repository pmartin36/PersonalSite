---
feature: ancient-machine
task: b4-t2
agent: tdd-code-writer
updated: 2026-08-19T17:00:00Z
iteration: 1
---

## Implementation
FILES:
- paulmartin.dev/src/machine/faces/FaceIV.jsx (replaced stub with the sliding-puzzle face)
- paulmartin.dev/src/machine/faces/FaceIV.css (new)

SUMMARY:
Implemented the 2x3 sliding-tile puzzle per the blueprint. `INITIAL_TILES` holds the six-cell
row-major arrangement (About, About, gap, Email, LinkedIn, GitHub). `adjacent(a, b)` implements the
row/col adjacency check; `trySlide(cellIndex)` swaps the clicked tile into the gap and calls
`play('grind')` only when the click targets a cell adjacent to the gap, otherwise it is a no-op with
no state change and no audio. About tiles render as `<button>`; contact tiles render as real `<a>`
whose href is always the live URL, with `onClick` suppressing navigation and routing into `trySlide`
only when the tile sits next to the gap. A single always-mounted `<Clue order={5} variant="tally">`
on `.face4-backplate` emits the move-5 hook, with the render-prop composing `order` tally strokes and
the derived `directionGlyph`, absolutely positioned via CSS at the two named seams (row1 col1|col2 for
the order piece, row2 col2|col3 for the direction piece), behind the grid (`z-index: 0` vs `1`).

MAPS_TO_BLUEPRINT:
- Tile model / slide state machine / rendering / clue / audio: all five blueprint sections
  implemented as specified, no signature deviation.
- Reused Clue, FaceSurface, useAudio, moveByOrder (via Clue) exactly as directed; no new
  data-clue-* construction outside Clue.

DEVIATIONS: none

REUSED:
- Clue.jsx (default export + render-prop) for the move-5 hook.
- FaceSurface.jsx wrapper.
- useAudio().play for the slide SFX ('grind', a valid SOUNDS key).
- machine.css `.clue--tally` variant (existing) via the `variant="tally"` prop.
- Contact hrefs match Landing.jsx's existing Email/LinkedIn values; GitHub href is the new
  `https://github.com/pmartin36` value the blueprint flagged (not spec-locked, reasonable default).

## Expected result
TESTS: paulmartin.dev/src/machine/faces/FaceIV.test.jsx — all 10 cases green.
BUILD: `npm --prefix paulmartin.dev test && npm --prefix paulmartin.dev run build` succeeds
(verified: 103/103 tests pass across the suite, no collateral breakage; `vite build` completes).

STATUS: READY_TO_VALIDATE
