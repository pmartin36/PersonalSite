import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { currentProjects, previousProjects } from '../data/projects'
import ProjectCard from '../components/ProjectCard'
import MazeBackground from '../components/MazeBackground'
import IntroWake from '../components/IntroWake'
import { RevealProvider, Reveal } from '../reveal'

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
      <MazeBackground onSolve={() => navigate('/solved')} />
      {showIntro && (
        <IntroWake onReveal={handoff} onDone={() => setShowIntro(false)} />
      )}
      <div className={`landing entered${introHold ? ' intro-hold' : ''}`}>
        <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
          <h1 className={`brand${playIntro && !armed ? ' brand-hidden' : ''}`}>
            Paul Martin
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
