import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import FaceSurface from '../FaceSurface.jsx'
import Clue, { DIRECTION_GLYPH } from '../Clue.jsx'
import { useAudio } from '../audio.jsx'
import { useMachine, faceIndex } from '../Machine.jsx'
import { SEQUENCE } from '../model.js'
import './FaceV.css'

// The pad's input alphabet, laid out as a single row: Left, Up, Right, Down.
// Guarded against DIRECTION_GLYPH so a typo throws rather than shipping a
// broken pad. This is the lock's input device, not a clue: no clue reads
// from it, and the lock validates presses against SEQUENCE, never this list.
const PAD_ORDER = ['Left', 'Up', 'Right', 'Down']
if (PAD_ORDER.slice().sort().join() !== Object.keys(DIRECTION_GLYPH).sort().join()) {
  throw new Error('FaceV: PAD_ORDER does not match DIRECTION_GLYPH directions')
}

// The keys carry a faceted ruby cut as a rounded triangle pointing in the key's
// direction: a flat central table with three sloping bevels. Each bevel is shaded
// by which way it faces under the fixed overhead light, so the upper facets catch
// the light and the lower one sits in shadow, the same for every direction.
const RUBY_ANGLE = { Up: 0, Right: 90, Down: 180, Left: 270 }

const vsub = (a, b) => [a[0] - b[0], a[1] - b[1]]
const vadd = (a, b) => [a[0] + b[0], a[1] + b[1]]
const vscale = (a, s) => [a[0] * s, a[1] * s]
const vnorm = (a) => {
  const l = Math.hypot(a[0], a[1]) || 1
  return [a[0] / l, a[1] / l]
}

function rotate(pt, deg, c = [50, 50]) {
  const r = (deg * Math.PI) / 180
  const d = vsub(pt, c)
  return [
    c[0] + d[0] * Math.cos(r) - d[1] * Math.sin(r),
    c[1] + d[0] * Math.sin(r) + d[1] * Math.cos(r),
  ]
}

const fmt = (pts) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`)
const poly = (pts) => 'M' + fmt(pts).join(' L') + ' Z'

// A polygon with its corners rounded to radius r (quadratic corners).
function roundedPoly(pts, r) {
  const n = pts.length
  let d = ''
  for (let i = 0; i < n; i++) {
    const cur = pts[i]
    const prev = pts[(i - 1 + n) % n]
    const next = pts[(i + 1) % n]
    const p1 = vadd(cur, vscale(vnorm(vsub(prev, cur)), r))
    const p2 = vadd(cur, vscale(vnorm(vsub(next, cur)), r))
    d += (i === 0 ? 'M' : 'L') + `${p1[0].toFixed(1)},${p1[1].toFixed(1)}`
    d += ` Q ${cur[0].toFixed(1)},${cur[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d + ' Z'
}

// Colour from a facet's brightness (0 shadow .. 1 lit), along a deep-red ramp: near
// black-red in shadow up to a rich (not pink) red where it catches the light.
function lerpColor(stops, b) {
  let lo = stops[0]
  let hi = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (b >= stops[i][0] && b <= stops[i + 1][0]) {
      lo = stops[i]
      hi = stops[i + 1]
      break
    }
  }
  const t = (b - lo[0]) / (hi[0] - lo[0] || 1)
  return lo[1].map((v, i) => Math.round(v + (hi[1][i] - v) * t))
}
const RUBY_RAMP = [
  [0, [30, 2, 10]],
  [0.5, [104, 12, 30]],
  [1, [188, 40, 58]],
]
const rubyTone = (b) => {
  const c = lerpColor(RUBY_RAMP, Math.max(0, Math.min(1, b)))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}
// Facet cut line: a dark groove where facets fold away from the light, a bright red
// glint where two lit facets meet at the top.
function edgeStroke(b) {
  const c = lerpColor(
    [
      [0, [20, 1, 8]],
      [1, [255, 150, 160]],
    ],
    Math.max(0, Math.min(1, b)),
  )
  return `rgba(${c[0]},${c[1]},${c[2]},${(0.3 + 0.35 * b).toFixed(2)})`
}

