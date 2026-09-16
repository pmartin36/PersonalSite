// The Light_blue_float artifact, split into its PSD layers (exported full-canvas
// to /public/artifact so they stack in perfect alignment). Order is bottom to
// top, matching the PSD. `kind` drives the animation/effect:
//   static - just sits in the stack
//   spin   - rotates about its own centre (local spin only)
//   orbit  - revolves about the artifact centre AND spins about its own centre
//   blue   - carries the scrolling perlin shimmer (masked to its own shape)
//   glow   - opacity oscillates (synchronised across all glows)
// `center` is the layer's own centre as a fraction of the 889x889 canvas, used
// as the transform-origin for local spin. `speed` names which speed group an
// orbiting gear reads. `base` is a glow's resting opacity (from the PSD).
export const CANVAS = 889

// The point the gears orbit about: the gem's centre (the artifact's visual heart,
// slightly above the geometric canvas centre), as a fraction of the canvas.
export const ORBIT_CENTER = [0.4978, 0.4876]

export const LAYERS = [
  { slug: 'shadow', kind: 'static', opacity: 0.86 },
  { slug: 'ring_06', kind: 'static' },
  { slug: 'back_gear', kind: 'spin', center: [0.4989, 0.4843] },
  { slug: 'gear_08', kind: 'spin', center: [0.2801, 0.5816] },
  { slug: 'gear_07', kind: 'spin', center: [0.6434, 0.3217] },
  { slug: 'gear_06', kind: 'spin', center: [0.5416, 0.6997] },
  { slug: 'gear_05', kind: 'spin', center: [0.324, 0.4229] },
  { slug: 'gear_04', kind: 'spin', center: [0.3172, 0.2717] },
  { slug: 'radial_rays', kind: 'static' },
  // Stack order mirrors the PSD exactly: the rays and lines glows sit BELOW their
  // element, but the gem glow blooms ABOVE the gem (pushing it below the opaque
  // gem hid it).
  { slug: 'blue_rays_glow', kind: 'glow' },
  { slug: 'blue_rays', kind: 'blue' },
  { slug: 'ring_05', kind: 'static' },
  { slug: 'ring_04', kind: 'static' },
  { slug: 'blue_lines_glow', kind: 'glow' },
  { slug: 'blue_lines', kind: 'blue' },
  { slug: 'ring_03', kind: 'static' },
  { slug: 'ring_02', kind: 'static' },
  { slug: 'central_rings', kind: 'static' },
  { slug: 'central_gear', kind: 'static' },
  { slug: 'gear_03', kind: 'orbit', center: [0.6468, 0.4865], speed: 'central' },
  { slug: 'gem', kind: 'blue' },
  { slug: 'gem_glow', kind: 'glow' },
  { slug: 'gear_02', kind: 'orbit', center: [0.4989, 0.1614], speed: 'fore' },
  { slug: 'gear_01', kind: 'orbit', center: [0.7508, 0.7008], speed: 'fore' },
]

export const DEFAULT_CONFIG = {
  // gear speeds, degrees per second (negative = counter-clockwise)
  foreOrbit: 20,
  foreSpin: 100,
  centralOrbit: -40,
  centralSpin: -80,
  backSpin: -6,
  // orbit radius scale for the orbiting gears (1 = the art's own distance from the
  // gem centre; <1 pulls them in toward the centre, >1 pushes them out)
  foreRadius: 1,
  centralRadius: 1,
  // glow oscillation. The pulse peaks at max (never overshoots) at mid-period and
  // troughs at max*glowMin at the ends; the period is independent of max.
  glowPeriod: 4, // seconds for one floor->peak->floor cycle
  // Per-glow floor: the constant base level each glow never drops below (a
  // fraction of its max). The pulse/radial wave rides from this floor up to max.
  glowMin: { blue_rays_glow: 0.25, blue_lines_glow: 0.25, gem_glow: 0.7 },
  glowGain: 3, // brightness/saturate boost so faint source glows can be pushed up
  // 'whole' pulses each glow's opacity uniformly; 'out'/'in' instead sweep a comet
  // ring from the gem centre outward / inward on a sawtooth ramp over the period.
  glowMode: 'whole',
  glowTail: 14, // radial-mode trailing fade length, percent (0 = crisp both edges)
  // Per-glow-layer max opacity (a debug/tuning multiplier on each glow, keyed by
  // slug). 1 = the layer's own strength; set others to 0 to isolate one glow.
  // These map directly to each glow layer's opacity when baked into the asset.
  glowMax: { blue_rays_glow: 1, blue_lines_glow: 1, gem_glow: 0.7 },
  // Glows held constant at their max (skipping both the pulse and the radial
  // sweep), keyed by slug. Off by default; each glow floors at its glowMin instead.
  glowConstant: { blue_rays_glow: false, blue_lines_glow: false, gem_glow: false },
  // perlin shimmer (shared field, screen-blended white noise, scrolling TL->BR)
  perlinOpacity: 0.67,
  perlinScale: 24, // noise tile size as a percent of the artifact (smaller = finer)
  perlinSpeed: -7, // scroll speed, percent of tile per second
}
