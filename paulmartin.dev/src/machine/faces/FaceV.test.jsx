import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import FaceV from './FaceV.jsx'
import { SEQUENCE, moveByOrder } from '../model.js'

// FaceV's own lock/reveal logic is under test here, not audio (covered by
// audio.test.jsx), so audio.jsx is replaced with inert no-ops.
vi.mock('../audio.jsx', () => ({
  useAudio: () => ({
    playArtifactBurst: () => {},
    playLidOpen: () => {},
    playPowerup: () => {},
    startGears: () => {},
    stopGears: () => {},
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
  return Array.from(container.querySelectorAll('.face5-pad__button'))
}

function pressArrow(container, direction) {
  const button = container.querySelector(`[aria-label="${direction}"]`)
  expect(button, `arrow button for ${direction} exists`).not.toBeNull()
  fireEvent.click(button)
}

// The lock wrapper is the .face5-slab; it is solved when its data-stage is
// "open" (there is no data-solved attribute anymore).
function lockWrapper(container) {
  const el = container.querySelector('.face5-slab')
  expect(el, 'lock wrapper .face5-slab exists').not.toBeNull()
  return el
}

function isSolved(container) {
  return lockWrapper(container).getAttribute('data-stage') === 'open'
}

describe('FaceV arrow pad', () => {
  it('renders exactly four arrow buttons, one per direction, selected by aria-label, each an image key', () => {
    const { container } = render(<FaceV />)
    const buttons = arrowButtons(container)
    expect(buttons.length).toBe(4)
    const directions = buttons.map((b) => b.getAttribute('aria-label')).sort()
    expect(directions).toEqual(['Down', 'Left', 'Right', 'Up'])
    buttons.forEach((b) => {
      // The key is a painted PNG face, not a glyph rendered from DIRECTION_GLYPH.
      expect(b.querySelector('img')).not.toBeNull()
      expect(b.textContent).toBe('')
    })
  })
})

describe('FaceV sequence lock (sliding window)', () => {
  it('solves on the full correct SEQUENCE: stage opens and the drive can be taken', () => {
    const { container, getByLabelText } = render(<FaceV />)
    SEQUENCE.forEach((direction) => pressArrow(container, direction))
    expect(isSolved(container)).toBe(true)
    expect(lockWrapper(container).getAttribute('data-lock-progress')).toBe(
      String(SEQUENCE.length),
    )
    expect(getByLabelText('Take the drive')).toBeTruthy()
  })

  it('garbage presses followed by the full SEQUENCE still solve (the window matches the trailing presses)', () => {
    const { container } = render(<FaceV />)
    // Mistimed / wrong presses first: the lock no longer hard-resets on a bad press.
    ;['Down', 'Left', 'Down'].forEach((d) => pressArrow(container, d))
    expect(isSolved(container)).toBe(false)
    SEQUENCE.forEach((direction) => pressArrow(container, direction))
    expect(isSolved(container)).toBe(true)
  })

  it('an incomplete SEQUENCE does not solve, but shows partial progress', () => {
    const { container } = render(<FaceV />)
    const partial = SEQUENCE.slice(0, SEQUENCE.length - 1)
    partial.forEach((direction) => pressArrow(container, direction))
    expect(isSolved(container)).toBe(false)
    expect(lockWrapper(container).getAttribute('data-lock-progress')).toBe(
      String(partial.length),
    )
  })

  it('one Up press from a fresh state advances progress to 1 (Up opens SEQUENCE)', () => {
    const { container } = render(<FaceV />)
    pressArrow(container, 'Up')
    expect(lockWrapper(container).getAttribute('data-lock-progress')).toBe('1')
  })

  it('an extra press after solving leaves the open stage unchanged', () => {
    const { container } = render(<FaceV />)
    SEQUENCE.forEach((direction) => pressArrow(container, direction))
    expect(isSolved(container)).toBe(true)
    pressArrow(container, SEQUENCE[0])
    expect(isSolved(container)).toBe(true)
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
