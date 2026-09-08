import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, within, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Machine from './Machine.jsx'
import { MOVES, SEQUENCE } from './model.js'

afterEach(() => {
  cleanup()
  delete window.matchMedia
})

// Faces reach for react-router (project plaques render an <OrgTag> <Link>) and
// for matchMedia, so mount the whole machine inside a router with matchMedia
// stubbed to no reduced-motion.
function renderMachine() {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  return render(
    <MemoryRouter>
      <Machine />
    </MemoryRouter>,
  )
}

describe('whole-puzzle clue integrity', () => {
  it('every rendered data-clue hook agrees with its MOVES entry, derived not hardcoded', () => {
    const { container } = renderMachine()
    const hooks = Array.from(container.querySelectorAll('[data-clue-order]'))
    // The faces carry their clues by different visual mechanisms; only some are
    // exposed as data-clue-order hooks. Whichever render must match MOVES exactly.
    expect(hooks.length).toBeGreaterThan(0)
    hooks.forEach((el) => {
      const order = Number(el.getAttribute('data-clue-order'))
      const move = MOVES.find((m) => m.order === order)
      expect(move, `MOVES has an entry for clue order ${order}`).toBeTruthy()
      expect(el.getAttribute('data-clue-direction')).toBe(move.direction)
    })
  })

  it('entering SEQUENCE into Face V opens the lock and reveals the drive', () => {
    renderMachine()
    const faceV = screen.getByRole('region', { name: 'Face V' })
    for (const direction of SEQUENCE) {
      fireEvent.click(within(faceV).getByRole('button', { name: direction }))
    }
    const slab = faceV.querySelector('.face5-slab')
    expect(slab.getAttribute('data-stage')).toBe('open')
    expect(within(faceV).getByLabelText('Take the drive')).toBeInTheDocument()
  })
})

describe('whole-puzzle DOM order and semantics', () => {
  it('exposes the five faces as regions in DOM order Face I..Face V', () => {
    renderMachine()
    const regions = screen.queryAllByRole('region')
    expect(regions.map((r) => r.getAttribute('aria-label'))).toEqual([
      'Face I',
      'Face II',
      'Face III',
      'Face IV',
      'Face V',
    ])
  })

  it('names the page via the document h1', () => {
    renderMachine()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Paul Martin')
  })
})
