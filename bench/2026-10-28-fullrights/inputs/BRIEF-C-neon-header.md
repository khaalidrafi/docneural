# CONSULT C — NEON BLUE / ELECTRIC HEADER (Owner order, verbatim)

You are deepseek-v4.1-flash, DESIGNER of record for docneural, FULL RIGHTS, serving via codebuddy.
Your cwd is docneural-ui — read the real files before answering:
- styles/docneural-ui.css (tokens at :root lines ~150-330; header chrome: .shell, .brand, .spine, .seg, .tools, .status)
- src/lib/DocneuralApp.svelte (reader shell header: brand, mode segs, status pill OP-52, tools)
- src/lib/reader/Home.svelte (landing header uses the same shell + the OP-35 nameplate)

## THE OWNER'S ORDER, verbatim (2026-10-28 14:16Z)

    "Use neon blue, add electric vibe. Change header design."

This is the Owner overriding your earlier "filament, not neon sign" restraint where
the HEADER is concerned. Neon blue is now the doctrine for the top chrome. You own
every decision: hues, anatomy, signals, glyphs, composition.

## SCOPE

1. HEADER (the order's target): the reader-shell top bar (brand + mode segs +
   status + tools) on both landing and reader. This is where you spend the
   electric budget. Full anatomy change allowed.
2. ELECTRIC VIBE: where else a restrained electric accent earns its place
   (e.g. focus ring hue, active seg, LED, caret) — your call, keep it coherent.
3. The rest of the site stays as-is unless a hue change REQUIRES a token ripple.

## HARD LAWS (physics — the Owner repeats: performance MUSTN'T be compromised)

- JS IS FROZEN: your pass must be CSS/markup only (frozen-script gate = 14/14
  byte-identical vs HEAD). No new script blocks, no edits inside <script>.
- Loop budget: desktop currently 3 of 4 allowed — AT MOST ONE new loop, and it
  must be transform/opacity-only. Phone stays at 0 loops, always.
- No new deps, no new fonts, no new external URLs, no icon font. The 8-glyph
  vocabulary (› · — ▤ ⌁ ⌕ ▸ ☰) may gain AT MOST one glyph — pick well.
- No backdrop-filter, no blur, no large blurred glows (paint cost on potato
  hardware). Glow recipes stay short-throw (existing --dn-glow pattern) and
  only on live/focus states.
- WCAG AA both themes: text 4.5:1, large 3:1, non-text 3:1. Neon blue on the
  dark board is easy; on PAPER it must land darkened (follow the existing
  signal-darkening pattern, e.g. --dn-accent #00e5f5 dark -> #005a78 light).
- Print + reduced-motion blocks must stay honest.
- One color per source across the whole site is a contract (djb2-hashed canvas
  hues #56c8ff/#ff7a45/#ffd93f) — your neon blue must not collide with or
  re-pin those three.

## ANSWER FORMAT

## TOKENS      — exact :root edits (name, dark value, light value, why)
## HEADER      — the new anatomy, selector by selector, exact CSS/markup (cite
                 current selectors you replace; markup changes as exact diffs)
## ELECTRIC    — any other touchpoints, each with selector + exact CSS
## COST        — per change: bytes, layers, loops (must total <=1 new loop),
                 paint impact; confirm 0 JS
## RISKS       — what could regress and the guard

Be specific and complete — I implement verbatim, no taste of my own. Do not
restate the brief. If a region should NOT change, say "keep" and move on.
