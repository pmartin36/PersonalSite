import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { currentProjects, previousProjects } from '../data/projects'
import ProjectCard from '../components/ProjectCard'

const RESUME_URL =
  'https://drive.google.com/file/d/1SpGooyH4FvJe9ykl-nXWoyM3i8u40Vyr/view?usp=sharing'

export default function Landing() {
  const [params] = useSearchParams()
  const skipIntro = params.get('from') === 'ulmartin'
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Arrivals from the ulmartin.me transition (or reduced-motion) land settled.
  const [entered, setEntered] = useState(skipIntro || reduce)

  useEffect(() => {
    if (entered) return
    const t = setTimeout(() => setEntered(true), 450) // brief hold, then settle
    return () => clearTimeout(t)
  }, [entered])

  function scrollToContact(e) {
    e.preventDefault()
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className={`landing${entered ? ' entered' : ''}`}>
      <header className="site-header">
        <h1 className="brand">Paul Martin</h1>
        <nav className="site-nav">
          <a href={RESUME_URL} target="_blank" rel="noopener noreferrer">
            Resume
          </a>
          <span className="sep">·</span>
          <a href="#contact" onClick={scrollToContact}>
            Contact
          </a>
        </nav>
      </header>

      <main>
        <section className="section" aria-labelledby="current-label">
          <p className="section-label" id="current-label">
            Current Projects
          </p>
          <div className="cards">
            {currentProjects.map((p, i) => (
              <ProjectCard key={p.slug} project={p} index={i} />
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="previous-label">
          <p className="section-label" id="previous-label">
            Previous Projects
          </p>
          <div className="cards">
            {previousProjects.map((p, i) => (
              <ProjectCard key={p.slug} project={p} index={i} />
            ))}
          </div>
        </section>

        <section className="section" id="contact" aria-labelledby="contact-label">
          <p className="section-label" id="contact-label">
            Contact
          </p>
          <p className="contact-body">Coming soon.</p>
        </section>
      </main>
    </div>
  )
}
