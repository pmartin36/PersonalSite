import { describe, it, expect } from 'vitest'
import { MOVES, SEQUENCE, RESUME_URL, moveByOrder } from './model.js'

describe('MOVES', () => {
  it('has 6 entries with the exact order/direction/faceId mapping', () => {
    expect(MOVES).toEqual([
      { order: 1, direction: 'Up', faceId: 'V' },
      { order: 2, direction: 'Right', faceId: 'III' },
      { order: 3, direction: 'Left', faceId: 'II' },
      { order: 4, direction: 'Up', faceId: 'I' },
      { order: 5, direction: 'Down', faceId: 'IV' },
      { order: 6, direction: 'Left', faceId: 'III' },
    ])
  })

  it('has unique orders spanning 1..6', () => {
    const orders = MOVES.map((m) => m.order).sort((a, b) => a - b)
    expect(orders).toEqual([1, 2, 3, 4, 5, 6])
  })
})

describe('SEQUENCE', () => {
  it('equals the directions in order', () => {
    expect(SEQUENCE).toEqual(['Up', 'Right', 'Left', 'Up', 'Down', 'Left'])
  })

  it('is derived from MOVES sorted by order, not a standalone literal', () => {
    const derived = [...MOVES].sort((a, b) => a.order - b.order).map((m) => m.direction)
    expect(SEQUENCE).toEqual(derived)
  })
})

describe('RESUME_URL', () => {
  it('is the shared drive resume link', () => {
    expect(RESUME_URL).toBe(
      'https://drive.google.com/file/d/1utBX7U7q98kJ-Uqrk-3AnSkR2xn6BEXH/view?usp=sharing'
    )
  })
})

describe('moveByOrder', () => {
  it('returns the entry for a known order', () => {
    expect(moveByOrder(3)).toEqual({ order: 3, direction: 'Left', faceId: 'II' })
  })

  it('throws on an unknown order', () => {
    expect(() => moveByOrder(9)).toThrow()
  })
})
