**1. VERDICT**

- **KEEP** — the honesty arms are the product: WebGL-off dish that says so in copy, the 18px label gate (a phone starfield is the truth, not a bug), 402/429 copy, and `data-theme` armed pre-paint. The token system (`--dn-*`, 134 definitions, three theme arms) is disciplined enough to extend without touching a component. The wordmark clamp and the 3.3s build are not to be re-litigated.
- **STILL WEAK** — (a) the phone graph's first paint is a *silent* starfield: 11.8px pitch gates labels, dots render, and nothing tells the visitor "zoom and the names fill in" — honest, but reads as "no content"; (b) the reader remembers *one* stop (`lastRead`: slug + anchor) — a 277-page manual has no memory of the road taken, so Home's "resume" is a point, not a journey; (c) at 390px the ask panel presents three same-weight controls (⚡ essence / quiz me / settings) around a single submit, so the primary action has no hierarchy.

**2. PICK**

**TRAIL — the visitor's reading path, pinned as a lit route on the graph, with a plain-text export.** Not the citation-depth slider: a slider is a knob nine visitors in ten never touch, and it *hides* the retrieval decision instead of showing it. Not graph focus mode: `roam.setFocus` already pans, so focus mode is a zoom button wearing a feature's coat. Trail wins on both halves of the money logic. **Retention:** it converts anonymous browsing into a possession — a lit constellation of the six pages you actually read, resumable, and lost if you go elsewhere (no account, no server, exactly the `saved`/`lastRead` contract already proven). **Agent consumability:** the same 12 slugs serialize to a deterministic, ordered route — a markdown block an agent can ingest without parsing the DOM, the graph, or a screenshot. One store, two readers. It also repairs weak point (b) directly and makes weak point (a) legible: lit stops give the starfield a figure at any pitch.

**3. SPEC — TRAIL**

**Surfaces touched (7 files, no new deps/fonts/URLs)**

| file | change |
|---|---|
| `src/lib/core/trail.ts` | **new**, ~70 lines: `loadTrail / appendTrail / clearTrail / trailText` |
| `src/lib/core/store.svelte.ts` | `trail = $state<string[]>(loadTrail())`; append inside `goto()` after resolve; `clearTrail()` |
| `src/lib/graph/neuronEngine.ts` | `focus.trail?(): string[]`, `focus.trailHops?(): Set<string>`; one `onRenderFramePost` painter; stop-rings in `paintNode` |
| `src/lib/graph/DocneuralGraph.svelte` | wire focus fields; `.trail-chip` + panel markup/CSS |
| `src/lib/reader/Home.svelte` | one 44px trail row above "resume" |
| `styles/docneural-ui.css` | 5 tokens × 3 arms (dark / `[data-theme='light']` / `prefers-color-scheme`) |
| `src/lib/core/trail.test.ts` | **new**: append order, dedupe, 12-cap FIFO, blocked-storage, missing-slug skip |

Storage: key `docneural:trail`, `string[]` of **slugs** (not ids — survives re-export, same reasoning as `saved.ts`), max **12**, append-only, **no reorder on revisit** (a re-read is not a new stop), FIFO eviction of the oldest. Read path drops slugs absent from `store.index().slugs` without pruning storage.

**Tokens (AA-verified against `--dn-bg` / `--dn-graph-bg` / `--dn-bg-raise`)**

| token | dark | light | measured |
|---|---|---|---|
| `--dn-trail` | `#7cc0ff` | `#0b3fbf` | 10.3 / 9.5 / 9.5 dark; 8.2 / 8.5 / 8.5 light |
| `--dn-trail-head` | `#eaf6ff` | `#0d1117` | 18.2 dark; 18.3 light |
| `--dn-trail-wash` | `rgba(124,192,255,0.14)` | `rgba(11,63,191,0.07)` | row `--dn-fg` on wash: 12.3 dark / 16.9 light |
| `--dn-trail-halo` | `rgba(124,192,255,0.28)` | `rgba(11,63,191,0.16)` | fill only (graphic) |
| `--dn-trail-w` | `2.2px` | `2.2px` | constant **screen** px (divide by `globalScale`), phone `1.6px` |

Chip text is `--dn-trail` (7.2:1 on wash) — passes AA for 11px; no separate ink token.

