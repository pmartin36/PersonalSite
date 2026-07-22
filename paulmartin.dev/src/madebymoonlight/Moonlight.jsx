import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import GameDetails from './pages/GameDetails'
import PrivacyPolicy from './pages/PrivacyPolicy'
import NotFound from './pages/NotFound'
import './moonlight.css'

// Mounted at /madebymoonlight/* by the main app. Routes below are relative to
// that base (ported from the Angular RouterModule config).
export default function Moonlight() {
  useEffect(() => {
    document.documentElement.classList.add('mbm-lock')
    return () => document.documentElement.classList.remove('mbm-lock')
  }, [])

  return (
    <div className="mbm">
      <Routes>
        <Route index element={<Home />} />
        <Route path="404" element={<NotFound />} />
        <Route path="privacy/:name" element={<PrivacyPolicy />} />
        <Route path=":name" element={<GameDetails />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}
