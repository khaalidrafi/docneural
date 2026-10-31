You are a consultant for DOCNEURAL, a static-site reader for public GNU manuals (Svelte 5 runes + Vite + TS, vendored force-graph WebGL painted by src/lib/graph/neuronEngine.ts). Work from the repo you are checked out into. CONSULTANT ROLE: write ONLY into bench/2026-10-31-copilot-burn/network-controls/ — never touch src/, styles/, or workflows.

OWNER DIRECTIVE (verbatim asks): links should use arrows to indicate linking direction. Spread view should use more distances among nodes to make it clear to the eyes, with an optional lock button where nodes don't move while navigating. Add zoom and distance buttons, too. Clicking on a connection should show the link.

VERIFIED STATE (measured): spread layout uses link.distance 140 and repulsion -(20 + labelWidth*0.5); direction shown only by moving particles on the selected node's wires; NO arrowheads; edges NOT clickable (no hit test anywhere); no lock/pause; zoom is wheel/pinch only (fitReadable camera fits, maxScale 1:1 for spread/lattice); corpus = 1386 nodes / 30915 wires, force-graph 1.51.

KEY FILES (read them): src/lib/graph/neuronEngine.ts (770 lines: applyLayout, paintNode, linkCurvature, linkDirectionalParticles), src/lib/graph/DocneuralGraph.svelte (mount, focus fields, trail chip), vendor/orui/src/lib/graph/GraphView.svelte (force-graph pass-through), src/lib/core/graph.ts (spreadStrength, labelExtent), styles/docneural-ui.css (--dn-* tokens).

DELIVERABLE: bench/2026-10-31-copilot-burn/network-controls/ containing:
1. spec.md — exact design: 
   a. ARROWS: which of the 30915 wires get arrowheads at full zoom-out without melting paint (constant? zoom-gated above a px threshold? selection/hover-only? degree-capped?), arrowhead size in px, color token (--dn-* name + dark hex + light hex, AA-checked), and the force-graph API used (linkDirectionalArrow* props) with exact values.
   b. SPREAD SPACING: new link.distance and repulsion values (target: labels never overlap at default zoom on 1386 nodes; justify from the existing labelExtent math), and whether distanceMax changes.
   c. LOCK: exact semantics — freeze simulation vs pin all positions (recommend one; force-graph has no pause API: spec the fx/fy pin path or the cooldownTicks(0) path, and how to reheat on unlock), button placement (corner chrome next to the layout chip), 40px+ tap, aria-label, locked-state token styling, default state = unlocked, phone behavior.
   d. ZOOM BUTTONS: +/− and fit controls, step factor (e.g. 1.25x per tap on engine.zoom), placement, 40px taps, disabled states at scale bounds.
   e. DISTANCE BUTTONS: +/- wire-length control: what re-runs (link.distance then reheat with short cooldown), range (80..280?), step, persistence (localStorage key name).
   f. EDGE CLICK: hit tolerance (force-graph edgeHoverPrecision value), hover affordance (line thickens? cursor), click panel content: fetch ctx/<source>.json on demand and show the citing line for key '<source>><target>', endpoints as jump buttons, 40px targets, panel placement that does not collide with the trail sheet, empty state when ctx has no entry.
2. controls-sketch.patch — unified diff sketch (does not have to compile; must be structurally correct against the real files) for the chrome: one vertical control cluster (lock, zoom+, zoom−, fit) top-right of the canvas, distance +/- bottom-right, edge-peek panel.
3. risks.md — top 5 perf/interaction risks with mitigations (paint cost at 30915 arrows, reheat jank on phone, WebGL context, label overlap regression, collision with trail route painter).
Constraints: animation loop budget desktop max 6 total including existing, phone 0 (no new keyframes); --dn-* tokens only; 40px+ taps; no new deps.
