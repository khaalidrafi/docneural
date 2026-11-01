// dn-pulse — presence API for agents on the field (SPEC 4, workstream A).
//
// Workers + KV only. No AI binding, no secrets, no auth. The payload is
// agent NAME + node slugs + action — NO PII, by team law: human readers are
// never tracked ambiently; beacons arrive only from explicit ASK actions and
// from agents announcing themselves (the site's own ASK panel, org-docs'
// Emacs readers, MCP/CLI agents).
//
// Quota walls this design respects (KV free tier):
//   ~1k writes/day  -> the dedupe guard (90 s window) + 30/min per-IP limiter
//                      collapse the ASK panel's re-fires into one write.
//   ~100k reads/day -> GET /pulse answers from the edge (Cache-Control
//                      public, max-age=3) and caps at 50 rows.
// Entries expire via KV TTL (600 s): presence is "now", not history.
//
// Endpoints:
//   POST /pulse   announce: {agent, kind, nodes[], action, host?}
//   GET  /pulse   snapshot: {updated, total, agents:[{agent,kind,nodes,action,age}]}
//   GET  /health  {ok:true}
//
// Deploy (lead-owned; the KV id is a placeholder until the namespace exists):
//   npx wrangler deploy   # from cf/pulse/, CLOUDFLARE_API_TOKEN set

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type, cache-control',
  'access-control-max-age': '86400'
}

const KINDS = new Set(['assistant', 'agent', 'mcp', 'cli'])
const ACTIONS = new Set(['read', 'ask', 'import'])
const MAX_BODY = 2048 // bytes — reject anything bigger (400)
const MAX_NODES = 12
const MAX_AGENT = 40
const DEDUPE_WINDOW_MS = 90_000
const ENTRY_TTL = 600 // seconds; presence lives ten minutes
const LIST_CAP = 50
const RATE_LIMIT = 30 // per IP per minute, in-isolate, best-effort

/** In-isolate rate limiter: one Map<ip, windowStart> + counter. Best-effort
 *  by design — isolates churn, and the dedupe guard carries the real quota. */
const rate = { window: 0, seen: new Map() }
function rateLimited(ip, now) {
  if (now - rate.window >= 60_000) {
    rate.window = now
    rate.seen = new Map()
  }
  const n = (rate.seen.get(ip) ?? 0) + 1
  rate.seen.set(ip, n)
  return n > RATE_LIMIT
}

/** ULID-ish: 48-bit ms time + 80-bit randomness, Crockford base32 —
 *  lexicographic order == time order, so `list` streams oldest first and
 *  the snapshot sort is a simple reverse. No dependency. */
const ENC = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
function ulid(now) {
  let time = now
  let ts = ''
  for (let i = 0; i < 10; i++) {
    ts = ENC[time % 32] + ts
    time = Math.floor(time / 32)
  }
  let rand = ''
  for (let i = 0; i < 16; i++) rand += ENC[Math.floor(Math.random() * 32)]
  return ts + rand
}

async function sha256Hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Validate one announce body. Returns {ok:true, value} or {ok:false}. */
function validate(body) {
  if (typeof body !== 'object' || body == null || Array.isArray(body)) return { ok: false }
  const { agent, kind, nodes, action, host } = body
  if (typeof agent !== 'string' || agent.length < 1 || agent.length > MAX_AGENT) return { ok: false }
  if (!KINDS.has(kind)) return { ok: false }
  if (!ACTIONS.has(action)) return { ok: false }
  if (!Array.isArray(nodes) || nodes.length > MAX_NODES) return { ok: false }
  for (const n of nodes) if (typeof n !== 'string' || n.length < 1 || n.length > 200) return { ok: false }
  if (host !== undefined && typeof host !== 'string') return { ok: false }
  // PII law: only the declared fields ever reach storage.
  return { ok: true, value: { agent, kind, nodes, action, host: typeof host === 'string' ? host.slice(0, 200) : undefined } }
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS, ...extra }
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const now = Date.now()
    try {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })

      if (url.pathname === '/health' && request.method === 'GET') {
        return json({ ok: true })
      }

      if (url.pathname === '/pulse' && request.method === 'POST') {
        const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
        if (rateLimited(ip, now)) return json({ ok: false, error: 'rate limited' }, 429)

        const raw = await request.arrayBuffer()
        if (raw.byteLength > MAX_BODY) return json({ ok: false, error: 'body too large' }, 400)
        let body
        try {
          body = JSON.parse(new TextDecoder().decode(raw))
        } catch {
          return json({ ok: false, error: 'invalid json' }, 400)
        }
        const v = validate(body)
        if (!v.ok) return json({ ok: false, error: 'invalid payload' }, 400)
        const p = v.value

        // Dedupe guard: the same agent doing the same thing on the same nodes
        // inside 90 s is ONE presence, no matter how often the client refires.
        const key =
          'd:' +
          (await sha256Hex(`${p.agent}|${p.action}|${[...p.nodes].sort().join(',')}`))
        const seen = await env.PULSE.get(key)
        if (seen != null && now - Number(seen) < DEDUPE_WINDOW_MS) {
          return json({ ok: true, deduped: true })
        }
        await env.PULSE.put(key, String(now), { expirationTtl: 90 })

        const id = `p:${ulid(now)}`
        await env.PULSE.put(
          id,
          JSON.stringify({ agent: p.agent, kind: p.kind, nodes: p.nodes, action: p.action, t: now }),
          { expirationTtl: ENTRY_TTL }
        )
        return json({ ok: true })
      }

      if (url.pathname === '/pulse' && request.method === 'GET') {
        // list() is sorted by key name; ULID keys sort oldest first, so the
        // newest sit at the tail — walk the last page and reverse.
        const list = await env.PULSE.list({ prefix: 'p:', limit: LIST_CAP })
        const keys = list.keys.slice(-LIST_CAP)
        const out = []
        for (const k of keys) {
          const raw = await env.PULSE.get(k.name)
          if (raw == null) continue // TTL expired between list and get
          try {
            const e = JSON.parse(raw)
            out.push({ agent: e.agent, kind: e.kind, nodes: e.nodes, action: e.action, age: Math.max(0, now - (e.t ?? 0)) })
          } catch {
            /* a torn write never sinks the snapshot */
          }
        }
        out.sort((a, b) => b.age - a.age) // newest first (smallest age wins)
        return json({ updated: now, total: out.length, agents: out }, 200, {
          'cache-control': 'public, max-age=3'
        })
      }

      return json({ ok: false, error: 'not found' }, 404)
    } catch {
      // Never leak internals: an opaque failure is the whole error surface.
      return json({ ok: false }, 500)
    }
  }
}
