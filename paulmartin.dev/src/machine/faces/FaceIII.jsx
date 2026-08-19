import { useState } from 'react'
import FaceSurface from '../FaceSurface.jsx'
import Still from '../../components/Still.jsx'
import Clue, { directionLetter } from '../Clue.jsx'
import { useAudio } from '../audio.jsx'
import { getProject } from '../../data/projects.js'
import { moveByOrder } from '../model.js'
import { REEL_EDGES, WINNING } from '../seamGlyphs.js'
import './FaceIII.css'

// Three reels, each holding three faces (project | null). Every reel's third
// face is blank; reel 3 is entirely blank, held open for future work.
const REELS = [
  [getProject('stargazer'), getProject('pong'), null],
  [getProject('the-16-spaces'), getProject('solar-express'), null],
  [null, null, null],
]

// The move-6 clue pair rides on two different cards so it reads across them:
// the tinted digit hook on reel 1's Stargazer face, the derived tinted letter
// on reel 2's The 16 Spaces face. Both sit at face index 0, the default
// alignment, so the pair is visible without spinning anything.
const DIGIT_SLOT = { reel: 0, face: 0 }
const LETTER_SLOT = { reel: 1, face: 0 }

function ReelFace({ project, active, blank, reelIndex, faceIndex, children }) {
  const edges = REEL_EDGES[reelIndex][faceIndex]
  return (
    <div
      className="face3-reel__face"
      data-reel-face
      data-active={active ? 'true' : 'false'}
      data-blank={blank ? 'true' : 'false'}
    >
      <span className="face3-edge" data-edge="left" data-mark={edges.left} aria-hidden="true" />
      <span className="face3-edge" data-edge="right" data-mark={edges.right} aria-hidden="true" />
      {!blank && project && (
        <>
          <Still image={project.thumb} className="face3-reel__still" />
          <div className="face3-reel__body">
            <h3 className="face3-reel__name">{project.name}</h3>
            {project.org && <span className="face3-reel__org">{project.org.name}</span>}
            <p className="face3-reel__blurb">{project.blurb}</p>
          </div>
        </>
      )}
      {children}
    </div>
  )
}

// A single spin control. It is the only interactive element in the reel: no
// interactive element nests inside it, so org affiliation renders as plain
// text rather than the OrgTag link.
function Reel({ index, faces, position, onSpin, digitClue, letterClue }) {
  return (
    <button
      type="button"
      className="face3-reel"
      data-reel={index}
      data-position={position}
      onClick={onSpin}
    >
      <div
        className="face3-reel__wheel"
        style={{ transform: `rotateX(${-120 * position}deg)` }}
      >
        {faces.map((project, faceIndex) => (
          <div
            key={faceIndex}
            className="face3-reel__slot"
            style={{ transform: `rotateX(${120 * faceIndex}deg) translateZ(9rem)` }}
          >
            <ReelFace
              project={project}
              active={faceIndex === position}
              blank={project === null}
              reelIndex={index}
              faceIndex={faceIndex}
            >
              {digitClue && faceIndex === DIGIT_SLOT.face && digitClue}
              {letterClue && faceIndex === LETTER_SLOT.face && letterClue}
            </ReelFace>
          </div>
        ))}
      </div>
    </button>
  )
}

export default function FaceIII() {
  const { play } = useAudio()
  const [positions, setPositions] = useState([0, 0, 0])

  function spin(reelIndex) {
    setPositions((current) => current.map((p, i) => (i === reelIndex ? (p + 1) % 3 : p)))
    play('grind')
  }

  const move6 = moveByOrder(6)
  const letterText = directionLetter(move6.direction)

  const digitClue = (
    <Clue order={6} className="face3-clue face3-clue--digit face3-clue-tint">
      {({ orderGlyph }) => orderGlyph}
    </Clue>
  )

  const letterClue = (
    <span className="face3-clue face3-clue--letter face3-clue-tint">{letterText}</span>
  )

  const aligned = positions.every((p, i) => p === WINNING.positions[i])
  const seamClueClass = ['face3-seam-clue', aligned && 'face3-seam-clue--aligned']
    .filter(Boolean)
    .join(' ')

  return (
    <FaceSurface aria-label="Face III">
      <div className="face3-reels">
        {REELS.map((faces, reelIndex) => (
          <Reel
            key={reelIndex}
            index={reelIndex}
            faces={faces}
            position={positions[reelIndex]}
            onSpin={() => spin(reelIndex)}
            digitClue={reelIndex === DIGIT_SLOT.reel ? digitClue : null}
            letterClue={reelIndex === LETTER_SLOT.reel ? letterClue : null}
          />
        ))}
        <Clue order={2} className={seamClueClass}>
          {({ orderGlyph, directionLetter: letter }) => `${orderGlyph} ${letter}`}
        </Clue>
      </div>
    </FaceSurface>
  )
}
