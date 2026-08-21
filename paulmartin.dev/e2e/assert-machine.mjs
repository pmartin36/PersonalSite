// Deterministic render assertions for the machine, layer 2 of browser-live-verify.
// Measures the rendered result in a real browser and exits non-zero on failure, so
// it can be folded into the gate command (npm test && npm run build && node
// e2e/assert-machine.mjs). It runs against the DEV server on purpose: React
// StrictMode is live there, so a doubled-updater bug reproduces (it is a no-op in
// the production build). These check the exact classes of failure that a jsdom
// gate cannot see and that shipped wrong in the first build of this machine:
//   - the front face rendered magnified (2x the viewport)
//   - a wrong face landing at the front (wrong angle->index mapping)
//   - one navigation step moving two faces (StrictMode double-rotation)
//   - the reel showing one flat face with no neighbor slivers
//   - runtime/console errors during load and interaction
//
// Grounded-truth only: every failure prints the actual measured number.

import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const PORT = 5174
const URL = `http://localhost:${PORT}`
const ART = join(HERE, 'artifacts')
mkdirSync(ART, { recursive: true })

const FACES = ['I', 'II', 'III', 'IV', 'V']

const failures = []
const check = (label, ok, detail) => {
  if (ok) console.log(`  ok   ${label}${detail ? ` (${detail})` : ''}`)
  else {
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`)
    failures.push(label)
  }
}

async function waitForServer(timeoutMs = 25000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(URL)
      if (r.ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`dev server never came up on ${URL}`)
}

// The active face's roman-numeral id, read from its class (machine__face--<id>).
async function activeFace(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.machine__face--active')
    if (!el) return null
    const m = [...el.classList].find(
      (c) => /^machine__face--(I|II|III|IV|V)$/.test(c),
    )
    return m ? m.replace('machine__face--', '') : null
  })
}

// The drum's continuous rotation step count (inline CSS var --rot).
async function rot(page) {
  return page.evaluate(() => {
    const drum = document.querySelector('.machine__drum')
    return parseFloat(getComputedStyle(drum).getPropertyValue('--rot')) || 0
  })
}

// Click the "Go to Face <id>" pip on the CURRENTLY ACTIVE face (each face carries
// its own pip row; the ones on faces turned away are not actionable).
async function clickPip(page, id) {
  await page
    .locator(`.machine__face--active [aria-label="Go to Face ${id}"]`)
    .click()
}

const settle = (page, ms = 750) => page.waitForTimeout(ms)

async function main() {
  const server = spawn('npm', ['run', 'dev', '--', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT,
    stdio: 'ignore',
  })
  let browser
  try {
    await waitForServer()
    browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1280, height: 860 } })

    const consoleErrors = []
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text())
    })
    page.on('pageerror', (e) => consoleErrors.push(String(e)))

    console.log(`\nbrowser-live-verify: assert-machine against ${URL}\n`)
    await page.goto(URL, { waitUntil: 'domcontentloaded' })

    // The opening spin locks interaction; the root drops .machine--intro-busy when
    // it lands. Wait for that rather than a fixed sleep.
    await page.waitForSelector('.machine:not(.machine--intro-busy)', { timeout: 12000 })
    await settle(page)

    // 1. Lands on Face I (the name).
    check('intro lands on Face I', (await activeFace(page)) === 'I', `active=${await activeFace(page)}`)

    // 2. Front face is full-bleed, NOT magnified. A 3D face pushed toward the camera
    //    without the compensating drum pull-back projects wider than the viewport.
    const box = await page.evaluate(() => {
      const s = document.querySelector('.machine__face--active .face-surface')
      const r = s.getBoundingClientRect()
      return { w: r.width, h: r.height, vw: innerWidth, vh: innerHeight }
    })
    check(
      'front face width fits viewport',
      box.w <= box.vw * 1.02 && box.w >= box.vw * 0.4,
      `face ${box.w.toFixed(0)}px vs viewport ${box.vw}px`,
    )
    check(
      'front face height fits viewport',
      box.h <= box.vh * 1.02 && box.h >= box.vh * 0.4,
      `face ${box.h.toFixed(0)}px vs viewport ${box.vh}px`,
    )

    // 3. Each pip brings the correct face to front, and ONE adjacent step advances
    //    the drum by exactly one (not two — the StrictMode double-rotation).
    let prev = await rot(page)
    for (const target of ['II', 'III', 'IV', 'V', 'I']) {
      await clickPip(page, target)
      await page.waitForSelector(`.machine__face--${target}.machine__face--active`, { timeout: 4000 })
      const now = await rot(page)
      check(`pip -> Face ${target} at front`, (await activeFace(page)) === target)
      check(
        `one step advances the drum by 1 (I..V adjacent)`,
        Math.abs(now - prev) === 1,
        `--rot ${prev} -> ${now}, delta ${(now - prev).toFixed(2)}`,
      )
      prev = now
    }

    // 4. Face III reel shows the current entry PLUS neighbor slivers, not one flat
    //    face filling the window.
    await clickPip(page, 'III')
    await page.waitForSelector('.machine__face--III.machine__face--active', { timeout: 4000 })
    await settle(page)
    const reel = await page.evaluate(() => {
      const win = document.querySelector('.face3-reel__window')
      if (!win) return null
      const wr = win.getBoundingClientRect()
      const faces = [...win.querySelectorAll('.face3-reel__face')].map((f) =>
        f.getBoundingClientRect(),
      )
      const intersecting = faces.filter(
        (r) => r.height > 8 && r.bottom > wr.top + 2 && r.top < wr.bottom - 2,
      )
      const front = intersecting.slice().sort((a, b) => b.height - a.height)[0]
      return { count: intersecting.length, frontH: front ? front.height : 0, winH: wr.height }
    })
    check('Face III reel window found', reel !== null)
    if (reel) {
      check(
        'reel shows current + neighbor slivers',
        reel.count >= 2,
        `${reel.count} reel faces intersect the window`,
      )
      check(
        'reel front face does not fill the window (sliver room)',
        reel.frontH < reel.winH * 0.95,
        `front ${reel.frontH.toFixed(0)}px in window ${reel.winH.toFixed(0)}px`,
      )
    }

    await page.screenshot({ path: join(ART, 'face3.png') })
    await clickPip(page, 'I')
    await page.waitForSelector('.machine__face--I.machine__face--active', { timeout: 4000 })
    await settle(page)
    await page.screenshot({ path: join(ART, 'face1.png') })

    // 5. No runtime/console errors across the whole run.
    check('console clean (no errors / page errors)', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '))

    console.log(`\nartifacts: ${ART}`)
  } finally {
    if (browser) await browser.close()
    server.kill('SIGTERM')
  }

  if (failures.length) {
    console.log(`\nFAILED ${failures.length} check(s): ${failures.join(', ')}\n`)
    process.exit(1)
  }
  console.log('\nall render assertions passed\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