**Canvas painter** (`onRenderFramePost(ctx, globalScale)`, guarded, `save/restore`)
- Resolve `store.trail` → nodes; skip unresolved; `engine.graph2ScreenCoords(n.x, n.y)`; ≤12 points/frame.
- Segment *i→i+1*: real edge in `store.data.links` → solid `--dn-trail`, `--dn-trail-w / globalScale`, alpha 1. No edge → dashed `[2/gs, 6/gs]`, `1.2/gs`, alpha 0.55. **Honesty rule:** the route never claims a synapse that isn't there.
- Stops: halo circle r=6 (phone 5) `--dn-trail-halo`; ring `1.2px` at `r+3`. Head (most recent): ring `1.5px` at `r+3` + solid dot r=4 in `--dn-trail-head`.
- Cost: ≤12 lines + ≤12 arcs, one `Path2D`-free path, zero allocations per frame beyond the loop; no physics, no `graphData()` resync, **camera never moves**.

**Chrome**
- `.trail-chip`: absolute, `left:12px`, `bottom:calc(12px + env(safe-area-inset-bottom,0px))`; `height:40px` (phone `44px`); `padding:0 12px`; `gap:8px`; `border:1px solid color-mix(in srgb, var(--dn-trail) 45%, transparent)`; `background:color-mix(in srgb, var(--dn-bg-raise) 82%, transparent)`; `border-radius:var(--dn-radius)`; mono `11px`, `letter-spacing:var(--dn-track)`, uppercase, `--dn-trail`. Label `◈ TRAIL 7` + `▾`.
- Panel: `width:clamp(220px,24vw,272px)`, `max-height:46dvh`, `overflow:auto`, `padding:10px 0 6px`, `border:1px solid var(--dn-border-strong)`, `background:var(--dn-bg-raise)`; phone `left:12px; right:12px; width:auto`. Rows `min-height:44px`, `padding:0 12px`, index `10px` mono `--dn-fg-faint` tabular, title `13px/1.35` `--dn-fg`, hover `--dn-trail-wash`, current row `border-left:2px solid var(--dn-trail)`. Footer: `copy path` + `clear`, both `min-height:40px`, 11px mono.
- Home row: full-width, `min-height:44px`, `13px` prose — `◈ YOUR TRAIL · 7 STOPS — resume at <title>`.
- Focus: `outline:2px solid var(--dn-trail); outline-offset:2px`. Esc closes panel. `aria-expanded` on chip, `role="dialog"` off? No — `role="region" aria-label="reading trail"`, rows are buttons.

**States**
- **Empty** (<2 stops): chip absent, Home row absent, painter no-ops. No "start your trail" prompt — the feature appears when earned.
- **Loading**: none by construction (sync localStorage); never a spinner.
- **Error**: blocked/private storage → session-only array, identical UI, no error copy (same contract as `lastRead`). Re-exported corpus missing a slug → skip it; if <2 survive, hide chrome, keep storage. WebGL off → chip and copy still work, painter skipped: feature degrades to the text route.
- **Copy payload**: `# trail — docneural` + numbered `1. [Title](?doc=slug)` lines. Clipboard failure → button text `copy failed` for 1.6s, no toast.

**Animation budget: 0 new.** No keyframes, no loops, no `transition`, no `dashOffset` animation, no travelling dot, no particle on trail links. Desktop stays at its 2 CSS loops + the existing canvas stream; phone stays 0. Panel opens/closes by `display` toggle. Reduced-motion needs no arm because nothing moves.

**4. DO-NOT**

1. **Do not add `?trail=` to the URL.** `setUrl()` is the sole query writer and boot reads `?doc=` only; a second param creates a route nobody tests and a shareable link that breaks on a corpus re-export. The export is the copy block.
2. **Do not let the trail touch layout, physics, or camera.** No `zoomToFit`, no `centerAt`, no `applyGraphdata` on trail change, no new force. The 0.85–1.0 fit over 1386 nodes and the "a click never yanks the zoom" rule both die the moment a store write can move the field.
3. **Do not animate the route** — no marching dashes, no pulse on the head, no particles on trail edges — and do not put any of this on the ask panel. Dash-offset animation is a full-canvas repaint every frame on a mid-range phone; the phone budget is zero and the desktop budget has 4 loops of headroom that this feature does not get to spend.
