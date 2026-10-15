#!/usr/bin/env node
// agent-api.mjs — the export as a metered HTTP API: the paid agent door.
//
// WHY: scripts/mcp-server.mjs serves ONE assistant over stdio. The paid
// product is the same answers over HTTP for ANY agent, per tenant: keys,
// plans, monthly quotas, per-second rate limits, and an append-only usage
// log you can invoice from. Zero dependencies (node:http over the static
// export), one file — so "hosting" is a small VM plus a reverse proxy and
// the unit economics stay sane at any scale.
//
// Ranking is mcp-server.mjs's ranking, weight for weight (title x3,
// heading x2, phrase bonus): the API, the MCP server and the site palette
// must not disagree about what "best" means.
//
// Jev (optional, BYO key): with TYPESAFE_API_KEY set, POST /v1/ask first
// ROUTES the question to a manual with a typed choice — Jev answers from
// the options it is given, so it cannot invent a manual, and `none` keeps
// an out-of-corpus question an honest miss — then judges every top
// candidate with one yes/no probability (a single call) and drops the ones
// below the floor. Without a key the endpoint degrades to pure BM25.
// Either way every candidate carries its citation sentence from the graph:
// the answer arrives with the proof.
//
// Run:
//   node scripts/agent-api.mjs --out .export --port 8787 --keys keys.json
//   node scripts/agent-api.mjs --out .export --open        # dev, no auth
//
// keys.json:  { "dn_live_xxx": { "plan": "build", "tenant": "acme" } }
// plans:      hobby 1k queries/mo @ 1 rps | build 50k @ 10 | scale 500k @ 100
// usage log:  usage-YYYYMM.jsonl — one line per billable call, invoicing artifact

import { createServer } from 'node:http'
import { readFileSync, existsSync, readdirSync, appendFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { systemOne, routeQuestions, candidateQuestions, keyFromEnv } from './jev.mjs'

/* ---------- plans & metering (pure — see tests/agent-api.test.mjs) ---------- */

export const PLANS = {
  hobby: { quota: 1000, rps: 1 },
  build: { quota: 50000, rps: 10 },
  scale: { quota: 500000, rps: 100 }
}

export const monthStamp = (d = new Date()) => d.toISOString().slice(0, 7)

/** One key's meter: a monthly quota plus a one-second rate window. No I/O
 *  and an injectable clock, so quota math is testable without a filesystem
 *  and without waiting a second per case. */
export function makeMeter(plan, now = () => Date.now()) {
  let month = null
  let used = 0
  let winStart = 0
  let winCount = 0
  return {
    get used() {
      return used
    },
    get month() {
      return month
    },
    charge() {
      const m = monthStamp(new Date(now()))
      if (month !== m) {
        month = m
        used = 0
      }
      const t = now()
      if (t - winStart >= 1000) {
        winStart = t
        winCount = 0
      }
      if (winCount + 1 > plan.rps) return { ok: false, reason: 'rps', retry_after_s: 1 }
      if (used + 1 > plan.quota) return { ok: false, reason: 'quota', retry_after_s: 3600 }
      winCount += 1
      used += 1
      return { ok: true, used, quota: plan.quota, month }
    }
  }
}

/* ---------- corpus (the same lazy shapes mcp-server.mjs uses) ---------- */

export const tokenize = (s) => s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)

/** Field-weighted idf ranking — weights identical to mcp-server.mjs. */
export function rank(entries, q, limit = 10) {
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
    out.push({ slug: e.s, page_title: e.t, heading: e.h, anchor: e.a, score: Math.round(score * 1000) / 1000 })
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit)
}

/** The /v1/ask answer packet: ranked candidates, each with its chapter's
 *  citation wires (the sentence that made them) and, when Jev judged, the
 *  yes-probability it answered with. Candidates judged below `floor` are
 *  dropped; unjudged (no key, or a failed call) always pass. */
