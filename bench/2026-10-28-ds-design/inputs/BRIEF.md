# DESIGN CONSULT — docneural-ui design pass (designer: DeepSeek V4.1-Flash)

You are the lead web designer for **docneural-ui** — a documentation SPA that renders an
org-roam corpus as an interactive neural graph plus a reading surface (SvelteKit, static
deploy, zero runtime deps). Implementation is handled by another engineer; you specify.

## Standing law (Owner, non-negotiable order of priority)

1. **Performance beats eye candy. Always.** Every visual choice must be cheap to paint:
   static composition, borders, spacing, type scale, color discipline. No animation-first
   thinking.
2. **Phones are a primary target.** The phone experience must be: performant, fully
   responsive, lightweight, and SIMPLE. Zero animations on phone. Native document scroll.
   Comfortable 40px+ tap targets. No horizontal overflow at 390px.
3. Identity stays: **dark = night terminal** (near-black blue field, one cyan signal color,
   restrained accents), **light = clean paper** (bright, calm, ink-text). Same structure,
   different material. Cyberpunk mood is carried by typography, tokens and composition —
   NOT by glow, motion, or effects.
4. Accessibility: WCAG AA minimum (4.5:1 body text, 3:1 large text / UI borders) in BOTH
   themes. Status colors must never be the only signal.

## Already removed (do NOT reintroduce)

Scan beams, animated constellation pulses, sheen sweeps, conic ring rotation, membrane
gradients, glitch text, drifting backgrounds, marquee data-bus. The site is static at rest.
Desktop allows at most a few cheap, pausable CSS loops (opacity/transform only) — propose
at most 2 or none.

## What this pass must improve (the actual mandate)

- A coherent **type scale + vertical rhythm** (currently inconsistent across sections).
- **Hero composition** on Home (static): hierarchy, alignment, restraint.
- **Surface design**: cards/panels/borders — layered flat design, consistent radii, hairline
  borders instead of heavy shadows.
- **Color token discipline**: fewer, purposeful tokens; fix ad-hoc hexes; keep the cyan
  signal role; make light theme feel like real paper, not inverted dark.
- **Phone composition**: single column flow, section stacking order, spacing, tap comfort,
  header behavior (sticky header currently uses backdrop-filter — replace with a cheap
  solid translucent background if you judge it expensive).
- Static visual interest: HUD/terminal details done with borders, punctuation, alignment,
  uppercase tracking — zero paint cost.

## Hard constraints

- JS is FROZEN: `<script>` blocks are byte-identical-gated. Never propose script changes.
  Markup edits limited to class hooks and element ordering (no new interactive elements).
- CSS lives in `docneural-ui.css` (global) and `<style>` blocks in the components. Scoped
  only. No new fonts, no external URLs, no images, no new dependencies. Vendored fonts:
  Electrolize (display), JetBrains Mono (mono), Inter (body).
- Do not rename existing classes that scripts toggle (class list you must preserve:
  theme classes, nav/header state classes, graph classes). Additive classes are fine.

## Files provided (same directory)

- `docneural-ui.css` — the global stylesheet (main canvas; ~53KB).
- `home.svelte.txt` — Home route markup + styles (hero, stats, chapters, sources; script removed).
- `app-shell.svelte.txt` — app shell: header/nav, theme toggle, layout chrome (script removed).
- `graph-view.svelte.txt` — graph route shell (canvas view; minimal design surface, script removed).
- `index.html.txt` — document shell (script removed).

## Required output format (exactly these sections)

```
## TOKENS
<complete replacement block(s) for the root/theme custom-property blocks — dark and light>

## PATCH <file> <count>
- ANCHOR: <one exact existing selector line copied from that file>
  ACTION: replace | add-after | remove
  CSS:
    <the exact CSS block>

(repeat per patch; every ANCHOR must be copied verbatim from the provided files)

## PHONE
<the complete revised contents of every <=640px / phone media block you touch>

## RATIONALE
<max 10 bullets, each naming the perf reason>
```

Rules for patches: never paraphrase an ANCHOR; if a selector appears in multiple files,
name the file; keep total output under ~1400 lines; if you would exceed it, prioritize
TOKENS + phone + hero, then list the skipped areas in RATIONALE.
