// Real content. Media lives in /public/projects.
//
// `thumb` is the card image (always a still). `hero` is what the detail page
// shows at the top and comes in four kinds:
//   video    muted looping <video>, webm first then mp4, `poster` while it loads
//   youtube  an embedded trailer
//   gallery  several stills in the carousel
//   image    the still again, when there is nothing moving to show
// `org` renders as an affiliation chip next to the project name.

const still = (name, alt) => ({
  webp: `/projects/${name}.webp`,
  jpg: `/projects/${name}.jpg`,
  alt,
})

// Who a project was built for. `slug` selects the chip's brand color in CSS.
const META = {
  name: 'Meta',
  slug: 'meta',
  href: 'https://www.meta.com/emerging-tech/orion/',
}

const MOONLIGHT = {
  name: 'Made By Moonlight',
  slug: 'moonlight',
  href: '/madebymoonlight',
  internal: true,
}

const clip = (name, alt) => ({
  kind: 'video',
  webm: `/projects/${name}.webm`,
  mp4: `/projects/${name}.mp4`,
  poster: `/projects/${name}.jpg`,
  alt,
})

export const currentProjects = [
  {
    slug: 'agent-battles',
    name: 'Agent Battles',
    year: '2026',
    headline: 'A terminal battle game where a local LLM commands the army you wrote.',
    tags: ['Rust', 'ratatui', 'Local LLM', 'Terminal'],
    blurb:
      'A local LLM commands both armies; your only input is the skill files you write for your six pieces. Once a day it takes them to war and plays the battle out in colored braille while you watch.',
    thumb: still(
      'agent-battles',
      'A level 5 Ember Wolf rendered in orange braille dots, beside its stat bars and the skill file that governs how it fights',
    ),
    hero: clip(
      'agent-battles',
      'Agent Battles running in a terminal: braille-rendered creatures, roster navigation, and the skill editor',
    ),
    body: [
      'Agent Battles is a terminal game about writing instincts rather than pressing buttons. Your army is six pieces, and you author a skill file for each one: its role, its opening, how it picks targets, when it should retreat instead of trade. Once a day your army is matched against someone else’s, a local LLM takes command of both sides, and the fight plays out without you.',
      'You don’t get to intervene. You watch it happen, then go back and rewrite whatever got your pieces killed. Winners level up and grow more distinct with each victory, so an army that survives long enough stops resembling anyone else’s. The one-battle-a-day pacing is deliberate, and it moves the real game into the editing.',
      'It’s built in Rust on ratatui and crossterm, and renders entirely in colored Unicode braille (see Braille Engine for how that works). Simulation runs on your machine against a local model. The server is a small thing on a Raspberry Pi handling matchmaking, replays and a leaderboard, nothing more. Opponent skill files are untrusted input, so the model is sandboxed and can’t reach outside the game directory.',
    ],
    links: [
      {
        label: 'GitHub',
        href: 'https://github.com/pmartin36/AgentBattleground',
        kind: 'github',
      },
    ],
  },
  {
    slug: 'code-scenes',
    name: 'Code Scenes',
    year: '2026',
    headline: 'Unity scene editing, designed for the AI era',
    tags: ['C#', 'Unity', '.NET', 'Dev Tooling'],
    blurb:
      'Write a scene as readable C# and watch the scene in the Unity editor update automatically. Move something in the editor and the file rewrites itself to match.',
    thumb: still(
      'code-scenes',
      'Unity and VS Code side by side: a scene of cars and props on the left, the C# file that built it on the right',
    ),
    hero: clip(
      'code-scenes',
      'A Code Scenes round trip: building a Unity scene from a C# file, then moving an object in the editor and watching the file update',
    ),
    body: [
      'A Unity scene is normally a wall of generated YAML, unreadable in a diff and miserable in a merge. Code Scenes makes the scene a plain C# file instead. You describe what’s in it, press Build, and the scene materializes in Unity wired up and ready.',
      'The interesting half is the other direction. Move an object in the Scene view and save, and your file rewrites itself to match. It edits the line that produced that object rather than regenerating the whole thing, because every object carries a stable identity, so a rebuild never wipes and recreates what you already have. You can lay things out visually when that’s faster and let the code follow along.',
      'The two-way sync is also what lets an AI assistant build Unity scenes well. Instead of fumbling through the editor one click at a time, it works in the medium it’s actually good at: a whole scene as one readable file it can generate and check. The engine is plain .NET with no Unity dependency, so it runs and tests fully headless. The design is settled and the engine is being built test-first, but it isn’t usable yet.',
    ],
    links: [
      {
        label: 'GitHub',
        href: 'https://github.com/pmartin36/CodeScenes',
        kind: 'github',
      },
      { label: 'codescenes.dev', href: 'https://codescenes.dev' },
    ],
  },
  {
    slug: 'braille-engine',
    name: 'Braille Engine',
    year: '2026',
    headline: 'A Rust terminal engine that draws everything but text in dots.',
    tags: ['Rust', 'ratatui', 'Renderer', 'Terminal'],
    blurb:
      'A game engine for the terminal. Sprites, effects and UI chrome all render through one braille dot pipeline at 2×4 dots per cell in truecolor, with no graphics protocol required.',
    thumb: still(
      'braille-engine',
      'A terminal split in two: the original Pikachu animation on the left, the same frame redrawn in yellow braille dots on the right',
    ),
    hero: clip(
      'braille-engine',
      'Side-by-side playback: a source animation on the left and its live braille conversion on the right',
    ),
    body: [
      'This is the engine underneath Agent Battles, and it holds one rule hard: every visual element that isn’t text goes through the braille pipeline. Sprites, effects, borders, panels, buttons. Reaching for a box-drawing character to save time isn’t allowed, however minor the element. What that buys is one coherent look instead of the usual terminal-UI patchwork.',
      'A braille glyph is a 2×4 grid of dots, so each cell carries eight times the spatial resolution of an ordinary character. Images decompose into that grid. A dot lights when its source pixel beats the cell’s adaptive luma threshold and its alpha clears the cutout, and the cell takes the average color of whatever remains, in 24-bit truecolor. Flat regions saturate into solid fill, and dot texture shows up exactly where the edges and gradients are.',
      'On top of the renderer sits the rest of an engine. There is a scene graph, a camera with world-space projection, sprite animation on wall-clock time, back-to-front depth compositing at dot granularity, dot-precise layout, and a live debug inspector for editing fields while it runs. All of it lives in its own crates behind a hard boundary, so nothing in the engine knows Agent Battles exists.',
    ],
    links: [
      {
        label: 'GitHub',
        href: 'https://github.com/pmartin36/AgentBattleground/tree/main/crates/engine',
        kind: 'github',
      },
    ],
  },
]

