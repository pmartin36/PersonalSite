---
feature: ancient-machine
task: b2-t2
agent: tdd-validator
updated: 2026-08-19
iteration: 1
---

## Gate run
COMMAND: `npm --prefix paulmartin.dev test && npm --prefix paulmartin.dev run build`
EXIT_CODE: 0
GATE_PASSED: yes
OUTPUT:
  - vitest run: Test Files 7 passed (7); Tests 69 passed (69).
  - vite build: 92 modules transformed, built in 586ms, dist emitted.
  - FaceII.test.jsx (7 cases) green: mount, flip state machine + flip audio x6, flip-does-not-open-modal, Details-opens-modal for all 3 currentProjects, single order-3/Left clue hook.

## Behavioral evidence
EXERCISED: Tests were WROTE (not skipped), so the passing jsdom suite is the evidence. It drives the real deliverable: corner-control flip toggles data-flipped front<->back and fires play('flip') on both transitions (6 calls across 3 cards); each card's Details button opens DetailModal for its OWN project (dialog accessible-name == project.name) without flipping; exactly one [data-clue-order] in the Face II subtree with data-clue-order="3", data-clue-direction="Left", textContent "3L". Purely-visual bits (hover wobble keyframe, 3D rotateY flip, reduced-motion override) are CSS-only and not jsdom-observable; no separate capture required since the interactive/state contract is fully driven.

## Simplification review
BLOCKING: none
ADVISORY:
  - FaceII.jsx:34-40,60-66 — each card mounts two corner <button> (front face + back face), both wired to toggleFlip with aria-pressed. Natural consequence of always-mounted faces, but it means two flip affordances per card; harmless and the test tolerates it. Style note only.

## Verdict
GREEN
DIAGNOSIS: Gate ran and exited 0 — full suite green, build clean. The behavioral flip/Details/clue contract is exercised by the written suite, not skipped. The clue is routed through the b1-t1 Clue mechanism keyed by order={3}; glyph and data-clue-* both derive from the one MOVES entry (moveByOrder(3) => Left), so glyph/hook cannot diverge and no direction literal is hand-typed. Details-opens-correct-modal is asserted across all three currentProjects (the whole symmetric set, no analogous site left unexercised). No blocking simplification findings.

STATUS: GREEN
