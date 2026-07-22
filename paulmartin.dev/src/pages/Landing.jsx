import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { currentProjects, previousProjects } from '../data/projects'
import ProjectCard from '../components/ProjectCard'
import { RevealProvider, Reveal } from '../reveal'

const RESUME_URL =
  'https://drive.google.com/file/d/1SpGooyH4FvJe9ykl-nXWoyM3i8u40Vyr/view?usp=sharing'

export default function Landing() {
  const [params] = useSearchParams()
  const skipIntro = params.get('from') === 'ulmartin'
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // entered = name has settled into the header; armed = the content cascade may
  // begin (a beat after the settle, so the name lands first).
  const [entered, setEntered] = useState(skipIntro || reduce)
  const [armed, setArmed] = useState(skipIntro || reduce)

  useEffect(() => {
    if (reduce || skipIntro) return
    const t1 = setTimeout(() => setEntered(true), 400)
    const t2 = setTimeout(() => setArmed(true), 1150)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
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
      <div className={`landing${entered ? ' entered' : ''}`}>
        <header className="site-header">
          <h1 className="brand">Paul Martin</h1>
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
              About
            </Reveal>
            <Reveal as="div" order={aboutBodyOrder} className="about-body">
              <p>
                I'm a software developer who builds web apps, games, and the
                occasional tool. I care about the small details that make
                software feel good to use.
              </p>
              <p className="about-note">
                (Placeholder — replace with your own words.)
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
