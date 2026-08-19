import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, within, fireEvent } from '@testing-library/react'
import Machine from './Machine.jsx'
import { SEQUENCE } from './model.js'

afterEach(cleanup)

// Reads every rendered data-clue-* hook across the whole assembled machine
// and orders them by data-clue-order, never a hardcoded literal.
function collectSequence(container) {
  const hooks = Array.from(container.querySelectorAll('[data-clue-order]'))
  return hooks
    .slice()
    .sort((a, b) => Number(a.getAttribute('data-clue-order')) - Number(b.getAttribute('data-clue-order')))
    .map((el) => el.getAttribute('data-clue-direction'))
}

describe('whole-puzzle clue integrity', () => {
  it('renders exactly one data-clue hook per SEQUENCE position, no duplicate or missing order', () => {
    const { container } = render(<Machine />)
    const orders = Array.from(container.querySelectorAll('[data-clue-order]'))
      .map((el) => Number(el.getAttribute('data-clue-order')))
      .sort((a, b) => a - b)
    expect(orders).toEqual(SEQUENCE.map((_, i) => i + 1))
  })

  it('the six rendered hooks, ordered by data-clue-order, reconstruct SEQUENCE', () => {
    const { container } = render(<Machine />)
    expect(collectSequence(container)).toEqual(SEQUENCE)
  })

  it('entering the collected sequence into Face V solves the lock', () => {
    const { container } = render(<Machine />)
    const collected = collectSequence(container)
    const faceV = screen.getByRole('region', { name: 'Face V' })
    for (const direction of collected) {
      fireEvent.click(within(faceV).getByRole('button', { name: direction }))
    }
    expect(faceV.querySelector('[data-solved]')?.getAttribute('data-solved')).toBe('true')
    expect(within(faceV).getByText(/found the way through/i)).toBeInTheDocument()
  })
})

describe('whole-puzzle DOM order and semantics', () => {
  it('exposes the five faces as regions in DOM order Face I..Face V', () => {
    render(<Machine />)
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
    render(<Machine />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Paul Martin')
  })
})
