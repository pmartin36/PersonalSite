import { useState } from 'react'
import FaceSurface from '../FaceSurface.jsx'
import Clue from '../Clue.jsx'
import './FaceIV.css'

const EMAIL_HREF = 'mailto:p@ulmartin.me'
const LINKEDIN_HREF = 'https://www.linkedin.com/in/paul-martin-b8547616/'
const BLUESKY_HREF = 'https://bsky.app/profile/paulmartindev.bsky.social'

// The old site's About copy. Both About tiles render this whole block, each
// showing its half, so the two only read as one when they sit side by side.
const ABOUT_TEXT =
  'I’m a software engineer focused on building games and interactive experiences. My passion is bringing new and unseen experiences into the world in a way that feels like magic.'

// Hand-chiselled tally strokes: each a slightly jagged, leaning vertical path
// (x wobbles so no two are the same straight bar). Fixed, not random.
const TALLY_STROKES = [
  'M7.5 57 L5.6 43 L7.2 29 L5.7 15 L6.8 3',
  'M20 58 L21.7 44 L19.9 30 L21.6 16 L20.4 4',
  'M32.6 56 L31 42 L32.8 28 L31.2 14 L32.2 2.5',
  'M45.7 58 L47.6 45 L45.8 31 L47.9 17 L46.4 4.5',
  'M58.6 57 L56.8 43 L58.7 29 L56.9 15 L57.9 3',
  'M71 58 L72.6 44 L70.9 30 L72.4 16 L71.3 4',
]

function TallyMark({ count }) {
  return (
    <svg
      className="face4-tally"
      viewBox="0 0 64 60"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {TALLY_STROKES.slice(0, count).map((d, i) => (
        <path
          key={i}
          d={d}
          className="face4-tally__path"
          style={{ strokeWidth: 4.4 + ((i * 7) % 3) * 0.6 }}
        />
      ))}
    </svg>
  )
}

// 2x3 grid, cells 0..5. Row 1 = About (left half) / About (right half) / gap.
// Row 2 = Email / LinkedIn / GitHub. null is the gap tile.
const INITIAL_TILES = [
  { id: 'about-0', kind: 'about', half: 'left', tex: '/machine/tile_01.png' },
  { id: 'about-1', kind: 'about', half: 'right', tex: '/machine/tile_02.png' },
  null,
  { id: 'email', kind: 'contact', label: 'Email', icon: 'envelope', value: 'p@ulmartin.me', href: EMAIL_HREF, tex: '/machine/tile_03.png' },
  { id: 'linkedin', kind: 'contact', label: 'LinkedIn', icon: 'linkedin', value: 'Paul Martin', href: LINKEDIN_HREF, tex: '/machine/tile_04.png' },
  { id: 'bluesky', kind: 'contact', label: 'Bluesky', icon: 'bluesky', value: 'paulmartindev', href: BLUESKY_HREF, tex: '/machine/tile_05.png' },
]

// Stable render order so the DOM never reorders on a slide (only each tile's
// transform changes), keeping every slide the same speed in every direction.
const TILE_LIST = INITIAL_TILES.filter(Boolean)

function rowCol(index) {
  return { row: Math.floor(index / 3), col: index % 3 }
}

// Two cells are adjacent on the 2x3 grid when they share a row one column
// apart, or share a column one row apart.
function adjacent(a, b) {
  const ra = rowCol(a)
  const rb = rowCol(b)
  if (ra.row === rb.row) return Math.abs(ra.col - rb.col) === 1
  if (ra.col === rb.col) return Math.abs(ra.row - rb.row) === 1
  return false
}

// One half of the About block. The inner content is two tiles wide; the left
// tile shows its left half, the right tile shows its right half, so the heading
// reads "Ab|out" and the paragraph runs across the seam only when adjacent.
function AboutTile({ half, onClick }) {
  return (
    <button
      type="button"
      className={`face4-tile face4-tile--about face4-tile--${half}`}
      onClick={onClick}
    >
      <span className="face4-about">
        <span className="face4-about__heading">About Me</span>
        <span className="face4-about__body">{ABOUT_TEXT}</span>
      </span>
    </button>
  )
}

