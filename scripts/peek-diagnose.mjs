// Why did the peek card find no citation sentence? Answer it with data, not
// guesses: for one real chapter, list the doc links its prose contains, and
// for each whether graph.json actually has a wire from that chapter to the
// link's target node (and what the ctx file keys look like).
//   node scripts/peek-diagnose.mjs [slug]
import { readFileSync } from 'node:fs'

const OUT = '.export'
const slug = process.argv[2] ?? 'org--Agenda-Views'
const g = JSON.parse(readFileSync(`${OUT}/graph.json`, 'utf8'))
const bySlug = new Map(g.nodes.map((n) => [n.slug, n]))
const frag = readFileSync(`${OUT}/docs/${slug}.html`, 'utf8')

const hrefs = [...frag.matchAll(/href="([^"]*docs\/[^"]+\.html)(?:#([^"]*))?"/g)]
  .map((m) => ({ href: m[1], slug: m[1].split('/').pop().replace('.html', ''), anchor: m[2] }))
const uniq = [...new Map(hrefs.map((h) => [h.slug + '#' + (h.anchor ?? ''), h])).values()]

const doc = bySlug.get(slug)
console.log(`doc ${slug} id=${doc?.id}  in-prose links: ${uniq.length}`)

// Wires of this node, both directions.
const out = g.links.filter((l) => l.source === doc?.id)
const inc = g.links.filter((l) => l.target === doc?.id)
const targets = new Set(out.map((l) => l.target))
console.log(`wires out=${out.length} in=${inc.length}`)

let known = 0, wire = 0
for (const h of uniq.slice(0, 14)) {
  const t = bySlug.get(h.slug)
  if (t) known++
  const has = t ? targets.has(t.id) : false
  if (has) wire++
  console.log(`  ${h.slug}${h.anchor ? '#' + h.anchor : ''} -> node=${t?.id ?? 'MISSING'} wire=${has}`)
}
console.log(`of the first ${Math.min(14, uniq.length)}: ${known} resolve to a node, ${wire} have a wire`)

// What a ctx file for this node actually keys.
try {
  const c = JSON.parse(readFileSync(`${OUT}/ctx/${slug}.json`, 'utf8'))
  const keys = Object.keys(c)
  console.log(`ctx/${slug}.json keys=${keys.length} e.g. ${keys.slice(0, 3).join(' , ')}`)
} catch (e) {
  console.log(`ctx/${slug}.json: ${e.code}`)
}
