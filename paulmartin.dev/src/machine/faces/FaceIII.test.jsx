import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import FaceIII from './FaceIII.jsx'
import { directionLetter } from '../Clue.jsx'
import { moveByOrder } from '../model.js'
import { WINNING } from '../seamGlyphs.js'

const { mockPlay } = vi.hoisted(() => ({ mockPlay: vi.fn() }))

// FaceIII's own reel/clue logic is under test here, not audio arming or
// synthesis (covered by audio.test.jsx), so audio.jsx is replaced with a bare
// play() spy.
vi.mock('../audio.jsx', () => ({
  useAudio: () => ({
    play: mockPlay,
    playDetailOpen: () => {},
    playDetailClose: () => {},
    muted: false,
    armed: true,
    toggleMute: () => {},
    mute: () => {},
    unmute: () => {},
    arm: () => {},
  }),
}))

function reelButtons(container) {
  return Array.from(container.querySelectorAll('[data-reel]'))
}

function facesOf(reel) {
  return Array.from(reel.querySelectorAll('[data-reel-face]'))
}

beforeEach(() => {
  mockPlay.mockClear()
})

afterEach(() => {
  cleanup()
})

describe('FaceIII reels — mount', () => {
  it('renders exactly three reel spin buttons, each at position 0', () => {
    const { container } = render(<FaceIII />)
    const reels = reelButtons(container)
    expect(reels.length).toBe(3)
    reels.forEach((reel) => {
      expect(reel.getAttribute('data-position')).toBe('0')
    })
  })
})

describe('FaceIII reels — spin advances and wraps, independently', () => {
  ;[0, 1, 2].forEach((reelIndex) => {
    it(`tapping reel ${reelIndex} three times cycles its position 1, 2, 0 and leaves the other reels untouched`, () => {
      const { container } = render(<FaceIII />)
      const reels = reelButtons(container)
      const target = reels[reelIndex]
      const others = reels.filter((_, i) => i !== reelIndex)
      const otherStartPositions = others.map((r) => r.getAttribute('data-position'))

      const expectedPositions = ['1', '2', '0']
      expectedPositions.forEach((expected) => {
        fireEvent.click(target)
        expect(target.getAttribute('data-position')).toBe(expected)
      })

      others.forEach((r, i) => {
        expect(r.getAttribute('data-position')).toBe(otherStartPositions[i])
      })
    })
  })
})

describe('FaceIII reels — blank third face', () => {
  it('every reel has a blank face at index 2', () => {
    const { container } = render(<FaceIII />)
    const reels = reelButtons(container)
    expect(reels.length).toBe(3)
    reels.forEach((reel) => {
      const faces = facesOf(reel)
      expect(faces.length).toBe(3)
      expect(faces[2].getAttribute('data-blank')).toBe('true')
    })
  })

  it('reel 3 (index 2) has all three faces blank', () => {
    const { container } = render(<FaceIII />)
    const reels = reelButtons(container)
    const reel3 = reels[2]
    const faces = facesOf(reel3)
    faces.forEach((face) => {
      expect(face.getAttribute('data-blank')).toBe('true')
    })
  })
})

describe('FaceIII reels — content', () => {
  it('reel 1 shows Stargazer and Pong on its non-blank faces', () => {
    const { container } = render(<FaceIII />)
    const reel1 = reelButtons(container)[0]
    expect(reel1.textContent).toContain('Stargazer')
    expect(reel1.textContent).toContain('Pong')
  })

  it('reel 2 shows The 16 Spaces and Solar Express on its non-blank faces', () => {
    const { container } = render(<FaceIII />)
    const reel2 = reelButtons(container)[1]
    expect(reel2.textContent).toContain('The 16 Spaces')
    expect(reel2.textContent).toContain('Solar Express')
  })
})

describe('FaceIII clue — move 6 (colored digit + paired letter)', () => {
  it('renders a clue hook at order 6, matching MOVES direction Left, without spinning any reel', () => {
    const { container } = render(<FaceIII />)
    const hook = container.querySelector('[data-clue-order="6"]')
    expect(hook).toBeTruthy()
    expect(hook.getAttribute('data-clue-direction')).toBe('Left')
    expect(hook.textContent).toContain('6')
    expect(mockPlay).not.toHaveBeenCalled()
  })

  it('the paired direction letter is derived from the same MOVES entry as the hook and shares its tint class', () => {
    const { container } = render(<FaceIII />)
    const hook = container.querySelector('[data-clue-order="6"]')
    const tintClass = Array.from(hook.classList).find((c) => c.includes('tint'))
    expect(tintClass).toBeTruthy()

    const letterEl = Array.from(container.querySelectorAll(`.${tintClass}`)).find(
      (el) => el !== hook,
    )
    expect(letterEl).toBeTruthy()
    expect(letterEl.textContent.trim()).toBe(directionLetter(moveByOrder(6).direction))
  })
})

describe('FaceIII seam-glyph edges — every face etched', () => {
  it('every reel face renders a left and right edge mark, behind content and hidden from AT', () => {
    const { container } = render(<FaceIII />)
    const faces = Array.from(container.querySelectorAll('[data-reel-face]'))
    expect(faces.length).toBe(9)
    faces.forEach((face) => {
      const left = face.querySelector('[data-edge="left"]')
      const right = face.querySelector('[data-edge="right"]')
      expect(left).toBeTruthy()
      expect(right).toBeTruthy()
      expect(left.getAttribute('aria-hidden')).toBe('true')
      expect(right.getAttribute('aria-hidden')).toBe('true')
    })
  })
})

describe('FaceIII clue — move 2 (seam-glyph alignment)', () => {
  it('renders a clue hook at order 2, matching MOVES direction Right, without spinning any reel', () => {
    const { container } = render(<FaceIII />)
    const hook = container.querySelector('[data-clue-order="2"]')
    expect(hook).toBeTruthy()
    expect(hook.getAttribute('data-clue-direction')).toBe('Right')
  })

  it('spinning to the winning combination shows the aligned/clean-read state', () => {
    const { container } = render(<FaceIII />)
    const reels = reelButtons(container)
    WINNING.positions.forEach((target, reelIndex) => {
      for (let clicks = 0; clicks < target; clicks++) {
        fireEvent.click(reels[reelIndex])
      }
    })
    const seamClue = container.querySelector('.face3-seam-clue')
    expect(seamClue).toBeTruthy()
    expect(seamClue.className).toContain('face3-seam-clue--aligned')
  })

  it('a non-winning combination does not show the aligned/clean-read state', () => {
    const { container } = render(<FaceIII />)
    const reels = reelButtons(container)
    WINNING.positions.forEach((target, reelIndex) => {
      for (let clicks = 0; clicks < target; clicks++) {
        fireEvent.click(reels[reelIndex])
      }
    })
    // one more click moves reel 0 off the winning position while the other
    // two reels stay put, so the combination as a whole is no longer winning
    fireEvent.click(reels[0])
    const seamClue = container.querySelector('.face3-seam-clue')
    expect(seamClue).toBeTruthy()
    expect(seamClue.className).not.toContain('face3-seam-clue--aligned')
  })
})
