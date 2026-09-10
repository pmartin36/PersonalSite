import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

// Pre-rendered mp3 samples fetched + decoded once on arm(), keyed by name.
// Paths are relative to the Vite base URL so they resolve in dev and under a
// deployed subpath alike. turn_face{n} is the drum landing sound for the face
// at drum index n-1 (Face I -> turn_face1).
export const SAMPLES = {
  // The turn is split so each spin can be pitch-varied without detuning the note:
  // turn_body (slide + landing + tremor, no note) plays at a random pitch per turn;
  // turn_note{n} (the face's in-tune note) plays at true pitch.
  turn_body: 'machine/sfx/turn_body.mp3',
  turn_note1: 'machine/sfx/turn_note1.mp3',
  turn_note2: 'machine/sfx/turn_note2.mp3',
  turn_note3: 'machine/sfx/turn_note3.mp3',
  turn_note4: 'machine/sfx/turn_note4.mp3',
  turn_note5: 'machine/sfx/turn_note5.mp3',
  intro_spin: 'machine/sfx/intro_spin.mp3',
  jungle_loop: 'machine/sfx/jungle_loop.mp3',
  artifact_burst: 'machine/sfx/artifact_burst.mp3',
  // Face V lid-reveal: the stone lid grinding open, the power-up that fires at
  // 50% open, and the idle watch-gear bed that starts there and loops.
  lid_open: 'machine/sfx/lid_open.mp3',
  lid_powerup: 'machine/sfx/lid_powerup.mp3',
  gears_loop: 'machine/sfx/gears_loop.mp3',
  // Light UI stone taps: mute click, detail-panel open, detail-panel close.
  ui_tap: 'machine/sfx/ui_tap.mp3',
  ui_open: 'machine/sfx/ui_open.mp3',
  ui_close: 'machine/sfx/ui_close.mp3',
  // Face III slot-reel step: the drum spin pitched up, no note. Three hand-picked
  // One per reel: a descending D-min-pentatonic coin-tick figure over a low stone
  // grumble, with a light stone thunk seating at the end. The three reels start on
  // adjacent pentatonic degrees, so each reel has its own note.
  reel_spin1: 'machine/sfx/reel_spin1.mp3',
  reel_spin2: 'machine/sfx/reel_spin2.mp3',
  reel_spin3: 'machine/sfx/reel_spin3.mp3',
  // Face IV sliding tile: the lid stone-grind pitched up, shortened to the slide.
  tile_slide: 'machine/sfx/tile_slide.mp3',
  // Face II card flip: an antique metal lid pivot (used as-is).
  card_flip: 'machine/sfx/card_flip.mp3',
  // Face V arrow-pad press: a muted stone slide, a deep stone thunk seating into
  // place, then a soft return slide.
  pad_press: 'machine/sfx/pad_press.mp3',
}

// Sample levels. The jungle bed sits well under the effects.
const TURN_GAIN = 0.7
const INTRO_GAIN = 0.9
const JUNGLE_GAIN = 0.225
// The artifact detonation (crystal core exploding, ears ringing) on ignition.
// Left just under unity so it stacks with the jungle bed without clipping.
const BURST_GAIN = 0.92
// Lid reveal: the grind is the action (prominent), the power-up sits just under
// it, and the idle gear bed sits low like the jungle.
const LID_GAIN = 0.9
const POWERUP_GAIN = 0.7
const GEARS_GAIN = 0.3
// Light UI accents. Kept low so they never dominate.
const UI_GAIN = 0.4
// The reel spin sits like the turn, a bit under so a fast flurry isn't fatiguing.
const REEL_GAIN = 0.2
// Face IV tile slide, a small quick stone move. Three tonal styles (root, +2, +3
// semitones - D-min-pentatonic steps), picked at random per slide.
const TILE_GAIN = 0.15
const TILE_RATES = [1.0, 1.122, 1.189]
// Face II card flip, a light frequent action, kept under the UI clicks.
const CARD_GAIN = 0.35
// Face V arrow-pad press, a small frequent stone tap, kept quiet and non-fatiguing.
const PAD_GAIN = 0.42

