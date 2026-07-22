import styles from './ContactSection.module.css'

// Mailchimp popup, carried over from the original index.html. Loads the embed
// script on demand, then starts the signup form loader.
function openMailingList() {
  const existing = document.getElementById('PopupSignupForm_0')
  if (existing) existing.outerHTML = ''

  const start = () =>
    window.require(['mojo/signup-forms/Loader'], (L) =>
      L.start({
        baseUrl: 'mc.us12.list-manage.com',
        uuid: '73d95c4c17729f67f5b6a7cd2',
        lid: 'eadf7ae01d',
      }),
    )

  document.cookie =
    'MCPopupClosed=;path=/;expires=Thu, 01 Jan 1970 00:00:00 UTC;'

  if (window.require) {
    start()
  } else {
    const s = document.createElement('script')
    s.src = 'https://downloads.mailchimp.com/js/signup-forms/popup/embed.js'
    s.setAttribute('data-dojo-config', 'usePlainJson: true, isDebug: false')
    s.onload = start
    document.body.appendChild(s)
  }
}

export default function ContactSection({ id }) {
  return (
    <div id={id} className={styles.section}>
      <div className={styles.container}>
        <div className={styles.method}>
          <a href="https://twitter.com/MoonlightMade">
            <div className={`${styles.icon} ${styles.twitter}`} />
            <div className={styles.contact}>@MoonlightMade</div>
          </a>
        </div>
        <div className={styles.method}>
          <div className={`${styles.icon} ${styles.email}`} />
          <div className={styles.contact}>MadeByMoonlightGames@gmail.com</div>
        </div>
        <div className={styles.method}>
          <div
            style={{ cursor: 'pointer' }}
            onClick={openMailingList}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') openMailingList()
            }}
          >
            <div className={`${styles.icon} ${styles.plus}`} />
            <div className={styles.contact}>Sign up for the mailing list</div>
          </div>
        </div>
      </div>
    </div>
  )
}
