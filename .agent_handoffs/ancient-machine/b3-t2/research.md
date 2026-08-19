---
feature: ancient-machine
task: b3-t2
agent: tdd-research
updated: 2026-08-19
iteration: 1
---

## Mode
FRESH (task block carries no ASSUMPTIONS; researched from source + spec + sibling b3-t1)

## Blueprint
APPROACH:
Add the seam-glyph clue (Hint 1, move order 2 = Right) to the Face III slot machine that b3-t1
already built. Two parts:

1. A NEW pure-data module `seamGlyphs.js` holding the half-glyph edge layout for all 9 reel faces
   (3 reels x 3 faces, each face has a left-edge and right-edge half-mark) plus a pure resolver.
   A seam "resolves" only when the right-edge mark of the left reel's payline face and the
   left-edge mark of the right reel's payline face are the two halves of the SAME complete glyph.
   Almost every mark is a globally-unique decoy that never completes, so most alignments read as
   garble. Exactly ONE (posR1, posR2, posR3) triple completes BOTH seams: reel-1|reel-2 completes a
   NUMBER, reel-2|reel-3 completes a DIRECTION letter, the middle reel's face (reel 2) shared
   between the two seams. This is a checkable data invariant (brute force all 27 combos -> exactly
   one winner), which is exactly what the DELIVERABLE test pins.

2. Edit `FaceIII.jsx`/`FaceIII.css` to (a) render decorative left/right edge half-glyph layers on
   EVERY reel face (project and blank alike, behind content) from `REEL_EDGES`, and (b) render the
   ALWAYS-MOUNTED order-2 integrity hook `<Clue order={2}>` as a seam-clue overlay, revealing its
   clean "2 + Right" reading only when `positions` equals the derived winning triple.

Winning-glyph derivation (clue integrity): the winning number and direction the half-marks complete
into are NOT hand-typed. seamGlyphs derives them from MOVES: the number glyph =
`String(moveByOrder(2).order)` ("2") and the direction letter = `directionLetter(moveByOrder(2).direction)`
("r"). The winning half-mark ids are keyed off those derived values, and the rendered hook is
`<Clue order={2}>` (order is the only caller input; direction is unreachable), so a wrong direction
in MOVES flips both the seam data AND the hook, and the invariant test catches it at build time.

Winning triple = reel1 face 0 (Stargazer, a project), reel2 face 2 (blank third face), reel3 face 1
(blank placeholder) -> a MIX (not all-blank; has a project face), reads NOW with reel-3 placeholders
and STILL once real projects fill in (etching sits on every face regardless of content). This
matches the spec example (spec:110-111: reel1=Stargazer, reel2=blank, reel3=placeholder).

ALWAYS-MOUNTED requirement: b3-t1 deliberately keeps the order-6 hook in the DOM at default
(unspun) render so b5-t2 reads it without choreographing spins (b3-t1/research.md:36-37,154). The
order-2 hook MUST follow the same rule — mounted at default render, decoupled from the visual
alignment reveal — so b5-t2 collects all six hooks without having to spin Face III to its winning
combination. The hook is aria-hidden; the visual "clean read only when aligned" is CSS presentation.

INTERFACES:
- NEW `machine/seamGlyphs.js`:
  - `REEL_EDGES`: `Array(3)` of `Array(3)` of `{ left: string, right: string }` — the half-mark id
    on each face's left and right edge. Winning marks derived from MOVES; all others unique decoys
    (ids embed reel/face/side so no two decoys ever share a glyph key).
  - `resolveSeams(positions /* [p1,p2,p3] */)` -> `{ number: string|null, direction: string|null,
    aligned: boolean }`. `number = complete(REEL_EDGES[0][p1].right, REEL_EDGES[1][p2].left)`;
    `direction = complete(REEL_EDGES[1][p2].right, REEL_EDGES[2][p3].left)`; `aligned = number && direction`.
  - internal `complete(rightMark, leftMark)`: returns glyph `g` iff `rightMark==="${g}:L"` and
    `leftMark==="${g}:R"`, else null (decoys never match).
  - `findAlignments()` -> array of `{ positions:[p1,p2,p3], number, direction }` over all 27 combos.
  - `WINNING` = `findAlignments()[0]` (DERIVED, never a hardcoded triple).
