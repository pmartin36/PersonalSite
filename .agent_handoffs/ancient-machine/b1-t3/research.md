---
feature: ancient-machine
task: b1-t3
agent: tdd-research
updated: 2026-08-19
iteration: 1
---

## Mode
ADVERSARIAL (assumptions were provided)

## Verdict on assumptions
VALIDATED (with two scoped caveats folded into the plan, no refutation)

- ASSUMPTION 1 "five-faced prism on a HORIZONTAL axis, front face fills viewport, via CSS 3D
  (perspective + rotateX on stacked faces)" — ACHIEVABLE. This is the standard CSS-3D carousel
  technique generalized from 4 faces (cube) to 5: each face `rotateX(72deg * i) translateZ(apothem)`,
  the drum `rotateX(-72deg * step)`, perspective on the viewport. Regular-pentagon apothem =
  (faceHeight/2)/tan(36 deg) ~= 0.688 * faceHeight, so a viewport-height face sits ~0.69vh in front
  of centre and reads full-bleed under perspective; adjacent faces are 72 deg apart so the tumbling
  edge and depth show mid-turn. CAVEAT (not a refutation): jsdom computes NO 3D layout, so the
  geometry/framing is NOT gate-testable — it is screenshot/Playwright evidence, which this task's
  BEHAVIORAL flag already requires. Exact perspective + translateZ + transition-curve tuning is
  code-writer latitude, verified by the per-face + mid-turn screenshots, not by an assertion.

- ASSUMPTION 2 "snap SFX emitted inside rotateTo-on-settle so scroll nav (b1-t4) and the Contact
  button (b4-t1) inherit it without their own audio call" — VALIDATED and made enforceable. Snap
  lives in rotateTo's settle only; no caller ever calls play('snap'). See the enumerated call-site
  dispositions under CLEANLINESS. The intro thunk is the one deliberately-separate audio path
  (mount, not a turn).

- CAVEAT folded in (jsdom fact, drives the whole test strategy): `window.matchMedia` is UNDEFINED in
  jsdom (probed: `typeof window.matchMedia === 'undefined'`). The reduced-motion read MUST guard for
  its absence and DEFAULT TO MOTION when missing, so the default suite exercises the motion path
  without crashing and the reduced-motion test mocks matchMedia locally. reveal.jsx:16-18 reads
  matchMedia unguarded, but it is untested; do not copy that unguarded form here.

## Blueprint
APPROACH:
One shell component in `src/machine/Machine.jsx` plus co-located `MachineShell.css`, five placeholder
face modules under `src/machine/faces/`, and a one-line reroute of main.jsx "/". The shell reuses the
already-landed primitives (do NOT reinvent): `AudioProvider`/`MuteToggle`/`useAudio` from ./audio.jsx
(b1-t2), `FaceSurface` from ./FaceSurface.jsx (b1-t1). It follows the reveal.jsx context idiom
(createContext + Provider + useX hook) for the machine API that faces consume.

Structure inside Machine.jsx:
- default `Machine()` -> `<AudioProvider><MachineShell/></AudioProvider>`. AudioProvider is mounted
  here (b1-t2 explicitly deferred the mount to this task) so every face shares one armed/muted state.
- internal `MachineShell()` — owns state, provides MachineContext, renders viewport/drum/faces/pips/
  MuteToggle. Uses `const { play } = useAudio()`.

State & rotation model:
- `currentFace` (React state, 0..4; 0 = Face I, the landing) — drives content/pips; the tested value.
- `rotationSteps` (React state, unbounded integer) — the CONTINUOUS tumble angle; CSS drum transform
  = `rotateX(calc(var(--rot) * -72deg))` with `--rot: rotationSteps`. Kept separate from currentFace
  so a 5->1 wrap tumbles forward one step instead of spinning back four.
- `reducedMotion` (read once at mount via the guarded helper below; also a `data-reduced` hook).

