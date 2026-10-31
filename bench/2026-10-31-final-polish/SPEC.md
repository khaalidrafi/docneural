# SPEC — FINAL POLISH PASS (2026-10-31, Owner: "final audit and polish with DS@CB")

Consult: scripts/consult/brief-final-polish.md → out-final-polish.md
(DS v4.1 flash, one generation). Audit base: sweep v2 71/72, vitest 106/106,
svelte-check 0 errors / 16 warnings, build 3.9s, 0 console errors everywhere.

## LAWS (binding)
Svelte 5 runes + Vite + TS; no new deps/fonts/URLs; localStorage only;
`--dn-*` tokens exact hex both themes AA; 40px+ taps; animation loops desktop
≤6 / phone 0 (phone network boots LOCKED); data contracts keep names
(graph.json, ctx/, `?mode=graph` canonical); user-visible strings say
neurons/synapses/neural network — never graph/nodes/edges; bridges stay
honest (dashed amber, provenance, "not in the source link graph"); trail
must not regress. Lead does not write product code; worker implements + tests.

## F1 · RENAME MISSES + THE MISSING LEDGER TEST (priority 1)
1. `lib/graph/FilterBar.svelte:33` aria-label `Search nodes` → `Search neurons`.
2. SAME component: visible label `filter chapters` → `filter neurons`
   (the control filters canvas neurons — store.svelte.ts:419-445). Keep
   placeholder `title contains…`.
3. `lib/reader/NotePreview.svelte:127` kicker `node // preview` →
   `neuron // preview`.
4. `lib/reader/Home.svelte:148` tagline →
   `docs are neurons · citations are synapses · fire together, wire stronger`.
5. CREATE `src/lib/core/vocab.test.ts` (vocab.ts:8 claims it exists — it
   never did; that is why F1 survived). Assert:
   a. every USER_VISIBLE_STRINGS entry matches /^((?!\b(graph|nodes|edges)\b).)*$/i
      outside the data-contract allowlist (graph.json, ctx/, `?mode=graph`,
      `.nodes` field, URLs);
   b. a source scan of `src/**/*.svelte` for `aria-label=`, `title=`,
      `placeholder=`, `alt=` attribute literals carries no
      \b(nodes?|edges?)\b / "graph view" (allowlist: data-contract strings).

## F2 · URL ALIASES (priority 6, additive, one parse point)
store.svelte.ts:383 parse point: accept `graph` (canonical, forever) +
`network` + `synapses` — case-insensitive, trimmed. Reject `neurons`
(entity, not a destination). Unknown value → home silently (unchanged).
UI never emits an alias (links keep `?mode=graph`). Tests in store.test.ts
beside :310-324: graph, network, synapses, case variant, unknown value.

## F3 · BOILERPLATE CITING LINES (priority 7 — LAST, only new predicate)
Detect at ONE shared helper (e.g. core/vocab.ts or core/ctx.ts — worker's
call): a ctx line is boilerplate iff it contains ≥2 DISTINCT labels among
`Previous:` `Up:` `Next:` OR exactly one label plus a bracket-link residue
(`]…Index]`). (Measured: 1,030/17,400 values hit the ≥2 rule, 36 the
residue rule. A prose-ratio rule provably misses
`Next: Previous: The Fill Prefix Up: Filling Text` — do not use ratios.)
Five consumers, all must route through it:
- card DocneuralGraph.svelte:668 → render
  `navigation header — no prose citation recorded`
- hover chip :657 → `navigation header — no prose citation`
- clipboard :632 → OMIT the quoted line; copy bare `[A](?doc=a) → [B](?doc=b)`
- SynapseRail.svelte:152 → same card string
- LinkPeek.svelte:34 → same card string
Empty state `No citing line recorded` unchanged. Bridges:
bridges.ts:97 `mergeBridges` sets `context: b.ctx[0]` — prefer the FIRST
NON-boilerplate line from provenance for context; provenance array itself
stays full (honesty). Trail untouched.

## F4 · PLATE COUNTS WIRES (priority 4)
Plate `+{n} recovered` counts bridge WIRES, not references: with 2 wires /
3 refs show `+2 recovered` (closes 30915+2=30917 arithmetic; same length,
zero layout risk). Refs stay visible in the card provenance only. Update
the vocab.ts:18 ledger entry to carry the suffix. Synapse-card legend and
`bridge · recovered` badge unchanged. `.status` is display:none ≤900px
(DocneuralApp.svelte:800,838) — desktop-only change, no phone cost.

## F5 · HINT PLATE OVERFLOW (priority 2)
NotePreview hint (top-right, "select a neuron — its text lands here")
overflows its dashed border (desktop + phone screenshots). Fix: fit-content
width + `max-width: 18rem` cap + wrap (2 lines max) + correct padding; text
may never clip mid-word nor grow the reserved corner (corner-avoidance pass
DocneuralGraph.svelte:251-264 — stay inside the existing reservation).

## F6 · CONTROL PAIR ORDER (priority 3)
Both `.nc-pair`s render [− +] left-to-right. Swap the ZOOM buttons in the
DOM (out first, in second) so glyphs AND handlers AND disabled bounds travel
together (`+` must not inherit ZOOM_MIN). aria-labels unchanged.

## F7 · PHONE STATUS LINE (priority 5)
`nc-status` phone-only copy: `arrows: selection only` (one line at 180px;
current string is ~440px of text at 10px/0.14em). Desktop copy unchanged.
This is the nc-status element, NOT the top .status plate.

## ORDER
F1(+vocab test) → F5 → F6 → F4 → F7 → F2 → F3. 1–5 are strings/CSS; F2
additive on the URL contract; F3 last (only regression-capable change) but
must ship tonight.

## GATES (worker runs, all green before commit)
- vitest: 106 + new (vocab.test.ts, alias tests, boilerplate tests) — all pass
- svelte-check: 0 errors, ≤16 baseline warnings
- npm run build ≤4.5s
- node /home/z/my-project/scripts/audit-sweep.mjs → 72/72 (preview on :4173)
- Produce ONE 390px phone screenshot of the network corner showing
  F4+F5+F7 together (/tmp/audit/phone-corner-after.png via a tiny playwright
  script is fine) — the only three findings competing for that corner.
- Commit (do NOT push): message
  `polish: final audit pass - vocabulary ledger test, URL aliases, honest boilerplate fallback, plate wires count, hint fit, control order, phone status line`
