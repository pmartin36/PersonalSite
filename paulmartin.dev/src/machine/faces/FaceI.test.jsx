import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import FaceI from './FaceI.jsx'
import { RESUME_URL, MOVES } from '../model.js'
import { faceIndex } from '../Machine.jsx'

const { mockRotateTo } = vi.hoisted(() => ({ mockRotateTo: vi.fn() }))

// FaceI's Contact button drives the shell's rotateTo; the shell itself
// (tumble/snap/audio) is covered elsewhere, so only useMachine is replaced
// here. faceIndex/FACES stay real so the asserted target index is genuine.
vi.mock('../Machine.jsx', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useMachine: () => ({ rotateTo: mockRotateTo, currentFace: 0, faceCount: 5 }),
  }
})

const FACE_I_MOVE = MOVES.find((m) => m.faceId === 'I')

beforeEach(() => {
  mockRotateTo.mockClear()
})

afterEach(() => {
  cleanup()
})

describe('FaceI name', () => {
  it('renders the name "Paul Martin" as the document h1', () => {
    render(<FaceI />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toBe('Paul Martin')
  })
})

describe('FaceI resume link', () => {
  it('links to the shared RESUME_URL export and opens in a new tab', () => {
    render(<FaceI />)
    const link = screen.getByRole('link', { name: /resume/i })
    expect(link.getAttribute('href')).toBe(RESUME_URL)
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('underlines only the etched "resume" character at the clue order position', () => {
    render(<FaceI />)
    const link = screen.getByRole('link', { name: /resume/i })
    const letters = within(link).getAllByText(/^[a-z]$/)
    expect(letters.map((el) => el.textContent).join('')).toBe('resume')

    const tellIndex = FACE_I_MOVE.order - 1
    letters.forEach((el, i) => {
      expect(el.className.includes('tell')).toBe(i === tellIndex)
    })
    expect(letters[tellIndex].textContent).toBe('u')
  })
})

describe('FaceI clue hook', () => {
  it('emits exactly one clue matching MOVES for face I', () => {
    const { container } = render(<FaceI />)
    const clues = container.querySelectorAll('[data-clue-order]')
    expect(clues.length).toBe(1)
    expect(clues[0].getAttribute('data-clue-order')).toBe(String(FACE_I_MOVE.order))
    expect(clues[0].getAttribute('data-clue-direction')).toBe(FACE_I_MOVE.direction)
  })
})

describe('FaceI contact button', () => {
  it('rotates the shell to face IV on click', () => {
    render(<FaceI />)
    const button = screen.getByRole('button', { name: /contact/i })
    fireEvent.click(button)
    expect(mockRotateTo).toHaveBeenCalledWith(faceIndex('IV'))
  })
})
