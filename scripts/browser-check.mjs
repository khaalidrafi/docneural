// browser-check.mjs — a zero-dependency CDP driver for headless verification.
//
// Why: on this box `chromium --dump-dom` hangs and terminal-browser needs a
// TTY this session does not have, yet the site MUST be exercised as a real
// user would (canvas physics, store wiring, SPA routing). Node 22+ has a
// global WebSocket, so driving Chromium over its DevTools protocol is a
// ~150-line script instead of a puppeteer install.
//
// Usage:
//   node scripts/browser-check.mjs <url> [--shot out.png] [--wait ms] -- <js expression>
// The expression runs via Runtime.evaluate (awaitPromise) after load + wait;
// page exceptions are collected and printed so silent breakage never passes.
import { spawn } from 'node:child_process'
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs'
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
const wait = Number(take('--wait') ?? '6000')
const url = argv[0]
const exprIdx = argv.indexOf('--')
const expr = exprIdx >= 0 ? argv.slice(exprIdx + 1).join(' ') : 'document.title'
if (!url) {
  console.error('usage: browser-check.mjs <url> [--shot f.png] [--wait ms] -- <expr>')
  process.exit(2)
}

const PORT = 9333 + (process.pid % 50) // avoid collisions between parallel runs
const profile = mkdtempSync(join(tmpdir(), 'docneural-chrome-'))

// Which browser to launch: $DOCNEURAL_CHROME wins, else the system chromium.
// (Playwright's downloaded headless shell cannot execute on Guix — it wants
// the FHS /lib64 loader. org-roam-lite-ui's playwright.config made the same
// discovery and does the same fallback; system chromium DOES boot headless
// here, it is merely slow under load — hence the long readiness budget.)
const BIN = process.env.DOCNEURAL_CHROME ?? 'chromium'

const chrome = spawn(
  BIN,
  [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    'about:blank'
  ],
  { stdio: 'ignore' }
)

const die = (msg) => {
  console.error('FAIL:', msg)
  chrome.kill('SIGKILL')
  quietRm(profile)
  process.exit(1)
}
const quietRm = (dir) => {
  // Chromium keeps writing into its profile for a moment after SIGKILL, so a
  // single rmSync can race an ENOTEMPTY and kill the run AFTER the result was
  // already printed. Retry a few times; a leftover /tmp profile is harmless.
  for (let i = 0; i < 5; i++) {
    try {
      rmSync(dir, { recursive: true, force: true })
      return
    } catch {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200)
    }
  }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Wait for the DevTools HTTP endpoint to answer. 240 rounds because on this
// 2-core box Chromium's cold boot has measured 60-70 s at load ~8 (same
// finding as org-roam-lite-ui's playwright.config), not seconds.
let version = null
for (let i = 0; i < 240 && !version; i++) {
  await sleep(1000)
  try {
    version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()
  } catch {
    /* not up yet */
  }
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
const problems = [] // page exceptions + console errors: a green run has none
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
    // 240 s, not 60: the CDP *reply* for even trivial commands queues behind
    // renderer work, and this box's load swings 4..20 with other agent
    // sessions. A hung browser is caught by the overall run, not this cap.
    setTimeout(() => pending.has(id) && (pending.delete(id), rej(new Error(method + ' timeout'))), 240000)
  })

await send('Runtime.enable')
await send('Page.enable')
await send('Page.navigate', { url })
// Let the SPA fetch graph.json, mount components, and the force sim settle.
await sleep(wait)

const out = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
if (out.exceptionDetails) problems.push('eval: ' + out.exceptionDetails.text)
if (shot) {
  const img = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(shot, Buffer.from(img.data, 'base64'))
  console.log('screenshot:', shot)
}
console.log('RESULT:', JSON.stringify(out.result?.value ?? null))
if (problems.length) {
  console.log('PROBLEMS:')
  for (const p of problems) console.log('  -', p)
}
ws.close()
chrome.kill('SIGKILL')
quietRm(profile)
process.exit(problems.length ? 1 : 0)
