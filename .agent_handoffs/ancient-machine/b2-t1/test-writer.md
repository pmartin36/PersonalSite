---
feature: ancient-machine
task: b2-t1
agent: tdd-test-writer
updated: 2026-08-19
iteration: 1
---

## Decision
WROTE
REASON: Focus-trap + Escape + focus-restore is an accessibility contract that breaks silently
(TEST_RECOMMENDATION: write, matches TEST_RATIONALE).

## Tests
FILES:
- paulmartin.dev/src/machine/DetailModal.test.jsx (new)
- paulmartin.dev/src/machine/DetailModal.jsx (new — minimal signature stub only, body left to code-writer)

CASES:
  - renders the title, headline, a body paragraph, and each link label — asserts: content shape
    for a project (currentProjects code-scenes: name, headline, body[0], every link label)
  - returns null when neither a project nor a resolvable slug is given — asserts: no-project guard
  - exposes role="dialog", aria-modal="true", and an accessible name matching the project title —
    asserts: dialog semantics + aria-labelledby wiring
  - moves focus into the dialog when it opens — asserts: initial focus lands inside the dialog
  - invokes onClose when Escape is pressed — asserts: Escape keydown calls onClose
  - invokes onClose when the close button is clicked — asserts: close control calls onClose
  - invokes onClose on backdrop click but not on a click inside the dialog panel — asserts:
    backdrop vs. panel click distinction
  - wraps Tab from the last focusable element to the first — asserts: forward trap wrap
  - wraps Shift+Tab from the first focusable element to the last — asserts: backward trap wrap
  - restores focus to the opener when the modal is unmounted — asserts: focus-restore on close
  - gives the scrollable body its own class and no scroll-capture marker attribute — asserts: the
    b1-t4 native-overflow contract (no data-scroll/data-marker attribute on .detail-modal__body)

RUN: npx vitest run src/machine/DetailModal.test.jsx  (from paulmartin.dev/)
RED_CONFIRMED: yes
RED_OUTPUT:
  - content: `Unable to find an accessible element with the role "heading" and name "Code Scenes"`
  - null-guard: `expected <div class="detail-modal-unimplemented-stub"></div> to be null`
  - dialog semantics / focus-in / trap wraps / restore / backdrop-panel: `Unable to find an
    accessible element with the role "dialog"`
  - Escape: `expected "vi.fn()" to be called at least once` (called 0 times)
  - close button: `Unable to find an accessible element with the role "button" and name /close/i`
  - scroll body: `expected null not to be null` (`.detail-modal__body` absent)
  Full run: 11/11 new tests fail; the other 5 existing test files stay green (51 passed).

REDKIND: compile-stub — DetailModal.jsx did not exist; added the minimal exported function with
the correct `{ project, slug, onClose }` signature returning an unconditional placeholder div, so
the test file compiles/imports cleanly and every case fails at its own query/assertion, not at
module resolution.

## Stale tests
PRUNED: none
UPDATED: none
(grepped the whole suite for `DetailModal`, `role="dialog"`, `detail-modal`, `focus-trap` — no
other file references this contract; b2-t1 introduces net-new files with no prior consumers.)

## Contract
`DetailModal({ project, slug, onClose })` in paulmartin.dev/src/machine/DetailModal.jsx:
- Renders `null` when `project` is absent and `slug` does not resolve via `getProject`.
- Otherwise renders (via portal to document.body, since Machine.jsx applies 3D transforms to the
  face subtree): a backdrop (`data-testid="detail-modal-backdrop"`, click -> onClose) and a dialog
  panel (`role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the title element so
  its accessible name equals `project.name`; a click on the panel must NOT bubble to close).
- Content inside the panel reuses ProjectDetail.jsx's shape/classes: title (name + OrgTag when
  org present), headline, meta (year/role/tags), body paragraphs, links (via a co-located
  DetailLink), hero via ProjectMedia — inside a `.detail-modal__body` wrapper with plain
  `overflow-y: auto` and NO data-scroll/data-marker attribute (b1-t4 arbitrates by computed
  overflow only).
- A close button (accessible name matching /close/i) calls onClose.
- On mount: capture `document.activeElement` as opener, move focus into the dialog.
- Tab/Shift+Tab trap: wraps from last focusable to first and first to last, never lets focus leave
  the dialog. Escape keydown calls onClose.
- On unmount/close: restore focus to the captured opener.

STATUS: TESTS_RED
