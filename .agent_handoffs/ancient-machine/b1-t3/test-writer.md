---
feature: ancient-machine
task: b1-t3
agent: tdd-test-writer
updated: 2026-08-19T19:18:22Z
iteration: 1
---

## Decision
WROTE
REASON: rotateTo wrap/reversibility, snap-on-settle audio routing (must fire for every caller,
never on the initial landing), and the reduced-motion branch are exactly the regression-prone
logic TEST_RECOMMENDATION calls out; jsdom can gate all of it except the real CSS-3D geometry.

## Tests
FILES:
  - paulmartin.dev/src/machine/Machine.test.jsx (new)
  - paulmartin.dev/src/machine/Machine.jsx (new — minimal compile stub; code-writer fills bodies)
  - paulmartin.dev/src/machine/MachineShell.css (new — empty placeholder so the stub's import resolves)
  - paulmartin.dev/src/machine/faces/FaceI.jsx (new stub — FaceSurface + aria-label "Face I")
  - paulmartin.dev/src/machine/faces/FaceII.jsx (new stub — aria-label "Face II")
  - paulmartin.dev/src/machine/faces/FaceIII.jsx (new stub — aria-label "Face III")
  - paulmartin.dev/src/machine/faces/FaceIV.jsx (new stub — aria-label "Face IV")
  - paulmartin.dev/src/machine/faces/FaceV.jsx (new stub — aria-label "Face V")
CASES:
  - wrapIndex wraps forward and backward around the five-face drum — asserts: wrapIndex(5)=0, wrapIndex(-1)=4
  - stepDelta gives the shortest signed step, including forward wrap-around — asserts: stepDelta(4,0)=+1, stepDelta(0,4)=-1, stepDelta(0,3)=-2
  - faceIndex maps a face id to its drum index and throws for an unknown id — asserts: faceIndex('IV')=3, faceIndex('I')=0, faceIndex('X') throws
  - FACES lists the five face ids in drum order — asserts: FACES equals ['I','II','III','IV','V'] (already true; documents the contract, not a red case)
  - renders all five faces as regions, in DOM order — asserts: five role=region elements with aria-label Face I..V in order
  - rests on Face I: its pip is lit and its region is the active face — asserts: first .machine__pip has aria-current="true"; .machine__face--active contains "Face I"
  - plays the intro thunk once on mount and never the snap — asserts: play('thunk') called on mount, play('snap') never called on mount
  - clicking a pip brings the matching face to front and lights that pip — asserts: clicking pip[3] sets its aria-current, clears pip[0]'s, and .machine__face--active now contains "Face IV"
  - every rotateTo settle fires the snap exactly once, not the thunk — asserts: after a pip click and advancing timers, play('snap') called exactly once (thunk not re-fired)
  - takes the static crossfade path under reduced motion — asserts: matchMedia mocked to reduce -> a [data-reduced] hook exists, mount plays neither thunk nor snap, all five regions still present in DOM order
RUN: npx vitest run src/machine/Machine.test.jsx  (from paulmartin.dev/)
RED_CONFIRMED: yes
RED_OUTPUT:
  - wrapIndex/stepDelta/faceIndex tests: `Error: wrapIndex: not implemented` / `stepDelta: not
    implemented` / `faceIndex: not implemented` thrown from the stub functions in Machine.jsx —
    each pins its own arithmetic contract; nothing else in the call path can throw this message.
  - "renders all five faces as regions..." — `AssertionError: expected [] to deeply equal
    ['Face I', ...]` (MachineShell stub renders null, so zero regions mount) — pins that the shell
    must actually mount the five face regions.
  - "rests on Face I..." — `AssertionError: expected undefined to be 'true'` (no pips rendered) —
    pins the initial-mount pip/active-face state.
  - "plays the intro thunk..." — `AssertionError: expected "vi.fn()" to be called with
    arguments: ['thunk']. Number of calls: 0` — pins the mount-time thunk call, isolated from the
    click/settle path by the separate rotateTo tests below.
  - "clicking a pip..." / "every rotateTo settle fires the snap..." — both fail at `expect(pips.length).toBe(5)` (`expected +0 to be 5`) before any click fires — pins that
    the shell must render the five wayfinding pips; the click/aria-current/snap assertions later
    in each test are exercised once that first assertion passes.
  - "takes the static crossfade path..." — `AssertionError: expected null not to be null` on
    `[data-reduced]` — pins the reduced-motion hook.
  Full run confirms no other suite regressed: `Test Files 1 failed | 3 passed (4)`, `Tests 9
  failed | 30 passed (39)` — the 9 failures are exactly the 9 new Machine.test.jsx cases above (the
  10th, FACES ordering, is a real-data assertion that already holds and stays green).

## Stale tests
PRUNED: none
UPDATED: none
(model.test.js, Clue.test.jsx, audio.test.jsx from b1-t1/b1-t2 are untouched by this task's
contract — grepped for rotateTo/currentFace/Machine/snap-on-settle/reduced-motion and found no
production or test reference outside the new Machine.test.jsx; all three sibling suites stay green.)

## Contract
Machine.jsx must export:
- `FACES = ['I','II','III','IV','V']`.
- `wrapIndex(i, count=5)`: modular wrap, e.g. wrapIndex(5)=0, wrapIndex(-1)=4.
- `stepDelta(from, to, count=5)`: shortest SIGNED step between two indices on the 5-face ring,
  including forward wrap (stepDelta(4,0)=+1).
- `faceIndex(id)`: maps 'I'..'V' to 0..4; throws for an unrecognized id (the not-implemented body
  currently in Machine.jsx must be replaced with a real mapped return for known ids — the
  unknown-id guard clause is already correct and can stay).
- default `Machine()`: mounts AudioProvider + a shell that renders five FaceSurface-based
  `.machine__face` regions (role=region via the FaceSurface aria-label) in DOM order I..V, ALWAYS
  present in the DOM in both motion and reduced-motion modes; marks the active one with
  `.machine__face--active`.
- Five `.machine__pip` buttons (wayfinding), the current one carrying `aria-current="true"`;
  clicking pip i calls rotateTo(i), which updates currentFace/active face/lit pip and, once
  settled, calls `play('snap')` exactly once via useAudio() — snap must never be called from
  anywhere except rotateTo's settle (no per-caller snap calls).
- On mount (motion, matchMedia missing/false): rests on Face I, calls `play('thunk')` once, never
  `play('snap')`.
- On mount under `prefers-reduced-motion: reduce` (matchMedia mocked matches:true): a `[data-reduced]`
  hook appears somewhere in the tree, mount calls neither thunk nor snap, and all five regions
  still render in DOM order (static crossfade path, no tumble).
Full research.md blueprint (Machine.jsx rotateTo/intro implementation, MachineShell.css visuals,
main.jsx repoint) is code-writer's to build against this pinned contract; the five face stub files
and MachineShell.css already exist as placeholders (created here only so Machine.jsx compiles) and
may be freely elaborated or replaced by this task's code-writer and by later face tasks.

STATUS: TESTS_RED
