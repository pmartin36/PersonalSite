---
feature: ancient-machine
task: b4-t3
agent: tdd-research
updated: 2026-08-19
iteration: 1
---

## Mode
FRESH (b4-t3 carries no ASSUMPTIONS; researched from landed b1-t1/b1-t2/b1-t3 code + sibling faces
I/II/IV and the legacy Solved page)

## Provenance
- "Machine mounts the five face stubs in DOM order; a face task edits ONLY its own face files, not
  Machine.jsx" — origin: b1-t3 seam note (tasks.md). Re-verified at Machine.jsx:10-19,148-166
  (FaceV imported, rendered from FACE_COMPONENTS[4]). So b4-t3 TOUCHES only FaceV files.
- "Clue mechanism = one order-keyed <Clue> span emitting data-clue-order/direction from MOVES, with a
  render-prop giving {order,direction,directionGlyph,directionLetter,orderGlyph}, aria-hidden" —
  re-verified by reading landed Clue.jsx:26-55 (not taken from sibling research). DIRECTION_GLYPH is
  an exported map Up/Down/Left/Right -> arrow glyph (Clue.jsx:4-9).
- "useAudio().play(name) is the audio seam; no-op while muted; throws on unknown name" — re-verified
  at audio.jsx:114-124,135-137. SOUNDS keys re-verified at audio.jsx:53-61: snap, thunk, shake,
  grind, flip, deadThunk, seam all exist (the exact keys Face V needs: shake, thunk, deadThunk, seam).
- "SEQUENCE derives from MOVES ordered by order = [Up,Right,Left,Up,Down,Left]; move 1 = Up/faceId V"
  — re-verified at model.js:1-13. moveByOrder(1) = {order:1, direction:'Up', faceId:'V'}.
- "Sibling face pattern: default export + FaceSurface wrapper + co-located CSS + useAudio + Clue
  render-prop; audio mocked in test via vi.mock('../audio.jsx') with a play spy; both flip faces kept
  mounted so the clue hook is always in the DOM" — re-verified at FaceII.jsx:16-99 (both card faces
  mounted, flip via class), FaceIV.jsx:93-140, FaceIV.test.jsx:1-22 (audio spy pattern).
- "/solved content to reuse (message + solvers list from src/data/solvers.js)" — re-verified at
  Solved.jsx:1-41 and solvers.js:1-6 (solvers is an array of {name, note?}; currently empty, so the
  list block is conditionally rendered).

## Verdict on assumptions
n/a (FRESH)

## Blueprint
APPROACH:
Fill the FaceV stub (faces/FaceV.jsx:1-9) with a sealed-slate sequence lock plus a flip-to-solved
reveal. One component + co-located CSS + test. Nothing reinvented: the lock is a local progress
counter validated against SEQUENCE (b1-t1); audio via useAudio (b1-t2); the move-1 hook via Clue
(b1-t1); the wrapper via FaceSurface; the celebration reuses the solvers DATA (data/solvers.js). The
old maze solve logic is explicitly NOT reused (spec) — this is a plain fixed-code lock.

1. ARROW PAD (the input alphabet — all four directions, laid out LINEARLY).
   Spec layout is a single row: Left, Up, Right, Down (not a compass/D-pad). Define the pad order once:
   `const PAD_ORDER = ['Left', 'Up', 'Right', 'Down']`. Guard it at module load against the canonical
   direction set so a typo throws rather than shipping a broken pad (mirrors FaceI's defensive check,
   FaceI.jsx:27):
     `if (PAD_ORDER.slice().sort().join() !== Object.keys(DIRECTION_GLYPH).sort().join()) throw ...`
   Each pad entry renders a real `<button type="button" data-direction={dir} aria-label={dir}
   onClick={() => press(dir)}>{DIRECTION_GLYPH[dir]}</button>`. The visible glyph comes from
   DIRECTION_GLYPH (Clue.jsx), never hand-typed; data-direction + aria-label make each arrow
   keyboard-operable and findable (by b5-t2 and by tests). NOTE on the clue-integrity invariant: the
   pad is the lock's INPUT device and must offer every direction; it is NOT a clue. No clue reads from
   PAD_ORDER, and the lock never validates against it — validation is against SEQUENCE (from MOVES).
   So the pad enumerating four directions does not violate "clues render from MOVES."

