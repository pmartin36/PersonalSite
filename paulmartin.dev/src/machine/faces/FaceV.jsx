import { useState } from 'react'
import FaceSurface from '../FaceSurface.jsx'
import Clue, { DIRECTION_GLYPH } from '../Clue.jsx'
import { useAudio } from '../audio.jsx'
import { SEQUENCE } from '../model.js'
import { solvers } from '../../data/solvers.js'
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

function Celebration() {
  return (
    <div className="face5-celebration">
      <h2 className="face5-celebration__title">You found the way through.</h2>
      <p className="face5-celebration__lede">
        Drop me a line and I'll add you to the list of people who made it out.
      </p>
      <p className="face5-celebration__cta">
        <a href="mailto:p@ulmartin.me?subject=I%20solved%20the%20maze">
          p@ulmartin.me
        </a>
      </p>
      {solvers.length > 0 && (
        <div className="face5-celebration__list">
          <p className="face5-celebration__list-label">Made it through</p>
          <ul>
            {solvers.map((s, i) => (
              <li key={i}>
                <span className="face5-celebration__name">{s.name}</span>
                {s.note ? <span className="face5-celebration__note">{s.note}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function FaceV() {
  const { play } = useAudio()
  const [progress, setProgress] = useState(0)
  const [solved, setSolved] = useState(false)

  function press(direction) {
    if (solved) return

    const expected = SEQUENCE[progress]
    if (direction === expected) {
      const next = progress + 1
      setProgress(next)
      play('shake')
      play('thunk')
      if (next === SEQUENCE.length) {
        setSolved(true)
        play('seam')
      }
    } else {
      setProgress(0)
      play('deadThunk')
    }
  }

  return (
    <FaceSurface className="face5-surface" aria-label="Face V">
      <div
        className={`face5-slab${solved ? ' face5-slab--opened' : ''}`}
        data-solved={solved ? 'true' : 'false'}
        data-lock-progress={progress}
      >
        <div className="face5-slab__sealed">
          <div className="face5-seam" aria-hidden="true" />
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
        <div className="face5-slab__solved">
          <Celebration />
        </div>
      </div>
    </FaceSurface>
  )
}
