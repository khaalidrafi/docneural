// tests/agent-api.test.mjs — the pure parts of the paid door: ranking
// parity with mcp-server, quota/rps math, the ask packet, and the handler
// over a fixture export. Bugs here cost money (miscounted quotas) or
// trust (an API that ranks differently from the site), so they are the
// parts under test.
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PLANS, askPacket, createAgentApi, makeMeter, monthStamp, rank, tokenize } from '../scripts/agent-api.mjs'

const entries = [
  { s: 'org--Agenda-Views', t: 'Agenda Views', h: 'Agenda Views', a: 'agenda-views' },
  { s: 'org--Capturing-Todos', t: 'Capturing Todos', h: 'agenda capture defaults', a: 'capture' },
  { s: 'emacs--Diary', t: 'Diary', h: 'Agenda-like diary views', a: 'diary' }
]

const graph = {
  nodes: [
    { id: '1', slug: 'org--Agenda-Views', title: 'Agenda Views', tags: ['org'] },
    { id: '2', slug: 'org--Capturing-Todos', title: 'Capturing Todos', tags: ['org'] }
  ],
  links: [{ source: '1', target: '2', context: 'Agenda views display what capture records.' }]
}

describe('rank', () => {
  it('tokenizes on non-alphanumerics', () => {
    expect(tokenize('Agenda Views! (org-mode)')).toEqual(['agenda', 'views', 'org', 'mode'])
  })

  it('prefers title matches over heading matches', () => {
    expect(rank(entries, 'agenda views')[0].slug).toBe('org--Agenda-Views')
  })

  it('boosts the exact phrase', () => {
    const hits = rank(entries, 'agenda views')
    expect(hits[0].score - hits[1].score).toBeGreaterThan(5)
  })

  it('returns nothing when nothing tokenizes', () => {
    expect(rank(entries, '!!!')).toEqual([])
  })

  it('caps at the limit', () => {
    expect(rank(entries, 'agenda', 1).length).toBe(1)
  })
})

describe('makeMeter', () => {
  it('passes under quota and rate, counting every charge', () => {
    let t = Date.parse('2026-10-15T00:00:00Z')
    const m = makeMeter({ quota: 3, rps: 1 }, () => t)
    expect(m.charge()).toMatchObject({ ok: true, used: 1 })
    expect(m.charge().reason).toBe('rps') // same second, rps 1
    t += 1000
    expect(m.charge()).toMatchObject({ ok: true, used: 2 })
    t += 1000
    expect(m.charge()).toMatchObject({ ok: true, used: 3 })
    t += 1000
    expect(m.charge().reason).toBe('quota') // 4th > quota 3
  })

  it('rolls the quota over on the month boundary', () => {
    let t = Date.parse('2026-10-15T00:00:00Z')
    const m = makeMeter({ quota: 1, rps: 100 }, () => t)
    expect(m.charge().ok).toBe(true)
    expect(m.charge().ok).toBe(false)
    t = Date.parse('2026-11-01T00:00:00Z')
    expect(m.charge().ok).toBe(true)
    expect(m.month).toBe('2026-11')
  })

  it('published plans match the price sheet', () => {
    expect(PLANS.hobby).toEqual({ quota: 1000, rps: 1 })
    expect(PLANS.build).toEqual({ quota: 50000, rps: 10 })
    expect(PLANS.scale).toEqual({ quota: 500000, rps: 100 })
  })

  it('monthStamp formats YYYY-MM', () => {
    expect(monthStamp(new Date('2026-10-15T00:00:00Z'))).toBe('2026-10')
  })
})

describe('askPacket', () => {
  it('ships citation sentences with candidates', () => {
    const hits = rank(entries, 'agenda views')
    const p = askPacket({ question: 'agenda views', route: null, hits, graph, k: 5 })
    const c = p.candidates.find((x) => x.slug === 'org--Agenda-Views')
    expect(c.url).toBe('docs/org--Agenda-Views.html#agenda-views')
    expect(c.citations[0].chapter).toBe('Capturing Todos')
    expect(c.citations[0].sentence).toBe('Agenda views display what capture records.')
    expect(c.jev_answers_it).toBeNull()
  })

  it('drops candidates Jev judges below the floor', () => {
    const hits = rank(entries, 'agenda')
    const judged = hits.map((h) => (h.slug === 'org--Agenda-Views' ? 0.93 : 0.02))
    const p = askPacket({ question: 'agenda', route: null, hits, graph, judged, k: 5, floor: 0.5 })
    expect(p.candidates.map((c) => c.slug)).toEqual(['org--Agenda-Views'])
    expect(p.candidates[0].jev_answers_it).toBe(0.93)
  })

  it('keeps the route decision on the packet', () => {
    const route = { manual: 'org', confidence: 0.9 }
    const p = askPacket({ question: 'q', route, hits: rank(entries, 'agenda'), graph })
    expect(p.route.manual).toBe('org')
  })
})

function fixtureExport() {
  const dir = mkdtempSync(join(tmpdir(), 'dn-api-'))
  mkdirSync(join(dir, 'search'))
  writeFileSync(join(dir, 'graph.json'), JSON.stringify(graph))
  writeFileSync(join(dir, 'search', 'org.json'), JSON.stringify([entries[0], entries[1]]))
  return dir
}

function reqRes(method, url, headers = {}) {
  const res = {
    status: 0,
    headers: {},
    body: '',
    writeHead(s, h) {
      this.status = s
      Object.assign(this.headers, h)
    },
    setHeader(k, v) {
      this.headers[k] = v
    },
    end(s) {
      if (s !== undefined) this.body += s
    }
  }
  return { req: { method, url, headers }, res }
}

describe('handler', () => {
  it('serves search from the export and meters the key', async () => {
    const dir = fixtureExport()
    const api = createAgentApi({ out: dir, keys: new Map([['dn_test_1', { plan: 'build', tenant: 'acme' }]]), usageDir: dir })
    const { req, res } = reqRes('GET', '/v1/search?q=agenda+views&manual=org', { authorization: 'Bearer dn_test_1' })
    await api.handler(req, res)
    expect(res.status).toBe(200)
    const j = JSON.parse(res.body)
    expect(j.ok).toBe(true)
    expect(j.data[0].slug).toBe('org--Agenda-Views')
    expect(j.meter).toMatchObject({ plan: 'build', used: 1 })
  })

  it('401s an unknown key and 200s /health without one', async () => {
    const dir = fixtureExport()
    const api = createAgentApi({ out: dir, keys: new Map([['dn_test_1', { plan: 'build' }]]), usageDir: dir })
    const a = reqRes('GET', '/v1/search?q=x', { authorization: 'Bearer nope' })
    await api.handler(a.req, a.res)
    expect(a.res.status).toBe(401)
    const b = reqRes('GET', '/health')
    await api.handler(b.req, b.res)
    expect(b.res.status).toBe(200)
  })

  it('429s past the plan rps with a Retry-After', async () => {
    const dir = fixtureExport()
    const api = createAgentApi({ out: dir, keys: new Map([['dn_hobby', { plan: 'hobby' }]]), usageDir: dir })
    const first = reqRes('GET', '/v1/stats', { authorization: 'Bearer dn_hobby' })
    await api.handler(first.req, first.res)
    expect(first.res.status).toBe(200)
    const second = reqRes('GET', '/v1/stats', { authorization: 'Bearer dn_hobby' })
    await api.handler(second.req, second.res)
    expect(second.res.status).toBe(429)
    expect(second.res.headers['retry-after']).toBe('1')
  })
})
