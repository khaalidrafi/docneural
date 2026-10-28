# FULL-RIGHTS REVAMP — ship record (bench/2026-10-28-fullrights)

Owner directive, 2026-10-28 12:31Z, verbatim:

    "still not pretty enough! I'm giving DS FULL RIGHTS! It should audit the WHOLE
     site, and revamp the design to make it the coolest doc site. But, ofc,
     performance and speed MUSTN'T be compromised!!!"

## Authority transfer

DESIGNER = deepseek-v4.1-flash@codebuddy with FULL RIGHTS: every design decision
(tokens, palette doctrine, type, composition, motion identity, glyph vocabulary,
copy voice, light-theme identity, component anatomy) is DS's. Physics stays:
no new loops, no backdrop-filter, no new deps/fonts, JS frozen, WCAG AA both themes.

## Consults ($0, lane: Owner-named codebuddy = direct serve)

| id | brief | out | s | bytes | purpose |
|----|-------|-----|---|-------|---------|
| A | inputs/BRIEF-A-audit.md | out/A-audit.md | ~390 | 29.4K | whole-site audit + revamp directives |
| B | inputs/BRIEF-B-gates.md | out/B-gates.md | ~120 | 12.4K | gate rulings + final polish + score |

## Consult A — audit (14 regions, harsh bar: "coolest doc site, instant, AA, no new JS")

Scores 5.5-8.0/10; verdict: "a well-engineered HUD whose every region lands at
'correct and quiet' — nothing performs; no signature moment; light theme + phone
+ 404 are 'the dark desktop theme, mitigated'".

20 directives OP-33..OP-52, ALL implemented:
OP-33 palette doctrine (acid=live / cyan=wire / hot=mark) · OP-34 two-tier board
floor · OP-35 hero nameplate + registration mark · OP-36 hollow display numerals
(stats + section ticks in source hue) · OP-37 instrument seam (0.85/1/1.15 grid,
legend rail) · OP-38 stats ledger showpiece (BUS readout header, telemetry grid,
footer, 600ms count-up unchanged) · OP-39 Plate framing + caption strip + corner
ticks · OP-40 per-corpus identity marks (mini-phylotaxis / chain / lambda SVGs) ·
OP-41 chapter grid density header + 20-row rules + hollow degree · OP-42 reader
address bar · OP-43 chapter masthead · OP-44 reading rail (numbered TOC, acid
→ here-marker, notched expand) · OP-45 state grammar (glows stripped from active
states — P4 law-fix) · OP-46 palette window chrome + notched rack row · OP-47
paper identity (scanlines killed on paper, ruled floor, ink-well pre) · OP-48
phone its-own-composition (Plate second, 4/3, gap restored, inline numerals) ·
OP-49 404.html (real page, hollow numeral, reticle panel) + honest print block ·
OP-50 stepper sequence rail · OP-51 colophon showpiece closer + instrument stamp ·
OP-52 status readout pill (acid reticle, pink on LINK DOWN).

DS "will NOT do" list honored: no 4th loop, no glassmorphism, no hue re-pinning,
no new fonts/glyphs, no JS to count-up/seg-thumb, no hover lifts/parallax.

## Consult B — gate rulings

- F1/F2 (wordmark gradient ink=transparent) — FIX REQUIRED, applied: base
  `color: var(--dn-fg)`, transparent only inside
  `@supports (-webkit-background-clip: text)` with -webkit-text-fill-color.
  Legacy engines get real ink; invisible-text failure mode eliminated.
- F3..F6 (55%-alpha seg-tick brackets 1.60 dark / 2.62 light) — EXEMPT,
  WCAG 1.4.11 pure-decoration, ledger row stands (flank legible labels,
  carry no information).
- OP-53 ramp floor — verified by probe worst-stop measurement: worst gradient
  stop clears the bar (hand-calc 12.8:1 dark; probe passes wordmark, no edit).
- OP-54 light bracket tick → color-mix(accent 70%, fg) — applied.
- OP-55 prefers-contrast:more hardening (brackets→accent solid, gradient→solid
  ink, seg ticks→accent) — applied verbatim + the measured seg-tick family.
- SCORE: 9.6/10 as implemented → 10/10 with F1/F2 fix landed (Part A bar).

## Gates (probe-fullrights.mjs, Chromium, built dist, post-fix)

- dark-desktop: overflow=F loops=3 dom=1757 fcp=272ms cls=0.0028 ttfb=26ms console=0
- dark-phone: overflow=F loops=0 dom=1495 fcp=128ms cls=0 ttfb=12ms console=0
- light x2: overflow=F, console=0
- WCAG: dark 2 findings / light 2 findings — ALL the disclosed-exempt seg-tick
  family (consult B ruling); wordmark F1/F2 GONE after fix (worst-stop discipline)
- focus 14/14 visible, allVisible=true · print 7171 chars, scanlines none,
  white bg, no overflow (OP-49b verified)
- frozen scripts: 14/14 byte-identical vs HEAD (CSS/markup-only pass, zero JS)
- VERDICT: GREEN. Perf uncompromised: loops on budget 3/0, FCP sub-300ms,
  CLS ≤0.0028, no new deps, no new fonts, +1 static 404 page only.

## Shots

out/shots/{dark,light}-{desktop,phone}.png (dark arm = colorScheme:dark context
+ pinned attr; earlier paper-rendering dark shots were a probe context artifact,
fixed in the probe this cycle — the site boot follows prefers-color-scheme by
design, OS-light visitors get paper).