Pure helpers (exported from Machine.jsx, unit-tested — they carry the wrap/order contract that jsdom
CAN gate, independent of any 3D):
- `wrapIndex(i, count=5)` = ((i % count)+count)%count. Realizes order 1->2->3->4->5->1.
- `stepDelta(from, to, count=5)` = the shortest SIGNED step count from face `from` to face `to`
  (candidates raw, raw-count, raw+count; min |.|; tie -> positive). Realizes reversible + wrap
  continuity: stepDelta(4,0)=+1 (forward wrap), stepDelta(0,4)=-1, stepDelta(0,3)=-2.
- `FACES = ['I','II','III','IV','V']` and `faceIndex(id)` (throws on unknown, repo fail-fast idiom)
  so downstream callers name the face, not a magic index: b4-t1 does `rotateTo(faceIndex('IV'))`.
- `prefersReducedMotion()` = `typeof window!=='undefined' && typeof window.matchMedia==='function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches` (guarded; false when absent).

rotateTo (the ONE snap owner):
```
function rotateTo(index) {
  const target = wrapIndex(index)          // accepts any int incl. currentFace+/-1 and out-of-range
  const delta = stepDelta(currentFace, target)
  setRotationSteps(s => s + delta)
  setCurrentFace(target)
  clearTimeout(snapTimer.current)          // one settle per landing (rapid re-turn replaces it)
  snapTimer.current = setTimeout(
    () => play('snap'),                     // snap fires ON SETTLE, once, for EVERY caller
    reducedMotion ? 0 : SNAP_MS)            // SNAP_MS matches the CSS transform transition duration
}
```
- `SNAP_MS` const (e.g. 600) mirrors `MachineShell.css` `.machine__drum { transition: transform .6s }`
  (comment ties them). Timer is the single authoritative settle trigger (no transitionend) so it is
  deterministic under fake timers AND works under reduced-motion (no transition to listen for).
- Cleanup clears snapTimer on unmount.

Intro (mount, motion-only, plays THUNK not snap):
- `didIntro` ref guards a single fire across StrictMode's mount/cleanup/mount.
- If `reducedMotion`: do nothing — static, rests on Face I (currentFace already 0), NO thunk (spec:
  "static (no settle) under prefers-reduced-motion").
- Else: `setIntroActive(true)`, `play('thunk')`, `setTimeout(SHAKE_MS)` -> `setIntroActive(false)`;
  a one-shot window pointerdown/keydown listener clears introActive early (skippable). `.machine--intro`
  drives the shake keyframes in CSS. Intro NEVER routes through rotateTo, so its audio is thunk, not
  snap, and the initial landing on Face I fires no snap.
- NOTE the thunk is a no-op sound on a cold load (audio muted+unarmed until first gesture) — expected
  per autoplay policy; the CONTRACT the test pins is that play('thunk') is CALLED once on mount.

Rendering:
- `.machine__viewport` (perspective, full-viewport, overflow hidden) > `.machine__drum`
  (transform-style preserve-3d, `--rot` inline, transform+transition) > five `.machine__face`
  wrappers, ALWAYS all five in DOM order I..V (real regions, motion-independent), each rendering its
  face module. `.machine__face--active` marks currentFace.
- Reduced-motion: root gets `.machine--reduced`; CSS flattens the drum (`transform:none;
  transform-style:flat`) and the faces become a 2D crossfade (absolute-stacked, opacity 0, active
  opacity 1, `transition:opacity`). Faces stay in the SAME DOM so DOM-order reachability holds in both
  modes.
- Wayfinding: `.machine__wayfinding` bottom-right holds five `<button class="machine__pip">` (real
  buttons, keyboard-reachable) — clicking pip i calls `rotateTo(i)`; the current pip carries
  `aria-current="true"` + a `--lit` class. Pips double as the DOM handle tests drive.
