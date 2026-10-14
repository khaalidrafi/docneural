// tests/slim-graph.test.mjs — the ctx prose must read as text, never as Org.
//
// These cases are the shapes scripts/flatten-context.mjs actually meets in the
// corpus, including the one that shipped broken: the exporter cuts the context
// window around a link, so a snippet can END inside one
// (`[[id:org--exporting::#Comment-Lines][Comment Lines`) and the rail then
// renders half a link to a human and to an LLM.
import { describe, expect, it } from 'vitest'
import { flatten } from '../scripts/flatten-context.mjs'

describe('flatten', () => {
  it('collapses a complete Org link to its description', () => {
    expect(flatten('See [[id:org--hyperlinks::#Follow-links][follow links]] now.')).toBe(
      'See follow links now.'
    )
  })

  it('collapses a target-only link and a <<cross-reference>>', () => {
    expect(flatten('Use [[id:org--exporting][exporting]] per <<org-export-dataset>>.')).toBe(
      'Use exporting per org-export-dataset.'
    )
  })

  it('keeps the description of a tail-truncated link', () => {
    expect(flatten('| =org-toggle-comment= | [[id:org--exporting::#Comment-Lines][Comment Lines')).toBe(
      '| org-toggle-comment | Comment Lines'
    )
  })

  it('drops a tail-truncated link that never reached its description', () => {
    expect(flatten('refiling and archiving, see [[id:org--refiling::#Interna')).toBe(
      'refiling and archiving, see'
    )
  })

  it('drops the corpse of a head-truncated link', () => {
    expect(flatten('es::#Export-Settings][Export Settings]] the backend honours it.')).toBe(
      'the backend honours it.'
    )
  })

  it('strips verbatim delimiters, ¶ separators and doubled spaces', () => {
    expect(flatten('Set =org-export-use-babel= to nil ¶ run ~make~  all.')).toBe(
      'Set org-export-use-babel to nil run make all.'
    )
  })

  it('drops a tail-truncated <<cross-reference>>', () => {
    expect(flatten('as described in see <<org-export-dispat')).toBe(
      'as described in see'
    )
  })

  it('leaves plain prose and empty input alone', () => {
    expect(flatten('Nothing wired here.')).toBe('Nothing wired here.')
    expect(flatten('')).toBe('')
    expect(flatten(undefined)).toBe(undefined)
  })

  it('never leaves bracket or angle-bracket residue', () => {
    // The property the browser check asserts: no snippet can leak markup.
    for (const s of [
      'a [[id:x::#y][desc]] b',
      'a [[id:x::#y][desc',
      'a [[id:x::#y',
      'x::#y][desc]] a b',
      'see <<target',
      '| =code= | [[id:z][Label'
    ]) {
      const out = flatten(s)
      expect(out, out).not.toMatch(/\[\[|\]\]|<<|>>|id:/)
    }
  })
})