2. LOCK STATE MACHINE (the core testable logic).
   State: `const [progress, setProgress] = useState(0)` and `const [solved, setSolved] = useState(false)`.
   `press(direction)`:
     - if `solved` -> ignore (no-op; the lock is finished).
     - `expected = SEQUENCE[progress]`.
     - if `direction === expected`:
         `next = progress + 1`; `setProgress(next)`; play the advance SFX: `play('shake'); play('thunk')`.
         if `next === SEQUENCE.length` -> `setSolved(true)`; play the completion SFX: `play('seam')`.
     - else (ANY wrong press): `setProgress(0)` (reset to the start); `play('deadThunk')`. The wrong
       press is NOT re-evaluated as a fresh first press even if it equals SEQUENCE[0] — spec: "resets
       the sequence to the start." Move 1 (Up) is therefore the gimme: from a fresh/reset state the
       first Up press advances to 1 (thunk), which is what mashing lands.
   SEQUENCE has repeats (Up at 1&4, Left at 3&6); the progress index disambiguates — no special casing.
   Expose `data-lock-progress={progress}` and `data-solved={solved ? 'true' : 'false'}` on a wrapper
   for behavioral/test observation.

3. FLIP TO SOLVED (both panels mounted, like FaceII's card).
   A `.face5-slab` container toggles a `--opened` class on `solved`. It holds two always-mounted faces:
   - `.face5-slab__sealed`: the rectangular seam, the arrow pad row, and the move-1 Clue hook.
   - `.face5-slab__solved`: the celebration (see 4). Kept mounted so the flip is CSS-only; under
     prefers-reduced-motion the CSS swaps the flip for a crossfade/stack (no tumble), matching the
     shell's reduced-motion discipline (Machine.jsx:48-54 sets the reduced path; face CSS suppresses
     its own animation under @media (prefers-reduced-motion: reduce)).

4. MOVE-1 CLUE HOOK (order 1 = Up), ONE hook, routed through Clue, always mounted.
   Render a single `<Clue order={1} className="face5-clue" />` on the sealed panel (etched subtle mark
   on the slate; default Clue content `1{up-glyph}` is fine — this move is the mash-gimme, not a
   decoded visual clue, but the hook must exist so b5-t2 reconstructs the full six-move SEQUENCE). Clue
   emits data-clue-order="1" / data-clue-direction="Up" from MOVES and is aria-hidden — it does not
   announce the answer. Exactly one clue hook on this face.

5. SOLVED CELEBRATION (reuse the solvers DATA; re-render the message inline).
   Import `{ solvers }` from '../../data/solvers.js'. Render the same content the /solved page shows
   (Solved.jsx:9-40): heading "You found the way through.", the lede + mailto CTA, and — only when
   `solvers.length > 0` — the "Made it through" list. NO react-router <Link> (this lives inside the
   box, not a routed page). The heading is an `<h2>` (Face I owns the single page <h1>, FaceI.jsx:14).
   This duplicates the legacy Solved.jsx copy; registered LOW in tasks.md `## DEFECTS` (OWNER
   unassigned) because deduping would require editing Solved.jsx, outside this task's TOUCHES.

6. AUDIO: `const { play } = useAudio()`. Correct advance -> play('shake') then play('thunk');
   completion additionally -> play('seam'); wrong -> play('deadThunk'). All are valid SOUNDS keys
   (audio.jsx:53-61). No arming/mute logic here (inherited; play is a no-op while muted).

INTERFACES:
- FaceV (default export, no props) — unchanged signature; replaces the stub body.
- No new exported module APIs. Imports consumed:
  - `FaceSurface` (default) from '../FaceSurface.jsx' (b1-t1)
  - `Clue` (default) + `DIRECTION_GLYPH` (named) from '../Clue.jsx' (b1-t1)
  - `SEQUENCE` from '../model.js' (b1-t1)  [tests also import MOVES/moveByOrder]
  - `useAudio` from '../audio.jsx' (b1-t2)
  - `solvers` from '../../data/solvers.js' (reused data)
- DOM contract for b5-t2 + tests: four `[data-direction]` arrow buttons (one per direction); a
  `[data-solved]` wrapper flipping to "true" on completion; one `[data-clue-order]` hook = 1/Up.

DATA_FLOW:
Click/keydown an arrow -> press(dir) -> compare to SEQUENCE[progress] -> advance (shake+thunk, +seam
on completion) or reset (deadThunk). On the 6th correct press solved=true, slab flips, celebration
shows. b5-t2 reads this face's data-clue-order=1/Up hook (plus the other five faces'), reconstructs
SEQUENCE, then clicks the [data-direction] arrows in that collected order and asserts [data-solved].

FILES_NEW: [paulmartin.dev/src/machine/faces/FaceV.css, paulmartin.dev/src/machine/faces/FaceV.test.jsx]
FILES_EDIT: [paulmartin.dev/src/machine/faces/FaceV.jsx (replace the stub body)]
File-size budget: all files new/small (FaceV.jsx ~110 lines); project has no stated limit, default
1000; no split needed.

