import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { currentProjects, previousProjects } from '../data/projects'
import ProjectCard from '../components/ProjectCard'
import MazeBackground from '../components/MazeBackground'
import IntroWake from '../components/IntroWake'
import { RevealProvider, Reveal } from '../reveal'
import { makeBrandTexture } from '../brandTexture'

const RESUME_URL =
  'https://drive.google.com/file/d/1SpGooyH4FvJe9ykl-nXWoyM3i8u40Vyr/view?usp=sharing'

// A swipe only counts if it was meant: this much travel along the dominant axis, and that
// axis at least this many times the other one, so a diagonal smudge is dropped rather than
// snapped to whichever direction happened to win by a pixel. Both are tuned by feel.
const SWIPE_MIN_PX = 70
const SWIPE_AXIS_RATIO = 1.5
// Locked mode releases itself. Page scroll is suppressed while it is on, so a lock that
// outlives someone's attention would leave the page apparently broken.
const LOCK_IDLE_MS = 9000
// How long the header holds its swell when a swipe hits a wall. Long enough to read as a
// breath rather than the blink of an error.
const BREATH_MS = 520

// Module scope, so it survives client-side navigation but resets on a real
// document load. The intro is a greeting for arriving at the site, not for
// arriving at this component: without this, hitting Back from a project replays
// the whole thing. Typing the URL or reloading gets a fresh module and does
// play it. Set on handoff rather than on mount, so navigating away mid-intro
// (before anything was actually seen) still counts as unplayed.
let introPlayed = false

