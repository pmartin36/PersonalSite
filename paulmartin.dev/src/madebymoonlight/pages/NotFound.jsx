import Background from '../components/Background'
import Header from '../components/Header'
import styles from './NotFound.module.css'

export default function NotFound() {
  return (
    <>
      <Background />
      <Header />
      <p className={styles.code}>404</p>
    </>
  )
}