- EDIT `machine/faces/FaceIII.jsx`:
  - import `{ REEL_EDGES, WINNING, resolveSeams }` from `../seamGlyphs.js`.
  - `ReelFace` gains `reelIndex`/`faceIndex` (or an `edges={REEL_EDGES[r][f]}` prop) and renders two
    non-interactive etch layers: `<span className="face3-edge" data-edge="left"/right` behind content
    (z-index below `.face3-reel__body`, aria-hidden). Mark id exposed as a data attr for CSS/testability.
  - the always-mounted seam-clue overlay: single `<Clue order={2} className="face3-seam-clue ...">`
    child of `.face3-reels` (render-prop yields `orderGlyph` "2" + `directionLetter` "r" for the clean
    read), with `--aligned` class toggled when `positions` deep-equals `WINNING.positions`.
- EDIT `machine/faces/FaceIII.css`: `.face3-edge` (absolute left/right, behind body), `.face3-seam-clue`
  overlay + `.face3-seam-clue--aligned` reveal. Co-located; do NOT touch shared machine.css.

DATA_FLOW:
mount -> positions [0,0,0]; every ReelFace renders its left/right decorative half-mark from
REEL_EDGES (all 9 faces, always in DOM); the order-2 `<Clue>` hook mounts at default. Spinning a reel
(existing b3-t1 `spin`) changes `positions`; FaceIII compares `positions` to `WINNING.positions` (or
calls `resolveSeams(positions).aligned`) to toggle the clean-read class. The order-2 data-clue-* is
read by FaceIII's test and by b5-t2's whole-puzzle proof at default render.

FILES_NEW:
- paulmartin.dev/src/machine/seamGlyphs.js
- paulmartin.dev/src/machine/seamGlyphs.test.js
- paulmartin.dev/src/machine/faces/FaceIII.test.jsx  (b3-t1 already created this; b3-t2 EDITS it — see Stale tests)
FILES_EDIT:
- paulmartin.dev/src/machine/faces/FaceIII.jsx (add edge layers to ReelFace + order-2 seam-clue overlay; ~124 -> ~170 lines)
- paulmartin.dev/src/machine/faces/FaceIII.css (add .face3-edge + .face3-seam-clue rules)
- paulmartin.dev/src/machine/faces/FaceIII.test.jsx (fix the stale exactly-one-hook count; add order-2 cases)

File-size budget (limit 1000, none stated in CLAUDE.md/repo): FaceIII.jsx ~170, .css ~120,
seamGlyphs.js ~60. No split needed.

## Duplicate / reuse check
EXISTING (reuse, do NOT reinvent):
- machine/Clue.jsx:26 — the ONLY clue construction path. The order-2 hook is `<Clue order={2}>`;
  order is the sole input, direction is unreachable by callers (Clue derives it from MOVES,
  Clue.jsx:27-29,47-48). Do NOT hand-type "2", "r", "Right", "->", or write data-clue-* by hand.
- machine/Clue.jsx:18 `directionLetter` (EXPORTED) — used by seamGlyphs to derive the winning
  letter and by the aligned presentation; never a literal "r".
- machine/model.js:15 `moveByOrder` — supplies the MOVES entry (order 2) both the seam data and the
  hook derive from, so decorative reading and hook cannot diverge.
- machine/faces/FaceIII.jsx (b3-t1) — reuse the existing `Reel`/`ReelFace`/`spin`/`REELS` structure;
  attach edge layers to the existing `.face3-reel__face`, do NOT restructure the reels (b3-t1
  feed-forward: each face is a stable `.face3-reel__face`, b3-t1/research.md:189-192).
CLEANLINESS:
- "One rule, one place" for Face III's order-2 clue: the single production construction site after
  this task is the one `<Clue order={2}>` in FaceIII.jsx. GREP of existing order={2} sites TODAY:
  `rg -n 'order=\{2\}' src` -> ONLY machine/Clue.test.jsx:35,37 (test fixtures, not production). No
  production order={2} exists; this task adds exactly one. Disposition: the new FaceIII.jsx site is
  THE owner; Clue.test.jsx:35,37 are unit fixtures of Clue itself, deliberately excluded. Direction
  is unreachable from the caller, so the hook cannot carry a hand-typed direction.
- Keep order-6 (b3-t1) and order-2 (this task) as two independent hooks in the same face; never
  merge or count-couple them.
- Decoy half-mark ids embed reel/face/side (globally unique) so no accidental second alignment; the
  invariant test brute-forces to confirm exactly one.
- Co-locate all CSS in FaceIII.css; do not touch shared machine.css / MachineShell.css.

## Constraints that must not regress
- Machine.test.jsx:67-77 asserts exactly five aria-labelled regions (Face I..V). The seam-clue
  overlay + edge layers are `<span>`/`<div>` (aria-hidden), NEVER a labelled `<section>`; adding one
  would create a 6th region and break Machine.test.jsx.
