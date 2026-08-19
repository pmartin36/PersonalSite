---
feature: ancient-machine
agent: tdd-decomposition-validator
updated: 2026-08-19
iteration: 1
---

# Decomposition review — ancient-machine

VERDICT: valid (no high-severity issues)

Independent read of plans/ancient-machine-spec.md against .agent_handoffs/ancient-machine/tasks.md.

## Coverage — every explicit requirement maps to a task
- Machine (prism, horizontal axis, CSS 3D, front-fills-viewport, edges/depth): b1-t3
- Navigation (scroll/drag, inertia, debounce one-gesture-one-face, order 1..5 reversible, hard snap): b1-t4 + b1-t3 rotateTo
- Wayfinding (five etched pips bottom-right, current lit): b1-t3
- Scroll arbitration (DOM-ancestor overflow walk, not a marker): b1-t4
- Face I (name h1, resume via shared RESUME_URL, Contact->rotateTo IV, underlined move-4 "u"): b4-t1
- Face II (3 spindle cards, hover wiggle, corner flip, back-face move-3 clue, front Details->modal): b2-t2 + b2-t1
- Face III (3 reels, blank 3rd face, sliver window, spin, content, seam clue move-2, colored clue move-6): b3-t1 + b3-t2
- Face IV (2x3 slide puzzle, adjacent-only, start layout, back-plate move-5 in two seams, arcane 5-stroke tally, contacts w/ Bluesky->GitHub, no Resume): b4-t2
- Face V (sealed slab, linear 4-arrow row, no board, SEQUENCE lock, correct=shake+thunk/wrong=dead thunk+reset, move-1 gimme, complete->flip to /solved): b4-t3
- Clue-integrity build contract (MOVES SoT, SEQUENCE derived, per-face data-clue-* hooks, whole-puzzle proof): b1-t1 mechanism + per-face tests + b5-t2 gated proof
- Audio (thunk/grind/snap/shake, muted default, gesture-arm, no-op while muted): b1-t2; snap-on-settle + intro thunk: b1-t3; Face V press/seam SFX: b4-t3
- Detail modal (focus-trap, Escape, restore): b2-t1
- Intro (rest on face I, settle shake+thunk, reduced-motion static): b1-t3
- Reduced-motion crossfade + keyboard/DOM-order solvability: b1-t3 mechanism + b5-t2 proof
- Procedural sandstone skin + moss + asset-prompt handoff: b5-t1
MOVES table verified exact against spec Solution (1Up/V,2Right/III,3Left/II,4Up/I,5Down/IV,6Left/III). currentProjects=3 and previousProjects (Stargazer,Pong,16 Spaces,Solar Express) match reel content.

## Shared-interface hoisting — clean
model+SEQUENCE+RESUME_URL+Clue+FaceSurface+tokens (b1-t1), audio play() (b1-t2), rotateTo/currentFace w/ snap-on-settle (b1-t3), DetailModal (b2-t1). All consumers DEPENDS_ON the owning task. Clue-integrity invariant is properly hoisted: named owner (b1-t1 single Clue renderer emitting glyph+hook from one MOVES entry), the mechanism every face routes through, and the bypass check (per-face data-clue-* == MOVES + b5-t2 hooks-reconstruct-SEQUENCE gate). Correctly keyed by move ORDER (not faceId), which the spec's loose "MOVES[faceId]" got wrong for face III's two clues.

## DAG / TOUCHES / file-size — clean
No cycles. Every overlapping TOUCHES file (Machine.jsx, each Face*.jsx stub->fill, FaceIII.jsx/.css, FaceSurface.jsx, machine.css) is dependency-linked. No DEFECTS register. No touched file near the 1000-line default (main.jsx 31; all others new). No project-level size-limit doc.

## De-scoping — authorized
Slow-vs-fast scroll speed layer deferred (spec [open]); touch/mobile deferred (spec "desktop first ... later pass"). Both cite the spec. No unauthorized downgrade.

## Findings
- MED — TASK b1-t2/b1-t3 — The "obvious unmute control on the machine" and the AudioProvider that must wrap the faces are only in b1-t2's description; b1-t2 TOUCHES only audio.jsx (not Machine.jsx) and its DELIVERABLE asserts API behavior, not that the control renders on the shell. No task's deliverable mounts/verifies the control on the assembled machine, and b5-t2 does not check it. Assign the provider mount + visible unmute control to b1-t3 (owns Machine.jsx/main.jsx) with a deliverable assertion.
- MED — TASK b2-t2/b3-t1 — Per-face audio trigger points that the spec ties to their mechanism (Face II flip SFX, Face III reel-spin grind) appear in the DESCRIPTIONs but not the DELIVERABLEs, so nothing verifies they fire. Add a play()-spy assertion to each deliverable (as b1-t3 already does for snap-on-settle and b4-t3 does for press/seam SFX).
- LOW — TASK b1-t3 — Intro "skippable" (build-decision line 274) is in the description but absent from the deliverable's verification. Add a skip assertion or drop the claim.
- LOW — TASK b1-t1 — Heavy foundation: model + Clue mechanism + FaceSurface + tokens + test-harness standup in one task. Each is a legitimate hoisted shared primitive so splitting adds edges, but a failure here blocks everything; acceptable, noted.

STATUS: READY