function RubyKey({ direction }) {
  const ang = RUBY_ANGLE[direction] ?? 0
  const outer = [
    [50, 15],
    [16, 81],
    [84, 81],
  ].map((p) => rotate(p, ang))
  const c = [
    (outer[0][0] + outer[1][0] + outer[2][0]) / 3,
    (outer[0][1] + outer[1][1] + outer[2][1]) / 3,
  ]
  // The flat table: each outer corner pulled ~40% toward the centre.
  const inner = outer.map((p) => vadd(p, vscale(vsub(c, p), 0.4)))
  const upness = (p) => -vnorm(vsub(p, c))[1] // -1 (bottom) .. 1 (top of screen)
  const edges = [
    [0, 1],
    [1, 2],
    [2, 0],
  ]
  const bevels = edges.map(([a, b]) => {
    const mid = [(outer[a][0] + outer[b][0]) / 2, (outer[a][1] + outer[b][1]) / 2]
    return { quad: [outer[a], outer[b], inner[b], inner[a]], bright: 0.5 + 0.5 * upness(mid) }
  })
  // A small hard glint on the table toward the top of the gem.
  const glint = [c[0], c[1] - 12]
  const rt = roundedPoly(outer, 11)
  const clip = `ruby-clip-${direction}`
  const table = `ruby-table-${direction}`
  return (
    <svg className="face5-key-ruby" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <path d={rt} />
        </clipPath>
        {/* Table, lit from above: rich red, deepening toward the bottom. */}
        <linearGradient id={table} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c73048" />
          <stop offset="0.5" stopColor="#7c1226" />
          <stop offset="1" stopColor="#340611" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${clip})`}>
        {bevels.map((bv, i) => (
          <path key={i} d={poly(bv.quad)} fill={rubyTone(bv.bright)} />
        ))}
        <path d={poly(inner)} fill={`url(#${table})`} />
        {/* Cut lines: the table outline and the spokes to the corners, each lit or
            shadowed by how it faces the overhead light. */}
        {edges.map(([a, b], i) => (
          <line
            key={`t${i}`}
            x1={inner[a][0]}
            y1={inner[a][1]}
            x2={inner[b][0]}
            y2={inner[b][1]}
            stroke={edgeStroke(0.5 + 0.5 * upness([(inner[a][0] + inner[b][0]) / 2, (inner[a][1] + inner[b][1]) / 2]))}
            strokeWidth="0.9"
          />
        ))}
        {outer.map((o, i) => (
          <line
            key={`s${i}`}
            x1={inner[i][0]}
            y1={inner[i][1]}
            x2={o[0]}
            y2={o[1]}
            stroke={edgeStroke(0.5 + 0.5 * upness(o))}
            strokeWidth="0.9"
          />
        ))}
        {/* Hard specular glint. */}
        <ellipse cx={glint[0]} cy={glint[1]} rx="4.5" ry="3" fill="rgba(255,235,238,0.9)" />
        <ellipse cx={glint[0]} cy={glint[1]} rx="9" ry="6" fill="rgba(255,210,215,0.28)" />
      </g>
      {/* The girdle: a dark rim, brighter along the top where the light grazes it. */}
      <path d={rt} fill="none" stroke="rgba(18,0,6,0.75)" strokeWidth="1.6" />
    </svg>
  )
}

// Toonified obsidian: flat near-black planes (a lit upper plane, a deeper lower
// one), the conchoidal fracture drawn as hard concentric ripple arcs radiating
// from a corner, and a stark sparkle where the overhead light catches the glass.
// No grain - obsidian is smooth volcanic glass. Flipped on alternate keys so the
// four don't read as identical.
function ObsidianFace({ flip }) {
  return (
    <svg
      className="face5-key-obsidian"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <rect width="100" height="100" fill="#0a0b11" />
      {/* The surface split into irregular fracture planes, all in the black/grey
          range: a lit cool-grey plane catching the overhead light up top (uneven
          lower break), then the lower area split by an off-centre slanted break
          into a deep plane and a mid-grey one. */}
      <path d="M0,0 L100,0 L100,24 L58,44 L24,34 L0,46 Z" fill="#232733" />
      <path d="M0,46 L24,34 L58,44 L44,100 L0,100 Z" fill="#0b0d13" />
      <path d="M58,44 L100,24 L100,100 L44,100 Z" fill="#14171f" />
      {/* Conchoidal ripples radiating from the top-left fracture origin. */}
      <g fill="none" stroke="#414a60" strokeLinecap="round">
        <path d="M-6,38 A 44 44 0 0 1 44 -6" strokeWidth="1.1" opacity="0.6" />
        <path d="M-6,56 A 62 62 0 0 1 62 -6" strokeWidth="1" opacity="0.42" />
        <path d="M-6,76 A 82 82 0 0 1 82 -6" strokeWidth="0.9" opacity="0.26" />
      </g>
      {/* A sharp glassy reflection streak. */}
      <path d="M22,-6 L31,-6 L18,106 L9,106 Z" fill="rgba(150,162,192,0.13)" />
    </svg>
  )
}

// A key holds its depressed state for at least this long, so a quick tap still
// sinks all the way down before it eases back up. Matches the down transition.
const KEY_DOWN_MS = 400

