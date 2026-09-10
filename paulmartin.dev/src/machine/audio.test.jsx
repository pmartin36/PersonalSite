import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react'
import { AudioProvider, useAudio, MuteToggle } from './audio.jsx'

function makeSpyNode(state) {
  const node = {}
  node.connect = vi.fn(() => node)
  node.start = vi.fn()
  node.stop = vi.fn()
  node.playbackRate = { value: 1 }
  node.gain = {
    value: 1,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
  }
  state.nodes.push(node)
  return node
}

// jsdom has no AudioContext; install a spy constructor on window so the
// arming/synthesis paths are observable without real WebAudio.
function installMockAudioContext() {
  const state = { nodes: [], instances: [] }
  class MockAudioContext {
    constructor() {
      this.destination = {}
      this.currentTime = 0
      this.resume = vi.fn(() => Promise.resolve())
      state.instances.push(this)
    }
    createOscillator() {
      return makeSpyNode(state)
    }
    createGain() {
      return makeSpyNode(state)
    }
    createBufferSource() {
      return makeSpyNode(state)
    }
    createBuffer() {
      return { getChannelData: () => new Float32Array(1) }
    }
    decodeAudioData() {
      return Promise.resolve({ sampleRate: 44100, duration: 1 })
    }
  }
  const ctor = vi.fn(function (...args) {
    return new MockAudioContext(...args)
  })
  window.AudioContext = ctor
  window.webkitAudioContext = ctor
  return { ctor, state }
}

function Probe({ captureRef }) {
  const audio = useAudio()
  captureRef.current = audio
  return (
    <div>
      <span data-testid="muted">{String(audio.muted)}</span>
      <span data-testid="armed">{String(audio.armed)}</span>
    </div>
  )
}

let mock

// Default: sample loading fails fast (fetch rejects) so the synth-focused tests
// below never touch the network and never create sample nodes. The sample-
// playback suite installs its own resolving fetch.
beforeEach(() => {
  mock = installMockAudioContext()
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network in test'))))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  delete window.AudioContext
  delete window.webkitAudioContext
})

describe('AudioProvider / useAudio defaults', () => {
  it('defaults to muted and unarmed on mount', () => {
    const ref = { current: null }
    render(
      <AudioProvider>
        <Probe captureRef={ref} />
      </AudioProvider>
    )
    expect(screen.getByTestId('muted').textContent).toBe('true')
    expect(screen.getByTestId('armed').textContent).toBe('false')
  })

  it('useAudio without a provider is a safe no-op default', () => {
    const ref = { current: null }
    render(<Probe captureRef={ref} />)
    expect(screen.getByTestId('muted').textContent).toBe('true')
    expect(screen.getByTestId('armed').textContent).toBe('false')
    expect(() => ref.current.playTurn(0)).not.toThrow()
    expect(() => ref.current.playIntroSpin()).not.toThrow()
    expect(() => ref.current.playArtifactBurst()).not.toThrow()
    expect(() => ref.current.playLidOpen()).not.toThrow()
    expect(() => ref.current.playPowerup()).not.toThrow()
    expect(() => ref.current.startGears()).not.toThrow()
    expect(() => ref.current.stopGears()).not.toThrow()
    expect(() => ref.current.playMuteClick()).not.toThrow()
    expect(() => ref.current.playDetailOpen()).not.toThrow()
    expect(() => ref.current.playDetailClose()).not.toThrow()
    expect(() => ref.current.playReelSpin()).not.toThrow()
    expect(() => ref.current.playTileSlide()).not.toThrow()
    expect(() => ref.current.playCardFlip()).not.toThrow()
  })
})

describe('gesture arming', () => {
  it('the first window gesture arms audio and constructs+resumes the AudioContext', () => {
    const ref = { current: null }
    render(
      <AudioProvider>
        <Probe captureRef={ref} />
      </AudioProvider>
    )
    expect(mock.ctor).not.toHaveBeenCalled()
    fireEvent(window, new Event('pointerdown'))
    expect(mock.ctor).toHaveBeenCalledTimes(1)
    expect(mock.state.instances[0].resume).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('armed').textContent).toBe('true')
  })

  it('a second gesture does not construct a second AudioContext', () => {
    const ref = { current: null }
    render(
      <AudioProvider>
        <Probe captureRef={ref} />
      </AudioProvider>
    )
    fireEvent(window, new Event('pointerdown'))
    fireEvent(window, new Event('keydown'))
    expect(mock.ctor).toHaveBeenCalledTimes(1)
  })
})

describe('master gain / mute', () => {
  it('routes through a master gain and drops it to 0 on mute (silences everything in-flight)', () => {
    const ref = { current: null }
    render(
      <AudioProvider>
        <Probe captureRef={ref} />
        <MuteToggle />
      </AudioProvider>
    )
    fireEvent(window, new Event('pointerdown'))
    // arm() creates the master gain first; it's the first node.
    const master = mock.state.nodes[0]
    // Toggle unmute then mute via the button so React flushes the gain effect.
    const btn = screen.getByRole('button', { name: /audio/i })
    fireEvent.click(btn) // unmute
    fireEvent.click(btn) // mute
    const last = master.gain.setTargetAtTime.mock.calls.at(-1)
    expect(last && last[0]).toBe(0)
  })

})

