---
feature: ancient-machine
task: b2-t1
agent: tdd-research
updated: 2026-08-19
iteration: 1
---

## Mode
FRESH (no ASSUMPTIONS on the task block; researched from the codebase + spec)

## Blueprint
APPROACH:
One new component `DetailModal` that renders a focus-trapped, Escape-closable dialog overlay
into a PORTAL on `document.body`, showing a project's full detail content. The inner content is a
faithful re-render of the `/projects/:slug` page body (ProjectDetail.jsx:70-103) reusing the SAME
class names, so it inherits the already-styled `.detail-*` / `.tag` / `.card-year` / `.org-tag` /
`.media-*` rules from the global index.css and the reused `ProjectMedia` + `OrgTag` components.
DetailModal.css adds ONLY the overlay chrome (backdrop, dialog panel, header/close button,
scrollable body). The dialog is hand-rolled (role="dialog" + a Tab-wrap focus trap), NOT the native
`<dialog>` element, because jsdom's HTMLDialogElement (`showModal`, top-layer, Escape) is incomplete
and the DELIVERABLE requires focus-trap + Escape assertions to run green in jsdom.

PORTAL is mandatory (not cosmetic): the machine (Machine.jsx) rotates faces with CSS 3D transforms;
a modal rendered inside FaceII's subtree would inherit the face's `rotateX`/perspective and 3D
stacking context. Portaling to `document.body` lifts the overlay out of the transformed prism so it
covers the true viewport.

Focus/interaction lifecycle (the accessibility contract):
1. On mount, capture `opener = document.activeElement`.
2. Move focus into the dialog (to the close button, or the dialog container if none).
3. Trap Tab/Shift+Tab: on keydown Tab, compute focusable elements inside the dialog; wrap last->first
   and first->last. This keeps focus inside while open.
4. Escape (keydown) calls `onClose`. Backdrop click calls `onClose`. Close button calls `onClose`.
   Clicks inside the dialog panel do NOT close (stopPropagation on the panel, or target check).
5. On unmount/close, restore focus: `opener?.focus()` in the effect cleanup.
6. Background inertness: focus-trap is the primary guarantee (keyboard cannot leave); backdrop click
   closes. OPTIONAL hardening: toggle the `inert` attribute on `#root` while open. Keep the test
   contract on trap+Escape+restore (jsdom-reliable); do not gate GREEN on `inert` behavior in jsdom.

Scrollable body (the b1-t4 seam — NO marker token): the dialog panel is height-capped
(`max-height: ~90vh`) and its content sits in a `.detail-modal__body` with `overflow-y: auto`. That
is plain NATIVE overflow — b1-t4's arbitration walks the ancestor chain for computed overflow
auto/scroll with real overflowing content and will scroll this body instead of rotating the drum.
Do NOT add any data-attribute/class marker for scroll capture; native overflow is the entire
contract. (spec "Scroll arbitration", tasks.md b2 SEAMS.)

INTERFACES:
- `DetailModal.jsx` (default export):
  `DetailModal({ project, slug, onClose })`
  - `project`: a project object (shape from src/data/projects.js: name, org?, role?, year, headline,
    tags[], hero, body[], links[]). Preferred input (FaceII already holds the project).
  - `slug`: optional fallback; if `project` absent, resolve `getProject(slug)`.
  - `onClose`: required callback fired on Escape / backdrop click / close button.
  - Renders `null` if neither `project` nor a resolvable `slug` is given (parent controls
    open-state by mounting/unmounting; there is no `isOpen` prop).
- Reused as-is: `ProjectMedia` (src/components/ProjectMedia.jsx) for `project.hero`;
  `OrgTag` (src/components/OrgTag.jsx) for `project.org`.
- Co-located link helper `DetailLink` inside DetailModal.jsx mirroring ProjectDetail.jsx:18-43
  (external `<a target=_blank rel=noopener>` vs internal react-router `<Link>`, GitHub mark for
  `link.kind==='github'`). See Duplicate/reuse check for why co-located, not extracted.

DATA_FLOW:
parent (FaceII, b2-t2) holds selected project -> mounts `<DetailModal project onClose>` ->
DetailModal captures opener focus, portals dialog to body, renders content via ProjectMedia/OrgTag/
DetailLink from the project fields -> user reads/scrolls (native body overflow) -> Escape/backdrop/
close -> onClose -> parent unmounts -> cleanup restores focus to opener.

FILES_NEW:
- paulmartin.dev/src/machine/DetailModal.jsx
- paulmartin.dev/src/machine/DetailModal.css
- paulmartin.dev/src/machine/DetailModal.test.jsx
FILES_EDIT: none

## Duplicate / reuse check
EXISTING (reuse, do not reinvent):
- Content layout + class names: ProjectDetail.jsx:70-103 renders exactly the target content
  (hero via ProjectMedia, `.detail-title` = name span + OrgTag, `.detail-headline`,
  `.detail-meta` = `.card-year` + `.tag.role` + `.tag`s, `.detail-body` paragraphs, `.detail-links`).
  DetailModal re-uses these same class names so it inherits index.css:824-910 (+ `.tag` 626,
  `.card-year` 601, `.org-tag` 647, `.media-*` 421-482) — no restyling of content.
- `ProjectMedia` src/components/ProjectMedia.jsx:69 — the hero renderer (video/youtube/gallery/still).
  Reuse directly; do not reimplement media kinds.