export default function Landing() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const skipIntro = params.get('from') === 'ulmartin'
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // The "Wake" intro plays on a normal visit; it does the hero-name settle on its own canvas
  // over the page. So the brand always renders in its final header slot (hidden under the intro
  // canvas until handoff), and the content cascade waits for the intro to finish.
  // Captured into state on the first render so it cannot flip mid-life.
  const [playIntro] = useState(!skipIntro && !reduce && !introPlayed)
  const [armed, setArmed] = useState(!playIntro) // content revealed immediately when skipping the intro
  const [showIntro, setShowIntro] = useState(playIntro)
  // and this drives the maze's real wake from the intro's sweep
  const pointerRef = useRef(null)

  function handoff() {
    introPlayed = true
    setArmed(true)
  }

  // Chrome that lives outside the reveal cascade (the footer rule, the header's
  // scrolled backdrop) paints on first frame regardless of the cascade. On a
  // reload taken partway down the page the browser restores scroll, so that
  // chrome shows through the intro before any content does. Hold it back until
  // the cascade is armed.
  const introHold = playIntro && !armed

  // Hide the scrollbar for the length of the intro. Whatever width the bar was taking is
  // handed back as padding, so the content box keeps the exact same width and nothing
  // shifts when the bar returns at the handoff. Browsers with overlay scrollbars measure
  // zero here and get no padding.
  useEffect(() => {
    if (!introHold) return
    const el = document.documentElement
    const barW = window.innerWidth - el.clientWidth
    el.classList.add('intro-playing')
    if (barW > 0) el.style.paddingRight = `${barW}px`
    return () => { el.classList.remove('intro-playing'); el.style.paddingRight = '' }
  }, [introHold])

  // Reaching About Me surfaces the maze's controls: ".dev" arrives so the D exists at all,
  // and the four control letters take a tint. One-way — once you have been shown the hint,
  // taking it back would be worse than never giving it.
  const [hintOn, setHintOn] = useState(false)
  // the maze's flecks and spectrum, baked once and clipped into the four control letters
  const brandTex = useMemo(() => makeBrandTexture(), [])
  useEffect(() => {
    const el = document.getElementById('about-label')
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setHintOn(true); io.disconnect() } },
      { rootMargin: '0px 0px -20% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // ---- touch: the wordmark is the maze's controller ----
  // The keyboard hint (u/l/r/d) is meaningless without a keyboard, so a coarse pointer gets
  // a different affordance entirely: the whole wordmark becomes a toggle, and swipes drive
  // the ball. Read as a media query rather than from touch events, so it settles before the
  // first render and a hybrid machine follows whichever pointer is actually in use.
  const [coarse, setCoarse] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const onChange = () => setCoarse(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const [locked, setLocked] = useState(false)
  const [pulse, setPulse] = useState(false)
  // bumped on every accepted swipe so the idle timer below restarts from the last one
  const [moveTick, setMoveTick] = useState(0)
  // set when a gesture turned out to be a swipe, so the click it may trail does not toggle
  const swipedRef = useRef(false)

  // a device that stops reporting a coarse pointer must not leave the lock (and its scroll
  // suppression) behind
  useEffect(() => {
    if (!coarse) setLocked(false)
  }, [coarse])

  // Safety net: nothing accepted in this long and the lock lets go by itself.
  useEffect(() => {
    if (!locked) return
    const t = setTimeout(() => setLocked(false), LOCK_IDLE_MS)
    return () => clearTimeout(t)
  }, [locked, moveTick])

  const pulseTimer = useRef(0)
  useEffect(() => () => clearTimeout(pulseTimer.current), [])

  // Swipe handling and scroll suppression are the same effect on purpose. The suppression is
  // added and removed by React's own lifecycle rather than by the handlers, so every way out
  // of locked mode — second tap, idle timeout, unmount, a device that stops being touch —
  // restores scrolling without any of them having to remember to.
  useEffect(() => {
    if (!locked) return
    const root = document.documentElement
    root.classList.add('maze-locked')

    let id = null
    let x0 = 0
    let y0 = 0

    const onStart = (e) => {
      swipedRef.current = false
      if (id !== null) return // a second finger joins the gesture, it does not start one
      const t = e.changedTouches[0]
      id = t.identifier
      x0 = t.clientX
      y0 = t.clientY
    }

    // The maze runs vertically on a phone, so a vertical swipe has to reach the ball rather
    // than the page. touch-action on the document is what actually stops the scroll; this is
    // the second lock on the same door, and is also what suppresses the trailing click.
    const onMove = (e) => {
      if (e.cancelable) e.preventDefault()
    }

    const onEnd = (e) => {
      let t = null
      for (const c of e.changedTouches) if (c.identifier === id) t = c
      if (!t) return
      id = null
      const dx = t.clientX - x0
      const dy = t.clientY - y0
      const horizontal = Math.abs(dx) >= Math.abs(dy)
      const along = horizontal ? Math.abs(dx) : Math.abs(dy)
      const across = horizontal ? Math.abs(dy) : Math.abs(dx)
      if (along < SWIPE_MIN_PX || along < across * SWIPE_AXIS_RATIO) return
      swipedRef.current = true
      const moved = pointerRef.current?.move(horizontal ? (dx > 0 ? 'E' : 'W') : dy > 0 ? 'S' : 'N')
      // the swipe counts as attention either way, so the idle timer restarts on both
      setMoveTick((n) => n + 1)
      // Only a BLOCKED move gets feedback. One that works already shows itself: a reveal
      // opens at the destination with the ball inside it. Answering a good move as well
      // would just be noise on top of the thing it is announcing.
      if (!moved) {
        clearTimeout(pulseTimer.current)
        setPulse(true)
        pulseTimer.current = setTimeout(() => setPulse(false), BREATH_MS)
      }
    }

    const onCancel = () => {
      id = null
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd, { passive: true })
    window.addEventListener('touchcancel', onCancel, { passive: true })
    return () => {
      root.classList.remove('maze-locked')
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onCancel)
    }
  }, [locked])

  function toggleLock() {
    if (swipedRef.current) {
      swipedRef.current = false
      return
    }
    setLocked((v) => !v)
  }

  // the header stays transparent (maze shows through) until content scrolls up under it
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollToContact(e) {
    e.preventDefault()
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  // reveal order: nav(0) -> Current label -> its rows -> Previous label -> its
  // rows -> About label -> About body -> footer heading -> contact links
  const curRows = Math.ceil(currentProjects.length / 2)
  const prevLabelOrder = 2 + curRows
  const prevBase = prevLabelOrder + 1
  const prevRows = Math.ceil(previousProjects.length / 2)
  const aboutLabelOrder = prevBase + prevRows
  const aboutBodyOrder = aboutLabelOrder + 1
  const footerHeadingOrder = aboutBodyOrder + 1
  const contactBase = footerHeadingOrder + 1

  /* One rule per word rather than per letter, so the line runs unbroken. Word-level
     insets trim it to the ink of the first and last glyph; the control letters lay a
     gradient segment over their own ink, so the side bearings either side stay grey
     and adjacent controls like "u" and "l" read as two segments, not one.

     --rd/--rt/--re are the wipe's delay, duration and easing. One stroke crosses the
     wordmark, reaching position x at T * x^(1/2.4) with T = 0.4s, and each piece is
     handed the window of that stroke that passes over it. --rd/--rt come straight off
     the curve. --re is the SEGMENT of the curve spanning that piece, refitted to a
     cubic-bezier: a Hermite cubic through the piece's two endpoint velocities, which
     for a power curve over a sub-span is exact to within 1%.

     Per-piece easing is why this reads as one stroke rather than seven. The obvious
     failure is putting the same ease-in on every piece, which restarts the wind-up
     seven times and stutters. But that is a fault of the curve being wrong per piece,
     not of easing per piece: give each one the true slice of the global curve and the
     front's speed is continuous across every boundary, so the acceleration can be far
     more pronounced than a chain of constant-speed chunks could carry. The old
     schedule kept every piece linear, which capped it at three flat speeds and read
     as a constant sweep.

     --rw/--rk are the touch-only window onto the texture strip: the width of the strip as
     a share of the piece, and how far along it to pan. They are measured so the three
     words' rules sample one continuous sweep across the whole wordmark instead of
     restarting it three times. */
  const brandWords = (
    <>
      <span className="brand-word" style={{ '--wl': '0.052em', '--wr': '0.004em', '--rd': '0s', '--rt': '0.237s', '--re': 'cubic-bezier(0.333, 0, 0.667, 0.2)', '--rw': '353%', '--rk': 0 }}>
        Pa
        <span className="brand-key" style={{ '--k': 0, '--kl': '0.052em', '--kr': '0.038em', '--rd': '0.19s', '--rt': '0.03s', '--re': 'cubic-bezier(0.333, 0.3, 0.667, 0.633)' }}>u</span>
        <span className="brand-key" style={{ '--k': 0.16, '--kl': '0.055em', '--kr': '0.004em', '--rd': '0.225s', '--rt': '0.012s', '--re': 'cubic-bezier(0.333, 0.321, 0.667, 0.655)' }}>l</span>
      </span>{' '}
      <span className="brand-word" style={{ '--wl': '0.063em', '--wr': '0.032em', '--rd': '0.253s', '--rt': '0.105s', '--re': 'cubic-bezier(0.333, 0.255, 0.667, 0.585)', '--rw': '230%', '--rk': 0.587 }}>
        Ma
        <span className="brand-key" style={{ '--k': 0.58, '--kl': '0.058em', '--kr': '0em', '--rd': '0.31s', '--rt': '0.013s', '--re': 'cubic-bezier(0.333, 0.324, 0.667, 0.657)' }}>r</span>
        tin
      </span>
      {/* the rule lives on an inline span INSIDE the tld, not on the tld itself: the tld
          is inline-block for its growth animation, and an inline-block resolves the
          rule against its line box while the letters resolve against their content
          area, which put the two at different heights */}
      <span className="brand-tld">
        <span className="brand-word" style={{ '--wl': '0.048em', '--wr': '0em', '--rd': '0.36s', '--rt': '0.04s', '--re': 'cubic-bezier(0.333, 0.309, 0.667, 0.642)', '--rw': '449%', '--rk': 1 }}>
          .
          <span className="brand-key" style={{ '--k': 1, '--kl': '0.035em', '--kr': '0.037em', '--rd': '0.365s', '--rt': '0.011s', '--re': 'cubic-bezier(0.333, 0.326, 0.667, 0.66)' }}>d</span>
          ev
        </span>
      </span>
    </>
  )

  const brandClass = [
    'brand',
    playIntro && !armed ? 'brand-hidden' : '',
    hintOn ? 'brand--hint' : '',
    coarse ? 'brand--touch' : '',
    locked ? 'brand--locked' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <RevealProvider active={armed} stagger={240}>
      <MazeBackground onSolve={() => navigate('/solved')} pointerApi={pointerRef} />
      {showIntro && (
        <IntroWake pointer={pointerRef} onReveal={handoff} onDone={() => setShowIntro(false)} />
      )}
      <div className={`landing entered${introHold ? ' intro-hold' : ''}`}>
        <header
          className={`site-header${scrolled ? ' scrolled' : ''}${pulse ? ' pulsed' : ''}`}
        >
          {/* On a coarse pointer the wordmark is a control, so it is a real button: it gets
              pressed state, focus and Enter/Space for free, and nothing has to be bolted onto
              an <h1>. A fine pointer renders the same spans bare, exactly as before.

              The button is mounted for the whole of a touch visit and merely disabled until
              the hint has been earned, rather than appearing at that moment. Swapping the
              wrapper on hintOn would reparent the word spans in the same commit that adds
              brand--hint, and freshly mounted nodes have no previous value to transition
              from: the rules would arrive already drawn instead of drawing on. */}
          <h1 className={brandClass} style={{ '--brand-tex': `url(${brandTex})` }}>
            {coarse ? (
              <button
                type="button"
                className="brand-toggle"
                disabled={!hintOn}
                aria-pressed={locked}
                aria-label="Paul Martin.dev. Tap to steer the maze by swiping."
                onClick={toggleLock}
              >
                {brandWords}
              </button>
            ) : (
              brandWords
            )}
          </h1>
          <Reveal as="nav" order={0} className="site-nav">
            <a href={RESUME_URL} target="_blank" rel="noopener noreferrer">
              Resume
            </a>
            <span className="sep">·</span>
            <a href="#contact" onClick={scrollToContact}>
              Contact
            </a>
          </Reveal>
        </header>

        <main>
          <section className="section" aria-labelledby="current-label">
            <Reveal
              as="p"
              order={1}
              className="section-label"
              id="current-label"
            >
              Current Projects
            </Reveal>
            <div className="cards">
              {currentProjects.map((p, i) => (
                <ProjectCard
                  key={p.slug}
                  project={p}
                  order={2 + Math.floor(i / 2)}
                />
              ))}
            </div>
          </section>

          <section className="section" aria-labelledby="previous-label">
            <Reveal
              as="p"
              order={prevLabelOrder}
              className="section-label"
              id="previous-label"
            >
              Previous Projects
            </Reveal>
            <div className="cards">
              {previousProjects.map((p, i) => (
                <ProjectCard
                  key={p.slug}
                  project={p}
                  order={prevBase + Math.floor(i / 2)}
                />
              ))}
            </div>
          </section>

          <section className="section about" aria-labelledby="about-label">
            <Reveal
              as="p"
              order={aboutLabelOrder}
              className="section-label"
              id="about-label"
            >
              About Me
            </Reveal>
            <Reveal as="div" order={aboutBodyOrder} className="about-body">
              <p>
                I’m a software engineer focused on building games and interactive
                experiences. My passion is bringing new and unseen experiences into the world
                in a way that feels like magic.
              </p>
            </Reveal>
          </section>
        </main>

        <footer id="contact" className="site-footer">
          <Reveal as="h2" order={footerHeadingOrder} className="footer-heading">
            Want to get in touch?
          </Reveal>
          <div className="contact-list">
            <Reveal
              as="a"
              order={contactBase}
              className="contact-item"
              href="mailto:p@ulmartin.me"
            >
              <span className="contact-kind">Email</span>
              <span className="contact-value">p@ulmartin.me</span>
            </Reveal>
            <Reveal
              as="a"
              order={contactBase + 1}
              className="contact-item"
              href="https://bsky.app/profile/made4me.bsky.social"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="contact-kind">Bluesky</span>
              <span className="contact-value">@made4me.bsky.social</span>
            </Reveal>
            <Reveal
              as="a"
              order={contactBase + 2}
              className="contact-item"
              href="https://www.linkedin.com/in/paul-martin-b8547616/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="contact-kind">LinkedIn</span>
              <span className="contact-value">Paul Martin</span>
            </Reveal>
          </div>
        </footer>
      </div>
    </RevealProvider>
  )
}
