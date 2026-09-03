import './machine.css'

// Master switch for the chipped edges. Set to false to render every face as a
// clean rectangle (Face V keeps its own top-opening clip either way).
const ROUGHEN_EDGES = true

// Chipped vertical edges. The left/right free ends are cut with a thin, finely
// ragged alpha (a clip-path on the face), so the side silhouette is jagged and the
// jungle shows through the notches - fine on the sides. Top and bottom stay
// straight (the shared folds must not leak). The face's own inset edge shadow rides
// the cut, so no extra edge line is drawn. Every side of every face is seeded from
// its own key, so all ten edges are distinct and stable across reloads. Geometry is
// a 0..100 x 0..100 space stretched to the face; x is depth from the edge in
// percent. Tune here.
const EDGE = {
  segments: 64, // jag points down each side (high frequency: ragged everywhere)
  taper: 0.05, // fraction at each end kept straight, so the folds stay clean
  base: 0.1, // mean depth of the cut from the edge (shallow: barely bitten in)
  jitter: 0.24, // independent wobble of the cut, per point (low amplitude)
}

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Stable 32-bit hash of a key, so each edge's jag is deterministic and unique.
function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Depth eases to zero over `taper` at each end so the cut never bites the clean
// top/bottom folds.
function taperAt(f) {
  const t = EDGE.taper
  const e = f < t ? f / t : f > 1 - t ? (1 - f) / t : 1
  return e * e * (3 - 2 * e) // smoothstep
}

// The jagged cut line for one side, spanning the full height, as [depth, y] points.
function jagLine(key) {
  const rand = mulberry32(hash(key))
  const { segments, base, jitter } = EDGE
  const pts = []
  for (let i = 0; i <= segments; i++) {
    const f = i / segments
    const k = taperAt(f)
    const depth = Math.max(0, base * k + (rand() * 2 - 1) * jitter * k)
    pts.push([depth, f * 100])
  }
  return pts
}

// The silhouette clip: straight top and bottom, jagged left and right.
function clipPolygon(left, right) {
  const pts = [[0, 0], [100, 0]]
  for (const [d, y] of right) pts.push([100 - d, y])
  pts.push([0, 100])
  for (let i = left.length - 1; i >= 0; i--) pts.push([left[i][0], left[i][1]])
  return (
    'polygon(' +
    pts.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(', ') +
    ')'
  )
}

export default function FaceSurface({ children, className, style, ...rest }) {
  const classes = ['face-surface', className].filter(Boolean).join(' ')
  const key = rest['aria-label'] || className || 'face'

  // The clip rides the stone base only, never the content, so Face V's folding lid
  // (which projects to the full face width mid-swing) is never trimmed.
  const clip = ROUGHEN_EDGES
    ? clipPolygon(jagLine(`${key}:L`), jagLine(`${key}:R`))
    : undefined

  return (
    <section className={classes} style={style} {...rest}>
      <div className="face-surface__base" style={{ clipPath: clip }} />
      <div className="face-surface__content">{children}</div>
    </section>
  )
}
