import styles from './Background.module.css'

// With an imageUrl -> fixed cover backdrop; otherwise the animated starfield.
export default function Background({ imageUrl }) {
  if (imageUrl) {
    return (
      <div
        className={styles.backdrop}
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
    )
  }
  return (
    <>
      <div className={styles.stars} />
      <div className={styles.twinkling} />
    </>
  )
}
