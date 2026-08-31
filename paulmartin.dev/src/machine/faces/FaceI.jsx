import FaceSurface from '../FaceSurface.jsx'
import Clue from '../Clue.jsx'
import { useMachine, faceIndex } from '../Machine.jsx'
import { RESUME_URL } from '../model.js'
import './FaceI.css'

const RESUME_WORD = 'resume'

export default function FaceI() {
  const { rotateTo } = useMachine()

  return (
    <FaceSurface aria-label="Face I">
      {/* The carved name: the same sandstone as the face, clipped to the
          letterforms and shifted straight down in brightness by a per-channel
          subtraction (feComponentTransfer). Subtraction keeps the crack sharp and
          brown - it only darkens - where a blend mode would mute or grey it. The
          stone image is cover-fit to the face exactly like the face background, so
          the darkened letters register pixel-for-pixel with the stone behind them.
          The <h1> below carries the visible text (transparent) for layout/a11y and
          the beveled cut edges. */}
      {/* viewBox matches the stone image (1820x1000), which is the face's exact
          aspect, so 1 user unit scales with the face. The name and every bevel
          offset are in these units, so the carve holds the same proportions at any
          window size (fixed-px offsets went fat at smaller render sizes). */}
      <svg className="face1-carve" aria-hidden="true" viewBox="0 0 1820 1000">
        <defs>
          {/* Base: per-channel brightness subtraction shifts the stone straight down
              into deep warm shadow while keeping the crack sharp and brown. */}
          <filter id="face1-sink" colorInterpolationFilters="sRGB">
            <feComponentTransfer>
              <feFuncR type="linear" slope="1" intercept="-0.33" />
              <feFuncG type="linear" slope="1" intercept="-0.35" />
              <feFuncB type="linear" slope="1" intercept="-0.27" />
            </feComponentTransfer>
          </filter>
          {/* Lip: a lit band on the bottom edge of every stroke. Shift the glyph
              alpha up and subtract it (composite out) to isolate the lower edge,
              then flood it warm gold. Offsets in user units (tuner px x 1.17). */}
          <filter id="face1-lip" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feOffset in="SourceAlpha" dx="0" dy="-7" result="up" />
            <feComposite in="SourceAlpha" in2="up" operator="out" result="band" />
            <feGaussianBlur in="band" stdDeviation="1.4" result="soft" />
            <feFlood floodColor="#f2c77d" floodOpacity="0.74" result="col" />
            <feComposite in="col" in2="soft" operator="in" />
          </filter>
          {/* Core: the deepest shadow, a thin near-black line just above the lit
              lip (a wider edge band minus the lip band). */}
          <filter id="face1-core" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feOffset in="SourceAlpha" dx="0" dy="-15" result="up2" />
            <feComposite in="SourceAlpha" in2="up2" operator="out" result="wide" />
            <feOffset in="SourceAlpha" dx="0" dy="-7" result="cut" />
            <feComposite in="wide" in2="cut" operator="out" result="ring" />
            <feFlood floodColor="#150a02" floodOpacity="0.28" result="col2" />
            <feComposite in="col2" in2="ring" operator="in" />
          </filter>
          <clipPath id="face1-clip">
            <text
              className="face1-carve__text"
              fontSize="158"
              x="910"
              y="500"
              transform="translate(18,0)"
              textAnchor="middle"
              dominantBaseline="central"
            >
              Paul Martin
            </text>
          </clipPath>
        </defs>
        {/* 1. dark upper wall: offset up, peeks above the floor */}
        <text
          className="face1-carve__text"
              fontSize="158"
              x="910"
          y="500"
          transform="translate(18,-5.3)"
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(18,11,3,0.9)"
        >
          Paul Martin
        </text>
        {/* 2. floor: the subtracted stone, clipped to the letters */}
        <image
          href="/machine/face_attempt_2.png"
          x="0"
          y="0"
          width="1820"
          height="1000"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#face1-clip)"
          filter="url(#face1-sink)"
        />
        {/* 3. deep core shadow line above the lip */}
        <text
          className="face1-carve__text"
              fontSize="158"
              x="910"
          y="500"
          transform="translate(18,0)"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#000"
          filter="url(#face1-core)"
        >
          Paul Martin
        </text>
        {/* 4. lit lower lip on every bottom edge */}
        <text
          className="face1-carve__text"
              fontSize="158"
              x="910"
          y="500"
          transform="translate(18,0)"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#000"
          filter="url(#face1-lip)"
        >
          Paul Martin
        </text>
      </svg>
      <h1 className="face1-name">Paul Martin</h1>
      <div className="face1-actions">
        <a
          href={RESUME_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Resume"
          className="face1-action face1-resume machine-carve"
        >
          <Clue order={4} variant="underline" className="face1-resume__clue">
            {({ order, directionLetter }) => {
              // "resume"[order-1] must equal the move's direction letter (position
              // 4 -> 'u' -> Up): if MOVES face I ever changes this throws at render
              // rather than silently shipping a mis-underlined word.
              if (RESUME_WORD[order - 1] !== directionLetter) {
                throw new Error(
                  `FaceI clue: "resume"[${order - 1}] != directionLetter ${directionLetter}`,
                )
              }
              return [...RESUME_WORD].map((ch, i) => (
                <span
                  key={i}
                  className={i === order - 1 ? 'face1-resume__tell' : undefined}
                >
                  {ch}
                </span>
              ))
            }}
          </Clue>
        </a>
        <button
          type="button"
          className="face1-action face1-contact machine-carve"
          onClick={() => rotateTo(faceIndex('IV'))}
        >
          Contact
        </button>
      </div>
    </FaceSurface>
  )
}
