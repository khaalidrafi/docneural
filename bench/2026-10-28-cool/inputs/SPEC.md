## A. Audit (blunt)

1. **The wordmark gradient is the system's one decorative concession, and it's mis-tuned.** `--dn-wordmark` runs white→cyan→cyan-dim at `100deg`. The dim cyan endpoint (`#2cc4e3`) is *darker* than the mid stop (`#00e5f5`) — the ramp goes bright→bright→dim, which reads as a smudge, not a filament. A filament should attenuate monotonically. This is the only place the eye lands first, and it's muddy.

2. **The tracking ramp has a gap, not a ramp.** tight `0.06em` → base `0.14em` → wide `0.24em` → mega `0.34em`. The jump from base to wide (0.10em) is the same size as tight→base (0.08em) — fine — but wide→mega is *also* 0.10em while the absolute value is already high. The mega step barely differentiates from wide. A 4-step ramp where the top two steps are nearly perceptually identical is a wasted step. The hero kicker won't read as "more important" than a status label; it'll read as "slightly more."

3. **Spacing ramp is 4px-base but step 6→7→8 is 2rem→3rem→4rem — arithmetic, not exponential.** A good spacing scale compresses at the bottom and stretches at the top *geometrically*. Here 2→3→4 is linear (+1rem each), so large-section whitespace (the rhythm that makes a terminal-paper site feel *composed*) lands on three values that feel equidistant rather than accelerating. Section gaps will read flat.

4. **Border tiers are inverted in role clarity.** `--dn-hairline` `#1b2a3a` vs `--dn-border` `#3f5f80`: that's a 2.3x lightness jump. But `--dn-border` `#3f5f80` vs `--dn-border-strong` `#5c85ad` is only ~1.4x. So the hairline→border step is *bigger* than the border→strong step — the opposite of what control hierarchy needs. Wells/controls (border) sit too close to strong focus rings, and too far from hairlines. The middle tier isn't doing middle-tier work.

5. **The light theme's `--dn-accent` `#00617f` is timid.** Dark theme cyan is `#00e5f5` — vivid, electric, the identity. Light theme drops to a muted teal that clears AA but loses the "wire" metaphor entirely. The whole point of the dark identity is "cyan is the wire." On paper the wire should still *read as a wire* — darker, yes, but `#00617f` reads as "a blue link." It doesn't carry the terminal lineage. `--dn-accent-dim` `#005068` is even further from the lineage.

6. **`--dn-radius` ramp is 2/3/4px — a 1px delta per step.** At small fill sizes (chips, wells) a 1px difference between sm/`lg` is sub-perceptual. The ramp exists as tokens but renders as "all the same." Either commit to sharp (everything 0/2px) or make the steps earn their names (2/4/6). Three tiers at 1px each is token bureaucracy.

7. **Glow recipes are identical throw, only color differs — and `--dn-glow-acid` is 70% vs 60% for the other two.** Inconsistent alpha for no stated reason. The acid glow (the one LIVE readout) being *stronger* than accent/accent-2 glows undercuts the "acid = one special thing" intent by making it look like a mistake rather than a choice. If acid is special, make the throw different, not the alpha.

8. **No `--dn-border-strong` role is *visually* reserved.** The comment says "header underline, readout plate, focus ONLY" — but the value `#5c85ad` is just "a bit lighter border." There's no structural cue (weight, double-stroke, inset) that says "this is the strong tier." State design (focus especially) will read as "a brighter line" not "a different layer." Focus rings should be unmistakably *rings*, not brighter borders.

9. **The type scale's top is underpowered.** `--dn-text-3xl: 2.75rem` for hero, `--dn-text-4xl: clamp(3rem, 7.2vw, 5.25rem)` for wordmark. But the hero display caps at 2.75rem while body is 1rem — a 2.75x ratio, which is *modest* for a "hero." The terminal-paper aesthetic lives or dies on the hero kicker having real authority. 2.75rem is "large heading," not "hero."

10. **`--dn-lh-snug` 1.3 is shared by h2 AND h3 AND UI heads.** Three distinct hierarchy levels sharing one line-height means their vertical rhythm is identical — they don't *step down*. H3 should breathe differently from H2. This flattens heading rhythm.

## B. Improvement spec

OP-1 [TOKENS] target: `:root` (wordmark)
  change: `--dn-wordmark: linear-gradient(100deg, #e8f1fb 0%, var(--dn-accent) 50%, #9de8f0 100%);`
  why: Filament must attenuate monotonically bright→saturated→soft, not bright→bright→dim — the current dim endpoint reads as a smudge.

