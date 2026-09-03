import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { getProject } from '../data/projects'
import { useAudio } from './audio.jsx'
import ProjectMedia from '../components/ProjectMedia'
import OrgTag from '../components/OrgTag'
import './DetailModal.css'

const FOCUSABLE_SELECTOR =
  'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

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
    <a href={link.href} className="detail-link" target="_blank" rel="noopener noreferrer">
      {body}
    </a>
  )
}

// Focus-trapped detail overlay for a project, portaled to document.body so it
// escapes the machine drum's 3D transform and covers the true viewport.
// `project` is the preferred input; `slug` is a fallback resolved through
// getProject. Renders nothing when neither yields a project — the caller
// controls open/closed by mounting/unmounting this component.
export default function DetailModal({ project: projectProp, slug, onClose }) {
  const project = projectProp ?? (slug ? getProject(slug) : undefined)
  const panelRef = useRef(null)
  const titleId = 'detail-modal-title'
  const { playDetailOpen, playDetailClose } = useAudio()
  const openedRef = useRef(false)
  // A close that plays the dismiss tap first, then closes (covers X, backdrop, Escape).
  const handleClose = useCallback(() => {
    playDetailClose()
    onClose?.()
  }, [playDetailClose, onClose])

  // Play the open tap once, when the panel first opens.
  useEffect(() => {
    if (project && !openedRef.current) {
      openedRef.current = true
      playDetailOpen()
    }
  }, [project, playDetailOpen])

  useEffect(() => {
    if (!project) return undefined

    const opener = document.activeElement
    const panel = panelRef.current
    const focusable = panel?.querySelectorAll(FOCUSABLE_SELECTOR)
    ;(focusable?.[0] ?? panel)?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        handleClose()
        return
      }
      if (event.key !== 'Tab') return

      const currentPanel = panelRef.current
      if (!currentPanel) return
      const focusableEls = Array.from(currentPanel.querySelectorAll(FOCUSABLE_SELECTOR))
      if (focusableEls.length === 0) return

      const first = focusableEls[0]
      const last = focusableEls[focusableEls.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
      } else if (document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      opener?.focus()
    }
  }, [project, handleClose])

  if (!project) return null

  return createPortal(
    <div
      className="detail-modal__backdrop"
      data-testid="detail-modal-backdrop"
      onClick={handleClose}
    >
      <div
        ref={panelRef}
        className="detail-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="detail-modal__close"
          aria-label="Close"
          onClick={handleClose}
        >
          &times;
        </button>
        <div className="detail-modal__body">
          <div className="detail-media">
            <ProjectMedia media={project.hero} />
          </div>
          <h1 className="detail-title" id={titleId}>
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
        </div>
      </div>
    </div>,
    document.body,
  )
}
