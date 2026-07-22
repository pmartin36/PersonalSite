import { Link } from 'react-router-dom'
import { useReveal } from '../hooks/useReveal'

// Whole card is the link to the detail page; reveals on scroll with a small
// per-column stagger.
export default function ProjectCard({ project, index = 0 }) {
  const [ref, shown] = useReveal()
  return (
    <Link
      ref={ref}
      to={`/projects/${project.slug}`}
      className={`card reveal${shown ? ' in' : ''}`}
      style={{ transitionDelay: `${(index % 2) * 90}ms` }}
    >
      <div className="card-top">
        <h3 className="card-name">{project.name}</h3>
        <span className="card-year">{project.year}</span>
      </div>
      <p className="card-headline">{project.headline}</p>
      <p className="card-blurb">{project.blurb}</p>
      {project.tags?.length > 0 && (
        <div className="card-tags">
          {project.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      )}
      <span className="card-more">See details</span>
    </Link>
  )
}
