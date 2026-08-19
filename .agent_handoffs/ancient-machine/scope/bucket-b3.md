---
feature: ancient-machine
agent: tdd-scope-validator
updated: 2026-08-19T20:55:00Z
iteration: 1
---

## Scope
BUCKET: b3
TASKS_REVIEWED: [b3-t1, b3-t2]

## Seam checks
- b3-t1 -> b1-t1 (Clue/model/FaceSurface): FaceIII.jsx:4,7,8 imports Clue + directionLetter,
  moveByOrder, FaceSurface. `<Clue order={6}>` and `<Clue order={2}>` use the real render-prop
  contract Clue.jsx:34-42 exposes ({orderGlyph, directionLetter}); no hand-typed order/direction.
  FaceSurface.jsx:3 forwards aria-label via ...rest. — OK
- b3-t1 -> b1-t2 (audio): spin() calls play('grind'); 'grind' is a registered SOUNDS key
  (audio.jsx:57). FaceIII renders inside Machine's AudioProvider (Machine.jsx:192-198). — OK
- b3-t1 -> b1-t3 (mount): Machine.jsx:12,19,148-164 imports and renders FaceIII as a real drum
  face in DOM order. — OK
- b3-t2 -> b3-t1 (reel faces): seamGlyphs REEL_EDGES is a filled 3x3 grid; ReelFace looks up
  REEL_EDGES[reelIndex][faceIndex] (FaceIII.jsx:27) for all 9 faces; FaceIII consumes WINNING.positions
  (FaceIII.jsx:113) for the aligned class. Winning triple [0,2,1] resolves both seams to 2 / r;
  decoys are globally unique and never complete (verified by findAlignments length === 1). — OK
- Clue-integrity: FaceIII owns orders 2 and 6. Integrated render of the assembled machine emits
  data-clue-order/direction 2/Right and 6/Left from FaceIII (plus 3/Left from FaceII), all derived
  from MOVES. Both hooks are always-mounted (present without spinning), so b5-t2 can collect them. — OK

INTEGRATION_TESTED:
- `npm --prefix paulmartin.dev test` -> Test Files 9 passed, Tests 88 passed (88).
- `npm --prefix paulmartin.dev run build` -> 94 modules transformed, built, exit 0.
- Temporary probe rendering the full <Machine/>: querying [data-clue-order] returned
  ["2/Right","3/Left","6/Left"] — FaceIII contributes exactly its two MOVES-correct hooks
  (order 2=Right/III, order 6=Left/III). Probe removed after observation.

## Findings
none — every dependency edge wires into the real current API, the gate passes in full, and no
stale-test drift surfaced across the whole suite.

## Verdict
PASS

STATUS: PASS
