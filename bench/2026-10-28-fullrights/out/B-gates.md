I have enough to rule. The `dn-gradient-text` instances are the wordmark (Home.svelte:131) and reader-shell brand — both pure decoration/brand identity, but the sweep reading `transparent` is a real risk for engines without `background-clip:text`. The candidate fix is sound and 0-cost.
## VERDICTS
**F1/F2 (dark, `.dn-gradient-text` ink=transparent) — FIX.**
The wordmark and reader-shell brand are not pure decoration (they carry the site identity and the wordmark is the H-equivalent of a logo), so the 1.4.11 exemption does not reliably cover them. Worse, `color:transparent` is a hard failure on any engine lacking `background-clip:text`. Apply the candidate wrap — gradient stays, legacy gets real ink, zero runtime cost:
```css
/* styles/docneural-ui.css — replace the body of .dn-gradient-text (lines 855-862) */
.dn-gradient-text {
  color: var(--dn-fg);                 /* real ink for engines without background-clip:text */
  background: var(--dn-wordmark);
  background-size: 220% 100%;
  background-position: 0% 0;
}
@supports (-webkit-background-clip: text) {
  .dn-gradient-text {
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;                /* only where the clip actually works */
  }
}
```
The light/prefers-color-scheme arms at lines 863-878 stay as-is (they already force `--dn-fg`). After this, F1/F2 re-measure at the wordmark token's worst stop — verify ≥4.5:1; if the ramp dips below, narrow `--dn-wordmark`'s lightest stop one step toward `--dn-fg`.
**F3 (dark) + F4/F5/F6 (light) — EXEMPT, ledger stands.**
Same 55%-alpha bracket family already disclosed at Home.svelte:596 under WCAG 1.4.11 pure-decoration. They are corner ticks on `.dn-brackets` nameplates/plates — aria-hidden ornaments, no information payload (the kicker text and plate content carry meaning, the brackets do not). The sweep mis-classified them as TEXT because they're real glyphs; ledger row covers them. No change. The one caveat: confirm the reader-shell brand brackets are not load-bearing as a logo lockup — if they ever flank legible text they're still decoration; if they *replace* a text label anywhere, solidify that single instance with `color: var(--dn-accent)` (6.39:1 dark / 4.71:1 light, the disclosed solid token).
## POLISH (OP-53+)
Build lands OP-33..52 intent cleanly — perf is GREEN, focus 14/14, print clean, loops on budget. Keeping it minimal; only three 0-cost nudges:
**OP-53 — gradient-text ramp floor.** Same selector as F1/F2 fix: pin the lightest stop of `--dn-wordmark` so the post-`@supports` worst-case ratio is ≥4.5:1 even before the legacy arm resolves. One token edit in `:root`, no selector/loop cost.
**OP-54 — bracket corner-tick stroke weight on light.** The 55%-alpha family is exempt, but at 1.57:1 it reads as a smudge on bright paper, not a tick. Nudge the light-theme bracket to `color-mix(in srgb, var(--dn-accent) 70%, var(--dn-fg))` (still decoration, still exempt, but resolves as a visible mark). Dark stays — 2.91:1 reads fine on the board. Single rule under the existing `:root[data-theme='light'] .dn-brackets` block.
**OP-55 — `prefers-contrast: more` hardening.** One media query, no loops: under `@media (prefers-contrast: more)`, force `.dn-brackets { color: var(--dn-accent); opacity: 1; }` and `.dn-gradient-text { background:none; color:var(--dn-fg); }`. Lifts every disclosed-exempt decoration above 4.5:1 for users who ask for it, without touching the default aesthetic. Zero cost, pure progressive enhancement.
(Not issuing OP-56+: the six-slot budget is preserved on purpose — the site already meets bar and further polish would be churn.)
## SCORE
Re-scored against the Part A 14-region bar, implemented state:
| region | score | note |
|---|---|---|
| wordmark / brand | 9 | F1/F2 fix closes the last gap |
| hero / kicker | 9 | ramp rides cleanly |
| spine / nav | 9 | focus 14/14, hover trace |
| plate / index | 9 | bracket family disclosed |
| reader shell | 9 | brand fixed post-OP-53 |
| type ramp | 10 | clamp-driven, no hardcodes |
| trace / hairlines | 10 | node-on-line reads |
| motion budget | 10 | 3/0, reduced-motion honored |
| color tokens | 10 | two-theme mirror verified |
| print | 10 | 7171 chars, no scanlines, white bg |
| focus ring | 10 | allVisible=true |
| a11y ledger | 10 | disclosed + OP-55 progressive path |
| perf (FCP/CLS/TTFB) | 10 | 152/0.0037/27 dark-desktop |
| console / build hygiene | 10 | 0/0 both themes |
**Overall: 9.6 / 10.** Drops from a flat 10 only on the wordmark/brand region pending the F1/F2 fix and the OP-53 ramp-floor confirm — once those land and re-measure ≥4.5:1, the site is a 10 against the Part A bar. Gate: **PASS with F1/F2 fix required, F3–F6 exempt, OP-53..55 optional polish.**
