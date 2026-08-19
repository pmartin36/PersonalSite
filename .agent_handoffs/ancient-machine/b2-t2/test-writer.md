---
feature: ancient-machine
task: b2-t2
agent: tdd-test-writer
updated: 2026-08-19
iteration: 1
---

## Decision
WROTE
REASON: TEST_RECOMMENDATION: write. Interactive flip state machine, Details-vs-corner-control
distinction, and the clue-integrity half of Face II (exactly one order-3/Left hook) are exactly
the kind of branching contract the pipeline's default bar calls for.

## Tests
FILES: [paulmartin.dev/src/machine/faces/FaceII.test.jsx (new)]
CASES:
  - renders one card per currentProjects entry, front-up — asserts: 3 `[data-flipped]` roots, all
    `data-flipped="false"` on mount.
  - every card flips to its back then home via the corner control, playing flip audio on both
    transitions — asserts: for each of the 3 cards independently, corner click -> `data-flipped`
    true + `aria-pressed` true on every corner control in that card, second corner click -> back
    to false; `play('flip')` called exactly 2x per card (6 total), always with `'flip'`.
  - flipping a card does not open its detail modal — asserts: after a corner click, no `dialog`
    role is present.
  - card N (slug) Details button opens the <Name> modal without flipping the card — one case per
    currentProjects entry (3 cases; the whole symmetric set, not just the first) — asserts: the
    Details button inside card N's root opens a dialog whose accessible name is that project's
    name, and the card's `data-flipped` stays `"false"`.
  - renders exactly one clue hook, matching MOVES for face II (order 3, Left), displayed as "3L" —
    asserts: exactly one `[data-clue-order]` element in the Face II subtree, with
    `data-clue-order="3"`, `data-clue-direction="Left"`, textContent `"3L"`.
RUN: npx vitest run src/machine/faces/FaceII.test.jsx  (from paulmartin.dev/)
RED_CONFIRMED: yes
RED_OUTPUT:
  - mount test: `AssertionError: expected +0 to be 3` at cardRoots(container).length — no cards
    render yet (FaceII.jsx is still the b1-t3 stub, `<h2>Face II</h2>` only).
  - flip test: same `expected +0 to be 3` — no cards to flip.
  - "does not open modal" / each "Details opens" case: `AssertionError: expected undefined to be
    truthy` at an explicit `expect(card).toBeTruthy()` guard, added specifically so the missing-
    card cause fails as a clean assertion rather than a raw TypeError from `querySelector` on
    `undefined`.
  - clue test: `AssertionError: expected +0 to be 1` — no `[data-clue-order]` element exists yet.
  Full suite run (`npx vitest run`) alongside this file: 6 other files / 62 other tests stay green,
  confirming this failure is isolated to the new Face II contract and not a fixture/import defect.

## Stale tests
PRUNED: none
UPDATED: none
Checked the whole suite (not just FILES_EDIT) for the superseded/adjacent signal: no existing test
references FaceII beyond Machine.test.jsx's two `'Face II'` aria-label list assertions (lines
72-73, 127-128), which check `FaceSurface`'s `aria-label="Face II"` wrapper attribute — unrelated
to and unaffected by this task's card/flip/clue content, since that prop is untouched. No test in
the suite renders `<Clue order={3}>` or asserts `data-clue-order="3"` outside Clue.test.jsx's
generic per-order loop (which exercises the Clue primitive directly with a synthetic render, not a
face-specific claim) — nothing to update there. Face II has no prior task-specific test file (b1-t3
stubbed the component with no test); nothing to prune.

## Contract
`FaceII.jsx` (default export, no props) must render three cards from `currentProjects` (in array
order), each:
- a DOM root carrying `data-flipped="false"|"true"`.
- one or more corner `<button>` elements with `aria-pressed={flipped}` that call `useAudio().play('flip')`
  and toggle that card's `flipped` state on every click (both directions).
- a front "Details" button (accessible name matching /details/i) that opens `DetailModal` for that
  card's own project (dialog accessible name == `project.name`) and does not touch `flipped`.
- exactly one of the three cards (by design, card index 0) renders `<Clue order={3} variant="seven-seg">`
  on its back, whose render-prop output is `orderGlyph + directionLetter.toUpperCase()` ("3L"); the
  other two card backs carry no `data-clue-order` hook at all, so the Face II subtree has exactly one
  `[data-clue-order]` element total, with `data-clue-order="3"` / `data-clue-direction="Left"`.

STATUS: TESTS_RED
