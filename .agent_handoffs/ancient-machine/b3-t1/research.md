---
feature: ancient-machine
task: b3-t1
agent: tdd-research
updated: 2026-08-19
iteration: 1
---

## Mode
FRESH (no ASSUMPTIONS on the task block; researched from codebase + spec)

## Blueprint
APPROACH:
Fill the FaceIII slot (currently a 9-line stub) with a three-reel slot machine plus the
colored-character clue for move 6 (Left). FaceIII is mounted by Machine.jsx:19 as `<FaceIII />`
with NO props, inside the AudioProvider (Machine.jsx:194) — so it reads audio via `useAudio()`
and owns its own local reel state. It is a leaf face consuming b1-t1 (Clue/model + FaceSurface),
b1-t2 (audio grind), and the reused project data. No new shared interface. b3-t2 later edits this
same FaceIII.jsx/.css to add the seam half-glyphs + the order-2 clue; I build the reel structure
so those decorations attach per reel face (feed-forward seam below).

Reel model (pure data, jsdom-gatable — the 3D wheel is screenshot evidence, not asserted):
- `REELS`: three arrays of exactly 3 faces each, entry = a project object or `null` (blank):
    reel 1 = [getProject('stargazer'), getProject('pong'), null]
    reel 2 = [getProject('the-16-spaces'), getProject('solar-express'), null]
    reel 3 = [null, null, null]
  Third face of every reel is null -> the "intentionally BLANK third face" invariant holds for all
  three reels; reel 3 is all-blank (future past-projects placeholder). Content pulled via the
  reused `getProject(slug)` (data/projects.js:262), not by re-importing/indexing previousProjects.
- State: `positions` = `[0,0,0]` (React state). `spin(reelIndex)` -> `positions[reelIndex] =
  (p+1)%3` AND `play('grind')`. Advancing wraps 2->0. Each reel's payline face = `positions[i]`.
- ALL THREE faces of each reel render in the DOM at once (a CSS-3D wheel: each face
  `rotateX(120deg*i) translateZ(radius)`, wheel `rotateX(-120deg*position)`); only the payline
  face sits in the window, with a SLIVER of the faces above/below showing at the horizontal seams
  (CSS `overflow:hidden` window shorter than the face; screenshot evidence). Because every face is
  always mounted, the order-6 clue hook is always in the DOM regardless of reel position — so
  b5-t2 can read it without choreographing spins.

Interaction / a11y: each reel is ONE real `<button className="face3-reel">` (Tab-reachable,
Enter/Space spins) wrapping its three non-interactive face `<div>`s. No interactive element is
nested inside the reel button (so OrgTag — which renders an `<a>`/`<Link>` — is NOT used here;
org is shown as plain text). This mirrors FaceII's rule that a button cannot contain another
interactive element. Reels do not open the modal (that is Face II); Face III is browse-only.

