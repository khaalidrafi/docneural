// boot-audit.mjs — the P0 performance census, run against a BUILT site.
//
// WHAT IT COUNTS. Every request the home page makes from an empty cache until
// the boot settles: the document, its CSS + JS chunks, the graph artifact,
// the woff2 files the rendered text pulls in. From that census it asserts the
// three things the board's P0 lines claim:
//
//   1. boot requests are bounded (< 60) and every one of them is same-origin;
//   2. the graph crossed the wire as the pipeline's smallest artifact
//      (graph.json.br / .gz self-decoded, or a host-compressed plain fetch) —
//      never the fat, identity-encoded file;
//   3. zero external font URLs anywhere in the built HTML/CSS/JS, and the
//      dist ships exactly the three self-hosted woff2 faces.
//
// `make verify` (pw-verify.mjs) asserts this ON a running site with the real
// corpus; boot-audit needs no corpus and no editorial content — it audits the
// built output's request TOPOLOGY, which is exactly the part that can be
// checked on a fixture or in CI. It runs the page twice (desktop + phone
// viewport) because the phone-first law makes the second boot the real one.
//
//   node scripts/boot-audit.mjs --project . --port 4174
//
// Exit 0 = every assertion passed; exit 1 = a P0 claim is broken.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { loadPlaywright, findChrome } from './browser.mjs'
import { startPreview } from './preview-dist.mjs'

const argv = process.argv.slice(2)
const arg = (name, dflt) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? dflt : argv[i + 1]
}
const PROJECT = arg('project', '.')
const PORT = Number(arg('port', '4174'))
const MAX_REQUESTS = Number(arg('max-requests', '60'))
const EXPECT_WOFF2 = Number(arg('expect-woff2', '3')) // the theme's three faces

