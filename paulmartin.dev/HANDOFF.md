# Handoff: drum face art integration

Context for the next agent picking up the `wind-waker` work on the 3D pentagonal
stone puzzle-box landing.

## Git state

- Working branch: **`wind-waker`**. PRs target `main`.
- **`rough-edges`** branch exists, reserved for the not-yet-started edge-roughening
  experiment (see Upcoming). It sits at the same commit `wind-waker` was at before
  this session's art swap.
- Commits landed this session (on `wind-waker`):
  - carve the text into the stone + swap the mossy sandstone
  - working state (Bluesky handle, kept asset iterations)
  - soften the face edge into a warm shadow + ease the holder side shadow
  - (this session's final commit) swap to the Face 2 look + asset cleanup + debug tools + this handoff

## What we did this session

- **Face I hero name is an SVG stone-subtraction carve.** The stone image is
  clipped to the letterforms and darkened by a per-channel `feComponentTransfer`
  subtraction, so the cracks run through the letters as rich brown (a blend mode
  would grey or mute them). It has a lip/core/wall bevel, and a `viewBox` keeps
  the bevel proportional at any size. Full mechanism and the dead-ends we ruled
  out are in memory `face1-carved-name.md`.
- **Shared carve classes** in `machine.css`: `.machine-carve` (light etch, warm
  translucent fill + gold lower lip) and `.machine-carve--deep` (rich, for big
  headings and icons). Applied to the smaller text across Faces I to IV (titles,
  resume/contact, About copy, contact values/icons). The full SVG carve is Face I
  hero only; small text and anything on moving reels/tiles uses the CSS classes.
- **Face IV tray and Face V chamber** are engraved recessed stone: the texture
  multiplied to a warm floor, a hard-edge-then-linear-gradient cut wall, a lit
  lower lip. Face V carries continuous stone across the whole face (aligned
  windowed lid, shaded underside/chamber).
- **Face edge softened** from a hard 2px stroke to a tight warm-brown shadow
  falloff (`box-shadow` on `.face-surface`). IMPORTANT: a `mask` feather was tried
  and reverted because fading to transparent showed the jungle through the drum.
  Do not reintroduce transparency at the face edges; the edge must fade to shadow.

## Art integration status (ongoing)

- The artist iterated moss -> integrated moss -> leafy vines. **We aligned on the
  final art with the artist: it is essentially `face2.png` (the Face 2 stone) with
  the leaves + vines foliage. The final baked image is NOT in yet.**
- Until it arrives, the app stands in with **`test_asset_with_leaves2.png`** (the
  Face 2 stone with foliage baked in), referenced by `FaceI.jsx` (carve),
  `machine.css` (base), `FaceIV.css` (tray), `FaceV.css` (lid/chamber/underside).
- **When the final art lands: drop it into `public/machine/`, then swap the four
  references** from `test_asset_with_leaves2.png` to the new filename (one sed
  across `src/machine`). All faces share the base, so it updates everywhere and
  the carve/tray/chamber stay aligned (keep it 1820x1000, the exact face aspect).
- Assets were cleaned this session. Remaining in `public/machine/`:
  `test_asset_with_leaves2.png` (app), `face1/2/3.png` + `just_leaves.png` +
  `vines.png` (debug tools), `about-border.png` (Face IV frame). Removed the dead
  interim/reference assets (old moss, sandstone-ref, face_attempt_2, leaves1, etc).

## Debug tools (standalone HTML in `public/`, served at localhost:5173, not wired into the app)

- **`carve_tuner.html`** live-tunes the carve (base subtraction, lip, core, wall)
  over `face2.png` and prints em-relative values to paste back. Keep it.
- **`layer_debug.html`** renders the real Face 1 (carved name + resume/contact +
  warm edge) over a toggleable stone base (`face1/2/3.png`) with independent
  leaves/vines overlays and stacking order. Use to compare base + foliage combos.

## Upcoming work: edge-roughening experiment (on `rough-edges`, NOT started)

Brief agreed with Paul, awaiting his go:
- Rough only the **left/right vertical sides** (free prism ends). **Top/bottom
  stay clean** (shared folds; chipping doubles into two split lines).
- **Minimal**: a few subtle irregularities per side, not a chewed border.
- Must read as a **shadowed uneven edge, not real gaps** (no transparency, cannot
  leak the scene behind the drum).
- Planned method: SVG displacement filter (`feTurbulence` -> `feDisplacementMap`)
  on the vertical edges only.
- Switch to `rough-edges` before starting; keep general polish on `wind-waker`.

## Practicalities

- Dev server: `npm run dev` in `paulmartin.dev` (http://localhost:5173).
- Verify visually with Playwright screenshots. Write the script into the project
  dir (so `playwright` resolves from node_modules), then delete it.
- **Tests: 46 pre-existing failures on this WIP branch, unrelated to this work**
  (clue/reel/lock data out of sync with `model.js`, the GitHub -> Bluesky rename).
  This session added zero regressions, verified against a stashed baseline. Do not
  chase them.
- House rules: record current state only in code/comments (no rationale/history),
  commit only when asked, never create branches unasked, no em dashes in prose or
  commit messages.
