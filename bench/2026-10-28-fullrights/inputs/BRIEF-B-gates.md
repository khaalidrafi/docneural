# FULL-RIGHTS CONSULT B — implementation review + gate rulings

You are deepseek-v4.1-flash, DESIGNER of record for docneural, serving via codebuddy.
Consult A (this bench, out/A-audit.md) produced the whole-site audit + OP-33..OP-52.
Implementation is DONE: all 20 directives are in the working tree of this repo
(docneural-ui), built, and probed. Your job now: review the implementation against
your own directives, rule on the gate findings, and emit the final polish pass.

## HARD LAWS (unchanged, from your own Part C "what I would NOT do")
- No new running loops (3 desktop / 0 phone budget stands).
- No backdrop-filter, no new deps, no new fonts, no ninth glyph.
- JS is UNTOUCHED: the frozen-script gate reports 14/14 script blocks
  byte-identical vs HEAD — the whole pass is CSS/markup only. Keep it that way.
- WCAG AA both themes; text 4.5:1, large 3:1, non-text 3:1 (1.4.11 exemption
  only for pure decoration, must be disclosed in the a11y ledger).

## PROBE RESULTS (Chromium, built dist, local server)
- dark-desktop: overflow=false loops=3 dom=1752 fcp=152ms cls=0.0037 ttfb=27ms console=0
- dark-phone:   overflow=false loops=0 dom=1490 fcp=116ms cls=0     ttfb=31ms console=0
- light views: overflow=false loops=0/3, console=0 (FCP sampled on dark pass)
- focus: 14/14 stops visible ring, allVisible=true
- print: 7171 chars, scanlines=none, bg=white, overflow=false  (OP-49b verified)
- VERDICT: GREEN on perf.

## WCAG SWEEP FINDINGS (6 total — rule on each)
F1/F2 (dark): text "DOCNEURAL-UI" computed ink = transparent, best ratio 0.
  Cause: .dn-gradient-text (styles/docneural-ui.css ~line 856) sets
  `color: transparent; background-clip: text` — the sweep reads the declared
  color, and a browser without background-clip support would render INVISIBLE
  text. Two instances (Home wordmark, reader-shell brand).
  Question: directive the fix? (Candidate: base `color: var(--dn-fg)` with the
  transparent only inside @supports (-webkit-background-clip: text) — keeps the
  gradient, gives legacy + engines a real ink. Your call.)
F3 (dark) + F4/F5 (light): "[" "]" glyphs painted color(srgb 0.588 0.25 0.039 / 0.55)
  = hot source hue #96400a at 55% alpha. Best 1.6:1 dark / 2.62:1 light.
  This is the PRE-EXISTING 55%-alpha bracket family already disclosed in the
  a11y ledger (Home.svelte:596: "55%-alpha brackets 2.91 dark / 1.57-1.69 light,
  solid variants 6.39/4.71 — disclosed — exempt" under WCAG 1.4.11 pure-decoration).
  Question: keep the disclosed exemption (ledger row stays), or solidify this
  instance? Note the sweep classified them as TEXT (bar 4.5) — if they are pure
  decoration the ledger row covers them; if any bracket now carries meaning,
  say which and give the solid token.
F6 (light): min ratio seen 2.62 — same bracket family, no other light failures.

## YOUR TASKS
1. VERDICT per finding F1..F6: EXEMPT (stays, ledger covers) or FIX (give exact
   CSS — selector, property, value; must be 0-runtime-cost).
2. FINAL POLISH: at most 6 directives, each 0-perf-cost (CSS/markup only, no new
   loops/layers/fonts/deps). Only things that materially raise the pretty.
   If the build already lands your OP-33..52 intent, say so and keep it minimal.
3. SCORE: re-score the whole site against your Part A bar (the 14 regions or a
   single overall /10) as implemented now.

Answer in compact markdown. Sections: ## VERDICTS, ## POLISH (OP-53+ if any),
## SCORE. Be specific: file, selector, exact values. Do not restate the brief.
