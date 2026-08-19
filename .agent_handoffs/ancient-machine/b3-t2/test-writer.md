---
feature: ancient-machine
task: b3-t2
agent: tdd-test-writer
updated: 2026-08-19T20:27:04Z
iteration: 1
---

## Decision
WROTE
REASON: TEST_RECOMMENDATION=write is correct — "exactly one alignment" is a checkable data
invariant that silently breaks (0 or >1 winners, or a winner that doesn't equal MOVES order 2) if
the decoy/winning half-mark assignment is wrong, and the visible aligned-vs-garbled state is the
whole point of the clue.

## Tests
FILES:
  - paulmartin.dev/src/machine/seamGlyphs.js (new — minimal stub: REEL_EDGES of empty `{}` faces,
    `complete()` always returns null, `resolveSeams`/`findAlignments`/`WINNING` wired against that
    stub so the module compiles and every real case fails at the assertion, not at import)
  - paulmartin.dev/src/machine/seamGlyphs.test.js (new)
  - paulmartin.dev/src/machine/faces/FaceIII.test.jsx (edited — stale-test fix + new cases)
CASES:
  seamGlyphs.test.js:
  - "every reel face carries a non-empty left and right edge mark" — asserts REEL_EDGES[r][f].left
    and .right are truthy for all 9 faces
  - "findAlignments returns exactly one winning combination" — asserts findAlignments().length === 1
  - "the winning combination resolves to the MOVES order-2 reading" — asserts WINNING.number ===
    String(moveByOrder(2).order) and WINNING.direction === directionLetter(moveByOrder(2).direction)
  - "resolveSeams reports aligned at the winning positions" — asserts resolveSeams(WINNING.positions).aligned === true
  - "resolveSeams reports not-aligned at every other position triple" — brute-forces all 27 combos,
    asserts aligned === false everywhere except WINNING.positions (passes trivially against the
    stub since it always returns false; will hold as a real check once the code-writer fills
    REEL_EDGES, so it stays in the suite as the negative half of the invariant)
  FaceIII.test.jsx (added; existing cases otherwise unchanged):
  - "every reel face renders a left and right edge mark, behind content and hidden from AT" —
    asserts all 9 `[data-reel-face]` elements contain `[data-edge="left"]` / `[data-edge="right"]`,
    both `aria-hidden="true"`
  - "renders a clue hook at order 2, matching MOVES direction Right, without spinning any reel" —
    asserts `[data-clue-order="2"]` exists at default mount with `data-clue-direction="Right"`
  - "spinning to the winning combination shows the aligned/clean-read state" — clicks each reel to
    WINNING.positions, asserts `.face3-seam-clue` gets class `face3-seam-clue--aligned`
  - "a non-winning combination does not show the aligned/clean-read state" — spins to
    WINNING.positions then one extra click on reel 0 (guaranteed off-winning regardless of what
    WINNING turns out to be), asserts the aligned class is absent
  DECLINED: the "winning triple is a MIX, not all-blank" property (spec design note, not in the
  DELIVERABLE's two named test obligations) — REELS content isn't exported from FaceIII.jsx, and
  the DELIVERABLE only requires exactly-one-alignment + the alignment resolving to MOVES order 2,
  both covered above; the mix property is the aligned + non-aligned screenshot evidence instead.
RUN: npx vitest run src/machine/seamGlyphs.test.js src/machine/faces/FaceIII.test.jsx
RED_CONFIRMED: yes
RED_OUTPUT:
  seamGlyphs.test.js > "every reel face carries a non-empty left and right edge mark":
    AssertionError: expected undefined to be truthy (face.left, stub REEL_EDGES faces are `{}`)
  seamGlyphs.test.js > "findAlignments returns exactly one winning combination":
    AssertionError: expected +0 to be 1 (stub `complete()` never resolves a seam)
  seamGlyphs.test.js > "the winning combination resolves to the MOVES order-2 reading":
    AssertionError: expected null to be '2' (WINNING falls back to number:null)
  seamGlyphs.test.js > "resolveSeams reports aligned at the winning positions":
    AssertionError: expected false to be true
  FaceIII.test.jsx > "every reel face renders a left and right edge mark...":
    AssertionError: expected null to be truthy (no `.face3-edge`/`[data-edge]` rendered yet)
  FaceIII.test.jsx > "renders a clue hook at order 2...":
    AssertionError: expected null to be truthy (no `[data-clue-order="2"]` in FaceIII.jsx yet)
  FaceIII.test.jsx > "spinning to the winning combination shows the aligned/clean-read state":
    AssertionError: expected null to be truthy (no `.face3-seam-clue` rendered yet)
  FaceIII.test.jsx > "a non-winning combination does not show the aligned/clean-read state":
    AssertionError: expected null to be truthy (same — element doesn't exist)
  Full-suite run (`npx vitest run`): 8 failed (exactly the 8 above) | 80 passed — no regressions
  from the FaceIII.test.jsx stale-test edit; every pre-existing test in the repo stays green.

Each red case pins exactly one contract: seamGlyphs' data/logic (invariant + MOVES equality) is red
because the stub's data/logic is intentionally absent, not because of an unrelated fixture failure.
The four FaceIII.test.jsx cases are red because the elements the task must add (`[data-edge]`,
`[data-clue-order="2"]`, `.face3-seam-clue`) do not exist in the current FaceIII.jsx — genuine
production-code absence, no test-side stub needed on that file.

## Stale tests
UPDATED: [paulmartin.dev/src/machine/faces/FaceIII.test.jsx:116-124 — "renders exactly one clue
  hook at order 6" counted `[data-clue-order]` total (== 1) and indexed `clues[0]`; this task adds
  a second hook (order 2), which would push the count to 2 and make `clues[0]` DOM-order-dependent.
  Rewritten to query `[data-clue-order="6"]` directly, matching the pattern the sibling order-6 test
  already used a few lines below it. Confirmed the rewritten assertion still passes against current
  code (it's a widen-not-break fix, not new RED).]
PRUNED: none
Whole-suite grep for `data-clue-order` / `order={2}` / `seamGlyphs` / `face3-edge` / `face3-seam`
turned up only Clue.test.jsx's own order=2 fixtures (unit tests of Clue itself, unaffected) and
FaceII.test.jsx's single-hook query (scoped to FaceII's own isolated render, untouched by this
task) — no other stale sites.

## Contract
- `seamGlyphs.js` exports `REEL_EDGES` (3x3 grid of `{left, right}` half-mark ids, every face
  non-empty), `resolveSeams(positions)` -> `{number, direction, aligned}`, `findAlignments()` ->
  array over all 27 combos, `WINNING` = the single alignment, derived (not hand-typed) so its
  `number`/`direction` equal `moveByOrder(2)`'s order/direction via `directionLetter`.
- `findAlignments()` has length exactly 1; `resolveSeams` is aligned only at `WINNING.positions`.
- `FaceIII.jsx` renders a `[data-edge="left"]` and `[data-edge="right"]` mark (aria-hidden, behind
  content) on every one of the 9 reel faces, and an always-mounted `<Clue order={2}>` hook
  (`data-clue-order="2"`, `data-clue-direction="Right"`) present without spinning any reel.
- A `.face3-seam-clue` element gains class `face3-seam-clue--aligned` only when `positions` equals
  `WINNING.positions`, and lacks it otherwise.
