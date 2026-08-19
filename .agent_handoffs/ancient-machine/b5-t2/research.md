---
feature: ancient-machine
task: b5-t2
agent: tdd-research
updated: 2026-08-19T18:40:00Z
iteration: 1
---

## Mode
FRESH (no ASSUMPTIONS on the task block; researched from the assembled code)

## Blueprint
APPROACH:
Two deliverables, no production code changes. This is a verification task: any failure it
surfaces routes back to the owning face, never patched here.

(1) GATED proof — `paulmartin.dev/src/machine/wholePuzzle.test.jsx` (vitest + jsdom). Render the
whole assembled `<Machine />` (real AudioProvider — muted/unarmed so `play` is a no-op; no audio
mock needed). Collect EVERY `[data-clue-order]` element in the tree, read its
`data-clue-order`/`data-clue-direction`, sort ascending by order, map to direction to get a
COLLECTED sequence. Assert collected === SEQUENCE (imported from model.js, never a literal). Then
drive THAT COLLECTED sequence into Face V's lock by clicking the pad buttons (scoped to the Face V
region, `getByRole('button', { name: dir })`) and assert the solved reveal
(`[data-solved]` becomes `"true"`). Because the lock validates against SEQUENCE and resets on any
wrong press, a single mis-authored hook makes collected !== SEQUENCE (equality assert fails) AND
fails to solve — the build breaks. The "temporary flip" demonstration is a manual check the
code-writer/validator performs, NOT committed.

(2) EVIDENCE — `paulmartin.dev/e2e/puzzle-a11y.mjs` (standalone Playwright `.mjs`, run by hand for
captured evidence; NOT part of the gate). Chromium is installed and launches (verified). Build then
serve (`vite preview`) — or `vite dev` — navigate to "/", launch context with
`reducedMotion: 'reduce'`. Assert the five face regions are present in DOM order, then solve Face
V's lock BY KEYBOARD (focus each arrow button, press Enter, in sequence order read from the page's
own six data-clue hooks so the evidence solve is honest, not hardcoded), and screenshot the solved
celebration. Screenshots/log land under a captured-evidence path for the validator.

INTERFACES: none added. Consumes existing exports only:
- `Machine` (default) from `src/machine/Machine.jsx`
- `SEQUENCE` from `src/machine/model.js`
- DOM hooks already emitted by the six faces (verified below).

DATA_FLOW:
render(<Machine/>) -> all 5 faces mount simultaneously (FACES.map renders every Face
unconditionally, Machine.jsx:148-166) -> six `<Clue>` spans emit data-clue-order/-direction ->
querySelectorAll('[data-clue-order]') -> sort by order -> directions -> click Face V pad in that
order -> FaceV.press validates each vs SEQUENCE[progress] (FaceV.jsx:71-88) -> on 6th correct press
setSolved(true) -> `.face5-slab[data-solved="true"]`.

FILES_NEW: [paulmartin.dev/src/machine/wholePuzzle.test.jsx, paulmartin.dev/e2e/puzzle-a11y.mjs]
FILES_EDIT: [none]  (no production source is edited; verification-only task)

## Duplicate / reuse check
EXISTING (reuse, do not reinvent):
- `SEQUENCE` — paulmartin.dev/src/machine/model.js:10 (derived from MOVES). The proof reconstructs
  and asserts against THIS; never re-type [Up,Right,Left,Up,Down,Left].
- The Clue mechanism emits both hooks from one MOVES entry — paulmartin.dev/src/machine/Clue.jsx:44-54.
- Testing Library render/within/screen patterns already established — src/machine/Machine.test.jsx:66-77
  (region query in DOM order) and FaceV.test.jsx (pad-by-direction, data-solved) — follow them.
- Face V lock contract (pad buttons `aria-label`=direction, `[data-solved]`, reset-on-wrong) —
  FaceV.jsx:18-35,71-104. Do not re-implement solving logic; drive the real UI.

VERIFIED HOOK INVENTORY (the six data-clue-* the proof collects — each re-read in source):
- Face I  order 4 / Up    — FaceI.jsx:22 (`<Clue order={4} variant="underline">`)
- Face II order 3 / Left  — FaceII.jsx:68 (`<Clue order={3}>`, card index 0 back, always mounted)
- Face III order 6 / Left — FaceIII.jsx:103-107 (digit clue, reel 0 face 0)
- Face III order 2 / Right— FaceIII.jsx:132 (seam clue, always mounted regardless of alignment)
- Face IV order 5 / Down  — FaceIV.jsx:112 (`<Clue order={5} variant="tally">`)
- Face V  order 1 / Up    — FaceV.jsx:98 (`<Clue order={1}>`, the gimme hook)
Note: Face III's letterClue span (FaceIII.jsx:110) is presentation-only (a plain `<span>`, NOT a
Clue) so it emits NO data-clue-* — it does not pollute the collection. Confirmed empirically.

