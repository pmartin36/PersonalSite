import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

// Full trigger-point sound registry: snap/thunk (rotateTo settle + intro),
// flip (Face II), grind (Face III reel), shake+thunk/deadThunk/seam (Face V lock).
// Every synth builds short WebAudio nodes, connects toward `ctx.destination`,
// and schedules its own start/stop. This is the sole place sound is
// synthesized; callers always go through `play(name)`.
function tone(ctx, startTime, { freq = 440, duration = 0.12, type = 'sine', gain = 0.2 } = {}) {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.type = type
  if (osc.frequency) osc.frequency.value = freq
  if (env.gain) {
    env.gain.setValueAtTime(gain, startTime)
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  }
  osc.connect(env)
  env.connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + duration)
  return osc
}

function noiseBurst(ctx, startTime, { duration = 0.15, gain = 0.25 } = {}) {
  const sampleRate = ctx.sampleRate || 44100
  const length = Math.max(1, Math.floor(sampleRate * duration))
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length)
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const env = ctx.createGain()
  if (env.gain) {
    env.gain.setValueAtTime(gain, startTime)
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  }
  source.connect(env)
  env.connect(ctx.destination)
  source.start(startTime)
  source.stop(startTime + duration)
  return source
}

export const SOUNDS = {
  snap: (ctx, startTime) => tone(ctx, startTime, { freq: 880, duration: 0.08, type: 'square', gain: 0.15 }),
  thunk: (ctx, startTime) => noiseBurst(ctx, startTime, { duration: 0.18, gain: 0.3 }),
  shake: (ctx, startTime) => noiseBurst(ctx, startTime, { duration: 0.25, gain: 0.2 }),
  grind: (ctx, startTime) => noiseBurst(ctx, startTime, { duration: 0.4, gain: 0.18 }),
  flip: (ctx, startTime) => tone(ctx, startTime, { freq: 660, duration: 0.1, type: 'triangle', gain: 0.18 }),
  deadThunk: (ctx, startTime) => noiseBurst(ctx, startTime, { duration: 0.2, gain: 0.35 }),
  seam: (ctx, startTime) => tone(ctx, startTime, { freq: 220, duration: 0.35, type: 'sine', gain: 0.22 }),
}

const DEFAULT_AUDIO = {
  play: () => {},
  muted: true,
  armed: false,
  toggleMute: () => {},
  mute: () => {},
  unmute: () => {},
  arm: () => {},
}

const MachineAudioContext = createContext(DEFAULT_AUDIO)

export function AudioProvider({ children }) {
  const [muted, setMuted] = useState(true)
  const [armed, setArmed] = useState(false)
  const s = useRef({ ctx: null }).current

  const arm = useCallback(() => {
    if (s.ctx) return
    const AC =
      typeof window !== 'undefined' &&
      (window.AudioContext || window.webkitAudioContext)
    if (!AC) return
    const ctx = new AC()
    ctx.resume()
    s.ctx = ctx
    setArmed(true)
  }, [s])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onGesture = () => {
      arm()
      window.removeEventListener('pointerdown', onGesture, true)
      window.removeEventListener('keydown', onGesture, true)
      window.removeEventListener('touchstart', onGesture, true)
    }
    window.addEventListener('pointerdown', onGesture, true)
    window.addEventListener('keydown', onGesture, true)
    window.addEventListener('touchstart', onGesture, true)
    return () => {
      window.removeEventListener('pointerdown', onGesture, true)
      window.removeEventListener('keydown', onGesture, true)
      window.removeEventListener('touchstart', onGesture, true)
    }
  }, [arm])

  const toggleMute = useCallback(() => setMuted((m) => !m), [])
  const mute = useCallback(() => setMuted(true), [])
  const unmute = useCallback(() => setMuted(false), [])

  const play = useCallback(
    (name) => {
      const synth = SOUNDS[name]
      if (!synth) {
        throw new Error(`play: unknown sound "${name}"`)
      }
      if (!armed || muted || !s.ctx) return
      synth(s.ctx, s.ctx.currentTime)
    },
    [armed, muted, s]
  )

  const value = { play, muted, armed, toggleMute, mute, unmute, arm }

  return (
    <MachineAudioContext.Provider value={value}>
      {children}
    </MachineAudioContext.Provider>
  )
}

export function useAudio() {
  return useContext(MachineAudioContext)
}

export function MuteToggle({ className, ...rest }) {
  const { muted, arm, toggleMute } = useAudio()
  const label = muted ? 'Unmute audio' : 'Mute audio'
  return (
    <button
      type="button"
      className={['machine-audio-toggle', className].filter(Boolean).join(' ')}
      aria-label={label}
      onClick={() => {
        arm()
        toggleMute()
      }}
      {...rest}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 9v6h4l5 5V4L7 9H3z" />
        {muted ? (
          <g className="machine-audio-toggle__x">
            <line x1="15.5" y1="9" x2="21" y2="14.5" />
            <line x1="21" y1="9" x2="15.5" y2="14.5" />
          </g>
        ) : (
          <g className="machine-audio-toggle__waves">
            <path d="M15.5 8.8a4 4 0 0 1 0 6.4" />
            <path d="M18 6.3a7.6 7.6 0 0 1 0 11.4" />
          </g>
        )}
      </svg>
    </button>
  )
}
