You are the Web Designer for DOCNEURAL (deepseek-v4.1-flash, the Owner's named design lane, FULL RIGHTS this cycle). A documentation reader whose corpus (Emacs/Org/Guix manuals, ~1392 nodes) renders as a neural graph. You designed everything the site currently is: the OP-19..32 cooler pass, the OP-33..55 full-rights pass, and the electric header (consults C+D).

THE OWNER'S NEW LAW, verbatim (his reply after seeing the electric-header ship):
  "I wanted neon blue and electric vibes on the WHOLE site, not just header. And, the header and initial loader look so dull. Improve them. And, add a mode for the graph where ALL nodes will maintain a fixed distance so that the overview can be seen clearly other than crowded clusters. Local graph should show node headings!"

Four asks, his priority order:
  A. NEON BLUE + ELECTRIC on the WHOLE site. Right now --dn-electric (#1f6bff dark / #004299 light) exists but ONLY the header wears it; the primary axis is still cyan --dn-accent (#00e5f5 dark / #005a78 light). He wants the neon-blue electric system everywhere: reader chrome, Home hero, graph HUD, help overlay, 404, links, selection, focus, scrollbars, tables, blockquotes.
  B. HEADER — still reads dull to him even after the bus pass. Redesign it harder: composition, hierarchy, treatments. It must stay a 1-bar instrument (no mega-header), keep every existing control (brand, DOCS/SYNAPSES seg, status readout, search, help, FULL/FAST, theme, live wire count) and the 44px phone targets.
  C. INITIAL LOADER — the boot panel ("reading the graph... N chapters indexed" + pulsing dots) is dull. Make the one-time wait feel like the machine powering up. It unmounts in ~300-800ms on warm loads.
  D. GRAPH FEATURES — the ONLY JS changes allowed this pass (Owner-ordered):
     D1. THIRD LAYOUT MODE for the synapses canvas: ALL nodes hold a FIXED, uniform distance — a clean even overview instead of crowded citation clusters. Existing: 'cluster' (force default, knots into per-doc blobs) and 'spread' (label-box packing + container fit, spreadForces.ts). Make the new mode DETERMINISTIC (no ongoing simulation after it settles — zero steady-state cost). Spec: ordering rule for which node lands where (by source hue? degree? co-citation communities?), the spacing math (px per node at N=30 and N=1392), the chip UX (current chip toggles 2 states — propose the 3-state cycle labels), and camera/fit behavior.
     D2. LOCAL GRAPH HEADINGS: the reader's SynapseRail mini-map (~210px canvas, current chapter's neighborhood) paints somas with NO labels. Spec which nodes get their heading painted, exact px, the ink token (AA on both canvas grounds — dark #0a1524-ish board, light paper), and the hide-rule when space runs out.

CURRENT FACTS (measured on canonical 34db7d2):
- Loop inventory: 7 declared infinite loops, ~4-5 steady-state by view (LED pulse, header bus pulse, status spark, hero caret, hero rail) + 2 transient (boot dots, graph skeleton). Phones: 0 (all parked). This budget is LAW: if you need new loops, name which existing ones die. The loader is transient — rule on whether a boot-only loop is acceptable (one sentence).
- Surfaces: shell header (glass bar, brand wordmark with chromatic fringe, seg switch with brackets, LED + status readout, 4 tool buttons, 2px electric bus with pulse); boot panel (plain); Home hero (constellation print, power rail, stat cards, source cards, CTA); reader (chapter nav, prose, tables, blockquotes, SynapseRail mini-map, backlinks); synapses mode (canvas, filter bar, scope/layout chips, note preview); help overlay; 404.
- Tokens: --dn-accent #00e5f5/#005a78 (cyan), --dn-accent-2 #ff3366, --dn-violet #bd00ff, --dn-acid #39ff14 (LED), --dn-hot #ffdf3f, --dn-electric #1f6bff/#004299 (header only). Dark bg #030608/#0c1219/#05090d, fg #eaf3fc. Light = clean paper.
- The graph engine: neuronEngine.applyLayout(engine, mode, room) with LayoutMode = 'cluster' | 'spread'; store.layout persists via localStorage; the chip lives in DocneuralApp markup. SynapseRail paints via its own mini canvas path.

HARD CONSTRAINTS I MUST OBEY:
- Svelte 5 + Vite. No new deps, no external URLs, no new fonts.
- WCAG AA BOTH themes: text 4.5:1, large 3:1, non-text 3:1. Every hex you give is AA-checked; decorative glows may be exempt but must be disclosed.
- Script freeze: everything except ask D must be CSS + markup. For D, keep JS edits inside neuronEngine.ts / spreadForces.ts / core graph files / store / DocneuralGraph / SynapseRail only.
- Phones stay STATIC (0 loops). 40px+ tap targets. prefers-reduced-motion parked.

Produce the SPEC, tight and concrete (exact hex/px/ms; AA-checked):
1. NEON BLUE TOKEN MAP — the whole-site flip: new values (or confirmations) for accent / electric / accent-2 / violet / hot / acid / wordmark stops in BOTH themes so the site reads neon-blue electric, not cyan, and not mono-blue mush. Table: token, dark hex, light hex, role.
2. WHOLE-SITE ELECTRIC MAP — per surface (Home hero, reader chrome, synapses HUD, help overlay, 404): the exact treatment, which loops get reused/retired, what stays static.
3. HEADER REDESIGN — the composition and treatments, markup-level changes allowed, both themes, phone variant. Name what dies to keep it clean.
4. LOADER SPEC — structure, the boot-loop ruling, reduced-motion + no-JS behavior, and the handoff to the site without a flash.
5. GRAPH: LATTICE MODE + LOCAL HEADINGS — D1 and D2 implemented-ready: ordering rule, spacing math, chip labels, camera, mini-map label rules.
6. DO NOT — 3 things that would break perf, AA, or the laws above.
No preamble.
