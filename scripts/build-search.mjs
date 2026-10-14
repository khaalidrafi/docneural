#!/usr/bin/env node
// build-search.mjs — per-corpus heading index from the exported HTML.
//
// WHY: the palette used to match page TITLES only. A manual has ~30k
// headings and one "Introduction"; what a reader actually types is the
// section name ("agenda views", "export settings"). The anchors already
// exist in the exported fragments (ox-html gives every CUSTOM_ID and
// <<target>> heading an id), so the index is a crawl over docs/*.html
// we already produce — no exporter change, no new payload in graph.json.
//
// OUT: one lazy file per manual, `search/<manual>.json`:
//   [{"s": SLUG, "t": NODE_TITLE, "h": HEADING_TEXT, "a": ANCHOR}, ...]
// ~60 B per heading, so a 30k-heading manual is ~1.8 MB fetched only
// when its manual is active — the same lazy contract ctx/ uses.
//
// Usage: node scripts/build-search.mjs --out .export   (run by `make export`)

import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const argv = process.argv.slice(2)
const flag = (name, dflt) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt
}
const out = flag('out', '.export')

const graph = JSON.parse(readFileSync(join(out, 'graph.json'), 'utf8'))
const bySlug = new Map()
for (const n of graph.nodes) bySlug.set(n.slug, n)

/** Clean one heading into readable words: drop ox-html's leading
 *  `<span class="section-number-2">1.</span>` NUMBER (the outline number
 *  is chrome, not a search term — the reader's own TOC drops it too),
 *  then any remaining tags, then decode entities. What a human types is
 *  plain text, so that is what the index holds. */
function cleanHeading(inner) {
  const noNumber = inner.replace(/<span class="section-number-[^"]*">[^<]*<\/span>/, '')
  const noTags = noNumber.replace(/<[^>]+>/g, '')
  return noTags
    .replace(/^\s*[0-9]+(\.[0-9]+)*\.?\s*/, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

let files
try {
  files = readdirSync(join(out, 'docs')).filter((f) => f.endsWith('.html'))
} catch {
  console.error('build-search: no docs/ in', out)
  process.exit(1)
}

/** manual -> entries. Manual is the node's FIRST tag (the exporter stamps
 *  it), '' for untagged single-corpus data — the theme's own grouping. */
const perManual = new Map()

for (const f of files) {
  const slug = f.slice(0, -'.html'.length)
  const node = bySlug.get(slug)
  if (!node) continue // docs/ can hold pages for stubs the graph keeps
  const manual = node.tags?.[0] ?? ''
  const html = readFileSync(join(out, 'docs', f), 'utf8')
  // h2/h3 carrying an id are real anchors (CUSTOM_ID headings, <<target>>s,
  // and every numbered outline heading). h2/h3 without one (the generated
  // "Table of Contents" block) are skipped.
  const re = /<h([23])\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g
  let m
  while ((m = re.exec(html))) {
    const anchor = m[2]
    const heading = cleanHeading(m[3])
    if (!heading) continue
    if (!perManual.has(manual)) perManual.set(manual, [])
    perManual.get(manual).push({ s: slug, t: node.title, h: heading, a: anchor })
  }
}

mkdirSync(join(out, 'search'), { recursive: true })
let total = 0
for (const [manual, entries] of perManual) {
  const file = join(out, 'search', `${manual || 'corpus'}.json`)
  writeFileSync(file, JSON.stringify(entries))
  total += entries.length
  const kb = (readFileSync(file).length / 1024).toFixed(0)
  console.log(`build-search: ${manual || 'corpus'}: ${entries.length} headings (${kb} kB)`)
}
console.log(`build-search: ${total} headings across ${perManual.size} corpora`)
