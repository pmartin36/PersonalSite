import { MBM_ASSETS as A } from '../lib/base'

// Ported from the Angular GameService. Store links keyed by platform; iteration
// order is preserved for the store buttons on the details page.
export const games = [
  {
    name: 'The 16 Spaces',
    urlname: 'the-16-spaces',
    pricingModel: 'Freemium',
    types: {
      android: {
        url: 'https://play.google.com/store/apps/details?id=com.MadeByMoonlight.The16Spaces',
        imageUrl: `${A}/google-play-badge.png`,
      },
      ios: {
        url: 'https://apps.apple.com/app/id1531790358',
        imageUrl: `${A}/app-store-badge.png`,
      },
    },
    thumbnailImageUrl: `${A}/the-16-spaces-icon.png`,
    backdropImageUrl: `${A}/the-16-spaces-background.png`,
    blowupImageUrl: `${A}/the-16-spaces-blowup.png`,
    trailerUrl: 'https://www.youtube.com/embed/-3-FerGlLPI?autoplay=0',
    availability: 'Available now on Android!',
    // gold gradient clipped to the text
    titleStyle: {
      backgroundImage:
        'linear-gradient(15deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C)',
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontFamily: 'didact gothic',
      color: 'transparent',
    },
    textShadow: true,
  },
  {
    name: 'Solar Express',
    urlname: 'solar-express',
    pricingModel: 'Free',
    types: {
      android: {
        url: 'https://play.google.com/store/apps/details?id=com.MadebyMoonlight.SolarExpress',
        imageUrl: `${A}/google-play-badge.png`,
      },
    },
    thumbnailImageUrl: `${A}/solar-express-icon.png`,
    backdropImageUrl: null,
    blowupImageUrl: `${A}/solar-express-blowup.png`,
    trailerUrl: 'https://www.youtube.com/embed/ALHqt7_kMzs?autoplay=0',
    availability: 'Available now!',
    titleStyle: {
      color: 'white',
      fontFamily: 'solar-express',
      fontSize: '0.6em',
    },
    textShadow: false,
  },
]

const has = (game, key) =>
  Object.prototype.hasOwnProperty.call(game.types, key)

export const gameIsPC = (game) => has(game, 'steam') || has(game, 'pc')
export const gameIsMobile = (game) =>
  has(game, 'android') || has(game, 'ios') || has(game, 'mobile')

export function applyFilter(type) {
  if (type === 'all') return games
  if (type === 'mobile') return games.filter(gameIsMobile)
  if (type === 'pc') return games.filter(gameIsPC)
  return games.filter((game) => has(game, type))
}

export const getByUrlName = (urlname) =>
  games.find((game) => (game.urlname || game.name) === urlname)

export const storeLinks = (game) => Object.values(game.types)
