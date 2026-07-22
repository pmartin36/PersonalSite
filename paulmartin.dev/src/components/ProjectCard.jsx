import { Link, useNavigate } from 'react-router-dom'
import { useReveal } from '../reveal'
import Carousel from './Carousel'

export default function ProjectCard({ project, order = 0 }) {
  const [ref, shown] = useReveal(order)
  const navigate = useNavigate()
  const to = `/projects/${project.slug}`

  return (
    <article ref={ref} className={`card reveal${shown ? ' in' : ''}`}>
      <div
        className="card-media"
        onClick={() => navigate(to)}
        aria-hidden="true"
      >
        <Carousel hue={project.hue} shots={project.shots} />
      </div>
      <div className="card-body">
        <div className="card-top">
          <h3 className="card-name">
            <Link to={to}>{project.name}</Link>
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
