# Feature: ancient-machine
SOURCE: plans/ancient-machine-spec.md
GATE_COMMAND: `npm --prefix paulmartin.dev test && npm --prefix paulmartin.dev run build`

# Notes for the pipeline
# - No test runner or linter exists in this repo today. The spec's "Clue integrity
#   (build contract)" section is explicit that a mislabeled clue glyph must FAIL THE
#   BUILD, not surface when a human tries to solve it. A build-only gate cannot do
#   that, so the gate runs the unit suite THEN the Vite build. b1-t1 stands up the
#   runner (vitest + jsdom + @testing-library/react + a `test` script = `vitest run`)
#   as part of its work; every later task's tests extend that one harness. Until
#   b1-t1 adds the `test` script the gate's first clause has nothing to run, which is
#   why b1-t1 is first and owns the harness.
# - Playwright is a devDependency with no runner/config. It is used ONLY for captured
#   visual evidence on behavioral tasks (real CSS-3D tumble, reduced-motion crossfade,
#   moss render) — never as the gate. The whole-puzzle clue-integrity proof is a
#   GATED vitest+jsdom test (it needs the DOM hooks and lock logic, not real 3D), so
#   a wrong clue breaks the deterministic gate.
# - There are NO existing tests, so STALE_TESTS is `none` on every task.
# - Everything lives under paulmartin.dev/. This feature REPLACES the galaxy/maze
#   Landing at route "/" (b1-t3 repoints main.jsx). The galaxy modules (Landing.jsx,
#   MazeBackground, ChevronDots, NameShimmer, useRaft, shimmer, reveal) are kept safe
#   on galaxy-redesign; this plan does not delete them, it stops routing to them.
# - REUSED as-is: src/data/projects.js (currentProjects, previousProjects, getProject);
#   src/data/solvers.js and the /solved copy (onto face V); src/components/ProjectMedia.jsx
#   and OrgTag.jsx (by the modal). RESUME_URL currently lives duplicated as a literal in
#   Landing.jsx:9 and ProjectDetail.jsx:7 (value:
#   https://drive.google.com/file/d/1utBX7U7q98kJ-Uqrk-3AnSkR2xn6BEXH/view?usp=sharing);
#   the spec requires it be defined ONCE as a shared export imported by face I. b1-t1
#   owns that single export; face I imports it (never re-declares the literal).
#
# CLUE-INTEGRITY INVARIANT (hoisted — spec "Clue integrity (build contract)"):
#   "MOVES is the single source of truth; SEQUENCE derives from it; nothing anywhere
#    hardcodes a direction literal outside MOVES; every face renders its clue FROM
#    MOVES (the stylized glyph is a presentation of the MOVES entry, never an
#    independently typed arrow/letter) and emits data-clue-order/data-clue-direction
#    from the SAME entry; each face test asserts its rendered clue's data-clue-* equals
#    its MOVES entry; the whole-puzzle proof reads the six data-clue-* hooks, asserts
#    ordered-by-order they reconstruct SEQUENCE, then enters THAT collected sequence
#    into face V and asserts the solved reveal."
#   OWNER: b1-t1 provides the mechanism — a single Clue renderer keyed by move order
#   that emits BOTH the stylized glyph AND the data-clue-* attributes from one MOVES
#   entry, so glyph and hook cannot diverge. Every clue-bearing face routes its clue
#   through it (faces do not hand-type arrows/letters and do not hand-write
#   data-clue-*). The CHECK THAT FAILS ON BYPASS: (a) each face test asserts its
#   rendered data-clue-* == MOVES[that move]; (b) b5-t2's gated proof collects every
#   rendered data-clue-* from the assembled machine, reconstructs SEQUENCE, and drives
#   the face V lock to solved. A face rendering a wrong direction (or one hook missing)
#   breaks (a) and (b) and fails the gate. faceId->moves: III owns TWO (order 2 seam,
#   order 6 colored); V owns order 1 (the Up gimme still emits a hook so the six hooks
#   reconstruct the full six-move SEQUENCE); I=4, II=3, IV=5.

