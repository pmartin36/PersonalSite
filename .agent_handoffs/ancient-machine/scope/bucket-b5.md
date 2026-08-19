---
feature: ancient-machine
agent: tdd-scope-validator
updated: 2026-08-19T18:30:00Z
iteration: 1
---

## Scope
BUCKET: b5
TASKS_REVIEWED: [b5-t1, b5-t2]

## Seam checks
- b5-t1 -> b1-t1 (FaceSurface + tokens): b5-t1 skinned the SHARED primitive with no per-face
  edits. FaceSurface.jsx:32 signature `{ children, className, ...rest }` unchanged; content slot
  `.face-surface__content` (line 53) intact; `...rest` still spreads (faces pass aria-label there).
  Added moss (line 39) and frame (line 38) layers both aria-hidden="true". machine.css tokens are
  additive. Every per-face test still green in the full run. — OK
- b5-t1 moss assets: FaceSurface.jsx references /machine/moss-1..4.png; all four exist in
  paulmartin.dev/public/machine/. Asset-prompt handoff plans/ancient-machine-assets.md exists. — OK
- b5-t2 -> all clue-bearing faces + Face V lock: wholePuzzle.test.jsx renders the real assembled
  <Machine/>, collects [data-clue-order] hooks from the tree, sorts by order (never a literal),
  maps to data-clue-direction, and compares against SEQUENCE imported from model.js. Orders assert
  [1..6] (one per position, no dup/missing); reconstruct asserts == SEQUENCE; solve enters the
  COLLECTED sequence into the Face V region's arrow buttons and asserts data-solved="true" + the
  celebration copy. Genuinely exercises the six-face seam, not a degenerate stub. — OK
- b5-t2 a11y contract: b5-t1's decorative layers are aria-hidden, so region-by-aria-label and h1
  queries in the proof stay clean; regions-in-DOM-order and name-is-h1 assertions pass. — OK

INTEGRATION_TESTED: `npm --prefix paulmartin.dev test && npm --prefix paulmartin.dev run build`
-> tests 13 files / 119 passed (0 failed), including wholePuzzle.test.jsx; vite build 97 modules,
exit 0. The clue-integrity build contract (mislabeled glyph fails the gated proof) is demonstrated
by the RED-on-mutation record in b5-t2 test-writer.md/code-writer.md (order-3->4 flip broke 3
assertions, reverted; FaceII.jsx clean in working tree). No test failures anywhere in the full
suite -> no cross-task stale-test drift, no regressions.

## Findings
none

## Verdict
PASS

STATUS: PASS
