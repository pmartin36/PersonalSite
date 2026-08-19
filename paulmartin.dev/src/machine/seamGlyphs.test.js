import { describe, it, expect } from 'vitest'
import { REEL_EDGES, resolveSeams, findAlignments, WINNING } from './seamGlyphs.js'
import { moveByOrder } from './model.js'
import { directionLetter } from './Clue.jsx'

describe('seamGlyphs — edge etching data', () => {
  it('every reel face carries a non-empty left and right edge mark', () => {
    REEL_EDGES.forEach((reel) => {
      reel.forEach((face) => {
        expect(face.left).toBeTruthy()
        expect(face.right).toBeTruthy()
      })
    })
  })
})

describe('seamGlyphs — exactly one alignment', () => {
  it('findAlignments returns exactly one winning combination', () => {
    expect(findAlignments().length).toBe(1)
  })

  it('the winning combination resolves to the MOVES order-2 reading', () => {
    const move2 = moveByOrder(2)
    expect(WINNING.number).toBe(String(move2.order))
    expect(WINNING.direction).toBe(directionLetter(move2.direction))
  })

  it('resolveSeams reports aligned at the winning positions', () => {
    expect(resolveSeams(WINNING.positions).aligned).toBe(true)
  })

  it('resolveSeams reports not-aligned at every other position triple', () => {
    for (let p1 = 0; p1 < 3; p1++) {
      for (let p2 = 0; p2 < 3; p2++) {
        for (let p3 = 0; p3 < 3; p3++) {
          const positions = [p1, p2, p3]
          if (positions.every((p, i) => p === WINNING.positions[i])) continue
          expect(resolveSeams(positions).aligned).toBe(false)
        }
      }
    }
  })
})
