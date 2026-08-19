---
feature: ancient-machine
task: b2-t1
agent: tdd-validator
updated: 2026-08-19
iteration: 1
---

## Gate run
COMMAND: `npm --prefix paulmartin.dev test && npm --prefix paulmartin.dev run build`
EXIT_CODE: 0
GATE_PASSED: yes
OUTPUT:
- vitest: Test Files 6 passed (6); Tests 62 passed (62); duration 623ms.
- vite build: 87 modules transformed; built in 561ms; dist emitted (index-CFaX-pHP.js 276.13 kB).
- The 11 new DetailModal cases are part of the 62 green.

## Behavioral evidence
EXERCISED: Tests were WRITTEN (not skipped), and they exercise the real accessibility
contract in jsdom rather than mocked structure — asserted against live document.activeElement:
- focus moves INTO the dialog on open (DetailModal.test.jsx:39-43)
- Tab wraps last->first and Shift+Tab first->last, focus stays inside (test:74-92)
- focus restores to the opener button on unmount (test:94-108)
- Escape / close-button / backdrop-click invoke onClose; a panel click does NOT (test:47-70)
- content (title/headline/body/links) + role="dialog"/aria-modal + accessible name render (test:15-44)
The DELIVERABLE's behavioral claims (focus-trap containment, Escape-to-close-with-focus-restore)
are directly asserted by passing tests. Artifact: the green vitest run above.

## Simplification review
BLOCKING: none
ADVISORY:
- vitest.setup.js:8-15 — the global `window.matchMedia` default returns `matches: true` for
  EVERY query, not just prefers-reduced-motion. It is guarded (`if (!window.matchMedia)`) and the
  full suite is green, but a future test file that queries an unrelated media feature would silently
  get `matches:true`. Consider matching only the reduced-motion query. Non-blocking.
- DetailModal.jsx:12-40 — DetailLink/GitHubMark markup duplicates the legacy inline helper at
  src/pages/ProjectDetail.jsx:10-43. Already recorded as a LOW, OWNER-unassigned defect in
  tasks.md `## DEFECTS`; the legacy /projects/:slug route is out of this task's TOUCHES and no task
  this run rewires it, so extraction would create a third copy. Not blocking; register is git-tracked
  in this repo so the defect is durable (no docs/open-defects.md mirror required).

## Verdict
GREEN
DIAGNOSIS: Gate ran and exited 0 (62/62 tests, build succeeds). The behavioral accessibility
contract is genuinely exercised by passing jsdom assertions against real focus state, not just a
compile-green build. The implementation maps to the blueprint (portal to document.body, hand-rolled
role="dialog" focus trap, native-overflow scroll body with no marker, content-class reuse). No
BLOCKING simplification findings; the two advisory notes are style/durable-duplication already
captured in the DEFECTS register. No stale tests (net-new files, no prior consumers).

STATUS: GREEN