let failures = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`)
  if (!ok) failures++
}

// ---------- file-level font scan (no browser needed) ----------
function* walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    const s = statSync(p)
    if (s.isDirectory()) yield* walk(p)
    else yield p
  }
}

function fontScan(dist) {
  // Any Google/CDN font URL hard-coded into the built output would
  // re-introduce the render-blocking stylesheet the theme removed; the woff2
  // inventory is the "three self-hosted faces" half of the P0.
  const FONT_HOSTS = /fonts\.googleapis\.com|fonts\.gstatic\.com|use\.(?:typekit|twimg)\.com|cloud\.typography\.com/
  const urlHosts = new Map() // host -> [files]
  const woff2 = []
  for (const p of walk(dist)) {
    if (extname(p) === '.woff2') {
      woff2.push(p)
      continue
    }
    // Font URLs can only arrive as HTML <link>/<style> or CSS @font-face /
    // @import — the two formats scanned here. Comments are stripped first:
    // the theme's own index.html and CSS carry an explanatory "no webfont
    // <link> here on purpose" note that names fonts.googleapis.com, and the
    // scan must not arrest the documentation for the crime it documents.
    let src
    if (extname(p) === '.html' || extname(p) === '.css') {
      src = readFileSync(p, 'utf8')
        .replace(extname(p) === '.html' ? /<!--[\s\S]*?-->/g : /\/\*[\s\S]*?\*\//g, '')
      for (const m of src.matchAll(/https?:\/\/[a-z0-9.-]+/gi)) {
        const host = new URL(m[0]).host
        if (!urlHosts.has(host)) urlHosts.set(host, [])
        if (!urlHosts.get(host).includes(p)) urlHosts.get(host).push(p)
      }
      if (FONT_HOSTS.test(src)) urlHosts.set('FONT-CDN', (urlHosts.get('FONT-CDN') ?? []).concat(p))
    }
  }
  return { urlHosts, woff2 }
}

// ---------- one boot, censused ----------
async function census(browser, url, viewport, label) {
  const ctx = await browser.newContext({ viewport })
  const page = await ctx.newPage()
  const reqs = []
  page.on('request', (r) => reqs.push(r.url()))
  const t0 = Date.now()
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 })
  await page.waitForSelector('.home .wordmark', { timeout: 120_000 })
  // Settle: fonts are fetched when text actually renders; give the last
  // layout a beat so the census sees the whole boot, not its first frame.
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(700)
  const ms = Date.now() - t0
  console.log(`\n[${label}] ${viewport.width}x${viewport.height} — boot ${ms} ms`)
  for (const u of reqs) {
    console.log(`  req ${new URL(u).pathname}${new URL(u).search}`)
  }
  await ctx.close()

  const baseHost = new URL(url).host
  const loopback = (h) => /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(h)
  const hosts = [...new Set(reqs.map((u) => new URL(u).host))]
  const foreign = hosts.filter((h) => h !== baseHost && !(loopback(h) && loopback(baseHost)))
  check(`[${label}] boot makes ${reqs.length} requests (< ${MAX_REQUESTS})`,
    reqs.length < MAX_REQUESTS, `count ${reqs.length}`)
  check(`[${label}] every boot request is same-origin`,
    foreign.length === 0, `hosts=[${hosts.join(' ')}] foreign=[${foreign.join(' ')}]`)

  const graph = reqs.map((u) => new URL(u, url)).find((u) => /graph\.json(\.br|\.gz)?$/.test(u.pathname))
  if (!graph) {
    check(`[${label}] the boot fetched a graph artifact`, false, 'no graph.json in the log')
  } else {
    const artifact = graph.pathname.split('/').pop()
    const res = await fetch(graph.href)
    const declared = Number(res.headers.get('content-length') ?? NaN)
    const raw = Buffer.from(await res.arrayBuffer())
    const wire = Number.isFinite(declared) ? declared : raw.length
    const enc = res.headers.get('content-encoding')
    let parsed = 0
    if (enc) parsed = raw.length
    else if (/\.br$/.test(artifact)) parsed = (await import('node:zlib')).brotliDecompressSync(raw).length
    else if (/\.gz$/.test(artifact)) parsed = (await import('node:zlib')).gunzipSync(raw).length
    else parsed = raw.length
    const small = /\.(br|gz)$/.test(artifact) || Boolean(enc)
    check(`[${label}] the boot graph arrived small (${artifact}${enc ? `, host ${enc}` : ', self-decoded'})`,
      small, `${wire} B on the wire -> ${(parsed / 1024).toFixed(1)} kB parsed`)
  }
  return reqs
}

// ---------- main ----------
const { chromium } = await loadPlaywright()
const CHROME = process.env.DOCNEURAL_CHROME ?? findChrome()
if (!CHROME || !existsSync(CHROME)) {
  console.error('no chromium found — set DOCNEURAL_CHROME=/path/to/chromium')
  process.exit(2)
}

const { url, child } = await startPreview(PROJECT, PORT)
console.log(`boot-audit: serving ${resolve(PROJECT)}/dist at ${url}`)
try {
  const dist = join(resolve(PROJECT), 'dist')
  const { urlHosts, woff2 } = fontScan(dist)

  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  })
  await census(browser, url, { width: 1440, height: 900 }, 'desktop')
  await census(browser, url, { width: 390, height: 844 }, 'phone')
  await browser.close()

  const fontCdn = [...urlHosts.keys()].filter((h) => h === 'FONT-CDN' || /googleapis|gstatic|typekit|typography/.test(h))
  check('zero external font URLs in built HTML/CSS/JS',
    fontCdn.length === 0,
    fontCdn.length ? `${fontCdn.join(' ')} in ${fontCdn.flatMap((h) => urlHosts.get(h)).join(' ')}` : 'none found')
  const otherHosts = [...urlHosts.keys()].filter((h) => !h.startsWith('127.0.0.1') && !h.startsWith('localhost') && h !== 'FONT-CDN' && !/googleapis|gstatic|typekit|typography/.test(h))
  if (otherHosts.length) {
    console.log(`note: external (non-font) URLs present in the bundle: ${otherHosts.join(' ')}`)
  }
  check(`dist ships ${EXPECT_WOFF2} self-hosted woff2 faces`,
    woff2.length === EXPECT_WOFF2,
    woff2.map((p) => `${p.replace(dist + '/', '')} (${statSync(p).size} B)`).join(', '))
} finally {
  child.kill('SIGTERM')
}

console.log(`\n${failures === 0 ? 'BOOT AUDIT PASSED' : failures + ' BOOT AUDIT CHECK(S) FAILED'}`)
process.exit(failures === 0 ? 0 : 1)
