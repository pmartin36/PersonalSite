---
feature: ancient-machine
agent: tdd-scope-validator
updated: 2026-08-19
iteration: 1
---

## Scope
BUCKET: b2
TASKS_REVIEWED: [b2-t1, b2-t2]

## Seam checks
- b2-t2 -> b2-t1 (DetailModal API): FaceII.jsx:96 renders `<DetailModal project={modalProject} onClose={...} />`;
  DetailModal.jsx:47 exports `{ project, slug, onClose }`. Prop names/shape match. — OK
- b2-t2 -> b1-t1 (Clue mechanism): FaceII.jsx:68 `<Clue order={3} variant="seven-seg">` with render-prop
  `({ orderGlyph, directionLetter }) => ...`. Clue.jsx:26-42 supplies exactly those keys; emits
  data-clue-order=3 / data-clue-direction=Left from moveByOrder(3) (model.js:4). Glyph "3L" derived, not
  hand-typed. Matches MOVES order-3 (Left/faceId II). — OK
- b2-t2 -> b1-t2 (audio): FaceII Card.toggleFlip calls play('flip'); SOUNDS.flip exists (audio.jsx:58) and
  play() throws on unknown name — 'flip' is valid. — OK
- b2-t2 -> b1-t3 (FaceII slot): Machine.jsx:11,19 mounts FaceII in FACE_COMPONENTS; whole tree wrapped in
  AudioProvider (Machine.jsx:194) and BrowserRouter (main.jsx:22), so useAudio + react-router Link
  (OrgTag/DetailLink) have context at runtime. — OK
- b2-t1 -> b1-t1 (projects data + ProjectMedia + OrgTag): DetailModal consumes project.hero/name/org/
  headline/year/role/tags/body/links. currentProjects carry no `org`/`role`; OrgTag.jsx:7 returns null on
  falsy org and role tag is conditionally rendered (DetailModal.jsx:128). No crash on the current-project
  set that FaceII actually opens. — OK
- b2-t1 -> b1-t4 (scroll arbitration, cross-bucket): modal portals to document.body (DetailModal.jsx:150),
  OUTSIDE the machine root where useScrollNav's wheel listener is attached (useScrollNav.js:94), so modal
  wheel events never reach the drum handler; body is bounded (panel max-height:90vh flex column,
  .detail-modal__body overflow-y:auto) so native scroll engages. Outcome matches the seam intent (modal
  scrolls, drum does not) even though the isolation is by portal scoping rather than findScrollableAncestor. — OK

INTEGRATION_TESTED: `npm --prefix paulmartin.dev test && npm --prefix paulmartin.dev run build` — 7 files /
69 tests passed; vite build 92 modules, dist emitted, exit 0. FaceII.test.jsx mocks ONLY audio (play spy);
it drives the real DetailModal + Clue + ProjectMedia + Still + OrgTag composition across all three
currentProjects, so the modal-open and clue-hook seams are exercised against real components, not stubs.

## Findings
- SEVERITY low — TASK b1-t1 — b2-t1 broadened the shared harness file vitest.setup.js (owns: b1-t1; not in
  b2-t1 TOUCHES) so the global window.matchMedia stub returns `matches:true` for EVERY query, not just
  prefers-reduced-motion. Non-behavioral (production has real matchMedia; whole suite green), but a future
  test querying an unrelated media feature silently gets matches:true. Nit only — no routing. — ROUTE → test-writer

## Verdict
PASS
