#!/usr/bin/env node
// pulse-probe — live verification for dn-pulse (SPEC 4, workstream A).
// Lead runs this AFTER deploying the worker:
//   node scripts/pulse-probe.mjs [url]
// url defaults to https://dn-pulse.khalidrafi.workers.dev
//
// Asserts, in order:
//   1. POST a beacon -> 200 {ok:true}
//   2. GET /pulse    -> the beacon appears with the right shape
//   3. POST it again -> 200 {ok:true,deduped:true} (the 90 s dedupe guard)
//   4. POST junk     -> 400 (validation is real)
// Exit non-zero on any failed assertion.

const BASE = process.argv[2] ?? process.env.PULSE_URL ?? 'https://dn-pulse.khalidrafi.workers.dev'
const URL_BASE = BASE.replace(/\/+$/, '')

let failures = 0
function check(name, cond, detail = '') {
  if (cond) {
    console.log(`  ok  ${name}`)
  } else {
    failures++
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

const beacon = {
  agent: 'pulse-probe',
  kind: 'cli',
  action: 'read',
  nodes: ['org--Introduction', 'org--TODO-Items']
}

async function main() {
  console.log(`probing ${URL_BASE}`)

  const health = await fetch(`${URL_BASE}/health`)
  check('GET /health is 200', health.status === 200, String(health.status))
  check('GET /health body {ok:true}', ((await health.json()) ?? {}).ok === true)

  const t0 = Date.now()
  const post = await fetch(`${URL_BASE}/pulse`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(beacon)
  })
  const postBody = await post.json().catch(() => ({}))
  check('POST /pulse is 200', post.status === 200, JSON.stringify(postBody))
  check('POST /pulse ok:true', postBody.ok === true, JSON.stringify(postBody))

  // Edge cache is max-age=3 — poll briefly until the beacon surfaces.
  let snap = null
  for (let waited = 0; waited < 10_000; waited += 1_000) {
    const get = await fetch(`${URL_BASE}/pulse`, { headers: { 'cache-control': 'no-cache' } })
    check('GET /pulse is 200', get.status === 200, String(get.status))
    snap = await get.json().catch(() => null)
    const mine = snap?.agents?.find((a) => a.agent === beacon.agent)
    if (mine) break
    await new Promise((r) => setTimeout(r, 1_000))
  }

  const mine = snap?.agents?.find((a) => a.agent === beacon.agent)
  check('beacon appears in the snapshot', !!mine, JSON.stringify(snap ?? null))
  if (mine) {
    check('snapshot row shape', typeof mine.agent === 'string' && typeof mine.kind === 'string' &&
      Array.isArray(mine.nodes) && typeof mine.action === 'string' && typeof mine.age === 'number',
      JSON.stringify(mine))
    check('snapshot row carries our nodes', JSON.stringify(mine.nodes) === JSON.stringify(beacon.nodes), JSON.stringify(mine.nodes))
    check('age is fresh (< 60s)', typeof mine.age === 'number' && mine.age >= 0 && mine.age < 60_000 + (Date.now() - t0), String(mine.age))
    check('snapshot has updated+total', typeof snap.updated === 'number' && typeof snap.total === 'number')
    check('cache-control max-age=3', (await (await fetch(`${URL_BASE}/pulse`)).headers.get('cache-control') ?? '').includes('max-age=3'))
  }

  const again = await fetch(`${URL_BASE}/pulse`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(beacon)
  })
  const againBody = await again.json().catch(() => ({}))
  check('repeat POST is deduped', again.status === 200 && againBody.ok === true && againBody.deduped === true, JSON.stringify(againBody))

  const junk = await fetch(`${URL_BASE}/pulse`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ agent: '', kind: 'nope', nodes: 'all-of-them', action: 'read' })
  })
  check('junk payload is 400', junk.status === 400, String(junk.status))

  console.log(failures === 0 ? 'pulse-probe: all green' : `pulse-probe: ${failures} FAILURE(S)`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('pulse-probe crashed:', e?.message ?? e)
  process.exit(1)
})