## Bucket b1: Foundation — puzzle model + clue mechanism, audio, machine shell, scroll nav
INTEGRATION SEAMS: b1-t1 exports the puzzle model (MOVES + derived SEQUENCE + RESUME_URL),
the shared FaceSurface stone primitive, the design tokens, and the Clue renderer (glyph +
data-clue-* from one MOVES entry) that EVERY clue-bearing face routes through — the hoisted
clue-integrity mechanism. b1-t2 exports the audio `play(name)` API consumed by the shell and
every face. b1-t3 exposes the machine API `rotateTo(index)` + `currentFace`, mounts five
FaceSurface regions in DOM order importing five stub face modules the face tasks fill, routes
the snap SFX through rotateTo-on-settle (ALL turns inherit it) and the intro thunk, and owns the
reduced-motion crossfade path every face inherits. b1-t4 drives the shell from scroll and owns
the overflow-based scroll arbitration (no marker token, so no edge to any scrollable region).

### Task b1-t1: Puzzle model, clue mechanism, design tokens, FaceSurface, test harness
DESCRIPTION: Create the single source of truth and the shared primitives every later task
builds on. Export `MOVES` (a table keyed by move order 1..6, each `{ order, direction, faceId }`:
1 Up/V, 2 Right/III, 3 Left/II, 4 Up/I, 5 Down/IV, 6 Left/III) and `SEQUENCE` DERIVED from MOVES
ordered by order (Up, Right, Left, Up, Down, Left) — no direction literal is written anywhere
but inside MOVES. Export `RESUME_URL` once (value currently duplicated at Landing.jsx:9). Build
the clue-integrity MECHANISM: a `Clue` renderer keyed by a move order that returns the stylized
glyph AND the `data-clue-order`/`data-clue-direction` attributes from the SAME MOVES entry (per-
face styling — tint, underline, half-glyph, tally — is passed in as a variant; the order/direction
are never re-typed by callers). These hooks are NOT aria-labels and must not announce the answer.
Export the `FaceSurface` component (a bordered stone-placeholder panel with a chiseled-edge bevel
and a content slot; b5-t1 later skins it) and the CSS design tokens (warm sandstone/buff/ochre,
moss green, deep crevice shadow, aged brass, one warm accent). Stand up the test harness the whole
plan needs: add vitest + jsdom + @testing-library/react and a `test` script (`vitest run`) to
paulmartin.dev/package.json.
DELIVERABLE: `npm --prefix paulmartin.dev test` runs and passes; a test asserts SEQUENCE derived
from MOVES equals [Up,Right,Left,Up,Down,Left] and that the `Clue` renderer for each order emits
data-clue-order/direction equal to that MOVES entry and a glyph tied to it (not a re-typed
literal). `vite build` passes with the module imported. FaceSurface renders a visible bordered
panel (screenshot evidence).
DEPENDS_ON: [none]
TOUCHES: [paulmartin.dev/src/machine/model.js (new), paulmartin.dev/src/machine/Clue.jsx (new), paulmartin.dev/src/machine/FaceSurface.jsx (new), paulmartin.dev/src/machine/machine.css (new), paulmartin.dev/src/machine/model.test.js (new), paulmartin.dev/src/machine/Clue.test.jsx (new), paulmartin.dev/package.json]
BEHAVIORAL: yes
RESEARCH: full
TEST_RECOMMENDATION: write
TEST_RATIONALE: MOVES/SEQUENCE and the Clue renderer are the clue-integrity mechanism the whole
puzzle rides on; a wrong entry or a glyph/hook divergence silently breaks the solve. Lock it here.
ASSUMPTIONS: [vitest+jsdom+@testing-library/react is the runner to stand up (no runner exists);
research confirms it renders data-clue-* attributes and fires clicks well enough to host both the
per-face clue tests and the b5-t2 whole-puzzle proof, so no second harness is invented later]

### Task b1-t2: Audio layer — mechanical SFX, muted by default, gesture-armed
DESCRIPTION: Build the audio system: a set of mechanical SFX (thunk, grind, snap, shake) behind a
`play(name)` API (context/provider + hook), defaulting to MUTED with an obvious unmute control on
the machine. The first user gesture arms audio (autoplay policy); while muted `play` is a no-op.
SFX may be WebAudio-synthesized or small placeholder assets — research picks; the API surface is
the contract consumers depend on.
DELIVERABLE: `vite build` passes and the suite stays green; a test asserts `play` is a no-op while
muted and that the first gesture flips arming on; with sound unmuted a gesture produces audible
output (captured evidence: short recording or a WebAudio-node assertion).
DEPENDS_ON: [b1-t1]
TOUCHES: [paulmartin.dev/src/machine/audio.jsx (new), paulmartin.dev/src/machine/audio.test.jsx (new)]
BEHAVIORAL: yes
RESEARCH: full
TEST_RECOMMENDATION: write
TEST_RATIONALE: Muted-default and gesture-arming are contractual (autoplay policy); a regression
either autoplays sound or never plays it.
ASSUMPTIONS: [SFX can be synthesized at runtime via WebAudio rather than shipped as audio assets,
so no asset-generation blocks this task; research validates that muting/arming are testable in jsdom]

