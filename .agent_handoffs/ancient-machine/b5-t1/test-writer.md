---
feature: ancient-machine
task: b5-t1
agent: tdd-test-writer
updated: 2026-08-19
iteration: 1
---

## Decision
WROTE
REASON: TEST_RECOMMENDATION was skip (pure visual styling, verified by screenshots) and the bulk of
this task stays that way. But research.md's Test surface section flags one cheap guard that protects
a real downstream contract, not pixels: the code-scattered moss decal layer must be aria-hidden so it
never enters the accessible tree (b5-t2's whole-puzzle keyboard/a11y solve depends on FaceSurface's
accessible content staying exactly what it is today). That is a branching correctness contract (hidden
vs not), not styling, so it earns one assertion.

## Tests
FILES: [paulmartin.dev/src/machine/Clue.test.jsx]
CASES:
  - FaceSurface > marks the decorative moss layer aria-hidden so it never enters the accessible tree —
    asserts a `.face-surface__moss` element exists inside the rendered panel and carries
    `aria-hidden="true"`.
RUN: npx vitest run src/machine/Clue.test.jsx --root paulmartin.dev
RED_CONFIRMED: yes
RED_OUTPUT:
  FAIL src/machine/Clue.test.jsx > FaceSurface > marks the decorative moss layer aria-hidden so it
  never enters the accessible tree
  AssertionError: expected null not to be null
    at Clue.test.jsx:83:22 (container.querySelector('.face-surface__moss') is null — FaceSurface does
    not yet render a moss layer)
Full suite run alongside: 113 passed, 1 failed (the new case only) — no other test broken, no compile
error, no missing-symbol failure.

## Stale tests
PRUNED: none
UPDATED: none
Checked: grepped the whole suite for `face-surface`/`FaceSurface` usage (only Clue.test.jsx references
it). FaceSurface's signature/props contract and the `.face-surface`/`.face-surface__content` structure
are unchanged by this task (additive skin + tokens only), so the existing
"renders children inside the bordered content slot" case still asserts a true contract and needed no
edit.

## Contract
FaceSurface must render an aria-hidden decorative layer (`.face-surface__moss`) for the scattered moss
decals, in addition to its existing `.face-surface` / `.face-surface__content` structure, so the moss
skin adds zero accessible-tree footprint. All other styling (grain, gradients, bevel, brass frame) is
verified by before/after screenshot evidence per the DELIVERABLE, not by assertions.