- `OrgTag` src/components/OrgTag.jsx:6 — affiliation chip. Reuse directly.
- `getProject` src/data/projects.js:262 — slug->project resolver, used only for the `slug` fallback.
- Machine tokens `--m-*` (src/machine/machine.css:1-9) are available for the overlay CHROME
  (backdrop/panel) if a stone-adjacent tint is wanted; content styling stays on the galaxy `.detail-*`
  tokens it already uses. Skinning the modal into stone is NOT this task (b5-t1 skins FaceSurface only).

CLEANLINESS:
- `DetailLink` + `GitHubMark` are defined INLINE and un-exported in ProjectDetail.jsx:10-43. This task
  co-locates an equivalent helper in DetailModal.jsx rather than extracting a shared module, because
  the only way to truly de-duplicate is to also rewrite legacy ProjectDetail.jsx (OUT of this task's
  TOUCHES; the /projects/:slug route is legacy and de-routed conceptually by this feature). Extracting
  a shared file the modal alone imports would create a THIRD copy, not remove one. Residual duplication
  is logged as a LOW defect (see below), consistent with how the plan already tolerates the legacy
  RESUME_URL duplication (tasks.md DEFECTS).
- No existing focus-trap/dialog/portal utility exists (grep: no `createPortal` render use, no
  `role="dialog"`, no `<dialog>`, no `inert` toggling in src). Hand-rolled trap is the first and only
  one; keep it self-contained in DetailModal.jsx.
- react-router `Link` is used by reused OrgTag (internal orgs) and by internal `DetailLink`s. The app
  is wrapped in BrowserRouter (main.jsx:22) in production, so Links resolve. TEST NOTE below.

## Test surface (feed-forward to test-writer)
PUBLIC_SURFACE:
- Renders the given project's content: title (name + OrgTag when org present), headline, meta
  (year, role when present, tags), each body paragraph, each link, and the hero via ProjectMedia.
- Dialog semantics: `role="dialog"`, `aria-modal="true"`, an accessible name via aria-labelledby ->
  the title element.
- Focus is moved INTO the dialog on open.
- Tab / Shift+Tab cycle only among focusable elements INSIDE the dialog (containment; wrap at both
  ends) — focus never lands on an element outside the dialog.
- Escape closes: `onClose` is invoked on Escape keydown.
- Backdrop click closes (`onClose`); a click inside the dialog panel does NOT.
- Close button closes (`onClose`).
- On close/unmount, focus is restored to the element that was focused before open (the opener).
- The scrollable body uses native `overflow-y: auto` and carries NO scroll-capture marker
  attribute/class (arbitration is by computed overflow only).
- Returns null when given neither a project nor a resolvable slug.
SUGGESTED_TESTS (DetailModal.test.jsx — every operation named in prose above appears here):
- renders the project's title, headline, a body paragraph, and a link label for a sample project
  (use a currentProjects entry, e.g. code-scenes, so there is no org/internal link -> no Router needed).
- exposes role="dialog" + aria-modal="true" and an accessible name matching the project name.
- moves focus into the dialog on open (activeElement is inside the dialog).
- Escape keydown invokes onClose.
- close button invokes onClose.
- backdrop click invokes onClose; click on the dialog panel does NOT invoke onClose.
- focus trap: Tab from the last focusable wraps to the first and Shift+Tab from the first wraps to
  the last (focus stays within the dialog).
- focus restore: render with an opener button focused, mount modal, unmount (parent stops rendering
  it), assert focus returns to the opener button.
- native-overflow contract: the scroll body element has computed/inline `overflow-y: auto` (or the
  class that sets it) and NO data-scroll/marker attribute.
- returns null for `<DetailModal onClose={fn} />` with no project/slug.
- TEST NOTE for writer: use @testing-library/user-event for Tab/Escape/click. If a test picks a
  project with an internal org or internal link (previousProjects), wrap render in react-router's
  MemoryRouter; the currentProjects entries avoid this entirely.

## Provenance
- Read b1-t1/research.md and b1-t2/b1-t3/b1-t4 exist, but NOTHING load-bearing for this task is
  inherited from them: DetailModal does not render a Clue and does not touch the puzzle model. The
  b2-t1 -> b1-t1 dependency edge is loose (shared src/machine dir + optional `--m-*` tokens).
- Every fact this blueprint stands on was verified directly this run:
  content shape re-verified at src/pages/ProjectDetail.jsx:45-104; ProjectMedia API at
  src/components/ProjectMedia.jsx:69-74; OrgTag API at src/components/OrgTag.jsx:6-30; project data
  shape + getProject at src/data/projects.js:39-262; detail/tag/media class rules at
  src/index.css:601-910; router wrapping at src/main.jsx:20-31; machine tokens at
  src/machine/machine.css:1-9; absence of any portal/dialog/focus-trap util by grep across src.

## Defects logged (out of scope for this task)
Appending one LOW defect to tasks.md `## DEFECTS`: DetailLink + GitHubMark markup duplicated between
the legacy inline ProjectDetail.jsx:10-43 and the new co-located helper in DetailModal.jsx. Tolerated
because ProjectDetail is the legacy /projects/:slug route no task in this run rewires; OWNER
unassigned. Does NOT relax this task's DELIVERABLE.

STATUS: IMPLEMENT
