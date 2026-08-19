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

// Mirrors MachineShell.css's .machine__drum transition-duration, so the
// on-settle snap fires when the tumble transform has actually finished.
const SNAP_MS = 600
const SHAKE_MS = 700

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

const DEFAULT_MACHINE = { currentFace: 0, rotateTo: () => {}, faceCount: FACES.length }
const MachineContext = createContext(DEFAULT_MACHINE)

export function useMachine() {
  return useContext(MachineContext)
}

function MachineShell() {
  const { play } = useAudio()
  const [currentFace, setCurrentFace] = useState(0)
  const [rotationSteps, setRotationSteps] = useState(0)
  const [introActive, setIntroActive] = useState(false)
  const reducedMotion = useRef(prefersReducedMotion()).current
  const snapTimer = useRef(null)
  const didIntro = useRef(false)
  const rootRef = useRef(null)
  const currentFaceRef = useRef(currentFace)

  const rotateTo = useCallback(
    (index) => {
      const target = wrapIndex(index)
      setCurrentFace((from) => {
        setRotationSteps((s) => s + stepDelta(from, target))
        return target
      })
      clearTimeout(snapTimer.current)
      snapTimer.current = setTimeout(
        () => play('snap'),
        reducedMotion ? 0 : SNAP_MS,
      )
    },
    [play, reducedMotion],
  )

  useEffect(() => {
    currentFaceRef.current = currentFace
  }, [currentFace])

  const handleStep = useCallback(
    (dir) => rotateTo(currentFaceRef.current + dir),
    [rotateTo],
  )

  useScrollNav(rootRef, { onStep: handleStep })

  // Fires once on mount: a settling thunk + shake under motion, nothing
  // under reduced motion (rests statically on Face I, no settle). Guarded by
  // a ref (not state) so StrictMode's mount/cleanup/mount only plays it once.
  useEffect(() => {
    if (didIntro.current) return
    didIntro.current = true
    if (reducedMotion) return

    setIntroActive(true)
    play('thunk')
    const shakeTimer = setTimeout(() => setIntroActive(false), SHAKE_MS)
    const skip = () => {
      clearTimeout(shakeTimer)
      setIntroActive(false)
    }
    window.addEventListener('pointerdown', skip, { once: true })
    window.addEventListener('keydown', skip, { once: true })

    return () => {
      clearTimeout(shakeTimer)
      window.removeEventListener('pointerdown', skip)
      window.removeEventListener('keydown', skip)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => clearTimeout(snapTimer.current), [])

  const rootClass = [
    'machine',
    reducedMotion ? 'machine--reduced' : '',
    introActive ? 'machine--intro' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const contextValue = { currentFace, rotateTo, faceCount: FACES.length }

  return (
    <MachineContext.Provider value={contextValue}>
      <div
        ref={rootRef}
        className={rootClass}
        data-reduced={reducedMotion ? '' : undefined}
      >
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
                </div>
              )
            })}
          </div>
        </div>
        <nav className="machine__wayfinding" aria-label="Face navigation">
          {FACES.map((id, i) => (
            <button
              key={id}
              type="button"
              className={[
                'machine__pip',
                i === currentFace ? 'machine__pip--lit' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={`Go to Face ${id}`}
              aria-current={i === currentFace ? 'true' : undefined}
              onClick={() => rotateTo(i)}
            />
          ))}
        </nav>
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
