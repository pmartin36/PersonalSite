import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import FaceII from './FaceII.jsx'
import { currentProjects } from '../../data/projects.js'

const { mockPlay } = vi.hoisted(() => ({ mockPlay: vi.fn() }))

// FaceII's own flip/Details logic is under test here, not audio arming or
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

function cardRoots(container) {
  return Array.from(container.querySelectorAll('[data-flipped]'))
}

function cornerButtons(card) {
  return Array.from(card.querySelectorAll('button[aria-pressed]'))
}

beforeEach(() => {
  mockPlay.mockClear()
})

afterEach(() => {
  cleanup()
})

describe('FaceII cards — mount', () => {
  it('renders one card per currentProjects entry, front-up', () => {
    const { container } = render(<FaceII />)
    const cards = cardRoots(container)
    expect(cards.length).toBe(currentProjects.length)
    for (const card of cards) {
      expect(card.getAttribute('data-flipped')).toBe('false')
    }
  })
})

describe('FaceII cards — flip state machine', () => {
  it('every card flips to its back then home via the corner control, playing flip audio on both transitions', () => {
    const { container } = render(<FaceII />)
    const cards = cardRoots(container)
    expect(cards.length).toBe(currentProjects.length)

    cards.forEach((card) => {
      let corners = cornerButtons(card)
      expect(corners.length).toBeGreaterThan(0)
      corners.forEach((b) => expect(b.getAttribute('aria-pressed')).toBe('false'))

      fireEvent.click(corners[0])
      expect(card.getAttribute('data-flipped')).toBe('true')
      corners = cornerButtons(card)
      corners.forEach((b) => expect(b.getAttribute('aria-pressed')).toBe('true'))

      fireEvent.click(corners[corners.length - 1])
      expect(card.getAttribute('data-flipped')).toBe('false')
    })
  })

  it('flipping a card does not open its detail modal', () => {
    const { container } = render(<FaceII />)
    const card = cardRoots(container)[0]
    expect(card).toBeTruthy()
    const corner = cornerButtons(card)[0]
    fireEvent.click(corner)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('FaceII cards — Details opens the matching project', () => {
  currentProjects.forEach((project, i) => {
    it(`card ${i} (${project.slug}) Details button opens the ${project.name} modal without flipping the card`, () => {
      const { container, unmount } = render(<FaceII />)
      const card = cardRoots(container)[i]
      expect(card).toBeTruthy()
      const detailsButton = within(card).getByRole('button', { name: /details/i })

      fireEvent.click(detailsButton)

      expect(screen.getByRole('dialog', { name: project.name })).toBeInTheDocument()
      expect(card.getAttribute('data-flipped')).toBe('false')
      unmount()
    })
  })
})

describe('FaceII clue', () => {
  it('renders exactly one clue hook, matching MOVES for face II (order 3, Left), displayed as "3L"', () => {
    const { container } = render(<FaceII />)
    const clues = container.querySelectorAll('[data-clue-order]')
    expect(clues.length).toBe(1)
    expect(clues[0].getAttribute('data-clue-order')).toBe('3')
    expect(clues[0].getAttribute('data-clue-direction')).toBe('Left')
    expect(clues[0].textContent).toBe('3L')
  })
})