### Task b1-t3: Pentagonal machine shell — 3D rotation, rotateTo (snap-on-settle audio), wayfinding, intro, reduced-motion
DESCRIPTION: Build the shell that replaces Landing at "/". A pentagonal prism of five rectangular
FaceSurface regions rotating about a HORIZONTAL axis (faces tumble top-over-bottom) via CSS 3D
transforms, front face filling the viewport (full-bleed), edges/depth visible mid-turn, hard snap
at rest. Own `currentFace` and `rotateTo(index)` (order 1->2->3->4->5->1, reversible, wrap-around).
Route the snap SFX through rotateTo-on-settle so EVERY turn (scroll-driven and button-driven alike,
current and future callers) plays the snap — the audio trigger lives in rotateTo, not per caller.
The intro settle on load plays the THUNK (the weighty landing sound), not the snap. Mount the five
faces as real regions IN DOCUMENT ORDER by importing five stub face modules (FaceI..FaceV, created
here as placeholders the face tasks fill). Render wayfinding: a row of five etched pips bottom-right,
current face lit. Intro: on load the machine settles with a shake + thunk, skippable, resting on
face I; static (no settle) under prefers-reduced-motion. Reduced-motion mechanism (every face
inherits it): no tumble/shake — faces become a plain crossfade / stacked sequence, all reachable in
DOM order. Repoint main.jsx "/" at this shell.
DELIVERABLE: `vite build` passes and the suite stays green; `rotateTo` brings the correct face to
front and lights the matching pip, and EVERY rotateTo settle fires the snap SFX while the load intro
fires the thunk (evidence: per-face screenshots + a test/spy asserting rotateTo-on-settle plays snap
and intro plays thunk); on load the machine rests on face I; under emulated prefers-reduced-motion
faces crossfade with no tumble and all five regions are present in DOM order (evidence). A test
asserts rotateTo wrap-around order and that reduced-motion selects the crossfade path.
DEPENDS_ON: [b1-t1, b1-t2]
TOUCHES: [paulmartin.dev/src/machine/Machine.jsx (new), paulmartin.dev/src/machine/MachineShell.css (new), paulmartin.dev/src/machine/Machine.test.jsx (new), paulmartin.dev/src/machine/faces/FaceI.jsx (new stub), paulmartin.dev/src/machine/faces/FaceII.jsx (new stub), paulmartin.dev/src/machine/faces/FaceIII.jsx (new stub), paulmartin.dev/src/machine/faces/FaceIV.jsx (new stub), paulmartin.dev/src/machine/faces/FaceV.jsx (new stub), paulmartin.dev/src/main.jsx]
BEHAVIORAL: yes
RESEARCH: full
TEST_RECOMMENDATION: write
TEST_RATIONALE: Rotation order/wrap, the snap-on-settle audio routing (must fire for all callers),
and the reduced-motion branch are the logic the whole navigation + accessibility + audio story ride on.
ASSUMPTIONS: [A five-faced prism on a horizontal axis with the front face filling the viewport is
achievable with CSS 3D (perspective + rotateX on stacked faces); validate the geometry and the
front-fills-viewport framing before committing. The snap SFX must be emitted inside rotateTo-on-settle
so scroll nav (b1-t4) and the face I Contact button (b4-t1) inherit it without their own audio call.]

