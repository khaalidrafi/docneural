# DESIGN BRIEF — DOCNEURAL home redesign (blind bake-off stage 2: "hands, not eyes")

You are competing in a BLIND web-design bake-off. Every candidate receives this
exact brief. Produce a COMPLETE, single-file HTML page.

Product: DOCNEURAL — a cyberpunk "docs organism": an org-roam manual universe
(1392 nodes / 30400 edges / 304 sections) rendered as a living neural graph.
Audience: hackers, Emacs/Org users. Mood: neon terminal meets bio-luminescent
lab — premium and precise, not cheesy. The design must feel STUNNING at first
glance and stay readable after ten minutes.

## Required sections, in this order

1. Fixed top nav: wordmark "DOCVNEURAL" + links MANUALS / GRAPH / PIPELINE /
   ABOUT + CTA button "BOOT TERMINAL". Must collapse gracefully at 390px.
2. Hero: kicker line, H1 (max 2 lines), subline (~25 words), 2 CTA buttons,
   and one live terminal accent element (typing effect allowed, inline JS).
3. Stats row: 1,392 NODES · 30,400 EDGES · 304 SECTIONS.
4. Graph section: a large canvas placeholder box that actually draws an
   animated node/edge network with inline JS canvas code (30-60 nodes,
   drifting, connecting lines) + a legend row: Org #ff7a45 · Emacs #3ec8ff ·
   Guix #ffd43b.
5. Manual cards: 3 cards (title, 1-line excerpt, "n hops" meta).
6. Footer: minimal, monospace, one line.

## Hard constraints

- Palette: canvas #0a0e16, panel #10151f, primary cyan #00e5ff, secondary
  magenta #ff2d78, accent amber #ffb454.
- BODY TEXT must pass WCAG AA on its background (>= 4.5:1). Use #9fb3c4 or
  brighter for body copy. Decorative/muted text below AA is only allowed for
  clearly non-essential labels. This constraint is scored objectively.
- Typography: display font "Electrolize", mono "JetBrains Mono" via Google
  Fonts <link>. Nothing else.
- No external images, no frameworks, no CDN assets besides Google Fonts.
  All effects (scanlines, glow, grids, corner brackets) via CSS/SVG/canvas.
- No horizontal overflow at 1440px OR 390px (scored objectively in Chromium).
- At least one tasteful hover/transition/animation; motion must not fight
  readability.

## Output format

Return ONLY the HTML document. No commentary, no markdown fences.
