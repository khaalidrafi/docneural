# CONSULT 2 — CORPUS-PLATE LEDGER (burn order #1)

You are deepseek-v4.1-flash, serving via codebuddy. This commission: a collapsible "Plate Ledger" — the human-readable index of the top-96 highest-degree nodes shown in the Corpus Plate. Paste-ready markup template + copy; I fill all 96 rows from real data.

## REAL FACTS (the schema examples below are REAL rows from the graph)

top-degree nodes (degree = real wire count):
1 | emacs | Concept Index | 4189
2 | emacs | Command Index | 3771
3 | guix | Programming Index | 3505
4 | emacs | Variable Index | 2460
5 | guix | Concept Index | 2298
6 | emacs | Key Index | 2258
7 | org | Main Index (The Org Manual) | 2037
8 | org | Variable Index (The Org Manual) | 1260
corpus: 1386 nodes / 30915 wires / 39 orphans / avg degree 44.6. The Plate plots the top 96 of these. Manual hue rule: each corpus wears its graph hue (emacs/org/guix chips differ).

## LAWS

Markup/content only — no JS. Collapsible via native <details>/<summary> ONLY. No new external URLs/fonts. WCAG AA both themes (rows must read on dark terminal AND clean paper). Semantic: real <table> or <ol> — pick ONE and justify in one line. Glyph budget: › · — ▤ only. Tap targets 44px on phone.

## Deliver (single response)

1. The complete <details> block markup: summary line (closed state must communicate what's inside + count), header row, legend, and the row anatomy as a REAL comment-marked template with 3 example rows filled from the facts above, plus 93 empty row comments like <!-- row 4 --> I will fill programmatically.
2. The CSS spec (class names + rules, paste-ready) for the ledger: zebra-free hairline rows, tabular numerals for degree, source chips, phone stacking, summary styling. Use existing token names (--dn-text-*, --dn-track-*, --dn-hairline-*) and define ONLY new component-scoped classes (.ledger*).
3. One paragraph: how the ledger ties to the Plate above it (voice: instrument documentation, not marketing).
Start with the markup. No preamble.
