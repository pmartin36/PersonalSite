import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { AudioProvider, MuteToggle, useAudio } from './audio.jsx'
import FaceI from './faces/FaceI.jsx'
import FaceII from './faces/FaceII.jsx'
import FaceIII from './faces/FaceIII.jsx'
import FaceIV from './faces/FaceIV.jsx'
import FaceV from './faces/FaceV.jsx'
import useScrollNav from './useScrollNav.js'
import './MachineShell.css'

export const FACES = ['I', 'II', 'III', 'IV', 'V']
const FACE_COMPONENTS = [FaceI, FaceII, FaceIII, FaceIV, FaceV]

// Opening spin: the drum holds on Face I, then makes one full turn (through II,
// III, IV, V and back to I) in a single continuous overshoot-and-settle. The
// rubber-band comes from the back-out easing on .machine--intro-spin. Duration
// mirrors that transition in CSS.
const INTRO_SPIN_MS = 1750
// The drum first reaches Face I about here (before the overshoot settles); at
// this point interaction is unlocked so a scroll or click can cancel the rebound
// and navigate on, rather than waiting out the full settle.
const INTRO_REACH_MS = Math.round(INTRO_SPIN_MS * 0.68)
// The spin only kicks once the scene can animate smoothly (fonts + background
// decoded, layout settled); on a cold load we hold on Face I until then, capped
// so a slow asset can never stall the opening.
const INTRO_HOLD_CAP_MS = 800

// Decode the background up front so its first paint doesn't jank the opening
// spin. Resolves (never rejects) once it is ready or immediately if it can't.
const MACHINE_BG_URL = '/machine/ruins-bg.jpeg'
function decodeBackground() {
  if (typeof Image === 'undefined') return Promise.resolve()
  const img = new Image()
  img.src = MACHINE_BG_URL
  return img.decode ? img.decode().catch(() => {}) : Promise.resolve()
}

function scenePainted() {
  const fonts =
    typeof document !== 'undefined' && document.fonts
      ? document.fonts.ready
      : Promise.resolve()
  return Promise.race([
    Promise.all([fonts, decodeBackground()]),
    new Promise((resolve) => setTimeout(resolve, INTRO_HOLD_CAP_MS)),
  ])
}

export function wrapIndex(i, count = FACES.length) {
  return ((i % count) + count) % count
}

// Shortest signed step from `from` to `to` around the ring, including
// wrap-around; ties resolve to the positive (forward) direction.
export function stepDelta(from, to, count = FACES.length) {
  const raw = to - from
  const candidates = [raw, raw - count, raw + count]
  return candidates.reduce((best, c) => {
    if (Math.abs(c) < Math.abs(best)) return c
    if (Math.abs(c) === Math.abs(best) && c > best) return c
    return best
  })
}

