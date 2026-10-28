# DOCNEURAL — ELECTRIC PASS (OP-56) · SPEC

Scope: CSS + markup everywhere; JS only in `neuronEngine.ts`, `spreadForces.ts`, `core/types.ts`, `core/layout.ts`, `store.svelte.ts`, `DocneuralGraph.svelte`, `SynapseRail.svelte`.

---

## 1. NEON-BLUE TOKEN MAP

**Thesis: the flip is 6 values, not 400 rules.** Every chrome rule already reads `var(--dn-accent)`, so re-valuing the *axis* re-skins the site in one block. Cyan does not disappear — it stops being chrome and survives as **data** (graph palette index 0 and the 8 source hues). Chrome collapses to one electric axis; the anti-mush guarantee comes from the three retained counter-hues (magenta, acid, hot).

| token | dark | light | role | contrast |
|---|---|---|---|---|
| `--dn-accent` | **#4d94ff** | **#0b3fbf** | THE WIRE as text: links, visited-adjacent, focus ring, h2 `//` sigil, table `th`, active labels, `.here`, kv values | 6.6:1 on #05090f · 6.2:1 on #0d1520 · 8.2:1 on paper |
| `--dn-accent-dim` | **#3b82f6** | **#0a3a8f** | `:visited`, recede state, scrollbar hover | 5.4:1 · 10.1:1 |
| `--dn-electric` | **#1f6bff** | **#1b4fd6** | FILL/WIRE only: header bus, seg thumb, CTA fill, h1 cap, chip fills, borders, caret, brackets | non-text 4.4:1 · 6.7:1; **white on it 4.56 / 6.7** |
| `--dn-electric-dim` | **#8fbaff** | **#2a63d6** | decorative half-tone (40% mixes, ticks, pads) | non-text only |
| `--dn-accent-2` | **#ff3366** | **#a30d55** | tags, `.more`, DOWN state, `pre.example` rail — the one warm counter-hue | 5.6:1 · 7.5:1 |
| `--dn-hot` | **#ffd93f** | **#7a4a00** | selection reticle (canvas), the live-synapse number | 14.4:1 · 7.3:1 |
| `--dn-acid` | **#3ef04a** | **#04610c** | LIVE only: status bars, resume marker, toc arrow | 13.1:1 · — |
| `--dn-violet` | **#bd00ff** | **#6b1fa8** | **retired from UI**; stays palette slot 3 | — |
| `--dn-wordmark` | `linear-gradient(100deg,#eaf3fc 0%,#8fc0ff 48%,#4d94ff 100%)` | `none` (ink) + 2px electric under-rule | brand filament | worst stop 6.2:1 · 16.7:1 |

**Literal flips (canvas cannot read `var()`):**

| literal | dark | light |
|---|---|---|
| `--dn-graph-link` | `rgba(31,107,255,0.30)` | `rgba(27,79,214,0.45)` |
| `--dn-dish-dot-1` | `rgba(31,107,255,0.10)` | `rgba(27,79,214,0.10)` |
| `--dn-dish-dot-2` | `rgba(255,51,102,0.05)` | `rgba(27,79,214,0.07)` |
| `--dn-glow` | `0 0 6px color-mix(--dn-accent 60%)` (unchanged recipe, new hue) | `none` |
| `--dn-graph-palette` | **UNCHANGED** `#00e5f5,#ff3366,#ffd93f,#bd00ff,#3ef04a,#ff7a45,#56c8ff,#ff5c8a` | **UNCHANGED** |

> Palette exception is deliberate: hues are `djb2(tag) % 8`, so re-ordering re-colours every corpus chip, tab and heading sigil in both themes. Data keeps 8 hues; chrome keeps 1.

**Disclosed decorative (1.4.11 / 1.4.3 exempt):** the 1px chromatic fringe (§3), all glows, the 40%-alpha brackets, scanline overlay, bus pads.

---

## 2. WHOLE-SITE ELECTRIC MAP

