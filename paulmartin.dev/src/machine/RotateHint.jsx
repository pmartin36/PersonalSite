import { useEffect, useState } from 'react'

// A portrait-only nudge that the experience is better in landscape: a black
// pill reading "Better in landscape mode" with a domed bubble on top holding a
// stylised phone outline that turns portrait -> landscape on a loop. Shown only
// on portrait touch devices (CSS-gated), pops in on load, and dismisses on tap.
// It never blocks content or traps the user (WCAG 1.3.4 keeps the site usable in
// portrait; this is only a hint).
export default function RotateHint() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Let the scene reveal first, then pop the hint in.
    const t = setTimeout(() => setShow(true), 900)
    return () => clearTimeout(t)
  }, [])

  if (!show || dismissed) return null

  return (
    <div className="rotate-hint" role="status">
      <button
        type="button"
        className="rotate-hint__inner"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss: the site works best in landscape"
      >
        <span className="rotate-hint__bubble" aria-hidden="true">
          {/* Original phone outline, ~0.5 aspect (a phone, not a tablet or a
              remote), earpiece slit at the top, drawn centred so it turns about
              its own middle. */}
          <svg
            className="rotate-hint__phone"
            viewBox="0 0 38 38"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <g className="rotate-hint__phone-g">
              <rect
                x="9.5"
                y="2.5"
                width="19"
                height="33"
                rx="4.8"
                ry="4.8"
                strokeWidth="2.4"
              />
              <line x1="16" y1="6.3" x2="22" y2="6.3" strokeWidth="2.2" />
            </g>
          </svg>
        </span>
        <span className="rotate-hint__box">Better in landscape mode</span>
      </button>
    </div>
  )
}
