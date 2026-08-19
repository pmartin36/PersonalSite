---
feature: ancient-machine
task: b1-t3
agent: tdd-code-writer
updated: 2026-08-19T19:30:00Z
iteration: 1
---

## Implementation
FILES:
  - paulmartin.dev/src/machine/Machine.jsx (filled in — was a compile stub with three throwing
    functions and a null-rendering MachineShell)
  - paulmartin.dev/src/machine/MachineShell.css (filled in — was a one-rule placeholder)
  - paulmartin.dev/src/main.jsx (edited — "/" route element Landing -> Machine; dropped the
    now-unused Landing import)

SUMMARY:
- `wrapIndex`/`stepDelta`/`faceIndex` implemented per the pinned arithmetic contract (modular wrap;
  shortest signed step across three wrap candidates, ties resolve positive; face-id lookup that
  throws on an unknown id).
- `MachineContext`/`useMachine()` provide `{ currentFace, rotateTo, faceCount }` to descendants
  (safe default already present from the test-writer's stub, kept as-is).
- `MachineShell` owns `currentFace`/`rotationSteps`/`introActive` state, reads
  `reducedMotion` once via a guarded `matchMedia` check (defaults to motion when
  `matchMedia` is absent, per jsdom caveat in research), and renders the viewport/drum/five
  face wrappers (always mounted, DOM order I..V) + wayfinding pips + `MuteToggle`.
- `rotateTo(index)` wraps the target, tumbles `rotationSteps` by the shortest signed delta,
  sets `currentFace`, and is the sole `play('snap')` emitter — scheduled on a settle timer
  (`SNAP_MS` under motion, immediate under reduced motion), replacing any pending timer on rapid
  re-turns.
- Intro effect (motion only, `didIntro` ref guards a single fire): plays `thunk` once on mount,
  drives a `.machine--intro` shake class for `SHAKE_MS`, with a one-shot pointerdown/keydown
  listener to skip it early. Under reduced motion it does nothing (rests statically on Face I, no
  thunk, no snap).
- Reduced motion also flips `.machine--reduced` + a `[data-reduced]` hook on the root; CSS flattens
  the drum and crossfades faces by opacity instead of tumbling.
- `main.jsx`: "/" now renders `Machine`; `Landing` import removed (file itself untouched).

MAPS_TO_BLUEPRINT: every blueprint interface honored as specified — `wrapIndex`, `stepDelta`,
`faceIndex`, `FACES`, `useMachine()`/`MachineContext`, `rotateTo` as the sole snap emitter,
intro-plays-thunk-not-snap, reduced-motion crossfade path, five always-mounted face regions in DOM
order, wayfinding pips calling `rotateTo(i)`, `MachineShell.css` transition duration (`600ms`)
matching `SNAP_MS`, main.jsx reroute. No deviations from the pinned contract.

DEVIATIONS: none

REUSED:
- `AudioProvider`/`MuteToggle`/`useAudio` from `./audio.jsx` (mounted here per research; no new
  audio/synth code written).
- `FaceSurface` from `./FaceSurface.jsx` (rendered inside every face module; no new panel primitive).
- Context idiom (createContext + Provider + useX hook with a safe default) followed from
  `reveal.jsx`, mirrored for `MachineContext`.
- Face stub files (`faces/FaceI..V.jsx`) and the `Machine.test.jsx` file already existed from the
  RED phase; only `Machine.jsx` and `MachineShell.css` needed bodies filled in.

## Expected result
TESTS: paulmartin.dev/src/machine/Machine.test.jsx — all 10 cases green (was 9 failing / 1 passing).
Full suite: `npx vitest run` -> 4 files, 39 tests, all passing (was 39 with 9 failing before this
change was applied).
BUILD: `npm run build` succeeds (vite build, 86 modules transformed, no errors).

STATUS: READY_TO_VALIDATE
