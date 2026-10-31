# neural vocabulary rename

Source note: the checked-out `docneural` repository contains only the Vite shell
and imports these components from the sibling `docneural-ui` package. The line
references below are from the `docneural-ui` `ai/main` source snapshot; no
source files were changed here.

## glossary

| old term | new term | rationale |
|---|---|---|
| graph | neural network | Names the whole living system of documentation without generic data-structure language. |
| nodes | neurons | A document is a readable unit that participates in the network. |
| edges | synapses | A cross-reference is a signal-bearing relationship, not a geometric edge. |
| wires | synapses | Keeps the electric tone while making the relation precise and consistent. |
| connections | synapses | The network relation gets one canonical name. |
| link | synapse (network sense) | Use `synapse` for a document-to-document relation; keep `link` for a URL or copy-link action. |
| `SYNAPSES` mode chip label | `SYNAPSES` | Keep the Owner's exact term; the mode is already clear and compact. |
| `Open synapses` palette command | `Open synapses` | Keep the action label; change its hint from `graph mode` to `neural network mode`. |
| `1386 NODES - 30915 WIRES - 3 SRC` | `1386 NEURONS - 30915 SYNAPSES - 3 SRC` | The status plate reports the same facts in the canonical vocabulary. |
| `reading the graph` | `reading the neural network` | Makes the loading state understandable without the forbidden term. |
| `graph engine on/off` | `neural network engine on/off` | Describes the actual surface controlled by the toggle. |
| `This documentation graph did not load` | `This documentation neural network did not load` | States the failed surface plainly and accessibly. |
| `show in the synapses graph` | `show in the synapses network` | Keeps the descriptive accessible name while removing the generic noun. |
| `GRAPH` label | `NEURAL NETWORK` | The pinned chapter state points to the whole network, not an implementation. |
| `local graph` | `local neural network` | The rail shows a document's nearby network. |
| `open full graph` | `open full neural network` | Describes the destination of the rail action. |
| `graph mode` | `neural network mode` | Makes palette and assistive text agree with the view name. |
| `connections` in network status | `synapses` | Avoids a second name for the same document relationship. |
| `edges` in explanatory copy | `synapses` | Preserves the count while removing implementation vocabulary. |

**Data-contract exception:** keep the file and directory names `graph.json`,
`docs/`, and `ctx/` unchanged. They are exported-data contracts, not
user-facing network vocabulary. In visible copy, `graph.json` remains exactly
`graph.json` so the artifact name can be found and debugged.

## per-file replacement list

Line numbers refer to the `docneural-ui` source snapshot noted above. Comments
and implementation identifiers are excluded; this list covers rendered copy,
titles, placeholders, and accessible names.

### `src/lib/DocneuralApp.svelte`

| line | exact old string | exact new string |
|---:|---|---|
| 194 | `${store.data.nodes.length} NODES · ${store.data.links.length} WIRES · ${store.manuals.length} SRC` | `${store.data.nodes.length} NEURONS · ${store.data.links.length} SYNAPSES · ${store.manuals.length} SRC` |
| 230 | `See the citations as a graph` | `See the citations in the neural network` |
| 231 | `SYNAPSES` | `SYNAPSES` |
| 244 | `LINK DOWN` | `SYNAPSE LINK DOWN` |
| 253 | `graph engine on/off` | `neural network engine on/off` |
| 271 | `This documentation graph did not load` | `This documentation neural network did not load` |
| 273 | `The site builds its graph from an exported corpus.` | `The site builds its neural network from an exported corpus.` |
| 296 | `reading the graph · {store.manuals.length} channels · {store.data.links.length || '—'} wires` | `reading the neural network · {store.manuals.length} channels · {store.data.links.length || '—'} synapses` |
| 347 | `SYNAPSES · {store.visible.links.length} WIRES` | `SYNAPSES · {store.visible.links.length} SYNAPSES` |
| 379–382 | `A documentation reader enhanced with an org-roam graph. The written word is the home page; ⌁ synapses is the connection graph between docs — named for Hebb's law, since every citation resolved strengthens the link.` | `A documentation reader enhanced with an org-roam neural network. The written word is the home page; ⌁ synapses is the neural network between docs — named for Hebb's law, since every citation resolved strengthens the synapse.` |

Keep line 393 and line 396 as `copy a link`: those are URL-copy actions,
not document-network relations.

### `src/lib/reader/Home.svelte`