export const previousProjects = [
  {
    slug: 'stargazer',
    name: 'Stargazer',
    org: META,
    role: 'Pathfinding Lead',
    year: '2024',
    headline: 'A 3D homage to Galaga, flown around your living room.',
    tags: ['AR', 'Orion', 'Eye Tracking', 'EMG Wristband', 'Spatial Audio'],
    blurb:
      'Built for Meta’s Orion AR glasses. A retro starfighter hangs in your actual room. You lean and turn to dodge, and fire with a finger tap the wristband feels before the cameras see it.',
    thumb: still(
      'stargazer',
      'Seen through Orion: a pixel-art starfighter and a targeting reticle floating against a real living-room wall, with a health bar and score overlaid',
    ),
    hero: {
      kind: 'youtube',
      id: 'G0eKzU_fV00',
      start: 615, // 10:15
      title: 'Marques Brownlee plays Stargazer on Orion',
    },
    body: [
      'Stargazer was one of the games built to show what Meta’s Orion AR glasses could do. I was pathfinding lead: I took it from nothing to a fleshed-out concept, working out what the game wanted to be on hardware nobody had designed for yet and proving it was worth building. It takes after Galaga, except the play space is the room you’re standing in, so the starfield opens on your wall and enemies come at you through it.',
      'It leans on every input Orion has at once. Eye tracking places your aim, the EMG wristband registers the finger tap that fires, hand and head tracking move you through the field, and spatial audio tells you where something is coming from before you’ve looked at it. Because it renders into your real space rather than a window you peer into, you can walk into the game and be surrounded by it.',
      'Orion was a prototype and never a product. A handful of pairs existed, and press got to try them at Connect in 2024. The video above is Marques Brownlee playing it.',
    ],
    links: [
      {
        label: 'MKBHD hands-on',
        href: 'https://www.youtube.com/watch?v=G0eKzU_fV00&t=615s',
      },
    ],
  },
  {
    slug: 'pong',
    name: 'Pong',
    org: META,
    role: 'Pathfinding Lead',
    year: '2024',
    headline: 'Pong in three dimensions, shared between two pairs of glasses.',
    tags: ['AR', 'Orion', 'Hand Tracking', 'Multiplayer', 'Shared Anchors'],
    blurb:
      'The classic game rebuilt as a cube you stand inside, seen from your paddle rather than from above. Both players look at a shared QR code to agree on an origin, and the court lands in the same place for each of them.',
    thumb: still(
      'pong',
      'Seen through Orion: nested green and yellow rounded-square outlines forming a 3D Pong court in a living room, with a QR code on the table below and the player’s hands raised',
    ),
    hero: {
      kind: 'youtube',
      id: 'mpKKcqWnTus',
      start: 48,
      title: 'The Verge plays 3D Pong on Orion',
    },
    body: [
      'A 3D take on Pong for Meta’s Orion AR glasses. I was pathfinding lead here too, taking it from nothing to a fleshed-out concept and working out how the game should behave once two people share one physical court. The court is a cube in the middle of the room and you see it from your paddle’s position rather than from overhead, which changes the game. Depth is something you have to read, and the ball arrives rather than crosses.',
      'Your paddle is your hand, with no controller involved. The harder problem was agreement between two players: two pairs of glasses have to believe the court is in the same physical place, or the game quietly falls apart. Both players look at a shared QR code, which fixes a common origin, and from there the cube sits in one spot in the actual room for both of them. You can also play remotely against a friend.',
      'It became the demo people remembered, and the one Alex Heath played against Mark Zuckerberg. The Verge’s hands-on is above.',
    ],
    links: [
      {
        label: 'The Verge hands-on',
        href: 'https://www.youtube.com/watch?v=mpKKcqWnTus&t=48s',
      },
    ],
  },
  {
    slug: 'the-16-spaces',
    name: 'The 16 Spaces',
    org: MOONLIGHT,
    year: '2020',
    headline: 'A sliding-tile puzzle wrapped around an auto-running platformer.',
    tags: ['Unity', 'C#', 'iOS', 'Android'],
    blurb:
      'Your character never stops running and you never control them directly. You control the level, sliding the tiles of the world around them to build the path they’re already on.',
    thumb: still(
      'the-16-spaces',
      'A 4×4 grid of earth and stone tiles on a green field, with a small armored character running along a ledge toward a flag',
    ),
    hero: { kind: 'youtube', id: '-3-FerGlLPI', title: 'The 16 Spaces trailer' },
    body: [
      'A mashup of two things that don’t obviously go together: the 15-puzzle and an auto-running platformer. The runner moves on their own, always, and you have no direct control over them. What you can move is the world. Each level is a 4×4 grid of tiles you slide around a single empty space, exactly like the puzzle it’s named after.',
      'So every level is a question of timing as much as arrangement. You’re rebuilding the path underneath someone who is already running along it, and the tile you need to move is often the one they’re standing on. Get it wrong and you have to watch it play out.',
      'Released for Android and iOS in September 2020 under Made By Moonlight. It has since been delisted from both stores.',
    ],
    links: [
      {
        label: 'GitHub',
        href: 'https://github.com/pmartin36/The-16-Spaces',
        kind: 'github',
      },
      {
        label: 'Made By Moonlight',
        href: '/madebymoonlight/the-16-spaces',
        internal: true,
      },
    ],
  },
  {
    slug: 'solar-express',
    name: 'Solar Express',
    org: MOONLIGHT,
    year: '2017',
    headline: 'Turn your shield to meet each color as it arrives.',
    tags: ['Unity', 'C#', 'Android'],
    blurb:
      'Debris falls in from every direction and your shield is quartered into four colors. Rotate so the right quarter meets the right incoming piece, and keep doing it as the sky fills up.',
    thumb: still(
      'solar-express',
      'A four-colour quartered shield orbiting a small white core in space, with red, green, blue and yellow comets streaking in from all sides',
    ),
    hero: { kind: 'youtube', id: 'ALHqt7_kMzs', title: 'Solar Express trailer' },
    body: [
      'An action game about one input done under increasing pressure. Your ship sits at the center with a shield split into four colored quarters, and colored debris streaks in from every angle. Turn so the matching quarter takes the hit. Miss and the core behind you takes it instead.',
      'It stays simple and gets fast. Because threats arrive from all sides at once, the difficulty lands on ordering rather than reaction time. You’re deciding which rotation serves the next three pieces, not just the closest one. It was released free on Android under Made By Moonlight and has since been delisted.',
    ],
    links: [
      {
        label: 'GitHub',
        href: 'https://github.com/pmartin36/Solar-Express',
        kind: 'github',
      },
      {
        label: 'Made By Moonlight',
        href: '/madebymoonlight/solar-express',
        internal: true,
      },
    ],
  },
]

const bySlug = {}
for (const p of [...currentProjects, ...previousProjects]) bySlug[p.slug] = p
export const getProject = (slug) => bySlug[slug]
