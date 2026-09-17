import Background from '../components/Background'
import Nav from '../components/Nav'
import HomeSection from '../sections/HomeSection'
import GamesSection from '../sections/GamesSection'
import AboutSection from '../sections/AboutSection'
import ContactSection from '../sections/ContactSection'
import { useDocumentTitle } from '../../useDocumentTitle'

export default function Home() {
  useDocumentTitle(
    'Made By Moonlight · Paul Martin',
    'Made By Moonlight, the mobile game label of Paul Martin: The 16 Spaces, Solar Express and more.',
  )
  return (
    <>
      <Background />
      <HomeSection id="home" />
      <GamesSection id="games" />
      <AboutSection id="about" />
      <ContactSection id="contact" />
      <Nav />
    </>
  )
}
