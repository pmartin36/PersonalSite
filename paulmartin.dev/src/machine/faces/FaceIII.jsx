import { useEffect, useRef, useState } from 'react'
import FaceSurface from '../FaceSurface.jsx'
import DetailModal from '../DetailModal.jsx'
import ProjectPlaque from '../ProjectPlaque.jsx'
import { useAudio } from '../audio.jsx'
import { directionLetter } from '../Clue.jsx'
import { MOVES } from '../model.js'
import { getProject } from '../../data/projects.js'
import './FaceIII.css'

// Three reels, each a 3-sided wheel (project | project | blank). Every reel's
// third face is bare stone, where the "More projects on GitHub" call-to-action
// reads.
const REELS = [
  [getProject('pong'), getProject('stargazer'), null],
  [getProject('the-16-spaces'), getProject('solar-express'), null],
  [getProject('nuclear-reactor'), getProject('jam-games'), null],
]

// Start each reel on the face that should be showing first. Reels 1 and 3 are
// stored with their two projects swapped, so they open on index 1 (Stargazer,
// Jam Games); reel 2 opens on index 0.
const START_POSITIONS = [1, 0, 1]

// Face III carries two of the lock's moves. Move 5 is Hint 1 (the seam-glyph
// match); the OTHER Face III move is Hint 2, the colored-character clue: a gold
// order digit and a gold direction letter, the same gold, that pair into the
// move when you read across the cards. Both characters are derived from MOVES so
// a change to the lock code cannot silently mislabel them.
const SEAM_ORDER = 5
const COLORED_MOVE = MOVES.find((m) => m.faceId === 'III' && m.order !== SEAM_ORDER)
const CLUE_DIGIT = String(COLORED_MOVE.order)
const CLUE_LETTER = directionLetter(COLORED_MOVE.direction)

// Where each gilded character rides: the order digit on Pong's "3D", and the
// direction letter as the capital that opens Solar Express's "Debris" blurb (a
// naturally capitalised D, not a forced one). Guard that the host copy actually
// contains the derived character, so it throws at load rather than shipping a
// missing clue.
const CLUE_TINTS = {
  pong: [{ field: 'headline', char: CLUE_DIGIT, piece: 'order' }],
  'solar-express': [
    { field: 'blurb', char: CLUE_LETTER.toUpperCase(), piece: 'direction' },
  ],
}
for (const [slug, tints] of Object.entries(CLUE_TINTS)) {
  for (const t of tints) {
    if (!getProject(slug)[t.field].includes(t.char)) {
      throw new Error(
        `FaceIII clue: ${slug} ${t.field} has no "${t.char}" to gild`,
      )
    }
  }
}

// Hint 1, the seam match (move 5). Every face carries a half-glyph etched on its
// left and right edge; read across the gap between two reels, most alignments are
// garbled. Exactly one lines up: reel-1|reel-2 completes the order NUMBER, and
// reel-2|reel-3 completes the direction LETTER, reel 2's shared face carrying a
// half of each. The number and letter are derived from MOVES so the lock code
// stays the single source of truth.
const SEAM_MOVE = MOVES.find((m) => m.faceId === 'III' && m.order === SEAM_ORDER)
const SEAM_NUM = String(SEAM_MOVE.order)
const SEAM_DIR = directionLetter(SEAM_MOVE.direction)

// Per reel, per face position (0..2): the character each edge shows half of. A
// face's LEFT edge shows the RIGHT half of its `left` char (to meet the reel to
// its left across the gap); its RIGHT edge shows the LEFT half of its `right`
// char. Only the winning trio completes cleanly:
//   reel1 face1 right-half-of NUMBER  +  reel2 face2 left carries NUMBER  -> number
//   reel2 face2 right carries LETTER  +  reel3 face1 left carries LETTER  -> letter
// reel1 face1 = Pong, reel2 face2 = blank, reel3 face1 = blank: a mix, not all
// blank. Every other edge is a decoy that never forms a clean glyph.
const NUMBER_DECOYS = ['8', '3', '6', '2']
const DIR_DECOYS = ['k', 'n', 'h', 'm']
if (NUMBER_DECOYS.includes(SEAM_NUM) || DIR_DECOYS.includes(SEAM_DIR)) {
  throw new Error('FaceIII seam: winning glyph collides with a decoy')
}
const SEAM_GLYPHS = [
  // reel 1: right edges carry the number seam; left edges are outer decoration.
  { left: ['w', 'x', 'v'], right: ['8', SEAM_NUM, '3'] },
  // reel 2: left edges complete the number, right edges start the letter.
  { left: ['6', '2', SEAM_NUM], right: ['k', 'n', SEAM_DIR] },
  // reel 3: left edges complete the letter (on the blank "ON" face); right edges
  // are outer decoration.
  { left: ['h', 'm', SEAM_DIR], right: ['s', 'z', 'y'] },
]