function ArrowPad({ onPress }) {
  const [pressed, setPressed] = useState({})
  const downAt = useRef({})
  const timers = useRef({})

  // Press: sink now, and keep it down until at least KEY_DOWN_MS has passed (a tap
  // completes the full sink), or until release if the key is held longer.
  function down(direction) {
    clearTimeout(timers.current[direction])
    downAt.current[direction] = performance.now()
    setPressed((p) => ({ ...p, [direction]: true }))
  }
  function up(direction) {
    if (!downAt.current[direction]) return
    const wait = Math.max(0, KEY_DOWN_MS - (performance.now() - downAt.current[direction]))
    downAt.current[direction] = 0
    clearTimeout(timers.current[direction])
    timers.current[direction] = setTimeout(
      () => setPressed((p) => ({ ...p, [direction]: false })),
      wait,
    )
  }

  useEffect(() => () => {
    Object.values(timers.current).forEach(clearTimeout)
  }, [])

  return (
    <div className="face5-pad">
      {PAD_ORDER.map((direction, i) => (
        <span key={direction} className="face5-pad__socket">
          <button
            type="button"
            className={
              'face5-pad__button' + (pressed[direction] ? ' is-pressed' : '')
            }
            data-direction={direction}
            aria-label={direction}
            onPointerDown={() => down(direction)}
            onPointerUp={() => up(direction)}
            onPointerLeave={() => up(direction)}
            onPointerCancel={() => up(direction)}
            onClick={() => onPress(direction)}
          >
            <ObsidianFace flip={i % 2 === 1} />
            <RubyKey direction={direction} />
          </button>
        </span>
      ))}
    </div>
  )
}

// The prize: a small drive blinking in its alcove. Clicking it ignites.
function Device({ onIgnite }) {
  return (
    <button
      type="button"
      className="face5-device"
      aria-label="Take the drive"
      onClick={onIgnite}
    >
      <span className="face5-device__cap" aria-hidden="true" />
      <span className="face5-device__body" aria-hidden="true">
        <span className="face5-device__led" />
      </span>
    </button>
  )
}

function Celebration() {
  return (
    <div className="face5-celebration">
      <h2 className="face5-celebration__title">What was that?!</h2>
      <p className="face5-celebration__lede">You've been knocked unconscious.</p>
      <p className="face5-celebration__body">
        If you've enjoyed this little puzzle portfolio, shoot me a message.
      </p>
      <p className="face5-celebration__cta">
        <a href="mailto:p@ulmartin.me?subject=I%20solved%20the%20puzzle%20box">
          p@ulmartin.me
        </a>
      </p>
    </div>
  )
}

// A one-wavelength vertical sine encoded in the red channel (green/blue held at
// 128 so there is no vertical push): displacing by it shifts each row of pixels
// left/right by the sine of its height, continuously, ignoring letter edges.
const SINE_MAP =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='64'%3E" +
  "%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E" +
  "%3Cstop offset='0' stop-color='%23808080'/%3E" +
  "%3Cstop offset='.25' stop-color='%23ff8080'/%3E" +
  "%3Cstop offset='.5' stop-color='%23808080'/%3E" +
  "%3Cstop offset='.75' stop-color='%23008080'/%3E" +
  "%3Cstop offset='1' stop-color='%23808080'/%3E" +
  "%3C/linearGradient%3E%3C/defs%3E" +
  "%3Crect width='8' height='64' fill='url(%23g)'/%3E%3C/svg%3E"

// The full-screen ignition: a white flash bursts from the drive and fills the
// screen, fades to black, then the solved message and Wake up.
function Ignition({ origin, onWake, waking }) {
  return createPortal(
    <div
      className={`face5-ignite${waking ? ' face5-ignite--waking' : ''}`}
      style={{ '--fx': `${origin.x}px`, '--fy': `${origin.y}px` }}
    >
      <div className="face5-ignite__flash" aria-hidden="true" />
      {/* Two black eyelids: they fade in as the fade-to-black, then split apart
          up and down on Wake up, like eyes opening onto the drum. */}
      <div className="face5-ignite__eyelid face5-ignite__eyelid--top" aria-hidden="true" />
      <div className="face5-ignite__eyelid face5-ignite__eyelid--bottom" aria-hidden="true" />
      <svg className="face5-dream-defs" aria-hidden="true" focusable="false">
        <filter id="face5-dream" x="-6%" y="-40%" width="112%" height="180%">
          <feImage
            href={SINE_MAP}
            x="0"
            y="0"
            width="8"
            height="64"
            preserveAspectRatio="none"
            result="cell"
          >
            <animate
              attributeName="y"
              from="-64"
              to="0"
              dur="7s"
              repeatCount="indefinite"
            />
          </feImage>
          <feTile in="cell" result="map" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="map"
            scale="1.5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
      <div className="face5-ignite__screen">
        <Celebration />
        <button type="button" className="face5-ignite__wake" onClick={onWake}>
          Wake up
        </button>
      </div>
    </div>,
    document.body,
  )
}

