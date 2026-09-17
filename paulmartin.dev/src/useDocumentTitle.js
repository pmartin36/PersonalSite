import { useEffect } from 'react'

// Client routes never reload the page, so the <title> and meta description baked
// into index.html would otherwise sit on every route. Each route calls this to
// set its own, and the machine home sets the base one, so back-navigation lands
// on the right title too. A search engine that renders the route (Google does)
// reads these; the static index.html covers the ones that don't.
export function useDocumentTitle(title, description) {
  useEffect(() => {
    if (title) document.title = title
    if (description) {
      const meta = document.querySelector('meta[name="description"]')
      if (meta) meta.setAttribute('content', description)
    }
  }, [title, description])
}
