---
feature: ancient-machine
task: b4-t1
agent: tdd-test-writer
updated: 2026-08-19T16:40:41-04:00
iteration: 1
---

## Decision
WROTE
REASON: Cross-face navigation seam (Contact -> rotateTo(faceIndex('IV'))) plus two integrity
checks (shared RESUME_URL, MOVES-derived move-4 underline/clue-order) per TEST_RECOMMENDATION and
own judgment — exactly the kind of easy-to-mistarget wiring and clue-integrity risk worth pinning.

## Tests
FILES: [paulmartin.dev/src/machine/faces/FaceI.test.jsx (new)]
CASES:
  - FaceI name > renders the name "Paul Martin" as the document h1 — asserts exactly one h1
    with textContent "Paul Martin".
  - FaceI resume link > links to the shared RESUME_URL export and opens in a new tab — asserts
    the accessible link's href === RESUME_URL (imported from ../model.js), target=_blank,
    rel includes noopener.
  - FaceI resume link > underlines only the etched "resume" character at the clue order position
    — asserts the visible per-character spans spell "resume", the tell class lands exactly on
    index MOVES-face-I.order-1 (not hardcoded 3), and that char is 'u'.
  - FaceI clue hook > emits exactly one clue matching MOVES for face I — asserts exactly one
    [data-clue-order] element with data-clue-order/data-clue-direction equal to the MOVES face I
    entry (not literal "4"/"Up").
  - FaceI contact button > rotates the shell to face IV on click — mocks useMachine (partial mock
    of ../Machine.jsx, keeping real faceIndex/FACES) and asserts clicking Contact calls the spied
    rotateTo with faceIndex('IV').
RUN: npx vitest run src/machine/faces/FaceI.test.jsx  (from paulmartin.dev/)
RED_CONFIRMED: yes
RED_OUTPUT:
  - name test: `TestingLibraryElementError: Unable to find an accessible element with the role
    "heading"` — current FaceI stub renders only an h2 "Face I", no h1.
  - resume-href test: `Unable to find an accessible element with the role "link" and name
    /resume/i` — no resume link exists yet.
  - resume-underline test: same "no link" failure (within(link) never resolves).
  - clue-hook test: `expected +0 to be 1` — querySelectorAll('[data-clue-order]') is empty,
    no Clue rendered yet.
  - contact-button test: `Unable to find an accessible element with the role "button" and name
    /contact/i` — no Contact button exists yet.
  Full run: 1 file failed, 5/5 tests failed, all other 9 test files (88 tests) green.
Each failure is the direct absence of the not-yet-built element (h1 / link / clue span / button);
none are compile errors or unrelated setup failures — every symbol imported (RESUME_URL, MOVES,
faceIndex, useMachine) already exists on the landed b1-t1/b1-t3 code, so no stub was needed.

## Stale tests
PRUNED: none
UPDATED:
  - paulmartin.dev/src/machine/Machine.test.jsx:79-86 "rests on Face I: its pip is lit and its
    region is the active face" — was asserting the active face wrapper's textContent matches
    /Face I\b/, which only worked because FaceI's current stub literally renders "Face I" text.
    Once FaceI is filled with the name/resume/contact content, that literal text is gone.
    Rewrote to check the `.machine__face--I` wrapper carries the `machine__face--active` class
    instead, which is independent of any face's rendered content.
  - paulmartin.dev/src/machine/Machine.test.jsx:99-102 "clicking a pip brings the matching face
    to front and lights that pip" — same textContent-vs-/Face IV\b/ pattern, same fix (checks
    `.machine__face--IV` carries `.machine__face--active`), for consistency/future-proofing even
    though Face IV's own stub is out of this task's scope.
  Verified: full suite re-run after the edit is 9 files / 88 tests green (FaceI.test.jsx is the
  only red file, as expected).

## Contract
FaceI renders exactly one document h1 with text "Paul Martin". A Resume `<a>` (accessible name
"Resume") has href === the shared RESUME_URL export from ../model.js, target="_blank", and rel
containing "noopener". Its visible etched label spells "resume" as one span per character; the
character at index (MOVES face-I entry.order - 1) carries a "tell" class (the underline variant)
and no other character does. Exactly one Clue hook is rendered on the face, with
data-clue-order/data-clue-direction equal to the MOVES face-I entry (order 4, direction Up).
A Contact button, on click, calls the shell's rotateTo (via useMachine) with faceIndex('IV'), and
must not itself call play()/audio (inherited from rotateTo's own settle-triggered snap).

STATUS: TESTS_RED