## Duplicate / reuse check
EXISTING (reuse, do NOT reinvent):
- SEQUENCE / MOVES / moveByOrder — model.js:10,1-21. The lock validates presses against SEQUENCE; the
  move-1 hook goes through Clue by order. NEVER type the sequence or a direction literal in the lock.
- Clue renderer — Clue.jsx:26-55. Route the move-1 hook through it (order=1). Do NOT hand-write
  data-clue-*.
- DIRECTION_GLYPH — Clue.jsx:4-9. Source for the arrow-button glyphs; do NOT hand-type arrows.
- useAudio().play — audio.jsx:114,135. Reuse for shake/thunk/deadThunk/seam; do NOT synthesize sound
  here. All four keys already exist in SOUNDS (audio.jsx:53-61) — no audio.jsx edit needed.
- FaceSurface — FaceSurface.jsx. Keep `<FaceSurface aria-label="Face V">`.
- solvers data — data/solvers.js:3. Reuse the array; re-render the /solved message inline (the markup
  duplication with Solved.jsx:9-40 is the registered LOW defect; the DATA is genuinely reused).
- "Both flip faces mounted so the clue hook is always present" pattern — FaceII.jsx:16-77. Apply here.
- Old maze solve logic (MazeBackground / Landing onSolve) is explicitly NOT reused (spec:184-186,244).
  grep confirms no existing sequence-lock/progress-counter code in src/machine.

CLEANLINESS:
- Follow FaceI/II/IV: default export, FaceSurface wrapper, co-located CSS, useAudio, Clue. Heading is
  <h2> (Face I owns the single <h1>).
- "One clue, one place": this face emits EXACTLY ONE clue hook (order 1) via one <Clue>; enumerated
  clue-construction sites in this file = 1, routed through Clue, direction unreachable as a literal
  (only `order` is passed). No bypass.
- "One sequence, one source": the lock's only comparison is `direction === SEQUENCE[progress]`. There
  is exactly ONE read of SEQUENCE and zero hand-typed direction lists in the lock path. The PAD_ORDER
  array names the four input directions (the pad's alphabet, not a clue and not the code); it is guard-
  checked against Object.keys(DIRECTION_GLYPH) so it cannot silently drift.

## Test surface (feed-forward to test-writer)
PUBLIC_SURFACE:
- Four arrow buttons, one per direction, each with data-direction and an aria-label; visible glyph =
  DIRECTION_GLYPH[dir] (derived, not hand-typed).
- Entering the full correct sequence (SEQUENCE from model, clicked via data-direction, NOT a hardcoded
  literal) flips the face to solved: [data-solved]="true" and the celebration (message + list) shows.
- A wrong press at any step k resets progress to 0 (data-lock-progress -> 0); no solved state.
- Each correct advance plays shake+thunk; the completing press additionally plays seam; a wrong press
  plays deadThunk (audio via the play spy, per FaceIV.test pattern).
- Move 1 (Up) is reachable from a fresh state by a single Up press (the gimme): one Up press advances
  progress to 1.
- Exactly one clue hook: data-clue-order="1", data-clue-direction="Up" (equals moveByOrder(1)).
- No maze board rendered; the solved celebration carries no react-router Link.

SUGGESTED_TESTS:
- pad-buttons: exactly four [data-direction] buttons, set of directions === Object.keys(DIRECTION_GLYPH);
  each button's text === DIRECTION_GLYPH[its data-direction] (derived, not literal).
- solve-full-sequence: click arrows in SEQUENCE order (read from model, not typed) -> [data-solved]
  becomes "true" and the celebration heading text appears.
- wrong-press-resets: enter the first k correct presses (k in {1,3}), then press a direction !==
  SEQUENCE[k]; assert data-lock-progress === "0" and not solved. Include the case where the wrong
  press equals SEQUENCE[0] (Up) to pin that it still resets to 0, not to 1.
- gimme-move-1: from fresh, one Up press -> data-lock-progress === "1" (mashing finds move 1).
- audio-per-press (play spy, per FaceIV.test): a correct advance calls play('shake') and play('thunk');
  the completing press also calls play('seam'); a wrong press calls play('deadThunk') and not shake.
- clue-hook: exactly one [data-clue-order] on the face; === moveByOrder(1) (order "1"/direction "Up").
- no-op-after-solved: after solving, an extra arrow press does not change data-solved and does not
  re-trigger the lock (progress stays complete / solved stays true).
- Behavioral (screenshot/recording evidence, not assertions; captured per BEHAVIORAL): correct presses
  shake+thunk and advance; wrong press dead-thunks and resets; the 6th correct press seam-opens and
  flips to the solved celebration; under emulated prefers-reduced-motion the panel crossfades (no
  tumble/shake) and the pad stays keyboard-operable.

STATUS: IMPLEMENT
