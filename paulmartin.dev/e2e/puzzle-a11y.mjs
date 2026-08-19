// Captured evidence (not part of the gate): the assembled machine solves
// under prefers-reduced-motion, driven entirely by keyboard, with the five
// faces present as regions in DOM order.
//   BASE=http://localhost:4173/ node e2e/puzzle-a11y.mjs
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const BASE = process.env.BASE || 'http://localhost:4173/'
const outDir = fileURLToPath(new URL('./output/', import.meta.url))
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  reducedMotion: 'reduce',
})
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})

await page.goto(BASE, { waitUntil: 'load' })

// The five faces, as regions, in DOM order.
const regionNames = await page.$$eval('section[aria-label]', (els) =>
  els.map((el) => el.getAttribute('aria-label')),
)
const expectedRegions = ['Face I', 'Face II', 'Face III', 'Face IV', 'Face V']
const regionsInOrder = JSON.stringify(regionNames) === JSON.stringify(expectedRegions)

const h1Text = await page.$eval('h1', (el) => el.textContent)

await page.screenshot({ path: `${outDir}pre-solve.png` })

// Read the collected sequence from the page's own hooks, never a literal.
const collected = await page.$$eval('[data-clue-order]', (els) =>
  els
    .slice()
    .sort((a, b) => Number(a.getAttribute('data-clue-order')) - Number(b.getAttribute('data-clue-order')))
    .map((el) => el.getAttribute('data-clue-direction')),
)

// Reach Face V by keyboard, via its wayfinding pip. Waits out the
// reduced-motion crossfade (opacity transition, 0.3s) so the screenshot
// below captures the settled frame rather than a mid-fade one.
const goToFaceV = page.getByRole('button', { name: 'Go to Face V' })
await goToFaceV.focus()
await page.keyboard.press('Enter')
await page.waitForFunction(
  () => getComputedStyle(document.querySelector('.machine__face--V')).opacity === '1',
)

const faceV = page.getByRole('region', { name: 'Face V' })
for (const direction of collected) {
  const button = faceV.getByRole('button', { name: direction })
  await button.focus()
  await page.keyboard.press('Enter')
}

// The solved celebration also crossfades in under reduced motion; wait it
// out before the screenshot for the same reason.
await faceV.locator('[data-solved="true"]').waitFor()
await page.waitForFunction(() => {
  const solvedPanel = document.querySelector('.face5-slab__solved')
  return solvedPanel && getComputedStyle(solvedPanel).opacity === '1'
})
const solved = await faceV.locator('[data-solved]').getAttribute('data-solved')
await page.screenshot({ path: `${outDir}solved.png` })

await browser.close()

const ok = regionsInOrder && h1Text === 'Paul Martin' && solved === 'true' && errors.length === 0

const summary = {
  base: BASE,
  regionNames,
  regionsInOrder,
  h1Text,
  collectedSequence: collected,
  solved,
  errors,
  pass: ok,
}
writeFileSync(`${outDir}result.json`, JSON.stringify(summary, null, 2))

console.log('regions:', JSON.stringify(regionNames))
console.log('h1:', h1Text)
console.log('collected sequence:', JSON.stringify(collected))
console.log('solved:', solved)
console.log('errors:', errors.length ? errors.join(' || ') : 'none')
console.log(ok ? 'PASS' : 'FAIL')
if (!ok) process.exitCode = 1
