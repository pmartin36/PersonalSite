export const MOVES = [
  { order: 1, direction: 'Up', faceId: 'V' },
  { order: 2, direction: 'Right', faceId: 'III' },
  { order: 3, direction: 'Left', faceId: 'II' },
  { order: 4, direction: 'Up', faceId: 'I' },
  { order: 5, direction: 'Down', faceId: 'IV' },
  { order: 6, direction: 'Left', faceId: 'III' },
]

export const SEQUENCE = [...MOVES].sort((a, b) => a.order - b.order).map((m) => m.direction)

export const RESUME_URL =
  'https://drive.google.com/file/d/1utBX7U7q98kJ-Uqrk-3AnSkR2xn6BEXH/view?usp=sharing'

export function moveByOrder(order) {
  const entry = MOVES.find((m) => m.order === order)
  if (!entry) {
    throw new Error(`moveByOrder: no MOVES entry for order ${order}`)
  }
  return entry
}