- `MuteToggle` from ./audio.jsx placed in a corner (b5-t1 skins later); no styling added to the
  shared machine.css (co-owned by b1-t1/b5-t1, out of TOUCHES) — MachineShell.css is this task's own.

Face stubs (src/machine/faces/FaceI..V.jsx): each renders `FaceSurface` with an `aria-label` (so the
<section> is a landmark region -> getAllByRole('region') sees five) and a placeholder heading, e.g.
`<FaceSurface aria-label="Name"><h2>Face I - Name</h2></FaceSurface>`. Face tasks (b2-t2, b3-t1/2,
b4-t1/2/3) fill these; this task ships them as visible placeholders only.

main.jsx: swap the "/" route element `<Landing/>` -> `<Machine/>` (import Machine from
'./machine/Machine.jsx'); remove the now-unused `import Landing`. Leave /solved, /projects/:slug,
/madebymoonlight untouched (later tasks reuse their content, not their routes; out of this scope).

INTERFACES:
- Machine.jsx default `Machine()` (mounts AudioProvider + MachineShell).
- `useMachine()` -> `{ currentFace: number, rotateTo(index): void, faceCount: 5 }` (context; safe
  no-op default so a face unit-rendered without the shell does not crash, mirroring reveal.jsx/audio).
- `rotateTo(index)`: accepts any integer, wraps via wrapIndex; sets currentFace + tumbles by shortest
  signed delta; schedules the on-settle snap. The sole snap emitter.
- exports `wrapIndex`, `stepDelta`, `faceIndex`, `FACES` (helpers + face-name->index for callers/tests).
- FaceI..FaceV.jsx: default components rendering a labeled FaceSurface placeholder.

DATA_FLOW:
mount -> reducedMotion read (guarded matchMedia) -> intro effect (motion: play('thunk') + shake, rest
on Face I; reduced: nothing). Navigation: pip click / (future) b1-t4 scroll / b4-t1 Contact ->
rotateTo(index) -> wrap+delta -> setCurrentFace + setRotationSteps (CSS drum tumbles / crossfade) ->
settle timer -> play('snap'). Faces read `useMachine().rotateTo` to navigate; they never touch audio
for turns.

FILES_NEW:
- paulmartin.dev/src/machine/Machine.jsx
- paulmartin.dev/src/machine/MachineShell.css
- paulmartin.dev/src/machine/Machine.test.jsx
- paulmartin.dev/src/machine/faces/FaceI.jsx  (stub)
- paulmartin.dev/src/machine/faces/FaceII.jsx (stub)
- paulmartin.dev/src/machine/faces/FaceIII.jsx (stub)
- paulmartin.dev/src/machine/faces/FaceIV.jsx (stub)
- paulmartin.dev/src/machine/faces/FaceV.jsx  (stub)
FILES_EDIT:
- paulmartin.dev/src/main.jsx  (swap "/" element Landing -> Machine; drop unused Landing import)

File-size budget: all new files, each well under the 1000-line default limit (Machine.jsx ~150-200
lines, stubs ~5 lines). No split needed. No CLAUDE.md/repo-stated limit found; default applies.

## Duplicate / reuse check
EXISTING (reuse, do NOT reinvent):
- Audio: `AudioProvider`, `MuteToggle`, `useAudio`, `play('snap')`/`play('thunk')`, `SOUNDS`
  registry — paulmartin.dev/src/machine/audio.jsx:53-156 (re-verified). This task mounts the
  Provider + places MuteToggle + calls play; it writes NO audio/AudioContext/synth code.
- Face primitive: `FaceSurface` default export — paulmartin.dev/src/machine/FaceSurface.jsx:3
  (re-verified). Every face wrapper and every stub renders it; no new panel primitive.
- Context idiom to FOLLOW (pattern, not import): paulmartin.dev/src/reveal.jsx:14-105 (createContext
  with safe default, Provider, useX hook tolerant of missing provider). Mirror for MachineContext.