const DEFAULT_AUDIO = {
  playTurn: () => {},
  playIntroSpin: () => {},
  playArtifactBurst: () => {},
  playLidOpen: () => {},
  playPowerup: () => {},
  startGears: () => {},
  stopGears: () => {},
  playMuteClick: () => {},
  playDetailOpen: () => {},
  playDetailClose: () => {},
  playReelSpin: () => {},
  playTileSlide: () => {},
  playCardFlip: () => {},
  playPadPress: () => {},
  enterIgnition: () => {},
  exitIgnition: () => {},
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
  // The Face V ignition takeover: while true the jungle bed is suppressed.
  const [ignited, setIgnited] = useState(false)
  // ctx: the live AudioContext. buffers: decoded sample cache keyed by SAMPLES
  // name. jungle: the running ambience { src, g } or null.
  const s = useRef({ ctx: null, buffers: {}, jungle: null, gears: null, master: null, reelVoice: null }).current
  // Mirrors `muted` for async callbacks (sample-load completion) that would
  // otherwise capture a stale value.
  const mutedRef = useRef(muted)
  useEffect(() => {
    mutedRef.current = muted
  }, [muted])

  // Route a decoded buffer through its own GainNode to the destination. Returns
  // the { src, g } so a loop (the jungle bed) can be stopped later. A missing
  // ctx or buffer is a silent no-op so audio never throws.
  const playBuffer = useCallback(
    (buffer, { gain = 1, loop = false, offset = 0, bypassMaster = false, rate = 1 } = {}) => {
      if (!s.ctx || !buffer) return null
      const src = s.ctx.createBufferSource()
      src.buffer = buffer
      src.loop = loop
      // rate != 1 detunes this one-shot (used to vary reel spins spin-to-spin).
      if (rate !== 1 && src.playbackRate) src.playbackRate.value = rate
      const g = s.ctx.createGain()
      if (g.gain) g.gain.value = gain
      src.connect(g)
      // bypassMaster routes straight to the destination, so the mute click is still
      // heard as the master gain ducks everything else to 0.
      g.connect(bypassMaster ? s.ctx.destination : (s.master || s.ctx.destination))
      // offset starts playback partway into the sample (used to reveal the intro
      // spin at the animation's current position when unmuted mid-spin).
      const off = offset > 0 && offset < (buffer.duration || Infinity) ? offset : 0
      src.start(s.ctx.currentTime, off)
      return { src, g }
    },
    [s],
  )

  const startJungle = useCallback(() => {
    if (s.jungle || !s.ctx) return
    const buffer = s.buffers.jungle_loop
    if (!buffer) return
    s.jungle = playBuffer(buffer, { gain: JUNGLE_GAIN, loop: true })
    // Ramp in so a resume after the ignition (Wake up) swells back rather than
    // popping in at full level.
    const g = s.jungle && s.jungle.g
    if (g && g.gain && typeof g.gain.setValueAtTime === 'function') {
      const now = s.ctx.currentTime
      g.gain.setValueAtTime(0.0001, now)
      if (typeof g.gain.linearRampToValueAtTime === 'function') {
        g.gain.linearRampToValueAtTime(JUNGLE_GAIN, now + 0.9)
      } else {
        g.gain.value = JUNGLE_GAIN
      }
    }
  }, [s, playBuffer])

  const stopJungle = useCallback(() => {
    if (!s.jungle) return
    try {
      s.jungle.src.stop()
    } catch {
      // already stopped / not started
    }
    s.jungle = null
  }, [s])

  // Fetch + decode every sample once. decodeAudioData and fetch don't exist in
  // jsdom, so this bails cleanly there; any per-file failure is swallowed so a
  // missing asset never breaks the app. Once the jungle bed decodes it starts
  // itself if audio is already live and unmuted.
  const loadSamples = useCallback(
    (ctx) => {
      if (typeof fetch !== 'function' || typeof ctx.decodeAudioData !== 'function') {
        return
      }
      const base = (import.meta.env && import.meta.env.BASE_URL) || '/'
      Object.entries(SAMPLES).forEach(([name, path]) => {
        // Promise.resolve().then wraps the fetch so even a synchronous throw
        // (e.g. an invalid URL) turns into a caught rejection.
        Promise.resolve()
          .then(() => fetch(`${base}${path}`))
          .then((res) => res.arrayBuffer())
          .then((data) => ctx.decodeAudioData(data))
          .then((buffer) => {
            s.buffers[name] = buffer
            if (name === 'jungle_loop' && !mutedRef.current) startJungle()
          })
          .catch(() => {})
      })
    },
    [s, startJungle],
  )

  const arm = useCallback(() => {
    if (s.ctx) return
    const AC =
      typeof window !== 'undefined' &&
      (window.AudioContext || window.webkitAudioContext)
    if (!AC) return
    const ctx = new AC()
    ctx.resume()
    // Master gain: everything routes through it, so muting drops all output to 0
    // instantly, including sounds already playing. Starts matching current mute.
    const master = ctx.createGain()
    if (master.gain) master.gain.value = mutedRef.current ? 0 : 1
    if (master.connect) master.connect(ctx.destination)
    s.ctx = ctx
    s.master = master
    setArmed(true)
    loadSamples(ctx)
  }, [s, loadSamples])

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

  // Play the pre-rendered landing sound for the drum face at `faceIndex`
  // (0-based; Face I -> turn_face1). Gated: silent until armed and unmuted, and
  // a no-op if the sample hasn't decoded yet.
  const playTurn = useCallback(
    (faceIndex) => {
      if (!armed || muted || !s.ctx) return
      const n = Number(faceIndex)
      if (!Number.isInteger(n) || n < 0 || n > 4) return
      // Body pitched +/- 25% per spin so two turns never sound identical; the
      // note plays at true pitch so the melody stays in tune.
      const rate = 1 + (Math.random() * 2 - 1) * 0.25
      playBuffer(s.buffers.turn_body, { gain: TURN_GAIN, rate })
      playBuffer(s.buffers[`turn_note${n + 1}`], { gain: TURN_GAIN })
    },
    [armed, muted, s, playBuffer]
  )

  // One-shot opening-spin sample (includes its own reverb/rubber-band tail).
  // `offset` starts it partway in, to reveal it at the animation's current
  // position when the user unmutes mid-spin (rather than replaying from the top).
  // Returns the source node (or null if it couldn't start, e.g. sample not yet
  // decoded) so the caller can tell whether it actually played.
  const playIntroSpin = useCallback((offset = 0) => {
    if (!armed || muted || !s.ctx) return null
    return playBuffer(s.buffers.intro_spin, { gain: INTRO_GAIN, offset })
  }, [armed, muted, s, playBuffer])

  // One-shot artifact detonation on Face V ignition (the crystal core explodes
  // and the ears ring). Gated like the other one-shots.
  const playArtifactBurst = useCallback(() => {
    if (!armed || muted || !s.ctx) return
    playBuffer(s.buffers.artifact_burst, { gain: BURST_GAIN })
  }, [armed, muted, s, playBuffer])

  // Face V lid reveal. playLidOpen fires when the lid starts hinging (the stone
  // grind + ascending melody). playPowerup fires at ~50% open. startGears begins
  // the idle watch-gear loop there; stopGears ends it (lid re-seals / ignition).
  const playLidOpen = useCallback(() => {
    if (!armed || muted || !s.ctx) return null
    return playBuffer(s.buffers.lid_open, { gain: LID_GAIN })
  }, [armed, muted, s, playBuffer])

  const playPowerup = useCallback(() => {
    if (!armed || muted || !s.ctx) return null
    return playBuffer(s.buffers.lid_powerup, { gain: POWERUP_GAIN })
  }, [armed, muted, s, playBuffer])

  const startGears = useCallback(() => {
    if (s.gears || !s.ctx) return
    const buffer = s.buffers.gears_loop
    if (!buffer) return
    s.gears = playBuffer(buffer, { gain: GEARS_GAIN, loop: true })
    // Fade in so the bed swells rather than pops when the device wakes.
    const g = s.gears && s.gears.g
    if (g && g.gain && typeof g.gain.setValueAtTime === 'function') {
      const now = s.ctx.currentTime
      g.gain.setValueAtTime(0.0001, now)
      if (typeof g.gain.linearRampToValueAtTime === 'function') {
        g.gain.linearRampToValueAtTime(GEARS_GAIN, now + 0.5)
      } else {
        g.gain.value = GEARS_GAIN
      }
    }
  }, [s, playBuffer])

  const stopGears = useCallback(() => {
    if (!s.gears) return
    try {
      s.gears.src.stop()
    } catch {
      // already stopped / not started
    }
    s.gears = null
  }, [s])

  // The ignition takeover: the jungle bed cuts out under the detonation (ears
  // ringing, fade to black) and ramps back in on Wake up. The burst one-shot is
  // unaffected, it's already playing. Kept separate from mute: the mute toggle
  // still owns the master gain; this only suppresses the ambience.
  const enterIgnition = useCallback(() => setIgnited(true), [])
  const exitIgnition = useCallback(() => setIgnited(false), [])

  // The mute click: played the instant you mute, routed AROUND the master gain so
  // it is heard even as the master ducks everything to 0. Only armed is required
  // (not unmuted) since it is the sound of muting; unmuting stays silent (the
  // caller only fires this on the mute transition).
  const playMuteClick = useCallback(() => {
    if (!armed || !s.ctx) return
    playBuffer(s.buffers.ui_tap, { gain: UI_GAIN, bypassMaster: true })
  }, [armed, s, playBuffer])

  // Detail-panel open / close taps. Gated like the other one-shots: silent while
  // muted, through the master.
  const playDetailOpen = useCallback(() => {
    if (!armed || muted || !s.ctx) return
    playBuffer(s.buffers.ui_open, { gain: UI_GAIN })
  }, [armed, muted, s, playBuffer])

  const playDetailClose = useCallback(() => {
    if (!armed || muted || !s.ctx) return
    playBuffer(s.buffers.ui_close, { gain: UI_GAIN })
  }, [armed, muted, s, playBuffer])

  // One Face III reel stepping. Each reel (0-2) plays its own note figure. Single
  // voice: a new step STOPS the one in flight and restarts, so spinning fast
  // retriggers the figure rather than stacking.
  const playReelSpin = useCallback((reelIndex = 0) => {
    if (!armed || muted || !s.ctx) return
    if (s.reelVoice) {
      try { s.reelVoice.src.stop() } catch { /* already ended */ }
      s.reelVoice = null
    }
    const n = 1 + (((reelIndex % 3) + 3) % 3)   // reel 0/1/2 -> reel_spin1/2/3
    s.reelVoice = playBuffer(s.buffers[`reel_spin${n}`], { gain: REEL_GAIN })
  }, [armed, muted, s, playBuffer])

  // One Face II card flipping on its spindle.
  const playCardFlip = useCallback(() => {
    if (!armed || muted || !s.ctx) return
    playBuffer(s.buffers.card_flip, { gain: CARD_GAIN })
  }, [armed, muted, s, playBuffer])

  // One Face V arrow-pad key being pressed. +/- ~5% pitch per press so a flurry
  // of taps never sounds copy-pasted.
  const playPadPress = useCallback(() => {
    if (!armed || muted || !s.ctx) return
    const rate = 1 + (Math.random() * 2 - 1) * 0.05
    playBuffer(s.buffers.pad_press, { gain: PAD_GAIN, rate })
  }, [armed, muted, s, playBuffer])

  // One Face IV tile sliding into place. Three tonal styles picked at random per
  // slide (D-min-pentatonic-ish steps, all at/above the base so none hit low and
  // loud), so repeated slides vary without tracking direction.
  const playTileSlide = useCallback(
    () => {
      if (!armed || muted || !s.ctx) return
      const rate = TILE_RATES[Math.floor(Math.random() * TILE_RATES.length)]
      playBuffer(s.buffers.tile_slide, { gain: TILE_GAIN, rate })
    },
    [armed, muted, s, playBuffer]
  )

  // Master gain follows mute so EVERYTHING (synths, one-shot samples, and the
  // bed) is silenced the instant you mute, not just newly-triggered sounds. A
  // short ramp avoids a click.
  useEffect(() => {
    if (!s.master || !s.master.gain) return
    const target = muted ? 0 : 1
    const now = s.ctx ? s.ctx.currentTime : 0
    if (typeof s.master.gain.setTargetAtTime === 'function') {
      s.master.gain.setTargetAtTime(target, now, 0.015)
    } else {
      s.master.gain.value = target
    }
  }, [muted, s])

  // The jungle bed loops whenever audio is live, unmuted, and not in the
  // ignition takeover; muting or igniting stops it, and clearing either resumes
  // it (with startJungle's fade-in). startJungle guards against a double-start.
  useEffect(() => {
    if (armed && !muted && !ignited) startJungle()
    else stopJungle()
  }, [armed, muted, ignited, startJungle, stopJungle])

  const value = { playTurn, playIntroSpin, playArtifactBurst, playLidOpen, playPowerup, startGears, stopGears, playMuteClick, playDetailOpen, playDetailClose, playReelSpin, playTileSlide, playCardFlip, playPadPress, enterIgnition, exitIgnition, muted, armed, toggleMute, mute, unmute, arm }

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
  const { muted, arm, toggleMute, playMuteClick } = useAudio()
  const label = muted ? 'Unmute audio' : 'Mute audio'
  return (
    <button
      type="button"
      className={['machine-audio-toggle', className].filter(Boolean).join(' ')}
      aria-label={label}
      onClick={() => {
        arm()
        // Click only when muting (muted currently false); unmuting stays silent.
        if (!muted) playMuteClick()
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
