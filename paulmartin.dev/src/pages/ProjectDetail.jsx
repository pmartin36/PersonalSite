import { useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { getProject } from '../data/projects'
import ProjectMedia from '../components/ProjectMedia'
import OrgTag from '../components/OrgTag'

const RESUME_URL =
  'https://drive.google.com/file/d/1SpGooyH4FvJe9ykl-nXWoyM3i8u40Vyr/view?usp=sharing'

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

function DetailLink({ link }) {
  const body = (
    <>
      {link.kind === 'github' && <GitHubMark />}
      <span>{link.label}</span>
    </>
  )

  if (link.internal) {
    return (
      <Link to={link.href} className="detail-link">
        {body}
      </Link>
    )
  }
  return (
    <a
      href={link.href}
      className="detail-link"
      target="_blank"
      rel="noopener noreferrer"
    >
      {body}
    </a>
  )
}

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
          <ProjectMedia media={project.hero} />
        </div>
        <h1 className="detail-title">
          <span>{project.name}</span>
          <OrgTag org={project.org} />
        </h1>
        <p className="detail-headline">{project.headline}</p>
        <div className="detail-meta">
          <span className="card-year">{project.year}</span>
          {project.role && <span className="tag role">{project.role}</span>}
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
              <DetailLink key={l.label} link={l} />
            ))}
          </div>
        )}
      </article>
    </div>
  )
}