- Fail-fast idiom to FOLLOW: model.js `moveByOrder` / Clue.jsx `directionLetter` throw on bad input;
  `faceIndex(id)` throws on an unknown face id the same way.
- No existing Machine / MachineShell / rotateTo / currentFace / useMachine anywhere (grep clean).
- No existing production play('snap')/play('thunk') (grep: only audio.test.jsx). Landing imported
  only at main.jsx:6.
CLEANLINESS:
- ONE-PLACE claim for snap-on-settle. Guarded construct = a drum turn emitting the snap SFX. EXISTING
  construction sites of `play('snap')` in production: `rg -n "play\('snap'\)" src` -> ZERO
  (only audio.test.jsx, a test). This task adds exactly ONE: inside rotateTo's settle timer. FUTURE
  callers that turn the drum and MUST NOT call play('snap') themselves, each dispositioned:
    * wayfinding pips (THIS task) -> call rotateTo(i); inherit snap. routed.
    * b1-t4 scroll/inertia nav -> calls rotateTo(currentFace +/- 1); inherit snap. routed.
    * b4-t1 Face I Contact button -> calls rotateTo(faceIndex('IV')); inherit snap. routed.
    * intro landing on Face I -> DELIBERATELY EXCLUDED: it is not a turn (never calls rotateTo); it
      plays THUNK on mount, not snap. This is the one intentional non-rotateTo audio in the shell.
  Enforcement: snap is emitted only from rotateTo's settle; callers have `rotateTo` as their only
  navigation entry and no reason to touch audio. Reviewers/b5-t2 should confirm no face reintroduces
  a per-caller play('snap'). (Cannot be made compile-fail here, but the call-site set is enumerated
  and each future turn caller routes through rotateTo.)
- reducedMotion detection is inlined at ~8 existing sites (reveal.jsx:16-18, useRaft.js:52,
  Carousel.jsx:55, NameShimmer.jsx:22, ChevronDots.jsx:13, ProjectMedia.jsx:15, MazeBackground.jsx:36,
  Landing.jsx:31). This task inlines the SAME one-liner (guarded for jsdom) in Machine.jsx, consistent
  with the repo; it does NOT hoist the pre-existing duplication (out of scope, not introduced here).
- Do not write to machine.css (b1-t1/b5-t1 co-owned, out of TOUCHES); all shell styling lives in the
  task's own MachineShell.css.

## Test surface (feed-forward to test-writer)
PUBLIC_SURFACE (what the code must satisfy; jsdom-gatable parts vs screenshot parts marked):
- [gate] wrapIndex/stepDelta: wrapIndex(5)=0, wrapIndex(-1)=4; stepDelta(4,0)=+1, stepDelta(0,4)=-1,
  stepDelta(0,3)=-2 (reversible + forward wrap-around order 1..5..1).
- [gate] faceIndex('IV')=3, faceIndex('I')=0; faceIndex('X') throws.
- [gate] on mount the machine rests on Face I (currentFace 0; the first/active region is Face I; the
  first pip is lit / aria-current).
- [gate] five face regions render in DOM order I,II,III,IV,V in BOTH motion and reduced-motion modes.
- [gate] clicking wayfinding pip i moves currentFace to i and lights pip i (aria-current shifts);
  advancing past the last pip / rotateTo wrap brings Face I back (wrap-around).
- [gate] EVERY rotateTo settle fires play('snap') exactly once (fake timers advanced by SNAP_MS);
  no snap fires for the initial Face I landing.
- [gate] intro on mount (motion) calls play('thunk') once and NOT play('snap'); under mocked
  reduced-motion the mount calls NEITHER thunk nor snap (static, no settle).
- [gate] reduced-motion (matchMedia mocked to reduce) selects the crossfade path: root carries the
  `machine--reduced` class / `data-reduced` hook (and the drum lacks the 3D-tumble class); all five
  regions still present in DOM order.
