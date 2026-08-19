---
feature: ancient-machine
task: b2-t2
agent: tdd-research
updated: 2026-08-19
iteration: 1
---

## Mode
FRESH (no ASSUMPTIONS on the task block; researched from codebase + spec)

## Blueprint
APPROACH:
Fill the FaceII slot with three independently-flipping current-project cards, each on a
CSS-3D "spindle", plus a modal opener. FaceII is mounted by Machine.jsx as `<FaceII />` with
NO props (Machine.jsx:167 renders `<Face />`); it reads audio via `useAudio()` (AudioProvider
wraps the whole shell, Machine.jsx:198-204) and owns its own local state. No new shared
interface — this is a leaf face consuming b1-t1 (Clue/model/FaceSurface), b1-t2 (audio), b2-t1
(DetailModal).

Card = a standard two-face flip card (both faces ALWAYS in the DOM; back is `rotateY(180deg)`,
`backface-visibility:hidden`). A per-card `flipped` boolean toggled by a corner control drives
`.face2-card--flipped` (container gets `rotateY(180deg)`). Because both faces stay mounted, the
back-face clue hook is present in the DOM regardless of flip state — this is what lets b5-t2 read
it without flipping anything.

Front is one big "Details" button (the big hit target, spec II line 81 + line 269) that opens the
b2-t1 modal for THAT card's project. The corner flip control is a SEPARATE small button, a sibling
of (never nested in) the Details button — an HTML button cannot contain another button, so the
"one large Details button" and the "distinct corner control" must be siblings, the corner one
absolutely positioned over a corner. Front corner flips to back; an identical corner control on the
back flips home (spec II line 78, line 270-271). Every flip (to-back and home) calls `play('flip')`.

