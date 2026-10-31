## 1. VERDICT

- **Reads right:** the trail (lit route + chip + sheet + copy-path) is the only surface that already explains *why* two neurons are joined; per-wire `ctx` prose is the asset everything else should be built on; token discipline (exact hex, dark+light AA) and the palette/prev-next/breadcrumb spine are sound and should not be touched.
- **Reads weakest:** the TOC is the trust-killer — both manuals show a non-structure ("Top" / "alphabet"), so the reader has no map, which makes every other navigation affordance a workaround. Second: the network is *decorative, not readable* — no direction, no hit test, no lock, no scale control; 30,915 synapses you cannot interrogate or hold still.
- **Structurally false claim:** "neural network of docs" is currently a lie at the data layer — 0 cross-manual synapses across 3 manuals. Fix the vocabulary and the direction, but the mined cross-manual kind is what makes the name true; ship it in the same release or the rename reads as marketing.

## 2. GLOSSARY

| Replace | Term | Where it lands |
|---|---|---|
| graph | **neural network** | page title, status plate (`Neural network · 1,386 neurons · 30,915 synapses`), empty state, `aria-label` on canvas region |
| nodes | **neurons** | filter panel counts, tick-box scope label (`Scope: 212 neurons`), palette result type, tooltips, aria |
| edges / wires / connections | **synapses** | legend, hover chip, synapse panel header, `aria-label` on rows, status plate |
| the view mode chip | **Neural View** | top-bar chip label + `aria-label="Neural View — layout: Spread"`; layout sub-chips keep Cluster / Spread / Lattice (they name physics, not graph vocabulary) |
| (new) cross-manual edge | **bridge synapse** | legend, panel badge `bridge · recovered`, status plate `+N recovered` |

Why: *neuron* is precise — a document section that fires only when cited; *synapse* is precise — directed (source→target) and weighted (in-degree), which is exactly the `{source,target}` object plus its ctx line. "Neural network" is the only one of the four that survives being said out loud to a stranger. Data contract stays `graph.json` / `ctx/<id>.json` / `'<src>><tgt>'` — never rename the wire format.

## 3. SPEC

### Tokens (new, AA-checked)

| Token | Dark | Light | Ratio (dark/light) |
|---|---|---|---|
| `--dn-synapse` | `#5A6B80` | `#7A8798` | 3.5 / 3.4 (non-text, ≥3 ✓) |
| `--dn-synapse-lit` | `#7FE3D0` | `#0E7C6B` | 12.6 / 4.8 |
| `--dn-synapse-mined` | `#F0B35A` | `#8A5A00` | 10.4 / 5.6 |
| `--dn-synapse-hover` | `#9FB0C4` | `#3E4C5E` | 8.7 / 8.2 |
| `--dn-panel-bg` | `#121820` | `#FFFFFF` | — |
| `--dn-panel-ink` | `#E8EDF2` | `#121820` | 13.9 / 17.5 |
| `--dn-panel-ink-dim` | `#A7B4C2` | `#5A6B80` | 8.4 / 5.5 |
| `--dn-toc-guide` | `#26313D` | `#DCE2E9` | decorative |

### Ask 1 — read & switch among 100+ docs