- The order-2 hook MUST be mounted at default (unspun) render so b5-t2 reads all six hooks without
  spinning Face III (mirrors b3-t1's order-6). Do NOT gate the HOOK behind the aligned state; gate
  only the visible clean-read CSS.
- Edge half-marks sit BEHIND face content (z-index) and are aria-hidden, per spec:102-104 ("behind
  whatever text is on the face"); they must not intercept the reel spin click or announce to AT.

## STALE TEST (must be fixed by b3-t2's test-writer — this task owns the file)
machine/faces/FaceIII.test.jsx:116-124 asserts `container.querySelectorAll('[data-clue-order]')`
has length 1 and `clues[0]` is order 6. b3-t2 adds a SECOND hook (order 2), so this count goes to 2
and `clues[0]` order is DOM-order-dependent -> the assertion breaks. b3-t1/research.md:132-134
explicitly warned this should have queried `[data-clue-order="6"]` instead of counting. FIX: rewrite
those assertions to target `container.querySelector('[data-clue-order="6"]')` for the order-6
checks. This is an UPDATED stale test (contract widened by this task), not a defect to route.

## Test surface (feed-forward to test-writer)
PUBLIC_SURFACE:
- seamGlyphs: `findAlignments()` returns EXACTLY ONE winning combination.
- That winner's `number === String(moveByOrder(2).order)` ("2") and `direction ===
  directionLetter(moveByOrder(2).direction)` ("r") — i.e. the resolved seam reading == MOVES order 2.
- `resolveSeams([p1,p2,p3]).aligned` is true only at `WINNING.positions`; every other triple has at
  least one unresolved seam.
- Every reel face carries a left AND right edge half-mark (all 9 faces, project and blank alike).
- FaceIII renders exactly one `[data-clue-order="2"]` hook with `data-clue-direction="Right"`,
  present at default render without spinning any reel.
- The winning triple is a MIX (reel-1 winning face is a real project, so not all-blank).
SUGGESTED_TESTS:
  seamGlyphs.test.js (pure data):
  - findAlignments() has length 1 (exactly one alignment).
  - the winner's number === String(moveByOrder(2).order) and direction === directionLetter(moveByOrder(2).direction).
  - resolveSeams(WINNING.positions).aligned === true; a spot-check of a non-winning triple -> aligned false.
  - every REEL_EDGES[r][f] has non-empty `left` and `right` (edge etching on all 9 faces).
  FaceIII.test.jsx (rendering; keep b3-t1's audio-mock pattern):
  - renders exactly one [data-clue-order="2"], data-clue-direction="Right", at default render (no spin).
  - the order-6 hook still present and correct (fixed to query [data-clue-order="6"], not a total count).
  - each reel face renders a left and right edge etch layer (behind content, aria-hidden).
  - the winning combination flags the aligned/clean-read state (query by class or data attr) while a
    non-winning combination does not (drives the clean vs garbled visual).
  - (behavioral/screenshot, not unit) aligned combo shows a clean "2 + Right" across the two seams;
    other combos show garbled partials.

## Provenance
- b3-t1/research.md (sibling map): reel structure, `.face3-reel__face` stability, order-6
  always-mounted rationale, the "query by [data-clue-order=N] not a count" warning. RE-VERIFIED
  against source: FaceIII.jsx:25-124 (ReelFace/Reel/REELS/spin), FaceIII.test.jsx:116-137 (the stale
  count at :119), FaceIII.css:1-84.
- Clue API (order-only input, exported directionLetter, emits data-clue-order/direction from MOVES,
  aria-hidden) — from b1-t1 via b3-t1. RE-VERIFIED at Clue.jsx:18,26-55.
- MOVES order 2 = {direction:'Right', faceId:'III'}; SEQUENCE derived — RE-VERIFIED at model.js:1-10.
- b5-t2 reads six hooks at default render (drives the always-mounted requirement) — from tasks.md:379-403
  + spec:208-211. Taken as given (b5-t2 not yet built).
- Spec Hint 1 seam-match design (edge half-glyphs on every face, one clean alignment, number seam +
  direction seam sharing the middle reel, mix not all-blank) — RE-VERIFIED at spec:101-114.
- No existing seamGlyphs.js; no production order={2} site — RE-VERIFIED by grep this run.

## Notes to orchestrator
- No new DEFECTS measured; no edit to tasks.md.
- One STALE TEST to fix in FaceIII.test.jsx:116-124 (owned by this task's file) — flagged above so
  test-writer updates rather than re-discovers it.

STATUS: IMPLEMENT
