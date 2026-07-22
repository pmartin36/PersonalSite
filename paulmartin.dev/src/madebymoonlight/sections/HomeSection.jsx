import styles from './HomeSection.module.css'

export default function HomeSection({ id }) {
  return (
    <div id={id} className={styles.section}>
      <div className={styles.logo} />
    </div>
  )
}