Both, one keybinding each. **Promote the palette to the primary switcher**: full-screen overlay, 640px, rows 44px, three sections — Documents / Chapters (current doc) / Neurons — fuzzy match, ↑↓ Enter, Esc. **Add a reader library drawer**: left rail toggle, 320px, virtualized, grouped by manual, each row = title + `N neurons · M synapses`, recents (localStorage `dn.library.recents`, max 8) pinned on top, current doc marked. Tabs survive as "highlights" (Owner's call), horizontally scrollable, 40px, trailing `+` opens the drawer.
Keys: `⌘K` / `Ctrl-K` = switcher; `⌘⇧K` / `Ctrl-Shift-K` = library drawer. Empty state: "No document matches — 3 manuals loaded." Loading: 3 skeleton rows, no spinner loop.

### Ask 2 — TOC

Builder fix first: if the computed root has exactly one child, descend and promote that child's children to depth 1 (kills the "Top" row).
- Default open depth **2**; the current section's ancestor chain force-expanded; state in localStorage `dn.toc.open.<manual>`.
- Rows 40px, indent 16px/level, virtualized window (handles 800 rows), max 4 levels rendered, deeper levels collapse into a `+N more` row.
- **In-TOC search: yes** — 40px field pinned at top of rail, filters flat with breadcrumb path per hit (`Org › Export › Backends`), 12 result cap + "refine".
- **Expand/collapse-all: yes** — single icon button, two states only (depth 2 ↔ all).
- **org gets instead of A–Z:** a heading-derived tree — parse h1–h3 from the exported body, build a synthetic hierarchy, badge the rail header `structure inferred from headings` (dim ink, 11px). If fewer than 2 heading levels resolve, group by top-level heading in reading order. Never A–Z.
- Empty: "No chapters parsed — showing reading order."

### Ask 3 — cross-manual synapses

Mining pass scans bodies for `(manual)Node`, resolves `Node` against known titles, emits `kind:"mined"`, `provenance:{pattern, charOffset, manualPair}`. Rules: literal pattern match only, no fuzzy scoring; unresolved or ambiguous (2+ title matches) → dropped, counted in a debug field, never rendered. **Cap 250**; if more are found, keep highest-confidence and report `+N recovered` in the status plate. Styling: `--dn-synapse-mined`, 1.5px, dashed `[4,3]` (dash = inferred, not recorded). Panel shows `bridge · recovered` badge and ctx text `Recovered from text reference "(org)Export" — not in the source link graph`. Legend gains one row. Empty: "0 bridge synapses recovered."

### Ask 4 — arrows

**Three-tier, never all-at-once.** (a) Selected neuron's synapses: always arrowed (already lit). (b) Hovered/clicked synapse: arrowed. (c) A `Direction` toggle in view options draws arrows on *all visible* synapses only when visible count ≤ **1,500**; above that it auto-degrades to (a)+(b) and shows `Arrows on selection — 30,915 synapses exceeds paint budget`. Default: toggle ON (so it self-degrades honestly at full corpus, and reads correct the moment a filter scopes it). Arrowhead: 7px base at zoom 1, scaled `clamp(5, 7/√zoom, 11)`, drawn offset from target radius so it never overlaps the dot; same fill as its line, no stroke. Phone: static only, no pulse.

### Ask 5 — spread + lock

Spacing default ×1.0 (= link.distance 140), range **0.6×–2.0×**, step 0.2; repulsion scaled by the same k; applying = one-shot reheat, alpha 0.25, 60 ticks, then stop.
**Lock = freeze the simulation**, not pin-and-drag: the ticker stops, coordinates stay where they are, pan/zoom still work, selecting a neuron does **not** reheat, trail lighting still applies. Unlock resumes with alpha 0.3. Default: **unlocked on desktop, locked on phone** (a running ticker is an animation loop, and phone budget is 0). Persisted per layout: `dn.lock.<layout>`. Button: 44×44, bottom-right stack, directly above zoom, icon `lock/lock-open`, `aria-pressed`, active fill `--dn-synapse-lit`.

### Ask 6 — zoom + spacing buttons

Control stack bottom-right, 44×44 buttons, 8px gap, order: Lock → Spacing ± → Zoom ± → Reset.
- Zoom **0.4×–2.5×**, step ×1.2, `+`/`−`, wheel/pinch untouched, `0` = reset. Readout pill appears on change, fades after 1.2s (CSS only).
- Spacing **0.6×–2.0×**, step 0.2, readout `1.4×`.
- Both use force-graph's existing camera/force API — no new rAF, no new dep. Disabled state at range ends: 40% opacity, `aria-disabled`.

### Ask 7 — synapse click

Screen-space hit band **6px** each side (12px total), constant regardless of zoom; hover = `--dn-synapse-hover`, 3px stroke, `cursor:pointer`, floating chip with first 60 chars of ctx. Click opens **right card 360px desktop / bottom sheet 60vh phone**: ctx line (full 160 chars, scrollable), endpoints as two 44px rows (`source → target`, each with manual badge and "Open" action), then `Light trail through this synapse`, `Copy citation` (reuses trail copy-path formatter). Empty ctx: `No citing line recorded`. Esc / backdrop closes; selection persists.

### Ask 8 — vocabulary

Apply the table above in one pass; grep for `graph|node|edge|wire|synapse` in user-visible strings and aria, not in code identifiers or file names. Status plate becomes the single canonical sentence.

## 4. OPEN RULINGS

- Layout names (Cluster/Spread/Lattice) stay — they describe physics, and renaming them adds vocabulary instead of removing it.
- Arrows default ON with auto-degrade, not OFF — Owner must see the feature without first discovering a toggle.
- Lock is freeze-not-pin — pinning would let a drag silently corrupt a layout the trail export depends on.
- Phone defaults to locked — keeps the 0-animation-loop law intact without a special case in the renderer.
- TOC search lives in the rail, not the palette — chapter lookup is a within-doc act, and the palette is already carrying three result types.
- Mined synapses are dashed and capped — a recovered wire must never be mistakable for a recorded one.
- Library drawer *and* palette — browsing 100 docs and jumping to one are different intents; one form would fail one of them.

## 5. DO-NOT

1. Do not draw arrowheads on all 30,915 synapses, or add a second canvas/WebGL layer to afford it — it will melt paint and break the 6-loop budget.
2. Do not synthesize cross-manual synapses by similarity, embedding, or "related" scoring — literal `(manual)Node` matches only, or the network becomes fiction.
3. Do not add a rAF loop, a new dependency, or a new font for zoom/spacing/lock — camera and force APIs plus a one-shot reheat already cover all three.
