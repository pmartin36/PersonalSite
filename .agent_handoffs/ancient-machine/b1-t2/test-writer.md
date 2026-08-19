---
feature: ancient-machine
task: b1-t2
agent: tdd-test-writer
updated: 2026-08-19T19:03:36Z
iteration: 1
---

## Decision
WROTE
REASON: Muted-default and gesture-arming are contractual (autoplay policy); a regression either
autoplays sound or silently never plays it. Per TEST_RECOMMENDATION: write.

## Tests
FILES:
  - paulmartin.dev/src/machine/audio.test.jsx (new)
FILES (minimal signature stub, so tests compile/run and fail at assertion, not at
module-resolution — code-writer fills this in):
  - paulmartin.dev/src/machine/audio.jsx (new) — `SOUNDS = {}`; `useAudio()` always returns a
    constant `{ play: noop, muted: true, armed: false, toggleMute: noop, mute: noop, unmute: noop,
    arm: noop }` regardless of provider/gestures; `AudioProvider` renders children through a context
    whose value never changes; `MuteToggle` renders a real `<button aria-label="Unmute audio">`
    whose onClick does nothing.

CASES:
  - defaults to muted and unarmed on mount — asserts: fresh AudioProvider mount has muted=true,
    armed=false
  - useAudio without a provider is a safe no-op default — asserts: bare `useAudio()` (no
    AudioProvider) returns muted=true/armed=false and `play('snap')` does not throw
  - the first window gesture arms audio and constructs+resumes the AudioContext — asserts: a
    `pointerdown` on window constructs the AudioContext exactly once, calls `.resume()` once, and
    flips `armed` to true
  - a second gesture does not construct a second AudioContext — asserts: arming is idempotent
    across multiple gesture types (pointerdown then keydown)
  - play() is a no-op while muted, even when armed — asserts: after arming, `play('snap')` while
    still muted creates zero WebAudio nodes
  - play() is a no-op while unarmed, even when unmuted — asserts: `unmute()` without a prior
    gesture still blocks `play('snap')` from creating any node (arming gate is independent of mute)
  - play() creates a source node, connects it, and starts it while unmuted and armed — asserts: the
    audible path builds at least one node, calls `.connect()` and `.start()` on it
  - play() throws for an unregistered sound name — asserts: `play('bogus')` throws
  - SOUNDS registry contains exactly the full trigger-point set — asserts: `Object.keys(SOUNDS)` ==
    {snap, thunk, shake, grind, flip, deadThunk, seam}
  - MuteToggle is a real button whose click arms audio and flips the aria-label to muted-state —
    asserts: click on the "Unmute audio" button constructs the AudioContext and its accessible name
    becomes "Mute audio"

RUN: `npm --prefix paulmartin.dev test -- src/machine/audio.test.jsx` (or `npm --prefix
paulmartin.dev test` for the whole suite)
RED_CONFIRMED: yes
RED_OUTPUT:
  - `gesture arming > the first window gesture arms...`: `AssertionError: expected "vi.fn()" to be
    called 1 times, but got 0 times` at the ctor-call assertion (arming not implemented).
  - `gesture arming > a second gesture does not construct a second AudioContext`:
    `AssertionError: expected "vi.fn()" to be called 1 times, but got 0 times` (same root: no
    construction happens at all in the stub).
  - `play() guard > creates a source node...`: `AssertionError: expected 0 to be greater than 0`
    (no node ever created by the no-op stub `play`).
  - `play() guard > throws for an unregistered sound name`: `AssertionError: expected [Function] to
    throw an error` (stub `play` never throws).
  - `SOUNDS registry > contains exactly...`: `AssertionError: expected [] to deeply equal
    ['deadThunk','flip','grind','seam','shake','snap','thunk']` (empty stub registry).
  - `MuteToggle > is a real button whose click arms audio...`: `AssertionError: expected "vi.fn()"
    to be called 1 times, but got 0 times` (stub onClick is a no-op).
  - Full run: `Test Files 1 failed (1) | Tests 6 failed | 4 passed (10)`. Each failure is a single
    thrown `AssertionError` at the first meaningful expectation in its test body (Vitest aborts the
    rest of the test on that throw), so no later assertion in the same case is masked.
  - The 4 trivially-passing cases (defaults on mount, no-provider safety, muted-no-op-while-armed,
    unarmed-no-op-while-unmuted) pass against the stub because its constant default object already
    matches the required DEFAULT shape (muted:true/armed:false/never-throwing no-op play) and
    because "zero nodes created" holds vacuously when nothing is wired yet — same pattern as
    b1-t1's 2 trivial passes. They become live regression guards once the real Provider/gesture
    listeners/play guard exist (e.g. they will catch a future bug that arms on unmute, or that lets
    a muted call through).
  - Confirmed whole-suite health alongside: `npm --prefix paulmartin.dev test` = 2 files pass (23
    tests: model.test.js + Clue.test.jsx, unaffected) + audio.test.jsx red as above (29 total, 23
    passed / 6 failed). `npm --prefix paulmartin.dev run build` succeeds (85 modules, dist emitted).

## Stale tests
PRUNED: none
UPDATED: none
No existing test references audio, AudioContext, useAudio, or play() (`grep -rl
"audio|AudioContext|useAudio|play(" src --include="*.test.*"` outside the new file returns
nothing) — this task creates the audio module from scratch, superseding nothing.

## Contract
`paulmartin.dev/src/machine/audio.jsx` must export:
- `AudioProvider({ children })` — owns two independent flags as React state: `muted` (default
  true, toggled only by `toggleMute`/`MuteToggle`) and `armed` (default false, flipped true by the
  FIRST `pointerdown`/`keydown`/`touchstart` on `window`, which also constructs a
  `new (window.AudioContext || window.webkitAudioContext)()` and calls `.resume()` on it; the
  listener set removes itself after firing once so a second gesture is a no-op).
- `useAudio()` — returns `{ play, muted, armed, toggleMute, mute, unmute, arm }` backed by the
  Provider's context, whose DEFAULT (no-provider) value is a safe no-op: `play(validName)` never
  throws and does nothing, `muted:true`, `armed:false`.
- `play(name)` — no-op unless `armed && !muted && ` a context exists; when active, builds at least
  one WebAudio source node via the entry in `SOUNDS`, connects it toward `ctx.destination`, and
  calls `.start()`; `play(name)` for a `name` not in `SOUNDS` THROWS.
- `SOUNDS` — a registry whose keys are exactly `{snap, thunk, shake, grind, flip, deadThunk,
  seam}`, each a `(ctx, startTime) => void` synth.
- `MuteToggle({ className, ...rest })` — a real `<button>` whose `aria-label` is "Unmute audio"
  while muted and "Mute audio" while not, whose `onClick` calls `arm()` then `toggleMute()`
  (idempotent arm), carrying a `machine-audio-toggle` class.

STATUS: TESTS_RED
