# CONSULT 4 — ACCESSIBILITY CONFORMANCE LEDGER (burn order #4)

You are deepseek-v4.1-flash, serving via codebuddy. This commission: the accessibility conformance ledger — a documented WCAG AA statement for docneural, published ON the site as a collapsible <details> block in the colophon region. Paste-ready markup + copy; every number below is a REAL Chromium measurement (do not change them, do not add numbers).

## REAL MEASUREMENTS (2026-10-28 audit, live site, Chromium/playwright)

- Page-wide sweep of every visible text leaf (198-200/theme, alpha-composited colors): 0 WCAG AA text failures in BOTH themes; minimum ratios: 6.09:1 (dark) / 6.41:1 (light) against the 4.5:1 normal-text bar; 3.0:1 large-text bar also cleared everywhere.
- Keyboard: 14-stop Tab audit, 100% of stops show a visible focus indicator (outline or box-shadow); minimum focus-ring contrast 10.76:1 vs the 3:1 non-text bar.
- Motion: 3 sanctioned desktop loops (rail sweep, caret blink, pulse spark), 0 on phone; two finite entrances (mark-in, rise) excluded from the loop budget; prefers-reduced-motion honored.
- Targets: 44px minimum tap targets on phone.
- Structure: semantic landmarks (header/nav/main/footer), skip link, native <details> for collapsibles, org-fragment corpus rendered inside landmarked article shell.
- Disclosed decorative exception: 55%-alpha corner brackets measure 2.91:1 (dark) / 1.57-1.69:1 (light) — purely decorative frame glyphs, no information content, WCAG 1.4.11 exempts pure decoration; solid-ink bracket variants pass (6.39:1 / 4.71:1).

## LAWS

Markup/content only. Native <details>/<summary> ONLY. WCAG AA both themes. No emoji. Glyphs: › · — only. State the disclosed exception plainly (the ledger must not hide it).

## Deliver (single response)

1. The on-page <details> block: summary line ("Accessibility — conformance ledger, measured <DATE-SLOT>") + a compact table: dimension | contract | measured | status. Rows: text contrast, focus visibility, motion budget, tap targets, structure, decorative exception.
2. Three short paragraphs under the table: (a) how the audit is run (Chromium, every text leaf, both themes, toggle-verified), (b) what the decorative exception means and why it is exempt, (c) the re-audit cadence promise (every ship re-measures).
3. One-line rationale for my notes. Total under ~4KB. Start with the markup. No preamble.
