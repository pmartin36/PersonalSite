import { useParams, Navigate } from 'react-router-dom'
import { getByUrlName, storeLinks } from '../data/games'
import { MBM_BASE } from '../lib/base'
import Background from '../components/Background'
import Header from '../components/Header'
import styles from './GameDetails.module.css'

export default function GameDetails() {
  const { name } = useParams()
  const game = getByUrlName(name)

  // Original guard: unknown game -> 404.
  if (!game) return <Navigate to={`${MBM_BASE}/404`} replace />

  const shadowed = game.textShadow ? styles.shadowed : ''

  return (
    <>
      <Background imageUrl={game.backdropImageUrl} />
      <Header />
      <div className={styles.details}>
        <div className={styles.titleContainer}>
          <div
            className={`${styles.title} ${shadowed}`}
            style={game.titleStyle}
            data-text={game.name}
          >
            {game.name}
          </div>
        </div>
        <div className={styles.youtubeContainer}>
          <iframe
            className={styles.youtube}
            src={game.trailerUrl}
            title={`${game.name} trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className={styles.availableContainer}>
          <div
            className={`${styles.available} ${shadowed}`}
            style={game.titleStyle}
            data-text={game.availability}
          >
            {game.availability}
          </div>
        </div>
        <div className={styles.platforms}>
          {storeLinks(game).map((type, i) => (
            <a key={i} href={type.url}>
              <img src={type.imageUrl} className={styles.storeButton} alt="" />
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
