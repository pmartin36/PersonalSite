---
feature: ancient-machine
task: b4-t2
agent: tdd-research
updated: 2026-08-19
iteration: 1
---

## Mode
FRESH (no ASSUMPTIONS on b4-t2; researched from landed b1-t1/b1-t2/b1-t3 code + sibling faces II/III)

## Provenance
- "Machine mounts the five face stubs in DOM order; FaceIV needs no Machine.jsx edit" — origin:
  b1-t3 seam note (tasks.md). Re-verified at Machine.jsx:10-19 (imports FaceI..V; FACE_COMPONENTS
  array). So b4-t2 TOUCHES only the FaceIV files, matching tasks.md.
- "Clue mechanism = one wrapper span, order-keyed, emits data-clue-order/direction, render-prop gives
  {order,direction,directionGlyph,directionLetter,orderGlyph}, aria-hidden" — re-verified by reading
  landed Clue.jsx:26-55 (not taken from sibling research).
- "useAudio().play(name) is the audio seam; no-op while muted; throws on unknown name" — re-verified
  at audio.jsx:114-124,135-137. SOUNDS keys re-verified at audio.jsx:53-61 (grind/thunk/snap/etc).
- "Sibling face pattern" (default export + FaceSurface wrapper + co-located CSS + useAudio + Clue
  render-prop; audio mocked in test via vi.mock('../audio.jsx')) — re-verified at FaceII.jsx:1-100,
  FaceIII.jsx:1-138, FaceII.test.jsx:1-40.
- Contact hrefs (email/linkedin) — read directly from Landing.jsx:170,185. GitHub profile derived
  (see gap flag), not inherited.

## Verdict on assumptions
n/a (FRESH)

## Blueprint
APPROACH:
Fill the FaceIV stub (faces/FaceIV.jsx:1-9) with a 2x3 sliding-tile puzzle plus a back-plate move-5
clue routed through the b1-t1 Clue mechanism. One component + co-located CSS + test. Nothing
reinvented: slide state is local; audio via useAudio; clue via Clue; wrapper via FaceSurface.

1. TILE MODEL (2x3, row-major cells 0..5; row = floor(i/3), col = i%3).
   Initial arrangement (array length 6, GAP === null):
     [ about0, about1, GAP, email, linkedin, github ]
   i.e. row 1 = About / About / [empty] (gap at cell 2), row 2 = Email / LinkedIn / GitHub — the
   spec's exact starting layout. Each tile is `{ id, kind: 'about'|'contact', label, href? }`.
   State: `const [tiles, setTiles] = useState(INITIAL)`; `gapIndex = tiles.indexOf(null)`.

2. SLIDE STATE MACHINE (the core testable logic).
   `adjacent(a, b)` on the 2x3 grid: same row & |colA-colB|===1, OR same col & |rowA-rowB|===1.
   `trySlide(cellIndex)`: if `adjacent(cellIndex, gapIndex)` -> swap tiles[cellIndex] <-> tiles[gap]
   (produces new array), play the slide SFX; ELSE return (no state change, no audio) — non-adjacent
   click is a puzzle no-op. From the initial gap at cell 2 the only legal slides are cell 1 (About)
   and cell 5 (GitHub); cells 0/3/4 are non-adjacent no-ops.

3. TILE RENDERING (real buttons/links, keyboard-reachable for b5-t2).
   - About tile -> `<button type="button" onClick={() => trySlide(cell)}>` carrying the about-me
     copy. Slides when adjacent, no-op otherwise.
   - Contact tile -> `<a href={href} target="_blank" rel="noopener noreferrer"
     onClick={(e) => { if (adjacent(cell, gapIndex)) { e.preventDefault(); trySlide(cell) } }}>`.
     When adjacent the click slides (nav suppressed); when not adjacent the link navigates normally.
     The href is always the real contact URL, so "contact tiles link out" holds and is assertable
     regardless of slide state. No nested interactives (each tile is exactly one control), matching
     FaceIII's no-nesting discipline.
   Cells are positioned by CSS grid; each cell renders its tile or an empty gap cell. A slide is a
   CSS transform transition suppressed under `@media (prefers-reduced-motion: reduce)` (spec: no
   shake; state + links stay fully operable — the non-motion path b5-t2 relies on).