| line | exact old string | exact new string |
|---:|---|---|
| 152–154 | `wired into an org-roam graph of <strong>{synCount} firing synapses</strong>. Read it top to bottom, jump anywhere with ⌘K, or drop into the graph and follow the citations.` | `wired into an org-roam neural network of <strong>{synCount} firing synapses</strong>. Read it top to bottom, jump anywhere with ⌘K, or drop into the neural network and follow the citations.` |
| 173–174 | `Explore synapses` / `the whole graph, live` | `Explore synapses` / `the whole neural network, live` |
| 185 | `BUS · {synCount} WIRES · LIVE` | `BUS · {synCount} SYNAPSES · LIVE` |
| 229 | `corpus plate · 96 of 1386 nodes · phyllotaxis` | `corpus plate · 96 of 1386 neurons · phyllotaxis` |
| 244 | `collapsible readout of the top-96 highest-degree nodes plotted in the Corpus Plate above — one row per node, degree = real wire count` | `collapsible readout of the top-96 highest-degree neurons plotted in the Corpus Plate above — one row per neuron, degree = real synapse count` |
| 250 | `▤ degree = real wire count · corpora wear their graph hue · source of truth: graph.json` | `▤ degree = real synapse count · corpora wear their neural hue · source of truth: graph.json` |
| 254 | `index node` | `index neuron` |
| 368 | `This page is the map: the Corpus Plate plots the 96 most-connected of 1386 nodes, and the ledger below it counts every wire.` | `This page is the map: the Corpus Plate plots the 96 most-connected of 1386 neurons, and the ledger below it counts every synapse.` |
| 371 | `The sources strip lists three corpora, each in its graph hue — open a card to read that corpus; tabs hop between its manuals.` | `The sources strip lists three corpora, each in its neural hue — open a card to read that corpus; tabs hop between its manuals.` |
| 503 | `a static reader for a public corpus. 1386 nodes, 30915 wires, three GNU manuals — and this aggregator, the reading instrument.` | `a static reader for a public corpus. 1386 neurons, 30915 synapses, three GNU manuals — and this aggregator, the reading instrument.` |
| 504 | `export 2026-10-28 · 1386 nodes · 30915 wires · 3 corpora · AA-verified · 0 trackers` | `export 2026-10-28 · 1386 neurons · 30915 synapses · 3 corpora · AA-verified · 0 trackers` |
| 510 | `wire graph` / `30915 edges drawn from the corpus' real cross-references` | `synapse network` / `30915 synapses drawn from the corpus' real cross-references` |
| 511 | `a single reading surface over the graph: the 96 most-connected nodes on a phyllotaxis field. navigation is graph traversal` | `a single reading surface over the neural network: the 96 most-connected neurons on a phyllotaxis field. navigation is neural-network traversal` |

Leave the visible artifact name `graph.json` at lines 192, 238, 250, and 510
where it identifies the data contract.

### `src/lib/reader/ChapterNav.svelte`

| line | exact old string | exact new string |
|---:|---|---|
| 44 | `⌁ GRAPH: {store.checked.length} TICKED` | `⌁ NEURAL NETWORK: {store.checked.length} TICKED` |
| 57 | `Show {c.title} in the synapses graph` | `Show {c.title} in the synapses network` |
| 58 | `tick to isolate in the synapses graph` | `tick to isolate in the synapses network` |

### `src/lib/reader/DocReader.svelte`

| line | exact old string | exact new string |
|---:|---|---|
| 467 | `Copy a link to this position (y)` / `link` | `Copy a URL to this position (y)` / `URL` |

This is deliberately `URL`, not `synapse`: the control copies a deep link
for the reader, not a document-to-document relationship.

### `src/lib/ui/FilterBar.svelte`

The checked-out package stores this file at `src/lib/graph/FilterBar.svelte`;
the requested `src/lib/ui/FilterBar.svelte` path does not exist in the source
snapshot.

| line | exact old string | exact new string |
|---:|---|---|
| 33 | `Search nodes` | `Search neurons` |

### `src/lib/ui/CommandPalette.svelte`

| line | exact old string | exact new string |
|---:|---|---|
| 36 | `Open synapses` | `Open synapses` |
| 36 | `graph mode` | `neural network mode` |

### `src/lib/ui/CorpusField.svelte`

The checked-out package stores this file at `src/lib/reader/CorpusField.svelte`;
the requested `src/lib/ui/CorpusField.svelte` path does not exist in the source
snapshot.

| line | exact old string | exact new string |
|---:|---|---|
| 123 | `{docCount} nodes · {synCount} wires · {srcCount} src` | `{docCount} neurons · {synCount} synapses · {srcCount} src` |

### `src/lib/reader/SynapseRail.svelte`

| line | exact old string | exact new string |
|---:|---|---|
| 108 | `Synapses` | `Synapses` |
| 133 | `local graph` | `local neural network` |
| 137 | `open full graph ›` | `open full neural network ›` |

### `src/lib/reader/Toc.svelte`

| line | exact old string | exact new string |
|---:|---|---|
| 98 | `{degree.get(node.doc.id) ?? 0} wires` | `{degree.get(node.doc.id) ?? 0} synapses` |

### `src/lib/graph/DocneuralGraph.svelte`

| line | exact old string | exact new string |
|---:|---|---|
| 448 | `⌁ synapses unavailable` | `⌁ synapses unavailable` |
| 465 | `// laying out {store.data.links.length} connections` | `// laying out {store.data.links.length} synapses` |

The WebGL message at lines 445–446 is explanatory source context, not a
rendered label; if surfaced later, use `where the neural network would be`.

## view mode control

Keep `DOCS / SYNAPSES`. It is short, scannable, lowercase-site compatible in
meaning, and gives the two surfaces distinct verbs: read documents or inspect
their synapses. Do not spend the narrow segmented control on `NEURAL NETWORK`;
the longer phrase belongs in the button title and accessible descriptions.

## rejected terms

- **graph** — implementation language, generic, and explicitly forbidden by the Owner.
- **web** — broad and culturally overloaded; it does not say documentation.
- **mesh** — implies peer topology and equal participation, which these citations do not guarantee.
- **network map** — describes a picture rather than the active reading system.
- **fibers** — poetic but not precise enough for a cross-reference count.
- **axons** — useful as a directional metaphor, but the Owner's canonical relation is synapses.
- **pulses** — describes activity, not the durable citation relation.
- **links** — retain only for URLs and copy-link actions; using it for network relations would blur two accessible actions.
