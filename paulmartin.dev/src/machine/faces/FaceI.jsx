import FaceSurface from '../FaceSurface.jsx'
import Clue from '../Clue.jsx'
import { useMachine, faceIndex } from '../Machine.jsx'
import { RESUME_URL } from '../model.js'
import './FaceI.css'

const RESUME_WORD = 'resume'

export default function FaceI() {
  const { rotateTo } = useMachine()

  return (
    <FaceSurface aria-label="Face I">
      <h1 className="face1-name">Paul Martin</h1>
      <div className="face1-actions">
        <a
          href={RESUME_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Resume"
          className="face1-action face1-resume"
        >
          <Clue order={4} variant="underline" className="face1-resume__clue">
            {({ order, directionLetter }) => {
              // "resume"[order-1] must equal the move's direction letter (position
              // 4 -> 'u' -> Up): if MOVES face I ever changes this throws at render
              // rather than silently shipping a mis-underlined word.
              if (RESUME_WORD[order - 1] !== directionLetter) {
                throw new Error(
                  `FaceI clue: "resume"[${order - 1}] != directionLetter ${directionLetter}`,
                )
              }
              return [...RESUME_WORD].map((ch, i) => (
                <span
                  key={i}
                  className={i === order - 1 ? 'face1-resume__tell' : undefined}
                >
                  {ch}
                </span>
              ))
            }}
          </Clue>
        </a>
        <button
          type="button"
          className="face1-action face1-contact"
          onClick={() => rotateTo(faceIndex('IV'))}
        >
          Contact
        </button>
      </div>
    </FaceSurface>
  )
}
