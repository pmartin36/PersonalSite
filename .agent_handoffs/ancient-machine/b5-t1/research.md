---
feature: ancient-machine
task: b5-t1
agent: tdd-research
updated: 2026-08-19
iteration: 1
---

## Mode
ADVERSARIAL (assumptions were provided)

## Verdict on assumptions
VALIDATED (with two grounded notes, no refutation)
- "Procedural sandstone (SVG feTurbulence + warm gradients + CSS bevel/inset shadows) holds the
  stylized art direction; no seamless stone image asset required": holds. The per-face target is a
  single chiseled stone SLAB (one panel), not a block-mortar wall, so grain + layered warm gradient +
  bevel is the right tool; feTurbulence gives grain, which is exactly what a single slab needs. The
  moss decals (already generated on disk, see below) carry the organic detail the spec says noise
  cannot. No hero stone tile needed for this pass.
- Reference grounding done on the real refs already on disk (spec "Assets > Flow" said generate first,
  skin last — the pre-gen already happened): paulmartin.dev/public/machine/sandstone-ref.png
  (768x768 RGB, opaque) is a warm buff/ochre stylized stone with near-white top highlights, ochre
  mortar shadows, deep brown crevices — matches the token palette. moss-1..4.png (768x768 RGBA,
  verified corner alpha=0 transparent, center opaque green) are stylized moss clumps, yellow-green to
  deep green, ready as scatter decals. So the "placeholder decals" the task names already EXIST; this
  task scatters them, it does not block on generation.
- Flag (kept as escape hatch, not built): if per-face slabs read flat once assembled, the OPTIONAL
  seamless sandstone hero tile is the fallback (sandstone-ref.png is on disk but is NOT seamless-
  tileable as-is). Documented as optional in the asset handoff; not required now.

## Blueprint
APPROACH:
Skin the ONE shared primitive so every face inherits with zero per-face edits. All six faces wrap
`FaceSurface` (verified: FaceI..FaceV each `import FaceSurface` and render `<FaceSurface aria-label
=...>` — grep, 5/5). So the entire skin lands in exactly two files: machine.css (`.face-surface`
grain/gradient/bevel/brass frame/corner studs) and FaceSurface.jsx (the code-scattered moss decal
layer). No face file, no per-face CSS is touched. Plus the asset-prompt handoff doc.