Colored clue — move 6 = Left (Hint 2), the per-face half of clue integrity:
Reconciliation (spec-flavor vs the one-hook invariant, resolved IN SCOPE — see note): the spec
(spec:116-121) wants a tinted order-digit and a same-tinted direction-letter riding on real
characters "across the projects on show", and permits the two characters on different cards ("may",
"e.g."). The hoisted CLUE-INTEGRITY INVARIANT (tasks.md:32-51) and b5-t2 require EXACTLY ONE hook
per (face,order): face III order 6 must be a single data-clue element. So:
  - The order-digit is rendered by a single `<Clue order={6} className="face3-clue face3-clue--digit">`
    render-prop yielding the tinted "6" (orderGlyph). This is the ONE hook: it emits
    data-clue-order="6" / data-clue-direction="Left" from MOVES (Clue.jsx:26-54), aria-hidden.
    Placed in reel-1 face-0 (Stargazer) card content.
  - The paired direction-letter is a decorative tinted span whose text is DERIVED, never hand-typed:
    `directionLetter(moveByOrder(6).direction)` -> "l" (reusing Clue.jsx's exported `directionLetter`
    + model's `moveByOrder`, the SAME MOVES entry the hook reads, so the two cannot diverge). It
    carries NO data-clue hook. Placed in reel-2 face-0 (The 16 Spaces) card content.
  - Both share ONE tint (`.face3-clue-tint`, a legible warm/accent tone distinct from moss) so a
    human pairs them by color across the two shown cards. Both cards are face-0, so the pair is
    visible at the default alignment AND the hook is always mounted.
Result: exactly one order-6 hook, both glyphs MOVES-derived, "read across two cards" flavor kept.

Reduced motion: the 3D wheel spin is a CSS transition gated off under
`@media (prefers-reduced-motion: reduce)` (the face still swaps instantly; state still advances,
button still works) — reels stay keyboard-operable and in DOM order for b5-t2. No JS branch needed.

INTERFACES:
- `FaceIII.jsx` default export `FaceIII()` — no props. Internal only:
  - const `REELS` (3x3 of project|null), const `DIGIT_SLOT`/`LETTER_SLOT` naming the two clue-
    bearing faces (single source for placement).
  - local state `positions:[number,number,number]`; `spin(i)` advances mod 3 + `play('grind')`.
  - subcomponent `Reel({ faces, position, onSpin, digitClue, letterClue })` -> `<button
    className="face3-reel" data-reel data-position onClick={onSpin}>` containing three
    `ReelFace`.
  - subcomponent `ReelFace({ project, active, blank, children })` -> `<div className="face3-reel__face"
    data-reel-face data-active data-blank>` rendering Still(project.thumb) + name + org-as-text +
    short blurb for a project, empty for a blank; `children` slot carries the clue glyph when this
    is the digit/letter face.
- Reused as-is: `Still` (components/Still.jsx) for thumb; `Clue` + `directionLetter` (machine/Clue.jsx);
  `moveByOrder` (machine/model.js); `useAudio().play` (machine/audio.jsx); `getProject`,
  `previousProjects` content (data/projects.js); `FaceSurface` (machine/FaceSurface.jsx).

DATA_FLOW:
mount -> positions [0,0,0] -> render three reels, each mapping its 3 faces (all in DOM). Reel-1
face-0 renders `<Clue order={6}>` (the hook + tinted "6"); reel-2 face-0 renders the derived
tinted "l". Tap a reel -> setPositions(advance i) + play('grind') (no-op while muted/unarmed,
audio.jsx guard) -> that reel's active face changes; other reels unaffected. The order-6
data-clue-* is consumed by FaceIII's own test and by b5-t2's whole-puzzle proof.

FILES_NEW:
- paulmartin.dev/src/machine/faces/FaceIII.css
- paulmartin.dev/src/machine/faces/FaceIII.test.jsx
FILES_EDIT:
- paulmartin.dev/src/machine/faces/FaceIII.jsx  (replace the 9-line stub body; final ~120-150 lines,
  well under the 1000-line budget)

File-size budget: all three files new/small (FaceII.jsx=100, FaceII.css=127 for reference). No split.

## Duplicate / reuse check
EXISTING (reuse, do NOT reinvent):
- machine/Clue.jsx:26 — the ONLY clue construction path; `order={6}` derives order/direction/glyph
  from MOVES. Do NOT hand-type "6", "l", "Left", "<-", or write data-clue-* by hand. `directionLetter`
  is EXPORTED (Clue.jsx:18) — the derived letter reuses it, not a literal.
- machine/model.js:15 `moveByOrder` — supplies the MOVES entry the letter derives from (same entry
  as the hook, so digit-hook and letter cannot disagree).
- machine/audio.jsx `useAudio().play('grind')` — SOUNDS.grind exists (audio.jsx:11 comment names
  "grind (Face III reel)"); no new sound, no second audio path.
- components/Still.jsx — card thumbnail (image={project.thumb}); reused as in FaceII.jsx:42.
- data/projects.js `getProject` — reel content by slug (stargazer, pong, the-16-spaces,
  solar-express are all in previousProjects). Do not re-declare project copy in FaceIII.
- FaceSurface (FaceSurface.jsx) — one wrapper `<FaceSurface aria-label="Face III">` only.
CLEANLINESS:
- "One rule, one place" for face III's move-6 clue: after this task the ONLY order-6 construction
  site is `rg -n 'order=\{6\}' src` -> the single `<Clue order={6}>` in FaceIII.jsx (grep is clean
  today: no order={6} anywhere). Direction is unreachable from caller code — Clue's only input is
  `order` — so the hook cannot carry a hand-typed direction. The paired letter reuses
  `directionLetter(moveByOrder(6).direction)`; it is derived, hookless, and shares the hook's MOVES
  entry. b3-t2 will add the SEPARATE order-2 hook to this file; keep order-6 isolated so the two
  clues never collide.
- OrgTag (components/OrgTag.jsx) is deliberately NOT used on the reels: it renders an `<a>`/`<Link>`
  and the reel is a single spin `<button>`; nesting interactive-in-interactive is invalid (same
  constraint FaceII handled by making corner/Details siblings). Org shown as plain text.
- Co-locate all Face III CSS in FaceIII.css (tasks.md:410 co-location rule); do NOT touch shared
  machine.css / MachineShell.css.

## Constraints that must not regress
- Keep `<FaceSurface aria-label="Face III">` as the single labeled region. Machine.test.jsx:67-77
  asserts exactly five regions labeled Face I..V via getAllByRole('region'); any extra `<section
  aria-label>` (a second FaceSurface, or a labeled landmark) inside FaceIII adds a 6th region and
  BREAKS Machine.test.jsx. Reels/faces are `<button>`/`<div>`, never labeled sections.
- Query the clue in tests by `[data-clue-order="6"]` (NOT "exactly one [data-clue-order]"): b3-t2
  adds an order-2 hook to this same face later, so a total-count assertion would go stale.

## Spec vs task-block note (resolved in scope, no routing)
Spec:116-121 "the two characters may sit on different cards, paired by color" vs the one-hook-per-
order invariant (tasks.md:32-51, spec:190-211): reconciled by rendering one order-6 hook (the digit
Clue) + a derived hookless tinted letter, on two different face-0 cards. Both derive from the same
MOVES entry. Not a decomposition gap; no new functionality beyond the task's stated scope.

## Test surface (feed-forward to test-writer)
PUBLIC_SURFACE:
- Three reels render, each a real spin `<button>` (data-reel 0..2, data-position).
- Tapping a reel advances THAT reel's position by one and wraps through its three faces (0->1->2->0);
  each tap calls `play('grind')`; other reels are unaffected.
- Every reel has a blank face at index 2 (data-blank="true"); reel 3's three faces are all blank.
- Reel content: reel 1 faces = Stargazer, Pong, blank; reel 2 = The 16 Spaces, Solar Express, blank
  (project names present in the rendered faces).
- The payline face per reel (the one at `positions[i]`) is marked active (data-active) — the sliver
  of neighbor faces is CSS/screenshot evidence, not asserted.
- Colored clue: exactly one `[data-clue-order="6"]` element, data-clue-direction="Left", tinted
  glyph "6" (== MOVES face III order 6). A paired tinted letter element reads
  `directionLetter(moveByOrder(6).direction)` ("l") and carries the shared tint class.
- The order-6 hook is present in the DOM at default render (all reel faces mounted), unspun.
SUGGESTED_TESTS (FaceIII.test.jsx; mock audio like FaceII.test.jsx:11-21 with a play spy):
- renders three reel spin buttons at position 0.
- spin reel 0 three times -> data-position cycles 1,2,0 (wrap); each click calls play('grind').
- every reel's index-2 face has data-blank="true"; reel 3 all three faces blank.
- reel 1 shows Stargazer/Pong (+ blank), reel 2 shows The 16 Spaces/Solar Express (+ blank).
- exactly one [data-clue-order="6"]; its data-clue-direction="Left" and glyph text contains "6".
- the paired tinted letter element's text === directionLetter(moveByOrder(6).direction) and it has
  the shared tint class (guards the pair derives from the same MOVES entry).
- the order-6 hook exists at initial render without spinning any reel.
- (behavioral/screenshot, not unit) payline shows one face per reel with slivers of neighbors; the
  same-tinted 6 and Left are legible across the two shown cards; under emulated reduced-motion the
  reel swaps with no spin.

## Provenance
Derived independently by reading source directly this run. Load-bearing facts inherited from
siblings and their disposition:
- FaceIII mounted with no props, wrapped in AudioProvider; regions asserted by aria-label — from
  b1-t3/research.md + b2-t2/research.md. RE-VERIFIED at Machine.jsx:12,19,163,194 and
  Machine.test.jsx:67-77.
- Clue API (order prop, variant, render-prop {orderGlyph,directionLetter,...}, emits
  data-clue-order/direction, aria-hidden; exports directionLetter) — from b1-t1/research.md.
  RE-VERIFIED at Clue.jsx:18,26-54.
- MOVES face III order 6 = {direction:'Left'}; moveByOrder throws on miss — from b1-t1. RE-VERIFIED
  at model.js:7,15-21.
- `play('grind')` exists / no-op while muted+unarmed; audio mock pattern — from b1-t2 + b2-t2.
  RE-VERIFIED at audio.jsx:11 (SOUNDS comment) and FaceII.test.jsx:11-21.
- getProject + slugs (stargazer, pong, the-16-spaces, solar-express in previousProjects), Still
  signature, OrgTag renders a link — DERIVED independently by reading projects.js:130-262,
  Still.jsx, OrgTag.jsx this run.
- One-hook-per-(face,order) invariant — from tasks.md:32-51 and spec:190-211 (spec is authority);
  drives the digit-hook + derived-letter split above.

## Notes to orchestrator
- No new DEFECTS measured; no edit to tasks.md.
- Feed-forward seam to b3-t2: each reel face is a stable `.face3-reel__face` element (data-reel-face
  index) rendered for all three faces of all three reels, so b3-t2 can attach left/right edge
  half-glyph layers and its order-2 Clue without restructuring. b3-t1 builds ONLY the order-6 clue;
  the order-2 seam clue is b3-t2's.

STATUS: IMPLEMENT
