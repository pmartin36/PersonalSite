import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FaceIII from './FaceIII.jsx'
import { directionLetter } from '../Clue.jsx'
import { MOVES } from '../model.js'

const { mockPlay } = vi.hoisted(() => ({ mockPlay: vi.fn() }))

// FaceIII's own reel/clue logic is under test here, not audio arming or
// synthesis (covered by audio.test.jsx), so audio.jsx is replaced with a bare
// play() spy.
vi.mock('../audio.jsx', () => ({
  useAudio: () => ({
    play: mockPlay,
    playReelSpin: () => {},
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

// Face III carries two of the lock's six moves. The seam move (order 5) is
// spelled by the half-glyph edges that meet across the reel gaps; the other
// Face III move is the gold colored-character clue gilded into the copy.
const SEAM_ORDER = 5
const COLORED_MOVE = MOVES.find((m) => m.faceId === 'III' && m.order !== SEAM_ORDER)
const CLUE_DIGIT = String(COLORED_MOVE.order)
const CLUE_LETTER = directionLetter(COLORED_MOVE.direction).toUpperCase()

// Projects reach for react-router (the plaque's <OrgTag> renders a <Link>), so
// mount inside a router.
function renderFace() {
  return render(
    <MemoryRouter>
      <FaceIII />
    </MemoryRouter>,
  )
}

function reels(container) {
  return Array.from(container.querySelectorAll('.face3-reel'))
}

function reelWindow(reel) {
  return reel.querySelector('.face3-reel__window')
}

function facesOf(reel) {
  return Array.from(reel.querySelectorAll('.face3-reel__face'))
}

// The wheel's rotation is carried in its transform: rotateX(60 * position deg).
function wheelRotation(reel) {
  const wheel = reel.querySelector('.face3-reel__wheel')
  const m = wheel.style.transform.match(/rotateX\(([-\d.]+)deg\)/)
  return Number(m[1])
}

beforeEach(() => {
  mockPlay.mockClear()
})

afterEach(() => {
  cleanup()
})

describe('FaceIII reels — mount', () => {
  it('renders exactly three reels, each a spinnable window', () => {
    const { container } = renderFace()
    const all = reels(container)
    expect(all.length).toBe(3)
    all.forEach((reel) => {
      const win = reelWindow(reel)
      expect(win).not.toBeNull()
      expect(win.getAttribute('role')).toBe('button')
      expect(win.getAttribute('aria-label')).toBe('Spin reel')
    })
  })

  it('each reel is a six-face wheel (its three entries repeated) with two blank faces', () => {
    const { container } = renderFace()
    reels(container).forEach((reel) => {
      const faces = facesOf(reel)
      expect(faces.length).toBe(6)
      const blanks = faces.filter((f) => f.classList.contains('face3-reel__face--blank'))
      expect(blanks.length).toBe(2)
    })
  })
})

describe('FaceIII reels — spin advances one step, independently', () => {
  ;[0, 1, 2].forEach((reelIndex) => {
    it(`clicking reel ${reelIndex} advances only its wheel by 60deg`, () => {
      const { container } = renderFace()
      const all = reels(container)
      const before = all.map(wheelRotation)

      fireEvent.click(reelWindow(all[reelIndex]))

      const after = all.map(wheelRotation)
      after.forEach((rot, i) => {
        if (i === reelIndex) expect(rot).toBe(before[i] + 60)
        else expect(rot).toBe(before[i])
      })
    })
  })
})

describe('FaceIII reels — content', () => {
  it('reel 0 shows Pong and Stargazer', () => {
    const { container } = renderFace()
    const reel = reels(container)[0]
    expect(reel.textContent).toContain('Pong')
    expect(reel.textContent).toContain('Stargazer')
  })

  it('reel 1 shows The 16 Spaces and Solar Express', () => {
    const { container } = renderFace()
    const reel = reels(container)[1]
    expect(reel.textContent).toContain('The 16 Spaces')
    expect(reel.textContent).toContain('Solar Express')
  })

  it('reel 2 shows Nuclear Reactor and Jam Games', () => {
    const { container } = renderFace()
    const reel = reels(container)[2]
    expect(reel.textContent).toContain('Nuclear Reactor')
    expect(reel.textContent).toContain('Jam Games')
  })
})

describe('FaceIII seam-glyph edges — every face etched', () => {
  it('every reel face renders a left and right seam half-glyph, hidden from AT', () => {
    const { container } = renderFace()
    const faces = Array.from(container.querySelectorAll('.face3-reel__face'))
    // Three reels, six faces each.
    expect(faces.length).toBe(18)
    faces.forEach((face) => {
      const left = face.querySelector('.face3-seam--left')
      const right = face.querySelector('.face3-seam--right')
      expect(left).toBeTruthy()
      expect(right).toBeTruthy()
      expect(left.getAttribute('aria-hidden')).toBe('true')
      expect(right.getAttribute('aria-hidden')).toBe('true')
    })
  })
})

describe('FaceIII colored-character clue', () => {
  it('gilds the order digit in the Pong headline, derived from the Face III colored move', () => {
    const { container } = renderFace()
    const orderClue = container.querySelector('.plaque__clue[data-clue-piece="order"]')
    expect(orderClue).toBeTruthy()
    expect(orderClue.textContent).toBe(CLUE_DIGIT)
  })

  it('gilds the paired direction letter in the Solar Express blurb, the same colored move', () => {
    const { container } = renderFace()
    const dirClue = container.querySelector('.plaque__clue[data-clue-piece="direction"]')
    expect(dirClue).toBeTruthy()
    expect(dirClue.textContent).toBe(CLUE_LETTER)
  })
})

describe('FaceIII onward call-to-action', () => {
  it('the middle reel carries the GitHub link out', () => {
    const { container } = renderFace()
    const link = container.querySelector('.face3-cta__logo-link')
    expect(link).toBeTruthy()
    expect(link.getAttribute('href')).toBe('https://github.com/pmartin36')
    expect(link.getAttribute('aria-label')).toBe('More projects on GitHub')
  })
})
