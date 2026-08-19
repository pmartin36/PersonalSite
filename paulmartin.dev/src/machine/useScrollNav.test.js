import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  isScrollable,
  findScrollableAncestor,
  createScrollNavController,
} from './useScrollNav.js'

function stubOverflow(el, { scrollHeight, clientHeight } = {}) {
  if (scrollHeight !== undefined) {
    Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true })
  }
  if (clientHeight !== undefined) {
    Object.defineProperty(el, 'clientHeight', { value: clientHeight, configurable: true })
  }
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('isScrollable', () => {
  it('is true for overflow-y auto with real overflowing content', () => {
    const el = stubOverflow(document.createElement('div'), { scrollHeight: 400, clientHeight: 100 })
    el.style.overflowY = 'auto'
    document.body.appendChild(el)

    expect(isScrollable(el)).toBe(true)
  })

  it('is false for overflow-y auto with no real overflow', () => {
    const el = stubOverflow(document.createElement('div'), { scrollHeight: 100, clientHeight: 100 })
    el.style.overflowY = 'auto'
    document.body.appendChild(el)

    expect(isScrollable(el)).toBe(false)
  })

  it('is false for a marker class/data attribute with visible overflow (not marker-keyed)', () => {
    const el = document.createElement('div')
    el.className = 'scrollable'
    el.dataset.scroll = 'true'
    document.body.appendChild(el)

    expect(isScrollable(el)).toBe(false)
  })
})

describe('findScrollableAncestor', () => {
  it('returns the nearest scrollable ancestor from a deep child', () => {
    const outer = stubOverflow(document.createElement('div'), { scrollHeight: 500, clientHeight: 100 })
    outer.style.overflowY = 'auto'
    const inner = stubOverflow(document.createElement('div'), { scrollHeight: 400, clientHeight: 50 })
    inner.style.overflowY = 'auto'
    const leaf = document.createElement('span')
    inner.appendChild(leaf)
    outer.appendChild(inner)
    document.body.appendChild(outer)

    expect(findScrollableAncestor(leaf, null)).toBe(inner)
  })

  it('returns null when no ancestor is scrollable', () => {
    const parent = document.createElement('div')
    const leaf = document.createElement('span')
    parent.appendChild(leaf)
    document.body.appendChild(parent)

    expect(findScrollableAncestor(leaf, null)).toBeNull()
  })

  it('does not return a scrollable node at or above the boundary (boundary is exclusive)', () => {
    const boundary = stubOverflow(document.createElement('div'), { scrollHeight: 500, clientHeight: 100 })
    boundary.style.overflowY = 'auto'
    const leaf = document.createElement('span')
    boundary.appendChild(leaf)
    document.body.appendChild(boundary)

    expect(findScrollableAncestor(leaf, boundary)).toBeNull()
  })
})

describe('createScrollNavController', () => {
  function makeEvent(deltaY, target) {
    return { deltaY, target, preventDefault: vi.fn() }
  }

  function unattachedTarget() {
    // No parentElement chain -> arbitration always resolves to the drum path.
    return document.createElement('span')
  }

  it('collapses a burst of drum-path events within idleMs to one forward step', () => {
    const onStep = vi.fn()
    const controller = createScrollNavController({
      onStep,
      getBoundary: () => null,
      threshold: 40,
      idleMs: 160,
    })
    const events = [30, 20, 10].map((deltaY) => makeEvent(deltaY, unattachedTarget()))

    events.forEach((e) => controller.handleWheel(e))

    expect(onStep).toHaveBeenCalledTimes(1)
    expect(onStep).toHaveBeenCalledWith(1)
    events.forEach((e) => expect(e.preventDefault).toHaveBeenCalledTimes(1))
  })

  it('steps backward for a negative-deltaY burst', () => {
    const onStep = vi.fn()
    const controller = createScrollNavController({
      onStep,
      getBoundary: () => null,
      threshold: 40,
      idleMs: 160,
    })
    const events = [-30, -20, -10].map((deltaY) => makeEvent(deltaY, unattachedTarget()))

    events.forEach((e) => controller.handleWheel(e))

    expect(onStep).toHaveBeenCalledTimes(1)
    expect(onStep).toHaveBeenCalledWith(-1)
  })

  it('commits exactly one step for a single large-deltaY event', () => {
    const onStep = vi.fn()
    const controller = createScrollNavController({
      onStep,
      getBoundary: () => null,
      threshold: 40,
      idleMs: 160,
    })

    controller.handleWheel(makeEvent(1000, unattachedTarget()))

    expect(onStep).toHaveBeenCalledTimes(1)
  })

  it('releases the lock after idleMs so a second flick steps again', () => {
    vi.useFakeTimers()
    const onStep = vi.fn()
    const controller = createScrollNavController({
      onStep,
      getBoundary: () => null,
      threshold: 40,
      idleMs: 160,
    })

    controller.handleWheel(makeEvent(50, unattachedTarget()))
    expect(onStep).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(200)
    controller.handleWheel(makeEvent(50, unattachedTarget()))

    expect(onStep).toHaveBeenCalledTimes(2)
  })

  it('does not step and does not preventDefault when the target is under a scrollable-overflow ancestor', () => {
    const root = document.createElement('div')
    const scrollableDiv = stubOverflow(document.createElement('div'), { scrollHeight: 500, clientHeight: 100 })
    scrollableDiv.style.overflowY = 'auto'
    const target = document.createElement('span')
    scrollableDiv.appendChild(target)
    root.appendChild(scrollableDiv)
    document.body.appendChild(root)

    const onStep = vi.fn()
    const controller = createScrollNavController({
      onStep,
      getBoundary: () => root,
      threshold: 40,
      idleMs: 160,
    })
    const event = makeEvent(100, target)

    controller.handleWheel(event)

    expect(onStep).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('treats a marker class/data ancestor with no real overflow as the drum path', () => {
    const root = document.createElement('div')
    const markerDiv = document.createElement('div')
    markerDiv.className = 'scrollable'
    markerDiv.dataset.scroll = 'true'
    const target = document.createElement('span')
    markerDiv.appendChild(target)
    root.appendChild(markerDiv)
    document.body.appendChild(root)

    const onStep = vi.fn()
    const controller = createScrollNavController({
      onStep,
      getBoundary: () => root,
      threshold: 40,
      idleMs: 160,
    })

    controller.handleWheel(makeEvent(100, target))

    expect(onStep).toHaveBeenCalledWith(1)
  })
})
