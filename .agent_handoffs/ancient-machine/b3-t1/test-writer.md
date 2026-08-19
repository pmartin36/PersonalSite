---
feature: ancient-machine
task: b3-t1
agent: tdd-test-writer
updated: 2026-08-19T20:14:02Z
iteration: 1
---

## Decision
WROTE
REASON: Per-reel spin/wrap state (with a fixed blank third face) is logic that regresses easily,
and the order-6 colored clue is the per-face half of the hoisted clue-integrity mechanism — both
merit a RED test per TEST_RECOMMENDATION: write.

## Tests
FILES: [paulmartin.dev/src/machine/faces/FaceIII.test.jsx (new)]
CASES:
  - renders exactly three reel spin buttons, each at position 0 — asserts: mount shape (data-reel
    count, initial data-position="0").
  - tapping reel 0/1/2 three times cycles its position 1, 2, 0 and leaves the other reels untouched
    (one case per reel index, pinning the full symmetric spin/wrap set rather than just reel 0) —
    asserts: per-reel advance wraps mod 3, other reels' data-position is unaffected, and each click
    calls play('grind') exactly once (3 calls total, all 'grind').
  - every reel has a blank face at index 2 — asserts: data-blank="true" on face index 2 for all
    three reels.
  - reel 3 (index 2) has all three faces blank — asserts: reel 3's faces are entirely blank, not
    just its index-2 face.
  - reel 1 shows Stargazer and Pong on its non-blank faces — asserts: reel content matches the
    blueprint's REELS content for reel 1.
  - reel 2 shows The 16 Spaces and Solar Express on its non-blank faces — asserts: reel content
    matches the blueprint's REELS content for reel 2.
  - renders exactly one clue hook at order 6, matching MOVES direction Left, without spinning any
    reel — asserts: [data-clue-order="6"] exists exactly once, its data-clue-direction is "Left",
    its text contains "6", and it is present at default render (no play('grind') call has fired).
  - the paired direction letter is derived from the same MOVES entry as the hook and shares its
    tint class — asserts: a second element carrying the hook's tint class renders
    directionLetter(moveByOrder(6).direction), proving the digit hook and the decorative letter
    cannot diverge.
RUN: npx vitest run src/machine/faces/FaceIII.test.jsx
RED_CONFIRMED: yes
RED_OUTPUT:
  - mount: `expect(reels.length).toBe(3)` -> received 0 (FaceIII.jsx stub renders no [data-reel]
    elements yet).
  - spin (x3, one per reel index): `Unable to fire a "click" event - please provide a DOM element`
    (target is undefined — no reel buttons exist to click).
  - blank faces (x2): `expect(reels.length).toBe(3)` -> received 0; second case throws reading
    querySelectorAll on undefined reel.
  - content (x2): TypeError reading `.textContent` of undefined reel — no reel elements rendered.
  - clue hook: `expect(clues.length).toBe(1)` -> received 0 (no [data-clue-order] in the stub).
  - paired letter: TypeError reading `.classList` of null (hook element does not exist).
  All 10 cases fail because FaceIII.jsx is still the pre-task 9-line stub (`<h2>Face III</h2>`,
  no reels, no Clue) — every failure traces to the same single cause: the reel/clue markup this
  task must add does not exist yet. None fail from a missing/misnamed import or fixture error;
  FaceIII, Clue, model, and audio.jsx mock all import and mount cleanly (confirmed by the mount
  test itself reaching its assertion rather than throwing on render).

## Stale tests
PRUNED: none
UPDATED: none
Checked: grepped the whole suite (src/**/*.test.js*) for FaceIII / order 6 / data-clue-order="6".
Only src/machine/model.test.js:12,18 and src/machine/Clue.test.jsx:14 reference order 6 — both
assert the generic MOVES/Clue mechanism (order spans 1..6; Clue renders an arbitrary order), not
FaceIII's own rendering, and are unaffected by this task. No prior FaceIII.test.jsx existed
(FaceIII.jsx was an unfilled stub).

## Contract
FaceIII must render three reel `<button data-reel data-position>` elements (one per reel), each
wrapping three `<div data-reel-face data-blank>` faces. Tapping a reel's button advances ONLY that
reel's `data-position` by one, wrapping 2->0, and calls `play('grind')` once per tap; other reels'
positions and DOM are untouched. Every reel's face index 2 carries `data-blank="true"`; reel index
2 (the third reel) is all-blank across all three faces. Reel 1's non-blank faces contain "Stargazer"
and "Pong"; reel 2's contain "The 16 Spaces" and "Solar Express" (via `getProject`, not re-declared
copy). Exactly one `[data-clue-order="6"]` element renders at default mount (no spin required),
with `data-clue-direction="Left"` and text containing "6", produced via `<Clue order={6}>` (never
hand-typed). A second, hookless element sharing that hook's tint class renders
`directionLetter(moveByOrder(6).direction)` ("l"), so the digit and the paired letter are
provably derived from the same MOVES entry.
