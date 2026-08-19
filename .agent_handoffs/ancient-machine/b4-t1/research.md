---
feature: ancient-machine
task: b4-t1
agent: tdd-research
updated: 2026-08-19
iteration: 1
---

## Mode
FRESH (no ASSUMPTIONS on b4-t1; researched from landed b1-t1 + b1-t3 code)

## Provenance
- Seam "faces call `rotateTo(faceIndex('IV'))` via useMachine" — origin: b1-t3/research.md.
  Re-verified against paulmartin.dev/src/machine/Machine.jsx: `useMachine()` returns
  `{ currentFace, rotateTo, faceCount }` (Machine.jsx:56-61,137); `faceIndex(id)` exported and
  throws on unknown (Machine.jsx:42-46); `FACES = ['I','II','III','IV','V']` (Machine.jsx:18) so
  faceIndex('IV') === 3. re-verified at Machine.jsx:18,42-61,137.
- Seam "snap SFX is emitted inside rotateTo-on-settle; callers inherit it, never call play('snap')"
  — origin: b1-t3/research.md + tasks.md CLUE/SEAMS notes. Re-verified: play('snap') lives only in
  rotateTo's settle timer (Machine.jsx:80-85). Face I therefore makes NO audio call.
- RESUME_URL / MOVES / Clue render-prop shape — derived independently by reading b1-t1's landed code
  (model.js, Clue.jsx). Not taken from any sibling research.

## Verdict on assumptions
n/a (FRESH — no ASSUMPTIONS provided for this task)

## Blueprint
APPROACH:
Fill the FaceI stub (currently a placeholder, faces/FaceI.jsx:1-9). One face component, one co-located
CSS file. Face I is the landing face and owns the page's single `<h1>`. Three concerns, all wiring to
already-landed b1 seams (nothing reinvented):

1. Name slab — `<h1>Paul Martin</h1>` inside the existing `<FaceSurface aria-label="Face I">`. This is
   the ONLY h1 in the machine (siblings use h2/h3), satisfying the spec's "name is an <h1>" a11y rule.

2. Resume link carrying the move-4 clue — a real `<a href={RESUME_URL} target="_blank"
   rel="noopener noreferrer" aria-label="Resume">` whose VISIBLE label is the etched word "resume"
   rendered THROUGH the b1-t1 Clue mechanism, with the character at position `order` underlined (the
   presentation variant). `RESUME_URL` is imported from ../model.js — never re-declared (the legacy
   literal dup is the registered LOW defect, out of scope here). Because Clue emits aria-hidden="true",
   the link carries `aria-label="Resume"` so assistive tech still gets an accessible name; sighted
   users see the etched "resume" with the underlined tell; b5-t2 reads data-clue-* off the nested span.

3. Contact button — `<button type="button" onClick={() => rotateTo(faceIndex('IV'))}>Contact</button>`,
   with `{ rotateTo } = useMachine()` and `faceIndex` imported from ../Machine.jsx. It is navigation to
   face IV, NOT a duplicate contact list. It makes NO audio call: the snap SFX is inherited from
   rotateTo-on-settle (Machine.jsx:80-85). This is the enumerated call-site discipline — Contact is a
   rotateTo caller that must NOT re-emit snap.

CLUE PRESENTATION (the move-4 underline, tied to MOVES, not hand-typed):
Render the word "resume" (a plain English word — allowed; it is not a direction literal) and underline
the character whose index is `order - 1`, where `order` comes from the Clue's derived data:
```
<a href={RESUME_URL} target="_blank" rel="noopener noreferrer"
   aria-label="Resume" className="face1-resume">
  <Clue order={4} variant="underline" className="face1-resume__clue">
    {({ order, directionLetter }) => {
      // fail-fast: the puzzle's whole conceit is that "resume"[order-1] === directionLetter
      // (position 4 -> 'u' -> Up). If MOVES face I ever stops being Up this throws at render,
      // so a divergence cannot ship silently as a mis-underlined word.
      if (RESUME_WORD[order - 1] !== directionLetter) {
        throw new Error(`FaceI clue: "resume"[${order - 1}] != directionLetter ${directionLetter}`)
      }
      return [...RESUME_WORD].map((ch, i) => (
        <span key={i} className={i === order - 1 ? 'face1-resume__tell' : undefined}>{ch}</span>
      ))
    }}
  </Clue>
</a>
```
`const RESUME_WORD = 'resume'`. The underlined index is DERIVED from the clue's order, and the tell
letter is checked against the clue's directionLetter, so neither the position nor the direction is
hand-typed. data-clue-order=4 / data-clue-direction=Up are emitted by Clue from MOVES entry order 4.
The underline is pure CSS on `.face1-resume__tell` (text-decoration: underline), the "different tell
from face III's tint" the spec calls for.

INTERFACES:
- FaceI (default export, no props) — consumes context via useMachine(); unchanged signature.
- No new exported module APIs. Imports consumed:
  - `RESUME_URL` from '../model.js' (b1-t1)
  - `Clue` (default) from '../Clue.jsx' (b1-t1)
  - `FaceSurface` (default) from '../FaceSurface.jsx' (b1-t1)
  - `useMachine`, `faceIndex` from '../Machine.jsx' (b1-t3)

