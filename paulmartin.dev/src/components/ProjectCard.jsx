import { Link } from 'react-router-dom'
import { useReveal } from '../reveal'
import Still from './Still'
import OrgTag from './OrgTag'

export default function ProjectCard({ project, order = 0 }) {
  const [ref, shown] = useReveal(order)
  const to = `/projects/${project.slug}`

  // The card name's link stretches over the whole card (see .card-name > a::after),
  // so the entire card is clickable without an onClick handler on a div.
  return (
    <article ref={ref} className={`card reveal${shown ? ' in' : ''}`}>
      <div className="card-media">
        <Still image={project.thumb} className="media-still" />
      </div>
      <div className="card-body">
        <div className="card-top">
          <h3 className="card-name">
            <Link to={to}>{project.name}</Link>
            <OrgTag org={project.org} />
          </h3>
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
        <Link to={to} className="card-more">
          See details
        </Link>
      </div>
    </article>
  )
}
