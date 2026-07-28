import { Link } from 'react-router-dom'
import { solvers } from '../data/solvers'

// Reached when someone solves the hidden maze (see Landing's onSolve).
// The roll of solvers only appears once there is someone on it; adding entries
// to data/solvers.js brings back its heading and list.
export default function Solved() {
  return (
    <div className="solved">
      <div className="solved-inner">
        <h1 className="solved-title">You found the way through.</h1>
        <p className="solved-lede">
          Drop me a line and I'll add you to the list of people who made it out.
        </p>
        <p className="solved-cta">
          <a href="mailto:p@ulmartin.me?subject=I%20solved%20the%20maze">
            p@ulmartin.me
          </a>
        </p>

        {solvers.length > 0 && (
          <div className="solved-list">
            <p className="solved-list-label">Made it through</p>
            <ul>
              {solvers.map((s, i) => (
                <li key={i}>
                  <span className="solved-name">{s.name}</span>
                  {s.note ? <span className="solved-note">{s.note}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link to="/" className="solved-back">
          ← back
        </Link>
      </div>
    </div>
  )
}
