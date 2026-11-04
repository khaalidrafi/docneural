// pw-verify.mjs — drive the site in a REAL Chromium and assert the redesign
// actually rendered, not just that the bundle compiled.
//
// Why a driver instead of eyeballing: the interesting claims are numeric
// (a canvas has N nodes painted with M distinct hues; a source chip's colour
// equals the colour the canvas gives that source's nodes). Those are checkable
// in-page; "does it look cool" is for the human, hence the screenshots.
//
//   node scripts/pw-verify.mjs [--url http://localhost:5173/] [--out /tmp/pw]
//
// The LIBRARY + BROWSER halves are resolved in scripts/browser.mjs: zero new
// dependencies, sibling-checkout playwright-core, PATH chromium with the
// Playwright cache as fallback. Set DOCNEURAL_PLAYWRIGHT / DOCNEURAL_CHROME
// to override either half.
import { loadPlaywright, findChrome } from './browser.mjs'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'

const { chromium } = await loadPlaywright()

const argv = process.argv.slice(2)
const arg = (name, dflt) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? dflt : argv[i + 1]
}
const BASE = arg('url', 'http://localhost:5173/')
const OUT = arg('out', '/tmp/pw')
// First paint on this box is a race with whatever else is compiling: the boot
// parses graph.json (~2.2 MB slim, ~7 MB before the ctx split) before it can
// paint the home view, so the readiness budget is a machine property, not a
// design one. Override with --paint 300000 when the load average says the
// Celeron is busy.
const PAINT = Number(arg('paint', '180000'))
const CHROME = process.env.DOCNEURAL_CHROME ?? findChrome()

if (!CHROME || !existsSync(CHROME)) {
  console.error('no chromium found — set DOCNEURAL_CHROME=/path/to/chromium')
  process.exit(2)
}
mkdirSync(OUT, { recursive: true })

