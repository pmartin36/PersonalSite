---
feature: ancient-machine
task: b1-t2
agent: tdd-research
updated: 2026-08-19
iteration: 1
---

## Mode
ADVERSARIAL (assumptions were provided)

## Verdict on assumptions
REFINED
- ASSUMPTION 1 "SFX synthesized at runtime via WebAudio, no asset pipeline" — VALIDATED. No audio
  asset or AudioContext usage exists anywhere (grep `audiocontext|oscillator|\.mp3|\.wav` in src =
  clean). WebAudio is the standard synth path; nothing blocks this task on asset generation.
- ASSUMPTION 2 "muting/arming testable in jsdom" — VALIDATED with the mechanism nailed down: jsdom
  has NO AudioContext (verified: `typeof window.AudioContext === 'undefined'`, same for
  webkitAudioContext). So the module MUST feature-detect `window.AudioContext ||
  window.webkitAudioContext` and no-op gracefully when absent; tests inject a spy AudioContext on
  `window` and assert node creation. jsdom dispatches DOM events fine, so the "first gesture arms"
  path is exercised by `window.dispatchEvent(new Event('pointerdown'))`. Both contractual behaviors
  (muted no-op, gesture-arm) are observable.
- WHAT CHANGED (the refinement — a spec-detail correction, the assumptions themselves held): the
  task DESCRIPTION paraphrases the SFX set as four names ("thunk, grind, snap, shake"). The spec's
  authoritative "Trigger points" list (spec:218-227) requires MORE distinct sounds that later face
  tasks will call by name through this one `play(name)` API: `flip` (Face II card flip, b2-t2),
  `deadThunk` (Face V WRONG press — spec:225-226, distinct from the `thunk` of a correct press),
  and `seam` (Face V seam-opening / solved-panel flip, spec:227). This module is the SINGLE owner
  of sound synthesis (every face routes through `play`), so the palette must enumerate the full
  trigger-point set now; shipping only four names would force a later face to either call a missing
  sound (silent) or invent its own WebAudio code (duplication). `play(unknownName)` therefore
  THROWS (fail-fast, matching the repo's `moveByOrder`/`directionLetter` convention) so a typo'd or
  unregistered sound name fails loudly in that face's test instead of silently not playing.

## Blueprint
APPROACH:
One new module `src/machine/audio.jsx` following the repo's exact context idiom (reveal.jsx:14-105):
`createContext` with a safe no-op default value, a `Provider` component holding React state, and a
`useAudio()` hook. No production code outside this file changes — the Provider is MOUNTED by the
shell in b1-t3 (its TOUCHES owns Machine.jsx); the unmute control is an exported component b1-t3
places. Scope stays exactly the task's two TOUCHES files (no TOUCHES gap this time).

State machine (two INDEPENDENT flags, per spec:215-216):
- `muted` — user preference, React state, DEFAULT true. Toggled only by the unmute control.
- `armed` — browser autoplay gate, React state, DEFAULT false. Flipped true by the FIRST user
  gesture. Arming is where the AudioContext is constructed AND `.resume()`d (autoplay policy
  requires context creation/resume inside a gesture handler).
- `play(name)` is a no-op unless `armed && !muted && audioContextAvailable`. This is why the two
  flags are separate: a first gesture can arm the context before the user ever unmutes, so that
  when they do unmute, sound is immediately live.

Arming mechanism (inherited by ALL callers, no opt-in): on mount the Provider installs ONE global
listener set (`pointerdown`, `keydown`, `touchstart` on `window`, capture) that on first fire
constructs+resumes the context, sets `armed`, and removes itself. The exported `MuteToggle`'s
onClick ALSO calls `arm()` (idempotent) so if unmuting is the visitor's first action the context
resumes within that same gesture.

Sound palette (the single synthesis owner): `SOUNDS` = a registry name -> `synth(ctx, startTime)`.
Enumerated names (the full spec trigger-point set): `snap`, `thunk`, `shake`, `grind`, `flip`,
`deadThunk`, `seam`. Each synth builds short WebAudio nodes (oscillator/gain envelope; the weighty
ones — thunk/shake/grind — add filtered noise via an AudioBufferSourceNode), connects to
`ctx.destination`, and schedules start/stop. Exact timbre is the code-writer's latitude; the
CONTRACT each synth must meet: create at least one source node, connect it toward destination, and
call `.start()` (this is the "WebAudio-node assertion" the deliverable names).

INTERFACES (all exported from src/machine/audio.jsx):
- `export function AudioProvider({ children })` — context provider; installs the gesture-arm
  listener; owns `muted`/`armed` state.
- `export function useAudio()` — returns `{ play, muted, armed, toggleMute, mute, unmute, arm }`.
  Backed by a context whose DEFAULT value is a safe no-op object (play(validName) is a silent
  no-op, muted=true, armed=false), so a face rendered in isolation (unit test without the Provider)
  never crashes — mirrors reveal.jsx's `!api` tolerance.
- `play` is obtained via the hook (`const { play } = useAudio()`), stable across renders
  (useCallback/ref) — not a bare module export.
- `export function MuteToggle({ className, ...rest })` — the obvious unmute control: a real
  `<button>` with an aria-label reflecting state ("Unmute audio" when muted / "Mute audio" when
  not), an icon/text glyph, onClick => `arm(); toggleMute()`. Minimal inline baseline styling for
  visibility (it must NOT add rules to machine.css — that file is co-owned by b1-t1/b5-t1 and is
  outside this task's TOUCHES; skinning happens in b5-t1). Carries a `machine-audio-toggle`
  className hook.
- `export const SOUNDS` — the registry (also lets tests assert the full name set exists).

DATA_FLOW:
first gesture (or MuteToggle click) -> arm(): construct `new AC()`, `ctx.resume()`, `armed=true`,
store ctx in a ref -> MuteToggle click also flips `muted=false` -> consumer (shell/face) calls
`play('snap')` -> guard `armed && !muted && ctx` passes -> `SOUNDS.snap(ctx, ctx.currentTime)`
builds nodes -> `ctx.destination` -> audible. `play('typo')` -> throws before any guard (unknown
name). muted or unarmed -> `play` returns immediately, no nodes.

FILES_NEW:
- paulmartin.dev/src/machine/audio.jsx
- paulmartin.dev/src/machine/audio.test.jsx
FILES_EDIT: none (Provider mount + MuteToggle placement belong to b1-t3's Machine.jsx, not here).

## Duplicate / reuse check
EXISTING:
- Context idiom to REUSE (a PATTERN to follow, not a util to import): src/reveal.jsx:14
  (`createContext`), :20-89 (Provider owning a ref/state + `typeof window` guards + listener
  install/teardown in `useEffect`), :91-105 (`useX` hook tolerant of a missing provider). Match it.
- Fail-fast convention to REUSE: src/machine/model.js `moveByOrder` throws on bad input; Clue.jsx:18
  `directionLetter` throws on unknown direction. `play(name)` throws on unknown name for the same
  reason (a mislabeled sound must fail its face's test, not go silent).
- Harness already stood up by b1-t1 (vite.config.js test block, vitest.setup.js jest-dom) — reused
  as-is; this task adds NO harness config. Verified present.
- No existing audio/AudioContext/asset code anywhere (grep clean) — nothing to reinvent or refactor.
CLEANLINESS:
- "One rule, one place" — sound synthesis: today ZERO call sites exist (grep `useAudio|play\(|
  AudioContext` in src = none outside this new file). This module is the sole synthesis owner. The
  FUTURE callers that MUST route through `play(name)` (from spec:218-227 trigger points, mapped to
  tasks): `snap` on rotateTo-settle (b1-t3) + `thunk` intro (b1-t3); `flip` (b2-t2 Face II);
  `grind` (b3-t1 Face III reel); `shake`+`thunk` correct / `deadThunk` wrong / `seam` completion
  (b4-t3 Face V). ENFORCEMENT baked in now: sound is reachable ONLY as `play(name)` and the name
  must be a key of `SOUNDS` or `play` throws — a face physically cannot emit a hand-rolled sound
  through this API, and a wrong/absent name fails that face's own test. No caller constructs an
  AudioContext or oscillator itself.
- Do NOT touch machine.css (co-owned b1-t1/b5-t1, outside TOUCHES) — MuteToggle styling stays as a
  className hook + minimal inline baseline; b5-t1 skins the control later.

## Test surface (feed-forward to test-writer)
PUBLIC_SURFACE:
- Default state: freshly mounted AudioProvider is `muted:true, armed:false`.
- Arming: the first `pointerdown`/`keydown`/`touchstart` on window flips `armed` true and (when a
  WebAudio ctor is present) constructs the AudioContext and calls `.resume()`; subsequent gestures
  do not re-construct.
- Muted no-op: with `armed:true` but `muted:true`, `play('snap')` creates NO source node.
- Audible path: with `armed:true` and `muted:false`, `play('snap')` creates a source node,
  connects toward `ctx.destination`, and calls `.start()` (WebAudio-node assertion = the behavioral
  evidence for this BEHAVIORAL task).
- Unarmed no-op: with `muted:false` but `armed:false`, `play('snap')` creates NO node.
- Unknown sound: `play('nope')` THROWS.
- Registry: `SOUNDS` contains exactly the trigger-point set {snap, thunk, shake, grind, flip,
  deadThunk, seam}.
- MuteToggle: renders a real `<button>` with aria-label indicating the muted state; clicking it
  arms audio and flips muted->unmuted (label updates).
- No-provider safety: `useAudio()` with no AudioProvider returns a usable object whose
  `play(validName)` is a silent no-op (does not throw) and whose muted/armed are true/false.
SUGGESTED_TESTS:
- default muted+unarmed on mount (probe component reading useAudio, or MuteToggle aria-label)
- first window gesture flips armed on AND constructs+resumes the spy AudioContext (assert ctor +
  resume called once)
- play('snap') while muted+armed -> spy ctx.createOscillator/createBufferSource NOT called (no-op)
- play('snap') while unmuted+armed -> a source node created, connect() called toward destination,
  start() called (audible-output / WebAudio-node assertion)
- play('snap') while unmuted+UNARMED -> no node created (arming gate holds independently of mute)
- play('bogus') throws
- SOUNDS has exactly {snap,thunk,shake,grind,flip,deadThunk,seam}
- MuteToggle: role button + aria-label reflects muted; user click -> armed true and muted false
  (label flips), and a following play('snap') now produces a node
- useAudio without provider: play('snap') is a no-op and does not throw; muted true / armed false
- (regression guard) arming is idempotent: a second gesture does not construct a second AudioContext

## Provenance
Load-bearing facts taken from a sibling and their disposition:
- Harness exists (vitest config test-block + vitest.setup jest-dom) — from b1-t1/research.md
  (FILES: vite.config.js, vitest.setup.js). RE-VERIFIED at paulmartin.dev/vite.config.js:1-13 and
  paulmartin.dev/vitest.setup.js:1, and by running `npm test` (2 files, 19 tests pass).
- RESUME_URL / MOVES / Clue landed by b1-t1 — from b1-t1/research.md. NOT relied on by this task
  (audio touches none of them); noted only to confirm no overlap. Taken as given, no dependency.
- jsdom lacks AudioContext — DERIVED independently this run (node+jsdom probe:
  `typeof window.AudioContext === 'undefined'`), not inherited.
- No existing audio code — DERIVED independently (grep in src, clean).

## Notes to orchestrator
- No new DEFECTS measured. The pre-existing RESUME_URL duplication defect (tasks.md `## DEFECTS`) is
  unrelated to this task; no edit made to tasks.md.
- No TOUCHES gap: the two files in the task's TOUCHES are exactly the two files this blueprint
  creates. The AudioProvider MOUNT and MuteToggle PLACEMENT are correctly b1-t3's work (its TOUCHES
  owns Machine.jsx); flagged here only as the feed-forward seam so b1-t3 wires `AudioProvider` +
  `MuteToggle` from `./audio.jsx`.

STATUS: IMPLEMENT