export function faceIndex(id) {
  const i = FACES.indexOf(id)
  if (i === -1) throw new Error(`faceIndex: unknown face id "${id}"`)
  return i
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

const DEFAULT_MACHINE = {
  currentFace: 0,
  rotateTo: () => {},
  faceCount: FACES.length,
  lockRotation: () => {},
}
const MachineContext = createContext(DEFAULT_MACHINE)

export function useMachine() {
  return useContext(MachineContext)
}

function MachineShell() {
  const { playTurn, playIntroSpin, muted, armed } = useAudio()
  const reducedMotion = useRef(prefersReducedMotion()).current
  // The drum opens on Face I (the name) and holds there; under motion the opening
  // spin kicks once the scene is ready and makes one full turn back to Face I.
  const [currentFace, setCurrentFace] = useState(0)
  const [rotationSteps, setRotationSteps] = useState(0)
  const [introPhase, setIntroPhase] = useState(reducedMotion ? 'done' : 'start')
  // The scene is held hidden until its assets are ready (the carved-name font and
  // the background), then revealed all at once, so the stone never appears in a
  // fallback font or before the jungle has decoded. With both preloaded this wait
  // is imperceptible; it is capped in scenePainted so a slow asset can't stall it.
  const [revealed, setRevealed] = useState(false)
  const didIntro = useRef(false)
  const rootRef = useRef(null)
  const currentFaceRef = useRef(currentFace)
  // True until the opening spin first reaches Face I; scroll and clicks are
  // ignored until then so nothing fights the run-up. A ref mirrors introPhase so
  // rotateTo can cancel the settle without a stale closure.
  const introBusyRef = useRef(!reducedMotion)
  const introPhaseRef = useRef(reducedMotion ? 'done' : 'start')
  // Set once Face V's lid opens: the drum can no longer be turned until the
  // puzzle is woken back up.
  const lockedRef = useRef(false)
  const lockRotation = useCallback((locked) => {
    lockedRef.current = locked
  }, [])
  // Wall-clock start of the opening spin, and a one-shot guard so its sound plays
  // at most once. The intro spin is muted by default; the sound is not fired at
  // spin-start but when audio is first armed-and-unmuted during the spin window,
  // started at the animation's elapsed offset so it is revealed at its current
  // position rather than replayed from the top.
  const spinStartRef = useRef(null)
  const introSpinAudioRef = useRef(false)

  const rotateTo = useCallback(
    (index, { silent = false } = {}) => {
      if (introBusyRef.current || lockedRef.current) return
      // Past the run-up but the opening spin may still be settling its overshoot;
      // this interaction cancels the rebound and takes over the normal transition.
      if (introPhaseRef.current !== 'done') {
        introPhaseRef.current = 'done'
        setIntroPhase('done')
      }
      const target = wrapIndex(index)
      const from = currentFaceRef.current
      currentFaceRef.current = target
      // Two independent, pure updaters. rotationSteps accumulates the shortest
      // signed turn so multi-turn rotation stays continuous. They stay separate
      // rather than nesting setRotationSteps inside the setCurrentFace updater:
      // an updater must be pure, and a nested setState double-fires under
      // StrictMode, doubling the drum's rotation.
      setRotationSteps((s) => s + stepDelta(from, target))
      setCurrentFace(target)
      // The turn sample for the destination face carries its own slide + landing
      // thunk + note. Its slide builds over ~0.5s and the thunk lands at ~0.53s,
      // so it plays from the START of the tumble: the grind rides the 0.6s CSS
      // turn and the thunk lands right as the face settles. A silent turn (a
      // non-user reset, e.g. after the Face V ignition) makes no sound.
      if (!silent) playTurn(target)
    },
    [playTurn],
  )

  useEffect(() => {
    currentFaceRef.current = currentFace
  }, [currentFace])

  const handleStep = useCallback(
    (dir) => rotateTo(currentFaceRef.current + dir),
    [rotateTo],
  )

  useScrollNav(rootRef, { onStep: handleStep })

  // Fires once on mount under motion: hold on Face I until the scene is ready to
  // animate (fonts + background decoded, layout settled), then make one full turn
  // through II -> III -> IV -> V and back to Face I, overshooting and settling.
  // Holding until ready keeps a cold load from janking the spin. Scroll and
  // clicks are locked out until it lands. Reduced motion rests on Face I with no
  // spin. Guarded by a ref (not state) so StrictMode's mount/cleanup/mount only
  // runs it once.
  useEffect(() => {
    if (didIntro.current) return
    didIntro.current = true

    scenePainted().then(() => {
      // Assets are ready: reveal the whole face at once, already carved. Under
      // reduced motion it simply rests on Face I; there is no spin.
      setRevealed(true)
      if (reducedMotion) return
      // Two frames so the held Face I has actually painted before the transform
      // kicks; then one full turn, the easing overshoots and rubber-bands back.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          spinStartRef.current =
            typeof performance !== 'undefined' ? performance.now() : Date.now()
          introPhaseRef.current = 'spin'
          setIntroPhase('spin')
          setRotationSteps(FACES.length)
          // The opening-spin sample (whole run-up, overshoot and landing; it goes
          // silent after the rubber-band) is played by the effect below, offset to
          // the spin's elapsed time, so unmuting mid-spin reveals it in place.
          // Reached Face I: unlock interaction while the overshoot settles.
          setTimeout(() => {
            if (introPhaseRef.current !== 'spin') return
            introPhaseRef.current = 'reached'
            setIntroPhase('reached')
            introBusyRef.current = false
          }, INTRO_REACH_MS)
          // Settle complete (unless the user already cancelled it).
          setTimeout(() => {
            if (introPhaseRef.current === 'done') return
            introPhaseRef.current = 'done'
            setIntroPhase('done')
            introBusyRef.current = false
          }, INTRO_SPIN_MS)
        })
      })
    })
    // The scheduled work is deliberately not cancelled on cleanup: under
    // StrictMode the mount/cleanup/mount cycle would otherwise cancel the only
    // scheduled run (didIntro then blocks a re-schedule). It only sets persistent
    // state and is harmless once run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Play the opening-spin sound the first time audio is armed AND unmuted while
  // the spin is still under way, started at the spin's elapsed offset so it is
  // revealed at its current position (not replayed). If the user is already
  // unmuted when the spin kicks, elapsed is ~0 and it plays from the top. Fires
  // at most once; a no-op under reduced motion (there is no spin).
  useEffect(() => {
    if (introSpinAudioRef.current) return
    if (!armed || muted) return
    if (introPhase !== 'spin' && introPhase !== 'reached') return
    if (spinStartRef.current == null) return
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const elapsed = (now - spinStartRef.current) / 1000
    if (elapsed >= INTRO_SPIN_MS / 1000) return // spin window already closed
    if (playIntroSpin(elapsed)) introSpinAudioRef.current = true
  }, [armed, muted, introPhase, playIntroSpin])

  const rootClass = [
    'machine',
    revealed ? '' : 'machine--hidden',
    reducedMotion ? 'machine--reduced' : '',
    introPhase === 'spin' || introPhase === 'reached' ? 'machine--intro-spin' : '',
    introPhase === 'start' || introPhase === 'spin' ? 'machine--intro-busy' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const contextValue = { currentFace, rotateTo, faceCount: FACES.length, lockRotation }

  return (
    <MachineContext.Provider value={contextValue}>
      <div
        ref={rootRef}
        className={rootClass}
        data-reduced={reducedMotion ? '' : undefined}
      >
        <div className="machine__holder machine__holder--left" aria-hidden="true" />
        <div className="machine__holder machine__holder--right" aria-hidden="true" />
        <div className="machine__viewport">
          <div className="machine__drum" style={{ '--rot': rotationSteps }}>
            {FACES.map((id, i) => {
              const Face = FACE_COMPONENTS[i]
              const isActive = i === currentFace
              return (
                <div
                  key={id}
                  className={[
                    'machine__face',
                    `machine__face--${id}`,
                    isActive ? 'machine__face--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ '--face-index': i }}
                >
                  <Face />
                  <nav
                    className="face-wayfinding"
                    aria-label={`You are on Face ${id} of ${FACES.length}`}
                  >
                    {FACES.map((fid, fi) => (
                      <button
                        key={fid}
                        type="button"
                        className={[
                          'face-pip',
                          fi === i ? 'face-pip--lit' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        aria-label={`Go to Face ${fid}`}
                        aria-current={fi === i ? 'true' : undefined}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => rotateTo(fi)}
                      />
                    ))}
                  </nav>
                </div>
              )
            })}
          </div>
        </div>
        <MuteToggle className="machine__mute" />
      </div>
    </MachineContext.Provider>
  )
}

export default function Machine() {
  return (
    <AudioProvider>
      <MachineShell />
    </AudioProvider>
  )
}
