---
feature: ancient-machine
task: b3-t2
agent: tdd-code-writer
updated: 2026-08-19T20:35:00Z
iteration: 1
---

## Implementation
FILES:
- paulmartin.dev/src/machine/seamGlyphs.js (filled the RED stub: real REEL_EDGES grid, real `complete`)
- paulmartin.dev/src/machine/faces/FaceIII.jsx (edge layers on ReelFace + always-mounted order-2 seam-clue overlay)
- paulmartin.dev/src/machine/faces/FaceIII.css (`.face3-edge`, `.face3-seam-clue`/`--aligned`, `.face3-reels` positioning)

SUMMARY:
- seamGlyphs.js: every `REEL_EDGES[reel][face]` gets a globally-unique decoy `left`/`right` id
  (`decoy:<reel>:<face>:<side>`). The winning triple `[0, 2, 1]` (reel1 face0, reel2 face2, reel3
  face1 — matches research's derivation and spec:110-111) has its marks overwritten with the two
  real half-glyphs, derived from `moveByOrder(2)` via `directionLetter` (never hand-typed): number
  seam `${String(move2.order)}:L`/`:R` between reel1|reel2, direction seam
  `${directionLetter(move2.direction)}:L`/`:R` between reel2|reel3. `complete()` matches only the
  `:L`/`:R` suffix pair for the same glyph, so decoys (format `decoy:...`) never accidentally
  resolve. `findAlignments`/`resolveSeams`/`WINNING` logic was already correct in the stub — only
  the data and `complete()` needed filling in.
- FaceIII.jsx: `ReelFace` now takes `reelIndex`/`faceIndex`, looks up `REEL_EDGES[reelIndex][faceIndex]`,
  and renders two `<span className="face3-edge" data-edge="left|right" aria-hidden="true">` layers
  behind face content on every one of the 9 faces (project and blank alike). `Reel` passes
  `reelIndex={index}` / `faceIndex` through to each `ReelFace`. An always-mounted
  `<Clue order={2}>` renders as `.face3-seam-clue` inside `.face3-reels` (sibling of the three reel
  buttons, not gated behind alignment); its class gains `face3-seam-clue--aligned` when `positions`
  deep-equals `WINNING.positions` (computed via `Array.prototype.every`, same pattern as the test).
- FaceIII.css: `.face3-edge` absolute-positioned at each face's left/right border, `z-index: 0`
  (face still/body promoted to `z-index: 1` so etching stays behind content); `.face3-seam-clue`
  absolute-positioned within `.face3-reels` (now `position: relative`), `opacity: 0` by default,
  `opacity: 1` when `--aligned`.

MAPS_TO_BLUEPRINT:
- REEL_EDGES/resolveSeams/findAlignments/WINNING signatures: unchanged from the stub, honored as
  specified.
- Winning-glyph derivation from MOVES order 2 (not hand-typed): honored — `NUMBER_GLYPH`/
  `DIRECTION_GLYPH` come from `moveByOrder(2)` + `directionLetter`.
- `<Clue order={2}>` as the sole construction site, order-only input: honored — no hand-typed "2",
  "r", "Right".
- Always-mounted order-2 hook, decoupled from the visual reveal: honored — the `<Clue>` element is
  unconditionally rendered; only its CSS class toggles.
- Edge marks aria-hidden, behind content, non-interactive: honored.
- No 6th aria-labelled region: honored — edges/seam-clue are `<span>`, not `<section>`.
DEVIATIONS: none

REUSED:
- machine/Clue.jsx `Clue` component and exported `directionLetter` (no hand-typed direction/order
  strings anywhere in seamGlyphs.js or FaceIII.jsx).
- machine/model.js `moveByOrder` (source of truth for the winning number/direction).
- b3-t1's existing `Reel`/`ReelFace`/`REELS`/`spin` structure in FaceIII.jsx — extended in place,
  not restructured.

## Expected result
TESTS: src/machine/seamGlyphs.test.js (5 cases), src/machine/faces/FaceIII.test.jsx (all cases,
  including the 4 new order-2/edge cases and the stale-test fix already applied by test-writer) —
  all GREEN. Verified: `npx vitest run src/machine/seamGlyphs.test.js src/machine/faces/FaceIII.test.jsx`
  -> 19 passed. Full suite `npx vitest run` -> 88 passed (0 regressions vs the pre-task 80 passed).
BUILD: `npm --prefix paulmartin.dev test && npm --prefix paulmartin.dev run build` (the feature's
  GATE_COMMAND) — ran in full, exit 0.

STATUS: READY_TO_VALIDATE
