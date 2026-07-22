// easeInOutExpo — ported from the original ng2-page-scroll easing so the nav
// keeps its slow, weighted 1s glide between sections.
export function easeInOutExpo(t, b, c, d) {
  if (t === 0) return b
  if (t === d) return b + c
  if ((t /= d / 2) < 1) return (c / 2) * Math.pow(2, 10 * (t - 1)) + b
  return (c / 2) * (-Math.pow(2, -10 * --t) + 2) + b
}

export function smoothScrollToId(id, duration = 1000) {
  const el = document.getElementById(id)
  if (!el) return
  const start = window.scrollY
  const end = el.getBoundingClientRect().top + window.scrollY
  const change = end - start
  const startTime = performance.now()

  function step(now) {
    const elapsed = now - startTime
    if (elapsed >= duration) {
      window.scrollTo(0, end)
      return
    }
    window.scrollTo(0, easeInOutExpo(elapsed, start, change, duration))
    requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}
