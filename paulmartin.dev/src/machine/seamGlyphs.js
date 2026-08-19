// Half-glyph edge layout for Face III's three reels (3 reels x 3 faces each).
// Each face carries a left-edge and right-edge half-mark id. A seam between
// two adjacent reels "resolves" into a complete glyph only when the right
// mark of the left reel's payline face and the left mark of the right reel's
// payline face are the two halves of the same glyph; almost every pairing is
// a decoy that never completes.

import { moveByOrder } from './model.js'
import { directionLetter } from './Clue.jsx'

const move2 = moveByOrder(2)
const NUMBER_GLYPH = String(move2.order)
const DIRECTION_GLYPH = directionLetter(move2.direction)

// The winning triple: reel 1 face 0 completes the number seam with reel 2
// face 2, and reel 2 face 2 completes the direction seam with reel 3 face 1.
const WINNING_POSITIONS = [0, 2, 1]

// Every mark not part of the winning seams is a globally-unique decoy (its id
// embeds reel/face/side) so no accidental second alignment ever forms.
function decoy(reel, face, side) {
  return `decoy:${reel}:${face}:${side}`
}

export const REEL_EDGES = [[], [], []]

for (let reel = 0; reel < 3; reel++) {
  for (let face = 0; face < 3; face++) {
    REEL_EDGES[reel][face] = {
      left: decoy(reel, face, 'left'),
      right: decoy(reel, face, 'right'),
    }
  }
}

// Overwrite the winning triple's marks with the two real half-glyphs.
const [w1, w2, w3] = WINNING_POSITIONS
REEL_EDGES[0][w1].right = `${NUMBER_GLYPH}:L`
REEL_EDGES[1][w2].left = `${NUMBER_GLYPH}:R`
REEL_EDGES[1][w2].right = `${DIRECTION_GLYPH}:L`
REEL_EDGES[2][w3].left = `${DIRECTION_GLYPH}:R`

function complete(rightMark, leftMark) {
  if (!rightMark || !leftMark) return null
  const glyph = rightMark.slice(0, -2)
  if (rightMark !== `${glyph}:L`) return null
  if (leftMark !== `${glyph}:R`) return null
  return glyph
}

export function resolveSeams(positions) {
  const [p1, p2, p3] = positions
  const number = complete(REEL_EDGES[0][p1]?.right, REEL_EDGES[1][p2]?.left)
  const direction = complete(REEL_EDGES[1][p2]?.right, REEL_EDGES[2][p3]?.left)
  return { number, direction, aligned: Boolean(number && direction) }
}

export function findAlignments() {
  const alignments = []
  for (let p1 = 0; p1 < 3; p1++) {
    for (let p2 = 0; p2 < 3; p2++) {
      for (let p3 = 0; p3 < 3; p3++) {
        const { number, direction, aligned } = resolveSeams([p1, p2, p3])
        if (aligned) alignments.push({ positions: [p1, p2, p3], number, direction })
      }
    }
  }
  return alignments
}

export const WINNING = findAlignments()[0] ?? { positions: [0, 0, 0], number: null, direction: null }
