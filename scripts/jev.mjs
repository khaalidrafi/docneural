#!/usr/bin/env node
// jev.mjs — TypeSafe Jev (System One) client + docneural question packs.
//
// WHY: the export answers fast, cheap and verifiably — but "which manual
// answers this question" and "does this candidate actually answer it" are
// JUDGEMENT calls. Jev is TypeSafe's System One model: send a state and
// typed questions, get typed answers with probabilities back (choice /
// score / noul) in ~70 ms at ~$0.042 per 1M input tokens. Typed decisions
// are the point for a docs API: the answer is constrained to the options
// you passed in — it cannot invent a manual name — and the probability
// tells you when to fall back to plain BM25 instead of guessing.
//
// BYO key: TYPESAFE_API_KEY from the environment (or --key). The key
// belongs to whoever runs the process; it never ships in the site bundle
// and never touches a docneural server.
//
// CLI:
//   node scripts/jev.mjs --manuals org,emacs,guix "how do I capture todos"
//   node scripts/jev.mjs --triage "payouts failing for 3 days, need this NOW"
//
// API reference: https://docs.typesafe.ai/api

import { pathToFileURL } from 'node:url'

export const JEV_URL = 'https://api.typesafe.ai/v1/systemone'
export const MODEL = 'jev-latest'

/* ---------- the three primitives ---------- */

export const noul = (instructions, criteria) =>
  criteria ? { type: 'noul', instructions, criteria } : { type: 'noul', instructions }

export const choice = (instructions, criteria) => ({ type: 'choice', instructions, criteria })

export const score = (instructions, criteria) => ({ type: 'score', instructions, criteria })

/* ---------- docneural question packs ---------- */

/** Which manual answers this question? `none` is always an option, so an
 *  out-of-corpus question stays an honest miss instead of a forced fit. */
export function routeQuestions(manuals) {
  const criteria = {}
  for (const m of manuals) criteria[m] = null
  criteria.none = 'no manual in this corpus answers this'
  return {
    route: choice(
      'Which manual best answers the question in `state.question`? Pick "none" when no manual in this corpus can answer it.',
      criteria
    )
  }
}

/** One yes/no question per candidate: does this hit actually answer the
 *  question? All are judged against the SAME state in ONE call — Jev
 *  evaluates every question against the whole state, so N candidates cost
 *  one request, not N. */
export function candidateQuestions(n) {
  const qs = {}
  for (let i = 0; i < n; i++) {
    qs['c' + i] = noul(
      'Does `state.candidates.c' + i + '` (a docs chapter title + section heading) plausibly answer `state.question`?',
      { true: 'the section is about the topic asked', false: 'a different topic, or too generic to help' }
    )
  }
  return qs
}

/** Support-triage pack: urgency + frustration in one call. */
export function triageQuestions() {
  return {
    urgent: noul('Does this message convey urgency or time-sensitivity?', {
      true: 'explicitly time-sensitive',
      false: 'no urgency expressed'
    }),
    frustration: score('How frustrated does the writer sound?', [
      'calm, stating facts',
      'frustrated but civil',
      'very angry, strong language'
    ])
  }
}

/* ---------- the call ---------- */

export function keyFromEnv(env = process.env) {
  return env.TYPESAFE_API_KEY || null
}

export async function systemOne({ state, questions, key = keyFromEnv(), model = MODEL, signal, fetchImpl = fetch }) {
  if (!key) throw new Error('jev: no API key — set TYPESAFE_API_KEY or pass --key (BYO)')
  const res = await fetchImpl(JEV_URL, {
    method: 'POST',
    signal,
    headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
    body: JSON.stringify({ state, model, questions })
  })
  if (!res.ok) throw new Error('jev: ' + res.status + ' ' + (await res.text()))
  return res.json()
}

/* ---------- CLI ---------- */

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isMain) {
  const argv = process.argv.slice(2)
  const flag = (name, dflt) => {
    const i = argv.indexOf('--' + name)
    return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt
  }
  const key = flag('key', keyFromEnv())
  const manuals = flag('manuals', '').split(',').filter(Boolean)
  const words = []
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--key' || argv[i] === '--manuals') {
      i++
      continue
    }
    if (argv[i].startsWith('--')) continue
    words.push(argv[i])
  }
  const text = words.join(' ')
  if (!text) {
    console.error('usage: node scripts/jev.mjs [--key K] [--manuals org,emacs] [--triage] "the text"')
    process.exit(1)
  }
  const call = argv.includes('--triage')
    ? systemOne({ key, state: text, questions: triageQuestions() })
    : systemOne({ key, state: { question: text }, questions: routeQuestions(manuals.length ? manuals : ['the corpus']) })
  call.then(
    (j) => console.log(JSON.stringify(j.answers, null, 2)),
    (e) => {
      console.error(String(e.message ?? e))
      process.exit(1)
    }
  )
}
