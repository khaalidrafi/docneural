# FULL-RIGHTS WHOLE-SITE AUDIT — you own every design decision now

You are deepseek-v4.1-flash, DESIGNER of record for docneural, serving via codebuddy.
Your previous audits scored the design 6.1/10 (COOLEST pass) then 7.2/10 (COOLER push).
Everything you directed since is shipped and live at https://khaalidrafi.github.io/docneural/.

The OWNER reviewed the live site and issued, verbatim:

    "still not pretty enough! I'm giving DS FULL RIGHTS! It should audit the WHOLE
     site, and revamp the design to make it the coolest doc site. But, ofc,
     performance and speed MUSTN'T be compromised!!!"

This is a transfer of authority: every design decision — tokens, palette doctrine,
type, composition, motion identity (within budget), glyph vocabulary, copy voice,
light-theme identity, component anatomy — is YOURS. Previous consults told you what
not to touch (token values, chrome hues). That restraint is LIFTED. What stays hard
is physics: the performance and integrity laws below. Pretty AND instant.

## YOUR CWD IS THE SITE REPO — read the real files

You are running inside docneural-ui. Read at minimum:
- styles/docneural-ui.css (1502 lines — global tokens + all shared chrome)
- src/lib/reader/Home.svelte (1476 — landing: hero, Corpus Plate, stats, stepper,
  sources strip, chapter grid, Plate Ledger, colophon v2, a11y ledger)
- src/lib/DocneuralApp.svelte (940 — the reader shell: header, nav LED, mode segs,
  graph frame, doc pane, status bar, print)
- src/lib/reader/DocReader.svelte (746), SynapseRail.svelte (326),
  ChapterNav.svelte (215), NotePreview.svelte (265), LinkPeek.svelte (108)
- src/lib/ui/CommandPalette.svelte (241), ManualTabs.svelte (64)
- src/lib/graph/FilterBar.svelte (100), DocneuralGraph.svelte (385 — canvas shell)
- 404.html, index.html
Audit what IS on disk, not what you remember directing.

## THE SITE

A public documentation reader: Svelte 5 + Vite SPA on GitHub Pages serving ~1386
pre-exported org fragments (GNU Emacs 791 / Org 319 / Guix 276; aggregator itself
computed the 30915-wire cross-reference graph). No accounts, cookies, trackers,
external requests. Landing = instrument front door (hero + real-graph Plate +
ledger + stepper + colophon). Reader = document-first pane with graph on demand.
Dark = night terminal (primary). Light = clean paper. Fonts self-hosted and FROZEN:
JetBrains Mono (identity), Inter (prose), Electrolize (wordmark display).

## MEASURED TRUTH (live, Chromium 2026-10-28 — do not contradict, improve against)

- transfer 379KB total, TTFB 16-33ms, FCP 120ms phone-warm / 696ms desktop-cold,
  CLS <= 0.003, console errors 0, DOM 1735 desktop / 1473 phone.
- running loops: 3 desktop (dn-pulse spark, dn-rail sweep, dn-blink caret), 0 phone.
- WCAG AA: 0 text failures both themes; text mins 6.09:1 dark / 6.41:1 light;
  14-stop keyboard audit, every stop has a visible ring, min ring contrast 10.76:1.
- graph node hues are COMPUTED in frozen JS (djb2 hash palette per corpus, e.g.
  emacs #56c8ff, org #ff7a45, guix #ffd93f) — chrome must reconcile with the canvas,
  you cannot re-pin those hashes.

## HARD LAWS — violating any voids the directive (physics, not taste)

P1 NO NEW JAVASCRIPT. The 14 <script> blocks stay byte-identical (hash-gated).
   Svelte template restructure is fine (classes, semantics, static SVG, static
   template expressions); no new event handlers, no new reactive logic.
P2 Perf budget: page transfer <= 385KB; global CSS may grow <= 8KB raw; DOM
   <= +150 nodes; FCP/CLS/TTFB must not regress.
P3 Motion: phone = ZERO running animations, >= 44px tap targets, no 390px overflow.
   Desktop <= 4 running loops total (3 used — at most 1 new loop, it must EARN it).
   Everything else = state-change transitions <= 220ms, transform/opacity only.
P4 No drop-shadow filters, no filter:/backdrop-filter chains, no scanline/glitch
   layers, no box-shadow glow abuse (glow = live-readout semantics only).
   No background images heavier than a small data-URI gradient.
P5 WCAG AA both themes (4.5:1 text, 3:1 non-text/large). No text-shadow rescues.
   Focus rings stay visible everywhere.
P6 No new deps, no external URLs, no new fonts, no JS chart libs. Static SVG ok.
P7 Corpus fragments are ADD-FREEZE (the manual pages' DOM/copy untouchable — reader
   chrome around them is yours).
P8 Print mode keeps working (3684-char page, no overflow).

## DELIVER (single response, no tools after reading)

PART A — WHOLE-SITE AUDIT. Region table: score /10 + "what still reads generic or
timid" for EVERY region: (1) header/nav chrome, (2) hero composition + wordmark,
(3) Corpus Plate, (4) stats ledger, (5) how-to-read stepper, (6) sources strip +
cards, (7) chapter grid, (8) Plate Ledger + colophon block, (9) reader shell
(header/mode segs/status bar), (10) doc reading experience (DocReader, SynapseRail,
ChapterNav, LinkPeek, NotePreview), (11) command palette + tabs + filter bar,
(12) light theme identity, (13) phone experience, (14) 404 + print. One-line verdict
after the table: the single biggest reason the site is "still not pretty enough".

PART B — REVAMP DIRECTIVES, numbered OP-33 onward. 16-24 directives. Format:

  OP-NN [DOMAIN] target: <file/selector>
    change: <concrete, implementable-as-is CSS/markup/copy — exact values>
    why: <the perceptual payoff, one line>
    perf: <cost in the P2/P3 budget, or "0">

Domains to cover (hit most): palette doctrine + material; hero drama and the
signature moment; type theater (display treatment, numerals, kickers); composition
and spacing system; Plate evolution; ledger/colophon as showpiece; reader-shell
identity; doc-reading typography and flow; light-theme as a first-class look;
phone as its own composition; microstates (hover/focus/active/visited); 404/print.

PART C — BURN ORDER: your top 6 directives by pretty-per-token, and anything you
would NOT do even with full rights (say why). End with the line "TIER: <how many
more consults of this size you think the free tier can absorb>".

No preamble. Start with "PART A".