CLUE PLACEMENT — exactly ONE card back carries the clue, not all three. The hoisted
CLUE-INTEGRITY INVARIANT (tasks.md lines 32-51) enumerates the six hooks as one-per-(face,order):
"II=3" is singular, and b5-t2 collects "the six rendered data-clue-* hooks ... ordered by order
they reconstruct SEQUENCE". Three order-3 hooks in Face II would give the proof duplicate/extra
hooks and break the reconstruction. The task DELIVERABLE prose ("its corner control flips to a back
showing the 3L clue") reads per-card, but the spec's invariant is authority on this detail and wins:
render the Clue on ONE designated card back (`CLUE_CARD_INDEX = 0`, a single named const), the other
two backs are plain decorative stone with no data-clue hook. All three cards still flip; only one
back bears the clue. FLAGGED so the test-writer asserts EXACTLY ONE order-3 hook in Face II.

The clue renders through the b1-t1 Clue mechanism as the seven-segment "3L" glyph (spec line 180),
direction/order never hand-typed:
  <Clue order={3} variant="seven-seg">
    {({ orderGlyph, directionLetter }) =>
      <span className="face2-clue__glyph">{orderGlyph}{directionLetter.toUpperCase()}</span>}
  </Clue>
Clue emits data-clue-order="3"/data-clue-direction="Left" from MOVES; the render-prop yields
orderGlyph="3" and directionLetter="l" (Clue.jsx:16-24) -> displayed "3L". The `.clue--seven-seg`
variant class already exists (machine.css:55-57).

Hover wiggle is CSS-only: `.face2-spindle:hover .face2-card` runs a small keyframe wobble; disabled
under `@media (prefers-reduced-motion: reduce)` (and the flip transition likewise reduced to an
instant swap). This is visual — behavioral/screenshot evidence, not a unit assertion.

INTERFACES:
- `FaceII.jsx` default export `FaceII()` — no props (mounted by Machine). Internal only:
  - local state: `modalProject` (the project whose DetailModal is open, or null).
  - subcomponent `Card({ project, showClue })` — owns its `flipped` bool, renders front (Details
    button + corner flip) and back (corner flip + optional Clue). Calls `onOpen(project)` and
    `play('flip')`.
  - const `CLUE_CARD_INDEX = 0` — single source for which card back holds the clue.
  - DOM contract for tests: card root carries `data-flipped={flipped ? 'true' : 'false'}`; corner
    control is a `<button>` with `aria-label` (e.g. "Flip card to clue" / "Flip card back") and
    `aria-pressed={flipped}`.
- Reused as-is: `Still` (src/components/Still.jsx) for `project.thumb`; `OrgTag`
  (src/components/OrgTag.jsx) for `project.org`; `DetailModal` (src/machine/DetailModal.jsx,
  `{ project, onClose }`); `Clue` + `useAudio` + `currentProjects`.

DATA_FLOW:
currentProjects (data/projects.js, 3 entries) -> map to Card. Details button click ->
setModalProject(project) -> `{modalProject && <DetailModal project={modalProject}
onClose={() => setModalProject(null)} />}`. Corner click -> toggle card `flipped` -> class change
(CSS spin) + `play('flip')`. play() is a no-op while muted/unarmed (audio.jsx:150), so no gating
needed. Card at CLUE_CARD_INDEX renders `<Clue order={3} variant="seven-seg">` on its back ->
data-clue-* consumed by FaceII's own test and by b5-t2's whole-puzzle proof.

FILES_NEW: [paulmartin.dev/src/machine/faces/FaceII.css, paulmartin.dev/src/machine/faces/FaceII.test.jsx]
FILES_EDIT: [paulmartin.dev/src/machine/faces/FaceII.jsx (replace the stub body; currently 9 lines — final well under the 1000-line budget)]

## Duplicate / reuse check
EXISTING:
- src/machine/DetailModal.jsx:47 — `DetailModal({ project, slug, onClose })`; render it, do NOT
  re-implement any overlay/focus-trap. Modal already portals to document.body to escape the drum's
  3D transform (DetailModal.jsx blueprint), so it covers the true viewport from inside FaceII.
- src/machine/Clue.jsx:36 — the ONLY clue construction site; order/direction come from MOVES via
  `order={3}`. Do not hand-type "3", "L", "Left", "<-", or write data-clue-* by hand.
- src/machine/audio.jsx — `useAudio().play('flip')` (SOUNDS.flip exists, audio.jsx:89). Do not add
  a new sound or a second audio path.
- src/components/Still.jsx + src/components/OrgTag.jsx — reuse for the card front media/org chip.
- src/data/projects.js:`currentProjects` — the three cards' content, imported as-is.
- Existing CSS classes `.tag`, `.card-year`, `.card-name`, `.card-headline` (index.css) may be
  reused on the front for visual consistency; not required.
CLEANLINESS:
- src/components/ProjectCard.jsx is NOT reusable here: it is bound to react-router `<Link
  to=/projects/:slug>`, `useRaft`, and `useReveal` (the galaxy path). Face II needs a modal-opening
  button + flip, not navigation. Build a bespoke card; reuse only the leaf `Still`/`OrgTag`.
- "One rule, one place" for the clue: `order={3}` is the ONLY place move 3 is named in this file;
  the seven-seg presentation reads orderGlyph/directionLetter from the render-prop, never a literal.
- Keep FaceII's CSS co-located in FaceII.css (per tasks.md line 410 co-location rule); no edits to
  shared machine.css/MachineShell.css.

## Test surface (feed-forward to test-writer)
PUBLIC_SURFACE:
- Three cards render (one per currentProjects entry).
- Each card flips: corner control toggles the card between front and back (front<->back state
  machine); a second corner click flips home. Assert via `data-flipped` / `aria-pressed` toggling
  (jsdom does not compute backface-visibility, so assert on state attribute, not visual hiding).
- The front Details button opens the b2-t1 modal for the CORRECT project (modal shows that
  project's name/title); it does NOT flip the card. Escape/close unmounts the modal.
- Exactly ONE data-clue hook exists in Face II, on the designated card back, with
  data-clue-order="3" and data-clue-direction="Left" (== MOVES face II), displayed as "3L".
- Flip invokes audio `play('flip')` on both to-back and home (assert via a spied/mocked
  `useAudio` — e.g. `vi.mock('../audio.jsx')` returning a play spy, or render inside a provider
  exposing a spy — since real synth requires armed+unmuted which is out of a unit test's control).
SUGGESTED_TESTS:
- flip state machine: initial front (data-flipped=false) -> corner click -> back (true) -> corner
  click -> front (false), per card.
- Details button click opens DetailModal with the matching project title; corner click does not
  open the modal.
- exactly one `[data-clue-order]` in the FaceII subtree; its order=3, direction=Left, text "3L".
- corner flip calls play('flip') (spy) on each toggle.
- (behavioral/screenshot, not unit) hover wiggle present under motion; flip animates; under
  emulated prefers-reduced-motion the flip swaps instantly with no wobble.

## Provenance
Derived independently by reading source directly. Load-bearing facts and where re-verified:
- FaceII mounted with no props; AudioProvider wraps shell — re-verified Machine.jsx:167,198-204.
- MOVES face II = {order:3, direction:'Left'}; SEQUENCE derives from MOVES — re-verified model.js:1-13.
- Clue API (order prop, variant, render-prop with orderGlyph/directionLetter, emits data-clue-*,
  aria-hidden) — re-verified Clue.jsx:36-79. `.clue--seven-seg` exists — re-verified machine.css:55.
- `play('flip')` exists and is a no-op while muted/unarmed — re-verified audio.jsx:89,150.
- DetailModal signature `{project, slug, onClose}`, portals to body, null when no project — claim
  originated in b2-t1/research.md; re-verified against DetailModal.jsx:47 (the real code).
- currentProjects has 3 entries with name/thumb/org?/headline/blurb/tags — re-verified projects.js.
- CLUE-INTEGRITY INVARIANT (one hook per face, "II=3") — from tasks.md:32-51 and spec:173,180
  (spec is authority); drives the single-clue-card decision above.

STATUS: IMPLEMENT
