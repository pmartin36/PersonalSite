import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { AudioProvider, useAudio, MuteToggle, SOUNDS } from './audio.jsx'

function makeSpyNode(state) {
  const node = {}
  node.connect = vi.fn(() => node)
  node.start = vi.fn()
  node.stop = vi.fn()
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

beforeEach(() => {
  mock = installMockAudioContext()
})

afterEach(() => {
  cleanup()
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
    expect(() => ref.current.play('snap')).not.toThrow()
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

describe('play() guard', () => {
  it('is a no-op while muted, even when armed', () => {
    const ref = { current: null }
    render(
      <AudioProvider>
        <Probe captureRef={ref} />
      </AudioProvider>
    )
    fireEvent(window, new Event('pointerdown'))
    ref.current.play('snap')
    expect(mock.state.nodes.length).toBe(0)
  })

  it('is a no-op while unarmed, even when unmuted', () => {
    const ref = { current: null }
    render(
      <AudioProvider>
        <Probe captureRef={ref} />
      </AudioProvider>
    )
    ref.current.unmute()
    ref.current.play('snap')
    expect(mock.state.nodes.length).toBe(0)
  })

  it('creates a source node, connects it, and starts it while unmuted and armed', () => {
    const ref = { current: null }
    render(
      <AudioProvider>
        <Probe captureRef={ref} />
        <MuteToggle />
      </AudioProvider>
    )
    fireEvent(window, new Event('pointerdown'))
    fireEvent.click(screen.getByRole('button', { name: /unmute audio/i }))
    ref.current.play('snap')
    expect(mock.state.nodes.length).toBeGreaterThan(0)
    expect(mock.state.nodes[0].connect).toHaveBeenCalled()
    expect(mock.state.nodes[0].start).toHaveBeenCalled()
  })

  it('throws for an unregistered sound name', () => {
    const ref = { current: null }
    render(
      <AudioProvider>
        <Probe captureRef={ref} />
      </AudioProvider>
    )
    fireEvent(window, new Event('pointerdown'))
    expect(() => ref.current.play('bogus')).toThrow()
  })
})

describe('SOUNDS registry', () => {
  it('contains exactly the full trigger-point set', () => {
    expect(Object.keys(SOUNDS).sort()).toEqual(
      ['deadThunk', 'flip', 'grind', 'seam', 'shake', 'snap', 'thunk'].sort()
    )
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
