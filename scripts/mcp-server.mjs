#!/usr/bin/env node
// mcp-server.mjs — the exported corpus as MCP tools, zero dependencies.
//
// WHY: llms.txt/ctx already make the corpus fetchable, but an assistant
// still has to fetch, parse and join by hand. MCP is a JSON-RPC dialect
// over stdio, which is small enough to speak directly: this file is the
// whole client. The server answers from the STATIC EXPORT
// (.export/graph.json, ctx/, search/, llms.txt) — no Emacs, no network,
// no key — so it can run against the bundled demo corpus or a private
// one on a laptop.
//
// Wire up (Claude Code / WorkBuddy / Cursor style):
//   { "mcpServers": { "docneural": {
//       "command": "node",
//       "args": ["scripts/mcp-server.mjs", "--out", ".export"] } } }
//
// Tools:
//   search           full-text over headings+titles (the per-manual index)
//   node             one chapter: title, degree, citations, raw-org URL
//   neighbours       ego graph around a chapter (1-2 hops)
//   citation-path    BFS citation path between two chapters, with the
//                    sentence that made each wire
//   stats            corpus shape (manuals, chapters, wires)
//
// Ranking mirrors the theme's core/search.ts (same weights): the site and
// an agent answering from it must not disagree about what "best" means.

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const argv = process.argv.slice(2)
const flag = (name, dflt) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt
}
const OUT = flag('out', '.export')

/* ---------- corpus ---------- */

let graph = null
/** manual -> SearchEntry[] (the same shape the theme fetches). */
let searchIndexes = null

function loadGraph() {
  if (graph) return
  const p = join(OUT, 'graph.json')
  if (!existsSync(p)) throw new Error(`no graph.json under ${OUT} — run make export first`)
  graph = JSON.parse(readFileSync(p, 'utf8'))
}

function loadSearchIndexes() {
  if (searchIndexes) return
  searchIndexes = new Map()
  const dir = join(OUT, 'search')
  if (!existsSync(dir)) return
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    searchIndexes.set(f.slice(0, -5), JSON.parse(readFileSync(join(dir, f), 'utf8')))
  }
}

const tokenize = (s) =>
  s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)

/** Field-weighted idf ranking (see header): title x3, heading x2. */
function rank(entries, q, limit = 10) {
  const tokens = tokenize(q)
  if (!tokens.length) return []
  const n = entries.length
  const df = new Map()
  for (const e of entries) {
    const hay = `${e.t} ${e.h}`.toLowerCase()
    for (const t of tokens) if (hay.includes(t)) df.set(t, (df.get(t) ?? 0) + 1)
  }
  const idf = (d) => Math.log(1 + (n - d + 0.5) / (d + 0.5))
  const out = []
  for (const e of entries) {
    const t = e.t.toLowerCase()
    const h = e.h.toLowerCase()
    let title = 0
    let head = 0
    for (const tok of tokens) {
      if (t.includes(tok)) title += idf(df.get(tok) ?? 0) * 3
      if (h.includes(tok)) head += idf(df.get(tok) ?? 0) * 2
    }
    if (!title && !head) continue
    let score = title + head
    if (tokens.length > 1) {
      const phrase = tokens.join(' ')
      if (t.includes(phrase)) score += 6
      if (h.includes(phrase)) score += 5
    }
    out.push({ slug: e.s, page_title: e.t, heading: e.h, anchor: e.a, score })
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit)
}

function nodeRecord(node) {
  return {
    id: node.id,
    slug: node.slug,
    title: node.title,
    manual: node.tags[0] ?? null,
    stub: !!node.stub,
    up: node.up ?? null,
    next: node.next ?? null,
    prev: node.prev ?? null,
    raw_org: `docs/${node.slug}.org`
  }
}

function egoIds(centerId, hops = 1) {
  const keep = new Set([centerId])
  let frontier = keep
  for (let i = 0; i < hops; i++) {
    const next = new Set()
    for (const l of graph.links) {
      if (frontier.has(l.source)) next.add(l.target)
      if (frontier.has(l.target)) next.add(l.source)
    }
    for (const id of next) keep.add(id)
    frontier = next
  }
  return keep
}