### Task b1-t4: Scroll/inertia navigation with debounce + overflow-based region arbitration
DESCRIPTION: Drive the shell from scroll: wheel / two-finger drag with inertia and firm debouncing
so exactly ONE gesture moves exactly ONE face (reversible), each turn ending in a hard snap via
`rotateTo` (which already plays the snap). Add scroll arbitration per the spec's fixed mechanism:
decide by walking the pointer's DOM ANCESTOR CHAIN for an element whose computed `overflow` is
auto/scroll AND which has real overflowing content — if found, scroll drives that content; else it
rotates the drum. It must NOT key off a bespoke marker attribute/class, so scrollable faces and the
modal need only native overflow and there is no dependency edge from this task to them.
DELIVERABLE: `vite build` passes and the suite stays green; one wheel flick advances exactly one
face and an opposite flick reverses it (evidence); scrolling with the pointer over an element with
real overflow scrolls that element and does NOT rotate the drum (evidence). A test covers the
debounce (rapid events collapse to one step) and the arbitration decision (a scrollable-overflow
ancestor present -> content; none -> drum), asserting detection is by computed overflow, not a marker.
DEPENDS_ON: [b1-t3]
TOUCHES: [paulmartin.dev/src/machine/useScrollNav.js (new), paulmartin.dev/src/machine/useScrollNav.test.js (new), paulmartin.dev/src/machine/Machine.jsx]
BEHAVIORAL: yes
RESEARCH: full
TEST_RECOMMENDATION: write
TEST_RATIONALE: One-gesture-one-face debounce and the capture-vs-rotate decision are exactly the
regression-prone gesture logic that needs pinning; the overflow-not-marker rule is a fixed contract.
ASSUMPTIONS: [Region arbitration is the decided default keyed on computed overflow; the slow-vs-fast
speed layer is explicitly deferred per spec ("layer speed in only if it feels needed. [open]") and is
NOT built this pass. SCOPE_QUESTION: confirm the speed layer stays deferred.]

## Bucket b2: Detail modal + Face II (current projects)
INTEGRATION SEAMS: b2-t1 modal is the accessible overlay that renders the same content as the old
/projects/:slug page (via ProjectMedia + OrgTag + projects data); its scrollable body just uses
native overflow so b1-t4's arbitration scrolls it (no marker, no edge). b2-t2 fills the shell's
FaceII slot: its big Details button opens b2-t1's modal, a corner control flips the card to a back
face whose move-3 (Left) clue is rendered through the b1-t1 Clue mechanism, and its flips play b1-t2
audio.

### Task b2-t1: Accessible detail modal overlay
DESCRIPTION: Build a focus-trapped modal overlay rendering a project's full detail content (title,
OrgTag, headline, meta/tags, body paragraphs, links, and the hero via the reused ProjectMedia) —
the same content the /projects/:slug page shows. Escape closes it; focus is trapped while open and
restored to the opener on close; the backdrop is inert; the scrollable body uses native overflow so
b1-t4 arbitration scrolls it (no marker token). Takes a project (or slug) as input.
DELIVERABLE: `vite build` passes and the suite stays green; opening the modal for a project shows
its detail content, Tab cycles within the modal only, Escape closes it and returns focus to the
opener (evidence). A test asserts focus-trap containment and Escape-to-close-with-focus-restore.
DEPENDS_ON: [b1-t1]
TOUCHES: [paulmartin.dev/src/machine/DetailModal.jsx (new), paulmartin.dev/src/machine/DetailModal.css (new), paulmartin.dev/src/machine/DetailModal.test.jsx (new)]
BEHAVIORAL: yes
RESEARCH: full
TEST_RECOMMENDATION: write
TEST_RATIONALE: Focus-trap + Escape + focus-restore is an accessibility contract that breaks
silently and is a spec requirement.

### Task b2-t2: Face II — current-project cards on spindles with flip + Details
DESCRIPTION: Fill the FaceII slot with the three currentProjects cards, each mounted on its own
spindle/post spinning independently. Hover wiggles a card loosely on its post. The card front is one
large "Details" button (big hit target) opening the b2-t1 modal for that project. A distinct corner
control flips the card to its back face; a second corner click flips it home. The back face carries
this face's clue — move 3 = Left — rendered through the b1-t1 Clue mechanism (faceId II), styled as
the spec's seven-segment back-face glyph; the direction/order are NOT hand-typed. Flips play b1-t2
audio.
DELIVERABLE: `vite build` passes and the suite stays green; each card wiggles on hover, its front
Details button opens the correct project modal, its corner control flips to a back showing the 3L
clue and a second click flips home (evidence). A test asserts the flip state machine (front <-> back)
and that the back-face clue's rendered data-clue-order/direction equal MOVES for face II (3/Left).
DEPENDS_ON: [b1-t1, b1-t3, b1-t2, b2-t1]
TOUCHES: [paulmartin.dev/src/machine/faces/FaceII.jsx, paulmartin.dev/src/machine/faces/FaceII.css (new), paulmartin.dev/src/machine/faces/FaceII.test.jsx (new)]
BEHAVIORAL: yes
RESEARCH: full
TEST_RECOMMENDATION: write
TEST_RATIONALE: Front/back flip state plus the corner-flip-vs-Details distinction is interactive
logic; the clue must stay tied to MOVES (per-face half of the clue-integrity check).

