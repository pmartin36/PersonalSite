import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import '@fontsource-variable/hanken-grotesk'
import '@fontsource-variable/jetbrains-mono'
import Landing from './pages/Landing.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'
import Moonlight from './madebymoonlight/Moonlight.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/madebymoonlight/*" element={<Moonlight />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
