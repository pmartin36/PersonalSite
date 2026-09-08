import { useId, useState } from 'react'
import FaceSurface from '../FaceSurface.jsx'
import { useAudio } from '../audio.jsx'
import Still from '../../components/Still.jsx'
import OrgTag from '../../components/OrgTag.jsx'
import Clue from '../Clue.jsx'
import DetailModal from '../DetailModal.jsx'
import { currentProjects } from '../../data/projects.js'
import './FaceII.css'

// How far a card tips back on the spindle when the pointer favours its top or
// bottom edge (degrees, at the extreme). Just a little lean.
const WOBBLE_MAX = 6

// Each card back is a different square cut from the hero face's stone, so the three
// read as pieces of one slab rather than repeated tiles.
const BACK_STONE = [
  '/machine/back_stone_1.png',
  '/machine/back_stone_2.png',
  '/machine/back_stone_3.png',
]

// Shared carve filters, the hero name's technique: the stone sunk into deep warm
// shadow by a per-channel brightness subtraction (keeps texture and hue, unlike a
// flat fill), and a lit gold band isolated on each stroke's lower edge.
function ClueCarveDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        <filter id="clue-sink" colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncR type="linear" slope="1" intercept="-0.33" />
            <feFuncG type="linear" slope="1" intercept="-0.35" />
            <feFuncB type="linear" slope="1" intercept="-0.27" />
          </feComponentTransfer>
        </filter>
        <filter
          id="clue-lip"
          x="-60%"
          y="-60%"
          width="220%"
          height="220%"
          colorInterpolationFilters="sRGB"
        >
          <feOffset in="SourceAlpha" dx="0" dy="-2.4" result="up" />
          <feComposite in="SourceAlpha" in2="up" operator="out" result="band" />
          <feGaussianBlur in="band" stdDeviation="0.5" result="soft" />
          <feFlood floodColor="#f2c77d" floodOpacity="0.92" result="col" />
          <feComposite in="col" in2="soft" operator="in" />
        </filter>
      </defs>
    </svg>
  )
}

// One stone for every cut's floor (the slices differ in tone, which made one card's
// bar read a different colour); the card backgrounds still vary.
const CARVE_STONE = '/machine/back_stone_1.png'

// Shapes carved into the stone, the same way the hero name is cut: a dark upper wall
// peeking above, the stone floor sunk into shadow (clipped to the shapes, so an
// overlapping plus reads as one cut, not a doubly-dark crossing), and a lit gold
// lower lip on every bottom edge.
function Carved({ viewBox, shapes }) {
  const clip = useId()
  return (
    <svg className="face2-carve" viewBox={viewBox} aria-hidden="true">
      <defs>
        <clipPath id={clip}>{shapes}</clipPath>
      </defs>
      <g transform="translate(0,-2)" fill="rgba(18,11,3,0.92)">
        {shapes}
      </g>
      <image
        href={CARVE_STONE}
        x="0"
        y="0"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        clipPath={`url(#${clip})`}
        filter="url(#clue-sink)"
      />
      <g fill="#000" filter="url(#clue-lip)">
        {shapes}
      </g>
    </svg>
  )
}

// Seven-segment bars with pointed hexagonal tips (matching the display's original
// clip-paths): hbar points left/right, vbar points top/bottom.
const hbar = (x, y, w, h) =>
  `${x + 0.07 * w},${y} ${x + 0.93 * w},${y} ${x + w},${y + h / 2} ${x + 0.93 * w},${y + h} ${x + 0.07 * w},${y + h} ${x},${y + h / 2}`
const vbar = (x, y, w, h) =>
  `${x},${y + 0.07 * h} ${x + w / 2},${y} ${x + w},${y + 0.07 * h} ${x + w},${y + 0.93 * h} ${x + w / 2},${y + h} ${x},${y + 0.93 * h}`
const SEG = {
  a: hbar(12, 0, 64, 12), g: hbar(12, 70, 64, 12), d: hbar(12, 140, 64, 12),
  f: vbar(0, 12, 12, 57), b: vbar(76, 12, 12, 57), e: vbar(0, 83, 12, 57), c: vbar(76, 83, 12, 57),
}
function Segments({ lit }) {
  const shapes = lit.map((s) => <polygon key={s} points={SEG[s]} />)
  return (
    <div className="face2-cell" aria-hidden="true">
      <Carved viewBox="0 0 88 152" shapes={shapes} />
    </div>
  )
}

// The clue split across the three backs: left card = the two left bars, middle
// card = a plus with the order digit above it, right card = the bottom bar. The
// bars f+e+d draw an L (Left); the middle digit is the order.
function ClueBack({ index }) {
  if (index === 0) return <Segments lit={['f', 'e']} />
  if (index === 2) return <Segments lit={['d']} />
  return (
    <div className="face2-mid" aria-hidden="true">
      <Clue order={6} variant="seven-seg" className="face2-mid__num">
        {({ orderGlyph }) => <span>{orderGlyph}</span>}
      </Clue>
      <div className="face2-mid__plus">
        <Carved
          viewBox="0 0 70 70"
          shapes={[
            <polygon key="h" points={hbar(0, 28.2, 70, 13.6)} />,
            <polygon key="v" points={vbar(28.2, 0, 13.6, 70)} />,
          ]}
        />
      </div>
    </div>
  )
}

// A single card threaded on the spindle. The outer element tips on the rod
// (rotateX) as the pointer nears its top or bottom edge; a click in that same
// top or bottom quarter turns it about the spindle to its back, which carries
// this card's slice of the clue. Both faces stay mounted.
function Card({ project, index, onOpen }) {
  const { playCardFlip } = useAudio()
  // Accumulated turn about the spindle, in degrees. Clicking the top quarter
  // adds +180 (top edge back and over); the bottom quarter adds -180. It keeps
  // turning the way you push it, so flipping back does not reverse.
  const [rotation, setRotation] = useState(0)
  const [tilt, setTilt] = useState(0)
  const showingBack = ((Math.round(rotation / 180) % 2) + 2) % 2 === 1

  function flip(dir) {
    setTilt(0)
    setRotation((r) => r + dir * 180)
    playCardFlip()
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
          <div
            className="face2-plate face2-plate--back"
            style={{ '--back-stone': `url(${BACK_STONE[index]})` }}
          >
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
      <ClueCarveDefs />
      <div className="face2">
        <p className="face2-title machine-carve">Current Projects</p>
        <div className="face2-hollow">
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
