import { Link } from 'react-router-dom'
import { MBM_BASE } from '../lib/base'
import styles from './Header.module.css'

export default function Header() {
  return (
    <div className={styles.header}>
      <div className={styles.spacer} />
      <div className={styles.spacer}>
        <Link
          to={MBM_BASE}
          className={styles.logo}
          aria-label="Made by Moonlight home"
        />
      </div>
      <div className={styles.spacer} />
    </div>
  )
}
