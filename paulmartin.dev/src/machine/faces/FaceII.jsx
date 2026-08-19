import { useState } from 'react'
import FaceSurface from '../FaceSurface.jsx'
import Still from '../../components/Still.jsx'
import OrgTag from '../../components/OrgTag.jsx'
import Clue from '../Clue.jsx'
import DetailModal from '../DetailModal.jsx'
import { useAudio } from '../audio.jsx'
import { currentProjects } from '../../data/projects.js'
import './FaceII.css'

// Which of the three cards carries the puzzle clue on its back. The other two
// backs are plain stone: one clue hook per face, never one per card.
const CLUE_CARD_INDEX = 0

// Both faces of a card stay mounted at all times; flipping only toggles the
// container's rotateY class, so the back-face clue hook (when present) is
// always in the DOM regardless of flip state.
function Card({ project, showClue, onOpen }) {
  const { play } = useAudio()
  const [flipped, setFlipped] = useState(false)

  function toggleFlip() {
    setFlipped((current) => !current)
    play('flip')
  }

  return (
    <div className="face2-spindle">
      <div
        className={`face2-card${flipped ? ' face2-card--flipped' : ''}`}
        data-flipped={flipped ? 'true' : 'false'}
      >
        <div className="face2-card__face face2-card__face--front">
          <button
            type="button"
            className="face2-card__corner"
            aria-label="Flip card to clue"
            aria-pressed={flipped}
            onClick={toggleFlip}
          />
          <div className="face2-card__media">
            <Still image={project.thumb} className="face2-card__still" />
          </div>
          <div className="face2-card__body">
            <h3 className="face2-card__name">
              {project.name}
              <OrgTag org={project.org} />
            </h3>
            <p className="face2-card__headline">{project.headline}</p>
            <button
              type="button"
              className="face2-card__details"
              onClick={() => onOpen(project)}
            >
              Details
            </button>
          </div>
        </div>
        <div className="face2-card__face face2-card__face--back">
          <button
            type="button"
            className="face2-card__corner"
            aria-label="Flip card back"
            aria-pressed={flipped}
            onClick={toggleFlip}
          />
          {showClue && (
            <Clue order={3} variant="seven-seg" className="face2-clue">
              {({ orderGlyph, directionLetter }) => (
                <span className="face2-clue__glyph">{orderGlyph}{directionLetter.toUpperCase()}</span>
              )}
            </Clue>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FaceII() {
  const [modalProject, setModalProject] = useState(null)

  return (
    <FaceSurface aria-label="Face II">
      <div className="face2-cards">
        {currentProjects.map((project, i) => (
          <Card
            key={project.slug}
            project={project}
            showClue={i === CLUE_CARD_INDEX}
            onOpen={setModalProject}
          />
        ))}
      </div>
      {modalProject && (
        <DetailModal project={modalProject} onClose={() => setModalProject(null)} />
      )}
    </FaceSurface>
  )
}
