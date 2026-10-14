#!/usr/bin/env node
// summarize-export.mjs — a one-line tldr per chapter, at BUILD time.
//
// The idea from TODOs.org (Precomputed summaries at export time), decided
// and shipped: run the LLM in BATCH during the build, not in the
// visitor's browser. A tldr on a node costs the reader nothing at
// runtime — it is already in graph.json when the page opens — and it is
// what makes search results, the rail and the homepage grid readable at
// a glance.
//
// Cost control is the whole design:
//   - BYO key: OPENAI-compatible endpoint (env or flags). Nothing ships
//     a key; without one this target simply skips (llms sites are fine
//     without summaries).
//   - CACHE keyed by CONTENT HASH of the chapter's raw .org: unchanged
//     pages are never re-summarised, so an incremental build on a 1,559
//     -node corpus only pays for the pages that changed.
//   - Bounded: --limit N for a trial run, --concurrency 4 default, a
//     hard per-request timeout, and a summary capped at one line.
//
// Usage:
//   node scripts/summarize-export.mjs --out .export
//   OPENAI_KEY=sk-… node scripts/summarize-export.mjs --out .export --limit 20
//
// The tldr lands in each node as `tldr` (and `takeaways`, 3 short
// strings). The theme ignores the fields when absent, so a build without
// this step is still correct.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

const argv = process.argv.slice(2)
const flag = (name, dflt) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt
}
const num = (name, dflt) => {
  const v = Number(flag(name, ''))
  return Number.isFinite(v) && v > 0 ? v : dflt
}
const OUT = flag('out', '.export')
const LIMIT = num('limit', 0) // 0 = all
const CONCURRENCY = num('concurrency', 4)
const BASE = flag('base', process.env.ASK_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '')
const MODEL = flag('model', process.env.ASK_MODEL || 'gpt-4o-mini')
const KEY = flag('key', process.env.ASK_KEY || process.env.OPENAI_KEY || process.env.OPENAI_API_KEY || '')

if (!KEY && !/localhost|127\.0\.0\.1/.test(BASE)) {
  console.log('summarize: no key (ASK_KEY / OPENAI_KEY) and no local endpoint — skipping.')
  console.log('summarize: the site builds fine without tldrs; this is an optional pass.')
  process.exit(0)
}

const graphPath = join(OUT, 'graph.json')
if (!existsSync(graphPath)) {
  console.error(`summarize: no graph.json under ${OUT} — run make export first`)
  process.exit(1)
}
const graph = JSON.parse(readFileSync(graphPath, 'utf8'))

const CACHE_DIR = join(OUT, '.sums')
const CACHE_PATH = join(CACHE_DIR, 'cache.json')
let cache = {}
if (existsSync(CACHE_PATH)) {
  try {
    cache = JSON.parse(readFileSync(CACHE_PATH, 'utf8'))
  } catch {
    cache = {} // a corrupt cache costs money, not correctness: re-summarise
  }
}

const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 16)

/** The body an LLM needs: the chapter's own text, capped. The raw .org
 *  is the lossless artifact the site already publishes, so the prompt
 *  and the reader see the same document. */
function chapterText(node) {
  const p = join(OUT, 'docs', `${node.slug}.org`)
  if (!existsSync(p)) return null
  const raw = readFileSync(p, 'utf8')
  // Drop the :PROPERTIES: drawer and #+ keywords: machine chrome the
  // reader's eyes skip, and tokens the summary does not need.
  return raw
    .replace(/^\s*:PROPERTIES:[\s\S]*?:END:\s*/m, '')
    .replace(/^#\+[a-z_]+:.*$/gm, '')
    .trim()
    .slice(0, 6000)
}

async function summarize(node) {
  const text = chapterText(node)
  if (!text) return null
  const h = hash(text)
  if (cache[node.slug]?.hash === h) return null // unchanged: the cache is the money
  const prompt = [
    'You summarize one chapter of a technical manual for a docs site.',
    `Chapter: ${node.title}`,
    '',
    'Reply with EXACTLY two lines:',
    'TLDR: one sentence, max 140 chars, no period at the end',
    'WHY: three short bullet takeaways separated by "; " (max 160 chars total)',
    '',
    text
  ].join('\n')
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 45_000)
  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      }),
      signal: ctl.signal
    })
    if (!res.ok) throw new Error(`endpoint ${res.status}`)
    const json = await res.json()
    const out = json.choices?.[0]?.message?.content ?? ''
    const tldr = /TLDR:\s*(.+)/i.exec(out)?.[1]?.trim()
    const why = /WHY:\s*(.+)/i.exec(out)?.[1]?.trim()
    if (!tldr) throw new Error('no TLDR line in reply')
    return { hash: h, tldr: tldr.slice(0, 160), takeaways: why ? why.split(';').map((s) => s.trim()).slice(0, 3) : [] }
  } finally {
    clearTimeout(timer)
  }
}

const todo = graph.nodes.filter((n) => !n.stub && !n.tldr).slice(0, LIMIT || undefined)
console.log(`summarize: ${todo.length} chapters to summarise (cached: ${graph.nodes.filter((n) => n.tldr).length})`)
if (!todo.length) {
  console.log('summarize: nothing to do')
  process.exit(0)
}

let done = 0
let skipped = 0
let failed = 0
let idx = 0
async function worker() {
  while (idx < todo.length) {
    const node = todo[idx++]
    try {
      const r = await summarize(node)
      if (r) {
        node.tldr = r.tldr
        if (r.takeaways.length) node.takeaways = r.takeaways
        cache[node.slug] = { hash: r.hash, at: Date.now() }
        done++
        if (done % 10 === 0) console.log(`summarize: ${done + skipped}/${todo.length}`)
      } else {
        skipped++ // unchanged since the last pass: the cache is the money
      }
    } catch (e) {
      failed++
      console.error(`summarize: ${node.slug}: ${e.message}`)
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker))

if (done) {
  mkdirSync(CACHE_DIR, { recursive: true })
  writeFileSync(graphPath, JSON.stringify(graph))
  writeFileSync(CACHE_PATH, JSON.stringify(cache))
}
const toSize = (b) => `${(b.length / 1024).toFixed(0)} kB`
console.log(`summarize: ${done} summarised, ${skipped} cached, ${failed} failed — graph.json ${toSize(readFileSync(graphPath))}`)
if (done) console.log('summarize: run `make slim` to recompress, then `make build`')
