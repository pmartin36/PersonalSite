import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import '@fontsource-variable/figtree'
import '@fontsource-variable/jetbrains-mono'
import Machine from './machine/Machine.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'
import Solved from './pages/Solved.jsx'
import Moonlight from './madebymoonlight/Moonlight.jsx'
import './index.css'

// Dev-only tuning bench for the artifact. Lazy so it is its own chunk, and gated
// on DEV so the route (and its chunk) never ship in the production build.
const ArtifactLab = import.meta.env.DEV ? lazy(() => import('./pages/ArtifactLab.jsx')) : null

// A reload lands at the top, not wherever the reader had scrolled to. Left to itself the
// browser restores the old offset AFTER load, which drops you mid-page and, if that lands on
// About Me, trips the maze-control hint before the intro has even finished. Turning
// restoration off has to happen before the first paint, so it lives here rather than in a
// component effect, where the browser would have restored already.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
window.scrollTo(0, 0)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Machine />} />
        <Route path="/solved" element={<Solved />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/madebymoonlight/*" element={<Moonlight />} />
        {ArtifactLab && (
          <Route
            path="/artifact-lab"
            element={
              <Suspense fallback={null}>
                <ArtifactLab />
              </Suspense>
            }
          />
        )}
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
