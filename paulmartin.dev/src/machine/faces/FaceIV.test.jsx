import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent, within } from '@testing-library/react'
import FaceIV from './FaceIV.jsx'
import { MOVES, moveByOrder } from '../model.js'
import { DIRECTION_GLYPH } from '../Clue.jsx'

const { mockPlay } = vi.hoisted(() => ({ mockPlay: vi.fn() }))

// FaceIV's own slide/tile logic is under test here, not audio arming or
// synthesis (covered by audio.test.jsx), so audio.jsx is replaced with a bare
// play() spy.
vi.mock('../audio.jsx', () => ({
  useAudio: () => ({
    play: mockPlay,
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
const GITHUB_HREF = 'https://github.com/pmartin36'

function cellsInfo(container) {
  return Array.from(container.querySelectorAll('[data-cell]')).map((el) => ({
    index: Number(el.getAttribute('data-cell')),
    gap: el.getAttribute('data-gap') === 'true',
    kind: el.getAttribute('data-tile-kind'),
    text: el.textContent,
  }))
}

function cellAt(container, index) {
  const cell = container.querySelector(`[data-cell="${index}"]`)
  expect(cell, `cell ${index} exists`).not.toBeNull()
  return cell
}

beforeEach(() => {
  mockPlay.mockClear()
})

afterEach(() => {
  cleanup()
})

describe('FaceIV initial layout', () => {
  it('renders 6 cells: About, About, gap, Email, LinkedIn, GitHub, with the gap at cell 2', () => {
    const { container } = render(<FaceIV />)
    const cells = cellsInfo(container)
    expect(cells.length).toBe(6)
    expect(cells.map((c) => c.gap)).toEqual([false, false, true, false, false, false])
    expect(cells[0].kind).toBe('about')
    expect(cells[1].kind).toBe('about')
    expect(cells[3].kind).toBe('contact')
    expect(cells[4].kind).toBe('contact')
    expect(cells[5].kind).toBe('contact')
  })
})

describe('FaceIV slide legality', () => {
  it('slides a tile adjacent to the gap (About at cell 1) into the gap', () => {
    const { container } = render(<FaceIV />)
    const before = cellsInfo(container)
    const tile = within(cellAt(container, 1)).getByRole('button', { name: /about/i })

    fireEvent.click(tile)

    const after = cellsInfo(container)
    expect(after[1].gap).toBe(true)
    expect(after[2].gap).toBe(false)
    expect(after[2].kind).toBe('about')
    expect(after.filter((c, i) => i !== 1 && i !== 2)).toEqual(
      before.filter((c, i) => i !== 1 && i !== 2),
    )
  })

  it('slides a tile adjacent to the gap (GitHub at cell 5) into the gap', () => {
    const { container } = render(<FaceIV />)
    const tile = within(cellAt(container, 5)).getByRole('link', { name: /github/i })

    fireEvent.click(tile)

    const after = cellsInfo(container)
    expect(after[5].gap).toBe(true)
    expect(after[2].gap).toBe(false)
    expect(after[2].kind).toBe('contact')
  })

  it('leaves the arrangement unchanged when a non-adjacent tile is clicked (About at cell 0)', () => {
    const { container } = render(<FaceIV />)
    const before = cellsInfo(container)
    const tile = within(cellAt(container, 0)).getByRole('button', { name: /about/i })

    fireEvent.click(tile)

    expect(cellsInfo(container)).toEqual(before)
  })

  it('leaves the arrangement unchanged when a non-adjacent contact tile is clicked (Email at cell 3)', () => {
    const { container } = render(<FaceIV />)
    const before = cellsInfo(container)
    const tile = within(cellAt(container, 3)).getByRole('link', { name: /email/i })

    fireEvent.click(tile)

    expect(cellsInfo(container)).toEqual(before)
  })
})

describe('FaceIV contact tiles', () => {
  it('links to the expected Email, LinkedIn, and GitHub URLs', () => {
    const { container } = render(<FaceIV />)
    expect(
      within(cellAt(container, 3)).getByRole('link', { name: /email/i }).getAttribute('href'),
    ).toBe(EMAIL_HREF)
    expect(
      within(cellAt(container, 4)).getByRole('link', { name: /linkedin/i }).getAttribute('href'),
    ).toBe(LINKEDIN_HREF)
    expect(
      within(cellAt(container, 5)).getByRole('link', { name: /github/i }).getAttribute('href'),
    ).toBe(GITHUB_HREF)
  })

  it('renders the About tiles as buttons, not links', () => {
    const { container } = render(<FaceIV />)
    expect(within(cellAt(container, 0)).queryByRole('link')).toBeNull()
    expect(within(cellAt(container, 1)).queryByRole('link')).toBeNull()
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

  it('renders the order piece as one tally stroke per move order and the direction piece as the derived glyph', () => {
    const { container } = render(<FaceIV />)
    const strokes = container.querySelectorAll('.face4-clue__order .face4-tally__stroke')
    expect(strokes.length).toBe(moveByOrder(5).order)
    const directionPiece = container.querySelector('[data-clue-piece="direction"]')
    expect(directionPiece.textContent).toBe(DIRECTION_GLYPH[FACE_IV_MOVE.direction])
  })
})
