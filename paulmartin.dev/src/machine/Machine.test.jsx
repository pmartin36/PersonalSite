import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Machine, { wrapIndex, stepDelta, faceIndex, FACES } from './Machine.jsx'

const { mockPlay, mockPlayTurn, mockPlayIntroSpin } = vi.hoisted(() => ({
  mockPlay: vi.fn(),
  mockPlayTurn: vi.fn(),
  // Returns a truthy node like the real playIntroSpin, so the shell's play-once
  // guard trips on the first successful call.
  mockPlayIntroSpin: vi.fn(() => ({})),
}))

// The shell's own rotateTo/intro audio routing is under test here, not
// AudioProvider's arming/synthesis + sample loading (covered by audio.test.jsx),
// so audio.jsx is replaced with bare spies for each trigger point.
vi.mock('./audio.jsx', () => ({
  AudioProvider: ({ children }) => children,
  useAudio: () => ({
    play: mockPlay,
    playTurn: mockPlayTurn,
    playIntroSpin: mockPlayIntroSpin,
    // FaceV (rendered inside Machine) reaches for these; no-ops here since audio
    // is covered by audio.test.jsx.
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
  MuteToggle: () => null,
}))

// Faces reach for react-router (DetailModal renders <Link>), so mount the shell
// inside a router context.
function renderMachine() {
  return render(
    <MemoryRouter>
      <Machine />
    </MemoryRouter>,
  )
}

function mockMatchMedia(matches) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

beforeEach(() => {
  mockPlay.mockClear()
  mockPlayTurn.mockClear()
  mockPlayIntroSpin.mockClear()
})

afterEach(() => {
  cleanup()
  delete window.matchMedia
  vi.useRealTimers()
})

describe('rotation helpers', () => {
  it('wrapIndex wraps forward and backward around the five-face drum', () => {
    expect(wrapIndex(5)).toBe(0)
    expect(wrapIndex(-1)).toBe(4)
  })

  it('stepDelta gives the shortest signed step, including forward wrap-around', () => {
    expect(stepDelta(4, 0)).toBe(1)
    expect(stepDelta(0, 4)).toBe(-1)
    expect(stepDelta(0, 3)).toBe(-2)
  })

  it('faceIndex maps a face id to its drum index and throws for an unknown id', () => {
    expect(faceIndex('IV')).toBe(3)
    expect(faceIndex('I')).toBe(0)
    expect(() => faceIndex('X')).toThrow()
  })

  it('FACES lists the five face ids in drum order', () => {
    expect(FACES).toEqual(['I', 'II', 'III', 'IV', 'V'])
  })
})

describe('Machine shell — mount', () => {
  it('renders all five faces as regions, in DOM order', () => {
    render(<Machine />)
    const regions = screen.queryAllByRole('region')
    expect(regions.map((r) => r.getAttribute('aria-label'))).toEqual([
      'Face I',
      'Face II',
      'Face III',
      'Face IV',
      'Face V',
    ])
  })

  it('rests on Face I: its pip is lit and its region is the active face', () => {
    const { container } = render(<Machine />)
    const pips = container.querySelectorAll('.machine__pip')
    expect(pips[0]?.getAttribute('aria-current')).toBe('true')
    expect(
      container.querySelector('.machine__face--I')?.classList.contains('machine__face--active')
    ).toBe(true)
  })

  it('plays the one-shot intro-spin sample once under motion, never a turn', async () => {
    mockMatchMedia(false)
    renderMachine()
    await waitFor(() => {
      expect(mockPlayIntroSpin).toHaveBeenCalledTimes(1)
    })
    // The intro-spin sample covers the whole run-up + landing, so no per-face
    // turn sound fires for the opening spin.
    expect(mockPlayTurn).not.toHaveBeenCalled()
    expect(mockPlay).not.toHaveBeenCalledWith('snap')
  })
})

describe('Machine shell — rotateTo via wayfinding pips', () => {
  it('clicking a pip brings the matching face to front and lights that pip', () => {
    const { container } = render(<Machine />)
    mockPlay.mockClear()
    const pips = container.querySelectorAll('.machine__pip')
    expect(pips.length).toBe(5)
    fireEvent.click(pips[3])
    expect(pips[3].getAttribute('aria-current')).toBe('true')
    expect(pips[0].getAttribute('aria-current')).not.toBe('true')
    expect(
      container.querySelector('.machine__face--IV')?.classList.contains('machine__face--active')
    ).toBe(true)
  })

  it('every rotateTo settle fires the destination-face turn sample, not the old snap', () => {
    // Reduced motion: no opening spin, so rotateTo is free from mount and the
    // settle timer fires immediately (no intro fake-timer plumbing needed).
    mockMatchMedia(true)
    const { container } = renderMachine()
    mockPlay.mockClear()
    mockPlayTurn.mockClear()
    const pips = container.querySelectorAll('.face-pip')
    // Five faces, each rendering the five-pip wayfinding nav.
    expect(pips.length).toBe(FACES.length * FACES.length)
    vi.useFakeTimers()
    // Face I's fourth pip targets drum index 3 (Face IV).
    fireEvent.click(pips[3])
    vi.advanceTimersByTime(1000)
    expect(mockPlayTurn).toHaveBeenCalledTimes(1)
    expect(mockPlayTurn).toHaveBeenCalledWith(3)
    expect(mockPlay).not.toHaveBeenCalledWith('snap')
  })
})

describe('Machine shell — reduced motion', () => {
  it('takes the static crossfade path: no intro thunk/snap, all five faces still present in DOM order', () => {
    mockMatchMedia(true)
    const { container } = render(<Machine />)
    expect(container.querySelector('[data-reduced]')).not.toBeNull()
    expect(mockPlay).not.toHaveBeenCalled()
    const regions = screen.queryAllByRole('region')
    expect(regions.map((r) => r.getAttribute('aria-label'))).toEqual([
      'Face I',
      'Face II',
      'Face III',
      'Face IV',
      'Face V',
    ])
  })
})