function bfsPath(fromId, toId, maxDepth = 6) {
  if (fromId === toId) return []
  const prev = new Map([[fromId, null]])
  const q = [[fromId, 0]]
  while (q.length) {
    const [cur, d] = q.shift()
    if (d >= maxDepth) continue
    for (const l of graph.links) {
      const nx = l.source === cur ? l.target : l.target === cur ? l.source : null
      if (!nx || prev.has(nx)) continue
      prev.set(nx, cur)
      if (nx === toId) {
        const path = []
        for (let at = toId; at !== null; at = prev.get(at)) path.unshift(at)
        return path
      }
      q.push([nx, d + 1])
    }
  }
  return null
}

/* ---------- JSON-RPC over stdio ---------- */

const TOOLS = [
  {
    name: 'search',
    description: 'Full-text search over the corpus (chapter titles AND section headings). Returns ranked hits with slugs and anchors.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to search for' },
        manual: { type: 'string', description: 'Limit to one manual (e.g. "org")' },
        limit: { type: 'number', description: 'Max hits (default 10)' }
      },
      required: ['query']
    }
  },
  {
    name: 'node',
    description: 'One chapter: its metadata, degree, and the citation wires in/out (with the sentence that made each wire).',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string', description: 'Chapter slug, e.g. org--Agenda-Views' } },
      required: ['slug']
    }
  },
  {
    name: 'neighbours',
    description: 'The ego graph around a chapter: what it cites and what cites it (1-2 hops).',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        hops: { type: 'number', description: '1 or 2 (default 1)' }
      },
      required: ['slug']
    }
  },
  {
    name: 'citation-path',
    description: 'The shortest citation path between two chapters, with the sentence that made each wire — the "why" chain, not just the hops.',
    inputSchema: {
      type: 'object',
      properties: { from: { type: 'string' }, to: { type: 'string' } },
      required: ['from', 'to']
    }
  },
  {
    name: 'stats',
    description: 'Corpus shape: manuals, real chapters, wires.',
    inputSchema: { type: 'object', properties: {} }
  }
]

function callTool(name, args) {
  loadGraph()
  const bySlug = new Map(graph.nodes.map((n) => [n.slug, n]))
  switch (name) {
    case 'search': {
      loadSearchIndexes()
      const manual = args.manual ?? null
      const pools = manual
        ? [...(searchIndexes.get(manual) ?? [])]
        : [...searchIndexes.values()].flat()
      const hits = rank(pools, String(args.query ?? ''), Number(args.limit ?? 10))
      return { content: [{ type: 'text', text: JSON.stringify(hits, null, 1) }] }
    }
    case 'node': {
      const n = bySlug.get(String(args.slug ?? ''))
      if (!n) throw new Error(`no chapter with slug ${args.slug}`)
      const inW = graph.links.filter((l) => l.target === n.id)
      const outW = graph.links.filter((l) => l.source === n.id)
      const titleOf = (id) => graph.nodes.find((x) => x.id === id)?.title ?? id
      const rec = {
        ...nodeRecord(n),
        degree: inW.length + outW.length,
        cited_by: inW.map((l) => ({ chapter: titleOf(l.source), context: l.context ?? null })),
        cites: outW.map((l) => ({ chapter: titleOf(l.target), context: l.context ?? null }))
      }
      return { content: [{ type: 'text', text: JSON.stringify(rec, null, 1) }] }
    }
    case 'neighbours': {
      const n = bySlug.get(String(args.slug ?? ''))
      if (!n) throw new Error(`no chapter with slug ${args.slug}`)
      const hops = Math.min(2, Math.max(1, Number(args.hops ?? 1)))
      const keep = egoIds(n.id, hops)
      const titleOf = (id) => graph.nodes.find((x) => x.id === id)?.title ?? id
      const rec = {
        centre: nodeRecord(n),
        chapters: graph.nodes
          .filter((x) => keep.has(x.id) && !x.stub && x.id !== n.id)
          .map((x) => ({ slug: x.slug, title: x.title, manual: x.tags[0] ?? null })),
        wires: graph.links
          .filter((l) => keep.has(l.source) && keep.has(l.target))
          .map((l) => ({ from: titleOf(l.source), to: titleOf(l.target), context: l.context ?? null }))
      }
      return { content: [{ type: 'text', text: JSON.stringify(rec, null, 1) }] }
    }
    case 'citation-path': {
      const a = bySlug.get(String(args.from ?? ''))
      const b = bySlug.get(String(args.to ?? ''))
      if (!a || !b) throw new Error('both slugs must resolve in this corpus')
      const path = bfsPath(a.id, b.id)
      if (path === null) throw new Error(`no citation path from ${a.slug} to ${b.slug} within 6 hops`)
      const titleOf = (id) => graph.nodes.find((x) => x.id === id)?.title ?? id
      const steps = path.slice(0, -1).map((id, i) => {
        const nx = path[i + 1]
        const wire = graph.links.find((l) =>
          (l.source === id && l.target === nx) || (l.source === nx && l.target === id))
        return {
          from: titleOf(id),
          to: titleOf(nx),
          cited_sentence: wire?.context ?? null,
          from_slug: graph.nodes.find((x) => x.id === id)?.slug ?? null
        }
      })
      return {
        content: [{ type: 'text', text: JSON.stringify({ hops: steps.length, steps }, null, 1) }]
      }
    }
    case 'stats': {
      const manuals = new Map()
      for (const n of graph.nodes) {
        const m = n.tags[0] ?? ''
        if (!manuals.has(m)) manuals.set(m, { pages: 0, stubs: 0 })
        const s = manuals.get(m)
        if (n.stub) s.stubs++
        else s.pages++
      }
      const rec = {
        manuals: Object.fromEntries(manuals),
        chapters: graph.nodes.filter((n) => !n.stub).length,
        stubs: graph.nodes.filter((n) => n.stub).length,
        wires: graph.links.length,
        llms_txt: existsSync(join(OUT, 'llms.txt'))
      }
      return { content: [{ type: 'text', text: JSON.stringify(rec, null, 1) }] }
    }
    default:
      throw new Error(`unknown tool: ${name}`)
  }
}

