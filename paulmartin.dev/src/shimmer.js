// Shared galaxy-nebula palette for every shimmer fleck and the maze wake, so the whole site
// pulls from one place. Deep blue through violet to a restrained (deep, not hot) magenta: the
// saturation and lightness ease DOWN toward the magenta end, so the pinks read deep rather than
// vivid, while the blues and violets stay rich.
//
// u is a 0..1 position along the spectrum. Returns an hsla() string at the given alpha.
export function nebulaColor(u, alpha, opts) {
  u = u < 0 ? 0 : u > 1 ? 1 : u
  const sat = (opts && opts.sat) || 80
  const li = (opts && opts.li) || 62
  // skew hard toward the blue/violet end, so most flecks are deep blue-purple and magenta only
  // shows up at the very top of the range (and lands dark and desaturated when it does)
  const uu = Math.pow(u, 1.7)
  const h = 220 + uu * 92              // 220 blue -> ~266 violet (uu~0.5) -> ~312 magenta (rare)
  const p = Math.max(0, (uu - 0.5) / 0.5) // magenta ramp only past the violets
  const s = sat - 32 * p
  const l = li - 22 * p
  return `hsla(${h.toFixed(0)}, ${s.toFixed(0)}%, ${l.toFixed(0)}%, ${(+alpha).toFixed(3)})`
}