## Bucket b3: Face III — past-projects slot machine + its two clues
INTEGRATION SEAMS: b3-t1 builds the three-reel mechanism in the FaceIII slot and plays b1-t2 audio
on spin; it renders the colored-character clue (move 6, faceId III order 6) through the b1-t1 Clue
mechanism inside the real card descriptions. b3-t2 lays the seam-glyph half-etchings across every
reel face so exactly one alignment reads the move-2 clue (faceId III order 2), rendered through the
same Clue mechanism — it draws on b3-t1's reel faces, the internal bucket seam.

### Task b3-t1: Three-reel slot machine + reel content + colored-character clue (move 6)
DESCRIPTION: Fill the FaceIII slot with three vertical reels side by side, each a 3-sided wheel. The
third face of every reel is intentionally BLANK; the first two hold projects. Content: reel 1 =
Stargazer, Pong, [blank]; reel 2 = The 16 Spaces, Solar Express, [blank]; reel 3 = all three faces
blank (placeholders for future past projects). Tap a reel to spin one entry; the payline shows one
face per reel; the window never fully frames a project — it shows the current face plus a SLIVER of
the entries above and below (the horizontal seams), too little to read. Spins play b1-t2 audio. Place
Hint 2 (colored-character match) in the real project card descriptions: one tinted order-digit and
one tinted direction-letter sharing the SAME tint spell move 6 = Left; the tinted characters are
rendered through the b1-t1 Clue mechanism (faceId III order 6) riding on real characters in the
blurbs, so the emitted data-clue-* stays tied to MOVES and the two characters may sit on different
cards, paired by color not position.
DELIVERABLE: `vite build` passes and the suite stays green; tapping a reel advances it exactly one
entry and wraps through its three faces including the blank (evidence); the payline shows one face
per reel with slivers of neighbors visible; the same-tinted 6 and Left are present and legible across
the shown cards (evidence). A test covers reel advance/wrap, that a blank third face exists on every
reel, and that the colored clue's rendered data-clue-order/direction equal MOVES face III order 6
(6/Left).
DEPENDS_ON: [b1-t1, b1-t3, b1-t2]
TOUCHES: [paulmartin.dev/src/machine/faces/FaceIII.jsx, paulmartin.dev/src/machine/faces/FaceIII.css (new), paulmartin.dev/src/machine/faces/FaceIII.test.jsx (new)]
BEHAVIORAL: yes
RESEARCH: full
TEST_RECOMMENDATION: write
TEST_RATIONALE: Per-reel spin/wrap with a fixed blank face is state logic that regresses easily and
gates whether the seam clue can align; the colored clue is the per-face half of clue integrity.

### Task b3-t2: Seam-glyph clue (Hint 1, move 2) — edge half-glyphs with one clean alignment
DESCRIPTION: Give EVERY reel face background edge-etching: half-glyphs at its left and right edges,
on project and blank faces alike, behind the content, so most seam alignments read as partial/garbled
marks. Design the half-glyphs so exactly ONE combination of faces across the three reels lines up
cleanly: the reel-1|reel-2 seam completes a NUMBER (the order) and the reel-2|reel-3 seam completes a
DIRECTION (the letter), the middle reel's face shared between both seams, together reading move 2 =
Right. The winning combination is a MIX of faces (not all-blank) and reads now with reel-3
placeholders and still once real projects fill in. When aligned, the resolved clue is emitted through
the b1-t1 Clue mechanism (faceId III order 2), so its data-clue-order/direction come from MOVES, not
a hand-typed "2R".
DELIVERABLE: `vite build` passes and the suite stays green; spinning to the winning combination shows
a clean, legible "2 + Right" across the two seams while other combinations show garbled partials
(evidence: aligned + non-aligned screenshots). A test asserts the half-glyph position data yields
EXACTLY ONE combination whose two seams both resolve to complete glyphs, and that that combination's
emitted data-clue-order/direction equal MOVES face III order 2 (2/Right).
DEPENDS_ON: [b3-t1]
TOUCHES: [paulmartin.dev/src/machine/faces/FaceIII.jsx, paulmartin.dev/src/machine/faces/FaceIII.css, paulmartin.dev/src/machine/seamGlyphs.js (new), paulmartin.dev/src/machine/seamGlyphs.test.js (new)]
BEHAVIORAL: yes
RESEARCH: full
TEST_RECOMMENDATION: write
TEST_RATIONALE: "Exactly one combination aligns" is a checkable data invariant (more-than-one or none
means the clue is broken/ambiguous), and the aligned result must resolve to the MOVES entry.

