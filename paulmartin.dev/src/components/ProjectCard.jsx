import { Link } from 'react-router-dom'
import { useReveal } from '../reveal'
import { useRaft } from '../useRaft'
import Still from './Still'
import OrgTag from './OrgTag'

export default function ProjectCard({ project, order = 0, seedRef }) {
  const [revealRef, shown] = useReveal(order)
  const raftRef = useRaft(seedRef)
  const to = `/projects/${project.slug}`

  // The reveal wrapper carries the scroll-in animation; the inner <article> is the raft, and
  // the useRaft hook owns its 3D transform. The card name's link stretches over the whole card
  // (see .card-name > a::after), so the whole raft is one click target.
  return (
    <div ref={revealRef} className={`raft-wrap reveal${shown ? ' in' : ''}`}>
      <article ref={raftRef} className="card">
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
    </div>
  )
}
