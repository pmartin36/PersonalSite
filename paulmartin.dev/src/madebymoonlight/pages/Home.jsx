import Background from '../components/Background'
import Nav from '../components/Nav'
import HomeSection from '../sections/HomeSection'
import GamesSection from '../sections/GamesSection'
import AboutSection from '../sections/AboutSection'
import ContactSection from '../sections/ContactSection'

export default function Home() {
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