export function askPacket({ question, route, hits, graph, judged = null, k = 5, floor = 0.5 }) {
  const bySlug = new Map(graph.nodes.map((nd) => [nd.slug, nd]))
  const titleOf = (id) => graph.nodes.find((x) => x.id === id)?.title ?? id
  const candidates = []
  for (let i = 0; i < hits.length && candidates.length < k; i++) {
    const h = hits[i]
    const p = judged && i < judged.length ? judged[i] : null
    if (p !== null && p < floor) continue
    const nd = bySlug.get(h.slug)
    const citations = nd
      ? graph.links
          .filter((l) => l.source === nd.id || l.target === nd.id)
          .slice(0, 3)
          .map((l) => ({
            chapter: titleOf(l.source === nd.id ? l.target : l.source),
            sentence: l.context ?? null
          }))
      : []
    candidates.push({
      slug: h.slug,
      title: h.page_title,
      heading: h.heading,
      url: `docs/${h.slug}.html#${h.anchor}`,
      bm25: h.score,
      jev_answers_it: p,
      citations
    })
  }
  return { question, route: route ?? null, candidates }
}

/* ---------- http glue ---------- */

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization,content-type',
  'access-control-allow-methods': 'GET,POST,OPTIONS'
}

function sendJson(res, status, body) {
  const s = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(s),
    'cache-control': 'no-store',
    ...CORS
  })
  res.end(s)
}

function readBody(req, cap = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let s = ''
    req.on('data', (c) => {
      s += c
      if (s.length > cap) {
        reject(new Error('body too large'))
        req.destroy()
      }
    })
    req.on('end', () => resolve(s))
    req.on('error', reject)
  })
}

