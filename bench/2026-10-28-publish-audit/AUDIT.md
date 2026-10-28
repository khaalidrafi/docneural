# PUBLISH-READINESS AUDIT — cycle 2, final gap sweep (2026-10-28)

- Site: https://khaalidrafi.github.io/docneural/
- Deploy: run 40668733174 SUCCESS @ docneural d2cd8cf; live design = COOLER-3 (docneural-ui a715586; tokens `mark-in`/`dn-rise`/`orbit` verified in the served CSS)
- Attribution: design by **deepseek-v4.1-flash@codebuddy** (DS free-lane ladder rung 2, $0) · implementation + mechanical gates by **glm-5.3-flash@chat.z.ai** · independent review = **glm-4.7-flash@zai** (REVIEW.md) · design sign-off = Owner
- Method: live-site probes only (Chromium 1.63.0 via playwright-core, networkidle + settle; no local builds), all scripts under /home/z/my-project/scripts/ (audit-publish.mjs, spot-check-docs.py, script-hashes.py — rebuilt this tick after sandbox rollback)

## Verdict: ALL MECHANICAL GATES GREEN — 1 disclosed non-blocking decorative finding

| # | Gap (cron checklist) | Result | Evidence |
|---|----------------------|--------|----------|
| 1 | Keyboard/focus visibility | **PASS** — 14 Tab stops, 100% show a visible indicator (outline or box-shadow), min ring contrast 10.76:1, both themes | audit-live.json keyboardFocus |
| 2 | Print emulation | **PASS** — no horizontal overflow, 3684 chars of text intact, hero present | audit-live.json print, shots/print-emulated.png |
| 3 | Chromium perf (FCP/CLS) | **PASS** — FCP 104–296ms warm (668ms first cold), CLS ≤ 0.0039, TTFB 16–23ms, 370KB total transfer, DOM 770/508 nodes | audit-live.json views |
| 4 | Light-theme canvas contrast | **PASS (text)** — page-wide sweep of every visible text leaf, both themes: **0 failures**, textMin 6.09 dark / 6.41 light; alpha-composited `color(srgb / a)` handled; theme flipped via the site's real toggle (bg-change verified) | audit-live.json themeContrast, shots/light-desktop-toggled.png |
| 5 | 10 random docs pages spot-check | **PASS 10/10** — sitemap 1387 urls / 1386 docs pages; sampled pages all 200 with real fragment content; the one cross-reference stub's target verified 200 | spot-check.json |

Standing gates re-verified this tick:
- Frozen scripts: **PASS 14/14** script blocks sha256-identical vs HEAD (working tree clean = ratified a715586 state)
- Overflow FALSE x4 (1280 + 390, both color schemes); running loops **3 desktop / 0 phone** (law: ≤4 / 0); console errors **0**; canvases 0
- og/cards: robots.txt 200, sitemap.xml 200 (1387 urls), social-card.png 200 image/png, og:image + twitter:card + inline favicon in served HTML
- Prior gates (COOLER-3 GATES.md, unchanged): build 3.09s, vitest 65/65, svelte-check 0/0, AA on touched tokens 10/10

## Non-blocking finding (disclosed, for the next DS directive)

The 55%-alpha accent-tinted corner brackets (`span.bracket`, the reticle frame chrome from OP-30) measure **2.91:1 dark / 1.57–1.69:1 light** against the 3:1 non-text guideline. They are purely decorative frame glyphs with zero information content — WCAG 1.4.11 explicitly exempts pure decoration — and the solid-ink bracket variants pass (6.39:1 dark / 4.71:1 light). Text AA is unaffected (0 failures both themes). Recorded as polish input for the next DS consult; not a publish blocker, and per the role split (DS designs / I implement) no unsolicited color change was made.

## Observed behavior (for the record)

The app pins `data-theme="dark"` at boot: a fresh `prefers-color-scheme: light` context still renders the dark terminal until the toggle is used (hence the light-desktop/light-phone view shots render dark; authoritative light evidence is the toggle-click sweep + light-desktop-toggled.png). Consistent with the standing identity law (dark = primary; light reachable in one click).

## Cycle-1 blocker status

og:image blocker (reviewer, cycle 1): **FIXED + LIVE** — social-card.png 1200x630, robots.txt, sitemap.xml (1387 urls) all 200; og:image/twitter:card present in served HTML (shipped docneural 199e934 + UI 8ae34ff, deploy 40645650058; unchanged since).
