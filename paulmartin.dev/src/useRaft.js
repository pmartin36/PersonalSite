import { useEffect, useRef } from 'react'

// A card is a raft floating on the water (the maze field). The cursor is a weight pressing down
// where it sits: torque is force times distance from center, so a corner (farthest out on both
// axes) dips hardest, the middle of a side tilts about one axis only, and dead center is pure
// heave. Rendered with perspective, so the dipping corner foreshortens and rides lower. Motion
// is a spring-damper, not a snap, so it eases toward the weighted pose and, on release, bobs
// back and settles. Even untouched it keeps a barely-there idle drift.
//
// As the raft rocks, each corner's "height" changes; a corner moving sheds a ripple into the
// water at its screen position, through the same seedAt the maze uses. That is why ripples come
// mostly from the corners.
//
// The pose is applied to the element the ref is on; pointer hit-testing uses that element's
// PARENT, which never carries the 3D tilt. Listening on the tilting element itself makes the
// pointer cross its own moving edge and flicker enter/leave, so the stable parent is the hit box.

const q = new URLSearchParams(window.location.search)
const num = (k, d) => {
  const v = q.get(k)
  return v !== null && v !== '' && !Number.isNaN(+v) ? +v : d
}

// Feel, all query-overridable (e.g. ?raftTilt=8&raftPersp=1200) so it tunes live.
const TUNE = {
  tilt: num('raftTilt', 4.5),      // degrees of tilt at a corner, per axis
  persp: num('raftPersp', 1250),   // perspective px; smaller = more dramatic skew
  heave: num('raftHeave', 9),      // px the whole raft sinks (translateZ back) under load
  stiff: num('raftStiff', 130),    // spring stiffness toward the target pose
  damp: num('raftDamp', 13),       // damping; lower = more bob on release
  idle: num('raftIdle', 0.4),      // idle drift amplitude, degrees
  idleHz: num('raftIdleHz', 0.05), // idle drift frequency (cycles/sec) — slow
  rip: num('raftRip', 1),           // shed ripples on/off
  ripGap: num('raftRipGap', 64),    // px of cursor travel between ripples (single source)
  ripSpd: num('raftRipSpd', 0.9),   // how fast a ripple spreads outward (slower = gentler)
  ripLife: num('raftRipLife', 92),  // how long a ripple lives (longer = travels further)
  ripSpread: num('raftRipSpread', 0.9), // wedge half-angle; smaller = flatter, more directional
  ripR0: num('raftRipR0', 62),      // starting radius: the ripple begins as a bigger ring
  ripPeak: num('raftRipPeak', 0.5), // opacity ceiling: softer as it expands
}

const TAU = Math.PI * 2
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)

// seedRef is the maze pointer api ref ({ current: { seedAt } }). opts.idlePhase staggers rafts.
export function useRaft(seedRef, opts = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // stable hit box: the parent does not tilt, so the pointer never crosses its own moving edge
    const hit = el.parentElement || el

    let ax = 0, ay = 0, vx = 0, vy = 0 // current tilt (deg) and angular velocity
    let tx = 0, ty = 0                 // pointer-driven target tilt (deg)
    let engaged = 0, heave = 0         // pointer presence and eased heave, 0..1
    const phase = opts.idlePhase ?? Math.random() * TAU
    let lastRipX = NaN, lastRipY = NaN, ripAcc = 0 // ripple source tracking

    const aim = (clientX, clientY) => {
      const r = hit.getBoundingClientRect()
      const nx = clamp((clientX - (r.left + r.width / 2)) / (r.width / 2), -1, 1)
      const ny = clamp((clientY - (r.top + r.height / 2)) / (r.height / 2), -1, 1)
      // the point under the cursor dips: cursor high (ny<0) tips the top edge down/back, so
      // rotateX follows -ny; cursor right (nx>0) tips the right edge down/back via rotateY.
      tx = -ny * TUNE.tilt
      ty = nx * TUNE.tilt
      engaged = 1

      // Shed a ripple from where the cursor actually is as it moves around the raft: a single
      // source (mostly at the corners, since that is where you touch the edge), not one per
      // corner. The wave flares OUTWARD, away from the raft's center through the touch point,
      // like water pushed off the edge you stepped on — flat and directional, not a radial ring.
      // Distance-gated so density is speed-independent, and slow so it spreads gently.
      if (TUNE.rip && seedRef && seedRef.current && seedRef.current.seedAt) {
        if (Number.isNaN(lastRipX)) { lastRipX = clientX; lastRipY = clientY }
        ripAcc += Math.hypot(clientX - lastRipX, clientY - lastRipY)
        lastRipX = clientX; lastRipY = clientY
        if (ripAcc >= TUNE.ripGap) {
          ripAcc = 0
          const out = Math.atan2(clientY - (r.top + r.height / 2), clientX - (r.left + r.width / 2))
          seedRef.current.seedAt(clientX, clientY, {
            dir: out - Math.PI, spd: TUNE.ripSpd, life: TUNE.ripLife, spread: TUNE.ripSpread,
            r0: TUNE.ripR0, peak: TUNE.ripPeak,
          })
        }
      }
    }
    const release = () => { tx = 0; ty = 0; engaged = 0; lastRipX = NaN; lastRipY = NaN }

    // pointermove covers hover (mouse) and drag (touch). On touch we do not preventDefault, so a
    // gesture that becomes a scroll still scrolls; the raft just rocks toward the touch.
    const onMove = (e) => aim(e.clientX, e.clientY)
    const onDown = (e) => aim(e.clientX, e.clientY)
    hit.addEventListener('pointermove', onMove)
    hit.addEventListener('pointerenter', onMove)
    hit.addEventListener('pointerdown', onDown)
    hit.addEventListener('pointerleave', release)
    hit.addEventListener('pointerup', release)
    hit.addEventListener('pointercancel', release)

    let raf = 0, last = performance.now()
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      const t = now / 1000
      const driftX = Math.sin(t * TUNE.idleHz * TAU + phase) * TUNE.idle
      const driftY = Math.cos(t * TUNE.idleHz * TAU * 0.8 + phase * 1.7) * TUNE.idle
      const goalX = tx + driftX
      const goalY = ty + driftY

      // spring-damper toward the goal pose
      vx += ((goalX - ax) * TUNE.stiff - vx * TUNE.damp) * dt
      vy += ((goalY - ay) * TUNE.stiff - vy * TUNE.damp) * dt
      ax += vx * dt
      ay += vy * dt

      heave += (engaged - heave) * clamp(dt * 6, 0, 1)
      const z = -heave * TUNE.heave
      el.style.transform =
        `perspective(${TUNE.persp}px) rotateX(${ax.toFixed(3)}deg) rotateY(${ay.toFixed(3)}deg) translateZ(${z.toFixed(2)}px)`

      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(raf)
      hit.removeEventListener('pointermove', onMove)
      hit.removeEventListener('pointerenter', onMove)
      hit.removeEventListener('pointerdown', onDown)
      hit.removeEventListener('pointerleave', release)
      hit.removeEventListener('pointerup', release)
      hit.removeEventListener('pointercancel', release)
      el.style.transform = ''
    }
  }, [seedRef, opts.idlePhase])

  return ref
}
