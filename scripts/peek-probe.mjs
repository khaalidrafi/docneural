// Disposable probe: dispatch the same pointerover the gate dispatches, and
// report what the page says about it (errors, href, whether openPeek ran).
import { chromium } from '/home/khalid/org-roam-lite-ui/node_modules/playwright-core/index.mjs'
import { readFileSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://127.0.0.1:4199/'
const CHROME = process.env.SYNAPT_CHROME ??
  (await import('node:child_process')).execSync('command -v chromium || true').toString().trim()
const graph = JSON.parse(readFileSync('.export/graph.json', 'utf8'))

const browser = await chromium.launch({
  executablePath: CHROME || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
})
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
const errs = []
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()) })

const doc = graph.nodes.find((n) => !n.stub && n.tags?.[0] === 'org')
await page.goto(`${BASE}?doc=${encodeURIComponent(doc.slug)}`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.reader .sy-org h2[id]', { timeout: 90000 })

// Replay the gate's preceding interactions: mark, leave to the front door,
// come back through the mark card, unmark. Then hover.
async function step(label, fn) {
  await fn()
  await page.waitForTimeout(250)
  const s = await page.evaluate(() => ({
    peek: document.querySelectorAll('.peek').length,
    syOrg: document.querySelectorAll('.sy-org').length,
    zen: document.querySelectorAll('.reader.zen').length,
    slug: new URLSearchParams(location.search).get('doc')
  }))
  console.log(label, JSON.stringify(s))
}
await step('baseline ', async () => {})
await step('after v  ', () => page.keyboard.press('v'))
await step('after esc', () => page.keyboard.press('Escape'))
await step('after b  ', () => page.keyboard.press('b'))
await step('brand    ', () => page.locator('.shell .brand').click())
await page.waitForSelector('.home .mk', { timeout: 30000 })
await step('back via mk', () => page.locator('.home .mk').first().click())
await page.waitForSelector('.reader .sy-org', { timeout: 90000 })
await step('unmark b ', () => page.keyboard.press('b'))

const wireTargets = new Set(graph.links.filter((l) => l.source === doc.id).map((l) => l.target))
const hrefs = await page.evaluate(() =>
  [...document.querySelectorAll('.sy-org a[href*="docs/"]')].map((a) => a.getAttribute('href')))
const hit = hrefs.find((h) => {
  const s = h?.split('/').pop()?.replace('.html', '').split('#')[0]
  const t = graph.nodes.find((n) => n.slug === s)
  return t && wireTargets.has(t.id)
})
console.log('target href:', hit)

const sel = `.sy-org a[href="${hit}"]`
await page.dispatchEvent(sel, 'pointerover', { pointerType: 'mouse', bubbles: true })
await page.waitForTimeout(900)
const after = await page.evaluate(() => ({
  peek: document.querySelectorAll('.peek').length,
  pkTitle: document.querySelector('.pk-title')?.textContent?.trim() ?? null,
  why: document.querySelector('.pk-why')?.textContent?.trim().slice(0, 60) ?? null,
  bySlug: !!window.__store
}))
console.log('after hover:', JSON.stringify(after))
console.log('errors:', errs.length ? errs.slice(0, 6).join('\n  ') : 'none')
await browser.close()
