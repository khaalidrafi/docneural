// Disposable probe: does the graph canvas actually paint, and does anything
// throw while it does? (The gate's pixel check has no error channel.)
import { chromium } from '/home/khalid/org-roam-lite-ui/node_modules/playwright-core/index.mjs'
import { execSync } from 'node:child_process'

const BASE = process.argv[2] ?? 'http://127.0.0.1:4199/'
const CHROME = process.env.SYNAPT_CHROME || execSync('command -v chromium || true').toString().trim()

const browser = await chromium.launch({
  executablePath: CHROME || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
})
const page = await browser.newPage({ viewport: { width: 1400, height: 880 } })
const errs = []
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()) })

await page.goto(`${BASE}?doc=org--Agenda-Views`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.reader .sy-org', { timeout: 120000 })
await page.keyboard.press('g')
await page.keyboard.press('s')
await page.waitForSelector('.roam-wrap canvas', { timeout: 60000 })
await page.waitForTimeout(Number(process.argv[3] ?? 9000))

const sample = () => page.evaluate(() => {
  const cs = [...document.querySelectorAll('.roam-wrap canvas')]
  return cs.map((c, i) => {
    const off = document.createElement('canvas')
    off.width = c.width
    off.height = c.height
    off.getContext('2d').drawImage(c, 0, 0)
    const d = off.getContext('2d').getImageData(0, 0, off.width, off.height).data
    let lit = 0
    for (let p = 3; p < d.length; p += 4) if (d[p] > 8) lit++
    return { i, cls: c.className, w: c.width, h: c.height, lit }
  })
})
console.log('canvases:', JSON.stringify(await sample()))
console.log('data-layout:', await page.evaluate(() => document.querySelector('.roam-wrap')?.dataset.layout))
console.log('nodes hook:', await page.evaluate(() => document.querySelector('.roam-wrap')?.firstElementChild?.dataset?.nodes))
console.log('errors:', errs.length ? errs.slice(0, 8).join('\n  ') : 'none')
await page.screenshot({ path: '/tmp/pw/probe-graph.png' })

// Toggle spread and see whether the field repaints.
await page.locator('.layout').click()
await page.waitForTimeout(Number(process.argv[3] ?? 9000))
console.log('after spread:', JSON.stringify(await sample()))
console.log('errors after spread:', errs.length ? errs.slice(0, 8).join('\n  ') : 'none')
await page.screenshot({ path: '/tmp/pw/probe-spread.png' })
await browser.close()