| surface | treatment (exact) | loops |
|---|---|---|
| **Home hero** | nameplate reticle → `--dn-electric`; under-rule 2px electric + 6px `--dn-electric-dim` left cap; `.regmark` electric; `.seam` 1px `color-mix(electric 22%)`, both reticle nodes 5px electric + 3px ring; `.plate` ticks electric; `.plate-cap` border-top electric 18%; stats reticle arms electric, `BUS` LED acid, `<b>` hot; CTA-1 fill `--dn-electric` + `#fff` ink, CTA-2 outline electric | **rail sweep RETIRED** → static 4px rail (transparent→#1f6bff 30%→#4d94ff) + one 10px charge-head at 62% + 3 pads. **caret kept** (electric). |
| **Reader chrome** | h1 rule `color-mix(--dn-src 45%, --dn-electric)`; h2 `//` → `--dn-accent`; links/visited/focus/selection/scrollbar auto (tokens); `th` electric, 2px head-rule same source→electric mix; row hover 6% electric; **blockquote rail → 3px electric**, fill 5% electric, text `--dn-fg-muted`; `pre` left rail stays source hue (data); SynapseRail `.graph-box` gains 1px electric inner keyline, `.expand` electric, `.here` electric | **`.spark` pulse RETIRED** (static lit glyph) |
| **Synapses HUD** | canvas link/dish literals (above); `.controls` border `mix(electric 30%)`; chips: 1px electric edge, 10% fill when active; scope/layout chip text `--dn-fg`, edge electric on hover; note-preview left edge `mix(--dn-src 45%, electric 55%)`, +2px electric top rule | skeleton orbs keep `sk-pulse` (transient) |
| **Help overlay** | scrim `bg-sunken 78%`; panel 1px `mix(electric 45%)` + 16-arm reticle in electric; `h3` electric + 6px acid dot; `dt` keycap: 1px border + 2px bottom rule, `--dn-accent`; `dd` muted; `close` electric fill + `#fff` + notch | none |
| **404 / fatal + missing** | `.fatal` panel: 1px electric frame, 2px **pink** left cap (only red on the page), kicker `// no route`, `.retry` electric fill + white; `.panel .why` accent-2; NotePreview `.missing` dashed electric edge | none |
| **Global** | `::selection` bg `--dn-accent` / ink `--dn-bg-sunken`; focus 2px `--dn-accent` + `--dn-glow`; scrollbar thumb `mix(electric 55%, border-strong)` | — |

**Loop ledger (budget is law)**

| loop | today | after |
|---|---|---|
| header bus rider | 3.4s | **keep**, 2.6s |
| hero rail sweep | 3.4s | **RETIRED** |
| `.spark` pulse ×3 | 2.4–2.6s | **RETIRED** (static) |
| hero caret | 1.1s | **keep** |
| boot dots | 1.2s | **replaced** by §4 (transient, 1 loop) |
| graph skeleton orbs | 1.8s | keep (transient) |

Desktop steady-state: **2** (was 4–5). Phone: **0**.

---

## 3. HEADER REDESIGN

One bar, 52px, three zones, no second row.

**Composition**
- `display:grid; grid-template-columns: auto 1fr auto; gap:16px; padding:0 16px;` — brand left, seg immediately after with 20px gap, keycap bank hard right. The old flex `margin-left:auto` scatter is gone; zones are columns, so the bar reads as an instrument with three bays.
- **Left cap rail:** `::before` 2px × 100% electric at `x:0`, with a 10px × 6px `--dn-electric-dim` notch at vertical centre. The bar now has a physical left edge.

**Brand**
- mark 20px + wordmark 15px/600 `--dn-font-display`, `--dn-track-tight`.
- **Chromatic fringe (rest):** one `text-shadow: 1px 0 0 color-mix(--dn-electric 45%)` — a 1px electric ghost, static.
- **Hover/focus:** full split `-2px 0 0 color-mix(--dn-accent-2 55%)`, `2px 0 0 color-mix(--dn-electric 65%)`, 120ms. Electricity is a *state*, not wallpaper.
- Light: ink `#0d1117` + 2px electric under-rule 4px below the baseline (no gradient on paper).

**Mode switch — the rocker**
- Track: 1px `--dn-border`, radius 2px, padding 2px, height 32px. **Brackets `[ ]` die.** Active cell carries a 3px electric lead tick at its left edge instead.
- Thumb: 28px, fill `mix(electric 16%)`, 1px `mix(electric 72%)` edge, **inset 0 1px 0 white 18%** (the keycap highlight) — the outer glow `--dn-glow-electric` dies.
- Label 11px/600 `--dn-track`, active colour `--dn-accent` (text-safe 6.2:1).

**Status plate**
- 28px tall, `0 8px` padding, 1px `mix(electric 30%)`, **2px acid left cap**, tabular figures, 2xs/`--dn-track-tight`.
- **The 7px LED dot dies** → a 3-bar meter: 3 × 2px wide, 4/7/10px tall, 2px gap, all `--dn-acid`. DOWN: one bar remains, turns `--dn-accent-2`, bars go square (non-colour cue preserved; text already says LINK DOWN).
- **Boot fix (markup only, no script edit):** the template becomes `{store.failed ? 'LINK DOWN' : !store.ready ? 'BUS · ARMING' : status}` — uses the existing derived, no new JS.

**Keycap bank**
- 4 cells in one 40px-tall bordered strip, 1px dividers at `mix(--dn-fg 12%)`; cells 40×40. The four independent outlined buttons die.
- `⌕` glyph electric-dim, `⌘K` hint 2xs superscript; hover = cell fill `mix(electric 10%)` + glyph `--dn-accent`.

**Bus**
- Keep 2px `--dn-electric` + 1px inner scan-stripe. Add **static solder pads**: `repeating-linear-gradient(90deg, transparent 0 46px, mix(electric-dim 70%) 46px 48px)` masked to the bottom 2px. Rider: 18% width, 2.6s `alternate`, transform only.

**Phone (≤600px)**
- Brand 13px (mark 16px); seg cells 44×44 icons only (unchanged); bank = 2 cells (FULL/FAST, theme) at 44×44; `kbd`/`keys` hidden (unchanged); status hidden (unchanged); padding `env(safe-area-inset-top) 8px 0`; bus 2px, pads at 32px pitch, rider parked.
- Every target ≥44px. Zero loops.

**Dies:** `[ ]` brackets, thumb outer glow, LED dot, four separate tool outlines, `--dn-glow-electric` usage.

---

## 4. LOADER SPEC

**Structure** (`.boot-wrap`, drawn on the board — no card fill in dark; 1px `mix(electric 28%)` frame + `.dn-hud` brackets):

```
row 1  [mark] DOCNEURAL            v— · 1392
row 2  ────────── charge line ──────────   (2px, bottom edge, same bus as header)
row 3  INDEXING CORPUS   {n | —}
row 4  reading the graph · {manuals} channels · 29,017 wires
row 5  ▁▃▅▇█  (voltage bars)
```

**Timeline (one-shot, ≤900ms, compositor-only)**

| t | event |
|---|---|
| 0 | frame rules draw in: `scaleX(0→1)` 180ms `cubic-bezier(.2,.8,.2,1)`, origin left/right |
| 60 | wordmark steps on: `opacity 0→1`, 180ms, `steps(3)` |
| 120 | **scan bar** crosses row 2 once: `translateX(-110%→110%)`, 520ms, `iteration-count:1` |
| 240 | rows 3–4 rise 6px / fade, 200ms, staggered 80ms |
| 600 | bars settle to `6/10/14/18/22px`, tallest `--dn-acid`, others `--dn-electric` |
| ready | panel unmounts |

**Honesty rule:** no fake percentage. Rows state only facts the boot actually knows (`graph.json`, node count when it lands, wire count). "Powering up" is carried by the charge line + scan + bars, not by a progress claim.

**Boot-loop ruling (one sentence):** *One boot-only infinite loop is legal because it lives entirely inside a subtree that unmounts on the first `store.ready` paint — it is capped at one loop, parked at ≤700px and under `prefers-reduced-motion`, and may never be hoisted onto the shell or the hero.*

**Reduced motion:** `animation:none` on every boot node; the panel renders its final frame (`POWERED · {n} chapters`). No layout shift — the final frame is the same height.

**No-JS:** `<noscript>` in `index.html`, same classes: mark + wordmark + `THE INDEX NEEDS JAVASCRIPT` + one line `graph.json · docs/*.html · llms.txt`. Static, no loop, inherits the paper/void floors.

**Handoff (no flash):** the panel is not a full-viewport overlay — it is the same floor as Home, under a header that never unmounts, so unmount reveals background that is already the right colour. The incoming surface's existing `in:fly` (200ms, y10) starts on the same frame; the boot's bottom charge line sits where the first content rule lands, so the eye reads a continuation, not a cut. Add `opacity` 90ms fade-in on the panel only (never a fade-out, which would need JS).

---

## 5. GRAPH — LATTICE MODE + LOCAL HEADINGS

### D1 · `layout: 'lattice'` (third mode)

**Ordering rule (deterministic, no RNG, no sim)**
1. source rank = index of `n.tags[0]` in `store.manuals` (corpus scan order),
2. then degree **desc**,
3. then `n.id` ascending.

Why: source is the only grouping the corpus guarantees; degree is the only ranking that survives a filter; `id` makes the field byte-identical across reloads. Cost: co-citation communities are *not* preserved — that is `cluster`'s job, and the chip says so.

**Spacing math** (hex lattice, authored at 1:1 into the measured room = `packRect(vp)`, panel inset + 24px pad already removed)

```
cols  = max(1, round( sqrt(0.866 * n * room.w / room.h) ))
rows  = ceil(n / cols)
p     = min( room.w / cols, room.h / ((rows - 1) * 0.866 + 1) )   // px pitch
x(i)  = (i % cols) * p + (row % 2 ? p/2 : 0)
y(i)  = row * p * 0.866
```

| n | room | cols×rows | pitch p | field |
|---|---|---|---|---|
| 30 | 1000×700 | 6×5 | **162px** | 888×700 |
| 1392 | 1000×700 | 42×34 | **24px** | 996×680 |

Every node has exactly six neighbours at `p` and a second ring at `2p` — that is the "fixed distance" promise, stated as geometry rather than as a force.

**Determinism / zero steady state**
```ts
// applyLayout(engine, 'lattice', room)
engine.d3Force('charge', null); engine.d3Force('link', null)
engine.d3Force('collide', null); engine.d3Force('fit', null)
for (const n of nodes) { n.x = …; n.y = …; n.vx = 0; n.vy = 0 }
engine.cooldownTicks(1)          // one tick, then dead. No reheat.
```
Guard the existing `if (!charge || !link) return` so lattice runs before it. `onEngineStop` fit is suppressed when `store.layout === 'lattice'`.

**Painter changes (`neuronEngine.ts`)**
- `radiusScale = min(1, 0.36 * p / 18.33)` applied to `somaRadius` — at p=24 that is 0.47 (somas 1.9–8.6), at p=162 it is 1. Keeps degree encoded, makes overlap impossible.
- Labels: `band 0 → deg ≥ 60`; `band ≥ 1 → all eligible`, claim grid unchanged. At p=24 the grid admits ≈180 names by construction (`(room.w/180) × (room.h/20.6)`) — the ceiling is geometric, not a knob.
- `focus.spread()` becomes `focus.mode()` returning `LayoutMode`.

**Chip UX (3-state cycle)**
`cluster → spread → lattice → cluster`. Text is the state, plus a 3-dot position indicator on the right edge:

| state | label | dots |
|---|---|---|
| cluster | `⌗ clusters` | `●○○` |
| spread | `▤ spread` | `●○●`… → `○●○` |
| lattice | `▦ lattice` | `○○●` |

`aria-pressed` true only for non-default; `aria-label` names the **next** state ("switch to lattice — even spacing"). Persisted via `writeLayout`; `loadLayout` accepts three words.

**Recommendation (owner call):** default `n > 300 → 'lattice'` instead of `'spread'`. Same corpus, zero physics, instant first frame; saved preference still wins.

**Camera:** `zoom(1, 0)` + `centerAt(0, 0, 0)`. The field is built to the room, so k = 1 exactly — no tween, no lurch, `data-fit="1.000"`, `data-field` still written. Filter keystroke → re-sort + rewrite + instant reframe (O(n log n) at 1392, no simulation).

### D2 · Local graph headings (`SynapseRail`, 210px)

- **Who gets a heading:** center first (always), then 1-hop neighbours by degree desc. Cap **4 labels desktop / 6 phone**; if the local graph exceeds 24 nodes, cap drops to center + 2.
- **Exact px:** 9px/600 JetBrains Mono, drawn at `9 / globalScale` (constant screen size), baseline `y + r + 2.5`, halo stroke `2.9px`, max width **104px** (18 chars, `shortTitle` truncation at 18).
- **Ink:** dark `--dn-fg #e8f1fb` on `--dn-graph-bg #0a1524` = **16.7:1**; halo stroke `--dn-graph-bg` at 0.85. Light `--dn-fg #0d1117` on `#ffffff` = **18.6:1**; halo `#ffffff` at 0.9. No colour-only cue — the heading is text.
- **Hide rule (in order):** ① `globalScale < 0.75` → center only; ② box overlaps an already-claimed box (48px cell grid) → drop; ③ box within 4px of the canvas edge → drop; ④ budget exhausted → drop. Center never drops.
- Painter gains a `labels` flag on `NeuronFocus`; compact mode keeps `replace` somas (r = √val × 2.6) and adds the text pass after them.

---

## 6. DO NOT

1. **Do not set body/link text to `#1f6bff`.** It is 4.38:1 on `#05090f` — a fail. `#1f6bff` is fill/wire only; text is `#4d94ff` (6.6:1) / `#0b3fbf` (8.2:1). Same rule for white-on-electric (4.56:1, only at ≥600 weight or ≥14px bold).
2. **Do not add a third steady-state loop** to the header, Home or the HUD to sell "electric". Budget is 2 desktop / 0 phone. Any new loop must kill the bus rider or the caret by name, in the same commit.
3. **Do not animate the lattice or paint it per frame** — no reheat, no `shadowBlur`, no `filter`, no `backdrop-filter`, no `box-shadow` hover transitions on the canvas. Positions are written once, `cooldownTicks(1)`, and the camera is instant (`0ms`). A ticking lattice is the same freeze the corpus already paid for, with worse optics.
