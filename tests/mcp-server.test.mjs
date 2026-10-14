// The MCP server speaks newline-delimited JSON-RPC; the cheapest honest
// test is to spawn it and talk to it, exactly like a client would.
// Uses the bundled demo export, so it runs in CI with no corpus fetch.
import { spawn } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')

/**
 * One or more JSON-RPC frames against a fresh server; resolves with the
 * response carrying the HIGHEST id seen (the last line is the call under
 * test, the earlier ones are the handshake or a resource list). Frames
 * are written together — the server answers in order — and the reader
 * keeps consuming until the wanted id lands.
 */
function rpc(lines) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [join(ROOT, 'scripts/mcp-server.mjs'), '--out', join(ROOT, '.export')],
      { stdio: ['pipe', 'pipe', 'pipe'] }
    )
    const wantId = Math.max(...lines.map((l) => l.id ?? 0))
    const responses = new Map()
    let pending = ''
    const timer = setTimeout(() => {
      child.kill()
      reject(new Error(`timeout waiting for id ${wantId}; got ${JSON.stringify([...responses.keys()])}`))
    }, 8000)
    const finish = (msg) => {
      clearTimeout(timer)
      child.kill()
      resolve(msg)
    }
    child.stdout.on('data', (d) => {
      pending += d
      let nl
      while ((nl = pending.indexOf('\n')) >= 0) {
        const line = pending.slice(0, nl).trim()
        pending = pending.slice(nl + 1)
        if (!line) continue
        try {
          const msg = JSON.parse(line)
          if (msg.id !== undefined) {
            responses.set(msg.id, msg)
            if (msg.id === wantId) return finish(msg)
          }
        } catch {
          /* keep reading */
        }
      }
    })
    child.on('error', (e) => {
      clearTimeout(timer)
      reject(e)
    })
    for (const l of lines) child.stdin.write(JSON.stringify(l) + '\n')
  })
}

const init = { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }
const call = (id, name, args) => ({
  jsonrpc: '2.0',
  id,
  method: 'tools/call',
  params: { name, arguments: args }
})

describe('mcp-server', () => {
  it('completes the MCP handshake', async () => {
    const res = await rpc([init])
    expect(res.result.serverInfo.name).toBe('docneural')
    expect(res.result.capabilities.tools).toBeDefined()
  })

  it('lists the five tools', async () => {
    const res = await rpc([init, { jsonrpc: '2.0', id: 2, method: 'tools/list' }])
    expect(res.result.tools.map((t) => t.name)).toEqual([
      'search',
      'node',
      'neighbours',
      'citation-path',
      'stats'
    ])
  })

  it('search finds the section by name, not just the page', async () => {
    const res = await rpc([init, call(2, 'search', { query: 'nav header rule' })])
    const hits = JSON.parse(res.result.content[0].text)
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0].heading.toLowerCase()).toContain('nav header rule')
  })

  it('node reports citations with their sentences', async () => {
    const res = await rpc([init, call(2, 'node', { slug: 'demo--Synapses' })])
    const rec = JSON.parse(res.result.content[0].text)
    expect(rec.title).toBe('The Synapse Model')
    expect(rec.degree).toBeGreaterThan(0)
    expect(rec.cited_by.length + rec.cites.length).toBeGreaterThan(0)
  })

  it('node rejects an unknown slug with a JSON-RPC error', async () => {
    const res = await rpc([init, call(2, 'node', { slug: 'nope' })])
    expect(res.error).toBeDefined()
  })

  it('citation-path walks the citation chain with its sentences', async () => {
    // Top has no citations at all (its only links are the nav header), so
    // walk a chain that exists: Intro cites Install, Install cites Agents —
    // wires are traversed in both directions, exactly as the reader does.
    const res = await rpc([
      init,
      call(2, 'citation-path', { from: 'demo--Intro', to: 'demo--Agents' })
    ])
    const rec = JSON.parse(res.result.content[0].text)
    // Undirected: Agents cites Introduction, so the walk may be 1 hop
    // (Agents → Introduction) or 2 (Introduction → Install → Agents) —
    // either way it must connect exactly the two endpoints.
    expect(rec.hops).toBeGreaterThanOrEqual(1)
    expect(rec.steps[0].from).toBe('Introduction')
    expect(rec.steps[rec.steps.length - 1].to).toBe('For Agents')
  })

  it('citation-path finds a direct wire either direction', async () => {
    const res = await rpc([
      init,
      call(2, 'citation-path', { from: 'demo--Intro', to: 'demo--Synapses' })
    ])
    const rec = JSON.parse(res.result.content[0].text)
    expect(rec.hops).toBe(1)
    expect(rec.steps[0].from).toBe('Introduction')
    expect(rec.steps[0].to).toBe('The Synapse Model')
  })

  it('citation-path reports honestly when there is no path', async () => {
    const res = await rpc([
      init,
      call(2, 'citation-path', { from: 'demo--Top', to: 'demo--Export' })
    ])
    expect(res.error).toBeDefined()
    expect(res.error.message).toMatch(/no citation path/)
  })

  it('stats counts the demo corpus', async () => {
    const res = await rpc([init, call(2, 'stats', {})])
    const rec = JSON.parse(res.result.content[0].text)
    expect(rec.chapters).toBeGreaterThan(0)
    expect(rec.wires).toBe(14)
  })

  it('serves llms.txt as a resource', async () => {
    const res = await rpc([
      init,
      { jsonrpc: '2.0', id: 2, method: 'resources/list' },
      { jsonrpc: '2.0', id: 3, method: 'resources/read', params: { uri: 'docneural://llms.txt' } }
    ])
    expect(res.result.contents[0].text).toContain('demo')
  })

  it('answers an unknown method with -32601', async () => {
    const res = await rpc([init, { jsonrpc: '2.0', id: 9, method: 'bogus/method' }])
    expect(res.error.code).toBe(-32601)
  })
})
