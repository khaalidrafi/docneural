# COOLER-2 — third design consult: PUSH HARDER

You are the DESIGNER of record for docneural (https://khaalidrafi.github.io/docneural/) — a
terminal-paper corpus reader: monospace spine, hairline rules, cyan-on-void chrome, a
phyllotaxis "Corpus Plate" of the real corpus graph. Two of your consults are already
implemented and live: (1) the 23-directive COOLEST pass (audit 6.1/10), (2) the 18-op
refinement (filament wordmark, geometric spacing top, border-tier roles, light-accent
lineage, radius 2/4/6, LED state-change, kv telemetry strip, kicker mega-step, focus
rings, paper material). Everything below is SHIPPED.

The OWNER reviewed the live result and issued one line:

    "Design should be cooler. Push ds-flash@codebuddy HARDER!"

That is your brief. Not more token tuning. The system is now typographically sound and
law-clean — but sound is not COOL. We need the version a designer screenshots.

## A. Current state (all shipped — do NOT re-issue these)

Tokens: 9-step type ramp .625rem→clamp(3rem,7.2vw,5.25rem); lh 1.08/1.3/1.4/1.6/1.72;
tracking .05/.14/.26/.40em; spacing 2/3.5/5.5rem top; borders #14202d/#33597d/#6b9dc6;
radius 2/4/6px; glow 6/6/8px(acid); dark bg #05090f, raise #0d1520; light paper #fbfbfd,
sunken #eef1f5, accent #005a78.
Chrome hues: cyan #00e5f5 + acid #3ef04a ONLY (pink/violet/amber survive solely inside
the graph canvas palette). Wordmark: 100deg filament #e8f1fb→cyan→#9de8f0 (light = plain
ink). Hero: two-column id + Corpus Plate; kicker = 2xs faint uppercase mega-tracked;
stats readout plate, solid-ink numerals; 2 CTAs.
Corpus Plate: real top-96 nodes (phone 40), golden-angle phyllotaxis (θ=i·2.399963,
r=3+4.3·√i), source-hued somas, halo rings, corner brackets, hairline frame — zero JS,
zero filters, zero images.
Sections: hairline row-index grid, mono indexes 01–04, tick rules under headers,
asymmetric section-head rhythm, h2 uppercase mono xl tight.
Motion: desktop 3 running loops (spark pulse ~2.4s, rail sweep transform, caret blink);
phone 0 animations; everything else state-change transitions ≤200ms.
Shell: header underline = border-strong; LED = static acid dot; focus = 2px outline
rings; glyph vocab: › ← → ▤ + · // —
Fonts (fixed, self-hosted): JetBrains Mono / Inter / Electrolize.

## B. Hard laws — violating ANY op voids it

L1 WCAG AA both themes (4.5:1 text, 3:1 non-text). No text-shadow rescues.
L2 Phone ≤700px: ZERO running animations, ≥44px tap targets, no 390px overflow.
L3 Desktop: ≤4 running loops TOTAL (3 slots used; at most 1 new loop, it must earn it).
L4 Chrome = cyan + acid only. No new hues in text/border/background chrome.
L5 No drop-shadow filters, no glitch, no scanlines, no backdrop-blur stacks, no
   box-shadow glow abuse (glow = live-readout semantics only).
L6 NO NEW JAVASCRIPT. CSS + markup only. No timers, rAF, IO, WAAPI, no <script> edits.
   Svelte markup/class restructure is fine. SVG allowed (static).
L7 Glyph vocabulary stays ≤8 (set above); prefer adding structure over glyphs.
L8 Fonts fixed. L9 script-hash law: JS chunks must stay byte-identical.
L10 Graph canvas surface untouched.

## C. Deliverable — the COOLER push

Part A — Blunt re-audit of the current state, score /10, name what still reads generic.

Part B — 12–16 directives, numbered OP-19 onward, format:

  OP-NN [DOMAIN] target: <selector/file>
    change: <concrete CSS/markup — implementable as-is>
    why: <the perceptual payoff>

DOMAINS we want hit (cover most of them):
  - SIGNATURE MOMENT: one composition people remember. The Plate is the candidate —
    evolve it (constellation reading, orbit emphasis, breathing scale on hover/focus,
    annotation callouts, depth via opacity tiers). CSS/SVG only.
  - CHOREOGRAPHY: entrance states, hover/focus motion identity, staggered reveals via
    transition-delay, link/underline behavior, CTA treatment.
  - TYPE DRAMA: hero display treatment, oversized section numerals, drop-line kickers,
    mixed mono/prose tension, vertical rhythm theater.
  - COMPOSITION: asymmetric grids, negative-space theater, full-bleed vs contained
    tension, footer/colophon as a designed moment.
  - STATE DESIGN: hover/focus/active/visited as a designed system, not afterthoughts.
  - MATERIAL: paper/void texture (subtle, zero images), border choreography, bracket
    language evolution, plate frame detailing.
  - LIGHT THEME: give paper its own identity — ink-wash hierarchy, wire-on-paper feel.

Part C — Per-directive expected signal (what a reviewer should see).

Rules for your output: markdown, no preamble, no restating this brief, ≤20KB. Every
change must be concrete CSS or markup I can paste. If an op needs a new token, define
it inline. If you must trade a law to achieve cool, propose the trade EXPLICITLY and
mark the op [LAW-TRADE] — do not silently violate.
