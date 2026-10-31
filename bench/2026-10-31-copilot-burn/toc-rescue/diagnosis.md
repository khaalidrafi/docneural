# TOC rescue diagnosis

## Checkout finding

`ai/main` in this checkout contains only the Vite shell (`src/App.svelte` and
`src/main.ts`). The implementation package named by `package.json` is an
external sibling (`docneural-ui`); `src/lib/core/graph.ts`,
`src/lib/reader/Toc.svelte`, `src/lib/reader/Home.svelte`, and
`src/lib/core/store.svelte.ts` are not present in the real current tree.
Consequently, a source-accurate unified diff against this HEAD cannot be
constructed or applied here. The proposed diff is preserved in
`toc-fix.patch` as a review artifact for the sibling package; it deliberately
does not pretend to be an applicable patch to this checkout.

## Root causes

| Symptom | Root cause | Evidence and consequence |
|---|---|---|
| Emacs shows one collapsed `Top` row | The hierarchy is valid, but the root node is rendered closed by default. A recursive `<details>` tree therefore hides every descendant. This is a presentation/default-state failure, not a missing-root failure. | Reproduction reports 751 resolvable `up` fields and 646 `next` fields, so the builder has enough hierarchy data. The fix must open depth 0 and 1 by default, while leaving deeper branches closed. |
| Emacs does not show chapter rows beneath `Top` | The current recursive row places descendants inside the `<details>` body. With the root closed, CSS and tree depth are not the cause: the nodes exist but are not painted. | The relevant current source is absent from this HEAD, so the exact `<details>`/`<summary>` lines cannot be quoted without inventing evidence. |
| Org shows A-Z groups | Org has zero usable `up`/`next` fields. The hierarchy builder consequently takes its “no roots/no links” fallback, which groups titles by their first letter. That fallback optimizes lookup, not manual reading order. | The reported fixture is 319 nodes with no `up`/`next` fields. A-Z is therefore selected by data shape, not by the manual’s chapter semantics. |
| Filtering can accidentally become network work | The filter belongs over the already-loaded chapter array and must only derive visible nodes locally. No `fetch`, store navigation, or graph reload belongs in the filter path. | The proposed component keeps filtering over `chapters` and debounces only the local query state by 250 ms. |

## Exact source-line limitation

The requested exact quotations cannot be supplied honestly: all four named
files return “path does not exist” in `ai/main`, and no tracked ref in this
checkout contains them. The only exact relevant current lines available are:

```json
// package.json
"description": "... this Vite+Svelte shell mounts the docneural-ui theme
// (../docneural-ui, formerly synapt) against that data."
```

```svelte
<!-- src/App.svelte in ai/main -->
<DocneuralApp base={import.meta.env.BASE_URL} title="docneural" />
```

These lines establish why the requested implementation files are outside the
checked-out repository. Once the sibling package is checked out, replace the
evidence column with line-numbered excerpts from its actual HEAD before
applying the patch.

## Proposed Org fallback heuristic

When hierarchy links are absent, normalize each title by removing a leading
chapter number/section marker, punctuation, and stop words. Extract the first
meaningful two-token prefix (one token for a known singleton prefix), then
merge prefixes sharing the same first token. Known section families are
recognized before generic prefixes: `Introduction`, `Getting Started`,
`Basics`, `Commands`, `Customization`, `Reference`, `Appendices`, and
`Indexes`. Sort groups by their first member's original corpus order, sort
members by corpus order, and retain the graph degree as a badge.

For a 319-node manual, accept groups only when there are at least four groups
and no group contains more than 60% of nodes. Otherwise return a flat,
degree-descending list (stable by corpus order) with wire-count badges. This
prevents a weak prefix distribution from producing a misleading tree and
explicitly forbids alphabet buckets for manuals larger than 24 nodes.