let failures = 0
// Readiness budgets are deliberately long (90-120 s): this box is a 4 GB
// Celeron that is often also compiling something, and a slow first paint is
// not a broken theme. Failures here are real signal; flaky timeouts are not.
//
// domcontentloaded, not load: a third-party stylesheet can stall `load` for
// minutes here. Readiness is asserted by the waitForSelector after each goto,
// which is the thing we actually care about.
//
// On the DEV server this budget is also the module-transform budget: a
// type=module script defers DOMContentLoaded until Vite has transformed the
// whole Svelte graph, which is >90 s when the Celeron is busy. Raise it with
// --nav 240000, or verify the built site (`make serve`) where there is no
// transform at all.
const NAV = { waitUntil: 'domcontentloaded', timeout: Number(arg('nav', '90000')) }
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`)
  if (!ok) failures++
}
// A check the corpus gate holds: printed loudly, NOT counted as a failure —
// the gate check itself is the red line that names the fix (rebuild the
// export). Without this, a partial corpus reports five symptom reds that all
// point at one root cause.
const hold = (name, why) => {
  console.log(`HOLD  ${name}  — ${why}`)
}

// Errors the page itself raised. A Svelte runtime error or a failed fetch
// would otherwise pass silently while the UI is broken.
// Every URL the pages asked for. Two perf claims are only checkable from the
// outside: "nothing leaves the machine" (fonts are self-hosted, no CDN) and
// "the next chapter was already warm" (prefetch). Both are request-log facts.
const reqs = []
function watch(page, label, bag) {
  page.on('pageerror', (e) => bag.push(`${label}: pageerror ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') bag.push(`${label}: console ${m.text()} @ ${m.location()?.url ?? '?'}`)
  })
  page.on('request', (r) => reqs.push(r.url()))
  page.on('requestfailed', (r) => {
    // A prefetch in flight when the reader navigates is aborted by design —
    // the fragment is 2 kB, not worth a fetch controller.
    if (r.failure()?.errorText === 'net::ERR_ABORTED') return
    bag.push(`${label}: requestfailed ${r.url()}`)
  })
  page.on('response', (r) => {
    // `ctx/<id>.json` is a per-node prose file; a node with no citing wire has
    // none, and store.loadContext only acts on res.ok. A 404 there is the
    // designed outcome, not a bug.
    if (r.status() === 404 && /\/ctx\//.test(r.url())) return
    if (r.status() >= 400) bag.push(`${label}: ${r.status()} ${r.url()}`)
  })
}

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME,
    // Guix is not FHS and this box has no unprivileged user namespace for
    // chrome's own sandbox; --no-sandbox is the standard escape here.
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  })
  const problems = []

  // ---------- desktop, dark ----------
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  // The reading tools copy to the clipboard, and headless Chromium will not
  // let a page read one it has not been granted. Localhost is a secure
  // context, so the async clipboard API is available once permitted.
  try {
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write'])
  } catch (e) {
    console.log(`note: clipboard permissions unavailable (${e.message}) — copy checks may fail`)
  }
  const page = await ctx.newPage()
  watch(page, 'desktop', problems)

  const t0 = Date.now()
  await page.goto(BASE, NAV)
  await page.waitForSelector('.home .wordmark', { timeout: PAINT })
  const bootMs = Date.now() - t0
  // Boot is reported every run because "instant" is the requirement, and the
  // number that can regress silently is the REQUEST COUNT (a CDN widget added
  // later costs one DNS + TLS round trip each). The timings are printed, not
  // asserted: on a Celeron that is also compiling something they are a
  // property of the machine, and PAINT/NAV already bound them.
  const nav = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0]
    const fcp = performance.getEntriesByType('paint').find((p) => p.name === 'first-contentful-paint')
    return {
      dcl: Math.round(n?.domContentLoadedEventEnd ?? -1),
      fcp: fcp ? Math.round(fcp.startTime) : -1,
      enc: Math.round(n?.encodedBodySize ?? -1)
    }
  })
  check(
    `boot: ${reqs.length} requests, DOM ${nav.dcl} ms, FCP ${nav.fcp} ms, wordmark ${bootMs} ms`,
    reqs.length < 60, `document ${nav.enc} B compressed`)

  const tokens = await page.evaluate(() => {
    const css = getComputedStyle(document.documentElement)
    const g = (n) => css.getPropertyValue(n).trim()
    return {
      accent: g('--dn-accent'), accent2: g('--dn-accent-2'), hot: g('--dn-hot'),
      bg: g('--dn-bg'), mono: g('--dn-font-mono'), display: g('--dn-font-display'),
      palette: g('--dn-graph-palette').split(',').filter(Boolean).length
    }
  })
  // The 2026-10-31 contrast pass (94cfc3d) re-themed the neon set to text-safe
  // stops — #00e5ff/#ff2d95 could not clear AA on the void, #4d94ff/#ff3366
  // can (6.6:1 / consult E). The probe pins the AUTHORED tokens so a silent
  // token edit still fails here, with the AA numbers checked separately
  // ("text contrast clears AA").
  check('dark neon tokens resolved', tokens.accent.toLowerCase() === '#4d94ff'
    && tokens.accent2.toLowerCase() === '#ff3366' && tokens.hot.toLowerCase() === '#ffd93f',
  JSON.stringify(tokens))
  check('mono display font is JetBrains', /JetBrains Mono/.test(tokens.mono), tokens.mono)
  check('display font token is Electrolize with a mono fallback',
    /Electrolize/.test(tokens.display) && /JetBrains Mono/.test(tokens.display), tokens.display)
  check('graph palette has 8 hues', tokens.palette === 8, String(tokens.palette))

  const hero = await page.evaluate(() => {
    // Two .wordmark instances exist (the 15px header brand and the hero
    // nameplate); the plate's cqw sizing can resolve a beat after the boot
    // paint, so measuring "the first one" races the layout. The invariant is
    // that a DISPLAY-size filament wordmark exists — take the biggest.
    const all = [...document.querySelectorAll('.wordmark')].map((el) => {
      const g = getComputedStyle(el)
      return {
        text: el.textContent?.trim().slice(0, 24),
        font: g.fontFamily, size: parseFloat(g.fontSize),
        clipped: g.webkitBackgroundClip || g.backgroundClip
      }
    })
    const wm = all.sort((a, b) => b.size - a.size)[0] ?? {}
    const body = getComputedStyle(document.body, '::after')
    return { ...wm, scanImage: body.backgroundImage, instances: all.length }
  })
  // Consult E retired the glitch pseudos for the REGISTERED NAMEPLATE: the
  // wordmark is a gradient-filament plate (dn-gradient-text) sized by the
  // plate's own cqw — not the 15px header brand, which is a DIFFERENT
  // .wordmark earlier in the DOM. Probe the hero plate, and the filament
  // clip that replaced the ghosts.
  check('the hero nameplate is the gradient-filament wordmark',
    /Electrolize/.test(hero.font || '') && hero.size > 30 &&
      (hero.clipped ?? '').includes('text'),
    `${hero.font} @ ${hero.size}px clip=${hero.clipped} on "${hero.text}" (${hero.instances} wordmarks)`)
  // The floor overlay stayed (body::after, 1px repeating tissue) but the CRT
  // mix-blend went away — OP-47 ruled a CRT overlay on paper the wrong
  // metaphor, so the tissue composites by opacity now. Assert the overlay
  // exists and stays out of the input path.
  check('the floor tissue overlay is composited',
    /repeating-linear-gradient|linear-gradient/.test(hero.scanImage || ''),
    `${(hero.scanImage || '').slice(0, 24)}…`)

  const srcCards = await page.locator('.src-card').count()
  check('sources strip renders one card per corpus', srcCards >= 2, `${srcCards} cards`)

  // Performance is the design constraint here, so the two things that used to
  // cost the reader time are asserted as ABSENT: a third-party host anywhere
  // on the boot's request log, and the 4.9 MB of citation prose that used to
  // ride in every boot to paint one line in the rail.
  //
  // Same-origin is judged against the URL the site is actually served from
  // (origin equality), not a localhost regex — on the deployed host every
  // request carries the site's own domain, and THAT is the pass condition;
  // loopback aliases stay legal for dev/preview. Anything else (a CDN font,
  // analytics, a badge) is one DNS+TLS round trip per request the reader
  // pays for nothing.
  const baseHost = new URL(BASE).host
  const loopback = (h) => /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(h)
  // SPEC 4 shipped the AGENT SURFACE with the site: agent-manifest.json is
  // the published contract, and the presence worker in it is the site's own
  // backend (a public snapshot GET, no visitor payload — the announce is
  // agent-initiated POST). The census keeps its teeth by whitelisting ONLY
  // the hosts the shipped manifest itself declares: any undeclared third
  // party still fails here.
  let manifestHosts = []
  try {
    const mf = await (await fetch(`${BASE}agent-manifest.json`)).json()
    const urls = JSON.stringify(mf).match(/https:\/\/[a-z0-9.-]+/gi) ?? []
    manifestHosts = [...new Set(urls.map((u) => new URL(u).host))]
  } catch { /* no manifest shipped: nothing to whitelist */ }
  const hosts = [...new Set(reqs.filter((u) => /^https?:/.test(u)).map((u) => new URL(u).host))]
  const foreign = hosts.filter((h) => h !== baseHost && !(loopback(h) && loopback(baseHost)) &&
    !manifestHosts.includes(h))
  const woff2 = reqs.filter((u) => /\.woff2(\?|$)/.test(u))
  check('nothing leaves the machine — every boot request is same-origin or manifest-declared',
    foreign.length === 0,
    `hosts=[${hosts.join(' ')}] foreign=[${foreign.join(' ')}] manifest=[${manifestHosts.join(' ')}]`)
  check('self-hosted webfonts load (three woff2, swap, no CDN)',
    woff2.length >= 2 && foreign.length === 0, `woff2=${woff2.length}`)

  // TRANSPORT (P0): what the BOOT actually fetched is the fact that matters.
  // The pipeline writes graph.json + .gz + .br side by side; the store must
  // have asked for a precompressed artifact (decoded in-page via
  // DecompressionStream) or for plain graph.json that the host compressed on
  // the wire. A plain, identity-encoded graph fetch means the fat build is
  // live again — the exact regression this exists to catch. The artifact is
  // re-fetched and decoded node-side (zlib) so the byte numbers describe the
  // real wire, not a re-request of the fat file.
  // Parsed once here and shared with the rest of main() (chapter-tree and
  // hue assertions below walk the same object).
  let graphJson = null
  const graphUrl = reqs.map((u) => new URL(u, BASE)).find((u) => /graph\.json(\.br|\.gz)?$/.test(u.pathname))
  if (!graphUrl) {
    check('the boot fetched the graph', false, 'no graph.json request in the log')
  } else {
    const artifact = graphUrl.pathname.split('/').pop()
    const gres = await fetch(graphUrl.href)
    const declared = Number(gres.headers.get('content-length') ?? NaN)
    const raw = Buffer.from(await gres.arrayBuffer())
    const wire = Number.isFinite(declared) ? declared : raw.length
    const enc = gres.headers.get('content-encoding')
    if (enc) {
      graphJson = JSON.parse(raw.toString('utf8')) // fetch decoded it already
    } else if (/\.br$/.test(artifact)) {
      const { brotliDecompressSync } = await import('node:zlib')
      graphJson = JSON.parse(brotliDecompressSync(raw).toString('utf8'))
    } else if (/\.gz$/.test(artifact)) {
      const { gunzipSync } = await import('node:zlib')
      graphJson = JSON.parse(gunzipSync(raw).toString('utf8'))
    } else {
      graphJson = JSON.parse(raw.toString('utf8'))
    }
    const gRaw = JSON.stringify(graphJson).length
    const fatLinks = graphJson.links.filter((l) => l.context).length
    const small = /\.(br|gz)$/.test(artifact) || Boolean(enc)
    check(`the boot graph arrived small (${artifact}${enc ? `, host ${enc}` : ', self-decoded'})`,
      small, `${wire} B on the wire, ${(gRaw / 1024).toFixed(0)} kB parsed`)
    check('graph.json is slim (per-wire prose moved to ctx/*.json)',
      fatLinks === 0 && gRaw < 2_600_000,
      `${(gRaw / 1024).toFixed(0)} kB parsed, ${fatLinks} fat links`)
  }

  // CORPUS GATE: the editorial checks below (prefetch, ctx prose, rail
  // grouping, hover card) judge behaviour on real pages. A partial export —
  // fewer docs fragments than the graph's non-stub nodes, e.g. a stale
  // .export after a corpus move — makes those checks describe the EXPORT,
  // not the app. Detect it once, name the fix once, and hold the dependent
  // set behind the gate.
  let corpusComplete = true
  let corpusNote = ''
  try {
    const llms = await (await fetch(`${BASE}llms.txt`)).text()
    // Links are relative ("docs/<slug>.org") in llms.txt; accept both shapes.
    const slugs = [...llms.matchAll(/docs\/([A-Za-z0-9%._-]+)\.org/g)].map((m) => m[1])
    const want = graphJson.nodes.filter((n) => !n.stub).length
    if (slugs.length < want * 0.9) {
      corpusComplete = false
      corpusNote = `${slugs.length} docs listed in llms.txt for ${want} graph nodes — rebuild the export (make export)`
    } else {
      const step = Math.max(1, Math.floor(slugs.length / 10))
      const sample = slugs.filter((_, i) => i % step === 0)
      let miss = 0
      for (const s of sample) {
        const r = await fetch(`${BASE}docs/${s}.html`)
        const t = await r.text()
        // The preview server SPA-fallbacks a missing file to the app shell
        // (200 + index.html), so the STATUS lies. The fragments are
        // body-only HTML — no doctype, no <html> — so the SHAPE tells the
        // truth: an app shell where a fragment should be is a miss.
        if (!r.ok || /<!doctype html|<html[\s>]/i.test(t.slice(0, 200))) miss++
      }
      if (miss > 0) {
        corpusComplete = false
        corpusNote = `${miss}/${sample.length} sampled docs missing (SPA shell served instead) — rebuild the export (make export)`
      }
    }
  } catch (e) {
    corpusComplete = false
    corpusNote = `llms.txt unreachable: ${e.message}`
  }
  check('the corpus is complete (every graph node has its page)', corpusComplete, corpusNote)

  // The terminal aesthetic is DESIGN, not props: no fake tty windows, no PS1
  // prompts, no shell commands in the copy. Assert their absence, then assert
  // what replaced them is still there and legible.
  const shellProps = await page.evaluate(() => {
    const sel = '.sy-term, .tty-bar, .tty-body, .sy-ps1, .sy-cmd, .sy-block-cursor, .sy-ok, .boot-term, .fatal-term'
    const hit = [...document.querySelectorAll(sel)].map((e) => e.className)
    // Copy a shell would print, not copy a reader needs.
    const pat = /\b(you@docs|system@docs|docneural --|\$ (ls|grep|cat|curl)|grep -i|grep -ri|ls \| grep|No such file or directory|\[ ok \])/i
    const text = [...document.querySelectorAll('body *')]
      .filter((e) => !e.children.length && e.textContent)
      .map((e) => e.textContent.trim())
      .filter((t) => pat.test(t))
    return { nodes: hit, copy: text.slice(0, 6) }
  })
  check('no fake terminal windows or shell prompts',
    shellProps.nodes.length === 0 && shellProps.copy.length === 0,
    JSON.stringify(shellProps))

  const stats = await page.evaluate(() => {
    const s = document.querySelector('.home .stats')
    // The inner selector is guarded too: a build whose stats panel lacks its
    // rows must FAIL the check below, not crash the driver mid-gate.
    if (!s || !s.querySelector('.dn-kv')) return null
    const cs = getComputedStyle(s)
    return {
      rows: s.querySelectorAll('.dn-kv > span:nth-child(even)').length,
      font: getComputedStyle(s.querySelector('.dn-kv')).fontFamily,
      bg: cs.backgroundColor,
      border: cs.borderLeftWidth
    }
  })
  check('hero readout is a stats panel, not a tty', !!stats && stats.rows >= 4
    && /JetBrains Mono/.test(stats.font || '') && stats.border !== '0px',
    JSON.stringify(stats))

  // Contrast, measured where it is defined: the tokens, against the surface
  // they are used on. Secondary text must clear 4.5:1, borders 2:1 — a dim
  // laptop panel is the target display, not a calibrated studio.
  const contrast = await page.evaluate(() => {
    const lum = (hex) => {
      const m = hex.trim().match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i)
      if (!m) return null
      const [r, g, b] = m.slice(1).map((h) => {
        const c = parseInt(h, 16) / 255
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const ratio = (a, b) => {
      const [x, y] = [lum(a), lum(b)]
      if (x === null || y === null) return null
      const [hi, lo] = x > y ? [x, y] : [y, x]
      return (hi + 0.05) / (lo + 0.05)
    }
    const cs = getComputedStyle(document.documentElement)
    const tok = (n) => cs.getPropertyValue(n)
    const bg = tok('--dn-bg')
    return {
      theme: document.documentElement.dataset.theme || 'auto-dark',
      muted: ratio(tok('--dn-fg-muted'), bg),
      faint: ratio(tok('--dn-fg-faint'), bg),
      fg: ratio(tok('--dn-fg'), bg),
      border: ratio(tok('--dn-border'), bg)
    }
  })
  const okC = (v, min) => v !== null && v >= min
  check('text contrast clears AA in the active theme',
    okC(contrast.fg, 7) && okC(contrast.muted, 4.5) && okC(contrast.faint, 4.5),
    JSON.stringify(contrast))
  check('borders are visible', okC(contrast.border, 1.9), `--dn-border ${contrast.border}`)

  // THE parity check. The corpus tags are not in the DOM (a card shows the
  // display name), so read them from graph.json — fetched above for the slim
  // check — and derive the manual list exactly the way SynaptStore.manuals
  // does: first tag of each node, in scan order. Then, in-page, compare each
  // card's --dn-src against palette[djb2(tag) % palette.length] computed from
  // the live theme, which is the formula orui/graph/colors.ts uses to colour a
  // node. Equal on both sides means the chip and the neurons cannot drift.
  const tagsSeen = []
  for (const n of graphJson.nodes) {
    const t = n.tags && n.tags[0]
    if (t && !tagsSeen.includes(t)) tagsSeen.push(t)
  }
  const hueRows = await page.evaluate((tags) => {
    const css = getComputedStyle(document.documentElement)
    const palette = css.getPropertyValue('--dn-graph-palette').split(',').map((s) => s.trim()).filter(Boolean)
    const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return Math.abs(h) }
    const cards = [...document.querySelectorAll('.src-card')]
    return cards.map((el, i) => ({
      tag: tags[i],
      dom: getComputedStyle(el).getPropertyValue('--dn-src').trim(),
      canvas: palette[hash(tags[i]) % palette.length],
      label: el.querySelector('.src-name')?.textContent?.trim()
    }))
  }, tagsSeen)
  const mismatched = hueRows.filter((r) => r.dom.toLowerCase() !== r.canvas.toLowerCase())
  check('DOM hue == canvas hue for every source',
    hueRows.length >= 2 && hueRows.length === tagsSeen.length && mismatched.length === 0,
    mismatched.length ? JSON.stringify(mismatched) : JSON.stringify(hueRows.map((r) => `${r.tag}:${r.dom}`)))

  // Source names are real project names, not "<tag> Manual".
  const names = await page.locator('.src-card .src-name').allTextContents()
  check('source labels are real names', names.length > 0
    && !names.some((n) => /Manual$/i.test(n.trim())), JSON.stringify(names))
  const copy = await page.locator('.lede').innerText()
  check('hero copy is source-agnostic', !/the org manual/i.test(copy) && /anywhere/.test(copy),
    copy.slice(0, 70))

  await page.screenshot({ path: `${OUT}/01-home-dark.png`, fullPage: false })

  // ---------- graph mode: the canvas is the risky surface ----------
  await page.goto(`${BASE}?mode=graph`, NAV)
  await page.waitForSelector('.roam-wrap canvas', { timeout: 120000 })
  // The engine publishes its live node count on the shadow host; visibility
  // alone would pass for a clipped 0-pixel canvas.
  const graph = await page.evaluate(() => {
    const host = document.querySelector('.roam-wrap')
    const view = host?.firstElementChild
    const canvas = host?.querySelector('canvas')
    const r = canvas.getBoundingClientRect()
    return { dataNodes: view?.dataset?.nodes ?? null, w: r.width, h: r.height }
  })
  check('graph canvas is sized and fed', graph.w > 200 && graph.h > 200
    && Number(graph.dataNodes) > 50, JSON.stringify(graph))
  // The parked state is phone-only: a desktop canvas must never carry the
  // attribute the settle-pause publishes (a stale one survives mode switches).
  const desktopPaused = await page.evaluate(() => document.querySelector('.roam-wrap')?.dataset?.paused ?? null)
  check('desktop canvas never parks', desktopPaused === null, `data-paused=${desktopPaused}`)

  const sampleInk = () => page.evaluate(() => {
    const c = document.querySelector('.roam-wrap canvas')
    // force-graph paints on a 2D canvas: sample the bitmap directly.
    const off = document.createElement('canvas')
    off.width = c.width
    off.height = c.height
    off.getContext('2d').drawImage(c, 0, 0)
    const d = off.getContext('2d').getImageData(0, 0, off.width, off.height).data
    const hues = new Set()
    let litPx = 0
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 8) {
        litPx++
        if (d[i] + d[i + 1] + d[i + 2] > 120) hues.add(`${d[i] >> 4},${d[i + 1] >> 4},${d[i + 2] >> 4}`)
      }
    }
    return { litPx, distinctHues: hues.size, total: d.length / 4 }
  })
  // Poll, do not sample once: `.roam-wrap canvas` exists as soon as the engine
  // chunk resolves, while the first neurons only reach the bitmap after the
  // warmup ticks — so a single read of a cold canvas is a blank canvas, on a
  // busy machine, for reasons that have nothing to do with the product.
  let lit = { litPx: 0, total: 0, distinctHues: 0 }
  const inkDeadline = Date.now() + PAINT
  while (lit.litPx <= 2000 && Date.now() < inkDeadline) {
    lit = await sampleInk()
    if (lit.litPx <= 2000) await page.waitForTimeout(500)
  }
  check('canvas has painted neurons', lit.litPx > 2000,
    `${lit.litPx} of ${lit.total} px, ${lit.distinctHues} hue buckets`)
  await page.screenshot({ path: `${OUT}/02-graph-dark.png` })

  // Graph chrome: the filter module must be present and legible over the
  // canvas, otherwise the mode is unfilterable on a 1500-node corpus.
  const chrome = await page.evaluate(() => {
    const c = document.querySelector('.controls')
    const chip = document.querySelector('.tag-chip.src')
    return {
      filters: document.querySelectorAll('.tag-chip').length,
      notched: c ? getComputedStyle(c).clipPath !== 'none' : false,
      srcChip: chip ? getComputedStyle(chip).getPropertyValue('--dn-src').trim() : null
    }
  })
  check('graph filter module is notched and populated',
    chrome.filters > 0 && chrome.notched, JSON.stringify(chrome))

  // ---------- light theme ----------
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light' })
  await page.waitForTimeout(700) // GraphView polls its tokens every 500 ms
  const light = await page.evaluate(() => {
    const css = getComputedStyle(document.documentElement)
    const g = (n) => css.getPropertyValue(n).trim()
    return { accent: g('--dn-accent'), bg: g('--dn-bg'), palette: g('--dn-graph-palette') }
  })
  // The light arm's ink values are authored in the theme (docneural-ui.css,
  // paper block: accent #0b3fbf on #fbfbfd) — same pin-the-token rule as the
  // dark check above.
  check('light theme swaps to ink hues',
    light.accent.toLowerCase() === '#0b3fbf' && light.bg.toLowerCase() === '#fbfbfd'
    && !/00e5ff/.test(light.palette), JSON.stringify(light))
  await page.screenshot({ path: `${OUT}/03-graph-light.png` })

  // ---------- reader + command palette, dark, desktop ----------
  // One reader pass PER CORPUS. The whole point of the redesign is that a
  // manual keeps its own hue everywhere, so checking one page proves nothing
  // about the other two — a stale `--dn-src` on the second channel is exactly
  // the bug this loop would catch.
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
  const fragCounts = []
  for (let i = 0; i < Math.min(3, tagsSeen.length); i++) {
    const tag = tagsSeen[i]
    const node = graphJson.nodes.find((x) => !x.stub && x.tags?.[0] === tag) ??
      graphJson.nodes.find((x) => x.tags?.[0] === tag)
    const before = reqs.length
    await page.goto(`${BASE}?doc=${encodeURIComponent(node.slug)}`, NAV)
    await page.waitForSelector('.reader .dn-org', { timeout: 90000 })
    // A beat for the prefetch: next/prev fragments are fetched from an $effect
    // that runs after the article paints, so they are in the log a moment later.
    await page.waitForTimeout(1500)
    fragCounts.push(reqs.slice(before).filter((u) => /\/docs\/.+\.html/.test(u)).length)
    const reader = await page.evaluate(() => {
      const h2 = document.querySelector('.dn-org h2')
      const hv = (sel) => {
        const el = document.querySelector(sel)
        return el ? getComputedStyle(el).getPropertyValue('--dn-src').trim() : null
      }
      return {
        chip: hv('.src-chip'), chipText: document.querySelector('.src-chip')?.textContent?.trim(),
        raw: document.querySelector('.crumbs .raw')?.textContent?.trim(),
        rail: hv('.rail'), nav: hv('.chapters'),
        h2Before: h2 ? getComputedStyle(h2, '::before').content : null,
        headingFont: h2 ? getComputedStyle(h2).fontFamily : null,
        proseFont: getComputedStyle(document.querySelector('.dn-org p') || h2).fontFamily
      }
    })
    // Expect the same hue Home's card wore: one tag, one colour, any surface.
    const expect = hueRows[i]?.canvas?.toLowerCase()
    check(`reader (${tag}): breadcrumb + rail wear the source hue`,
      !!reader.chip && !!reader.rail &&
        reader.chip.toLowerCase() === expect && reader.rail.toLowerCase() === expect,
      `${reader.chip} rail=${reader.rail} want=${expect} / ${reader.chipText}`)
    check(`reader (${tag}): headings are mono with a sigil`,
      /"\/\/ "/.test(reader.h2Before || '') && /JetBrains Mono/.test(reader.headingFont || ''),
      `${reader.h2Before} ${reader.headingFont}`)
    check(`reader (${tag}): breadcrumb is a path and the raw link says what it opens`,
      reader.chipText === `~/${tag}` && reader.raw === 'raw org',
      `${reader.chipText} | ${reader.raw}`)
    if (i === 0) {
      check('prose stays a quiet sans', /Inter/.test(reader.proseFont || ''), reader.proseFont)
      await page.screenshot({ path: `${OUT}/04-reader-dark.png` })
    }
  }
  // Instant navigation is the stated requirement: opening a chapter must not
  // cost a round trip, so the two neighbours are fetched while you read.
  if (corpusComplete) {
    check('reader prefetches its neighbouring chapters',
      fragCounts.every((c) => c >= 2) && fragCounts.length > 0,
      `${fragCounts} fragments fetched per open (1 = only the page itself)`)
  } else {
    hold('reader prefetches its neighbouring chapters', `corpus gate: ${corpusNote}`)
  }

  // The rail's prose used to be 69% of graph.json; it is now one small file per
  // node, fetched only for the page you are on. Prove both halves: the sentence
  // appears, and it reads as plain text rather than Org link residue.
  const inCount = new Map()
  for (const l of graphJson.links) inCount.set(l.target, (inCount.get(l.target) ?? 0) + 1)
  const hot = graphJson.nodes
    .filter((n) => !n.stub && inCount.get(n.id))
    .sort((a, b) => inCount.get(b.id) - inCount.get(a.id))
  let ctxNode = null, ctxKeys = 0
  for (const n of hot.slice(0, 12)) {
    try {
      const res = await fetch(`${BASE}ctx/${n.id}.json`)
      if (!res.ok) continue
      const map = await res.json()
      if (Object.keys(map).length > 0) { ctxNode = n; ctxKeys = Object.keys(map).length; break }
    } catch {
      // A fixture gap (partial corpus): a probe that lands on the SPA's
      // index.html instead of JSON is a MISS, not a crash.
      continue
    }
  }
  if (corpusComplete) {
    if (ctxNode) {
      const before = reqs.length
      await page.goto(`${BASE}?doc=${encodeURIComponent(ctxNode.slug)}`, NAV)
      await page.waitForSelector('.rail .ctx', { timeout: 60000 })
      const ctx = await page.evaluate(() => ({
        shown: document.querySelectorAll('.rail .ctx').length,
        text: [...document.querySelectorAll('.rail .ctx')].map((e) => e.textContent).join(' ')
      }))
      check(`rail prose loads lazily from ctx/${ctxNode.id.slice(0, 18)}.json`,
        ctx.shown > 0 && reqs.slice(before).some((u) => /\/ctx\//.test(u)) &&
          !/\[\[|<<|id:[0-9a-f]{8}/i.test(ctx.text) && /[a-z]{4}/.test(ctx.text),
        `${ctx.shown} lines from ${ctxKeys} keys: ${ctx.text.replace(/\s+/g, ' ').slice(0, 60)}`)
    } else {
      check('rail prose loads lazily from a per-node ctx file', false, 'no non-empty ctx file found')
    }
  } else {
    hold('rail prose loads lazily from a per-node ctx file', `corpus gate: ${corpusNote}`)
  }

  await page.keyboard.press('Control+k')
  await page.waitForSelector('.palette .promptline input', { timeout: 60000 })
  await page.keyboard.type('minor')
  await page.waitForTimeout(800)
  const pal = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.palette .row')]
    return {
      count: rows.length,
      hints: rows.slice(0, 4).map((r) => r.querySelector('.hint')?.textContent?.trim()),
      titlebar: document.querySelector('.palette .titlebar')?.textContent?.trim().slice(0, 60),
      gt: document.querySelector('.palette .gt')?.textContent?.trim()
    }
  })
  check('palette filters and labels each hit with its source',
    pal.count > 0 && pal.hints.every((h) => /^\[.+\]$/.test(h || '')), JSON.stringify(pal))
  // The palette grew into the JUMP console: the titlebar states what it
  // searches ("jump N sources · M chapters"), the ⌕ glyph rides the prompt.
  // The old tty shell fiction is retired (see the no-fake-terminal check).
  check('palette reads as the jump console',
    /jump/.test(pal.titlebar || '') && /chapter/.test(pal.titlebar || '') && pal.gt === '⌕',
    JSON.stringify(pal))
  await page.screenshot({ path: `${OUT}/05-palette.png` })
  await page.keyboard.press('Escape')

  // ---------- reading tools ----------
  // The features a reader actually uses are the ones a screenshot cannot
  // prove: keys that move you, copies that reach the clipboard, a resume line
  // that survives a reload. Each is driven like a user and asserted on the
  // browser's own state (scrollTop, clipboard, localStorage).
  // The reading-tools page must be a chapter the corpus actually WIRES: the
  // hover-peek checks fire on a cross-reference, and on the full corpus the
  // scan-first org node (A Beamer example) carries no wired prose link at
  // all — the honest answer there is the no-wired-link branch, which fails
  // the gate for a fact about the PAGE CHOICE, not the product (2026-11-04
  // run). So read the best-connected non-index org chapter: outbound wires
  // to hover, enough body to scroll, real headings to copy and mark.
  const outDeg = new Map()
  for (const l of graphJson.links) outDeg.set(l.source, (outDeg.get(l.source) ?? 0) + 1)
  const readDoc = graphJson.nodes
    .filter((x) => !x.stub && x.tags?.[0] === 'org' && !/index/i.test(x.id))
    .sort((a, b) => (outDeg.get(b.id) ?? 0) - (outDeg.get(a.id) ?? 0))[0] ??
    graphJson.nodes.find((x) => !x.stub)
  await page.goto(`${BASE}?doc=${encodeURIComponent(readDoc.slug)}`, NAV)
  await page.waitForSelector('.reader .dn-org h2[id]', { timeout: 90000 })

  // The rail groups: an index chapter that cites you 600 times is ONE counted
  // row, not 600 rows. Asserted on a real page because the failure mode is
  // invisible in code and obvious on screen — a wall of the same title.
  // Scoped to the afferent SECTION: `.rail li .link-btn` also matches the
  // table of contents above it, whose repeated headings are not wires at all.
  //
  // The page must BE a hub: on the full corpus the first org chapter's
  // afferent section is two wires from two distinct sources — no multiplicity
  // to group, and the check would fail on a fact about the data, not the
  // product (2026-11-04 gate run). So pick the citation pair with the most
  // repeats whose page stays small enough for the rail to show whole
  // (≤ 8 distinct sources), and read THAT page: grouping is then provable
  // exactly — one row per source, ×N on the repeated one, zero raw dupes.
  const hubPair = (() => {
    const pairs = new Map()
    const srcs = new Map()
    for (const l of graphJson.links) {
      const k = `${l.source}\u0000${l.target}`
      pairs.set(k, (pairs.get(k) ?? 0) + 1)
    }
    for (const l of graphJson.links) {
      srcs.set(l.target, (srcs.get(l.target) ?? new Set()).add(l.source))
    }
    let best = null, bestN = 0
    for (const [k, n] of pairs) {
      const tgt = k.split('\u0000')[1]
      const fan = srcs.get(tgt)?.size ?? 99
      if (n > bestN && fan <= 8) { bestN = n; best = k }
    }
    if (!best) return null
    const [src, tgt] = best.split('\u0000')
    return { src, tgt, n: bestN, fan: srcs.get(tgt)?.size ?? 0 }
  })()
  const hubSlug = hubPair
    ? graphJson.nodes.find((n) => n.id === hubPair.tgt)?.slug : null
  if (corpusComplete && hubSlug) {
    await page.goto(`${BASE}?doc=${encodeURIComponent(hubSlug)}`, NAV)
    await page.waitForSelector('.reader .dn-org h2[id]', { timeout: 90000 })
  }
  const rail = await page.evaluate(() => {
    const sec = [...document.querySelectorAll('.rail section')].find((s) =>
      /afferent/.test(s.querySelector('h3')?.textContent ?? ''))
    if (!sec) return null
    const rows = [...sec.querySelectorAll('li .link-btn')]
    const titles = rows.map((b) => b.textContent.replace(/×\d+/, '').trim())
    return {
      rows: rows.length,
      dupes: titles.length - new Set(titles).size,
      multi: rows.filter((b) => /×\d+/.test(b.textContent)).length,
      head: sec.querySelector('h3')?.textContent?.replace(/\s+/g, ' ').trim(),
    }
  })
  if (corpusComplete) {
    check('the rail groups a hub into one counted row',
      !!rail && !!hubPair && rail.rows === hubPair.fan && rail.dupes === 0 && rail.multi >= 1,
      rail ? `${rail.rows} rows (fan ${hubPair?.fan ?? '?'}, ×${hubPair?.n ?? 0} hub), ${rail.multi} counted, ${rail.dupes} duplicates · "${rail.head}"`
           : 'no afferent section found in the rail')
  } else {
    hold('the rail groups a hub into one counted row', `corpus gate: ${corpusNote}`)
  }
  await page.screenshot({ path: `${OUT}/11-rail-grouped.png` })
  // Back to the reading-tools page: every check below asserts against
  // readDoc's own URL, clipboard and marks — the hub detour must not
  // redefine what "where you are" means.
  if (corpusComplete && hubSlug) {
    await page.goto(`${BASE}?doc=${encodeURIComponent(readDoc.slug)}`, NAV)
    await page.waitForSelector('.reader .dn-org h2[id]', { timeout: 90000 })
  }

  // `/` is the ASSISTANT key since SPEC 4 made the ask panel first-class
  // (the keymap says so; the palette keeps ⌘K). Assert the ask dish opens —
  // waited, not sampled: the dish flies in on a transition, so a fixed 400 ms
  // peek can miss it and leave the panel open over every later step.
  await page.keyboard.press('/')
  let slashOpen = 0
  try {
    await page.waitForSelector('.ask-backdrop .ask', { timeout: 5000 })
    slashOpen = 1
  } catch { /* stayed shut */ }
  await page.keyboard.press('Escape')
  await page.waitForSelector('.ask-backdrop .ask', { state: 'detached', timeout: 5000 })
    .catch(() => {})
  check('`/` opens the ask-the-corpus dish', slashOpen === 1, `${slashOpen} ask dishes open`)

  const top0 = await page.evaluate(() => document.querySelector('.doc-main').scrollTop)
  const bar0 = await page.evaluate(() => getComputedStyle(document.querySelector('.prog')).transform)
  await page.keyboard.press('j')
  await page.waitForTimeout(1200)
  const afterJ = await page.evaluate(() => ({
    top: document.querySelector('.doc-main').scrollTop,
    bar: getComputedStyle(document.querySelector('.prog')).transform
  }))
  check('`j` scrolls the chapter', afterJ.top > top0 + 40, `${top0} -> ${afterJ.top}`)
  check('progress hairline fills as you read',
    afterJ.bar !== bar0 && !/^none$|matrix\(0, /.test(afterJ.bar), `${bar0} -> ${afterJ.bar}`)

  await page.keyboard.press('y')
  await page.waitForSelector('.reader .note', { timeout: 20000 })
  const noteY = (await page.locator('.reader .note').innerText()).replace(/\s+/g, ' ').trim()
  const clipY = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''))
  check('`y` copies a link to where you are reading',
    /copied/.test(noteY) && clipY.includes(`doc=${readDoc.slug}`), `${noteY} | ${clipY}`)

  const headId = await page.evaluate(() => {
    const hs = [...document.querySelectorAll('.dn-org h2[id], .dn-org h3[id]')]
    return (hs.find((h) => h.getBoundingClientRect().top > 4) ?? hs[0])?.id ?? null
  })
  if (headId) {
    await page.locator(`.dn-org [id="${headId}"]`).click()
    await page.waitForTimeout(300)
    const clipH = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''))
    check('clicking a heading copies a link to that section',
      clipH.endsWith(`#${headId}`) || clipH.endsWith(`#${encodeURIComponent(headId)}`),
      `${headId} -> ${clipH}`)
  } else {
    check('clicking a heading copies a link to that section', false, 'no heading with an id found')
  }

  // `v` — distraction-free. Assert the panels are actually gone from the
  // layout (grid collapses to one column) and come back on Escape, because a
  // hidden-but-present panel still costs the reader their measure.
  const cols0 = await page.evaluate(() => getComputedStyle(document.querySelector('.reader')).gridTemplateColumns)
  await page.keyboard.press('v')
  await page.waitForTimeout(400)
  const zen = await page.evaluate(() => ({
    cols: getComputedStyle(document.querySelector('.reader')).gridTemplateColumns,
    side: document.querySelectorAll('.reader .side').length,
    rail: document.querySelectorAll('.reader .rail').length,
  }))
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  const unzen = await page.evaluate(() => ({
    cols: getComputedStyle(document.querySelector('.reader')).gridTemplateColumns,
    side: document.querySelectorAll('.reader .side').length,
  }))
  check('`v` hides the panels, esc brings them back',
    zen.side === 0 && zen.rail === 0 && zen.cols.split(' ').length < cols0.split(' ').length &&
      unzen.side === 1 && unzen.cols === cols0,
    `${cols0.split(' ').length} cols -> ${zen.cols.split(' ').length} (side ${zen.side}, rail ${zen.rail}) -> ${unzen.cols.split(' ').length}`)

  // `b` — mark this section, then find it on the front door. This is the
  // round trip a reader actually cares about: mark while reading, meet it
  // again when they come back.
  await page.keyboard.press('b')
  await page.waitForTimeout(300)
  const noteB = (await page.locator('.reader .note').innerText()).replace(/\s+/g, ' ').trim()
  await page.locator('.shell .brand').click()
  await page.waitForSelector('.home .mk', { timeout: 30000 })
  const mkTxt = (await page.locator('.home .mk').first().innerText()).replace(/\s+/g, ' ').trim()
  await page.locator('.home .mk').first().click()
  await page.waitForSelector('.reader .dn-org', { timeout: 90000 })
  const back = await page.evaluate(() => ({
    slug: new URLSearchParams(location.search).get('doc'),
    mark: document.querySelector('.acts .cpy.on')?.textContent?.trim() ?? '',
  }))
  check('`b` marks the section and the front door keeps it',
    /marked/.test(noteB) && mkTxt.length > 3 && back.slug === readDoc.slug && /marked/i.test(back.mark),
    `${noteB} | card "${mkTxt}" -> ${back.slug} | ${back.mark}`)
  await page.keyboard.press('b')
  await page.waitForTimeout(300)
  check('`b` again unmarks it (a toggle, not a pile)',
    /unmarked/.test((await page.locator('.reader .note').innerText()).replace(/\s+/g, ' ')),
    await page.locator('.reader .note').innerText())

  // Hover peek: the citation card must answer a cross-reference in place.
  // Three things are asserted, each easy to get wrong: it must NOT fire
  // instantly (a card that pops on the way past a paragraph is noise), it must
  // fire on a link that is actually a wire, and its body must be the sentence
  // the citation was MADE in — the data in ctx/<id>.json, which no other docs
  // site has because no other docs site has a citation graph.
  //
  // The candidate comes from graph.json, not from "first link in the prose": a
  // decent share of prose references are not wired at all (an index entry the
  // manual never cites), and on those the card's honest answer is "no
  // citation quote stored" — testing one would fail the gate for a fact about
  // the corpus, not a bug.
  //
  // Timing is measured from a dispatched pointerover rather than page.hover(),
  // because hover() waits for the element to be stable and that wait alone can
  // outlast the card's 300 ms intent delay.
  const corpus = JSON.parse(readFileSync('.export/graph.json', 'utf8'))
  const hereSlug = await page.evaluate(() => new URLSearchParams(location.search).get('doc'))
  const hereNode = corpus.nodes.find((n) => n.slug === hereSlug)
  const wireTargets = new Set(
    corpus.links.filter((l) => l.source === hereNode?.id).map((l) => l.target)
  )
  const proseHrefs = await page.evaluate(() =>
    [...document.querySelectorAll('.dn-org a[href*="docs/"]')].map((a) => a.getAttribute('href'))
  )
  const peekHref = proseHrefs.find((h) => {
    const s = h?.split('/').pop()?.replace('.html', '').split('#')[0]
    const t = corpus.nodes.find((n) => n.slug === s)
    return t && wireTargets.has(t.id)
  })
  if (peekHref) {
    const sel = `.dn-org a[href="${peekHref}"]`
    // bubbles must be asked for: a synthetic PointerEvent defaults to
    // non-bubbling, and the reader listens on the article (one delegated
    // handler for 1,559 possible links), so a non-bubbling probe would test
    // nothing about the product.
    await page.dispatchEvent(sel, 'pointerover', { pointerType: 'mouse', bubbles: true })
    await page.waitForTimeout(120)
    const early = await page.locator('.peek').count()
    // Poll for the card instead of sleeping a fixed 600 ms: the intent delay is
    // 300 ms, but on a loaded box a setTimeout can land later than that, and a
    // hard deadline would then fail the gate for a fact about the machine, not
    // the product. The two facts we actually assert survive either way — the
    // card is NOT there at 120 ms (so it is not instant), and it DOES appear.
    const card = await page.waitForFunction(() => {
      const el = document.querySelector('.peek')
      if (!el) return null
      return {
        src: el.querySelector('.pk-src')?.textContent?.trim(),
        title: el.querySelector('.pk-title')?.textContent?.trim(),
        why: el.querySelector('.pk-why')?.textContent?.trim(),
        meta: el.querySelector('.pk-meta')?.textContent?.replace(/\s+/g, ' ').trim(),
        pe: getComputedStyle(el).pointerEvents,
      }
    }, null, { timeout: 3000 }).then((h) => h.jsonValue()).catch(() => null)
    // If no card ever lands, say why in the failure: which href was probed,
    // whether the reader is mid-zen (which hides the rail, not the prose), and
    // where the link sits. Without this the line reads as a product bug and the
    // first guess is wrong.
    const diag = card ? '' : await page.evaluate((h) => {
      const a = document.querySelector(`.dn-org a[href="${h}"]`)
      const r = a?.getBoundingClientRect()
      return ` | href="${h}" link=${a ? `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}` : 'MISSING'}` +
        ` zen=${!!document.querySelector('.reader.zen')} articles=${document.querySelectorAll('.dn-org').length}`
    }, peekHref)
    await page.screenshot({ path: `${OUT}/09-hover-peek.png` })
    await page.evaluate(() => document.querySelector('.doc-main').scrollBy({ top: 60 }))
    await page.waitForTimeout(300)
    const afterScroll = await page.locator('.peek').count()
    if (corpusComplete) {
      check('hover-intent: no card at 120 ms, card once intent lands',
        early === 0 && !!card && !!card.title && card.pe === 'none' && afterScroll === 0,
        `${early} early → "${card?.src} / ${card?.title}" ${card?.meta} | closed on scroll: ${afterScroll === 0}`)
      check('the card quotes the sentence the citation was made in',
        !!card && !!card.why && !/no citation quote/.test(card.why) && card.why.length > 30,
        `${card?.why?.slice(0, 96) ?? 'none'}…`)
    } else {
      hold('hover-intent: no card at 120 ms, card once intent lands', `corpus gate: ${corpusNote}`)
      hold('the card quotes the sentence the citation was made in', `corpus gate: ${corpusNote}`)
    }
  } else {
    check('hover-intent: no card at 120 ms, card at 720 ms', false, `no wired link in ${hereSlug}'s prose`)
    check('the card quotes the sentence the citation was made in', false, `no wired link in ${hereSlug}'s prose`)
  }

  // Ego scope: opening ⌁ synapses from a chapter must show THAT chapter's
  // neighbourhood, not the 789-node hairball, and the chip must expand and
  // collapse it. This is the difference between a graph that answers a
  // question and a graph that decorates one.
  await page.keyboard.press('g')
  await page.keyboard.press('s')
  await page.waitForSelector('.scope', { timeout: 60000 })
  const egoCount = () => page.evaluate(() =>
    Number(document.querySelector('.roam-wrap')?.firstElementChild?.dataset?.nodes ?? -1))
  const chip0 = (await page.locator('.scope').innerText()).replace(/\s+/g, ' ').trim()
  const egoNodes = await egoCount()
  await page.locator('.scope').click()
  await page.waitForTimeout(2500)
  const chip1 = (await page.locator('.scope').innerText()).replace(/\s+/g, ' ').trim()
  const allNodes = await egoCount()
  await page.locator('.scope').click()
  await page.waitForTimeout(2500)
  const backNodes = await egoCount()
  await page.screenshot({ path: `${OUT}/10-ego-graph.png` })
  check('synapses open around the chapter you were reading, not the hairball',
    /around/.test(chip0) && egoNodes > 20 && egoNodes < 400,
    `${chip0} · canvas fed ${egoNodes}`)
  check('the scope chip expands to the corpus and back',
    /whole corpus/.test(chip1) && allNodes > 500 && backNodes === egoNodes,
    `${egoNodes} → ${allNodes} (${chip1}) → ${backNodes}`)

  // Layout: the other question a visitor asks a graph is "what is IN it", and
  // per-doc citation knots cannot answer that — the titles are ink. The chip
  // must switch the physics, keep the same nodes (a relayout, not a reseed),
  // and survive a reload, because it is a preference about reading, not about
  // a page. `data-layout` is the DOM hook for that, the same kind of test hook
  // GraphView already publishes as `data-nodes`.
  const layout = () => page.evaluate(() => ({
    hook: document.querySelector('.roam-wrap')?.dataset?.layout,
    fit: document.querySelector('.roam-wrap')?.dataset?.fit,
    stored: localStorage.getItem('docneural:layout'),
    chip: (document.querySelector('.layout')?.innerText ?? '').replace(/\s+/g, ' ').trim(),
    // The chip is a cycle button: its accessible name is the NEXT state
    // ("switch to spread …" while cluster is active, and so on), so the aria
    // label is the state evidence the old aria-pressed attribute used to be.
    aria: (document.querySelector('.layout')?.getAttribute('aria-label') ?? ''),
    nodes: Number(document.querySelector('.roam-wrap')?.firstElementChild?.dataset?.nodes ?? -1)
  }))
  // The first-visit default is size-aware (loadLayout: >300 nodes boot the
  // fixed-distance lattice, smaller scopes boot the packed clusters) and a
  // saved preference always wins — so the gate may not assume WHICH reading
  // boots. The chip cycles cluster → spread → lattice → cluster; walk it
  // until spread is on screen, judging the relayout evidence on every leg
  // travelled, so a chip that skips or double-fires a state fails here too.
  const NEXT = { cluster: 'spread', spread: 'lattice', lattice: 'cluster' }
  const ARIA_FOR = { cluster: /switch to spread/, spread: /switch to lattice/, lattice: /switch to clusters/ }
  const clickLeg = async () => {
    await page.locator('.layout').click()
    await page.waitForTimeout(4000) // reheat + relayout + the fit that follows it
    return layout()
  }
  const leg0 = await layout()
  let leg = leg0
  let legs = 0
  while (leg.hook !== 'spread' && legs < 2) {
    const from = leg.hook
    leg = await clickLeg()
    legs += 1
    check(`the layout chip steps ${from} → ${NEXT[from]} (leg ${legs})`,
      leg.hook === NEXT[from] && leg.stored === NEXT[from] &&
        ARIA_FOR[leg.hook].test(leg.aria) && leg.nodes === leg0.nodes,
      `${legs} click(s): ${leg.chip} · stored "${leg.stored}" · aria "${leg.aria.slice(0, 24)}" · ${leg.nodes} nodes`)
  }
  const lay1 = leg
  await page.screenshot({ path: `${OUT}/11-titles-spread.png` })
  check('the titles chip switches the canvas to the spread layout',
    lay1.hook === 'spread' && lay1.stored === 'spread' &&
      /spread/.test(lay1.chip) && /switch to lattice/.test(lay1.aria) &&
      lay1.nodes === leg0.nodes,
    `${legs} click(s) from boot ${leg0.hook}: ${lay1.chip} · ${lay1.nodes} nodes, stored "${lay1.stored}"`)
  // The camera is half the feature. Titles paint at 11/globalScale — a constant
  // size on screen — so a fit that ZOOMS IN past 1:1 draws somas bigger than
  // their own names, which is the abstract-looking-as-a-diagram failure. The
  // spread view is authored at 1:1 (that is where the collide radii, sized from
  // the label widths, mean what they say), so the fit must never exceed it.
  check('the spread view frames itself at most 1:1, never blown up',
    lay1.fit !== undefined && Number(lay1.fit) > 0 && Number(lay1.fit) <= 1,
    `data-fit "${lay1.fit}" for ${lay1.nodes} nodes`)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.reader .dn-org', { timeout: 90000 })
  await page.keyboard.press('g')
  await page.keyboard.press('s')
  await page.waitForSelector('.layout.spread', { timeout: 60000 })
  const lay2 = await layout()
  check('a spread request survives the visit: reload keeps the layout',
    lay2.hook === 'spread' && /spread/.test(lay2.chip),
    `${lay2.chip} · hook "${lay2.hook}"`)
  await page.screenshot({ path: `${OUT}/12-titles-spread-reload.png` })
  // Spread's next leg is the lattice (cluster → spread → lattice → cluster),
  // so packing the corpus back into its clusters is TWO legs from here —
  // walk both and judge the landing state.
  let packBack = await layout()
  for (let i = 0; i < 2; i++) {
    packBack = await clickLeg()
  }
  const lay3 = packBack
  check('the chip packs the corpus back into its clusters',
    lay3.hook === 'cluster' && lay3.stored === 'cluster' && /clusters/.test(lay3.chip),
    `${lay3.chip} · stored "${lay3.stored}"`)

  await page.keyboard.press('g')
  await page.keyboard.press('d')
  await page.waitForSelector('.reader .dn-org', { timeout: 90000 })

  await page.locator('.acts .cpy').nth(2).click()
  await page.waitForTimeout(500)
  const clipCtx = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''))
  check('⧉ llm hands an agent the page with its provenance',
    /^# \S/.test(clipCtx) && /Source: docneural/.test(clipCtx) &&
      /Raw Org: \S+\.org/.test(clipCtx) && clipCtx.length > 400,
    `${clipCtx.length} B: ${clipCtx.slice(0, 52).replace(/\n/g, ' ')}`)
  await page.screenshot({ path: `${OUT}/08-reader-tools.png` })

  // Resume: the tty offers `--resume`, it lands back on this page, and the
  // offer survives a reload (that is the whole point of localStorage).
  await page.locator('.shell .brand').click()
  await page.waitForSelector('.home .resume', { timeout: 30000 })
  const resumeTxt = (await page.locator('.home .resume').innerText()).replace(/\s+/g, ' ').trim()
  await page.locator('.home .resume').click()
  await page.waitForSelector('.reader .dn-org', { timeout: 60000 })
  const landed = await page.evaluate(() => new URLSearchParams(location.search).get('doc'))
  check('home offers --resume and it lands back on the same chapter',
    resumeTxt.includes(readDoc.title.slice(0, 10)) && landed === readDoc.slug,
    `${resumeTxt} -> ${landed}`)
  await page.goto(BASE, NAV)
  await page.waitForSelector('.home .wordmark', { timeout: PAINT })
  const afterReload = await page.locator('.home .resume').count()
  check('resume survives a reload', afterReload === 1,
    await page.evaluate(() => localStorage.getItem('docneural:last-read') ?? 'unset'))

  // ---------- the TOC is a chapter tree, not an alphabetical shelf ----------
  // Owner 2026-11-04 14:04Z: "I can't still see TOC, and instead seeing
  // stupid alphabetical doc chapters." The defect lived in the EXPORTER:
  // Org and Guix shipped zero up/next (the nav parser's paragraph window
  // closed on the pandoc conversion's broken headers), so manualToc's
  // no-structure fallback rendered a flat list in corpus order — which for
  // a globbed corpus is the alphabet. No gate check covered the TOC, which
  // is how it shipped. Four facts prove the tree on the default manual
  // (org): branch rows exist; the no-structure note is GONE; the top level
  // holds chapters, not all 319 pages; and the chapter order is the book's
  // — Introduction leads and the list is not alphabetically sorted.
  const toc = await page.evaluate(() => {
    const nav = document.querySelector('nav.toc')
    if (!nav) return null
    const branches = [...nav.querySelectorAll('.toc-branch')]
    const at = (d) => branches.filter((b) => b.dataset.depth === String(d))
    const titles = (rows) => rows.map((b) =>
      b.querySelector('.toc-link')?.textContent?.replace(/\s+/g, ' ').trim() ?? '')
    // The Info shape: ONE depth-0 root row (the manual's Top), the manual's
    // chapters at depth 1 in BOOK order beneath it. The chapters are what
    // the Owner reads — assert on them, not on the root.
    const chapters = titles(at(1))
    const maxKids = at(1).length
      ? Math.max(...at(1).map((b) => Number(b.querySelector('.toc-count')?.textContent ?? 0)))
      : 0
    return {
      rows: nav.querySelectorAll('.toc-row').length,
      branches: branches.length,
      roots: at(0).length,
      chapters,
      maxKids,
      flatNote: !!document.querySelector('.toc-flat'),
    }
  })
  check('the TOC is a chapter tree (Owner 14:04Z: no more alphabetical chapters)',
    !!toc && toc.branches >= 5 && !toc.flatNote && toc.roots === 1 &&
      toc.rows >= 200 && toc.maxKids >= 5 && toc.chapters.length >= 10 &&
      JSON.stringify(toc.chapters) !== JSON.stringify([...toc.chapters].sort()) &&
      /introduction/i.test(toc.chapters[0] ?? ''),
    toc ? `${toc.rows} rows · ${toc.branches} branches · roots ${toc.roots} · chapters ${toc.chapters.length} · maxKids ${toc.maxKids} · flatNote ${toc.flatNote} · first chapters: "${toc.chapters.slice(0, 3).join(' | ')}"`
        : 'no nav.toc on home')

  await ctx.close()

  // ---------- phone ----------
  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    deviceScaleFactor: 2
  })
  const mp = await mctx.newPage()
  watch(mp, 'phone', problems)
  await mp.goto(BASE, NAV)
  await mp.waitForSelector('.home .wordmark', { timeout: PAINT })
  const mob = await mp.evaluate(() => {
    const wm = document.querySelector('.wordmark')
    const shell = document.querySelector('.shell')
    const segs = [...document.querySelectorAll('.modes .seg')].map((b) => {
      const r = b.getBoundingClientRect()
      return { label: b.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height),
        shown: r.width > 0 && r.height > 0 }
    })
    return {
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      heroFits: wm ? wm.getBoundingClientRect().width <= window.innerWidth : false,
      segs,
      shellH: shell?.getBoundingClientRect().height
    }
  })
  check('phone: no horizontal overflow', !mob.overflow && mob.heroFits, JSON.stringify(mob))
  // The bug this guards: `.modes` used to be display:none under 600px, which
  // silently removed the only way to reach the graph view on a phone.
  check('phone: both view modes are reachable', mob.segs.length === 2
    && mob.segs.every((s) => s.shown), JSON.stringify(mob.segs))
  check('phone: mode targets are thumb-sized (>=44px)',
    mob.segs.every((s) => s.w >= 44 && s.h >= 44), JSON.stringify(mob.segs))
  await mp.screenshot({ path: `${OUT}/06-phone-home.png` })

  // Tap the graph seg: the switch must actually switch, not just look tappable.
  // Mode is STATE, not a URL param: ?mode=graph is a read-once deep link, and
  // setMode never writes it back — the evidence is the seg's aria-pressed and
  // the canvas itself.
  await mp.locator('.modes .seg').nth(1).tap()
  await mp.waitForSelector('.roam-wrap canvas', { timeout: 120000 })
  const tapped = await mp.evaluate(() => ({
    canvas: !!document.querySelector('.roam-wrap canvas'),
    pressed: [...document.querySelectorAll('.modes .seg')].map((b) => b.getAttribute('aria-pressed'))
  }))
  check('phone: tapping SYNAPSES enters the graph', tapped.canvas
    && tapped.pressed[1] === 'true', JSON.stringify(tapped))

  await mp.goto(`${BASE}?mode=graph`, NAV)
  await mp.waitForSelector('.roam-wrap canvas', { timeout: 120000 })
  const mgraph = await mp.evaluate(() => {
    const c = document.querySelector('.roam-wrap canvas')
    const r = c.getBoundingClientRect()
    const ctl = document.querySelector('.controls')
    return { w: r.width, h: r.height, ctlOpen: ctl?.hasAttribute('open') }
  })
  check('phone: canvas still fills the viewport', mgraph.w > 300 && mgraph.h > 300,
    JSON.stringify(mgraph))

  // The phone NODE CAP is retired: capForPhone was replaced by the
  // COCITE_CAP=8 co-cite design (2026-10-25 board ruling) and the phone field
  // now carries the whole visible corpus — labels stay readable by spacing,
  // not by hiding neurons. The ceiling assertion becomes an equality: the
  // phone canvas is fed exactly what the desktop scope fed.
  const mnodes = await mp.evaluate(() => {
    const view = document.querySelector('.roam-wrap')?.firstElementChild
    return Number(view?.dataset?.nodes ?? 0)
  })
  check('phone: graph carries the whole visible corpus (node cap retired)',
    mnodes > 0 && mnodes === allNodes, `${mnodes} nodes (desktop scope fed ${allNodes})`)

  // The park machinery (data-paused) is retired with it: the phone ships the
  // 0-LOOP LOCK instead — the render loop never starts until the visitor
  // unlocks (aria-pressed on the lock button), pan/zoom input still paints
  // through the transient poke. Assert the lock default and the controls.
  const mlock = await mp.evaluate(() => {
    const btn = [...document.querySelectorAll('.nc-btn')]
      .find((b) => /lock network positions/i.test(b.getAttribute('aria-label') ?? ''))
    return { pressed: btn?.getAttribute('aria-pressed'), present: !!btn }
  })
  check('phone: ships the 0-loop lock (park retired)', mlock.present && mlock.pressed === 'true',
    `lock aria-pressed=${mlock.pressed}`)
  await mp.screenshot({ path: `${OUT}/07-phone-graph.png` })
  await mctx.close()

  await browser.close()

  check('no page or console errors', problems.length === 0, problems.slice(0, 6).join(' | '))
  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`)
  console.log(`screenshots in ${OUT}`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('driver crashed:', e)
  process.exit(2)
})
