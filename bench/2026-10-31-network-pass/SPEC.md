# NETWORK PASS — implementation spec (lead-merged)

Sources: DS v4.1 flash consult (ds-consult.md in this dir), copilot-burn wave 1
(glossary-rename, toc-rescue, network-controls, xref-miner), lead review 2026-10-31.
Target: docneural-ui @ ai/main, ONE commit, no push (lead pushes after review).

## 0. LAWS (hard)

- Svelte 5 runes, Vite, TS. No new deps/fonts/external URLs.
- --dn-* tokens only; every new token AA-checked in BOTH arms (values below).
- 40px+ tap targets everywhere new.
- Animation loops: desktop ≤6 total INCLUDING existing; phone 0 (lock defaults handle this).
- Data contracts stay: graph.json, docs/, ctx/, llms.txt names unchanged in copy and code.
- Trail feature (ab43c8e) must not regress: route painter, chip, sheet, copy-path.
- User-facing vocabulary: NEVER "graph" (nodes→neurons, edges/wires/connections→synapses,
  graph→neural network). Aria labels follow. Code identifiers/file names unchanged.
- Mode chip stays `DOCS / SYNAPSES` (Owner's own word) — but its hint copy loses "graph".
- No rAF loops added; camera/force APIs + one-shot reheat only.

## 1. GLOSSARY RENAME (one pass, all surfaces)

Apply to rendered copy, titles, placeholders, aria-labels ONLY (not code identifiers):
- status plate: `{n} NEURONS · {m} SYNAPSES · {s} SRC`
- `reading the graph` → `reading the neural network`
- `This documentation graph did not load` → `This documentation neural network did not load`
- `See the citations as a graph` → `See the citations in the neural network`
- palette command hint `graph mode` → `neural network mode`
- rail `GRAPH` → `NEURAL NETWORK`; `show in the synapses graph` → `show in the synapses network`
- `LINK DOWN` → `SYNAPSE LINK DOWN`; `graph engine on/off` → `network engine on/off`
- home/ledger/filter/colophon copy: nodes→neurons, edges/wires→synapses, graph→neural network
- `graph.json` stays literally `graph.json` in copy (artifact findability)
Files (verify by grep `graph|node|edge|wire` in user-visible strings):
DocneuralApp.svelte, Home.svelte, ChapterNav.svelte, DocReader.svelte, FilterBar.svelte,
CommandPalette.svelte, CorpusField.svelte, SynapseRail.svelte, Toc.svelte, DocneuralGraph.svelte.

## 2. TOC RESCUE

In `src/lib/core/graph.ts` (manualToc) + `src/lib/reader/Toc.svelte` + `Home.svelte` mount:
1. Single-child root descent: if the computed root has exactly one child, promote that
   child's children to depth 1 (kills the lone `Top` row for emacs).
2. Default open depth 2; ancestors of the active page force-expand (existing mark()).
   Persist open state per manual: localStorage `dn.toc.open.<manual>`.
3. Expand-all / collapse-all: one icon button, two states (depth 2 ↔ all). 40px+ tap.
4. In-TOC filter: 40px field pinned at rail top; local substring over chapter titles,
   250ms debounce, ≤12 results rendered as flat rows with breadcrumb path (`Up › Section › Page`).
5. org (no up/next data): FLAT reading-order list with degree badges — NEVER letter groups.
   Remove the A–Z fallback entirely. Rail header badge when flat: `flat list · no structure in export`
   (dim ink 11px). Empty state: `No chapters parsed — showing reading order.`
6. Virtualize if rows >300 (window render, no lib — container height / 40px rows).

## 3. NETWORK CONTROLS (canvas chrome)

Control stack bottom-right: vertical, 44×44 buttons, 8px gap, order top→bottom:
Lock → Spacing − / + → Zoom + / − → Fit/Reset. New chrome tokens:
`--dn-chrome-bg` dark `#121A24` light `#FFFFFF`; `--dn-chrome-ink` dark `#C7D3DF` light `#24303C`
(AA 9.0+/10.5+ on their bgs); active/pressed fill `--dn-synapse-lit` (below).
1. LOCK: engine.pauseAnimation() (verify the vendored force-graph exposes it; else freeze via
   cooldownTicks(0) after storing alpha). Unlock = resume + reheat alpha 0.3.
   Pan/zoom still work while locked; selection does NOT reheat; trail lighting unaffected.
   Default: unlocked desktop, LOCKED phone (0-loop law). Persist `dn.lock.<layout>`.
   Icons: lock / lock-open (inline SVG, no font). aria-pressed.
2. ZOOM: 0.4×–2.5×, step ×1.2 on engine camera zoom; Fit/Reset = existing fitReadable.
   Disabled ends: 40% opacity + aria-disabled. Readout pill (`1.4×`) fades after 1.2s CSS-only.
3. SPACING: multiplier k 0.6–2.0 step 0.2. spread defaults become:
   `link.distance = 220 * k`, `charge.strength = -(44 + labelWidth(title) * 1.1) * k`,
   `distanceMax = 520`. Apply = one-shot reheat (alpha 0.25, ~60 ticks, then stop).
   Persist `dn.spacing.spread` (k only; other layouts keep own spacing).
4. ARROWS (zoom-LOD, no toggle): selected neuron's synapses + hovered synapse always
   arrowed (selected set capped at 24 nearest); with no selection/hover → no arrows at
   zoom < 0.75, and at zoom ≥ 0.75 arrows on all visible synapses only when visible
   count ≤ 1500, else the selection/hover tier only + honest status line
   `arrows on selection · {n} synapses exceeds paint budget`.
   Implementation: force-graph linkDirectionalArrow* accessors (length 0 = no arrow),
   arrowhead clamp(5, 7/√zoom, 11)px, relPos offset from target radius,
   fill = the wire's own color (`--dn-synapse-lit` when lit, else `--dn-synapse`),
   resolved to literal before canvas. NO second canvas, no rAF. Reciprocal wires get
   their own head. Existing particles unchanged (selected node only).

## 4. SYNAPSE CLICK (edge interrogation)

In DocneuralGraph.svelte + vendored `vendor/orui/src/lib/graph/GraphView.svelte`
(minimal pass-through extension if the prop is missing) + neuronEngine.ts:
1. edgeHoverPrecision 6px; hover: stroke 3px `--dn-synapse-hover` + cursor pointer +
   floating chip (first 60 chars of ctx; ctx via existing loadContext cache — 1 fetch, cached).
2. Click opens card: 360px right card desktop / bottom sheet 60vh phone.
   Content: full ctx line (scrollable), endpoint rows 44px (`source → target`, manual badge,
   Open action → store.goto), `Light trail through this synapse` (extends the existing trail
   focus fields), `Copy citation` (reuse trail copy formatter).
   Empty ctx: `No citing line recorded`. Esc / backdrop closes; selection persists.
   New tokens: `--dn-panel-bg` dark `#121820` light `#FFFFFF`; `--dn-panel-ink` dark `#E8EDF2`
   light `#121820`; `--dn-panel-ink-dim` dark `#A7B4C2` light `#5A6B80`.
   Card must not collide with the trail sheet (shared overlay layer; card yields).
3. Wire color tokens (new): `--dn-synapse` dark `#5A6B80` light `#7A8798` (3.5/3.4 non-text);
   `--dn-synapse-lit` dark `#7FE3D0` light `#0E7C6B`; `--dn-synapse-hover` dark `#9FB0C4`
   light `#3E4C5E`; `--dn-toc-guide` dark `#26313D` light `#DCE2E9` (decorative).

## 5. BRIDGE SYNAPSES (makes the rename true)

Data: new committed artifact `public/sample/bridges.json` — array of
`{source, target, kind:'bridge', ctx, provenance}` from
docneural/bench/2026-10-31-copilot-burn/xref-miner/proposed-wires.json,
DEDUPED: guix--Documentation→emacs--Network-Security (2 hits → 1 wire, both ctx lines kept
in provenance array), org--Advanced-topics-in-ODT-export→emacs--File-Archives.
Store: fetchGraph() merges bridges.json (fetch fail = silently continue — corpus works
without it). Engine: bridge wires render 1.5px dashed [4,3] in `--dn-synapse-mined`
dark `#F0B35A` light `#8A5A00` (10.4/5.6); legend row `bridge · recovered (3)`;
status plate appends `+3 recovered` when bridges loaded; click panel badge
`bridge · recovered` with ctx note `Recovered from text reference — not in the source link graph`.
DO-NOT: never synthesize by similarity/embedding — literal recovered matches only.

## 6. DOC SWITCHER (ask 1)

1. Palette promotion (⌘K/Ctrl-K exists): three sections — Documents (all manuals, fuzzy),
   Chapters (current doc), Neurons (top-degree) — ↑↓ Enter Esc, 640px overlay, 44px rows.
2. Library drawer: left-rail toggle + trailing `+` on the manual tabs (40px). 320px drawer,
   grouped by manual, row = title + `N neurons · M synapses`, recents (trail-derived, max 8,
   localStorage `dn.library.recents`) pinned, current doc marked. Virtualize >200 rows.
   Keybind `⌘⇧K` / `Ctrl-Shift-K`. Empty: `No document matches — {n} manuals loaded.`
3. Manual tabs survive as highlights (Owner's call) — unchanged behavior.

## 7. TESTS (vitest, pure, offline) — new/extended

- manualToc: single-child descent; default-open depth 2; org fixture (319 nodes, no up/next)
  → flat list, never letter groups; filter returns ≤12 with paths.
- bridges: merge at ingest, dedupe, kind='bridge', fetch-fail tolerance.
- controls: spacing clamp 0.6–2.0, zoom clamp 0.4–2.5, arrow visibility predicate
  (zoom tiers, 1500 cap, 24-nearest cap), lock state persistence keys.
- rename: no user-visible string matches /\bgraph\b/i outside data-contract names
  (scan a curated string list exported from components).

## 8. ACCEPTANCE (lead will run)

vitest all green; svelte-check 0 errors (16 baseline warnings); build <5s;
real-browser sweep: TOC emacs shows chapter rows (not lone Top), TOC org shows flat list
(no letters), control stack present + lock freezes canvas (2 frames identical),
zoom buttons move camera, edge click opens card with ctx line, bridge wire visible with
badge, rename on status plate/palette/home, trail regression block, dark/light ×
desktop/phone × WebGL-off, zero console errors.
