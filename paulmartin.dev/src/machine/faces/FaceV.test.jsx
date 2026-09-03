import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import FaceV from './FaceV.jsx'
import { SEQUENCE, moveByOrder } from '../model.js'
import { DIRECTION_GLYPH } from '../Clue.jsx'

// FaceV's own lock/reveal logic is under test here, not audio (covered by
// audio.test.jsx), so audio.jsx is replaced with inert no-ops.
vi.mock('../audio.jsx', () => ({
  useAudio: () => ({
    playArtifactBurst: () => {},
    enterIgnition: () => {},
    exitIgnition: () => {},
    muted: false,
    armed: true,
    toggleMute: () => {},
    mute: () => {},
    unmute: () => {},
    arm: () => {},
  }),
}))

const FACE_V_MOVE = moveByOrder(1)

afterEach(() => {
  cleanup()
})

function arrowButtons(container) {
  return Array.from(container.querySelectorAll('[data-direction]'))
}

function pressArrow(container, direction) {
  const button = container.querySelector(`[data-direction="${direction}"]`)
  expect(button, `arrow button for ${direction} exists`).not.toBeNull()
  fireEvent.click(button)
}

function lockWrapper(container) {
  const el = container.querySelector('[data-solved]')
  expect(el, 'lock wrapper with data-solved exists').not.toBeNull()
  return el
}

describe('FaceV arrow pad', () => {
  it('renders exactly four arrow buttons, one per direction, glyph derived from DIRECTION_GLYPH', () => {
    const { container } = render(<FaceV />)
    const buttons = arrowButtons(container)
    expect(buttons.length).toBe(4)
    const directions = buttons.map((b) => b.getAttribute('data-direction')).sort()
    expect(directions).toEqual(Object.keys(DIRECTION_GLYPH).sort())
    buttons.forEach((b) => {
      const dir = b.getAttribute('data-direction')
      expect(b.textContent).toBe(DIRECTION_GLYPH[dir])
    })
  })
})

describe('FaceV sequence lock', () => {
  it('solves on the full correct SEQUENCE and flips to the solved celebration', () => {
    const { container, getByText } = render(<FaceV />)
    SEQUENCE.forEach((direction) => pressArrow(container, direction))
    expect(lockWrapper(container).getAttribute('data-solved')).toBe('true')
    expect(getByText('You found the way through.')).toBeTruthy()
  })

  it('a wrong first press resets progress to 0 and does not solve', () => {
    const { container } = render(<FaceV />)
    const wrongFirst = Object.keys(DIRECTION_GLYPH).find((d) => d !== SEQUENCE[0])
    pressArrow(container, wrongFirst)
    expect(lockWrapper(container).getAttribute('data-lock-progress')).toBe('0')
    expect(lockWrapper(container).getAttribute('data-solved')).toBe('false')
  })

  it('a wrong press at step 3 resets progress to 0, even when it equals SEQUENCE[0]', () => {
    const { container } = render(<FaceV />)
    pressArrow(container, SEQUENCE[0])
    pressArrow(container, SEQUENCE[1])
    pressArrow(container, SEQUENCE[0])
    expect(lockWrapper(container).getAttribute('data-lock-progress')).toBe('0')
    expect(lockWrapper(container).getAttribute('data-solved')).toBe('false')
  })

  it('one Up press from a fresh state advances progress to 1 (the mashing gimme)', () => {
    const { container } = render(<FaceV />)
    pressArrow(container, 'Up')
    expect(lockWrapper(container).getAttribute('data-lock-progress')).toBe('1')
  })

  it('an extra press after solving leaves the solved state unchanged', () => {
    const { container } = render(<FaceV />)
    SEQUENCE.forEach((direction) => pressArrow(container, direction))
    expect(lockWrapper(container).getAttribute('data-solved')).toBe('true')
    pressArrow(container, SEQUENCE[0])
    expect(lockWrapper(container).getAttribute('data-solved')).toBe('true')
  })
})

describe('FaceV clue hook', () => {
  it('emits exactly one clue hook equal to MOVES order 1 (Up)', () => {
    const { container } = render(<FaceV />)
    const clues = container.querySelectorAll('[data-clue-order]')
    expect(clues.length).toBe(1)
    expect(clues[0].getAttribute('data-clue-order')).toBe(String(FACE_V_MOVE.order))
    expect(clues[0].getAttribute('data-clue-direction')).toBe(FACE_V_MOVE.direction)
  })
})
