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

  return (
    <RevealProvider active={armed} stagger={240}>
      <MazeBackground onSolve={() => navigate('/solved')} pointerApi={pointerRef} />
      {showIntro && (
        <IntroWake pointer={pointerRef} onReveal={handoff} onDone={() => setShowIntro(false)} />
      )}
      <div className={`landing entered${introHold ? ' intro-hold' : ''}`}>
        <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
          {/* One rule per word rather than per letter, so the line runs unbroken. Word-level
              insets trim it to the ink of the first and last glyph; the control letters lay a
              gradient segment over their own ink, so the side bearings either side stay grey
              and adjacent controls like "u" and "l" read as two segments, not one.

              --rd/--rt are the wipe's delay and duration, derived from where each piece sits
              along the wordmark: the stroke reaches position x at T * x^0.625, so it starts
              slow and gains speed. Encoding the ease in the DELAYS and keeping each piece
              linear is what makes it one accelerating stroke; an ease-in curve on every
              piece would instead have each of them start slow and stutter in turn. */}
          <h1
            className={`brand${playIntro && !armed ? ' brand-hidden' : ''}${hintOn ? ' brand--hint' : ''}`}
            style={{ '--brand-tex': `url(${brandTex})` }}
          >
            <span className="brand-word" style={{ '--wl': '0.052em', '--wr': '0.004em', '--rd': '0.03s', '--rt': '0.256s' }}>
              Pa
              <span className="brand-key" style={{ '--k': 0, '--kl': '0.052em', '--kr': '0.038em', '--rd': '0.207s', '--rt': '0.05s' }}>u</span>
              <span className="brand-key" style={{ '--k': 0.16, '--kl': '0.055em', '--kr': '0.004em', '--rd': '0.266s', '--rt': '0.02s' }}>l</span>
            </span>{' '}
            <span className="brand-word" style={{ '--wl': '0.063em', '--wr': '0.032em', '--rd': '0.314s', '--rt': '0.213s' }}>
              Ma
              <span className="brand-key" style={{ '--k': 0.58, '--kl': '0.058em', '--kr': '0em', '--rd': '0.425s', '--rt': '0.026s' }}>r</span>
              tin
            </span>
            {/* the rule lives on an inline span INSIDE the tld, not on the tld itself: the tld
                is inline-block for its growth animation, and an inline-block resolves the
                rule against its line box while the letters resolve against their content
                area, which put the two at different heights */}
            <span className="brand-tld">
              <span className="brand-word" style={{ '--wl': '0.048em', '--wr': '0em', '--rd': '0.532s', '--rt': '0.088s' }}>
                .
                <span className="brand-key" style={{ '--k': 1, '--kl': '0.035em', '--kr': '0.037em', '--rd': '0.543s', '--rt': '0.024s' }}>d</span>
                ev
              </span>
            </span>
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
