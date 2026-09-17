// Captures public/og-image.jpg: the link-preview image, a 1200x630 frame of the
// settled scene (the carved-name face). Not part of the build. Run against a
// running dev or preview server, then commit the image:
//   npm run dev        # in another shell
//   node scripts/capture-og-image.mjs http://localhost:5173/
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const url = process.argv[2] || process.env.OG_URL || 'http://localhost:5173/'
const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, '../public/og-image.jpg')

const browser = await chromium.launch()
// Reduced motion rests on the name face with no opening spin, so the frame is
// deterministic. 1x keeps the image at exactly the 1200x630 declared in the meta.
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
})
await page.goto(url, { waitUntil: 'networkidle' })
// Let the backdrop and the carved-name font decode and paint.
await page.waitForTimeout(2500)
await page.screenshot({ path: out, type: 'jpeg', quality: 86 })
await browser.close()
console.log('og-image.jpg written ->', out)