// One etched half-glyph at a face edge: `half` is which half of the character is
// kept, clipped at the very edge so it meets its partner across the gap.
function SeamGlyph({ char, half }) {
  return (
    <span className={`face3-seam face3-seam--${half}`} aria-hidden="true">
      {char}
    </span>
  )
}

// The empty reel faces point onward: read across the three reels' blanks they
// spell MORE PROJECTS ON, with the GitHub mark under the middle word.
const REEL_CTA = ['MORE', 'PROJECTS', 'ON']

// The GitHub mark, etched into the stone like the other carvings.
function GithubMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

const GITHUB_HREF = 'https://github.com/pmartin36'

// A bare reel face: the onward call-to-action, carved big into the stone. The
// word is this reel's slice of MORE PROJECTS ON; the middle reel also carries
// the GitHub mark below it, a link out. Only the mark takes clicks; the rest of
// the face still spins the reel.
function BlankFaceContent({ reelIndex }) {
  return (
    <div className="face3-cta">
      <span className="face3-cta__word" aria-hidden="true">
        {REEL_CTA[reelIndex]}
      </span>
      {reelIndex === 1 && (
        <a
          className="face3-cta__logo-link"
          href={GITHUB_HREF}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="More projects on GitHub"
          onClick={(event) => event.stopPropagation()}
        >
          <GithubMark className="face3-cta__logo-mark" />
          <span className="face3-cta__logo-word">GitHub</span>
        </a>
      )}
    </div>
  )
}

// A single reel: a 3-face wheel showing the current face plus a sliver of the
// faces above and below. Tap or wheel-scroll spins it one step; a project
// title opens the detail modal (its click is stopped from also spinning).
function Reel({ faces, reelIndex, position, onSpin, onOpen }) {
  const windowRef = useRef(null)
  const spinRef = useRef(onSpin)
  spinRef.current = onSpin

  // A native, non-passive wheel listener so it can preventDefault and, crucially,
  // stopPropagation before the event bubbles to the drum's own wheel listener on
  // an ancestor (a React onWheel would run too late). Scrolling on a reel spins
  // only the reel, never the drum.
  useEffect(() => {
    const el = windowRef.current
    if (!el) return undefined
    const onWheel = (event) => {
      event.preventDefault()
      event.stopPropagation()
      spinRef.current(event.deltaY > 0 ? 1 : -1)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Repeat the three entries around a 6-sided drum so the neighbours sit at 60°
  // and tilt toward the viewer (like the device's faces) instead of 120° facing
  // away; the current face is centred with the next/previous angled above and
  // below.
  const wheelFaces = [...faces, ...faces]

  return (
    <div className="face3-reel">
      <div
        ref={windowRef}
        className="face3-reel__window"
        role="button"
        tabIndex={0}
        aria-label="Spin reel"
        onClick={() => onSpin(1)}
      >
        <div
          className="face3-reel__wheel"
          style={{
            transform: `translateZ(calc(-1 * var(--reel-apothem))) rotateX(${60 * position}deg)`,
          }}
        >
          {wheelFaces.map((project, i) => {
            const pos = i % faces.length
            const seam = SEAM_GLYPHS[reelIndex]
            return (
              <div
                key={i}
                className="face3-reel__face"
                style={{
                  transform: `rotateX(${-60 * i}deg) translateZ(var(--reel-apothem))`,
                }}
              >
                {project ? (
                  <ProjectPlaque
                    project={project}
                    onOpen={onOpen}
                    tints={CLUE_TINTS[project.slug]}
                  />
                ) : (
                  <BlankFaceContent reelIndex={reelIndex} />
                )}
                <SeamGlyph half="left" char={seam.left[pos]} />
                <SeamGlyph half="right" char={seam.right[pos]} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function FaceIII() {
  const { play } = useAudio()
  // Accumulating step per reel; the visible face is position mod 3.
  const [positions, setPositions] = useState(START_POSITIONS)
  const [modalProject, setModalProject] = useState(null)

  function spin(reelIndex, dir = 1) {
    setPositions((current) =>
      current.map((p, i) => (i === reelIndex ? p + dir : p)),
    )
    play('grind')
  }

  return (
    <FaceSurface aria-label="Face III">
      <div className="face3">
        <p className="face3-title">Past Projects</p>
        <div className="face3-reels">
          {REELS.map((faces, i) => (
            <Reel
              key={i}
              faces={faces}
              reelIndex={i}
              position={positions[i]}
              onSpin={(dir) => spin(i, dir)}
              onOpen={setModalProject}
            />
          ))}
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
