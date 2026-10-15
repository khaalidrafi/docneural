// tests/jev.test.mjs — question packs + the client call, no network.
// systemOne takes an injectable fetchImpl, so the exact wire format is
// asserted here: a malformed Jev request is a 422 in production, and a
// 422 costs the same latency as an answer without giving one.
import { describe, expect, it } from 'vitest'
import {
  JEV_URL,
  MODEL,
  candidateQuestions,
  choice,
  noul,
  routeQuestions,
  score,
  systemOne,
  triageQuestions
} from '../scripts/jev.mjs'

describe('question packs', () => {
  it('builds the three primitives', () => {
    expect(noul('Is it urgent?')).toEqual({ type: 'noul', instructions: 'Is it urgent?' })
    expect(choice('Pick one', { a: null }).type).toBe('choice')
    expect(score('Rate it', ['low', 'high']).criteria).toEqual(['low', 'high'])
  })

  it('route always offers the honest miss', () => {
    const q = routeQuestions(['org', 'emacs'])
    expect(q.route.type).toBe('choice')
    expect(Object.keys(q.route.criteria)).toEqual(['org', 'emacs', 'none'])
  })

  it('candidateQuestions builds one noul per candidate, all on one state', () => {
    const q = candidateQuestions(3)
    expect(Object.keys(q)).toEqual(['c0', 'c1', 'c2'])
    expect(q.c0.type).toBe('noul')
    expect(q.c2.instructions).toContain('state.candidates.c2')
  })

  it('triage covers urgency and frustration', () => {
    const q = triageQuestions()
    expect(q.urgent.type).toBe('noul')
    expect(q.frustration.type).toBe('score')
    expect(q.frustration.criteria.length).toBe(3)
  })
})

describe('systemOne', () => {
  it('posts state+questions to the System One endpoint and returns typed answers', async () => {
    let seen = null
    const fetchImpl = async (url, init) => {
      seen = { url, init }
      return {
        ok: true,
        json: async () => ({
          model: 'jev-1.13.0',
          answers: {
            route: { type: 'choice', choice: 'org', probabilities: { org: 0.9, emacs: 0.05, none: 0.05 }, confidence: 0.85 }
          },
          usage: { input_tokens: 120, output_tokens: 30 }
        })
      }
    }
    const j = await systemOne({
      state: { question: 'how do I capture todos' },
      questions: routeQuestions(['org', 'emacs']),
      key: 'tsk_test',
      fetchImpl
    })
    expect(seen.url).toBe(JEV_URL)
    expect(seen.init.method).toBe('POST')
    expect(seen.init.headers.authorization).toBe('Bearer tsk_test')
    const body = JSON.parse(seen.init.body)
    expect(body.model).toBe(MODEL)
    expect(Object.keys(body.questions)).toEqual(['route'])
    expect(j.answers.route.choice).toBe('org')
  })

  it('refuses without a key — BYO means BYO', async () => {
    await expect(systemOne({ state: 'x', questions: triageQuestions(), key: null })).rejects.toThrow(/no API key/)
  })

  it('surfaces API errors with the status', async () => {
    const fetchImpl = async () => ({ ok: false, status: 429, text: async () => 'slow down' })
    await expect(
      systemOne({ state: 'x', questions: triageQuestions(), key: 'tsk_test', fetchImpl })
    ).rejects.toThrow(/429/)
  })
})
