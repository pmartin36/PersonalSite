---
feature: ancient-machine
task: b5-t1
agent: tdd-code-writer
updated: 2026-08-19
iteration: 1
---

## Implementation
FILES: [paulmartin.dev/src/machine/FaceSurface.jsx, paulmartin.dev/src/machine/machine.css, plans/ancient-machine-assets.md]
SUMMARY:
- FaceSurface.jsx: added a `useMemo`-scattered moss decal layer (7 decals, biased 60% to a bottom
  edge band / 40% to a top edge band, random left position, rotate -30..30deg, scale 0.5..1.1, one
  of the four existing `/machine/moss-*.png` images each) rendered as `<div className="face-surface__moss"
  aria-hidden="true">` alongside a new `<div className="face-surface__frame" aria-hidden="true">` for
  the brass corner trim. Signature (`{ children, className, ...rest }`) and the
  `.face-surface > .face-surface__content` structure are unchanged.
- machine.css: added `--m-sand-hi` / `--m-mortar` tokens (additive, all seven original `--m-*`
  tokens untouched); rebuilt `.face-surface` as procedural stone (SVG `feTurbulence` grain layer +
  layered warm gradients + bevel box-shadow pair + thicker brass border); added `.face-surface__frame`
  (four brass corner studs via multiple radial-gradient backgrounds, one element instead of the
  blueprint's `::before/::after` + frame split — same visual result, fewer moving parts) and
  `.face-surface__moss` / `.face-surface__moss-decal` (absolute, `pointer-events: none`, sized/
  positioned per-decal via inline style from the JS scatter).
- plans/ancient-machine-assets.md (new, gitignored local doc per repo convention): documents the
  existing moss-1..4.png set (768x768, transparent, generation recipe + prompt) and sandstone-ref.png
  as palette reference only, plus the optional seamless-hero-tile / grime-overlay fallbacks and the
  pre-release cleanup flag for raw reference PNGs in public/machine/.

MAPS_TO_BLUEPRINT: FaceSurface.jsx and machine.css interfaces honored as specified (additive tokens,
new selectors, unchanged FaceSurface signature). One deliberate simplification from the blueprint's
literal wording, see DEVIATIONS.

DEVIATIONS:
- Corner studs: blueprint said `.face-surface::before/::after` + a `.face-surface__frame` element
  (implying pseudo-elements AND a frame element). Implemented as a single `.face-surface__frame`
  element carrying all four corner studs via four background radial-gradients, no pseudo-elements.
  Same visual result (four aged-brass studs), simpler DOM/CSS, no test or contract depends on the
  pseudo-element mechanism.
- Grain rendering bug found and fixed during verification: the blueprint's `feTurbulence` data-URI
  approach silently rendered as nothing when combined with `background-blend-mode: overlay` in
  Chromium, and separately needed an explicit `width`/`height` on the root `<svg>` (percentages in
  `feColorMatrix`/`rect` resolve against nothing without it). Fixed by adding `width='200' height='200'`
  to the SVG and changing the grain layer's blend mode from `overlay` to `normal` (the mortar radial
  gradients keep `multiply`). Verified with an isolated Playwright harness before and after the fix —
  grain was invisible before, correctly visible (fine even grit, non-tiling-obvious) after.
REUSED: existing four `/public/machine/moss-*.png` decals (no new art generated); existing seven
`--m-*` tokens (extended, not forked); existing FaceSurface signature and section/content structure.

## Expected result
TESTS: paulmartin.dev/src/machine/Clue.test.jsx — `FaceSurface > marks the decorative moss layer
aria-hidden so it never enters the accessible tree` (was RED, now passes); full suite 114/114 passing
(was 113 passing + 1 red).
BUILD: `npm run build` (paulmartin.dev) succeeds.

## Behavioral verification (screenshots, since this task is BEHAVIORAL and most of it is
TEST_RECOMMENDATION: skip visual styling)
- `npx vitest run src/machine/Clue.test.jsx` (paulmartin.dev root): 13/13 pass, including the new
  aria-hidden assertion.
- Full suite: `./node_modules/.bin/vitest run`: 12 files, 114/114 pass.
- `npm run build`: succeeds, no CSS/JS errors.
- Visual: built the app, served with `vite preview`, drove it with a headless Playwright browser.
  The live Face I panel through the machine's 3D scene renders far larger than the viewport (existing
  scene-scale behavior from earlier tasks, not touched here), so a direct in-scene screenshot only
  ever showed the panel's flat middle. To see the full panel edge-to-edge, detached the live
  `.face-surface` node into an isolated fixed-size container (same computed CSS, no scene transform)
  and screenshotted it: confirmed fine grit grain, top-left highlight / bottom-right ochre gradient,
  chiseled bevel, four brass corner studs, and moss decals clustered along the top and (heavier)
  bottom edge bands — all clipped within the panel bounds (`overflow: hidden` holding), page content
  (heading, "resume" link, "Contact" button) fully legible and unobstructed on top.
