---
feature: ancient-machine
task: b1-t4
agent: tdd-research
updated: 2026-08-19
iteration: 1
---

## Mode
ADVERSARIAL (assumptions were provided)

## Verdict on assumptions
VALIDATED

- ASSUMPTION "Region arbitration is the decided default keyed on computed overflow" — VALIDATED.
  Spec "Scroll arbitration" lines 51-55 make it a FIXED mechanism, not a proposal to re-decide:
  walk the pointer's DOM ancestor chain for an element whose computed `overflow` is auto/scroll AND
  which has real overflowing content; it "does NOT key off a bespoke marker attribute/class." Build
  exactly this.
- ASSUMPTION "slow-vs-fast speed layer is deferred and NOT built this pass" — VALIDATED. Spec line
  56-58 tags it `[open]`: "Start region-based, layer speed in only if it feels needed." Region-based
  only this pass; no speed layer.
- SCOPE_QUESTION "confirm the speed layer stays deferred" — CONFIRMED DEFERRED. Do not build it.
- Added constraint I verified against the shell (b1-t3 already landed): rotateTo is the SOLE snap
  emitter (Machine.jsx:71-85 schedules `play('snap')` on settle). The scroll hook must reach the drum
  ONLY through `rotateTo` and must never call `play`. Confirmed no other prod caller of play('snap')
  (`rg "play\('snap'\)" src` -> only audio.test.jsx). Scroll nav must ALSO work under reduced motion
  (spec 238-240: crossfade, "solvable through the same inputs minus the shake"); rotateTo already
  handles the reduced-motion settle (0ms timer), so the hook does NOT gate on reducedMotion.

## Blueprint
APPROACH:
Factor the gesture + arbitration logic OUT of React into two pure, jsdom-gate-testable pieces in a new
`src/machine/useScrollNav.js`, then a thin React hook that wires them to a DOM node and delegates
stepping to the shell's existing `rotateTo`. This mirrors the repo pattern of exporting pure helpers
(wrapIndex/stepDelta from Machine.jsx) so the regression-prone logic is unit-tested without needing 3D
layout jsdom cannot compute.

Three exports from useScrollNav.js:
1. `findScrollableAncestor(startEl, boundary)` — pure. Walks `startEl` up via `parentElement`, stopping
   BEFORE `boundary` (exclusive), returning the first element for which `isScrollable(el)` is true, else
   null. This is the overflow-based arbitration decision.
2. `createScrollNavController({ onStep, getBoundary, threshold, idleMs })` — pure controller returning
   `{ handleWheel(event), cancel() }`. Holds the debounce/inertia state. No React, no DOM ownership;
   fully testable by feeding plain `{ deltaY, target, preventDefault }` objects + fake timers.
3. default `useScrollNav(rootRef, { onStep })` — React hook. On mount attaches the controller's
   handleWheel to `rootRef.current` as a `wheel` listener with `{ passive: false }` (so drum turns can
   `preventDefault` the page scroll), boundary = the same root; cleans up on unmount.

