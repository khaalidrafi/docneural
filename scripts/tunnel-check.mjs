// One cold page load through the public tunnel: does the site paint, how long
// did boot take, and how many bytes came over the wire. Debug aid for "I'm
// getting bad gateway" — not a gate, just a fast answer.
//   node scripts/tunnel-check.mjs [url]
import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
// Same chromium the main gate uses: playwright-core from the sibling org-roam
// checkout (zero installs here) driving the Guix `chromium` off PATH. Playwright
// does NOT search PATH for its executable, and its own bundled shell wants an
// FHS /lib64 that Guix does not have — so resolve it by hand.
import { chromium } from '/home/khalid/org-roam-lite-ui/node_modules/playwright-core/index.mjs'

const BASE = process.argv[2] || 'https://burton-limits-garbage-cancelled.trycloudflare.com/'
const CHROME = process.env.DOCNEURAL_CHROME ??
  (process.env.PATH ?? '').split(':').map((d) => `${d}/chromium`).find((p) => existsSync(p))
if (!CHROME) {
  console.error('no chromium found — set DOCNEURAL_CHROME=/path/to/chromium')
  process.exit(1)
}
const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
})
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage()

const bytes = { total: 0, gz: 0, requests: 0 }
page.on('response', async (r) => {
  const h = r.headers()
  bytes.requests++
  bytes.total += Number(h['content-length'] ?? 0)
  if (h['content-encoding']?.includes('gzip')) bytes.gz++
})
page.on('requestfailed', (r) => console.log(`FAILED ${r.url()} ${r.failure()?.errorText}`))

const t0 = Date.now()
try {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 120000 })
} catch (e) {
  console.log('goto failed:', e.message)
  await browser.close()
  process.exit(1)
}
console.log(`domcontentloaded in ${Date.now() - t0} ms`)

try {
  await page.waitForSelector('.home .wordmark', { timeout: 180000 })
} catch {
  console.log('WORDMARK NEVER PAINTED')
  await browser.close()
  process.exit(1)
}
const paint = await page.evaluate(() => {
  const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0
  const g = performance.getEntriesByType('resource').find((r) => /graph\.json/.test(r.name))
  return {
    fcp: Math.round(fcp),
    wordmark: document.querySelector('.home .wordmark')?.textContent?.trim(),
    graphWire: Math.round(g?.encodedBodySize ?? -1),
    graphDecoded: Math.round(g?.decodedBodySize ?? -1),
    nodes: document.querySelectorAll('.src-card').length,
  }
})
console.log(`wordmark painted ${Date.now() - t0} ms after goto`)
console.log(JSON.stringify(paint))
console.log(`observed ${bytes.requests} responses, ${Math.round(bytes.total / 1024)} kB of declared body, ${bytes.gz} gzipped`)
mkdirSync(resolve('shots'), { recursive: true })
await page.screenshot({ path: resolve('shots/tunnel-home.png') })
await browser.close()
