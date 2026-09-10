import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent, within } from '@testing-library/react'
import FaceIV from './FaceIV.jsx'
import { MOVES } from '../model.js'
import { directionLetter } from '../Clue.jsx'

const { mockPlay } = vi.hoisted(() => ({ mockPlay: vi.fn() }))

// FaceIV's own slide/tile logic is under test here, not audio arming or
// synthesis (covered by audio.test.jsx), so audio.jsx is replaced with a bare
// play() spy.
vi.mock('../audio.jsx', () => ({
  useAudio: () => ({
    play: mockPlay,
    playTileSlide: () => {},
    muted: false,
    armed: true,
    toggleMute: () => {},
    mute: () => {},
    unmute: () => {},
    arm: () => {},
  }),
}))

const FACE_IV_MOVE = MOVES.find((m) => m.faceId === 'IV')

const EMAIL_HREF = 'mailto:p@ulmartin.me'
const LINKEDIN_HREF = 'https://www.linkedin.com/in/paul-martin-b8547616/'
const BLUESKY_HREF = 'https://bsky.app/profile/paulmartindev.bsky.social'

// The 2x3 tray has no gap cell in the DOM: five tiles render (the gap is the one
// grid position none of them occupy). Each tile carries its grid index in its
// transform, translate(col*100%, row*100%), so the index is read back from there.
function tileIndex(cell) {
  const m = cell.style.transform.match(/translate\(\s*([-\d.]+)%\s*,\s*([-\d.]+)%\s*\)/)
  const col = Math.round(Number(m[1]) / 100)
  const row = Math.round(Number(m[2]) / 100)
  return row * 3 + col
}

function tiles(container) {
  return Array.from(container.querySelectorAll('.face4-cell')).map((cell) => ({
    cell,
    index: tileIndex(cell),
    kind: cell.getAttribute('data-tile-kind'),
  }))
}

function tileAt(container, index) {
  const found = tiles(container).find((t) => t.index === index)
  expect(found, `a tile occupies grid index ${index}`).toBeTruthy()
  return found.cell
}

function occupiedIndices(container) {
  return tiles(container)
    .map((t) => t.index)
    .sort((a, b) => a - b)
}

beforeEach(() => {
  mockPlay.mockClear()
})

afterEach(() => {
  cleanup()
})

describe('FaceIV initial layout', () => {
  it('renders five tiles: About, About, Email, LinkedIn, Bluesky, with the gap at grid index 2', () => {
    const { container } = render(<FaceIV />)
    const all = tiles(container)
    expect(all.length).toBe(5)
    // Index 2 (top-right) is the gap: no tile occupies it.
    expect(occupiedIndices(container)).toEqual([0, 1, 3, 4, 5])
    expect(tileAt(container, 0).getAttribute('data-tile-kind')).toBe('about')
    expect(tileAt(container, 1).getAttribute('data-tile-kind')).toBe('about')
    expect(tileAt(container, 3).getAttribute('data-tile-kind')).toBe('contact')
    expect(tileAt(container, 4).getAttribute('data-tile-kind')).toBe('contact')
    expect(tileAt(container, 5).getAttribute('data-tile-kind')).toBe('contact')
  })
})

describe('FaceIV slide legality', () => {
  it('slides the About tile adjacent to the gap (grid index 1) into the gap', () => {
    const { container } = render(<FaceIV />)
    const tile = within(tileAt(container, 1)).getByRole('button', { name: /about/i })

    fireEvent.click(tile)

    // The About tile moved into the gap (index 2); the gap is now at index 1.
    expect(occupiedIndices(container)).toEqual([0, 2, 3, 4, 5])
    expect(tileAt(container, 2).getAttribute('data-tile-kind')).toBe('about')
  })

  it('slides the contact tile adjacent to the gap (Bluesky at grid index 5) when its stone is clicked', () => {
    const { container } = render(<FaceIV />)
    // The stone of the tile slides; the link itself navigates (see next test).
    const stone = tileAt(container, 5).querySelector('.face4-tile--contact')
    expect(stone).toBeTruthy()

    fireEvent.click(stone)

    expect(occupiedIndices(container)).toEqual([0, 1, 2, 3, 4])
    expect(tileAt(container, 2).getAttribute('data-tile-kind')).toBe('contact')
  })

  it('clicking a contact link navigates instead of sliding, even next to the gap (Bluesky at grid index 5)', () => {
    const { container } = render(<FaceIV />)
    const before = occupiedIndices(container)
    const link = within(tileAt(container, 5)).getByRole('link', { name: /bluesky/i })

    fireEvent.click(link)

    // The link stops the click from reaching the tile's slide handler.
    expect(occupiedIndices(container)).toEqual(before)
  })

  it('leaves the arrangement unchanged when a non-adjacent About tile is clicked (grid index 0)', () => {
    const { container } = render(<FaceIV />)
    const before = occupiedIndices(container)
    const tile = within(tileAt(container, 0)).getByRole('button', { name: /about/i })

    fireEvent.click(tile)

    expect(occupiedIndices(container)).toEqual(before)
  })

  it('leaves the arrangement unchanged when a non-adjacent contact tile is clicked (Email at grid index 3)', () => {
    const { container } = render(<FaceIV />)
    const before = occupiedIndices(container)
    const tile = within(tileAt(container, 3)).getByRole('link', { name: /email/i })

    fireEvent.click(tile)

    expect(occupiedIndices(container)).toEqual(before)
  })
})

describe('FaceIV contact tiles', () => {
  it('links to the expected Email, LinkedIn, and Bluesky URLs', () => {
    const { container } = render(<FaceIV />)
    expect(
      within(tileAt(container, 3)).getByRole('link', { name: /email/i }).getAttribute('href'),
    ).toBe(EMAIL_HREF)
    expect(
      within(tileAt(container, 4)).getByRole('link', { name: /linkedin/i }).getAttribute('href'),
    ).toBe(LINKEDIN_HREF)
    expect(
      within(tileAt(container, 5)).getByRole('link', { name: /bluesky/i }).getAttribute('href'),
    ).toBe(BLUESKY_HREF)
  })

  it('renders the About tiles as buttons, not links', () => {
    const { container } = render(<FaceIV />)
    expect(within(tileAt(container, 0)).queryByRole('link')).toBeNull()
    expect(within(tileAt(container, 1)).queryByRole('link')).toBeNull()
  })
})

describe('FaceIV clue hook', () => {
  it('emits exactly one clue matching MOVES for face IV', () => {
    const { container } = render(<FaceIV />)
    const clues = container.querySelectorAll('[data-clue-order]')
    expect(clues.length).toBe(1)
    expect(clues[0].getAttribute('data-clue-order')).toBe(String(FACE_IV_MOVE.order))
    expect(clues[0].getAttribute('data-clue-direction')).toBe(FACE_IV_MOVE.direction)
  })

  it('renders the order piece as one tally stroke per move order and the direction piece as the derived letter', () => {
    const { container } = render(<FaceIV />)
    const strokes = container.querySelectorAll('.face4-clue__order .face4-tally__path')
    expect(strokes.length).toBe(FACE_IV_MOVE.order)
    const directionPiece = container.querySelector('[data-clue-piece="direction"]')
    expect(directionPiece.textContent).toBe(directionLetter(FACE_IV_MOVE.direction))
  })
})
