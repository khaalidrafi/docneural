# CONSULT 1 — COLOPHON EXPANSION (burn order #3)

You are deepseek-v4.1-flash, serving via codebuddy. This commission: replace docneural's footer colophon with a full provenance + design-system colophon. Paste-ready markup + copy only.

## REAL FACTS (use exactly these; never invent)

- Site: docneural — a static, public documentation reader. Corpus = 1386 nodes / 30915 wires from 3 GNU manuals: GNU Emacs (791 nodes), Org (319), Guix (276), plus this aggregator itself.
- Pages are pre-exported org fragments served read-only by a Svelte 5 + Vite SPA on GitHub Pages. No accounts, no cookies, no trackers, no external requests. The wire graph and Plate are computed from the corpus' real cross-references.
- Themes: dark = night terminal (primary), light = clean paper. Type: JetBrains Mono (identity: headings/nav/labels/code), Inter (prose), Electrolize (wordmark display only).
- Design system: 9-step type ramp (--dn-text-2xs..4xl), 4 tracking tokens (tight/base/wide/mega), cyan+acid-only chrome, 3 hairline tiers, 16-arm reticle brackets, 3 sanctioned desktop loops, 0 phone animations, glyph vocabulary = 8.
- Existing colophon columns are titled: METHOD / CONTRACT / MACHINE (keep these three column concepts, expand under them).

## LAWS

Markup/content only — no JS. No new external URLs or fonts. WCAG AA both themes. Placeholder slots in [BRACKETS] for values I will inject (do not invent them). Semantic HTML (footer, nav, dl/dt/dd, address). No emoji. Glyph vocabulary: › · — ‹ ▤ ▚ only.

## Deliver (single response)

1. The complete replacement footer markup (paste-ready HTML/Svelte-agnostic), 3 columns METHOD / CONTRACT / MACHINE plus a final tick line. METHOD = how the site works (static export, computed graph, plate). CONTRACT = what the reader owes / what the site owes (AA, static, no tracking, canon integrity). MACHINE = build + design credits with a [DESIGNER-LINE] slot, [REVIEWER-LINE] slot, [GENERATED-STAMP] slot, and license pointer slots [EMACS-LICENSE] [ORG-LICENSE] [GUIX-LICENSE].
2. A one-line per-column design rationale (for my implementation notes, not shipped).
3. Keep total under ~6KB of markup. Start with the markup, no preamble.