OP-2 [TOKENS] target: `:root` (tracking ramp)
  change: `--dn-track-tight: 0.05em;` `--dn-track: 0.14em;` `--dn-track-wide: 0.26em;` `--dn-track-mega: 0.40em;`
  why: Restore perceptual steps — mega must clearly outrank wide, currently 0.34 vs 0.24 reads near-identical at the top where differentiation matters most.

OP-3 [TOKENS] target: `:root` (spacing ramp top)
  change: `--dn-space-6: 2rem;` `--dn-space-7: 3.5rem;` `--dn-space-8: 5.5rem;`
  why: Linear +1rem at the top flattens section rhythm; geometric stretch (2→3.5→5.5) gives large whitespace real acceleration so composed sections read as composed.

OP-4 [TOKENS] target: `:root` (border tiers)
  change: `--dn-hairline: #14202d;` `--dn-border: #33597d;` `--dn-border-strong: #6b9dc6;`
  why: Compress hairline→border, stretch border→strong so the middle tier does middle-tier work and focus rings are unmistakably a stronger layer, not "a brighter line."

OP-5 [LIGHT] target: `:root[data-theme='light']` and `@media (prefers-color-scheme: light) :root:not([data-theme])` (accent lineage)
  change: `--dn-accent: #005a78;` `--dn-accent-dim: #00455c;`
  why: Restore wire identity on paper — a touch deeper so it keeps terminal-cyan character while still clearing AA; current `#00617f` reads as generic blue link, not cyan wire.

OP-6 [TOKENS] target: `:root` (radius ramp)
  change: `--dn-radius-sm: 2px;` `--dn-radius: 4px;` `--dn-radius-lg: 6px;`
  why: 1px steps are sub-perceptual at fill sizes; 2px steps make sm/base/lg actually distinct so the ramp earns three names.

OP-7 [TOKENS] target: `:root` (glow alpha discipline)
  change: `--dn-glow: 0 0 6px color-mix(in srgb, var(--dn-accent) 60%, transparent);` `--dn-glow-2: 0 0 6px color-mix(in srgb, var(--dn-accent-2) 60%, transparent);` `--dn-glow-acid: 0 0 8px color-mix(in srgb, var(--dn-acid) 60%, transparent);`
  why: Acid's specialness comes from a longer throw (8px), not a higher alpha — consistent alpha reads as intentional system, higher alpha reads as a typo.

OP-8 [TYPE] target: `:root` (hero display + line-height pairing)
  change: `--dn-text-3xl: 3rem;` `--dn-lh-tight: 1.08;`
  why: Hero needs real authority — 2.75rem is "large heading"; 3rem with a tighter 1.08 lh gives the terminal-paper hero its earned top-of-rank.

OP-9 [TYPE] target: `:root` (heading rhythm: split snug)
  change: `--dn-lh-snug: 1.3;` add `--dn-lh-snug-2: 1.4;`
  why: H2/H3 sharing one lh flattens the heading step; H3 on 1.4 breathes a hair more so the hierarchy steps down visibly, not just by size.

OP-10 [DETAIL] target: `.dn-header` (focus ring as ring, not brighter border)
  change: `outline: 2px solid var(--dn-border-strong); outline-offset: 1px;` on `:focus-visible` (replace any `border-color` focus cue)
  why: Strong tier should be unmistakably a ring (double-line via outline+border) — currently focus reads as "a brighter line," undermining the strong-tier role.

OP-11 [DETAIL] target: `.dn-brackets` (bracket bleed discipline)
  change: `--dn-bracket-bleed: 0;` in `:root` and ensure brackets use `box-shadow` inset arms not border; set `border: 1px solid var(--dn-hairline)` on the element with bracket arms via pseudo-elements.
  why: Bracket recipe should be structural (arms as pseudo-elements) not bleed-dependent; current `none` bleed makes the recipe's third parameter dead weight.

OP-12 [SPACING] target: `.dn-section-head` (rhythm anchor)
  change: `margin-block: var(--dn-space-7) var(--dn-space-5);` `padding-block-end: var(--dn-space-3);` `border-bottom: 1px solid var(--dn-hairline);`
  why: Section heads need asymmetric block margin (more above than below) to lead the eye; symmetric margins make terminal-paper read as a list, not a composition.

