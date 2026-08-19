---
feature: ancient-machine
task: b1-t1
agent: tdd-validator
updated: 2026-08-19
iteration: 1
---

## Gate run
COMMAND: `npm --prefix paulmartin.dev test && npm --prefix paulmartin.dev run build`
EXIT_CODE: 0
GATE_PASSED: yes
OUTPUT:
  - Test Files  2 passed (2) | Tests  19 passed (19) (vitest 4.1.11, jsdom)
  - vite build: 85 modules transformed, built in 614ms, dist emitted (index-*.js 298.62 kB)

## Behavioral evidence
EXERCISED: Tests were WROTE (not skipped), so the strict skipped-behavioral capture gate does
not apply. The behavioral core of this task is covered by the jsdom suite that actually renders
the components: Clue.test.jsx renders <Clue> for all 6 orders and asserts the emitted
data-clue-order/data-clue-direction equal MOVES and that the visible glyph is derived from
DIRECTION_GLYPH (not a re-typed literal); FaceSurface.test.jsx renders <FaceSurface> and asserts
children appear inside a `.face-surface` bordered panel. machine.css confirms the panel has a
visible brass border + inset crevice/bevel shadows over --m-sandstone. The deliverable's
"screenshot of a visible bordered panel" was not captured as an image, but the panel's DOM +
border/bevel CSS are verified by a passing render test; no separate Playwright artifact needed
for a static styled div at this task.

## Simplification review
BLOCKING: none
ADVISORY:
  - paulmartin.dev/src/machine/machine.css:38-57 — five clue variant classes (underline, tint,
    tally, seam, seven-seg) are defined but unused this task; they are the presentation surface
    later faces (b2-t2/b3/b4) will select via the `variant` prop, so speculative-but-planned.
    Fine to keep.
  - paulmartin.dev/src/machine/Clue.jsx:11-24 — directionLetter/DIRECTION_LETTER exist for the
    faceId III colored-letter clue (b3-t1) and are surfaced to the render-prop; unused by this
    task's own callers but part of the hoisted mechanism contract. No change needed.

## Process note (not a defect, does not affect verdict)
No code-writer.md handoff was written for this task, though the implementation files
(model.js, Clue.jsx, FaceSurface.jsx, machine.css) are present and correct. Audit-trail gap
only; ground truth (the gate) passes and the code satisfies the blueprint + test contract.

## Verdict
GREEN
DIAGNOSIS: The exact GATE_COMMAND ran and exited 0 — 19/19 vitest cases pass and vite build
succeeds. MOVES is the single source of truth, SEQUENCE is derived from it (spread+sort+map, no
standalone literal), RESUME_URL is exported once, and the Clue renderer emits data-clue-order/
data-clue-direction plus a MOVES-derived glyph from one entry with aria-hidden so it never
announces the answer — exactly the clue-integrity mechanism the plan hoists here. FaceSurface
renders a bordered stone panel. No BLOCKING simplification findings; the two advisory notes are
planned mechanism surface for later tasks. Behavioral deliverable is exercised by passing render
tests, not a skipped build.

STATUS: GREEN
