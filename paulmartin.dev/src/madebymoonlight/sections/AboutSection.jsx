import styles from './AboutSection.module.css'

export default function AboutSection({ id }) {
  return (
    <div id={id} className={styles.section}>
      <div className={styles.center}>
        <div className={styles.picture} />
        <div className={styles.bio}>
          Paul is the sole member of Made by Moonlight Games. He works for a
          software company during the day but, in the evenings, he moonlights as
          a game developer. He lives in Maryland.
        </div>
      </div>
    </div>
  )
}
