import { useState } from 'react'
import FaceSurface from '../FaceSurface.jsx'
import Still from '../../components/Still.jsx'
import OrgTag from '../../components/OrgTag.jsx'
import Clue from '../Clue.jsx'
import DetailModal from '../DetailModal.jsx'
import { useAudio } from '../audio.jsx'
import { currentProjects } from '../../data/projects.js'
import './FaceII.css'

// How far a card tips back on the spindle when the pointer favours its top or
// bottom edge (degrees, at the extreme). Just a little lean.
const WOBBLE_MAX = 6

// A seven-segment cell showing only its lit bars (no unfilled outlines). The
// clue is spread across the three card backs, so each card lights a different
// part of one figure.
function Segments({ lit }) {
  return (
    <div className="face2-cell" aria-hidden="true">
      {lit.map((seg) => (
        <span key={seg} className={`face2-seg face2-seg--${seg}`} />
      ))}
    </div>
  )
}

// The clue split across the three backs: left card = the two left bars, middle
// card = a plus with the order digit above it, right card = the two bottom
// bars. The bars f+e+d draw an L (Left); the middle digit is the order. Together
// they read the move-6 clue.
function ClueBack({ index }) {
  if (index === 0) return <Segments lit={['f', 'e']} />
  if (index === 2) return <Segments lit={['d']} />
  return (
    <div className="face2-mid" aria-hidden="true">
      <Clue order={6} variant="seven-seg" className="face2-mid__num">
        {({ orderGlyph }) => <span>{orderGlyph}</span>}
      </Clue>
      <span className="face2-mid__plus" />
    </div>
  )
}

// A single card threaded on the spindle. The outer element tips on the rod
// (rotateX) as the pointer nears its top or bottom edge; a click in that same
// top or bottom quarter turns it about the spindle to its back, which carries
// this card's slice of the clue. Both faces stay mounted.
function Card({ project, index, onOpen }) {
  const { play } = useAudio()
  // Accumulated turn about the spindle, in degrees. Clicking the top quarter
  // adds +180 (top edge back and over); the bottom quarter adds -180. It keeps
  // turning the way you push it, so flipping back does not reverse.
  const [rotation, setRotation] = useState(0)
  const [tilt, setTilt] = useState(0)
  const showingBack = ((Math.round(rotation / 180) % 2) + 2) % 2 === 1

  function flip(dir) {
    setTilt(0)
    setRotation((r) => r + dir * 180)
    play('flip')
  }

  function handleMove(event) {
    if (showingBack) return
    const rect = event.currentTarget.getBoundingClientRect()
    const rel = (event.clientY - rect.top) / rect.height // 0 top .. 1 bottom
    // Only the top and bottom quarters (the flip handles) lean, ramping in from
    // the quarter edge. The middle stays calm; it opens the modal instead.
    if (rel < 0.25) setTilt(((0.25 - rel) / 0.25) * WOBBLE_MAX)
    else if (rel > 0.75) setTilt(-((rel - 0.75) / 0.25) * WOBBLE_MAX)
    else setTilt(0)
  }

  function handleLeave() {
    setTilt(0)
  }

  // Direction comes from where the click lands on screen, not from which
  // (possibly pre-rotated) zone was hit, so the back never spins in reverse:
  // the top half always pushes the top edge back and over. Stops the click from
  // also reaching the plate's open-modal handler.
  function turn(event) {
    event.stopPropagation()
    const card = event.currentTarget.closest('.face2-card')
    const rect = card.getBoundingClientRect()
    const rel = (event.clientY - rect.top) / rect.height
    flip(rel < 0.5 ? 1 : -1)
  }

  return (
    <div className="face2-slot">
      <div
        className="face2-card"
        style={{ transform: `rotateX(${tilt.toFixed(1)}deg)` }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        <div
          className="face2-flip"
          data-flipped={showingBack ? 'true' : 'false'}
          style={{ transform: `rotateX(${rotation}deg)` }}
        >
          <div className="face2-plate face2-plate--front">
            <button
              type="button"
              className="face2-turn face2-turn--top"
              aria-label="Turn card to its clue"
              aria-pressed={showingBack}
              onClick={turn}
            />
            <button
              type="button"
              className="face2-turn face2-turn--bottom"
              aria-label="Turn card to its clue"
              aria-pressed={showingBack}
              onClick={turn}
            />
            <div className="face2-media">
              <Still image={project.thumb} className="face2-still" />
            </div>
            <div className="face2-body">
              <div className="face2-heading">
                <h3 className="face2-name">
                  <button
                    type="button"
                    className="face2-open"
                    onClick={() => onOpen(project)}
                  >
                    {project.name}
                  </button>
                  <OrgTag org={project.org} />
                </h3>
                <span className="face2-year">{project.year}</span>
              </div>
              <p className="face2-headline">{project.headline}</p>
              <p className="face2-blurb">{project.blurb}</p>
              <div className="face2-tags">
                {project.tags.map((t) => (
                  <span key={t} className="face2-tag">
                    {t}
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="face2-details"
                onClick={() => onOpen(project)}
              >
                See details
              </button>
            </div>
          </div>
          <div className="face2-plate face2-plate--back">
            <button
              type="button"
              className="face2-turn face2-turn--top"
              aria-label="Turn card back"
              aria-pressed={showingBack}
              onClick={turn}
            />
            <button
              type="button"
              className="face2-turn face2-turn--bottom"
              aria-label="Turn card back"
              aria-pressed={showingBack}
              onClick={turn}
            />
            <ClueBack index={index} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FaceII() {
  const [modalProject, setModalProject] = useState(null)

  return (
    <FaceSurface aria-label="Face II">
      <div className="face2">
        <p className="face2-title machine-carve">Current Projects</p>
        <div className="face2-hollow">
          <div className="face2-interior" aria-hidden="true">
            <span className="face2-int face2-int--top" />
            <span className="face2-int face2-int--bottom" />
            <span className="face2-int face2-int--left" />
            <span className="face2-int face2-int--right" />
            <span className="face2-int face2-int--back" />
            <span className="face2-int-seam" />
          </div>
          <div className="face2-rod" aria-hidden="true">
            <span className="face2-rod__mount face2-rod__mount--left" />
            <span className="face2-rod__mount face2-rod__mount--right" />
          </div>
          <div className="face2-cards">
            {currentProjects.map((project, i) => (
              <Card
                key={project.slug}
                project={project}
                index={i}
                onOpen={setModalProject}
              />
            ))}
          </div>
        </div>
      </div>
      {modalProject && (
        <DetailModal
          project={modalProject}
          onClose={() => setModalProject(null)}
        />
      )}
    </FaceSurface>
  )
}
