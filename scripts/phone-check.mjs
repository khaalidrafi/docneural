// phone-check.mjs — phone-viewport graph repro (Owner: "I can't see the graph
// from phone"). Zero-dependency CDP driver, forked from browser-check.mjs with
// Emulation.setDeviceMetricsOverride (390x844 @3x, touch) + a probe payload
// that answers: does the canvas exist, is it mounted, what size is it, is it
// VISIBLE, and what does the layout chain look like?
//
// Usage: node scripts/phone-check.mjs <url> [--shot out.png] [--wait ms] [--w 390] [--h 844] [--tablet] [--desktop]
import { spawn } from 'node:child_process'
import { writeFileSync, mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const argv = process.argv.slice(2)
const take = (flag) => {
  const i = argv.indexOf(flag)
  if (i < 0) return undefined
  const v = argv[i + 1]
  argv.splice(i, 2)
  return v
}
const shot = take('--shot')
const evalFile = take('--eval')
const wait = Number(take('--wait') ?? '9000')
const W = Number(take('--w') ?? '390')
const H = Number(take('--h') ?? '844')
const DPR = Number(take('--dpr') ?? '3')
const MOBILE = process.argv.some((a) => a === '--tablet' || a === '--mobile') || !(process.argv.includes('--desktop'))
const url = argv[0]
if (!url) {
  console.error('usage: phone-check.mjs <url> [--shot f.png] [--wait ms] [--w 390] [--h 844] [--desktop]')
  process.exit(2)
}

const PROBE = `(() => {
  const vis = (el) => {
    if (!el) return 'ABSENT'
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return {
      rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
      overflow: cs.overflow
    }
  }
  const canvas = document.querySelector('.roam-wrap canvas')
  const wrap = document.querySelector('.roam-wrap')
  const section = document.querySelector('.synapse-mode')
  const canvasWrap = document.querySelector('.canvas-wrap')
  return {
    url: location.href,
    viewport: [innerWidth, innerHeight, devicePixelRatio],
    section: vis(section),
    canvasWrap: vis(canvasWrap),
    wrap: vis(wrap),
    canvas: vis(canvas),
    canvasAttr: canvas ? [canvas.width, canvas.height] : null,
    headerH: getComputedStyle(document.documentElement).getPropertyValue('--dn-header-h'),
    bodyScrollH: document.body.scrollHeight,
    docScrollH: document.documentElement.scrollHeight,
    skel: !!document.querySelector('.roam-wrap .skel'),
    fitData: wrap ? { fit: wrap.dataset.fit ?? null, field: wrap.dataset.field ?? null } : null
  }
})()`

const PORT = 9400 + (process.pid % 40)
const profile = mkdtempSync(join(tmpdir(), 'docneural-phone-'))
const BIN = process.env.DOCNEURAL_CHROME ?? 'chromium'

const chrome = spawn(
  BIN,
  [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    'about:blank'
  ],
  { stdio: 'ignore' }
)

const die = (msg) => {
  console.error('FAIL:', msg)
  chrome.kill('SIGKILL')
  rmSync(profile, { recursive: true, force: true })
  process.exit(1)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let version = null
for (let i = 0; i < 240 && !version; i++) {
  await sleep(1000)
  try {
    version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()
  } catch {}
}
if (!version) die('chromium remote-debugging never came up')

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
const page = targets.find((t) => t.type === 'page')
if (!page) die('no page target')

const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((res, rej) => {
  ws.onopen = res
  ws.onerror = () => rej(new Error('ws error'))
})

let nextId = 1
const pending = new Map()
const problems = []
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id)
    pending.delete(msg.id)
    msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result)
  } else if (msg.method === 'Runtime.exceptionThrown') {
    problems.push('exception: ' + (msg.params.exceptionDetails.exception?.description ?? '?'))
  } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    problems.push('console: ' + msg.params.args.map((a) => a.value ?? a.description ?? a.type).join(' '))
  }
}
const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const id = nextId++
    pending.set(id, { res, rej })
    ws.send(JSON.stringify({ id, method, params }))
    setTimeout(() => pending.has(id) && (pending.delete(id), rej(new Error(method + ' timeout'))), 240000)
  })

await send('Runtime.enable')
await send('Page.enable')
// Phone emulation BEFORE navigation so the SPA boots with the right metrics.
await send('Emulation.setDeviceMetricsOverride', {
  width: W,
  height: H,
  deviceScaleFactor: DPR,
  mobile: MOBILE
})
await send('Emulation.setTouchEmulationEnabled', { enabled: MOBILE, maxTouchPoints: 5 })
await send('Emulation.setUserAgentOverride', {
  userAgent: MOBILE
    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
})
await send('Page.navigate', { url })
await sleep(wait)

const out = await send('Runtime.evaluate', {
  expression: evalFile ? readFileSync(evalFile, 'utf8') : PROBE,
  awaitPromise: true,
  returnByValue: true
})
if (out.exceptionDetails) problems.push('eval: ' + out.exceptionDetails.text)
if (shot) {
  const img = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(shot, Buffer.from(img.data, 'base64'))
  console.log('screenshot:', shot)
}
console.log('RESULT:', JSON.stringify(out.result?.value ?? null, null, 1))
if (problems.length) {
  console.log('PROBLEMS:')
  for (const p of problems) console.log('  -', p)
}
ws.close()
chrome.kill('SIGKILL')
rmSync(profile, { recursive: true, force: true })
process.exit(problems.length ? 1 : 0)
