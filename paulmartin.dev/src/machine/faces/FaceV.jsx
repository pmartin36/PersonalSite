import { useRef, useState } from 'react'
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

function ArrowPad({ onPress }) {
  return (
    <div className="face5-pad">
      {PAD_ORDER.map((direction) => (
        <button
          key={direction}
          type="button"
          className="face5-pad__button"
          data-direction={direction}
          aria-label={direction}
          onClick={() => onPress(direction)}
        >
          {DIRECTION_GLYPH[direction]}
        </button>
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
      <h2 className="face5-celebration__title">A bright flash</h2>
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

export default function FaceV() {
  const { play } = useAudio()
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

  function press(direction) {
    if (stage !== 'sealed' || igniting) return
    const expected = SEQUENCE[progress]
    if (direction === expected) {
      const next = progress + 1
      setProgress(next)
      play('shake')
      play('thunk')
      if (next === SEQUENCE.length) {
        setStage('open')
        lockRotation(true)
        play('seam')
      }
    } else {
      setProgress(0)
      play('deadThunk')
    }
  }

  function ignite(event) {
    const rect = event.currentTarget.getBoundingClientRect()
    originRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
    setIgniting(true)
    play('seam')
    // Once the flash has whited out the screen, reset the box behind it: reseal
    // the lid and turn the drum back to Face I, both hidden under the overlay.
    // Wake up then just lifts the overlay onto an already-reset box.
    window.setTimeout(() => {
      lockRotation(false)
      rotateTo(faceIndex('I'))
      setStage('sealed')
      setProgress(0)
    }, 400)
  }

  function wake() {
    // Fade the black overlay off to reveal the drum, then unmount it.
    setWaking(true)
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
          {/* The raw underside, seen once the lid hinges up and over. */}
          <div className="face5-lid__underside" aria-hidden="true" />
        </div>
      </div>
      {igniting && <Ignition origin={originRef.current} onWake={wake} waking={waking} />}
    </FaceSurface>
  )
}