- [gate] audio spied via `vi.mock('./audio.jsx')` returning `{ play: vi.fn(), MuteToggle: ()=>null,
  AudioProvider: ({children})=>children, useAudio: ()=>({play}) }` (or equivalent) so play calls are
  observable; matchMedia mocked per-test (jsdom lacks it) — motion tests may leave it unset (helper
  defaults to motion), reduced tests set `window.matchMedia = () => ({ matches:true, ... })`.
- [screenshot/Playwright, BEHAVIORAL] real CSS-3D tumble on a horizontal axis, front face full-bleed,
  tumbling edge/depth visible mid-turn, hard snap; per-face screenshots; reduced-motion crossfade with
  no tumble/shake and five regions in DOM order. (Not assertable in jsdom.)
SUGGESTED_TESTS (Machine.test.jsx unless noted):
- wrapIndex / stepDelta / faceIndex unit cases above (pure, no render).
- renders five regions in DOM order (getAllByRole('region') labels I..V), motion mode.
- rests on Face I at mount: first pip aria-current, Face I region active.
- click pip index 3 (Face IV) -> currentFace/active region + lit pip become IV; advance timers
  SNAP_MS -> play('snap') called once; play('thunk') NOT called by this click.
- wrap-around: from Face V (click pip V) then rotateTo/pip back to I -> Face I active (via wrapIndex).
- intro: fresh mount (motion) -> play('thunk') called once, play('snap') not called.
- reduced-motion mock: mount -> root has machine--reduced, NO thunk/snap on mount, five regions still
  in DOM order (crossfade-path assertion the deliverable names).
- (behavioral, code/validator step) per-face + mid-turn + reduced-motion crossfade screenshots.

## Provenance
Load-bearing facts inherited from siblings and their disposition:
- Audio API shape (AudioProvider/MuteToggle/useAudio/play/SOUNDS, play throws on unknown name, mount
  deferred to this shell) — from b1-t2/research.md + b1-t2/code-writer. RE-VERIFIED by reading
  paulmartin.dev/src/machine/audio.jsx:53-156 directly.
- FaceSurface signature (default export, renders <section.face-surface> with content slot, passes
  ...rest so aria-label/region works) — from b1-t1/research.md. RE-VERIFIED at
  paulmartin.dev/src/machine/FaceSurface.jsx:1-11 and machine.css:11-20.
- model/Clue (MOVES, faceId->order) — from b1-t1; NOT relied on by this task (the shell renders no
  clue; face stubs carry none). Taken as given, no dependency.
- Harness present (vitest+jsdom, vite.config test block, vitest.setup jest-dom, `test` script) — from
  b1-t1. RE-VERIFIED at paulmartin.dev/vite.config.js and package.json; both siblings' suites green
  (19 then 29 tests) per their validator.md.
- jsdom lacks window.matchMedia; no production rotateTo/useMachine/play('snap'); Landing imported only
  at main.jsx:6 — DERIVED INDEPENDENTLY this run (node+jsdom probe and grep), not inherited.

## Notes to orchestrator
- No new DEFECTS measured. The pre-existing RESUME_URL duplication (tasks.md ## DEFECTS) is unrelated;
  this task de-routes Landing at "/" (as that entry notes) but does not delete Landing.jsx or its
  literal. No edit to tasks.md.
- Feed-forward seams: b1-t4 edits Machine.jsx to add scroll->rotateTo(currentFace +/- 1) (inherits
  snap); b4-t1 Face I uses `useMachine().rotateTo(faceIndex('IV'))`; every face module fills a stub
  created here. The MachineContext safe-default keeps a face unit-testable without the shell.
- No TOUCHES gap: FILES_NEW/EDIT match the task TOUCHES exactly (Machine.jsx, MachineShell.css,
  Machine.test.jsx, five face stubs, main.jsx).

STATUS: IMPLEMENT