OP-13 [TYPE] target: `.dn-kicker` (mega tracking earns its step)
  change: `letter-spacing: var(--dn-track-mega);` `text-transform: uppercase;` `font-size: var(--dn-text-2xs);` `color: var(--dn-fg-faint);`
  why: Mega tracking only lands if the type is small and faint — a large bright mega-tracked kicker is candy; small+faint+megatracked is the terminal HUD signature.

OP-14 [DETAIL] target: `.dn-chip` (active vs default state clarity)
  change: default `border: 1px solid var(--dn-border);` `background: transparent;` active/hover `border-color: var(--dn-border-strong);` `box-shadow: var(--dn-glow);` `background: color-mix(in srgb, var(--dn-accent) 8%, transparent);`
  why: Chips need a clear two-state jump (outline → outline+glow+tint) so active reads as engaged, not "slightly different."

OP-15 [MOTION] target: `.dn-led-dot` (REPLACE dn-led loop with state-change)
  change: remove `animation: dn-led ...;` replace with `transition: opacity 200ms ease, box-shadow 200ms ease;` and toggle an `.is-live` class (JS-unchanged: class is toggled by existing JS, only the CSS animation is removed).
  why: Law 5 caps running loops at 4; the LED is a status indicator — a state-change (on/off via opacity+glow) is more honest than a perpetual pulse, and frees a loop slot.
  Note: if the existing JS does not toggle `.is-live`, treat this op as "replace dn-led pulse with a static `box-shadow: var(--dn-glow-acid)` on the live LED" — CSS-only.

OP-16 [PHONE] target: `@media (max-width: 600px)` (preserve zero-running + tighten rhythm)
  change: add `.dn-section-head { margin-block: var(--dn-space-6) var(--dn-space-4); }` `.dn-kicker { letter-spacing: var(--dn-track-wide); }`
  why: Mega tracking on a 360px screen overflows visually (letters walk off the edge of attention); step down to wide on phone so HUD stays HUD, not cropped.

OP-17 [DETAIL] target: `.dn-kv` (readout plate alignment)
  change: `display: grid; grid-template-columns: auto 1fr; gap: var(--dn-space-2) var(--dn-space-3); align-items: baseline;` `font-size: var(--dn-text-2xs);` `letter-spacing: var(--dn-track);`
  why: Readout rows are the HUD's heartbeat — baseline-aligned grid with tight type and base tracking makes them scan as a telemetry strip, not a definition list.

OP-18 [LIGHT] target: `:root[data-theme='light']` (paper material feel)
  change: `--dn-bg-sunken: #eef1f5;` `--dn-bg-raise: #ffffff;` and add to body `background-image: none;` (ensure no dark-theme residual texture); `.dn-dish { --dn-dish-dot-1: rgba(96,115,138,0.14); }`
  why: Paper needs a slightly cooler sunken tier so the raise/sunken step reads as "recessed paper" not "two greys"; dish dots at 0.14 keep graph-paper quiet without going barcode.

## C. Expected signals

OP-1 — wordmark reads as a clean filament sweep, no smudge at the tail.
OP-2 — hero kicker visibly outranks status labels by tracking, not just by size.
OP-3 — large section gaps feel composed/accelerating, not flat-list.
OP-4 — focus rings and strong borders become unmistakably a different layer.
OP-5 — light-theme accent reads as "the cyan wire, on paper," not a generic blue link.
OP-6 — chips/wells of different tiers now visually distinct at fill size.
OP-7 — acid LED reads as intentionally special (longer throw), not a typo'd alpha.
OP-8 — hero gains real top-of-rank authority; terminal-paper hero lands.
OP-9 — H3 breathes apart from H2; heading rhythm steps down, not just sizes.
OP-10 — focus is unmistakably a ring; strong tier earns its "focus ONLY" role.
OP-11 — bracket recipe becomes structural; the bleed token stops being dead.
OP-12 — sections lead the eye downward; composition replaces list-flat.
OP-13 — kicker becomes the HUD signature: small, faint, megatracked.
OP-14 — active chips read as engaged via clear state jump, not near-identical.
OP-15 — running loops drop 4→3 on desktop (LED now state-change); phone stays 0; frees a loop slot.
OP-16 — phone kicker stops visually overflowing; HUD stays intact at 360px; zero running preserved.
OP-17 — readout rows scan as a telemetry strip, baseline-locked.
OP-18 — light theme's sunken tier reads as recessed paper; dish grid stays graph-paper quiet.
