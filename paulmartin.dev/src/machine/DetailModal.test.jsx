import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DetailModal from './DetailModal.jsx'
import { currentProjects } from '../data/projects.js'

// code-scenes has no org and no internal links, so its detail content never
// touches react-router — no Router wrapper needed here.
const project = currentProjects.find((p) => p.slug === 'code-scenes')

afterEach(() => {
  cleanup()
})

describe('DetailModal content', () => {
  it('renders the title, headline, a body paragraph, and each link label', () => {
    render(<DetailModal project={project} onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { name: project.name })).toBeInTheDocument()
    expect(screen.getByText(project.headline)).toBeInTheDocument()
    expect(screen.getByText(project.body[0])).toBeInTheDocument()
    for (const link of project.links) {
      expect(screen.getByText(link.label)).toBeInTheDocument()
    }
  })

  it('returns null when neither a project nor a resolvable slug is given', () => {
    const { container } = render(<DetailModal onClose={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })
})

describe('DetailModal dialog semantics', () => {
  it('exposes role="dialog", aria-modal="true", and an accessible name matching the project title', () => {
    render(<DetailModal project={project} onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog', { name: project.name })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('moves focus into the dialog when it opens', () => {
    render(<DetailModal project={project} onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.contains(document.activeElement)).toBe(true)
  })
})

describe('DetailModal close interactions', () => {
  it('invokes onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<DetailModal project={project} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('invokes onClose when the close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<DetailModal project={project} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('invokes onClose on backdrop click but not on a click inside the dialog panel', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<DetailModal project={project} onClose={onClose} />)
    await user.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
    await user.click(screen.getByTestId('detail-modal-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('DetailModal focus trap and restore', () => {
  it('wraps Tab from the last focusable element to the first', async () => {
    const user = userEvent.setup()
    render(<DetailModal project={project} onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog')
    const focusable = dialog.querySelectorAll('button, a[href]')
    focusable[focusable.length - 1].focus()
    await user.tab()
    expect(document.activeElement).toBe(focusable[0])
  })

  it('wraps Shift+Tab from the first focusable element to the last', async () => {
    const user = userEvent.setup()
    render(<DetailModal project={project} onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog')
    const focusable = dialog.querySelectorAll('button, a[href]')
    focusable[0].focus()
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(focusable[focusable.length - 1])
  })

  it('restores focus to the opener when the modal is unmounted', () => {
    const opener = document.createElement('button')
    opener.textContent = 'Open'
    document.body.appendChild(opener)
    opener.focus()

    const { unmount } = render(<DetailModal project={project} onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.contains(document.activeElement)).toBe(true)

    unmount()
    expect(document.activeElement).toBe(opener)

    opener.remove()
  })
})

describe('DetailModal scrollable body', () => {
  it('gives the scrollable body its own class and no scroll-capture marker attribute', () => {
    render(<DetailModal project={project} onClose={vi.fn()} />)
    const body = document.querySelector('.detail-modal__body')
    expect(body).not.toBeNull()
    for (const attr of body.attributes) {
      expect(attr.name.startsWith('data-scroll')).toBe(false)
      expect(attr.name.startsWith('data-marker')).toBe(false)
    }
  })
})
