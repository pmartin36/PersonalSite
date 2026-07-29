import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import '@fontsource-variable/hanken-grotesk'
import '@fontsource-variable/jetbrains-mono'
import Landing from './pages/Landing.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'
import Solved from './pages/Solved.jsx'
import Moonlight from './madebymoonlight/Moonlight.jsx'
import './index.css'

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
        <Route path="/" element={<Landing />} />
        <Route path="/solved" element={<Solved />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/madebymoonlight/*" element={<Moonlight />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
