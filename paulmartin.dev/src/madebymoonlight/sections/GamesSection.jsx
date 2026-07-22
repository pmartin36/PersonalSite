import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { applyFilter } from '../data/games'
import { MBM_BASE } from '../lib/base'
import styles from './GamesSection.module.css'

export default function GamesSection({ id }) {
  const navigate = useNavigate()
  const [filterType, setFilterType] = useState('all')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const mobile =
    typeof window !== 'undefined' && window.screen.width <= 480

  const filteredGames = useMemo(() => applyFilter(filterType), [filterType])
  const selectedGame = filteredGames[selectedIndex]

  function routeToSelectedGame() {
    if (selectedGame) {
      navigate(`${MBM_BASE}/${selectedGame.urlname || selectedGame.name}`)
    }
  }

  function thumbnailClicked(index) {
    if (selectedIndex === index) {
      routeToSelectedGame()
    } else {
      setSelectedIndex(index)
    }
  }

  function setFilter(type) {
    const current = selectedGame
    const next = applyFilter(type)
    const newIndex = next.indexOf(current)
    setFilterType(type)
    setSelectedIndex(newIndex === -1 ? 0 : newIndex)
  }

  return (
    <div id={id} className={styles.section}>
      <div className={styles.gameSection}>
        <div className={styles.blowupContainer}>
          {selectedGame ? (
            <div
              onClick={routeToSelectedGame}
              style={{ cursor: 'pointer' }}
            >
              {!mobile && (
                <div style={{ position: 'absolute' }}>
                  <svg height="75" width="300">
                    <path d="M0,0 L300,0 L250,75 L0,75z" fill="black" />
                  </svg>
                </div>
              )}
              <div className={styles.title}>{selectedGame.name}</div>
              <img
                className={styles.blowup}
                src={selectedGame.blowupImageUrl || selectedGame.thumbnailImageUrl}
                alt={selectedGame.name}
              />
            </div>
          ) : (
            <div className={styles.noGame}>
              No games for this platform...yet!
            </div>
          )}
        </div>

        <div className={styles.thumbnailScroll}>
          {filteredGames.map((game, i) => (
            <img
              key={game.urlname || game.name}
              className={`${styles.thumbnail} ${selectedIndex === i ? styles.thumbnailSelected : ''}`}
              onClick={() => thumbnailClicked(i)}
              src={game.thumbnailImageUrl}
              alt={game.name}
            />
          ))}
        </div>

        <div className={styles.filterContainer}>
          <span
            className={`${styles.navLink} ${filterType === 'all' ? styles.navLinkSelected : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </span>
          <span className={styles.separator}> | </span>
          <span
            className={`${styles.navLink} ${filterType === 'mobile' ? styles.navLinkSelected : ''}`}
            onClick={() => setFilter('mobile')}
          >
            Mobile
          </span>
          <span className={styles.separator}> | </span>
          <span
            className={`${styles.navLink} ${filterType === 'pc' ? styles.navLinkSelected : ''}`}
            onClick={() => setFilter('pc')}
          >
            PC
          </span>
        </div>
      </div>
    </div>
  )
}