const RESOURCES = () => {
  const list = []
  if (existsSync(join(OUT, 'llms.txt'))) {
    list.push({ uri: 'docneural://llms.txt', name: 'Corpus index', mimeType: 'text/plain' })
  }
  if (existsSync(join(OUT, 'llms-full.txt'))) {
    list.push({ uri: 'docneural://llms-full.txt', name: 'Corpus full text', mimeType: 'text/plain' })
  }
  return list
}

function readResource(uri) {
  if (uri === 'docneural://llms.txt') {
    return readFileSync(join(OUT, 'llms.txt'), 'utf8')
  }
  if (uri === 'docneural://llms-full.txt') {
    return readFileSync(join(OUT, 'llms-full.txt'), 'utf8')
  }
  throw new Error(`unknown resource: ${uri}`)
}

function send(msg) {
  const body = JSON.stringify(msg)
  process.stdout.write(body + '\n')
}

function handle(msg) {
  const { id, method, params } = msg
  try {
    switch (method) {
      case 'initialize':
        return send({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            serverInfo: { name: 'docneural', version: '0.1.0' },
            capabilities: { tools: {}, resources: {} }
          }
        })
      case 'ping':
        return send({ jsonrpc: '2.0', id, result: {} })
      case 'tools/list':
        return send({ jsonrpc: '2.0', id, result: { tools: TOOLS } })
      case 'tools/call':
        return send({ jsonrpc: '2.0', id, result: callTool(params?.name, params?.arguments ?? {}) })
      case 'resources/list':
        return send({ jsonrpc: '2.0', id, result: { resources: RESOURCES() } })
      case 'resources/read':
        return send({
          jsonrpc: '2.0',
          id,
          result: {
            contents: [{ uri: params?.uri, mimeType: 'text/plain', text: readResource(params?.uri) }]
          }
        })
      case 'notifications/initialized':
      case 'initialized':
        return // notification: no response
      default:
        if (id !== undefined) {
          return send({ jsonrpc: '2.0', id, error: { code: -32601, message: `method not found: ${method}` } })
        }
    }
  } catch (e) {
    if (id !== undefined) {
      return send({
        jsonrpc: '2.0',
        id,
        error: { code: -32603, message: e instanceof Error ? e.message : String(e) }
      })
    }
  }
}

/* Newline-delimited JSON on stdin (MCP stdio framing). */
let buffer = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => {
  buffer += chunk
  let nl
  while ((nl = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, nl).trim()
    buffer = buffer.slice(nl + 1)
    if (!line) continue
    try {
      handle(JSON.parse(line))
    } catch {
      /* a malformed frame is not worth killing the server over */
    }
  }
})
process.stdin.on('end', () => process.exit(0))
