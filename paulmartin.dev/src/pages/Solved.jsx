import { Link } from 'react-router-dom'
import { solvers } from '../data/solvers'

// TEMPORARY page. Reached when someone solves the hidden maze (see Landing's
// onSolve -> navigate here). Copy/verbiage is a placeholder — Paul will rewrite
// it, and the "get added to the list" flow is TBD (no backend yet).
export default function Solved() {
  return (
    <div className="solved">
      <div className="solved-inner">
        <p className="solved-eyebrow">You found the way through.</p>
        <h1 className="solved-title">Through the maze.</h1>
        <p className="solved-lede">
          {/* PLACEHOLDER verbiage — rewrite later. */}
          Nice — most people never realize it's there. Drop me a line and I'll add
          you to the list of people who made it out.
        </p>
        <p className="solved-cta">
          <a href="mailto:p@ulmartin.me?subject=I%20solved%20the%20maze">
            p@ulmartin.me
          </a>
        </p>

        <div className="solved-list">
          <p className="solved-list-label">Made it through</p>
          {solvers.length === 0 ? (
            <p className="solved-empty">Be the first.</p>
          ) : (
            <ul>
              {solvers.map((s, i) => (
                <li key={i}>
                  <span className="solved-name">{s.name}</span>
                  {s.note ? <span className="solved-note">{s.note}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link to="/" className="solved-back">
          ← back
        </Link>
      </div>
    </div>
  )
}
