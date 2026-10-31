# copilot-burn campaign — 2026-10-31 night

Owner directive 2026-10-31T17:36Z: "Use Copilot CLI via CI as much as you can bcz the usage resets TONIGHT!"

## Law of this campaign (one night only)

1. Consultant role ONLY: every run writes its deliverable into
   `bench/2026-10-31-copilot-burn/<label>/` and MUST NOT touch `src/`,
   `styles/`, `.github/`, or any workflow file. The lead (glm-5.3-flash)
   harvests, reviews, and integrates via the normal worker lane.
2. Real work only: each brief targets the live Owner directive of
   2026-10-31 (network pass: neurons/synapses rename, TOC rescue, doc
   switcher, arrows, lock, zoom/distance, edge click, cross-manual wires).
3. Spend: the Owner explicitly authorized burning the remaining quota
   tonight ("as much as you can"). No retry loops on failure — a failed
   run is recorded, not re-billed.
4. Provenance: every run commits its full log (credits spent included)
   next to its deliverable. Nothing lands unattributed.

## Labels

- `glossary-rename` — the neurons/synapses/neural-network rename table
- `toc-rescue` — TOC tree rescue implementation sketch (default-open depth, search, expand-all, org fallback)
- `network-controls` — lock / zoom / distance / arrows / edge-click spec + code sketch
- `xref-miner` — cross-manual reference miner: scan site-corpus, map to node titles, emit proposed wires

Dispatch: one `workflow_dispatch` runs all labels in a matrix.
