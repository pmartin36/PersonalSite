import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { currentProjects, previousProjects } from '../data/projects'
import ProjectCard from '../components/ProjectCard'
import MazeBackground from '../components/MazeBackground'
import ChevronDots from '../components/ChevronDots'
import NameShimmer from '../components/NameShimmer'

const RESUME_URL =
  'https://drive.google.com/file/d/1utBX7U7q98kJ-Uqrk-3AnSkR2xn6BEXH/view?usp=sharing'

export default function Landing() {
  const navigate = useNavigate()
  // filled by MazeBackground; the rafts feed ripples and wakes through it
  const pointerRef = useRef(null)
  const heroInnerRef = useRef(null)
  const heroNameRef = useRef(null)
  // true once the hero name has drifted up; brings in the corner chrome
  const [pastHero, setPastHero] = useState(false)

  // hero name fill opacity, overridable live with ?nameFill=<0..1> (case-insensitive)
  const nameFill = (() => {
    const params = new URLSearchParams(window.location.search)
    let v = null
    for (const [k, val] of params) if (k.toLowerCase() === 'namefill') v = val
    return v !== null && v !== '' && !Number.isNaN(+v) ? Math.max(0, Math.min(1, +v)) : null
  })()

  // ---- scroll: hero drift + section float-in/out + card wakes ----
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let ticking = false
    let lastY = window.scrollY
    let wakeAcc = 0

    const apply = () => {
      ticking = false
      const vh = window.innerHeight
      const y = window.scrollY

      // hero name rides up and fades, shedding a wake, as the first viewport scrolls away
      const hp = Math.min(1, Math.max(0, y / (vh * 0.72)))
      const inner = heroInnerRef.current
      if (inner && !reduce) {
        inner.style.transform = `translateY(${(-hp * vh * 0.55).toFixed(1)}px)`
        inner.style.opacity = (1 - hp).toFixed(3)
      }
      setPastHero(hp > 0.14)

      // each drifting section floats up from below into center and off the top as it leaves
      if (!reduce) {
        const drifters = document.querySelectorAll('.drift')
        for (const el of drifters) {
          const r = el.getBoundingClientRect()
          const p = (r.top + r.height / 2 - vh / 2) / vh // 0 centered, + below, - above
          const pc = Math.max(-1.3, Math.min(1.3, p))
          el.style.transform = `translateY(${(pc * vh * 0.2).toFixed(1)}px)`
          const fade = Math.max(0, 1 - Math.max(0, Math.abs(p) - 0.12) / 0.55)
          el.style.opacity = fade.toFixed(3)
        }
      }

      // rafts shed gentle wakes as they ride up on the scroll (soft = dampened, kept subtle)
      const dy = y - lastY
      lastY = y
      const api = pointerRef.current
      if (!reduce && api && api.seedAt) {
        const nameEl = heroNameRef.current
        if (nameEl && dy > 0 && hp > 0.02 && hp < 1 && Math.random() < Math.min(1, dy / 34)) {
          const r = nameEl.getBoundingClientRect()
          api.seedAt(r.left + Math.random() * r.width, r.bottom, {
            dir: -Math.PI / 2, spd: 1.5, life: 70, spread: 1.0, r0: 20, peak: 0.5,
          })
        }
        // rafts shed a wake off their trailing (bottom) edge as they ride up on the scroll
        wakeAcc += Math.abs(dy)
        if (wakeAcc > 32) {
          wakeAcc = 0
          for (const c of document.querySelectorAll('.card')) {
            const r = c.getBoundingClientRect()
            if (r.bottom < 0 || r.top > vh) continue
            api.seedAt(r.left + r.width * (0.3 + Math.random() * 0.4), r.bottom + 6, {
              dir: -Math.PI / 2, spd: 0.9, life: 85, spread: 1.1, r0: 26, peak: 0.72,
            })
          }
        }
      }
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(apply)
    }
    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  function scrollToContact(e) {
    e.preventDefault()
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <MazeBackground onSolve={() => navigate('/solved')} pointerApi={pointerRef} />

      <div className="landing">
        <section className="snap-section hero" aria-label="Paul Martin">
          <div className="hero-inner" ref={heroInnerRef}>
            <div className="hero-name-wrap">
              <h1
                className="hero-name"
                ref={heroNameRef}
                style={nameFill != null ? { '--name-fill': nameFill } : undefined}
              >
                Paul Martin
              </h1>
              <NameShimmer targetRef={heroNameRef} text="Paul Martin" />
            </div>
          </div>
          <ChevronDots className={pastHero ? 'is-gone' : ''} />
        </section>

        <section className="snap-section" aria-labelledby="current-label">
          <div className="drift section-inner section-inner--wide">
            <p className="section-label" id="current-label">
              Current Projects
            </p>
            <div className="cards cards-3">
              {currentProjects.map((p) => (
                <ProjectCard key={p.slug} project={p} seedRef={pointerRef} />
              ))}
            </div>
          </div>
        </section>

        <section className="previous-section" aria-labelledby="previous-label">
          <div className="section-inner section-inner--mid">
            <p className="section-label" id="previous-label">
              Previous Projects
            </p>
            <div className="cards cards-2">
              {previousProjects.map((p) => (
                <ProjectCard key={p.slug} project={p} seedRef={pointerRef} />
              ))}
            </div>
          </div>
        </section>

        <section className="snap-section" id="contact" aria-labelledby="about-label">
          <div className="drift section-inner section-inner--narrow about">
            <p className="section-label" id="about-label">
              About &amp; Contact
            </p>
            <div className="about-body">
              <p>
                I’m a software engineer focused on building games and interactive experiences. My
                passion is bringing new and unseen experiences into the world in a way that feels
                like magic.
              </p>
            </div>

            <div className="contact-list">
              <a className="contact-item" href="mailto:p@ulmartin.me">
                <span className="contact-kind">Email</span>
                <span className="contact-value">p@<span className="hl">u</span>lmartin.me</span>
              </a>
              <a
                className="contact-item"
                href="https://bsky.app/profile/paulmartindev.bsky.social"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="contact-kind">Bluesky</span>
                <span className="contact-value">@paulmartin<span className="hl">d</span>ev.bsky.socia<span className="hl">l</span></span>
              </a>
              <a
                className="contact-item"
                href="https://www.linkedin.com/in/paul-martin-b8547616/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="contact-kind">LinkedIn</span>
                <span className="contact-value">Paul Ma<span className="hl">r</span>tin</span>
              </a>
            </div>
          </div>
        </section>
      </div>

      <div className="corner corner-stack show">
        <div className={`corner-name${pastHero ? ' in' : ''}`}>Paul Martin</div>
        <nav className="corner-links" aria-label="Resume and contact">
          <a href={RESUME_URL} target="_blank" rel="noopener noreferrer">
            Resume
          </a>
          <span className="sep">·</span>
          <a href="#contact" onClick={scrollToContact}>
            Contact
          </a>
        </nav>
      </div>
    </>
  )
}