CLEANLINESS: No audio mock — real AudioProvider is muted/unarmed so play() is a harmless no-op
(scratch render solved cleanly with no act warnings). Default jsdom matchMedia returns matches:true
(vitest.setup.js:9-16), so the proof runs the reduced-motion branch with no intro timers to flush —
keep it that way; do not add fake timers.

## Empirical validation (this run, throwaway tests, since deleted)
- `render(<Machine/>)` yields EXACTLY six `[data-clue-order]` elements; their orders sorted are
  [1,2,3,4,5,6] (no duplicate, none missing).
- Sorted-by-order directions === SEQUENCE === [Up,Right,Left,Up,Down,Left].
- Clicking Face V's pad (scoped via `getByRole('region',{name:'Face V'})`) in that collected order
  flips `[data-solved]` to "true". Full proof passed end to end.
- Playwright chromium `launch()` returns LAUNCH_OK in this environment.

## Test surface (feed-forward to test-writer)
PUBLIC_SURFACE:
The assembled `<Machine />` must expose, in the rendered DOM, exactly six data-clue-* hooks whose
(order->direction) pairs reconstruct SEQUENCE when ordered by order, AND a Face V lock that reaches
`[data-solved="true"]` when that reconstructed sequence is entered via its pad buttons. Five face
regions are present in DOM order (aria-labels Face I..V) and every control is a real button/link
(keyboard reachable); name is the document h1 (FaceI.jsx:14).

SUGGESTED_TESTS (wholePuzzle.test.jsx — write all; each maps to a named behavior above):
- hook-count-and-orders: render <Machine/>; the set of data-clue-order values across the tree is
  exactly {1,2,3,4,5,6} (a permutation — fails distinctly on a duplicate OR a missing hook).
- reconstruct-sequence: hooks sorted by order map to directions equal to SEQUENCE (imported, not
  literal). This is the assertion that FAILS if any face renders a wrong direction.
- solve-from-collected: enter the COLLECTED sequence (not a literal) into Face V's pad (scoped to
  the Face V region) -> `[data-solved]` === "true" and the celebration heading is shown.
- regions-in-dom-order: getAllByRole('region') aria-labels === [Face I,Face II,Face III,Face IV,
  Face V] (DOM-order/keyboard-reachability half provable in jsdom).
- name-is-h1: document h1 text is "Paul Martin" (keyboard/semantics anchor).
Guidance to test-writer: import SEQUENCE and Machine only; NO hardcoded direction/order literals in
the reconstruct/solve assertions. Do NOT mock audio. Do NOT add fake timers (reduced-motion path is
timer-free). A wrong hook must be shown to fail by a temporary in-source flip during code/validation,
then reverted — that demonstration is not committed.

SUGGESTED_EVIDENCE (puzzle-a11y.mjs — Playwright, captured artifact, not gated):
- Emulate prefers-reduced-motion (context `reducedMotion: 'reduce'`); load "/".
- Assert five regions in DOM order; solve Face V by KEYBOARD (Tab/Enter to the four arrow buttons),
  entering the sequence read from the page's own six hooks.
- Screenshot the solved celebration + a pre-solve frame; write to a captured-evidence path the
  validator reads. Non-active faces are opacity:0 but remain in the DOM and focusable (not
  display:none — MachineShell.css:73-81), so keyboard reach holds; navigate to Face V via its
  wayfinding pip ("Go to Face V") if focus order needs it.

## Provenance
- "Six clue hooks, order->direction map" — origin: b1-t1 research (Clue contract) + each face task.
  RE-VERIFIED by reading Clue.jsx:44-54 and every face at the exact lines listed above, and by a
  throwaway full-render test counting hooks (orders [1..6], directions === SEQUENCE).
- "Face V lock: pad aria-label=direction, [data-solved], reset-on-wrong" — origin: b4-t3 research.
  RE-VERIFIED at FaceV.jsx:18-35,71-104 and by driving the real pad to solved in the scratch test.
- "Faces all mount unconditionally; regions in DOM order" — RE-VERIFIED at Machine.jsx:148-166 and
  against Machine.test.jsx:66-77.
- "jsdom matchMedia defaults matches:true" — RE-VERIFIED at vitest.setup.js:9-16.
- "Chromium available" — RE-VERIFIED by launching playwright in this run (LAUNCH_OK).

## Scope notes
- No DEFECTS register additions: the five existing entries in tasks.md are legacy-route duplications
  unrelated to this proof; nothing new measured here.
- If the gated proof fails, it means an upstream face (or the lock) is wrong — route the finding to
  that face's task per the task's own instruction, do not edit production code in this task.

STATUS: IMPLEMENT
