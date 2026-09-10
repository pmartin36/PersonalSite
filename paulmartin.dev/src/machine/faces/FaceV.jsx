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

// The keys are painted button faces (a jade tile with a gold arrow), one PNG per
// direction. The sink and the top-darkening on press are CSS on the button.
const BUTTON_SRC = {
  Left: '/machine/button_left.png',
  Up: '/machine/button_up.png',
  Right: '/machine/button_right.png',
  Down: '/machine/button_down.png',
}

// A key holds its depressed state for at least this long, so a quick tap still
// sinks all the way down before it eases back up. Matches the down transition.
const KEY_DOWN_MS = 400

// The lock reads the last presses, not a run from scratch: the code opens whenever
// the most recent presses end with SEQUENCE, no matter what came before. Returns how
// many trailing presses currently match the start of SEQUENCE (the visible progress).
function matchLength(buffer) {
  for (let k = Math.min(buffer.length, SEQUENCE.length); k > 0; k--) {
    let ok = true
    for (let i = 0; i < k; i++) {
      if (buffer[buffer.length - k + i] !== SEQUENCE[i]) {
        ok = false
        break
      }
    }
    if (ok) return k
  }
  return 0
}

function ArrowPad({ onPress, onPressStart }) {
  const [pressed, setPressed] = useState({})
  const downAt = useRef({})
  const timers = useRef({})

  // Press: sink now, and keep it down until at least KEY_DOWN_MS has passed (a tap
  // completes the full sink), or until release if the key is held longer. The
  // press SOUND fires here (on the way down), not on release.
  function down(direction) {
    clearTimeout(timers.current[direction])
    downAt.current[direction] = performance.now()
    setPressed((p) => ({ ...p, [direction]: true }))
    onPressStart?.(direction)
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
      {PAD_ORDER.map((direction) => (
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
            <img
              className="face5-pad__img"
              src={BUTTON_SRC[direction]}
              alt=""
              aria-hidden="true"
              draggable="false"
            />
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
    playPadPress,
    startGears,
    stopGears,
    enterIgnition,
    exitIgnition,
  } = useAudio()
  const { rotateTo, lockRotation } = useMachine()
  const [progress, setProgress] = useState(0)
  // The recent presses (kept to SEQUENCE length), so the code matches on a trailing
  // window rather than a clean run from the start.
  const bufferRef = useRef([])
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

  // The stone tap fires on the way DOWN (pointer-down), so the thunk lands as the
  // key sinks, not on release. The lock itself still advances on the click.
  function pressStart(direction) {
    if (stage !== 'sealed' || igniting) return
    playPadPress()
  }

  function press(direction) {
    if (stage !== 'sealed' || igniting) return
    const buffer = [...bufferRef.current, direction].slice(-SEQUENCE.length)
    bufferRef.current = buffer
    const matched = matchLength(buffer)
    setProgress(matched)
    if (matched === SEQUENCE.length) {
      bufferRef.current = []
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
      bufferRef.current = []
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
          <span className="face5-credit">Art by Olga Kholkina</span>
        </div>
        <div className="face5-lid">
          {/* The sealed slate face, carrying the pad and clue. */}
          <div className="face5-lid__face">
            <div className="face5-lock">
              <ArrowPad onPress={press} onPressStart={pressStart} />
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