## Bucket b4: Faces I, IV, V — name slab, sliding-tile contact, sealed-slate lock
INTEGRATION SEAMS: face I's Contact button calls the shell `rotateTo` to face IV (cross-bucket seam
to b1-t3) and its move-4 clue renders through the b1-t1 Clue mechanism. Face IV's move-5 clue renders
through the Clue mechanism (as the arcane-tally variant). Face V's lock validates presses against
`SEQUENCE` from b1-t1, plays b1-t2 audio (shake+thunk correct / dead thunk wrong / seam-opening on
completion), emits the move-1 gimme's data-clue hook, and on completion flips to reveal the reused
/solved content + solvers list.

### Task b4-t1: Face I — name slab, resume, Contact->rotateTo, underlined move-4 clue
DESCRIPTION: Fill the FaceI slot: the name "Paul Martin" etched into the sandstone as the page
`<h1>`, the landing face. Carry the Resume link importing the shared `RESUME_URL` from b1-t1 (the
2026 resume — never re-declare the literal) and a Contact button whose action spins the drum to face
IV via the shell `rotateTo` (navigation, not a duplicate contact list). Embed the move-4 clue via the
b1-t1 Clue mechanism (faceId I): in an etched "resume" treatment the 4th character ("u") is
UNDERLINED (not colored — a different tell from face III's tint), encoding move 4 = Up; the direction
comes from MOVES, the underline is the presentation variant.
DELIVERABLE: `vite build` passes and the suite stays green; face I shows the name as the document
h1, a Resume link pointing at the shared RESUME_URL, and a Contact button that rotates the machine to
face IV (evidence); the 4th char of the etched "resume" is underlined (evidence). A test asserts the
Contact button invokes rotateTo with face IV's index, that the Resume href equals the shared
RESUME_URL export, and that the clue's rendered data-clue-order/direction equal MOVES face I (4/Up).
DEPENDS_ON: [b1-t1, b1-t3]
TOUCHES: [paulmartin.dev/src/machine/faces/FaceI.jsx, paulmartin.dev/src/machine/faces/FaceI.css (new), paulmartin.dev/src/machine/faces/FaceI.test.jsx (new)]
BEHAVIORAL: yes
RESEARCH: full
TEST_RECOMMENDATION: write
TEST_RATIONALE: The Contact->rotateTo wiring is the one cross-face navigation seam and is easy to
mis-target; the shared RESUME_URL and the move-4 clue are both integrity checks.

### Task b4-t2: Face IV — sliding-tile about/contact puzzle with back-plate clue (move 5)
DESCRIPTION: Fill the FaceIV slot with a sliding puzzle on a 2x3 grid (2 rows, 3 cols): six cells,
five tiles, one open slot. Clicking a tile adjacent to the gap slides it in; non-adjacent clicks are
no-ops. Starting layout: row 1 = About / About / [empty]; row 2 = Email / LinkedIn / GitHub (contact
tiles link out; Bluesky dropped for GitHub; Resume is NOT here). Etch the move-5 clue BIG into the
back plate behind the tiles in two pieces — one across the seam between row-1 cols 1&2, the other
across the seam between row-2 cols 2&3 — together forming the (order, direction) clue 5 = Down,
uncovered as tiles slide. Render it through the b1-t1 Clue mechanism (faceId IV) using the ARCANE
TALLY variant specific to this face: the order is N vertical strokes (no top/bottom bars), so 5 =
five lines (the other faces render their numbers plainly); direction/order still come from MOVES.
Slides play b1-t2 audio.
DELIVERABLE: `vite build` passes and the suite stays green; clicking a tile adjacent to the gap
slides it and a non-adjacent tile does nothing (evidence); sliding tiles progressively uncovers the
two back-plate clue pieces reading as the five-stroke tally + Down (evidence). A test covers slide
legality (adjacent-to-gap only), that the tally renders exactly five strokes, and that the clue's
rendered data-clue-order/direction equal MOVES face IV (5/Down).
DEPENDS_ON: [b1-t1, b1-t3, b1-t2]
TOUCHES: [paulmartin.dev/src/machine/faces/FaceIV.jsx, paulmartin.dev/src/machine/faces/FaceIV.css (new), paulmartin.dev/src/machine/faces/FaceIV.test.jsx (new)]
BEHAVIORAL: yes
RESEARCH: full
TEST_RECOMMENDATION: write
TEST_RATIONALE: Slide-legality is the core puzzle logic; the arcane-tally stroke count and the clue
direction are both integrity checks that must match the move number.

### Task b4-t3: Face V — sealed-slate sequence lock + solved reveal (with seam-opening audio)
DESCRIPTION: Fill the FaceV slot with a sealed stone slab bearing a rectangular seam and, carved into
its center, a row of four arrow buttons laid out LINEARLY (left, up, right, down in a line — not a
compass/D-pad). No maze board is ever shown. Clicking arrows enters a fixed sequence lock validated
against `SEQUENCE` from b1-t1 (Up, Right, Left, Up, Down, Left). A correct next press plays shake +
thunk (b1-t2 audio) and advances one step; ANY wrong press at any point plays the dead thunk and
RESETS to the start. Move 1 (Up) is a gimme found by mashing. Completing the full sequence plays the
seam-opening SFX and flips the panel over to reveal the "you made it through" celebration — the reused
/solved content (message + solvers list from src/data/solvers.js), now part of the box. Emit the
move-1 data-clue hook through the b1-t1 Clue mechanism (faceId V order 1) so the whole-puzzle proof
can reconstruct the full six-move SEQUENCE from rendered hooks.
DELIVERABLE: `vite build` passes and the suite stays green; entering Up,Right,Left,Up,Down,Left plays
the seam-opening SFX and flips the panel to the solved celebration (message + solvers list); any wrong
press mid-sequence resets progress to zero and plays the dead thunk; each correct press advances with
shake+thunk (evidence). A test asserts full correct sequence -> solved state, a wrong press at step k
-> reset to 0, and that face V emits a data-clue hook equal to MOVES order 1 (1/Up).
DEPENDS_ON: [b1-t1, b1-t3, b1-t2]
TOUCHES: [paulmartin.dev/src/machine/faces/FaceV.jsx, paulmartin.dev/src/machine/faces/FaceV.css (new), paulmartin.dev/src/machine/faces/FaceV.test.jsx (new)]
BEHAVIORAL: yes
RESEARCH: full
TEST_RECOMMENDATION: write
TEST_RATIONALE: The advance-on-correct / reset-on-any-wrong / complete-flips state machine is the
heart of the puzzle and the most regression-prone logic in the feature; the seam-opening audio and
the move-1 hook are explicit spec requirements.

## Bucket b5: Procedural sandstone skin + whole-puzzle clue-integrity & a11y proof
INTEGRATION SEAMS: b5-t1 skins the shared FaceSurface primitive + tokens (b1-t1) so every face
inherits the stone look with no per-face edits, and writes the asset-prompt handoff. b5-t2 exercises
the WHOLE assembled machine — it reads the six rendered data-clue-* hooks, reconstructs SEQUENCE, and
drives the face V lock to solved (the clue-integrity build contract), under prefers-reduced-motion and
by keyboard; it depends on every clue-bearing face and the lock existing.

### Task b5-t1: Procedural sandstone skin on FaceSurface + mechanism styling + asset-prompt handoff
DESCRIPTION: Skin the shared FaceSurface primitive and machine tokens procedurally so every face
inherits the look (no per-face edits): SVG `feTurbulence` grain + layered warm gradients for
weathering/grime + CSS bevel/inset shadows for chiseled edges, plus shared mechanism styling
(aged-brass seams/studs/brackets, moss scattered by code along seams and lower edges with random
rotation/scale using placeholder decals). Ground the palette in real sandstone/moss references before
writing CSS. Also write the asset-prompt handoff doc: per-asset prompts for the moss decal sheet (and
optional stone/grime overlays) — dimensions, tileable yes/no, transparent yes/no, style/lighting notes
— for the local green-screen->rembg pipeline in the spec, targeting paulmartin.dev/public/machine/.
DELIVERABLE: `vite build` passes and the suite stays green; faces render as weathered stone with
chiseled edges and moss along the seams (before/after screenshot evidence vs the flat placeholder);
the asset-prompt handoff file exists listing each moss/stone asset with its generation spec.
DEPENDS_ON: [b1-t1]
TOUCHES: [paulmartin.dev/src/machine/FaceSurface.jsx, paulmartin.dev/src/machine/machine.css, plans/ancient-machine-assets.md (new)]
BEHAVIORAL: yes
RESEARCH: full
TEST_RECOMMENDATION: skip
TEST_RATIONALE: Pure visual styling; verified by screenshot evidence, not assertions.
ASSUMPTIONS: [Procedural sandstone via SVG feTurbulence + warm gradients + CSS bevel/inset shadows
holds the stylized (non-photoreal) art direction well enough that no seamless stone image asset is
required; validate against references before committing and flag if a hero stone tile is actually
needed]

### Task b5-t2: Whole-puzzle clue-integrity proof + reduced-motion/keyboard solvability
DESCRIPTION: Prove, on the fully assembled machine, the spec's clue-integrity build contract AND
reduced-motion/keyboard solvability. The GATED proof (vitest+jsdom) renders the whole machine, reads
the six rendered data-clue-* hooks (face I move 4, face II move 3, face III moves 2 and 6, face IV
move 5, face V move 1), asserts that ordered by `order` they reconstruct SEQUENCE, then enters THAT
COLLECTED sequence (never a hardcoded literal) into face V's lock and asserts the solved reveal — so a
single face rendering a wrong direction breaks this proof and fails the gate. Alongside, capture
behavioral evidence that the same solve works under prefers-reduced-motion (faces crossfade, no
tumble/shake) with every face reachable in DOM order and operable by keyboard (name is the h1, all
controls are real buttons/links). This is a verification task: a failure it surfaces routes back to
the owning face task, not patched here.
DELIVERABLE: `npm --prefix paulmartin.dev test` passes including the new whole-puzzle proof that
collects the six data-clue-* hooks, reconstructs [Up,Right,Left,Up,Down,Left], enters that collected
sequence into face V, and reaches the solved panel (the proof must FAIL if any hook is mutated to a
wrong direction — demonstrate by a temporary flip). Captured evidence (Playwright script +
screenshots/log) shows the puzzle solved under prefers-reduced-motion using keyboard-reachable
controls with the five faces in DOM order. `vite build` still passes.
DEPENDS_ON: [b1-t3, b1-t4, b2-t2, b3-t1, b3-t2, b4-t1, b4-t2, b4-t3]
TOUCHES: [paulmartin.dev/src/machine/wholePuzzle.test.jsx (new), paulmartin.dev/e2e/puzzle-a11y.mjs (new)]
BEHAVIORAL: yes
RESEARCH: full
TEST_RECOMMENDATION: write
TEST_RATIONALE: The hooks-reconstruct-SEQUENCE proof is the spec's enforced clue-integrity contract
(a mislabeled glyph must fail the build); reduced-motion solvability and DOM-order/keyboard
reachability are explicit spec requirements no single face task can prove alone.

# Rules recap: DEPENDS_ON forms a DAG (no cycles). Shared interfaces are hoisted into b1 and consumed
# by id, never re-invented: the puzzle model + SEQUENCE + RESUME_URL + the Clue renderer (the
# clue-integrity mechanism) + FaceSurface + tokens (b1-t1); the audio play() API (b1-t2); the shell
# rotateTo/currentFace with snap-on-settle audio (b1-t3). Overlapping TOUCHES are dependency-linked:
# Machine.jsx (b1-t3 -> b1-t4), each face file stubbed by b1-t3 then filled by its face task,
# FaceIII.jsx/.css (b3-t1 -> b3-t2), FaceSurface.jsx + machine.css (b1-t1 -> b5-t1). All other CSS is
# co-located per component so no two unlinked tasks share a file. Scroll arbitration is overflow-based
# (spec's fixed mechanism), so no marker token and no edge between b1-t4 and any scrollable region.
# No existing tests -> STALE_TESTS none everywhere. No editor/runtime adapter boundary (web app); the
# gate runs the unit suite + build, and b5-t2 is the cross-component behavioral proof.

STATUS: READY

## DEFECTS
- LOW — RESUME_URL literal duplicated at paulmartin.dev/src/pages/Landing.jsx:9-10 and
  paulmartin.dev/src/pages/ProjectDetail.jsx:7-8 (same drive.google.com value). b1-t1 creates the
  canonical shared export in src/machine/model.js and face I (b4-t1) imports it, but these two legacy
  files keep their own literal, so the value can still drift on the old routes. Tolerated because
  Landing is deprecated (galaxy path, de-routed by b1-t3) and no task in this run touches ProjectDetail.
  OWNER: unassigned (no planned task removes/rewires the legacy /projects/:slug route or Landing).