1. machine.css — `.face-surface` procedural stone (all layers on the OUTER panel, behind content):
   - Grain: a single SVG `feTurbulence` as a data-URI `background-image` layer (baseFrequency ~0.9,
     numOctaves 2, low-alpha, mix-blend or low opacity so it reads as fine grit, not static).
     Resolution-independent, zero JS, inherited by every panel.
   - Weathering/grime: layered warm gradients stacked under the grain — a top-lit linear highlight
     (sand-highlight -> sandstone), plus radial ochre grime pooled in the lower corners. Uses tokens.
   - Chiseled edges: replace the current flat inset shadow with a bevel pair — inset highlight on the
     top/left (new `--m-sand-hi`) + inset deep crevice on bottom/right (`--m-crevice`) + a soft outer
     drop shadow. Slightly thicker brass frame border (`--m-brass`).
   - Shared mechanism trim (panel-level only, NOT per-face tiles/reels): four aged-brass corner
     studs/brackets via `.face-surface::before/::after` + a `.face-surface__frame` element, using
     `--m-brass` with a metallic inset-shadow highlight. (Per-face studs/reels/arrows stay owned by
     the face tasks; this is only the frame.)
   - Tokens: KEEP all seven existing `--m-*` names (all are referenced across MachineShell.css and the
     five face CSS files — grep confirms sandstone 9, brass 15, crevice 11, ochre 6, buff 4, accent 2,
     moss 1; removing/renaming any breaks faces). Tune values gently toward the reference and ADD:
     `--m-sand-hi` (top highlight ~#e7dcc0), `--m-mortar` (mid shadow ~#8a6a3c). Additive only.
   - `.face-surface__moss` layer: absolutely positioned, `inset:0`, `pointer-events:none`, above the
     stone but the individual decals are placed by JS; CSS gives each `.face-surface__moss-decal`
     `position:absolute; background-size:contain; background-repeat:no-repeat; opacity ~0.9`.
   - `@media (prefers-reduced-motion)`: skin is static anyway (no animation added), so nothing special
     needed; do NOT add motion here.

2. FaceSurface.jsx — code-scattered moss (the one thing that needs JS "random rotation/scale"):
   - Module-level `const MOSS = ['/machine/moss-1.png','/machine/moss-2.png','/machine/moss-3.png',
     '/machine/moss-4.png']` (public assets served at web root by Vite).
   - `useMemo(() => scatter(), [])` builds a stable-per-instance array of ~6-8 decals, each
     `{ img, topPct, leftPct, rotateDeg, scale }` biased to the seams + lower edge (spec: "along the
     seams and lower edges"): sample positions in edge bands (top band, bottom band, and a heavier
     bottom concentration), random rotate (-30..30deg), random scale (0.5..1.1), random img from MOSS.
     `useMemo([])` so it does not re-randomize on every re-render but is fresh per face instance.
   - Render an extra `<div className="face-surface__moss" aria-hidden="true">` sibling of the content
     slot, mapping decals to `<span className="face-surface__moss-decal" style={{ backgroundImage:
     url(img), top, left, transform: rotate()+scale() }} />`. aria-hidden + pointer-events:none so the
     skin never leaks into the accessibility tree or blocks clicks (protects b5-t2's keyboard/a11y
     proof).
   - Keep the existing signature/behavior intact: still `<section className="face-surface ..."
     {...rest}>` with `.face-surface__content` wrapping children, className/rest pass-through
     unchanged (Clue.test.jsx and every face depend on that contract).

3. plans/ancient-machine-assets.md (new) — the asset-prompt handoff:
   - Target dir: paulmartin.dev/public/machine/.
   - GENERATED (present on disk): moss decal set moss-1..4.png — dimensions 768x768, transparent: YES
     (RGBA, rembg-keyed), tileable: NO (subject-isolated clumps), style/lighting: single stylized-
     illustration prompt, one consistent top-left key light, saturated yellow-green->deep green,
     generated on a solid vivid chroma-key GREEN background then rembg -> alpha (per spec "Tooling").
     Record the positive/negative prompt template + the local recipe (stable-diffusion.cpp + Z-Image
     Turbo, cfg 1.0 / 8 steps, img2img for cheap variations; see creature_lab/generate.sh) so more
     clumps can be minted consistently.
   - OPTIONAL (not generated, flagged): (a) sandstone hero tile — only if procedural stone reads flat;
     would need SEAMLESS tiling (sandstone-ref.png on disk is 768x768 opaque but NOT seamless), Nano
     Banana is the art-directed upgrade path. (b) edge-wear/grime overlay PNG for panel corners —
     transparent, non-tiling, optional; procedural grime currently covers this.
   - Note residual cleanup: sandstone-ref.png / the raw refs currently live in public/machine/ and ship
     in the build; flag (do not fix here) that any unused ref should be pruned before release.

INTERFACES:
- FaceSurface.jsx: signature UNCHANGED — `export default function FaceSurface({ children, className,
  ...rest })`. Internally adds the aria-hidden moss layer. No prop/API change (no downstream edits).
- machine.css: additive tokens `--m-sand-hi`, `--m-mortar`; new selectors `.face-surface__frame`,
  `.face-surface__moss`, `.face-surface__moss-decal`, `.face-surface::before/::after`. Existing
  `.face-surface` / `.face-surface__content` rules extended, not renamed.

DATA_FLOW:
Static: machine.css paints grain+gradient+bevel+brass frame on every `.face-surface`. Per instance:
FaceSurface's `useMemo` picks moss images from the public set and random transforms, rendering the
decal layer. No props flow in; the skin is inherited purely by every face wrapping FaceSurface.

FILES_NEW:
- plans/ancient-machine-assets.md
FILES_EDIT:
- paulmartin.dev/src/machine/FaceSurface.jsx   # add aria-hidden moss scatter layer (useMemo), keep API
- paulmartin.dev/src/machine/machine.css       # .face-surface grain/gradient/bevel/brass frame/studs
                                                #   + moss decal rules + additive tokens

## Duplicate / reuse check
EXISTING:
- Moss decals ALREADY EXIST: paulmartin.dev/public/machine/moss-1..4.png (768x768 RGBA, transparent
  verified). REUSE them; do NOT regenerate or invent new placeholder art. The asset doc documents the
  existing set + its recipe, it is not a from-scratch prompt.
- sandstone-ref.png (public/machine/) is the grounding reference for the palette; not shipped as a
  face texture (stone stays procedural). Document as optional-hero-tile source only.
- No existing procedural-texture / SVG-filter / noise util anywhere in src (grep: zero feTurbulence,
  zero `<filter>`; the "noise" hits in audio.jsx are WebAudio, in DetailModal.css/index.css are
  unrelated `backdrop-filter`/comment text). Net-new styling; nothing to fold into.
- All seven `--m-*` tokens defined in machine.css:1-9 (b1-t1) are the single palette source, consumed
  by every face CSS. Extend/tune in place; do not fork a second palette.
CLEANLINESS:
- "One place" ownership, enumerated: the stone skin has exactly ONE owner, `.face-surface` /
  FaceSurface.jsx. Every current construction site that must inherit it = the six face wrappers:
  FaceI.jsx:13, FaceII.jsx:84, FaceIII.jsx:119, FaceIV.jsx:110, FaceV.jsx:91 (all `<FaceSurface>`).
  Disposition: ALL route through FaceSurface (grep 5/5); none construct a stone panel independently,
  so none can bypass the skin. No new call site is introduced; enforcement is structural (a face gets
  the skin by wrapping FaceSurface, the only stone primitive).
- Faces set their OWN inner backgrounds on mechanism surfaces (FaceI.css:32, FaceII/III/IV/V *.css
  set `--m-sandstone`/`--m-crevice` on cards/reels/tiles/slate that fill `.face-surface__content`).
  That is BY DESIGN, not a bypass: the shared skin owns the panel FRAME, edges, grain and moss seams;
  the inner mechanism surfaces sit on top. Code-writer must NOT try to force grain through inner face
  content, and must keep the moss/frame layers from covering interactive content (moss = pointer-
  events:none, edge-biased; frame = border/corners only).
- Namespacing preserved: machine tokens stay `--m-*`, never touch index.css galaxy tokens.

## Test surface (feed-forward to test-writer)
PUBLIC_SURFACE:
- FaceSurface still renders children inside `.face-surface__content` within a `.face-surface` panel and
  passes through className/rest (UNCHANGED contract — Clue.test.jsx:65-73 and all faces rely on it).
- The moss/frame decoration is aria-hidden and pointer-events:none: it adds NO accessible text and
  intercepts NO clicks (this is the load-bearing behavioral guarantee for b5-t2's keyboard/a11y solve).
- Visual: weathered stone grain + chiseled bevel + brass frame + moss along seams/lower edge (=
  screenshot evidence, per the task's BEHAVIORAL flag; before/after vs the flat placeholder).
SUGGESTED_TESTS: none-recommended for the visual skin itself (pure styling, per TEST_RECOMMENDATION
skip; verified by before/after screenshots).
  One CHEAP optional guard worth adding since it protects a real downstream contract (b5-t2 a11y), not
  the pixels: assert the decorative moss layer is present but aria-hidden and adds no accessible text
  (e.g. `container.querySelector('.face-surface__moss')` has `aria-hidden="true"`, and FaceSurface's
  accessible content is unchanged). Leave to test-writer's judgment; not required by the DELIVERABLE.
Behavioral evidence for the validator: before/after screenshots of a face (flat placeholder vs
skinned stone + moss along seams), and confirm the asset-prompt handoff file exists and lists each
asset's dimensions / tileable / transparent / style-lighting spec.

## Provenance
- FaceSurface signature + structure (`<section.face-surface><div.face-surface__content>`), the seven
  `--m-*` token names/values, and machine.css layout: originally from b1-t1/research.md; RE-VERIFIED
  by reading the current files this task edits — FaceSurface.jsx (11 lines) and machine.css (57 lines)
  at their present state, plus MachineShell.css and all five face CSS files for token usage. This task
  CHANGES both edited files, so nothing about them was taken on trust.
- Moss/sandstone asset facts (count, 768x768, transparent alpha) VERIFIED directly: PNG dimensions via
  file(1) and a hand-rolled PNG unfilter reading corner alpha=0 / center opaque on moss-1.png.
- Palette grounding VERIFIED by viewing sandstone-ref.png and moss-1.png this run (real references,
  per the global "design research on real references" rule).

## Notes to orchestrator
- No file-size risk: machine.css 57 -> ~180 lines, FaceSurface.jsx 11 -> ~55 lines, both far under the
  1000-line default limit. No split needed.
- No DEFECTS register change: the only out-of-scope smell (raw reference PNGs shipping in public/) is
  noted inside the asset handoff doc as a pre-release prune, not a code defect an owning task must fix.

STATUS: IMPLEMENT
