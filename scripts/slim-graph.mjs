// slim-graph.mjs — post-process .export/graph.json for transport.
//
// WHY THIS EXISTS. The Emacs exporter emits one graph.json holding every
// node, every wire, and the sentence of prose around each wire (`context`).
// On the 2026-10-12 corpus that is 7.13 MB, of which 4.91 MB (69%) is
// context — and exactly one component (SynapseRail's `.ctx` line) ever
// displays it, for the single page the reader has open. Paying 4.9 MB on
// every first paint, on a phone, to serve a dozen lines of prose is the
// worst trade in the build, so we split it here.
//
// WHAT IT DOES (idempotent; safe to run on an already-slimmed file):
//   1. strips Org link syntax out of every context (rules and rationale in
//      scripts/flatten-context.mjs), so the rail reads as prose instead of
//      source and the payload shrinks ~45%;
//   2. writes ctx/SLUG.json per node = {"<source>><target>": context} for
//      every wire that touches that node (the theme fetches one ~3 kB file
//      when you open a page);
//   3. rewrites graph.json without the context field;
//   4. writes graph.json.gz so a static host can serve it with
//      content-encoding without a runtime compressor (sirv's
//      `compress: true` and nginx `gzip_static on;` both pick it up).
//
// It is a separate step rather than a change to the exporter because
// scripts/org-docs-website-export.el is batch Elisp with its own review
// surface; keeping the transport concern here means the exporter stays
// "emit the whole graph" and this stays "emit it small".
//
//   node scripts/slim-graph.mjs [--out .export] [--no-gzip]
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync, brotliCompressSync, constants } from 'node:zlib'
import { flatten } from './flatten-context.mjs'

const argv = process.argv.slice(2)
const arg = (name, dflt) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? dflt : argv[i + 1]
}
const OUT = arg('out', '.export')
const GZIP = !argv.includes('--no-gzip')

const kb = (n) => (n / 1024).toFixed(0) + ' kB'

const path = join(OUT, 'graph.json')
const raw = readFileSync(path, 'utf8')
const data = JSON.parse(raw)
if (!Array.isArray(data.nodes) || !Array.isArray(data.links)) {
  console.error(`slim-graph: ${path} has no nodes/links — wrong file?`)
  process.exit(1)
}

// One pass: harvest per-node context files, then drop the field.
const ctxDir = join(OUT, 'ctx')
// Guard: the split is destructive (graph.json loses `context`), so a second
// run on an already-slimmed file must not wipe ctx/ and leave nothing to
// rebuild it from. Re-run `make export` to get contexts back.
const hasContext = data.links.some((l) => l.context)
if (!hasContext) {
  const kept = existsSync(ctxDir) ? readdirSync(ctxDir).filter((f) => f.endsWith('.json')).length : 0
  if (kept) {
    console.log(`slim-graph: already slim (${kept} ctx/ files, no context in graph.json) — nothing to do`)
    process.exit(0)
  }
}
mkdirSync(ctxDir, { recursive: true })
// Remove stale per-node files: a deleted chapter would otherwise leave its
// ctx behind forever (the exporter does not clean OUT).
for (const f of readdirSync(ctxDir)) if (f.endsWith('.json')) rmSync(join(ctxDir, f))

const byNode = new Map()
let ctxBytes = 0
for (const l of data.links) {
  const context = flatten(l.context)
  delete l.context
  if (!context) continue
  ctxBytes += context.length
  const key = `${l.source}>${l.target}`
  for (const id of [l.source, l.target]) {
    let m = byNode.get(id)
    if (!m) byNode.set(id, (m = {}))
    m[key] = context
  }
}

// Slug is what the theme has when a doc is open; ids are the same strings in
// this corpus, but write by id and let the theme pass the node id — that keeps
// the filename rule in one place.
let files = 0
for (const [id, m] of byNode) {
  writeFileSync(join(ctxDir, `${id}.json`), JSON.stringify(m))
  files++
}

const slim = JSON.stringify(data)
writeFileSync(path, slim)
const bytes = Buffer.byteLength(slim)
let gz = 0
let br = 0
if (GZIP) {
  const buf = Buffer.from(slim)
  const z = gzipSync(buf, { level: 9 })
  writeFileSync(join(OUT, 'graph.json.gz'), z)
  gz = z.length
  // Brotli only helps when the host serves it; harmless to leave a file behind.
  const b = brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } })
  writeFileSync(join(OUT, 'graph.json.br'), b)
  br = b.length
}

console.log(
  `slim-graph: graph.json ${kb(Buffer.byteLength(raw))} -> ${kb(bytes)} ` +
    `(${kb(ctxBytes)} of context moved into ${files} ctx/ files, ` +
    `avg ${kb(ctxBytes / Math.max(1, files))} each)`
)
if (GZIP) console.log(`          gz ${kb(gz)} · br ${kb(br)} — serve with content-encoding`)
