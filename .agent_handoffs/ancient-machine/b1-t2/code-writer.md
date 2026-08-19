---
feature: ancient-machine
task: b1-t2
agent: tdd-code-writer
updated: 2026-08-19T19:20:00Z
iteration: 1
---

## Implementation
FILES: [paulmartin.dev/src/machine/audio.jsx]
SUMMARY: Filled in the test-writer's stub with the real AudioProvider/useAudio/MuteToggle contract.
`AudioProvider` holds `muted` (default true) and `armed` (default false) as independent React
state. A single capture-phase listener set (`pointerdown`/`keydown`/`touchstart` on `window`)
installed in `useEffect` fires once, calls `arm()` (constructs
`window.AudioContext || window.webkitAudioContext`, calls `.resume()`, sets `armed`), then removes
itself — a second gesture is a no-op. `play(name)` throws for a name not in `SOUNDS` before any
guard; otherwise it is a no-op unless `armed && !muted && ctx`, then invokes the registry synth
which builds oscillator/gain or buffer-noise nodes, connects toward `ctx.destination`, and calls
`.start()`. `SOUNDS` now has all seven trigger-point synths (`snap`, `thunk`, `shake`, `grind`,
`flip`, `deadThunk`, `seam`) built from two small helpers (`tone`, `noiseBurst`). `useAudio()`
reads the context whose default value is the no-op/muted/unarmed object (no-provider safety).
`MuteToggle` reads state from `useAudio()`, renders a real `<button>` with the aria-label reflecting
mute state, and its `onClick` calls `arm()` then `toggleMute()`.

MAPS_TO_BLUEPRINT:
- `AudioProvider({ children })`, `useAudio()`, `MuteToggle({ className, ...rest })`, `SOUNDS` —
  all exported exactly per INTERFACES.
- Two independent flags (muted default true / armed default false) — honored.
- Single global gesture-arm listener set that self-removes after first fire, also callable
  idempotently from `MuteToggle`'s `arm()` — honored.
- `play` obtained via the hook, stable via `useCallback` — honored.
- `play(unknownName)` throws before the armed/muted guard — honored (DATA_FLOW: "throws before any
  guard").
- No edits to machine.css; no changes outside the two TOUCHES files — honored.

DEVIATIONS:
- Synth helpers (`tone`, `noiseBurst`) guard `osc.frequency`/`env.gain` with existence checks
  before writing to them. The test's mock WebAudio nodes (`audio.test.jsx` `makeSpyNode`) only
  expose `connect`/`start`/`stop`, not AudioParam sub-objects, so an unconditional
  `osc.frequency.value = ...` throws against the mock. This is implementation latitude within the
  blueprint's stated CONTRACT ("create at least one source node, connect it toward destination,
  call `.start()`") — real AudioContext nodes do have `.frequency`/`.gain`, so behavior against a
  live browser AudioContext is unchanged; the guard only protects the reduced mock surface.
REUSED: Context/Provider/hook idiom from src/reveal.jsx:14-105 (createContext + Provider owning
ref/state + typeof-window guard + listener install/teardown in useEffect + tolerant hook).
Fail-fast throw convention from src/machine/model.js:15-21 (`moveByOrder`) and
src/machine/Clue.jsx:18-24 (`directionLetter`), applied to `play(name)` on an unregistered name.

## Expected result
TESTS: paulmartin.dev/src/machine/audio.test.jsx — all 10 cases green.
BUILD: `npm --prefix paulmartin.dev run build` succeeds (verified: 85 modules, dist emitted).
Full suite verified: `npm --prefix paulmartin.dev test` = 3 files, 29 tests, all passed (23
pre-existing + 6 new-audio red-fixed + 4 audio trivial passes now backed by real behavior).

STATUS: READY_TO_VALIDATE
