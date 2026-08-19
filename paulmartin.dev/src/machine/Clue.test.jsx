import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Clue, { DIRECTION_GLYPH } from './Clue.jsx'
import FaceSurface from './FaceSurface.jsx'
import { MOVES } from './model.js'

describe('Clue data hooks', () => {
  for (const move of [
    { order: 1, direction: 'Up' },
    { order: 2, direction: 'Right' },
    { order: 3, direction: 'Left' },
    { order: 4, direction: 'Up' },
    { order: 5, direction: 'Down' },
    { order: 6, direction: 'Left' },
  ]) {
    it(`order ${move.order} emits data-clue-order/direction from MOVES`, () => {
      const { container } = render(<Clue order={move.order} />)
      const el = container.querySelector(`[data-clue-order="${move.order}"]`)
      expect(el).not.toBeNull()
      expect(el.getAttribute('data-clue-direction')).toBe(move.direction)
    })
  }

  it('renders a glyph derived from the MOVES direction, not a re-typed literal', () => {
    const entry = MOVES.find((m) => m.order === 1)
    const { container } = render(<Clue order={1} />)
    expect(container.textContent).toContain(DIRECTION_GLYPH[entry.direction])
  })

  it('throws when order is omitted (fail-fast)', () => {
    expect(() => render(<Clue />)).toThrow()
  })

  it('emits identical data-clue-* across different variants for the same order', () => {
    const a = render(<Clue order={2} variant="plain" />)
    const plainEl = a.container.querySelector('[data-clue-order]')
    const b = render(<Clue order={2} variant="tint" />)
    const tintEl = b.container.querySelector('[data-clue-order]')
    expect(tintEl.getAttribute('data-clue-order')).toBe(plainEl.getAttribute('data-clue-order'))
    expect(tintEl.getAttribute('data-clue-direction')).toBe(
      plainEl.getAttribute('data-clue-direction')
    )
  })

  it('passes derived order/direction to a render-prop children function', () => {
    const received = []
    render(
      <Clue order={5}>
        {(derived) => {
          received.push(derived)
          return <span data-testid="rendered-child" />
        }}
      </Clue>
    )
    expect(received[0]).toMatchObject({ order: 5, direction: 'Down' })
  })

  it('does not announce the direction to assistive tech', () => {
    render(<Clue order={4} />)
    expect(screen.queryByLabelText('Up')).toBeNull()
    expect(screen.queryByText('Up', { selector: '[aria-label]' })).toBeNull()
  })
})

describe('FaceSurface', () => {
  it('renders children inside the bordered content slot', () => {
    const { getByText, container } = render(
      <FaceSurface>
        <p>stone panel content</p>
      </FaceSurface>
    )
    expect(getByText('stone panel content')).toBeInTheDocument()
    expect(container.querySelector('.face-surface')).not.toBeNull()
  })

  it('marks the decorative moss layer aria-hidden so it never enters the accessible tree', () => {
    const { container } = render(
      <FaceSurface>
        <p>stone panel content</p>
      </FaceSurface>
    )
    const moss = container.querySelector('.face-surface__moss')
    expect(moss).not.toBeNull()
    expect(moss.getAttribute('aria-hidden')).toBe('true')
  })
})
