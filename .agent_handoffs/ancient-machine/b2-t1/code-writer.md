---
feature: ancient-machine
task: b2-t1
agent: tdd-code-writer
updated: 2026-08-19
iteration: 1
---

## Implementation
FILES:
- paulmartin.dev/src/machine/DetailModal.jsx (new — full implementation, replacing the test-writer's signature stub)
- paulmartin.dev/src/machine/DetailModal.css (new — overlay chrome only)
- paulmartin.dev/vitest.setup.js (edited — global `window.matchMedia` default; see DEVIATIONS)

SUMMARY:
`DetailModal({ project, slug, onClose })` renders `null` when neither `project` nor a
`getProject(slug)` resolution yields a project. Otherwise it portals (`createPortal` to
`document.body`) a backdrop (`data-testid="detail-modal-backdrop"`, click -> `onClose`) wrapping a
dialog panel (`role="dialog"`, `aria-modal="true"`, `aria-labelledby` -> the `<h1 id="detail-modal-title">`
title, click `stopPropagation` so panel clicks do not bubble to the backdrop). Content inside
`.detail-modal__body` mirrors ProjectDetail.jsx's structure and class names (`.detail-title` with
name span + `OrgTag`, `.detail-headline`, `.detail-meta` with `.card-year`/`.tag.role`/`.tag`,
`.detail-body` paragraphs, `.detail-links` via the co-located `DetailLink`, hero via `ProjectMedia`)
so it inherits index.css's existing rules with zero restyling. A close button (`aria-label="Close"`)
also calls `onClose`.

Lifecycle effect on mount: captures `document.activeElement` as `opener`, moves focus to the first
focusable element inside the panel (the close button). A `keydown` listener on `document` handles
Escape (`onClose`) and Tab/Shift+Tab wrap-trapping (computed fresh each keypress via
`querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')` on
the panel — matches the accessible/focusable elements the tests enumerate the same way). Effect
cleanup removes the listener and restores focus to `opener`.

`.detail-modal__body` sets `overflow-y: auto` with no `data-scroll*`/`data-marker*` attribute,
satisfying the native-overflow scroll-arbitration contract with zero markers.

MAPS_TO_BLUEPRINT: Matches research.md's blueprint exactly — hand-rolled dialog (not native
`<dialog>`), portal target `document.body`, focus-trap + Escape + backdrop/panel-click + close-button
+ focus-restore lifecycle, content reuse of ProjectDetail.jsx's classes/components, co-located
`DetailLink`/`GitHubMark` (not extracted — same rationale research gave: extracting would be a third
copy since legacy ProjectDetail.jsx is untouched), `slug` fallback via `getProject`, no scroll marker
on `.detail-modal__body`.

DEVIATIONS:
- `vitest.setup.js`: added a global default `window.matchMedia` stub (returns `matches: true`,
  i.e. reduced-motion) because jsdom has no native `matchMedia` and `ProjectMedia`'s video branch
  (`ProjectMedia.jsx:15`) calls it unconditionally on mount. The test-writer's RED run never hit this
  because the stub `DetailModal` never rendered `ProjectMedia`; once the real implementation renders
  the code-scenes project's video hero, the gap surfaced. Defaulting to reduced-motion sidesteps a
  second jsdom gap (no `IntersectionObserver`) since `ProjectMedia`'s video effect returns early
  under `prefers-reduced-motion`. `Machine.test.jsx` already overrides `window.matchMedia` locally
  per test for its own reduced-motion assertions, so this global default only fills in for files
  (now including `DetailModal.test.jsx`) that don't set their own. Full suite reverified green after
  this change (62/62, 6 files) — nothing else depended on `matchMedia` being absent.

REUSED:
- `ProjectMedia` (src/components/ProjectMedia.jsx) — hero renderer, unmodified.
- `OrgTag` (src/components/OrgTag.jsx) — affiliation chip, unmodified.
- `getProject` (src/data/projects.js) — slug fallback resolver, unmodified.
- All `.detail-*`/`.tag`/`.card-year`/`.org-tag`/`.media-*` CSS rules already in index.css — no
  content restyling in DetailModal.css.

## Expected result
TESTS: paulmartin.dev/src/machine/DetailModal.test.jsx — all 11 cases now pass.
BUILD: `npm --prefix paulmartin.dev test && npm --prefix paulmartin.dev run build` — verified green
(62/62 tests across 6 files; production build succeeds, 87 modules transformed).

STATUS: READY_TO_VALIDATE
