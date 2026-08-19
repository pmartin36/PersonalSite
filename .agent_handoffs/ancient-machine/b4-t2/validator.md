---
feature: ancient-machine
task: b4-t2
agent: tdd-validator
updated: 2026-08-19T17:10:00Z
iteration: 1
---

## Gate run
COMMAND: npm --prefix paulmartin.dev test && npm --prefix paulmartin.dev run build
EXIT_CODE: 0
GATE_PASSED: yes
OUTPUT:
- vitest: Test Files 11 passed (11); Tests 103 passed (103)
- vite build: 96 modules transformed, built in 559ms, exit 0
- FaceIV.test.jsx: all 10 cases green (initial layout, slide legality x2 legal / x2 illegal,
  audio-once-on-legal-only, contact hrefs, About-are-buttons, single clue = 5/Down, tally = 5 strokes + down glyph)

## Behavioral evidence
EXERCISED: Tests were WROTE (not skipped), so the behavioral contract is exercised against the real
component, not just compiled. FaceIV.test.jsx renders the actual FaceIV and drives real DOM
interaction via @testing-library fireEvent:
- legal slide: clicking the About tile at cell 1 (adjacent to gap at 2) moves the gap to cell 1 and
  the about tile into cell 2 (data-gap / data-tile-kind asserted before/after); GitHub at cell 5
  slides the same way.
- non-adjacent no-op: clicking About at cell 0 and Email at cell 3 leaves the full arrangement
  deep-equal to before.
- audio: play('grind') fires exactly once on a legal slide, never on a no-op.
- back-plate clue: exactly one data-clue-order="5"/data-clue-direction="Down" (asserted against
  MOVES face IV, model.js:6 = {order:5, direction:'Down', faceId:'IV'}), order piece renders exactly
  moveByOrder(5).order = 5 .face4-tally__stroke elements, direction piece = DIRECTION_GLYPH.Down.
Slide legality, tally stroke count, and clue order/direction are all derived and asserted, matching
the DELIVERABLE's required evidence. Audio synthesis is mocked (covered by audio.test.jsx); the
slide state machine, adjacency, tile rendering, and clue rendering run against real code.

## Simplification review
BLOCKING: none
ADVISORY:
- FaceIV.jsx:38-44 adjacent() recomputes rowCol(a)/rowCol(b) on every render for every cell via the
  map at :133 and again inside trySlide; trivial for a 6-cell grid, not worth memoizing.
- Contact hrefs inlined at FaceIV.jsx:7-9 duplicate Landing.jsx:170,185. Already registered LOW,
  OWNER: unassigned in tasks.md `## DEFECTS` (:432); .agent_handoffs is git-tracked in this repo, so
  that register is durable — no separate docs/open-defects.md mirror needed. Out of this task's scope.

## Verdict
GREEN
DIAGNOSIS: Gate ran and exited 0 (103/103 tests, clean vite build). The behavioral deliverable is
exercised by a written, passing test suite that renders the real FaceIV and drives real click
interactions proving slide legality (adjacent-only), single-play audio, contact hrefs, and the
five-stroke tally + Down clue equal to MOVES face IV. Implementation maps cleanly to the blueprint;
component is well-decomposed (AboutTile/ContactTile/Cell), no nested-ternary or duplication defects.
No BLOCKING simplification findings and no analogous unfixed sibling site (single face; the
contact-link duplication is a pre-registered out-of-scope LOW defect in a durable, git-tracked
register). Advisory nits do not block.

STATUS: GREEN
