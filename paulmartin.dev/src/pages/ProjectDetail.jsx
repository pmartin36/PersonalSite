import { useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { getProject } from '../data/projects'
import Carousel from '../components/Carousel'

const RESUME_URL =
  'https://drive.google.com/file/d/1SpGooyH4FvJe9ykl-nXWoyM3i8u40Vyr/view?usp=sharing'

export default function ProjectDetail() {
  const { slug } = useParams()
  const project = getProject(slug)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (!project) return <Navigate to="/" replace />

  return (
    <div>
      <header className="site-header">
        <Link to="/" className="brand">
          Paul Martin
        </Link>
        <nav className="site-nav">
          <a href={RESUME_URL} target="_blank" rel="noopener noreferrer">
            Resume
          </a>
          <span className="sep">·</span>
          <Link to="/#contact">Contact</Link>
        </nav>
      </header>

      <article className="detail">
        <Link to="/" className="detail-back">
          ← Back
        </Link>
        <div className="detail-media">
          <Carousel hue={project.hue} shots={project.shots} />
        </div>
        <h1 className="detail-title">{project.name}</h1>
        <p className="detail-headline">{project.headline}</p>
        <div className="detail-meta">
          <span className="card-year">{project.year}</span>
          {project.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
        <div className="detail-body">
          {project.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        {project.links?.length > 0 && (
          <div className="detail-links">
            {project.links.map((l) => (
              <a key={l.label} href={l.href}>
                {l.label} →
              </a>
            ))}
          </div>
        )}
      </article>
    </div>
  )
}
