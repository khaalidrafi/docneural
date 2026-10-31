You are the designer of record for DOCNEURAL (DS v4.1 flash, CB lane). The Owner issued a directive; you rule on the design. Single turn, no tools, answer from this brief.

VERIFIED CURRENT STATE (measured, Chromium + data, zero opinions):
- Static site, no server, no accounts. Corpus = graph.json: 1386 nodes (org manual 319, emacs manual 791, guix manual 276), 30915 links, ALL within-manual, cross-manual links = 0. Link objects carry {source,target} only. Per-wire prose lives in ctx/<id>.json keyed '<src>><tgt>' (the citing line, up to 160 chars) - fetchable per node on demand.
- TOC data: emacs = real info structure (751 up fields, all resolve; 646 next) but the built tree renders as ONE collapsed root row, so the Owner sees just 'Top'. org = ZERO up/next fields (export pipeline hole) so the builder falls back to A-Z letter groups - the Owner sees 'alphabet'. Both read as broken. (Reproduced in Chromium screenshots this session.)
- Network view: force-graph WebGL, layouts cluster/spread/lattice. spread: link.distance 140, repulsion -(20 + labelWidth*0.5). Direction shown only by moving particles on the selected node's wires. NO arrows. Edges NOT clickable (no hit test). No lock/pause of physics. No zoom or distance controls (wheel/pinch only).
- Doc switching today: manual tabs (one per corpus), reader left rail (ordered chapter list of the CURRENT manual, tick boxes scope the canvas), prev/next pager, command palette (title search, cmd-K), breadcrumbs. Nothing built for 'find and switch among 100+ docs fast'.
- Vocabulary is mixed: 'graph', 'nodes', 'edges', 'wires', 'synapses' all appear in user-visible strings across home, reader, filters, status plate.
- Laws: Svelte 5 runes + Vite + TS; vendored force-graph painted by neuronEngine.ts; --dn-* tokens exact hex, AA in dark AND light; 40px+ tap targets; animation loops: desktop max 6 total INCLUDING existing, phone 0; no new deps, no new fonts, no new external URLs; localStorage-only persistence; the just-shipped trail feature (lit reading route on the canvas + chip + sheet + copy-path export) must not regress.

OWNER DIRECTIVE (his words, lightly compressed):
1. Doc tabs can stay for highlights, but add a way to conveniently read and switch to multiple docs when there are 100 docs.
2. Still cannot see chapters/TOC: org shows alphabet, emacs just shows 'Top'. Fix.
3. Cannot see links across docs in the network. Emacs and Org MUST have some cross-references - where are they?
4. Links should use arrows to indicate linking direction.
5. Spread view needs more distance among nodes so it is clear to the eyes, with an optional lock button so nodes do not move while navigating.
6. Add zoom and distance buttons.
7. Clicking on a connection should show the link.
8. Rename: nodes are NEURONS, connections are SYNAPSES, the whole thing is the NEURAL NETWORK of docs. Never call it 'graph'. Pick the best, coolest terms.

DATA FACT for ask 3: the export pipeline dropped cross-manual references (makeinfo rendered them as plain text). A mining pass can scan doc bodies for '(manual)Node' text patterns and map Node to known node titles - a handful of honest cross-manual wires are recoverable, synthesized as a distinct kind with their provenance kept.

DELIVER (implementation-ready, exact values):
1. VERDICT - 3 bullets: what already reads right, what reads weakest in the current network + reader.
2. GLOSSARY - the rename table: for each of graph / nodes / edges / wires / connections / the view mode chip, give the single replacement term (neurons, synapses, neural network, network - or better) and where it appears (button labels, status plate, empty state, aria labels). One line on why the picks are cool AND precise. Data contract file names (graph.json) may stay.
3. SPEC per Owner ask (1-8): surfaces touched, exact new --dn-* tokens (name + dark hex + light hex, AA-checked), px values, interaction rules with 40px+ taps, empty/loading states. For the TOC: default open depth at 300-800 chapters, in-TOC search?, expand/collapse-all?, and what org gets INSTEAD of A-Z. For the doc switcher: pick the form (promote the palette, a reader library drawer, or both) and its keybinding. For lock: exact semantics (freeze simulation vs pin positions), default state, button placement. For zoom/distance: placement, step sizes, ranges. For arrows: which wires get arrowheads at 30915 wires without melting paint (constant vs zoom-gated vs selection-only), size. For edge click: hit tolerance, hover affordance, panel content (ctx line, endpoints, jump actions). For cross-manual wires: honesty rules for synthesized kind (styling, ctx text, count cap).
4. OPEN RULINGS - anything above where you had to choose: one line each on why.
5. DO-NOT - 3 things that would break perf, simplicity, or the laws.
No preamble.
