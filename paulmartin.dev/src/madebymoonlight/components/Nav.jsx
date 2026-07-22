import { useEffect, useState } from 'react'
import { smoothScrollToId } from '../lib/smoothScroll'
import styles from './Nav.module.css'

const SECTIONS = ['home', 'games', 'about', 'contact']

export default function Nav() {
  const [focused, setFocused] = useState('home')
  const [scrolling, setScrolling] = useState(false)
  const [top, setTop] = useState('0%')

  useEffect(() => {
    let timer
    function onScroll() {
      const body = document.body
      const html = document.documentElement
      const height = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight,
      )
      setTop((131 * window.scrollY) / height + '%')

      const index = Math.min(
        Math.round(window.scrollY / html.clientHeight),
        SECTIONS.length - 1,
      )
      setFocused(SECTIONS[index])

      setScrolling(true)
      clearTimeout(timer)
      timer = setTimeout(() => setScrolling(false), 250)
    }

    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      clearTimeout(timer)
    }
  }, [])

  const link = (id, label) => (
    <span className={styles.navLink}>
      <a
        href={`#${id}`}
        className={focused === id ? styles.focused : undefined}
        onClick={(e) => {
          e.preventDefault()
          smoothScrollToId(id)
        }}
      >
        {label}
      </a>
    </span>
  )

  return (
    <>
      <nav className={styles.host}>
        <div className={styles.center}>
          <div className={`${styles.container} ${styles.outline}`}>
            {link('home', 'Home')}
            <span className={styles.separator}> | </span>
            {link('games', 'Games')}
            <span className={styles.separator}> | </span>
            {link('about', 'About')}
            <span className={styles.separator}> | </span>
            {link('contact', 'Contact')}
          </div>
        </div>
      </nav>
      <div
        className={`${styles.scroller} ${scrolling ? styles.fadeIn : styles.fadeOut}`}
        style={{ top }}
      />
    </>
  )
}