/** The whole API as one factory: `handler` for tests, `listen` for prod. */
export function createAgentApi(opts) {
  const OUT = opts.out ?? '.export'
  const keys = opts.keys ?? null // Map key -> {plan, tenant}; null = --open
  const jevKey = opts.jevKey ?? null
  const usageDir = opts.usageDir ?? '.'
  const meters = new Map()
  let graph = null
  let bySlug = null
  let searchIndexes = null

  function loadGraph() {
    if (graph) return graph
    const p = join(OUT, 'graph.json')
    if (!existsSync(p)) throw new Error(`no graph.json under ${OUT} — run make export first`)
    graph = JSON.parse(readFileSync(p, 'utf8'))
    bySlug = new Map(graph.nodes.map((nd) => [nd.slug, nd]))
    return graph
  }

  function loadSearch() {
    if (searchIndexes) return searchIndexes
    searchIndexes = new Map()
    const dir = join(OUT, 'search')
    if (existsSync(dir)) {
      for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
        searchIndexes.set(f.slice(0, -5), JSON.parse(readFileSync(join(dir, f), 'utf8')))
      }
    }
    return searchIndexes
  }

  const titleOf = (id) => graph.nodes.find((x) => x.id === id)?.title ?? id

  function nodeRecord(nd) {
    return {
      id: nd.id,
      slug: nd.slug,
      title: nd.title,
      manual: nd.tags?.[0] ?? null,
      stub: !!nd.stub,
      up: nd.up ?? null,
      next: nd.next ?? null,
      prev: nd.prev ?? null,
      raw_org: `docs/${nd.slug}.org`
    }
  }

  function egoIds(centerId, hops) {
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

  function auth(req) {
    if (!keys) return { key: 'open', planName: 'scale', plan: PLANS.scale, tenant: 'dev' }
    const h = req.headers?.authorization ?? ''
    const k = h.startsWith('Bearer ') ? h.slice(7).trim() : ''
    const rec = keys.get(k)
    if (!rec) return null
    const planName = PLANS[rec.plan] ? rec.plan : 'hobby'
    return { key: k, planName, plan: PLANS[planName], tenant: rec.tenant ?? 'anon' }
  }

  function logUsage(rec, path, status) {
    try {
      mkdirSync(usageDir, { recursive: true })
      const line = {
        t: new Date().toISOString(),
        tenant: rec.tenant,
        key: '…' + rec.key.slice(-4),
        path,
        status
      }
      appendFileSync(join(usageDir, `usage-${monthStamp()}.jsonl`), JSON.stringify(line) + '\n')
    } catch {
      /* a failed log line must never down a request */
    }
  }

  async function api(pathname, url, req) {
    switch (pathname) {
      case '/v1/stats': {
        loadGraph()
        const manuals = {}
        for (const nd of graph.nodes) {
          const m = nd.tags?.[0] ?? ''
          if (!manuals[m]) manuals[m] = { pages: 0, stubs: 0 }
          if (nd.stub) manuals[m].stubs += 1
          else manuals[m].pages += 1
        }
        return {
          manuals,
          chapters: graph.nodes.filter((nd) => !nd.stub).length,
          stubs: graph.nodes.filter((nd) => nd.stub).length,
          wires: graph.links.length,
          llms_txt: existsSync(join(OUT, 'llms.txt')),
          jev: !!jevKey
        }
      }
      case '/v1/search': {
        loadSearch()
        const manual = url.searchParams.get('manual')
        const pool = manual ? [...(searchIndexes.get(manual) ?? [])] : [...searchIndexes.values()].flat()
        const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? 10)))
        return rank(pool, url.searchParams.get('q') ?? '', limit)
      }
      case '/v1/node': {
        loadGraph()
        const slug = url.searchParams.get('slug') ?? ''
        const nd = bySlug.get(slug)
        if (!nd) throw Object.assign(new Error(`no chapter with slug ${slug}`), { status: 404 })
        const inW = graph.links.filter((l) => l.target === nd.id)
        const outW = graph.links.filter((l) => l.source === nd.id)
        return {
          ...nodeRecord(nd),
          degree: inW.length + outW.length,
          cited_by: inW.map((l) => ({ chapter: titleOf(l.source), context: l.context ?? null })),
          cites: outW.map((l) => ({ chapter: titleOf(l.target), context: l.context ?? null }))
        }
      }
      case '/v1/neighbours': {
        loadGraph()
        const slug = url.searchParams.get('slug') ?? ''
        const nd = bySlug.get(slug)
        if (!nd) throw Object.assign(new Error(`no chapter with slug ${slug}`), { status: 404 })
        const hops = Math.min(2, Math.max(1, Number(url.searchParams.get('hops') ?? 1)))
        const keep = egoIds(nd.id, hops)
        return {
          centre: nodeRecord(nd),
          chapters: graph.nodes
            .filter((x) => keep.has(x.id) && !x.stub && x.id !== nd.id)
            .map((x) => ({ slug: x.slug, title: x.title, manual: x.tags?.[0] ?? null })),
          wires: graph.links
            .filter((l) => keep.has(l.source) && keep.has(l.target))
            .map((l) => ({ from: titleOf(l.source), to: titleOf(l.target), context: l.context ?? null }))
        }
      }
      case '/v1/citation-path': {
        loadGraph()
        const a = bySlug.get(url.searchParams.get('from') ?? '')
        const b = bySlug.get(url.searchParams.get('to') ?? '')
        if (!a || !b) throw Object.assign(new Error('both slugs must resolve in this corpus'), { status: 404 })
        const path = bfsPath(a.id, b.id)
        if (path === null) {
          throw Object.assign(new Error(`no citation path from ${a.slug} to ${b.slug} within 6 hops`), { status: 404 })
        }
        const steps = path.slice(0, -1).map((id, i) => {
          const nx = path[i + 1]
          const wire = graph.links.find(
            (l) => (l.source === id && l.target === nx) || (l.source === nx && l.target === id)
          )
          return {
            from: titleOf(id),
            to: titleOf(nx),
            cited_sentence: wire?.context ?? null,
            from_slug: graph.nodes.find((x) => x.id === id)?.slug ?? null
          }
        })
        return { hops: steps.length, steps }
      }
      case '/v1/ask': {
        if (req.method !== 'POST') {
          throw Object.assign(new Error('POST a JSON body: {"question": "..."}'), { status: 405 })
        }
        let body
        try {
          body = JSON.parse(await readBody(req))
        } catch {
          throw Object.assign(new Error('body must be JSON'), { status: 400 })
        }
        const question = String(body.question ?? '').trim()
        if (!question) throw Object.assign(new Error('question is required'), { status: 400 })
        const k = Math.min(10, Math.max(1, Number(body.k ?? 5)))
        loadGraph()
        loadSearch()
        const manuals = [...searchIndexes.keys()]
        let route = null
        let judged = null
        if (jevKey && manuals.length) {
          try {
            const r1 = await systemOne({ key: jevKey, state: { question }, questions: routeQuestions(manuals) })
            const a = r1.answers?.route
            route = a
              ? { manual: a.choice === 'none' ? null : a.choice, confidence: a.confidence, probabilities: a.probabilities }
              : null
          } catch (e) {
            route = { error: String(e.message ?? e) }
          }
        }
        const routed = route && route.manual && searchIndexes.has(route.manual)
        const pool = routed ? searchIndexes.get(route.manual) : [...searchIndexes.values()].flat()
        const hits = rank(pool, question, k * 3)
        if (jevKey && hits.length) {
          try {
            const top = hits.slice(0, k)
            const candidates = {}
            top.forEach((h, i) => {
              candidates['c' + i] = { title: h.page_title, heading: h.heading }
            })
            const r2 = await systemOne({ key: jevKey, state: { question, candidates }, questions: candidateQuestions(top.length) })
            judged = top.map((_, i) => r2.answers?.['c' + i]?.noul ?? null)
          } catch {
            judged = null // a failed judgement must never fail the answer
          }
        }
        return askPacket({ question, route, hits, graph, judged, k })
      }
      default:
        throw Object.assign(new Error(`unknown route: ${pathname}`), { status: 404 })
    }
  }

  async function handler(req, res) {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS)
      return res.end()
    }
    const url = new URL(req.url, 'http://internal')
    if (url.pathname === '/health') {
      return sendJson(res, 200, {
        ok: true,
        service: 'docneural-agent-api',
        version: '1.0.0',
        auth: keys ? 'keys' : 'open',
        jev: !!jevKey
      })
    }
    if (url.pathname === '/v1/llms.txt') {
      // free on purpose: the map is what drives the paid calls
      const p = join(OUT, 'llms.txt')
      if (!existsSync(p)) return sendJson(res, 404, { ok: false, error: { code: 'no_llms', message: 'export has no llms.txt' } })
      const s = readFileSync(p, 'utf8')
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8', 'content-length': Buffer.byteLength(s), ...CORS })
      return res.end(s)
    }
    const rec = auth(req)
    if (!rec) return sendJson(res, 401, { ok: false, error: { code: 'no_key', message: 'Authorization: Bearer <key> required' } })
    let meter = meters.get(rec.key)
    if (!meter) {
      meter = makeMeter(rec.plan)
      meters.set(rec.key, meter)
    }
    const charged = meter.charge()
    if (!charged.ok) {
      logUsage(rec, url.pathname, 429)
      res.setHeader('retry-after', String(charged.retry_after_s))
      const message =
        charged.reason === 'rps'
          ? `rate limit: ${rec.plan.rps} rps on plan ${rec.planName}`
          : `monthly quota reached (${rec.plan.quota} on ${rec.planName}) — upgrade or wait for rollover`
      return sendJson(res, 429, { ok: false, error: { code: charged.reason, message } })
    }
    try {
      const data = await api(url.pathname, url, req)
      logUsage(rec, url.pathname, 200)
      return sendJson(res, 200, {
        ok: true,
        data,
        meter: { plan: rec.planName, used: meter.used, quota: rec.plan.quota, month: charged.month }
      })
    } catch (e) {
      const status = e.status ?? (/^jev:/.test(String(e.message)) ? 502 : 500)
      logUsage(rec, url.pathname, status)
      return sendJson(res, status, {
        ok: false,
        error: { code: status === 502 ? 'jev' : 'error', message: String(e.message ?? e) }
      })
    }
  }

  return { handler, listen: (port, cb) => createServer(handler).listen(port, cb) }
}

/* ---------- CLI ---------- */

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isMain) {
  const argv = process.argv.slice(2)
  const flag = (name, dflt) => {
    const i = argv.indexOf('--' + name)
    return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt
  }
  const out = flag('out', '.export')
  const port = Number(flag('port', '8787'))
  const open = argv.includes('--open')
  let keys = null
  if (!open) {
    const kf = flag('keys', 'keys.json')
    if (!existsSync(kf)) {
      console.error(`agent-api: no ${kf} — pass --keys FILE or --open for authless dev`)
      process.exit(1)
    }
    keys = new Map(Object.entries(JSON.parse(readFileSync(kf, 'utf8'))))
  }
  const jevKey = keyFromEnv()
  const agentApi = createAgentApi({ out, keys, jevKey, usageDir: flag('usage-dir', '.') })
  agentApi.listen(port, () => {
    console.log(
      `agent-api: :${port} out=${out} auth=${keys ? keys.size + ' keys' : 'OPEN (dev)'} jev=${jevKey ? 'on' : 'off (set TYPESAFE_API_KEY to enable)'}`
    )
  })
}