// The lid hinges open over 1.5s (FaceV.css); the power-up and idle gears kick in
// at the halfway point.
const LID_OPEN_MS = 1500
const POWERUP_AT_MS = LID_OPEN_MS / 2

export default function FaceV() {
  const {
    playArtifactBurst,
    playLidOpen,
    playPowerup,
    startGears,
    stopGears,
    enterIgnition,
    exitIgnition,
  } = useAudio()
  const { rotateTo, lockRotation } = useMachine()
  const [progress, setProgress] = useState(0)
  // 'sealed' -> lid closed, entering the code. 'open' -> lid hinged up, drive
  // blinking, drum locked.
  const [stage, setStage] = useState('sealed')
  // The solved takeover (flash -> black -> celebration) runs as an overlay while
  // the box underneath is quietly reset behind it. `waking` fades that overlay
  // back off to reveal the already-reset drum.
  const [igniting, setIgniting] = useState(false)
  const [waking, setWaking] = useState(false)
  const originRef = useRef({ x: 0, y: 0 })
  // Pending "50% open" trigger for the power-up + idle gears, so it can be
  // cancelled if the drive is taken before the lid finishes opening.
  const lidTimerRef = useRef(null)

  function press(direction) {
    if (stage !== 'sealed' || igniting) return
    const expected = SEQUENCE[progress]
    if (direction === expected) {
      const next = progress + 1
      setProgress(next)
      if (next === SEQUENCE.length) {
        setStage('open')
        lockRotation(true)
        // The lid grinds open (stone-on-stone + ascending melody). At 50% open the
        // power-up fires and the idle watch-gears start and loop.
        playLidOpen()
        lidTimerRef.current = window.setTimeout(() => {
          playPowerup()
          startGears()
        }, POWERUP_AT_MS)
      }
    } else {
      setProgress(0)
    }
  }

  // Clean up the pending trigger and stop the gear loop if FaceV unmounts.
  useEffect(() => () => {
    clearTimeout(lidTimerRef.current)
    stopGears()
  }, [stopGears])

  function ignite(event) {
    const rect = event.currentTarget.getBoundingClientRect()
    originRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
    setIgniting(true)
    // The crystal detonates: cancel any pending lid trigger, kill the idle gears,
    // and cut the jungle bed under it (ears ringing, fade to black). enterIgnition
    // silences the ambience; the burst one-shot still rings (already playing).
    clearTimeout(lidTimerRef.current)
    stopGears()
    playArtifactBurst()
    enterIgnition()
    // Once the flash has whited out the screen, reset the box behind it: reseal
    // the lid and turn the drum back to Face I, both hidden under the overlay.
    // The reset turn is silent (not user-initiated) so no thunk leaks through.
    // Wake up then just lifts the overlay onto an already-reset box.
    window.setTimeout(() => {
      lockRotation(false)
      rotateTo(faceIndex('I'), { silent: true })
      setStage('sealed')
      setProgress(0)
    }, 400)
  }

  function wake() {
    // Fade the black overlay off to reveal the drum, then unmount it, and ramp
    // the jungle bed back in.
    setWaking(true)
    exitIgnition()
    window.setTimeout(() => {
      setIgniting(false)
      setWaking(false)
    }, 900)
  }

  return (
    <FaceSurface className="face5-surface" aria-label="Face V">
      <div className="face5-slab" data-stage={stage} data-lock-progress={progress}>
        <div className="face5-chamber" aria-hidden={stage === 'open' ? undefined : 'true'}>
          <div className="face5-alcove">
            {stage === 'open' && <Device onIgnite={ignite} />}
          </div>
        </div>
        <div className="face5-lid">
          {/* The sealed slate face, carrying the pad and clue. */}
          <div className="face5-lid__face">
            <div className="face5-lock">
              <ArrowPad onPress={press} />
            </div>
            <div className="face5-clue-box" aria-hidden="true">
              <Clue order={1} className="face5-clue">
                {({ orderGlyph, directionLetter }) => (
                  <>
                    {orderGlyph}
                    <span className="face5-clue__dir">{directionLetter}</span>
                  </>
                )}
              </Clue>
            </div>
          </div>
          {/* The slab's stone edges (its thickness), closing the box between the
              front and the underside so it reads as solid as it hinges open. */}
          <div className="face5-lid__edge face5-lid__edge--bottom" aria-hidden="true" />
          <div className="face5-lid__edge face5-lid__edge--left" aria-hidden="true" />
          <div className="face5-lid__edge face5-lid__edge--right" aria-hidden="true" />
          {/* The raw underside (mirror of the front), seen once the lid hinges up. */}
          <div className="face5-lid__underside" aria-hidden="true" />
        </div>
      </div>
      {igniting && <Ignition origin={originRef.current} onWake={wake} waking={waking} />}
    </FaceSurface>
  )
}
