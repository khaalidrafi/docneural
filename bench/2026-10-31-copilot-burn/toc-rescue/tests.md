# TOC rescue tests

These are pure Vitest cases for the sibling `docneural-ui` package. They use
plain node fixtures only; they do not mount Svelte, fetch, or call a network.
The exported pure helpers proposed by `toc-fix.patch` are:
`defaultOpen`, `setAllOpen`, `filterToc`, `clusterOrRankFallback`, and
`hasAlphabetFallback`.

```ts
import { describe, expect, it } from 'vitest'
import {
  clusterOrRankFallback,
  defaultOpen,
  filterToc,
  hasAlphabetFallback,
  setAllOpen,
} from '../src/lib/core/toc'

describe('TOC open state', () => {
  it('opens the first two depths and closes deeper branches', () => {
    expect([0, 1, 2, 3].map(depth => defaultOpen(depth))).toEqual([
      true, true, false, false,
    ])
  })

  it('expands and collapses every branch without changing node order', () => {
    const tree = [{ id: 'a', children: [{ id: 'b', children: [] }] }]
    expect(setAllOpen(tree, true).map(n => n.open)).toEqual([true])
    expect(setAllOpen(tree, false).map(n => n.open)).toEqual([false])
    expect(setAllOpen(tree, true)[0].children[0].id).toBe('b')
  })
})

describe('local TOC filter', () => {
  const nodes = [
    { id: 'a', title: 'The Lisp Machine', children: [] },
    { id: 'b', title: 'Editing Basics', children: [] },
  ]

  it('matches a case-insensitive substring and does not broaden to words', () => {
    expect(filterToc(nodes, 'lisp').map(n => n.id)).toEqual(['a'])
    expect(filterToc(nodes, 'MACHINE').map(n => n.id)).toEqual(['a'])
    expect(filterToc(nodes, 'lis machine').map(n => n.id)).toEqual([])
  })

  it('returns all nodes for empty whitespace', () => {
    expect(filterToc(nodes, '  ')).toEqual(nodes)
  })
})

describe('linkless manual fallback', () => {
  it('clusters a synthetic 319-node manual into semantic groups', () => {
    const prefixes = [
      'Introduction', 'Getting Started', 'Basics', 'Commands',
      'Customization', 'Reference', 'Appendices',
    ]
    const nodes = Array.from({ length: 319 }, (_, i) => ({
      id: String(i),
      title: `${prefixes[i % prefixes.length]} topic ${i}`,
      degree: i % 9,
      order: i,
    }))
    const result = clusterOrRankFallback(nodes)
    expect(result.length).toBeGreaterThanOrEqual(4)
    expect(result.every(group => group.children.length > 0)).toBe(true)
    expect(result.flatMap(group => group.children)).toHaveLength(319)
  })

  it('never returns A-Z groups for a manual over 24 nodes', () => {
    const nodes = Array.from({ length: 25 }, (_, i) => ({
      id: String(i), title: `Chapter ${String.fromCharCode(65 + i % 26)} ${i}`,
      degree: i, order: i,
    }))
    const result = clusterOrRankFallback(nodes)
    expect(hasAlphabetFallback(result)).toBe(false)
  })

  it('uses a degree-ranked flat list when clustering is insufficient', () => {
    const nodes = Array.from({ length: 40 }, (_, i) => ({
      id: String(i), title: `Same ${i}`, degree: i % 5, order: i,
    }))
    const result = clusterOrRankFallback(nodes)
    expect(result.every(node => !('children' in node) || node.children.length === 0)).toBe(true)
    expect(result[0].degree).toBe(4)
  })
})
```

The component test should additionally assert that the input has a
`min-height` of `40px`, expand/collapse buttons have the same tap target, and
the debounce is exactly `250` ms. Those are DOM/style concerns and are
intentionally not included in the pure-function suite.