DATA_FLOW:
Contact click -> rotateTo(faceIndex('IV')=3) on the shell -> shell tumbles + fires snap on settle
(inherited, no local audio). Clue order=4 -> moveByOrder(4)={order:4,direction:'Up'} -> data-clue-*
attrs + underlined 'u' in "resume". RESUME_URL flows straight from the shared model export into href.

CIRCULAR IMPORT NOTE (safe): Machine.jsx imports FaceI, and FaceI imports { useMachine, faceIndex }
from Machine.jsx. This is a benign ESM cycle: both are hoisted function declarations and are only
referenced at call time (inside render / the onClick handler), never at FaceI module top-level, so no
temporal-dead-zone crash. No other face imports from Machine.jsx yet; FaceI is the first consumer.

FILES_NEW: [paulmartin.dev/src/machine/faces/FaceI.css, paulmartin.dev/src/machine/faces/FaceI.test.jsx]
FILES_EDIT: [paulmartin.dev/src/machine/faces/FaceI.jsx (replace the stub body)]
File-size budget: all files are new/tiny (<80 lines); no split needed, limit is 1000.

## Duplicate / reuse check
EXISTING (reuse, do NOT reinvent):
- RESUME_URL — paulmartin.dev/src/machine/model.js:12-13. Import it; do NOT re-declare the literal.
  (Legacy dups at Landing.jsx:9 and ProjectDetail.jsx:7 are the already-registered LOW defect, both
  on de-routed/untouched legacy routes — not this task's to fix.)
- Clue renderer + render-prop (order, direction, directionGlyph, directionLetter, orderGlyph) —
  paulmartin.dev/src/machine/Clue.jsx:26-55. This is the hoisted clue-integrity mechanism; route the
  move-4 clue through it. Do NOT hand-write data-clue-* or a "4u" literal.
- FaceSurface — paulmartin.dev/src/machine/FaceSurface.jsx:3-11. Keep the existing wrapper.
- useMachine + faceIndex — paulmartin.dev/src/machine/Machine.jsx:42-61. Use for the Contact->rotateTo
  seam. Do NOT read window/rotation directly.
CLEANLINESS:
- Follow the sibling face pattern (FaceII.jsx): default export, FaceSurface wrapper, co-located CSS,
  `<Clue order=... variant=... className=...>{render-prop}</Clue>` for the clue. FaceII renders the
  ONE clue hook per face (faces/FaceII.jsx:13 comment "one clue hook per face"); Face I likewise emits
  exactly one clue hook (order 4).
- The "one place" for the snap SFX is rotateTo (Machine.jsx:80-85). EXISTING rotateTo call sites:
  `rotateTo(i)` on pip click (Machine.jsx:182), `handleStep`->rotateTo for scroll (Machine.jsx:94-99).
  b4-t1 adds ONE more: Contact -> rotateTo(faceIndex('IV')). Disposition: routed through rotateTo,
  inherits snap, adds NO audio call. No site bypasses the snap owner.

## Test surface (feed-forward to test-writer)
PUBLIC_SURFACE:
- Face I renders exactly one `<h1>` with text "Paul Martin".
- A Resume link (`<a>`) whose `href` === the shared RESUME_URL export, opens in a new tab
  (target=_blank, rel includes noopener), accessible name "Resume".
- The etched "resume" label's 4th character (index 3, the 'u') is the underlined tell
  (element carrying the tell class), and it is derived from the clue order (not a hardcoded index).
- Exactly one clue hook on the face with data-clue-order="4" and data-clue-direction="Up"
  (equals MOVES face I).
- A Contact button that, on click, invokes the shell's rotateTo with faceIndex('IV') (=== 3),
  and makes NO direct audio/play call.

SUGGESTED_TESTS:
- name-is-h1: rendered face exposes a single h1 with textContent "Paul Martin"
  (use getByRole('heading', { level: 1 })).
- resume-href: the Resume link's href === RESUME_URL imported from '../model.js', and it is an
  accessible link (getByRole('link', { name: /resume/i })) with target="_blank".
- resume-underline-tell: the character at index 3 of the visible "resume" text carries the tell/
  underline class and is 'u'; a non-tell character (e.g. index 0 'r') does not.
- clue-hooks: exactly one [data-clue-order] on the face; its data-clue-order === "4" and
  data-clue-direction === "Up" (import MOVES and assert against the face I entry, not a literal).
- contact-rotates-to-IV: clicking the Contact button calls a spied rotateTo with 3 (=== faceIndex('IV')).
  RECOMMENDED wiring: `vi.mock('../Machine.jsx', async (io) => ({ ...(await io()), useMachine: () =>
  ({ rotateTo: spy, currentFace: 0, faceCount: 5 }) }))` — partial mock keeps the REAL faceIndex/FACES
  so the asserted target index is the real one, and only rotateTo is spied. Then assert
  `spy` called with `faceIndex('IV')`.
- contact-no-audio: Face I does not import/call useAudio; assert the snap is not double-emitted (the
  simplest form: no play spy is invoked from Face I — or simply that Face I never imports audio.jsx).
  Low priority; the rotateTo spy test already proves the seam.

`STATUS: IMPLEMENT`

STATUS: IMPLEMENT