4. BACK-PLATE CLUE (move 5 = Down), ONE hook, routed through Clue, always mounted.
   Render a single `<Clue order={5} variant="tally" className="face4-clue">` on a `.face4-backplate`
   layer behind the grid. It emits data-clue-order=5 / data-clue-direction=Down from MOVES (Clue owns
   the hooks). Its render-prop composes the two spec pieces, both DERIVED:
   ```
   <Clue order={5} variant="tally" className="face4-clue">
     {({ order, directionGlyph }) => (
       <>
         <span className="face4-clue__order" data-clue-piece="order">
           {Array.from({ length: order }, (_, i) => (
             <span key={i} className="face4-tally__stroke" aria-hidden="true" />
           ))}
         </span>
         <span className="face4-clue__direction" data-clue-piece="direction">{directionGlyph}</span>
       </>
     )}
   </Clue>
   ```
   The tally is `order` (=5) vertical strokes (no top/bottom bars) — count DERIVED from order, never a
   literal 5; the direction piece is `directionGlyph` (Down -> the down glyph), never hand-typed. CSS
   absolutely positions `.face4-clue__order` at the row-1 col1|col2 seam and `.face4-clue__direction`
   at the row-2 col2|col3 seam (the two seams the spec names); the backplate sits behind the tiles so
   sliding visually uncovers each piece, while the data-clue-* hooks are present in the DOM at all
   times (b5-t2 reads hooks without solving — same always-mounted discipline as FaceII's back clue).
   Clue already sets aria-hidden, so the clue never announces the answer.

5. AUDIO: `const { play } = useAudio()`; a legal slide calls `play('grind')` (stone-on-stone scrape;
   a valid SOUNDS key, audio.jsx:57). No audio on a non-adjacent no-op. No arming/mute logic here —
   inherited from the provider (play is a no-op while muted).

INTERFACES:
- FaceIV (default export, no props) — unchanged signature; replaces the stub body.
- No new exported module APIs. Imports consumed:
  - `Clue` (default) from '../Clue.jsx' (b1-t1)
  - `FaceSurface` (default) from '../FaceSurface.jsx' (b1-t1)
  - `useAudio` from '../audio.jsx' (b1-t2)
  - `MOVES`/`moveByOrder` NOT imported by the component (clue goes through Clue by order); tests
    import MOVES/moveByOrder to assert against face IV's entry, never a literal.

DATA_FLOW:
Click a cell -> trySlide -> adjacent(cell,gap)? swap tiles + play('grind') : no-op. Clue order=5 ->
moveByOrder(5) = {order:5, direction:'Down', faceId:'IV'} -> data-clue-order/direction + tally(5
strokes) + down glyph. b5-t2 later reads this face's single data-clue-* hook (order 5/Down) off the
assembled machine.

FILES_NEW: [paulmartin.dev/src/machine/faces/FaceIV.css, paulmartin.dev/src/machine/faces/FaceIV.test.jsx]
FILES_EDIT: [paulmartin.dev/src/machine/faces/FaceIV.jsx (replace the stub body)]
File-size budget: all files new/small (FaceIV.jsx ~120 lines); limit 1000; no split.

## Duplicate / reuse check
EXISTING (reuse, do NOT reinvent):
- Clue renderer + render-prop — Clue.jsx:26-55. Route the move-5 clue through it; do NOT hand-write
  data-clue-* or a "5d"/"5 Down" literal. Tally count and direction glyph both come from the
  render-prop's derived {order, directionGlyph}.
- useAudio().play — audio.jsx:114,135. Reuse for the slide SFX; do NOT synthesize sound here.
- FaceSurface — FaceSurface.jsx. Keep the `<FaceSurface aria-label="Face IV">` wrapper.
- MOVES/moveByOrder — model.js:1-21. Tests assert against the face IV entry (order 5/Down).
- Contact hrefs: Email (mailto:p@ulmartin.me) and LinkedIn
  (https://www.linkedin.com/in/paul-martin-b8547616/) exist at Landing.jsx:170,185. No shared
  contact-links module exists; inline them in FaceIV. Duplication with the de-routed Landing page is
  registered LOW in tasks.md `## DEFECTS` (OWNER unassigned) — same class as the RESUME_URL defect,
  out of this task's scope (no task hoists contact links).
- No existing sliding-puzzle/adjacency code (grep clean); old maze logic is explicitly NOT reused
  (spec). New local state machine.
CLEANLINESS:
- Follow FaceII/FaceIII: default export, FaceSurface wrapper, co-located CSS, useAudio, Clue
  render-prop. Heading level: Face I owns the single <h1>; any heading here is <h2>/<h3> (or none —
  tiles are plain controls), matching FaceII/III.
- "One clue, one place": this face emits EXACTLY ONE clue hook (order 5) via one <Clue>. Enumerated
  clue construction in this file = 1 site, routed through Clue; direction is unreachable as a literal
  (only `order` is passed in). No bypass.

## Gap flagged to orchestrator
- GitHub contact tile href: the repo has NO existing personal GitHub-profile link (Landing carried
  Email/LinkedIn/Bluesky; project links use the pmartin36 org). The spec says "Bluesky dropped for
  GitHub" but gives no URL. Blueprint uses `https://github.com/pmartin36` (Paul's profile, derived
  from the pmartin36 username across project links). This is a NEW content value, not a spec-locked
  one — flag for Paul to confirm; not a blocker (a reasonable default exists).

## Test surface (feed-forward to test-writer)
PUBLIC_SURFACE:
- Six grid cells; initial arrangement row1 = About/About/gap, row2 = Email/LinkedIn/GitHub (gap at
  cell 2).
- Slide legality: clicking a tile adjacent to the gap moves it into the gap (arrangement changes);
  clicking a non-adjacent tile leaves the arrangement unchanged.
- A legal slide plays the slide SFX (play called once with a valid SOUNDS key); an illegal (no-op)
  click plays nothing.
- Contact tiles are real links whose href equals the expected Email/LinkedIn/GitHub URLs.
- Exactly one clue hook on the face: data-clue-order="5", data-clue-direction="Down" (equals MOVES
  face IV / moveByOrder(5)).
- The order piece renders exactly `order` (=5) tally strokes; the direction piece renders the derived
  down glyph.

SUGGESTED_TESTS:
- initial-layout: the six cells render About, About, (gap), Email, LinkedIn, GitHub in order; gap at
  cell index 2.
- slide-legal-adjacent: clicking the About tile at cell 1 (adjacent to gap at 2) moves it into cell 2
  and the gap to cell 1 (assert the new arrangement). Same for GitHub at cell 5.
- slide-illegal-nonadjacent: clicking the About tile at cell 0 (or Email at cell 3) does NOT change
  the arrangement (deep-equal before/after).
- audio-on-legal-slide-only: with useAudio mocked to a play spy (per FaceII.test pattern), a legal
  slide calls play exactly once with a valid SOUNDS key; a non-adjacent click does not call play.
- contact-links: getByRole('link', { name: /email|linkedin|github/i }) hrefs equal the expected
  Email/LinkedIn/GitHub values; About tiles are buttons, not links.
- clue-hooks: exactly one [data-clue-order] on the face; data-clue-order === "5" and
  data-clue-direction === "Down" (assert against moveByOrder(5), not a literal).
- tally-stroke-count: the number of .face4-tally__stroke elements === moveByOrder(5).order (=== 5),
  and the direction piece contains the derived down glyph (DIRECTION_GLYPH.Down) — derived, not
  hand-typed.
- Behavioral (screenshot evidence, not assertions; captured by code/validator per BEHAVIORAL): a
  legal slide visibly moves a tile and progressively uncovers the two back-plate clue pieces (tally +
  down); reduced-motion path keeps tiles operable with no slide animation.

STATUS: IMPLEMENT
