# FINAL-POLISH CONSULT — docneural (DS v4.1 flash, spend law: one generation)

You are the project's design consultant. The network pass (24cb6e5) SHIPPED:
nodes are NEURONS, wires are SYNAPSES, the view is the NEURAL NETWORK of docs.
The Owner's directive tonight: "No more copilot usage. Perform final audit and
polish with DS@CB." This is the LAST polish round before rest. Rule on the
findings below — verdict, priority order, exact copy, and anything I missed.

## LAWS (unchanged, binding)
- Svelte 5 runes + Vite + TS. No new deps/fonts/URLs. localStorage only.
- `--dn-*` tokens exact hex, both themes AA. 40px+ tap targets.
- Animation loops: desktop ≤6 total, phone 0 (phone network boots LOCKED).
- Data contracts keep their names (graph.json, ctx/, ?mode=graph, .nodes field).
- User-visible strings: neurons / synapses / neural network ONLY — never
  graph/nodes/edges. Bridges stay honest (dashed amber, provenance, "recovered
  from text reference — not in the source link graph").
- Trail must not regress. Lead does not write product code (worker implements).

## VERIFIED CURRENT STATE (final audit sweep v2, 71/72 checks, 0 console
## errors, 0 failed requests on every surface; vitest 106/106; svelte-check
## 0 errors / 16 baseline warnings; build 3.9s)
- emacs TOC tree: 106 branches, depth-2 default (47 open), expand-all → 106,
  filter "kill" → 9 hits each with breadcrumb path. WORKS.
- org TOC: flat reading-order list, window-rendered (25 rows in window,
  spacer math sums to exactly 319 @ 40px), "flat list · no structure in
  export" honesty badge. WORKS.
- Network controls (desktop dark): lock flips label + persists to
  localStorage; zoom pill shows after Zoom in; spacing pill shows after
  spacing +; all 6 controls ≥40px taps. WORKS.
- Phone: boots LOCKED (aria "Unlock network positions"), 6 controls reachable,
  0 loops. WORKS.
- Synapse card: opens on canvas wire pick, carries citing ctx line + both
  endpoints + Open buttons + light-trail + copy-citation; Esc closes. WORKS.
- Palette: cmd-K opens; Documents / Chapters / Neurons sections all answer.
  Library drawer: cmd-shift-K or the tabs "+" opens; filter answers. WORKS.
- Trail: chip "TRAIL 2", panel lists 2 stops with copy/clear. No regression.
- Ask panel: free-brain first run, modal, Esc closes. WORKS.
- Layout chip cycles lattice → cluster. WebGL-off honesty notice renders.
- Live Pages (khaalidrafi.github.io/docneural/) matches local: WebGL ok,
  1385x787 field, 0 errors.

## FINDINGS (evidence-backed; rule each: SHIP / DROP / RESHAPE)

F1. RENAME MISSES (3, user-visible):
  a. FilterBar.svelte:33 `aria-label="Search nodes"` → must say neurons.
  b. NotePreview.svelte:127 kicker text `node // preview` → neuron.
  c. Home.svelte:148 hero tagline `docs are neurons · citations are axons ·
     fire together, wire stronger` — "axons" is a different structure
     (axon is the fiber, synapse is the connection); Owner's glossary says
     citations ARE the synapses. Propose exact replacement tagline that
     keeps the rhythm: "docs are neurons · citations are synapses · fire
     together, wire stronger" — or better, you rule.

F2. URL alias: `?mode=network` currently does nothing (boot falls back to
  reader/home); only `?mode=graph` deep-links into the view. Accept
  `network` as an alias at the URL contract boundary (one parse point,
  store.svelte.ts:383), keep `graph` working forever (contract law). Also
  accept `?mode=neurons`? You rule which aliases, if any.

F3. Synapse card citing-line can be info-header boilerplate: ctx/<id>.json
  lines are picked at export time; 148/1921 sampled (7.7%) are pure
  Prev/Up/Next header strings, e.g. card shows "Previous: platform
  Reference, Up: Platforms Contents]" with no citation prose. Runtime data
  has exactly ONE string per wire — cannot pick an alternative line. Options:
  a. detect boilerplate (starts with Previous:/Up:/Next: and <25% prose
     after stripping) and render the honest fallback "navigation header —
     no prose citation recorded" instead, keeping the wire's endpoints;
  b. strip the tokens and show whatever prose remains (may go empty);
  c. leave as is. You rule; prefer honesty without losing usefulness.

F4. Plate copy arithmetic: status plate reads "…30917 SYNAPSES · 3 SRC ·
  +3 recovered" but 30917 − 30915 = 2 (bridges.json dedupes 3 refs → 2
  wires). "recovered" counts REFERENCES (3), sitting next to a WIRE count.
  A careful reader computes a mismatch. Propose exact plate copy. Candidate:
  `+3 refs → 2 wires recovered` (too long for the plate?) or `+2 recovered
  (3 refs)`. You rule the exact string AND whether the synapse-card legend
  line must match.

F5. NotePreview hint plate (top-right of network view, "select a neuron —
  its text lands here"): text OVERFLOWS its dashed border on desktop and
  phone (verified screenshots). Fix sizing (fit-content + max-width +
  padding), keep the dashed reticle language, never clip mid-word.

F6. Control pair order inconsistency: spacing pair renders [− +], zoom pair
  renders [+ −] (from "Zoom in" first). Align both pairs to the same
  visual order. You rule which (universal calculator convention [− +]
  suggested; keep aria-labels unchanged).

F7. Phone status plate weight: "arrows on selection · 30917 synapses
  exceeds paint budget" renders a large 3-line plate mid-field on phone.
  Options: phone-only tighter copy ("arrows on selection"), collapse to a
  one-line pill, or leave. You rule; desktop unchanged.

## DO-NOT
- Do not touch data contracts, export pipeline, or corpus files.
- Do not add deps/fonts/URLs; no new animation loops (phone stays 0).
- Do not regress trail, 40px taps, AA themes, localStorage-only.
- No marketing superlatives; honesty over gloss.

## DELIVER (terse, no code)
1. VERDICT per finding F1..F7: SHIP / DROP / RESHAPE (+ why, one line).
2. EXACT COPY for: hero tagline, plate recovered string, boilerplate
   fallback line, phone plate line, any aria-label rewording.
3. PRIORITY ORDER for one worker pass tonight (impact ÷ risk).
4. CATCHES: anything the audit missed that you can infer from this brief.
