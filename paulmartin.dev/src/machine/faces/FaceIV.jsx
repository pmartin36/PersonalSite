import { useState } from 'react'
import FaceSurface from '../FaceSurface.jsx'
import Clue from '../Clue.jsx'
import { useAudio } from '../audio.jsx'
import './FaceIV.css'

const EMAIL_HREF = 'mailto:p@ulmartin.me'
const LINKEDIN_HREF = 'https://www.linkedin.com/in/paul-martin-b8547616/'
const GITHUB_HREF = 'https://github.com/pmartin36'

// 2x3 grid, row-major cells 0..5. Row 1 = About / About / gap. Row 2 = Email
// / LinkedIn / GitHub. The null entry is the gap tile.
const INITIAL_TILES = [
  {
    id: 'about-0',
    kind: 'about',
    label: 'About',
    copy: 'Paul Martin, software engineer who likes building small interactive toys.',
  },
  {
    id: 'about-1',
    kind: 'about',
    label: 'About',
    copy: 'This machine is one of them: six faces, six clues, one combination.',
  },
  null,
  { id: 'email', kind: 'contact', label: 'Email', href: EMAIL_HREF },
  { id: 'linkedin', kind: 'contact', label: 'LinkedIn', href: LINKEDIN_HREF },
  { id: 'github', kind: 'contact', label: 'GitHub', href: GITHUB_HREF },
]

function rowCol(index) {
  return { row: Math.floor(index / 3), col: index % 3 }
}

// Two cells are adjacent on the 2x3 grid when they share a row and sit one
// column apart, or share a column and sit one row apart.
function adjacent(a, b) {
  const ra = rowCol(a)
  const rb = rowCol(b)
  if (ra.row === rb.row) return Math.abs(ra.col - rb.col) === 1
  if (ra.col === rb.col) return Math.abs(ra.row - rb.row) === 1
  return false
}

function AboutTile({ tile, onClick }) {
  return (
    <button type="button" className="face4-tile face4-tile--about" onClick={onClick}>
      <span className="face4-tile__label">{tile.label}</span>
      <span className="face4-tile__copy">{tile.copy}</span>
    </button>
  )
}

// A contact tile is always a real link with the live href. When the tile
// sits next to the gap, the click slides it instead of navigating; otherwise
// the link behaves normally.
function ContactTile({ tile, adjacentToGap, onSlide }) {
  return (
    <a
      href={tile.href}
      target="_blank"
      rel="noopener noreferrer"
      className="face4-tile face4-tile--contact"
      onClick={(event) => {
        if (adjacentToGap) {
          event.preventDefault()
          onSlide()
        }
      }}
    >
      {tile.label}
    </a>
  )
}

function Cell({ index, tile, adjacentToGap, onSlide }) {
  if (!tile) {
    return <div className="face4-cell face4-cell--gap" data-cell={index} data-gap="true" />
  }

  return (
    <div className="face4-cell" data-cell={index} data-tile-kind={tile.kind}>
      {tile.kind === 'about' ? (
        <AboutTile tile={tile} onClick={onSlide} />
      ) : (
        <ContactTile tile={tile} adjacentToGap={adjacentToGap} onSlide={onSlide} />
      )}
    </div>
  )
}

export default function FaceIV() {
  const { play } = useAudio()
  const [tiles, setTiles] = useState(INITIAL_TILES)
  const gapIndex = tiles.indexOf(null)

  function trySlide(cellIndex) {
    if (!adjacent(cellIndex, gapIndex)) return
    setTiles((current) => {
      const next = [...current]
      next[gapIndex] = current[cellIndex]
      next[cellIndex] = null
      return next
    })
    play('grind')
  }

  return (
    <FaceSurface aria-label="Face IV">
      <div className="face4-backplate" aria-hidden="true">
        <Clue order={5} variant="tally" className="face4-clue">
          {({ order, directionGlyph }) => (
            <>
              <span className="face4-clue__order" data-clue-piece="order">
                {Array.from({ length: order }, (_, i) => (
                  <span key={i} className="face4-tally__stroke" aria-hidden="true" />
                ))}
              </span>
              <span className="face4-clue__direction" data-clue-piece="direction">
                {directionGlyph}
              </span>
            </>
          )}
        </Clue>
      </div>
      <div className="face4-grid">
        {tiles.map((tile, index) => (
          <Cell
            key={tile ? tile.id : 'gap'}
            index={index}
            tile={tile}
            adjacentToGap={adjacent(index, gapIndex)}
            onSlide={() => trySlide(index)}
          />
        ))}
      </div>
    </FaceSurface>
  )
}