// Contact icons, etched big into the tile. No labels: the envelope is email, the
// marks are LinkedIn and Bluesky.
function EnvelopeMark({ className }) {
  return (
    <svg className={className} viewBox="2 5 20 14" aria-hidden="true">
      <path d="M3 5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H3zm1.7 2h14.6L12 12 4.7 7zM4 8.6l8 5.4 8-5.4V17H4V8.6z" />
    </svg>
  )
}

function LinkedInMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function BlueskyMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 568 501" aria-hidden="true">
      <path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.778 166.555-20.275 72.453-94.155 90.933-159.875 79.748C507.222 323.8 536.444 388.56 473.333 453.32c-119.86 122.992-172.272-30.859-185.702-70.281-2.462-7.227-3.614-10.608-3.631-7.733-.017-2.875-1.169.506-3.631 7.733-13.43 39.422-65.842 193.273-185.702 70.281-63.111-64.76-33.89-129.52 80.986-149.071-65.72 11.185-139.6-7.295-159.875-79.748C9.945 203.66 0 75.293 0 57.947 0-28.906 76.135-1.611 123.121 33.664Z" />
    </svg>
  )
}

const CONTACT_ICONS = {
  envelope: EnvelopeMark,
  linkedin: LinkedInMark,
  bluesky: BlueskyMark,
}

// A contact tile: a giant icon carved into the tile, with the value below it.
// Only the value is the link (so most of the tile stays draggable), and only the
// value lights up. When the tile sits next to the gap a click slides instead of
// navigating.
function ContactTile({ tile, adjacentToGap, onSlide }) {
  const Icon = CONTACT_ICONS[tile.icon]
  return (
    <div className="face4-tile face4-tile--contact" onClick={onSlide}>
      <a
        className="face4-contact"
        href={tile.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={tile.label}
        onClick={(event) => {
          if (adjacentToGap) event.preventDefault()
        }}
      >
        <Icon className="face4-contact__icon" />
        <span className="face4-contact__value">{tile.value}</span>
      </a>
    </div>
  )
}

export default function FaceIV() {
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
  }

  return (
    <FaceSurface aria-label="Face IV">
      <div className="face4-tray">
        <div className="face4-backplate" aria-hidden="true">
          <Clue order={2} variant="tally" className="face4-clue">
            {({ order, directionLetter }) => (
              <>
                <span className="face4-clue__order" data-clue-piece="order">
                  <TallyMark count={order} />
                </span>
                <span className="face4-clue__direction" data-clue-piece="direction">
                  {directionLetter}
                </span>
              </>
            )}
          </Clue>
        </div>
        <div className="face4-grid">
          {TILE_LIST.map((tile) => {
            const index = tiles.findIndex((t) => t?.id === tile.id)
            const col = index % 3
            const row = Math.floor(index / 3)
            return (
              <div
                key={tile.id}
                className="face4-cell"
                data-tile-kind={tile.kind}
                // Lower rows stack above upper ones so a tile's top face covers
                // the front face of the tile behind it; the gap and the tray
                // edge are where a front face is left exposed. --tile-tex is the
                // tile's top face; --tile-side is its bottom edge mirrored and made
                // fully opaque, for the exposed front face.
                style={{
                  transform: `translate(${col * 100}%, ${row * 100}%)`,
                  zIndex: row + 1,
                  '--tile-tex': `url(${tile.tex})`,
                  '--tile-side': `url(${tile.tex.replace('.png', '_side.png')})`,
                }}
              >
                {tile.kind === 'about' ? (
                  <AboutTile half={tile.half} onClick={() => trySlide(index)} />
                ) : (
                  <ContactTile
                    tile={tile}
                    adjacentToGap={adjacent(index, gapIndex)}
                    onSlide={() => trySlide(index)}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </FaceSurface>
  )
}