describe('sample playback (turn / intro / jungle)', () => {
  // A resolving fetch so arm() can decode the mp3s into buffers. The mock
  // AudioContext's decodeAudioData resolves synchronously-ish, so buffers land
  // shortly after arming; waitFor bridges the microtasks.
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }))
    )
  })

  function renderArmedUnmuted() {
    const ref = { current: null }
    render(
      <AudioProvider>
        <Probe captureRef={ref} />
        <MuteToggle />
      </AudioProvider>
    )
    // One toggle click both arms the context and unmutes.
    fireEvent.click(screen.getByRole('button', { name: /unmute audio/i }))
    return ref
  }

  it('playTurn(n) plays the decoded turn sample through a buffer source once loaded', async () => {
    const ref = renderArmedUnmuted()
    await waitFor(() => {
      ref.current.playTurn(0)
      const source = mock.state.nodes.find((n) => n.buffer)
      expect(source).toBeTruthy()
      expect(source.start).toHaveBeenCalled()
    })
  })

  it('playArtifactBurst plays the decoded burst sample through a buffer source once loaded', async () => {
    const ref = renderArmedUnmuted()
    await waitFor(() => {
      ref.current.playArtifactBurst()
      const source = mock.state.nodes.find((n) => n.buffer)
      expect(source).toBeTruthy()
      expect(source.start).toHaveBeenCalled()
    })
  })

  it('playTurn / playIntroSpin / playArtifactBurst are no-ops while muted', async () => {
    const ref = { current: null }
    render(
      <AudioProvider>
        <Probe captureRef={ref} />
      </AudioProvider>
    )
    // Arm without unmuting: still muted.
    fireEvent(window, new Event('pointerdown'))
    // Let any sample loading settle.
    await waitFor(() => expect(mock.state.instances.length).toBe(1))
    const before = mock.state.nodes.length
    ref.current.playTurn(2)
    ref.current.playIntroSpin()
    ref.current.playArtifactBurst()
    expect(mock.state.nodes.length).toBe(before)
  })

  it('playTurn ignores an out-of-range face index', async () => {
    const ref = renderArmedUnmuted()
    // Wait until samples are loaded (a valid turn would produce a source).
    await waitFor(() => {
      ref.current.playTurn(0)
      expect(mock.state.nodes.find((n) => n.buffer)).toBeTruthy()
    })
    const before = mock.state.nodes.length
    ref.current.playTurn(9)
    ref.current.playTurn(-1)
    expect(mock.state.nodes.length).toBe(before)
  })

  it('the jungle bed starts looping once armed and unmuted, and stops on mute', async () => {
    render(
      <AudioProvider>
        <MuteToggle />
      </AudioProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /unmute audio/i }))
    let loopNode
    await waitFor(() => {
      loopNode = mock.state.nodes.find((n) => n.loop === true)
      expect(loopNode).toBeTruthy()
    })
    expect(loopNode.start).toHaveBeenCalled()
    // Muting stops the loop.
    fireEvent.click(screen.getByRole('button', { name: /mute audio/i }))
    expect(loopNode.stop).toHaveBeenCalled()
  })

  it('playIntroSpin(offset) starts the sample partway in (reveal mid-spin, not replay)', async () => {
    const ref = renderArmedUnmuted()
    await waitFor(() => {
      ref.current.playIntroSpin(0.5)
      const src = mock.state.nodes.find(
        (n) => n.buffer && n.start.mock.calls.some((c) => c[1] === 0.5)
      )
      expect(src).toBeTruthy()
    })
  })

  it('startGears loops the idle bed and stopGears ends it', async () => {
    const ref = renderArmedUnmuted()
    // Wait until samples are decoded (the jungle bed loop is running).
    await waitFor(() => expect(mock.state.nodes.some((n) => n.loop === true)).toBe(true))
    const before = mock.state.nodes.filter((n) => n.loop === true).length
    act(() => ref.current.startGears())
    let gears
    await waitFor(() => {
      const loops = mock.state.nodes.filter((n) => n.loop === true)
      expect(loops.length).toBe(before + 1)
      gears = loops[loops.length - 1]
    })
    expect(gears.start).toHaveBeenCalled()
    act(() => ref.current.stopGears())
    expect(gears.stop).toHaveBeenCalled()
  })

  it('ignition cuts the jungle bed and Wake up (exit) resumes it', async () => {
    const ref = renderArmedUnmuted()
    let loopNode
    await waitFor(() => {
      loopNode = mock.state.nodes.find((n) => n.loop === true)
      expect(loopNode).toBeTruthy()
    })
    // The crystal detonates: the bed cuts out under it.
    act(() => ref.current.enterIgnition())
    expect(loopNode.stop).toHaveBeenCalled()
    // Wake up: a fresh loop node starts (the old one is spent).
    act(() => ref.current.exitIgnition())
    await waitFor(() => {
      const running = mock.state.nodes.filter(
        (n) => n.loop === true && !n.stop.mock.calls.length
      )
      expect(running.length).toBe(1)
    })
  })

  it('does not double-start the jungle bed across re-mute/unmute churn', async () => {
    render(
      <AudioProvider>
        <MuteToggle />
      </AudioProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /unmute audio/i }))
    await waitFor(() => {
      expect(mock.state.nodes.filter((n) => n.loop === true).length).toBe(1)
    })
    // Mute then unmute: at most one live loop node should be running at a time.
    fireEvent.click(screen.getByRole('button', { name: /mute audio/i }))
    fireEvent.click(screen.getByRole('button', { name: /unmute audio/i }))
    await waitFor(() => {
      const running = mock.state.nodes.filter(
        (n) => n.loop === true && !n.stop.mock.calls.length
      )
      expect(running.length).toBe(1)
    })
  })
})

describe('MuteToggle', () => {
  it('is a real button whose click arms audio and flips the aria-label to muted-state', () => {
    render(<AudioProvider><MuteToggle /></AudioProvider>)
    screen.getByRole('button', { name: /unmute audio/i })
    fireEvent.click(screen.getByRole('button', { name: /unmute audio/i }))
    expect(mock.ctor).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /mute audio/i })).toBeInTheDocument()
  })
})