Arbitration predicate `isScrollable(el)` (internal, exported for tests):
```
const cs = getComputedStyle(el)
const okY = (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight
const okX = (cs.overflowX === 'auto' || cs.overflowX === 'scroll') && el.scrollWidth  > el.clientWidth
return okY || okX
```
Both clauses are required: computed overflow auto/scroll AND real overflowing content (per spec "AND
real overflowing content"). Keyed purely on computed style + scroll metrics — never a marker attr/class.

Controller `handleWheel(event)`:
```
const scrollable = findScrollableAncestor(event.target, getBoundary())
if (scrollable) return                       // CONTENT path: let native scroll happen, no rotate, no preventDefault
event.preventDefault?.()                      // DRUM path: block page scroll
clearTimeout(idleTimer)
idleTimer = setTimeout(() => { locked = false; accum = 0 }, idleMs)   // release lock after the gesture goes quiet
if (locked) return                            // swallow the inertia tail -> one gesture = one step
accum += event.deltaY
if (Math.abs(accum) >= threshold) {
  onStep(Math.sign(accum))                    // +1 = forward (deltaY>0), -1 = back; reversible
  locked = true
  accum = 0
}
```
`cancel()` clears idleTimer. Suggested constants (code-writer latitude): `threshold = 40`, `idleMs = 160`.
One flick commits exactly one step, then `locked` swallows every trailing inertia event; the idle timer
keeps being pushed out by the tail, so the lock only releases `idleMs` after the LAST event — the next
deliberate flick then steps again. A single large-deltaY notch also commits exactly one step.

INTERFACES:
- `findScrollableAncestor(startEl: Element, boundary: Element|null) -> Element|null`
- `isScrollable(el: Element) -> boolean`
- `createScrollNavController({ onStep:(dir:-1|1)=>void, getBoundary:()=>Element|null, threshold?, idleMs? }) -> { handleWheel(event), cancel() }`
- default `useScrollNav(rootRef: RefObject<Element>, { onStep:(dir)=>void }): void`

DATA_FLOW:
wheel event on any descendant of `.machine` bubbles to the root listener -> controller walks
event.target..root(excl) for a scrollable-overflow ancestor. Found (Face III reel body, a modal body
rendered inside .machine) -> native scroll, drum untouched. Not found -> preventDefault + debounce/
inertia -> on commit `onStep(dir)` -> shell's `handleStep(dir)` -> `rotateTo(currentFaceRef.current + dir)`
-> wrapIndex + stepDelta tumble + the existing on-settle `play('snap')`. Modals that portal to
document.body sit OUTSIDE .machine, so their wheel events never reach this listener and the drum stays
put with no special-casing (note for b2-t1).

FILES_NEW:
- paulmartin.dev/src/machine/useScrollNav.js
- paulmartin.dev/src/machine/useScrollNav.test.js   (pure calls only — NO JSX; keeps the .js extension the plan names)
FILES_EDIT:
- paulmartin.dev/src/machine/Machine.jsx (MachineShell): add `rootRef` on the outer `.machine` div;
  add `currentFaceRef` synced via `useEffect(() => { currentFaceRef.current = currentFace }, [currentFace])`;
  add stable `handleStep = useCallback((dir) => rotateTo(currentFaceRef.current + dir), [rotateTo])`;
  call `useScrollNav(rootRef, { onStep: handleStep })`. ~8 lines added. No change to rotateTo/audio.

File-size budget: Machine.jsx 180 lines + ~8 -> ~188, well under the 1000-line default (no repo-stated
limit found). useScrollNav.js ~90 lines. No split needed.

## Duplicate / reuse check
EXISTING (reuse, do NOT reinvent):
- `rotateTo` — paulmartin.dev/src/machine/Machine.jsx:71-85 (re-verified). The hook steps the drum ONLY
  through this; it inherits the on-settle snap and never touches audio.
- `wrapIndex` — Machine.jsx:25-27 (re-verified). rotateTo wraps internally, so `handleStep` may pass
  `currentFaceRef.current +/- 1` unbounded; no separate wrap in the hook.
- `useMachine` context already carries `{ currentFace, rotateTo }` (Machine.jsx:55-60), but the wheel
  listener lives INSIDE the shell, so it reads currentFace via the ref directly — no new context field.
- No existing wheel/scroll-drum logic anywhere: `rg "addEventListener\('wheel'|onWheel|deltaY|useScrollNav"
  src` -> none. NameShimmer.jsx:36 uses getComputedStyle for an unrelated purpose (not reusable). The old
  galaxy section-snap scroll is on the de-routed Landing path and is a different mechanism; not reused.
CLEANLINESS:
- ONE-PLACE claim for the snap SFX is OWNED by b1-t3's rotateTo, not introduced here. Existing prod
  construction sites of `play('snap')`: `rg "play\('snap'\)" src` -> ZERO (only audio.test.jsx). This task
  adds ZERO new snap sites; its single drum-turn entry is `rotateTo`, so it inherits the snap. Disposition:
  scroll commit -> handleStep -> rotateTo -> snap. routed. The hook must contain NO `play(...)` call.
- Arbitration keyed on computed overflow + scroll metrics only. The test MUST include a negative case:
  an element carrying a bespoke class/data-* but NO overflow returns null (drum), proving the rule is not
  marker-keyed (spec-mandated, and the deliverable's named assertion).
- `onStep` passed to the hook must be a stable useCallback so the wheel listener attaches once (no
  re-attach churn); `handleStep` depends only on the stable `rotateTo`.

## Test surface (feed-forward to test-writer)
PUBLIC_SURFACE (the observable contract):
- [gate] findScrollableAncestor/isScrollable: overflow auto|scroll + real overflow (scrollHeight>clientHeight
  or scrollWidth>clientWidth) => scrollable; overflow auto but NO real overflow => not; a marker class/attr
  with visible overflow => not; boundary is exclusive (never walks into/past it).
- [gate] controller debounce: one flick (a burst of wheel events within idleMs) => onStep called EXACTLY
  once; sign of deltaY sets direction (+1 forward / -1 back, reversible); after the idle timer elapses a new
  flick => a second onStep; a single large-deltaY event => exactly one step.
- [gate] controller arbitration: event.target under a scrollable-overflow ancestor => onStep NOT called and
  preventDefault NOT called (content path); no scrollable ancestor => preventDefault called and the gesture
  can commit (drum path); marker-but-no-overflow ancestor => treated as drum (proves overflow-based).
- [behavioral, Playwright/screenshot — the deliverable's evidence, NOT jsdom] one real wheel flick advances
  exactly one face, an opposite flick reverses it; scrolling with the pointer over an element with real
  overflow scrolls that element and does NOT rotate the drum.
SUGGESTED_TESTS (useScrollNav.test.js — pure, no JSX; build nodes with document.createElement, set overflow
via inline longhand style e.g. `el.style.overflowY='auto'`, stub scrollHeight/clientHeight via
Object.defineProperty since jsdom computes no layout; drive time with vi.useFakeTimers):
- isScrollable: auto + stubbed scrollHeight>clientHeight => true.
- isScrollable: auto + scrollHeight===clientHeight => false (no real overflow).
- isScrollable: element with class="scrollable" / data-scroll but overflow visible => false (not marker-keyed).
- findScrollableAncestor: from a deep child returns the nearest scrollable ancestor; returns null when none;
  stops at boundary (a scrollable node AT/above boundary is not returned).
- controller: burst [deltaY 120, 40, 20, 10] all before idleMs => onStep called once with +1; preventDefault
  called on each drum-path event.
- controller: negative deltaY burst => onStep(-1).
- controller: flick, advance timers past idleMs, second flick => onStep called twice total.
- controller: target inside a scrollable ancestor => onStep NOT called, preventDefault NOT called.
- controller: target under marker-only (no overflow) ancestor => drum path (onStep fires), asserting overflow-
  not-marker detection.

## Provenance
Load-bearing facts inherited from siblings and their disposition:
- rotateTo is the sole snap emitter, accepts any integer and wraps, snap fires on settle — from
  b1-t3/research.md. RE-VERIFIED by reading Machine.jsx:71-85 and `rg "play\('snap'\)" src` (zero prod
  sites). This task edits Machine.jsx, so this region is exactly what my change touches — verified directly,
  not taken as given.
- wrapIndex/stepDelta/FACES/useMachine shapes — from b1-t3. RE-VERIFIED at Machine.jsx:17-60.
- Audio `play` single-owner API (play('snap') via rotateTo, muted no-op) — from b1-t2. NOT called by this
  task; taken as given (the hook deliberately touches no audio).
- Harness present (vitest + jsdom, globals, jest-dom setup, `test` = vitest run) — from b1-t1. RE-VERIFIED
  at paulmartin.dev/vite.config.js and package.json.
- jsdom computes no 3D/layout (scrollHeight/clientHeight default 0, must be stubbed); @vitejs/plugin-react
  transforms .jsx (other tests are .test.jsx) so useScrollNav.test.js stays JSX-free to keep the .js
  extension the plan names — DERIVED INDEPENDENTLY this run.

## Notes to orchestrator
- No new DEFECTS measured. No edit to tasks.md.
- Speed layer (slow=content / fast=drum) CONFIRMED deferred per spec `[open]`; not built.
- Seam for b2-t1: a modal portaled to document.body is outside `.machine`, so its wheel never reaches this
  listener (drum stays put) with no marker and no edge; a modal rendered inside `.machine` is handled by the
  overflow arbitration. Either placement is correct; no dependency edge is created.
- Every operation named in prose (wheel step forward/back, content-vs-drum arbitration, overflow-not-marker,
  debounce collapse, idle release) has a matching entry in SUGGESTED_TESTS.

STATUS: IMPLEMENT
