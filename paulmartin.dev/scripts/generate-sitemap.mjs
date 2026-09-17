// Writes public/sitemap.xml from the same project data the site renders, so a
// new project in src/data/projects.js shows up in the sitemap without anyone
// remembering to edit a second list. Runs as the build's first step.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { currentProjects, previousProjects } from '../src/data/projects.js'

const ORIGIN = 'https://paulmartin.dev'
const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, '../public/sitemap.xml')

// Static routes plus one per project. The Made By Moonlight games are delisted
// and reached through its own landing page, so only that landing is listed. The
// maze easter-egg page (/solved) and dev-only routes are left out on purpose.
const paths = [
  '/',
  '/madebymoonlight',
  ...[...currentProjects, ...previousProjects].map((p) => `/projects/${p.slug}`),
]

const today = new Date().toISOString().slice(0, 10)

const body = paths
  .map(
    (path) =>
      `  <url>\n    <loc>${ORIGIN}${path}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`,
  )
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`

writeFileSync(out, xml)
console.log(`sitemap.xml: ${paths.length} urls -> ${out}`)
