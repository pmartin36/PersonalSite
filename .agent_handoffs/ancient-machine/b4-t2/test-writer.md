---
feature: ancient-machine
task: b4-t2
agent: tdd-test-writer
updated: 2026-08-19T16:51:00Z
iteration: 1
---

## Decision
WROTE
REASON: TEST_RECOMMENDATION=write; slide legality is real branching logic (adjacency on a 2x3
grid), and the arcane-tally stroke count / clue direction are integrity checks that must derive from
MOVES, not a hand-typed literal.

## Tests
FILES: [paulmartin.dev/src/machine/faces/FaceIV.test.jsx]
CASES:
  - "renders 6 cells: About, About, gap, Email, LinkedIn, GitHub, with the gap at cell 2" — asserts:
    initial arrangement and gap position (SUGGESTED_TESTS: initial-layout)
  - "slides a tile adjacent to the gap (About at cell 1) into the gap" — asserts: legal slide swaps
    tile/gap, other cells untouched (SUGGESTED_TESTS: slide-legal-adjacent)
  - "slides a tile adjacent to the gap (GitHub at cell 5) into the gap" — asserts: legal slide from
    the other adjacent cell (SUGGESTED_TESTS: slide-legal-adjacent)
  - "leaves the arrangement unchanged when a non-adjacent tile is clicked (About at cell 0)" —
    asserts: non-adjacent click is a no-op (SUGGESTED_TESTS: slide-illegal-nonadjacent)
  - "leaves the arrangement unchanged when a non-adjacent contact tile is clicked (Email at cell 3)"
    — asserts: non-adjacent contact-tile click is a no-op (SUGGESTED_TESTS: slide-illegal-nonadjacent)
  - "plays audio once on a legal slide and not at all on an illegal click" — asserts: play('grind')
    fires exactly once on a legal slide, never on a no-op (SUGGESTED_TESTS:
    audio-on-legal-slide-only)
  - "links to the expected Email, LinkedIn, and GitHub URLs" — asserts: contact tile hrefs
    (SUGGESTED_TESTS: contact-links)
  - "renders the About tiles as buttons, not links" — asserts: About tiles carry no link role
    (SUGGESTED_TESTS: contact-links)
  - "emits exactly one clue matching MOVES for face IV" — asserts: single data-clue-order/direction
    hook equals moveByOrder(5) (SUGGESTED_TESTS: clue-hooks)
  - "renders the order piece as one tally stroke per move order and the direction piece as the
    derived glyph" — asserts: stroke count === moveByOrder(5).order, direction piece ===
    DIRECTION_GLYPH.Down (SUGGESTED_TESTS: tally-stroke-count)
RUN: npx vitest run src/machine/faces/FaceIV.test.jsx  (from paulmartin.dev/)
RED_CONFIRMED: yes
RED_OUTPUT:
  - initial layout: `AssertionError: expected +0 to be 6` (cellsInfo finds zero [data-cell]
    elements against the current stub)
  - slide/audio/contact-link cases: `AssertionError: cell N exists: expected null not to be null`
    (cellAt guard fails cleanly — no [data-cell] wrapper exists yet)
  - clue hook: `AssertionError: expected +0 to be 1` (no [data-clue-order] rendered by the stub)
  - tally stroke: `AssertionError: expected +0 to be 5` (no .face4-tally__stroke elements)
  Each failure traces to exactly one missing piece of the not-yet-built contract; no test threw for
  an unrelated reason. Full suite run (`npx vitest run`) shows only these 10 fail; the other 93
  tests across 10 files stay green — no collateral breakage.
redKind: assertion — FaceIV.jsx already exists as a stub (FaceSurface + <h2>Face IV</h2>) so the
test file compiles and runs against real code; no signature stub was needed.

## Stale tests
PRUNED: none
UPDATED: none
Checked: grepped the whole suite for face4/FaceIV/faceId "IV"/moveByOrder(5) outside this file —
no other test references face IV's contract, hrefs, or move-5 clue. Feature has no pre-existing
tests per tasks.md.

## Contract
FaceIV renders a 2x3 grid of 6 `[data-cell="0".."5"]` wrappers (row-major: row = floor(i/3), col =
i%3). Each occupied cell carries `data-tile-kind="about"|"contact"`; the gap cell carries
`data-gap="true"` and no tile kind. Initial arrangement: cell0/1 = About buttons (no link role),
cell2 = gap, cell3/4/5 = Email/LinkedIn/GitHub links with hrefs `mailto:p@ulmartin.me`,
`https://www.linkedin.com/in/paul-martin-b8547616/`, `https://github.com/pmartin36`.

`adjacent(a, b)`: same row & |colA-colB|===1, OR same col & |rowA-rowB|===1. Clicking a tile whose
cell is adjacent to the gap swaps it into the gap and calls `play('grind')` exactly once; clicking a
non-adjacent tile is a no-op (arrangement unchanged, no audio call). From the initial gap at cell 2
the only legal slides are cell 1 and cell 5.

Exactly one clue hook on the face: a `<Clue order={5} variant="tally">` emitting
`data-clue-order="5"` / `data-clue-direction="Down"` (via moveByOrder, never a literal). Its render
prop renders `.face4-clue__order` containing `order` `.face4-tally__stroke` elements (5 vertical
strokes, no top/bottom bars) and `[data-clue-piece="direction"]` containing the derived
DIRECTION_GLYPH for the move's direction.

STATUS: TESTS_RED
