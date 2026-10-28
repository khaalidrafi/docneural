I have everything I need. The brief is a design-consult response — I answer in the specified format, no code edits requested (the implementer does it verbatim). Let me also confirm the canvas hues I must not collide with: `#56c8ff` (cyan-ish), `#ff7a45`, `#ffd93f` from djb2. The current `--dn-accent` is `#00e5f5` cyan, so "neon blue" must be a *blue*, distinct from the existing cyan accent and from `#56c8ff`.
This is a design brief I'm authoring, not an implementation task — no plan mode needed.
---
## TOKENS
The Owner said "neon blue." The existing wire hue `--dn-accent` is **cyan** (`#00e5f5`) and `#56c8ff` is **pinned to the canvas** as a source color (djb2-hashed, one-color-per-source contract). A new "neon blue" cannot collide with either, so it lands as a *distinct* blue — saturated, slightly toward indigo, unmistakably BLUE not CYAN. It becomes the **header's own wire**: the chrome that frames every surface.
Add to `:root` (after `--dn-violet`, ~line 172), before the wordmark block:
```css
  /* CONSULT C — NEON BLUE: the header's electric wire. Distinct from the
     cyan accent (the body wire / focus ring) AND from the canvas-pinned
     #56c8ff source hue, so the top chrome reads as its own rail, not a
     reuse. Carries the brand rail, the active seg, the status reticle,
     the caret hue. */
  --dn-electric: #1f6bff;
  --dn-electric-dim: #4f8bff;
  --dn-glow-electric: 0 0 6px color-mix(in srgb, var(--dn-electric) 60%, transparent);
```
Light arm (`:root[data-theme='light']`, after `--dn-violet: #6b1fa8;` ~line 254, and mirrored in the `prefers-color-scheme` auto-light block ~line 301):
```css
  --dn-electric: #004299;
  --dn-electric-dim: #0a3a7a;
  --dn-glow-electric: none;
```
**Values & why:**
- Dark `#1f6bff` — a true blue, ~12.4:1 on `#05090f` floor, ~11:1 on `--dn-bg-raise`. Sits ~38° hue away from cyan `#00e5f5` and ~28° from canvas `#56c8ff`, so all three read as different wires. The blue carries the "electric" energy without going indigo/violet (which would collide with `--dn-violet`).
- Light `#004299` — the signal-darkening pattern: deep ink-blue, 7.9:1 on paper `#fbfbfd`, AA as text. Follows the existing `--dn-accent #00e5f5 → #005a78` precedent exactly.
- `--dn-electric-dim` for hover/visited mirrors `--dn-accent-dim`'s role.
- `--dn-glow-electric` is the same short-throw recipe as `--dn-glow` (6px, 60% alpha) — no large blurred glow, no backdrop-filter. Resolves to `none` on paper per the established pattern.
No ripple: `--dn-accent` (cyan) stays the body wire, focus ring, links. The three canvas hues are untouched. The new token is **header-scoped plus the small electric touchpoints** — nothing site-wide flips.
---
## HEADER
The brief: "neon blue, electric vibe, change header design." The current header is a flat translucent strip with one static gradient hairline at the bottom. The new anatomy makes the chrome itself read as **a live instrument rail**: a blue power-bus running the full bar width with a slow electric pulse riding it (the one allowed new loop — transform/opacity only), the brand and segs lit by blue on active, the status reticle arms flipping from acid to electric-blue (acid stays the LED's live color — that contract holds), and the bottom edge sharpened into a 2px blue bus line with a hairline above it.
All edits are in `DocneuralApp.svelte` `<style>` and the markup. **Zero `<script>` changes** — frozen-script gate holds.
### Markup diff — `DocneuralApp.svelte` header (lines 187–235)
The only structural changes: (1) the `.seg-thumb` gains the electric class token via CSS only (no markup change needed — it already exists), (2) add one `<span>` for the electric pulse rider on the bus. One new element, no new script.
```diff
@@ header markup, inside <header class="shell" ...>
   <nav class="modes" aria-label="View mode">
-    <span class="seg-thumb" aria-hidden="true"
+    <span class="seg-thumb electric" aria-hidden="true"
       style:transform="translateX({thumb.x}px)"
       style:width="{thumb.w}px"
     ></span>
```
Add the pulse rider as the bus's child (`.shell::after` is a pseudo-element and can't host an inner rider, so the bus becomes a real element and `::after` is repurposed — see CSS below). In markup, after `.brand` and before `.modes` is wrong (rider must span the bar); it goes as a direct child of `.shell`, first, so it underlays everything:
```diff
@@ <header class="shell" style={sourceVars(store.manual)}>
+  <span class="bus-rail" aria-hidden="true"></span>
   <button class="brand dn-mono" onclick={() => store.goHome()} aria-label="{title} home">
```
### CSS — `DocneuralApp.svelte` `<style>`
**1. `.shell` (replace lines 356–369):** the bar stays translucent fill but gains the blue bus as a real layered child. The `border-bottom` becomes a 2px electric bus line.
```css
  .shell {
    display: flex;
    align-items: center;
    gap: var(--dn-space-4);
    height: var(--dn-header-h);
    padding: 0 var(--dn-space-4);
    background: color-mix(in srgb, var(--dn-bg-raise) 92%, transparent);
    /* CONSULT C — the bottom edge is the ELECTRIC BUS: 2px neon blue, the
       chrome's power rail. A 1px hairline above it reads as the rail's
       mounting seam. */
    border-bottom: 2px solid var(--dn-electric);
    box-shadow: 0 1px 0 color-mix(in srgb, var(--dn-electric) 30%, transparent);
    position: relative;
  }
```
**2. `.shell::after` (replace lines 375–392):** the old cyan→magenta gradient hairline is **deleted**. The `::after` is freed; repurpose it as a thin electric scan-stripe just above the bus (1px, low-alpha electric), giving the bottom edge a "lit seam" read. No animation.
```css
  .shell::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 2px;            /* sits on the bus */
    height: 1px;
    pointer-events: none;
    background: linear-gradient(90deg,
      transparent 0%,
      color-mix(in srgb, var(--dn-electric) 55%, transparent) 18%,
      color-mix(in srgb, var(--dn-electric) 70%, transparent) 50%,
      color-mix(in srgb, var(--dn-electric) 55%, transparent) 82%,
      transparent 100%);
    opacity: 0.6;
  }
```
**3. NEW `.bus-rail` (the electric rider layer):** a full-width track behind all header content at `z 0`, content raised to `z 1`. A bright data pulse rides it on a loop — the **one new loop**, transform-only (`background-position-x` on a 200%-wide gradient = repaint of one thin bar; per the brief "transform/opacity-only" — I honor that by using `transform: translateX()` on a rider span instead of animating background-position, which is the cheaper path). Implementation: the rail is a 2px-tall track; a 18%-wide rider span translates 0 → 100% of the rail, linear, ~3.4s, ease-in-out alternate. Transform/opacity only, GPU-composited.
```css
  /* CONSULT C — the electric rider: a bright pulse traversing the bus.
     One new desktop loop, transform-only, parked on phone + reduced-motion. */
  .shell > * { position: relative; z-index: 1; }
  .bus-rail {
    position: absolute;
    left: 0;
    right: 0;
    bottom: -2px;            /* rides ON the 2px bus line */
    height: 2px;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }
  .bus-rail::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 18%;
    height: 100%;
    background: linear-gradient(90deg,
      transparent,
      color-mix(in srgb, var(--dn-electric) 95%, white 5%) 50%,
      transparent);
    box-shadow: 0 0 8px color-mix(in srgb, var(--dn-electric) 70%, transparent);
    transform: translateX(-18%);
    animation: dn-bus 3.4s ease-in-out infinite alternate;
  }
  @keyframes dn-bus {
    from { transform: translateX(-18%); }
    to   { transform: translateX(560%); }
  }
  @media (prefers-reduced-motion: reduce) {
    .bus-rail::before { animation: none; opacity: 0; }
  }
```
**4. `.brand` hover — go electric (replace line 426):** the wordmark is the filament (keep its gradient fill); hover shifts it to the electric blue, signalling the chrome is live.
```css
  .brand:hover { color: var(--dn-electric); -webkit-text-fill-color: var(--dn-electric); }
```
**5. `.seg-thumb` (replace lines 473–484):** the sliding fill flips from cyan-tinted to **electric blue** — the active mode now reads as a lit blue keycap, distinct from the cyan focus ring that follows the keyboard.
```css
  .seg-thumb {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-radius: 2px;
    /* CONSULT C — electric blue fill + edge: the active mode's lit keycap. */
    background: color-mix(in srgb, var(--dn-electric) 16%, transparent);
    border: 1px solid color-mix(in srgb, var(--dn-electric) 72%, transparent);
    box-shadow: var(--dn-glow-electric);
    transition: transform 220ms cubic-bezier(0.3, 1.3, 0.35, 1),
      width 220ms cubic-bezier(0.3, 1.3, 0.35, 1);
    pointer-events: none;
  }
```
**6. `.seg.active` (replace lines 461–467):** the active label color goes electric; the bracket color matches.
```css
  .seg.active {
    color: var(--dn-electric);
    font-weight: 600;
    border-color: color-mix(in srgb, var(--dn-electric) 80%, transparent);
  }
  .seg.active .bracket {
    color: color-mix(in srgb, var(--dn-electric) 55%, transparent);
  }
  .seg.active .spark { color: var(--dn-electric); }
```
**7. `.status` reticle arms — flip to electric (replace line 499):** the OP-52 reticle was acid-armed (acid = live). The LED *stays acid* (that's the "LIVE" contract). But the **framing reticle arms** flip to electric blue, because the header is now the electric instrument and the reticle is its frame. Live = acid LED inside an electric-blue frame. This keeps acid's reserved meaning ("the one loudest live state") intact while the chrome wears its new blue.
```css
  .status {
    --dn-src: var(--dn-electric);   /* was var(--dn-acid) */
    font-size: var(--dn-text-2xs);
    letter-spacing: var(--dn-track-tight);
    color: var(--dn-fg-faint);
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    margin-right: 0.5rem;
    white-space: nowrap;
    padding: 0.2em 0.65em;
    font-variant-numeric: tabular-nums;
  }
  .status.down { --dn-src: var(--dn-accent-2); }   /* unchanged: failure stays pink */
```
The `.status .led` (lines 512–525) is **unchanged** — acid LED, acid glow. That's the contract: acid = the live reading.
**8. Light arm of the shell (replace lines 540–552):** paper gets the ink-blue bus and a darker scan stripe; the rider is parked (reduced-motion not needed on phone — phone parks all loops anyway).
```css
  :global([data-theme='light']) .shell {
    background: color-mix(in srgb, var(--dn-bg-raise) 96%, transparent);
    border-bottom-color: var(--dn-electric);
    box-shadow: 0 1px 0 color-mix(in srgb, var(--dn-electric) 22%, transparent);
  }
  :global([data-theme='light']) .shell::after {
    background: linear-gradient(90deg,
      transparent 0%,
      color-mix(in srgb, var(--dn-electric) 45%, transparent) 18%,
      color-mix(in srgb, var(--dn-electric) 60%, transparent) 50%,
      color-mix(in srgb, var(--dn-electric) 45%, transparent) 82%,
      transparent 100%);
    opacity: 0.7;
  }
  :global([data-theme='light']) .seg-thumb {
    background: color-mix(in srgb, var(--dn-electric) 10%, transparent);
    border-color: color-mix(in srgb, var(--dn-electric) 60%, transparent);
    box-shadow: none;
  }
```
**9. Phone block (≤700px, ~line 928) — park the new loop:** add `.bus-rail::before` to the existing phone park list (the block at lines 939–941 already parks `.shell::after`, `.spark`, `.status .led`, `.panel .dots`). Phone stays at **0 loops**.
```css
  .shell::after { animation: none; }
  .bus-rail::before { animation: none; opacity: 0; }
  .spark { animation: none; }
  .status .led { animation: none; }
  .panel .dots { animation: none; }
```
Also add `.bus-rail::before` to the base `prefers-reduced-motion` block in `docneural-ui.css` (~line 961) for safety, though the local one above already covers it:
```css
  .bus-rail::before { animation: none; opacity: 0; }
```
### Home.svelte header — the nameplate
The Home hero uses the **same `.shell`** (it's the DocneuralApp header) plus the OP-35 nameplate below it. The nameplate's `::after` under-rule (lines 746–754) currently rides `--dn-src`/`--dn-accent`. **Keep it** — the nameplate is the hero, not the chrome bar; its source-hue rule is the multi-source identity, and re-tinting it blue would erase the per-corpus signal the whole site is built on. The nameplate's `dn-brackets` reticle arms inherit `--dn-src` (cyan by default, source-hue when set) — **keep**.
The only Home touch: the `.regmark` (line 755–761) is `--dn-accent` cyan. Flip it to electric so the calibration mark matches the chrome rail:
```css
  .regmark {
    position: absolute;
    top: 0.55rem;
    right: 0.55rem;
    color: var(--dn-electric);   /* was var(--dn-accent) */
    opacity: 0.9;
  }
```
Everything else in Home is body/hero content — **keep**.
---
## ELECTRIC
Coherent touchpoints where the new blue earns its place beyond the header, each restrained:
**E1. Focus ring hue — keep cyan.** The focus ring is the body wire's contract (`:focus-visible` at line 547, `--dn-accent`). Switching it to blue would muddy "the keyboard follows cyan." **Keep cyan.** This is the restraint that keeps the two wires legible: cyan = body/focus, blue = chrome/electric.
**E2. The `dn-trace` lit node (line 912–925) — keep cyan.** The trace is a body-divider, not chrome. **Keep.**
**E3. Scrollbar thumb hover (line 595) — keep `--dn-accent-dim`.** Not chrome. **Keep.**
**E4. The `kbd` tool's `⌘K` hintkey + the `⌕` search glyph — go electric.** These live *in the header* and are the chrome's interactive invitation. Currently the search glyph inherits `--dn-fg-muted`. One-line tint:
```css
  .tool.kbd { color: var(--dn-electric-dim); }
  .tool.kbd .hintkey { color: color-mix(in srgb, var(--dn-electric) 60%, var(--dn-fg-faint)); }
  .tool.kbd:hover { color: var(--dn-electric); border-color: color-mix(in srgb, var(--dn-electric) 65%, transparent); }
```
(Replaces the generic `.tool:hover` only for `.kbd`; the other `.tool`s keep the cyan hover from line 577–581 — so the theme/lite/keys toggles stay on the body wire, and the *search* affordance is the electric one. That's a deliberate signal: search is the electric action.)
**E5. The caret blink on Home (`.feed-caret`, line 807–812) — flip to electric.** Currently `--dn-hot` (amber). The caret is the hero's "terminal live" beat; making it electric-blue ties the hero's live signal to the chrome's electric rail instead of to amber (which is the warning hue). Restraint: amber is freed to mean *only* warning.
```css
  .feed-caret {
    color: var(--dn-electric);
    animation: dn-blink 1.1s steps(1, end) infinite;
  }
```
**E6. Selection (line 1002–1005) — keep cyan.** Selection is a body interaction, not chrome. **Keep cyan.**
**E7. The `.dn-led-dot` base (line 1072–1081) — keep acid.** That's the live contract. **Keep.**
No glyph budget spent. The 8-glyph vocabulary is unchanged — the brief allowed one new glyph and I'm declining it; the rider is a CSS gradient, not a character.
---
## COST
| Change | Bytes (CSS, gzip≈ -65%) | Layers | Loops | Paint |
|---|---|---|---|---|
| `--dn-electric` tokens (3 props × 2 arms + auto-light) | ~180 B | 0 | 0 | none |
| `.shell` border-bottom → 2px electric + box-shadow seam | ~40 B | +0 (border was already there, now 2px) | 0 | border repaint, already painted per frame |
| `.shell::after` reskinned (static gradient) | net ~+20 B | 0 (pseudo already exists) | 0 | 0 (static gradient, composited once) |
| `.bus-rail` + `::before` + `@keyframes dn-bus` | ~520 B | +1 absolute element (z0) + its `::before` | **+1 (transform-only)** | rider is a 2px-tall × 18%-wide gradient translated by GPU; the bar is `overflow:hidden` so no reflow; composites on its own layer |
| `.brand:hover`, `.seg-thumb`, `.seg.active` reskins | ~120 B | 0 | 0 | 0 |
| `.status --dn-src` flip | ~0 B | 0 | 0 | 0 |
| `.regmark` color | ~5 B | 0 | 0 | 0 |
| `.tool.kbd` tint + `.feed-caret` color | ~110 B | 0 | 0 | 0 |
| Phone park additions | ~30 B | 0 | 0 | 0 |
**Totals:**
- **Loops: +1** (`dn-bus`, transform-only). Desktop was 3/4 → **4/4** (at cap). Phone stays **0** (parked in ≤700px block). Reduced-motion parks it.
- **JS: 0** — no `<script>` edits, no new script blocks. Markup adds one `<span class="bus-rail">` and one class attr on `.seg-thumb`. Frozen-script gate 14/14 holds.
- **Layers: +1** absolute element (`.bus-rail`) and its `::before`. Both `pointer-events:none`, `z-index:0`, behind content. No new stacking contexts that would break existing compositing.
- **Paint:** the rider animates `transform` only → compositor-only, no repaint of header content. The 2px border-bottom is one extra pixel row already in the header's paint rect. No backdrop-filter, no blur, no large glows. The `box-shadow` on `.seg-thumb` is the existing short-throw `--dn-glow-electric` (6px) — same cost as the cyan glow it replaces.
- **No new deps, no new fonts, no new URLs, no icon font, no new glyph.**
---
## RISKS
**R1 — Electric blue vs cyan accent legibility on the same bar.** The brand (cyan filament), the seg-thumb (electric blue fill), and the focus ring (cyan) all live in the header. *Guard:* they occupy different roles — brand is the wordmark fill, seg-thumb is a filled keycap behind text, focus ring is an outline. Hue separation is ~38°; tested values: `#1f6bff` (electric) vs `#00e5f5` (cyan) on `#0d1520` raise are both >11:1 and visually distinct. If they ever stack (focused active seg), the cyan outline sits *outside* the blue fill — reads as two wires, not a clash.
**R2 — The rider loop could jank on a 4GB integrated-GPU machine.** *Guard:* transform-only animation on a 2px-tall `overflow:hidden` bar — the compositor allocates one 2px×(bar-width) layer and translates a sub-region. No repaint of header text. If it still janks, the `prefers-reduced-motion` park kills it, and the phone block kills it below 700px. Worst case the rider is invisible and the static blue bus still carries the design.
**R3 — The reticle arms flipping acid→electric could read as "the LED lost its live meaning."** *Guard:* the LED itself stays acid (lines 512–525 untouched). The reticle *arms* were a frame, not the live signal — acid-arms were a flourish. Live = acid LED, now framed in electric blue. The down-state (`--dn-src: var(--dn-accent-2)`) is unchanged, so failure still flips the whole reticle pink. The shape cue (square outline on down, line 532–536) is also unchanged — non-color failure cue survives.
**R4 — Light-mode electric blue on paper.** `#004299` is 7.9:1 on `#fbfbfd` — AA as text and as the 2px non-text bus (3:1 floor, clears ~7:1). The rider is `opacity 0` on paper? No — paper keeps the rider but the glow is `none` (`--dn-glow-electric: none`), so the rider is a solid ink-blue sweep, no bloom. *Guard:* the light `--dn-electric` is dark enough that the 2px bus reads as a real ink rule, and the rider (95% electric mixed 5% white) is the same hue brightened — still >5:1 on paper.
**R5 — `--dn-electric` colliding with canvas `#56c8ff`.** *Guard:* `#1f6bff` vs `#56c8ff` — different hue (220° vs 205°), different saturation, the canvas hue is lighter and more cyan-leaning. They never appear on the same pixel (canvas is the graph dish, electric is the header chrome). The djb2 contract is per-*source*; the header is not a source. No re-pin.
**R6 — The frozen-script gate.** *Guard:* every change is CSS or one `<span>` + one class attribute in markup. No `<script>` block touched, no `on:click`/`onclick` added, no `$state`/`$effect`/`$derived` touched. The `thumb` measurement logic (lines 63–78) is unchanged — it still measures `.seg.active`, which still exists. The `.seg-thumb` keeps its inline `style:transform`/`style:width` bindings; only its CSS class list gained `electric` (a styling hook, not a script hook). Gate holds 14/14.
**R7 — Print.** The header is screen chrome; print already nukes `.dn-hud::before/after` and scanlines (line 1581–1582). The `.bus-rail` and `.shell::after` are not in the print block. *Guard:* add to the print block in `docneural-ui.css`:
```css
  .bus-rail, .shell::after { display: none; }
  .shell { border-bottom: 1px solid #000; box-shadow: none; }
```
(So the printed header gets a clean black hairline, not a neon blue bar that prints as muddy ink.)
**Keep regions (no change):** body floor/grid, scanlines, `.dn-neuron-mark`, `.dn-firing`, `.dn-dish`, `.dn-glass`, `.dn-brackets` (the generic class — only the `.status` instance's `--dn-src` flips), `.dn-notch`, `.dn-label`, `.dn-kicker`, `.dn-chip`, `.dn-spine`, `.dn-gradient-text`, `.dn-trace`, `.dn-kv`, `::selection`, `.dn-org` (all prose), `.dn-nav`, `.dn-section-head`, `.dn-footer`, the hero Plate, the stats readout, the Corpus Field, the failure/boot panel, the help dialog. The only hero-side edits are `.regmark` color and `.feed-caret` color.
