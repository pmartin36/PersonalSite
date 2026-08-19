import './machine.css'
import { moveByOrder } from './model.js'

export const DIRECTION_GLYPH = {
  Up: '↑',
  Down: '↓',
  Left: '←',
  Right: '→',
}

const DIRECTION_LETTER = {
  Up: 'u',
  Down: 'd',
  Left: 'l',
  Right: 'r',
}

export function directionLetter(direction) {
  const letter = DIRECTION_LETTER[direction]
  if (!letter) {
    throw new Error(`directionLetter: unknown direction ${direction}`)
  }
  return letter
}

export default function Clue({ order, variant = 'plain', children, className, ...rest }) {
  const entry = moveByOrder(order)
  const directionGlyph = DIRECTION_GLYPH[entry.direction]
  const letter = directionLetter(entry.direction)
  const orderGlyph = String(entry.order)
  const classes = ['clue', `clue--${variant}`, className].filter(Boolean).join(' ')

  const content =
    typeof children === 'function'
      ? children({
          order: entry.order,
          direction: entry.direction,
          directionGlyph,
          directionLetter: letter,
          orderGlyph,
        })
      : `${orderGlyph}${directionGlyph}`

  return (
    <span
      className={classes}
      data-clue-order={entry.order}
      data-clue-direction={entry.direction}
      aria-hidden="true"
      {...rest}
    >
      {content}
    </span>
  )
}
