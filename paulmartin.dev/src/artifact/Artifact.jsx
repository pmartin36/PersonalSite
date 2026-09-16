import { useEffect, useRef } from 'react'
import { LAYERS, DEFAULT_CONFIG, ORBIT_CENTER } from './artifactLayers.js'
import './artifact.css'

const BASE = '/artifact'
const TAU = Math.PI * 2
// Radial-mode comet ring: a crisp leading edge (percent of the artifact); the
// trailing fade length is tunable via config.glowTail.
const RADIAL_LEAD = 6

// Per orbiting gear: its radial vector from the gem centre (fractions of canvas)
// and which speed/radius group it belongs to. Used to move it in/out along that
// vector by the group's radius scale.
const ORBIT_META = {}
for (const l of LAYERS) {
  if (l.kind === 'orbit') {
    ORBIT_META[l.slug] = {
      vx: l.center[0] - ORBIT_CENTER[0],
      vy: l.center[1] - ORBIT_CENTER[1],
      group: l.speed,
    }
  }
}

// The animated artifact: the PSD's layers stacked in order, with gears spinning
// and orbiting, the blue elements shimmering under a shared scrolling perlin
// field, and the glows breathing in sync. All motion is driven by one rAF loop
// reading the live config, so the tuning sliders take effect without restarting.
export default function Artifact({ config = DEFAULT_CONFIG, className = '', centerHover = false }) {
  const cfgRef = useRef(config)
  cfgRef.current = { ...DEFAULT_CONFIG, ...config }

  const rootRef = useRef(null)
  const widthRef = useRef(0)
  // Animated nodes, keyed by slug (plus the flat perlin list).
  const spin = useRef({}).current // slug -> img (local spin)
  const orbit = useRef({}).current // slug -> wrapper (revolve)
  const glow = useRef({}).current // slug -> { el, base }
  const perlin = useRef({}).current // slug -> div

  useEffect(() => {
    const el = rootRef.current
    if (!el) return undefined
    const ro = new ResizeObserver(() => {
      widthRef.current = el.clientWidth
    })
    ro.observe(el)
    widthRef.current = el.clientWidth

    let raf
    let start = null
    const loop = (t) => {
      if (start == null) start = t
      const sec = (t - start) / 1000
      const c = cfgRef.current
      const W = widthRef.current || 1

      // Local spins. Orbiting gears also translate radially (from the gem centre)
      // by their group's radius scale, so the slider moves them closer/farther.
      for (const slug in spin) {
        const rate = slug === 'gear_03' ? c.centralSpin : gearSpinRate(slug, c)
        const meta = ORBIT_META[slug]
        if (meta) {
          const scale = (meta.group === 'central' ? c.centralRadius : c.foreRadius) ?? 1
          const dx = (scale - 1) * meta.vx * W
          const dy = (scale - 1) * meta.vy * W
          spin[slug].style.transform = `translate(${dx}px, ${dy}px) rotate(${rate * sec}deg)`
        } else {
          spin[slug].style.transform = `rotate(${rate * sec}deg)`
        }
      }
      // Orbits (the wrapper revolves about the gem centre).
      for (const slug in orbit) {
        const rate = slug === 'gear_03' ? c.centralOrbit : c.foreOrbit
        orbit[slug].style.transform = `rotate(${rate * sec}deg)`
      }
      // Glows, all in phase.
      const period = Math.max(0.05, c.glowPeriod)
      const gain = c.glowGain ?? 1
      const filter = gain > 1 ? `brightness(${gain}) saturate(${gain})` : 'none'
      const gmax = c.glowMax || {}
      const mode = c.glowMode || 'whole'
      const cx = ORBIT_CENTER[0] * 100
      const cy = ORBIT_CENTER[1] * 100
      // whole: sine opacity pulse, peaking at max at mid-period. radial: a sawtooth
      // ramp (0 -> 1, snap back to 0) drives a soft ring that travels out/in and
      // repeats - the ring exits the far edge as the next enters at centre.
      const sSin = 0.5 - 0.5 * Math.cos((TAU * sec) / period)
      const sSaw = ((sec / period) % 1 + 1) % 1
      const lead = RADIAL_LEAD // crisp wavefront, percent
      const tail = c.glowTail ?? 35 // long soft trailing fade, percent
      const span = 100 + lead + tail
      const clamp = (v) => Math.min(180, Math.max(0, v))
      const constant = c.glowConstant || {}
      const gmin = c.glowMin || {}
      for (const slug in glow) {
        const el = glow[slug].el
        const max = gmax[slug] ?? 1
        const floor = gmin[slug] ?? 0.5 // this glow's constant base, fraction of max
        el.style.filter = filter
        if (constant[slug]) {
          // Held steady at max: no pulse, no radial mask.
          el.style.opacity = String(glow[slug].base * max)
          if (el.style.maskImage || el.style.webkitMaskImage) {
            el.style.maskImage = ''
            el.style.webkitMaskImage = ''
          }
        } else if (mode === 'whole') {
          // Opacity pulse from this glow's floor up to max.
          el.style.opacity = String(glow[slug].base * max * (floor + (1 - floor) * sSin))
          if (el.style.maskImage || el.style.webkitMaskImage) {
            el.style.maskImage = ''
            el.style.webkitMaskImage = ''
          }
        } else {
          el.style.opacity = String(glow[slug].base * max)
          // A comet ring: a crisp wavefront with a long trailing fade behind it,
          // sweeping out (front leads outward, tail trails toward centre) or in
          // (front leads inward, tail trails outward). Swept far enough that the
          // tail fully clears the edge before the sawtooth snaps back.
          let s0, s1, s2
          if (mode === 'in') {
            const F = 100 + lead - sSaw * span // front: edge -> centre
            s0 = clamp(F - lead)
            s1 = clamp(F)
            s2 = clamp(F + tail)
          } else {
            const F = -lead + sSaw * span // front: centre -> edge
            s0 = clamp(F - tail)
            s1 = clamp(F)
            s2 = clamp(F + lead)
          }
          // This glow's floor shows everywhere; the wavefront brightens to full and
          // ramps back down to the floor along the tail, so the glow is a constant
          // base with the radial pulse added on top of it.
          const fa = `rgba(255,255,255,${floor})`
          const m = `radial-gradient(circle at ${cx}% ${cy}%, ${fa} ${s0}%, #fff ${s1}%, ${fa} ${s2}%)`
          el.style.maskImage = m
          el.style.webkitMaskImage = m
        }
      }
      // Perlin: shared scrolling field. Tile size and scroll are in px derived
      // from the current render width, so it stays consistent when resized.
      const tile = (W * c.perlinScale) / 100
      const off = ((c.perlinSpeed / 100) * tile * sec) % tile
      for (const slug in perlin) {
        const p = perlin[slug]
        p.style.backgroundSize = `${tile}px ${tile}px`
        p.style.backgroundPosition = `${-off}px ${-off}px`
        p.style.opacity = String(c.perlinOpacity)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className={`artifact ${className}`.trim()}
      data-center-hover={centerHover ? '' : undefined}
      aria-hidden="true"
    >
      {LAYERS.map((layer) => {
        const src = `${BASE}/${layer.slug}.png`
        const origin = layer.center
          ? `${layer.center[0] * 100}% ${layer.center[1] * 100}%`
          : undefined

        if (layer.kind === 'orbit') {
          return (
            <div
              key={layer.slug}
              className="artifact__orbit"
              data-slug={layer.slug}
              style={{ transformOrigin: `${ORBIT_CENTER[0] * 100}% ${ORBIT_CENTER[1] * 100}%` }}
              ref={(el) => {
                if (el) orbit[layer.slug] = el
                else delete orbit[layer.slug]
              }}
            >
              <img
                className="artifact__layer"
                src={src}
                alt=""
                draggable="false"
                style={{ transformOrigin: origin }}
                ref={(el) => {
                  if (el) spin[layer.slug] = el
                  else delete spin[layer.slug]
                }}
              />
            </div>
          )
        }

        if (layer.kind === 'spin') {
          return (
            <img
              key={layer.slug}
              className="artifact__layer"
              data-slug={layer.slug}
              src={src}
              alt=""
              draggable="false"
              style={{ transformOrigin: origin }}
              ref={(el) => {
                if (el) spin[layer.slug] = el
                else delete spin[layer.slug]
              }}
            />
          )
        }

        if (layer.kind === 'glow') {
          const base = layer.base ?? 1
          return (
            <img
              key={layer.slug}
              className="artifact__layer artifact__glow"
              data-slug={layer.slug}
              src={src}
              alt=""
              draggable="false"
              style={{ opacity: base }}
              ref={(el) => {
                if (el) glow[layer.slug] = { el, base }
                else delete glow[layer.slug]
              }}
            />
          )
        }

        if (layer.kind === 'blue') {
          return (
            <div key={layer.slug} className="artifact__blue-wrap" data-slug={layer.slug}>
              <img className="artifact__layer" src={src} alt="" draggable="false" />
              <div
                className="artifact__perlin"
                style={{
                  maskImage: `url(${src})`,
                  WebkitMaskImage: `url(${src})`,
                }}
                ref={(el) => {
                  if (el) perlin[layer.slug] = el
                  else delete perlin[layer.slug]
                }}
              />
            </div>
          )
        }

        // static
        return (
          <img
            key={layer.slug}
            className="artifact__layer"
            data-slug={layer.slug}
            src={src}
            alt=""
            draggable="false"
            style={{ opacity: layer.opacity ?? 1 }}
          />
        )
      })}
    </div>
  )
}

// Back gears (the small ones plus the big back plate) share one local-spin rate.
function gearSpinRate(slug, c) {
  if (slug === 'gear_01' || slug === 'gear_02') return c.foreSpin
  return c.backSpin
}
