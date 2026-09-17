import '@testing-library/jest-dom/vitest'

// jsdom has no matchMedia implementation. Default to reduced-motion so
// components gated on prefers-reduced-motion (e.g. ProjectMedia's video
// autoplay) take their static branch instead of reaching for
// IntersectionObserver, which jsdom also lacks. Tests that need to assert
// the non-reduced-motion branch override window.matchMedia themselves.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: true,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })
}

// jsdom has no ResizeObserver; components that measure their box (e.g. the
// artifact under the Face V lid) construct one on mount. Stub it so they render.
if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
