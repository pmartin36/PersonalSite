import Still from '../components/Still.jsx'
import OrgTag from '../components/OrgTag.jsx'
import './ProjectPlaque.css'

// Gild the clue characters of a field gold: the colored-clue tells (Face III).
// Finds the first free occurrence of each tint's character in this field and
// wraps it; other characters pass through untouched. A no-op when this field
// carries no tint.
function renderField(text, tints, field) {
  const here = (tints || []).filter((t) => t.field === field)
  if (here.length === 0) return text
  const marks = []
  const used = new Set()
  for (const t of here) {
    let i = text.indexOf(t.char)
    while (i !== -1 && used.has(i)) i = text.indexOf(t.char, i + 1)
    if (i === -1) continue
    used.add(i)
    marks.push({ i, char: t.char, piece: t.piece })
  }
  if (marks.length === 0) return text
  marks.sort((a, b) => a.i - b.i)
  const out = []
  let cursor = 0
  marks.forEach((m, k) => {
    if (m.i > cursor) out.push(text.slice(cursor, m.i))
    out.push(
      <span key={`clue${k}`} className="plaque__clue" data-clue-piece={m.piece}>
        {m.char}
      </span>,
    )
    cursor = m.i + m.char.length
  })
  if (cursor < text.length) out.push(text.slice(cursor))
  return out
}

// The obsidian project card: media, a title that opens the detail modal (with a
// generous hit box), org, year, headline, blurb, tags. Machine palette, not the
// old galaxy theme. Shared by the current- and past-project faces. On Face III
// tints gild the clue characters in the headline or blurb.
export default function ProjectPlaque({ project, onOpen, tints }) {
  return (
    <div className="plaque">
      <div className="plaque__media">
        <Still image={project.thumb} className="plaque__still" />
      </div>
      <div className="plaque__body">
        <div className="plaque__heading">
          <h3 className="plaque__name">
            <button
              type="button"
              className="plaque__open"
              onClick={(event) => {
                event.stopPropagation()
                onOpen(project)
              }}
            >
              {project.name}
            </button>
            <OrgTag org={project.org} />
          </h3>
          <span className="plaque__year">{project.year}</span>
        </div>
        <p className="plaque__headline">
          {renderField(project.headline, tints, 'headline')}
        </p>
        <p className="plaque__blurb">
          {renderField(project.blurb, tints, 'blurb')}
        </p>
        <div className="plaque__tags">
          {project.tags.map((t) => (
            <span key={t} className="plaque__tag">
              {t}
            </span>
          ))}
        </div>
        <button
          type="button"
          className="plaque__details"
          onClick={(event) => {
            event.stopPropagation()
            onOpen(project)
          }}
        >
          See details
        </button>
      </div>
    </div>
  )
}
