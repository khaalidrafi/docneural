You are the designer of record for DOCNEURAL (DS v4.1 flash, CB lane). Multimodal-review follow-up consult. Owner law: "perform a complete multimodal review of the site. Check both code and looks, designs and features. Fix and improve."

VERIFIED CURRENT STATE (objective measurements, Chromium, zero opinions):
- Real-browser sweep: 40/40 checks pass, ZERO console errors / crashes / failed requests. Surfaces: home/reader/graph/ask/palette x dark/light x desktop(1440) x phone(390) + WebGL-off honesty arm.
- Graph: lattice boots on the 1386-node / 30915-wire corpus, camera fit 0.85-1.0. Label pitch gate: phone pitch 11.8px -> labels gated (clean starfield, fills in as you zoom); desktop 30.6px -> labels render. Dots always render.
- Fixed this round: duplicate-tag ingest crash (dedupe at ingest + render guards); hero wordmark container-fitted single line 26.2px@320 -> 39.6px@1440; reader header no overlap at 390px; data-theme armed synchronously pre-paint.
- AI (new): free public brain, no key. RAG answers cite [Title] sources + clickable FOLLOW-UPS chips; "⚡ essence" (TL;DR + KEY POINTS) and "quiz me" (3Q + answers) presets on every page; 60s patience; honest 402/429 copy; optional BYOK override stays.
- Gates: vitest 97/97, svelte-check 0 errors (16 known warnings), build 3.3s, ~307kB JS, ~81kB CSS. Vibe law holds: electric neon blue site-wide (#4d94ff dark / #0b3fbf paper), night terminal / clean paper duality.

NEXT-ROUND candidates on the table (from an interim consult): (1) neural path pinning — the visitor's reading trail drawn as a lit path on the graph; (2) citation-depth slider — how many hops of sources the AI answer may reach; (3) graph focus mode.

DELIVER (implementation-ready, exact values):
1. VERDICT — 3 bullets: what to keep, what still reads weak.
2. PICK — the ONE highest-value next feature for humans AND AI agents (money logic: retention + agent consumability), or a better one. One paragraph of why.
3. SPEC — exact: surfaces touched, new --dn-* tokens (name + dark hex + light hex, AA-checked), px/clamp() values, interaction rules, empty/loading/error states, 40px+ taps, animation budget (desktop total stays <=6 loops INCLUDING existing; phone 0 — static; no new keyframes on the ask panel), no new deps/fonts/external URLs.
4. DO-NOT — 3 things that would break perf, simplicity, or the laws.
No preamble.
