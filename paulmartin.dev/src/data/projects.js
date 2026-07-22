// Placeholder content — real copy + screenshots drop in later. `hue` seeds the
// mock carousel gradients; `shots` is how many placeholder images it shows.
export const currentProjects = [
  {
    slug: 'aurora',
    name: 'Aurora',
    headline: 'Real-time sync engine for collaborative tools',
    year: '2026',
    hue: 190,
    shots: 3,
    tags: ['TypeScript', 'CRDTs', 'WebSockets'],
    blurb:
      'A conflict-free data layer that keeps every client in lockstep without a central lock. Placeholder copy — swap for the real story.',
    body: [
      'This is placeholder detail copy for Aurora. Describe the problem it solves, the approach, and what makes it interesting to build.',
      'A second paragraph can go deeper on the architecture, the tricky parts, and where it is headed next.',
    ],
    links: [{ label: 'Live', href: '#' }, { label: 'GitHub', href: '#' }],
  },
  {
    slug: 'cadence',
    name: 'Cadence',
    headline: 'Habit tracking that adapts to your week',
    year: '2026',
    hue: 150,
    shots: 3,
    tags: ['React', 'Local-first'],
    blurb:
      'Gentle, streak-free habit tracking built around real life instead of guilt. Placeholder copy.',
    body: [
      'Placeholder detail copy for Cadence. What it is, who it is for, why it exists.',
    ],
    links: [{ label: 'Live', href: '#' }],
  },
  {
    slug: 'beacon',
    name: 'Beacon',
    headline: 'Focus mode for a noisy browser',
    year: '2025',
    hue: 265,
    shots: 2,
    tags: ['Extension', 'Web'],
    blurb:
      'A distraction blocker that gets out of the way the moment you actually need the web. Placeholder copy for layout.',
    body: ['Placeholder detail copy for Beacon.'],
    links: [{ label: 'GitHub', href: '#' }],
  },
  {
    slug: 'foundry',
    name: 'Foundry',
    headline: 'Build game scenes in code, edit them in the engine',
    year: '2025',
    hue: 25,
    shots: 3,
    tags: ['Unity', 'C#', 'Tooling'],
    blurb:
      'Two-way sync between a code-first scene definition and the visual editor. Placeholder copy.',
    body: ['Placeholder detail copy for Foundry.'],
    links: [{ label: 'Live', href: '#' }, { label: 'GitHub', href: '#' }],
  },
]

export const previousProjects = [
  {
    slug: 'meridian',
    name: 'Meridian',
    headline: 'Scheduling engine for distributed teams',
    year: '2023',
    hue: 210,
    shots: 2,
    tags: ['Node', 'Postgres'],
    blurb: 'Placeholder copy describing a past project in a sentence or two.',
    body: ['Placeholder detail copy for Meridian.'],
    links: [{ label: 'GitHub', href: '#' }],
  },
  {
    slug: 'tessellate',
    name: 'Tessellate',
    headline: 'Procedural pattern generator',
    year: '2022',
    hue: 320,
    shots: 3,
    tags: ['Canvas', 'WebGL'],
    blurb: 'Placeholder copy for a previous project card.',
    body: ['Placeholder detail copy for Tessellate.'],
    links: [{ label: 'Live', href: '#' }],
  },
  {
    slug: 'groundwork',
    name: 'Groundwork',
    headline: 'A tiny static-site toolkit',
    year: '2021',
    hue: 95,
    shots: 2,
    tags: ['CLI', 'Node'],
    blurb:
      'Placeholder copy for a previous project card, slightly longer to test wrapping and rhythm.',
    body: ['Placeholder detail copy for Groundwork.'],
    links: [{ label: 'GitHub', href: '#' }],
  },
  {
    slug: 'almanac',
    name: 'Almanac',
    headline: 'Personal data, quietly logged',
    year: '2020',
    hue: 45,
    shots: 2,
    tags: ['iOS', 'Swift'],
    blurb: 'Placeholder copy for a previous project card.',
    body: ['Placeholder detail copy for Almanac.'],
    links: [],
  },
]

const bySlug = {}
for (const p of [...currentProjects, ...previousProjects]) bySlug[p.slug] = p
export const getProject = (slug) => bySlug[slug]
