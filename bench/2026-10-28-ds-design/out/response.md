## TOKENS

Complete replacement for the `:root` block (dark default) in `docneural-ui.css`:

```css
:root {
  /* --- Type ---------------------------------------------------------------
     Mono IS the identity: headings, nav, labels, meta, code. Prose stays on
     Inter. Display face only for the wordmark. */
  --dn-font-mono: "JetBrains Mono", "Iosevka", "IBM Plex Mono", ui-monospace,
    "DejaVu Sans Mono", Menlo, monospace;
  --dn-font-prose: "Inter", ui-sans-serif, system-ui, "Segoe UI", Roboto,
    sans-serif;
  --dn-font-display: "Electrolize", "JetBrains Mono", ui-monospace, monospace;

  /* Tracking ramp: tight (code/tags) < base (labels) < wide (kickers/status). */
  --dn-track: 0.16em;
  --dn-track-tight: 0.08em;
  --dn-track-wide: 0.28em;

  /* --- Type scale ---------------------------------------------------------
     One ramp, 1.2-ish ratio, used by chrome AND prose so heading rhythm is a
     single system. Line heights are paired to each step. */
  --dn-text-xs: 0.7rem;    /* micro-labels, chips, meta */
  --dn-text-sm: 0.85rem;   /* table headers, code wells, nav */
  --dn-text-md: 1rem;      /* body */
  --dn-text-lg: 1.15rem;   /* h3 */
  --dn-text-xl: 1.4rem;    /* h2 */
  --dn-text-2xl: 1.75rem;  /* h1 / page title */
  --dn-text-3xl: 2.4rem;   /* hero display (clamped per-breakpoint) */
  --dn-lh-tight: 1.2;      /* headings */
  --dn-lh-body: 1.65;      /* prose */
  --dn-lh-loose: 1.75;     /* phone prose */

  /* --- Spacing ramp -------------------------------------------------------
     4px base, 8 steps. Everything lands on the circuit grid. */
  --dn-space-1: 0.25rem;
  --dn-space-2: 0.5rem;
  --dn-space-3: 0.75rem;
  --dn-space-4: 1rem;
  --dn-space-5: 1.5rem;
  --dn-space-6: 2rem;
  --dn-space-7: 3rem;
  --dn-space-8: 4rem;

  /* --- Radii --------------------------------------------------------------
     HUD is sharp. Radii exist only to take the pixel-sting off small filled
     elements. Panels are 0; chips/wells cap at 3px. */
  --dn-radius-sm: 2px;
  --dn-radius: 3px;
  --dn-radius-lg: 4px;

  /* --- Surfaces -----------------------------------------------------------
     Night terminal. Cool cast, never neutral grey. Three tiers only:
     sunken (page floor) < raise (panels) < fg (ink). */
  --dn-bg: #05090f;
  --dn-bg-raise: #0d1520;
  --dn-bg-sunken: #03060a;
  --dn-fg: #e8f1fb;
  --dn-fg-muted: #a6bcd4;
  --dn-fg-faint: #7f97b3;
  /* Hairline borders do the work shadows used to do. 3:1 vs raise. */
  --dn-border: #3f5f80;
  --dn-border-strong: #5c85ad;

  /* --- Signals ------------------------------------------------------------
     Cyan is the wire (links, focus, active chrome). Everything else is
     restrained: pink for tags/counts, amber for warnings, acid for the one
     LIVE readout. No violet in the body — only in the wordmark gradient. */
  --dn-accent: #00e5f5;
  --dn-accent-dim: #2cc4e3;
  --dn-accent-2: #ff3366;
  --dn-accent-2-text: #ff3366;
  --dn-hot: #ffd93f;
  --dn-amber: #ffb347;
  --dn-acid: #3ef04a;
  --dn-violet: #bd00ff;

  /* Wordmark: the one gradient in the system. Cyan -> violet -> pink. */
  --dn-wordmark: linear-gradient(135deg,
    #7df9ff 0%, var(--dn-accent) 26%, var(--dn-violet) 62%, var(--dn-accent-2) 100%);

  /* Glow: two recipes, both short-throw. Used on focus rings and the one
     active chip — never on body text, never on large surfaces. */
  --dn-glow: 0 0 6px color-mix(in srgb, var(--dn-accent) 60%, transparent);
  --dn-glow-2: 0 0 6px color-mix(in srgb, var(--dn-accent-2) 60%, transparent);
  --dn-glow-acid: 0 0 6px color-mix(in srgb, var(--dn-acid) 70%, transparent);

  /* Bracket recipe: one stroke width, one arm length, one bleed. */
  --dn-bracket-w: 1px;
  --dn-bracket-l: 12px;
  --dn-bracket-bleed: none;

  /* Graph literals (canvas cannot parse var()/color-mix()). */
  --dn-graph-link: rgba(0, 229, 245, 0.26);
  --dn-graph-bg: #0a1524;
  --dn-dish-dot-1: rgba(0, 229, 245, 0.09);
  --dn-dish-dot-2: rgba(255, 51, 102, 0.05);
  --dn-graph-palette: #00e5f5, #ff3366, #ffd93f, #bd00ff, #3ef04a, #ff7a45, #56c8ff, #ff5c8a;

  /* Geometry. */
  --dn-notch: 9px;
  --dn-max-prose: 72ch;
  --dn-header-h: 3.25rem;
  --dn-side-w: 240px;
  --dn-panel-w: 340px;

  color-scheme: dark;
}
```

Complete replacement for `:root[data-theme='light']`:

```css
:root[data-theme='light'] {
  /* Paper, not inverted dark. Warm-neutral floor, near-black ink, and the
     same three-tier surface discipline (sunken < raise < fg). */
  --dn-bg: #f7f8fa;
  --dn-bg-raise: #ffffff;
  --dn-bg-sunken: #eceff3;
  --dn-fg: #0a1420;
  --dn-fg-muted: #34485e;
  --dn-fg-faint: #556a80;
  --dn-border: #b6c2ce;
  --dn-border-strong: #7d8fa2;

  /* Signals darken into ink-jet colour. Cyan becomes a deep teal-blue that
     still reads as "the wire"; pink becomes a printed magenta. */
  --dn-accent: #005f80;
  --dn-accent-dim: #0a6a88;
  --dn-accent-2: #b01260;
  --dn-accent-2-text: #96084f;
  --dn-hot: #6b4a00;
  --dn-amber: #85500a;
  --dn-acid: #0a6e14;
  --dn-violet: #7a00b8;

  --dn-wordmark: linear-gradient(135deg,
    #056a8a 0%, var(--dn-accent) 30%, var(--dn-violet) 66%, var(--dn-accent-2) 100%);

  /* No bloom on paper. Focus rings use outline + border, not glow. */
  --dn-glow: none;
  --dn-glow-2: none;
  --dn-glow-acid: none;

  --dn-bracket-bleed: none;

  --dn-graph-link: rgba(0, 95, 128, 0.42);
  --dn-graph-bg: #ffffff;
  --dn-dish-dot-1: rgba(0, 95, 128, 0.14);
  --dn-dish-dot-2: rgba(176, 18, 96, 0.08);
  --dn-graph-palette: #005f80, #b01260, #6b4a00, #5b3fd6, #0a6e14, #b0400a, #0369a1, #a30d55;

  color-scheme: light;
}
```

Complete replacement for the `@media (prefers-color-scheme: light)` inner `:root:not([data-theme])` block — same values as above, kept in sync by hand:

```css
@media (prefers-color-scheme: light) {
  :root:not([data-theme]) {
    --dn-bg: #f7f8fa;
    --dn-bg-raise: #ffffff;
    --dn-bg-sunken: #eceff3;
    --dn-fg: #0a1420;
    --dn-fg-muted: #34485e;
    --dn-fg-faint: #556a80;
    --dn-border: #b6c2ce;
    --dn-border-strong: #7d8fa2;
    --dn-accent: #005f80;
    --dn-accent-dim: #0a6a88;
    --dn-accent-2: #b01260;
    --dn-accent-2-text: #96084f;
    --dn-hot: #6b4a00;
    --dn-amber: #85500a;
    --dn-acid: #0a6e14;
    --dn-violet: #7a00b8;
    --dn-wordmark: linear-gradient(135deg,
      #056a8a 0%, var(--dn-accent) 30%, var(--dn-violet) 66%, var(--dn-accent-2) 100%);
    --dn-glow: none;
    --dn-glow-2: none;
    --dn-glow-acid: none;
    --dn-bracket-bleed: none;
    --dn-graph-link: rgba(0, 95, 128, 0.42);
    --dn-graph-bg: #ffffff;
    --dn-dish-dot-1: rgba(0, 95, 128, 0.14);
    --dn-dish-dot-2: rgba(176, 18, 96, 0.08);
    --dn-graph-palette: #005f80, #b01260, #6b4a00, #5b3fd6, #0a6e14, #b0400a, #0369a1, #a30d55;
    color-scheme: light;
  }
}
```

---

## PATCH docneural-ui.css 9

- ANCHOR: `body.dn-body {`
  ACTION: replace
  CSS:
    ```css
    body.dn-body {
      margin: 0;
      font-family: var(--dn-font-prose);
      font-size: 16px;
      line-height: var(--dn-lh-body);
      color: var(--dn-fg);
      /* One grid, one vignette. The coarse grid is gone — a single 72px
         cyan grid plus a corner vignette reads as a board without the
         second lattice fighting the first for attention. */
      background-color: var(--dn-bg);
      background-image:
        radial-gradient(ellipse at 50% 46%, transparent 58%, color-mix(in srgb, black 55%, transparent) 100%),
        linear-gradient(to right, color-mix(in srgb, var(--dn-accent) 5%, transparent) 1px, transparent 1px),
        linear-gradient(to bottom, color-mix(in srgb, var(--dn-accent) 5%, transparent) 1px, transparent 1px);
      background-size: 100% 100%, 72px 72px, 72px 72px;
      background-attachment: fixed, scroll, scroll;
    }
    ```

- ANCHOR: `:root[data-theme='light'] body.dn-body {`
  ACTION: replace
  CSS:
    ```css
    :root[data-theme='light'] body.dn-body {
      /* Paper: a faint grey wash at the edges, a whisper of grid. */
      background-image:
        radial-gradient(ellipse at 50% 46%, transparent 62%, color-mix(in srgb, var(--dn-bg-sunken) 60%, transparent) 100%),
        linear-gradient(to right, color-mix(in srgb, var(--dn-accent) 4%, transparent) 1px, transparent 1px),
        linear-gradient(to bottom, color-mix(in srgb, var(--dn-accent) 4%, transparent) 1px, transparent 1px);
    }
    ```

- ANCHOR: `body.dn-body::before {`
  ACTION: replace
  CSS:
    ```css
    body.dn-body::before {
      /* The aurora is gone. It was a full-viewport fixed layer that
         composited once but still cost a paint on theme flip and read as
         ambient glow rather than signal. The vignette in the body background
         already does the "edges fall into the void" job for free. */
      content: none;
    }
    ```

- ANCHOR: `body.dn-body::after {`
  ACTION: replace
  CSS:
    ```css
    body.dn-body::after {
      /* Scanlines: one static repeating gradient, no mask, no blend mode.
         The radial mask (a second gradient composited every frame on low-end
         GPUs) is dropped; the effect reads the same at 3% and costs one
         composite. */
      content: "";
      position: fixed;
      inset: 0;
      z-index: 60;
      pointer-events: none;
      background: repeating-linear-gradient(
        to bottom,
        color-mix(in srgb, var(--dn-bg-sunken) 50%, transparent) 0 1px,
        transparent 1px 3px
      );
      opacity: 0.4;
    }
    ```

- ANCHOR: `.dn-hud::before,`
  ACTION: replace
  CSS:
    ```css
    .dn-hud::before,
    .dn-hud::after {
      content: "";
      position: absolute;
      width: var(--dn-bracket-l);
      height: var(--dn-bracket-l);
      pointer-events: none;
      color: var(--dn-src, var(--dn-accent));
      opacity: 0.85;
      /* The drop-shadow bleed is gone: it forced a filter pass on every
         bracketed surface. A 1px stroke at 85% opacity reads the same. */
    }
    ```

- ANCHOR: `.dn-glass {`
  ACTION: replace
  CSS:
    ```css
    .dn-glass {
      /* Flat glass: solid fill, hairline edge, one inset keyline. The
         three-layer box-shadow (two of them spread) is replaced by a single
         border + one inset highlight — same slab-of-glass read, one paint. */
      background: var(--dn-bg-raise);
      border: 1px solid var(--dn-border-strong);
      box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dn-accent) 14%, transparent);
    }
    ```

- ANCHOR: `.dn-header {`
  ACTION: replace
  CSS:
    ```css
    .dn-header {
      min-height: var(--dn-header-h);
      display: flex;
      align-items: center;
      gap: var(--dn-space-4);
      padding: 0 var(--dn-space-4);
      /* Solid translucent fill — no backdrop-filter (the shell owns the
         sticky header; this class is the fallback chrome). */
      background: color-mix(in srgb, var(--dn-bg-raise) 92%, transparent);
      border-bottom: 1px solid var(--dn-border-strong);
    }
    ```

- ANCHOR: `.dn-status {`
  ACTION: add-after
  CSS:
    ```css
    /* Status row: the LED is the only animated thing here, and it is
       transform/opacity only (dn-led). Text stays put. */
    ```

- ANCHOR: `.dn-section-head {`
  ACTION: replace
  CSS:
    ```css
    .dn-section-head {
      margin: var(--dn-space-6) 0 var(--dn-space-4);
      padding-bottom: var(--dn-space-2);
      /* One hairline in the source hue; the color-mix against --dn-border
         is dropped (it forced a second color resolution per section). */
      border-bottom: 1px solid var(--dn-src, var(--dn-accent));
    }
    ```

- ANCHOR: `.dn-org pre {`
  ACTION: replace
  CSS:
    ```css
    .dn-org pre {
      font-family: var(--dn-font-mono);
      font-size: var(--dn-text-sm);
      line-height: 1.5;
      tab-size: 4;
      background: var(--dn-bg-sunken);
      border: 1px solid var(--dn-border);
      border-left: 3px solid var(--dn-src, var(--dn-accent));
      border-radius: var(--dn-radius-sm);
      padding: 0.9em 1.1em;
      margin: 1.2em 0;
      overflow-x: auto;
      /* The glow rail and inner shadow are gone: a 3px solid rail in the
         source hue is the signal. Hover no longer changes box-shadow. */
    }
    .dn-org pre:hover {
      border-left-color: var(--dn-src, var(--dn-accent));
    }
    .dn-org pre.example {
      border-left-color: var(--dn-accent-2);
    }
    ```

---

## PATCH home.svelte.txt 12

- ANCHOR: `.home {`
  ACTION: replace
  CSS:
    ```css
    .home {
      height: calc(100dvh - var(--dn-header-h));
      overflow-y: auto;
      padding: var(--dn-space-7) var(--dn-space-5) var(--dn-space-8);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--dn-space-6);
    }
    ```

- ANCHOR: `.hero {`
  ACTION: replace
  CSS:
    ```css
    .hero {
      position: relative;
      /* Hero composition: a single centered column, max 62ch, with a
         deliberate vertical rhythm. The ::before halo is gone (see below). */
      max-width: 62ch;
      width: 100%;
      text-align: center;
      isolation: isolate;
      padding: var(--dn-space-5) var(--dn-space-4) var(--dn-space-2);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--dn-space-3);
    }
    ```

- ANCHOR: `.kicker {`
  ACTION: replace
  CSS:
    ```css
    .kicker {
      color: var(--dn-acid);
      letter-spacing: var(--dn-track-wide);
      margin: 0;
      text-shadow: none;
      font-size: var(--dn-text-xs);
    }
    ```

- ANCHOR: `.wordmark {`
  ACTION: replace
  CSS:
    ```css
    .wordmark {
      font-family: var(--dn-font-display);
      /* Hero display: one step above the page title, clamped so phones get
         a legible size and desktops get presence. */
      font-size: clamp(2.4rem, 8vw, 4.4rem);
      font-weight: 400;
      letter-spacing: 0.02em;
      line-height: var(--dn-lh-tight);
      background: var(--dn-wordmark);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      /* Chromatic fringe only — the 34px halo is gone (it was a paint cost
         with no legibility gain). */
      text-shadow:
        -1px 0 color-mix(in srgb, var(--dn-accent-2) 45%, transparent),
        1px 0 color-mix(in srgb, var(--dn-accent) 35%, transparent);
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      margin: 0;
    }
    ```

- ANCHOR: `.tagline {`
  ACTION: replace
  CSS:
    ```css
    .tagline {
      color: var(--dn-accent-dim);
      letter-spacing: 0.12em;
      font-size: var(--dn-text-xs);
      text-transform: lowercase;
      margin: 0;
      text-shadow: none;
    }
    ```

- ANCHOR: `.feed {`
  ACTION: replace
  CSS:
    ```css
    .feed {
      min-height: 1.2em;
      margin: 0;
      font-size: var(--dn-text-xs);
      letter-spacing: var(--dn-track-tight);
      color: var(--dn-fg-faint);
      text-shadow: none;
    }
    ```

- ANCHOR: `.feed-caret {`
  ACTION: replace
  CSS:
    ```css
    .feed-caret {
      color: var(--dn-hot);
      /* The blink is the one surviving desktop loop on Home: a 1.1s steps()
         opacity toggle on a single glyph. Phones park it (see PHONE). */
      animation: dn-blink 1.1s steps(1, end) infinite;
    }
    ```

- ANCHOR: `.lede { color: var(--dn-fg-muted); font-size: 1rem; line-height: 1.65; margin: 0; }`
  ACTION: replace
  CSS:
    ```css
    .lede {
      color: var(--dn-fg-muted);
      font-size: var(--dn-text-md);
      line-height: var(--dn-lh-body);
      margin: 0;
      max-width: 54ch;
    }
    ```

- ANCHOR: `.stats {`
  ACTION: replace
  CSS:
    ```css
    .stats {
      width: min(44rem, 100%);
      margin-top: var(--dn-space-4);
      text-align: left;
      display: grid;
      gap: var(--dn-space-3);
      padding: var(--dn-space-4) var(--dn-space-5) var(--dn-space-5);
      /* Layered flat: raise surface + one hairline border + one inset
         keyline. No gradient overlay, no 40px drop shadow. */
      background: var(--dn-bg-raise);
      border: 1px solid var(--dn-border-strong);
      border-left: 3px solid var(--dn-src, var(--dn-accent));
      border-radius: 0;
      box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dn-accent) 12%, transparent);
    }
    ```

- ANCHOR: `.hero::before {`
  ACTION: replace
  CSS:
    ```css
    .hero::before {
      /* Hero halo removed. It was three radial gradients + filter: blur(8px)
         on a viewport-sized layer — the single most expensive paint on Home.
         The constellation SVG already carries the "signal on" read. */
      content: none;
    }
    ```

- ANCHOR: `.src-card {`
  ACTION: replace
  CSS:
    ```css
    .src-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--dn-space-1);
      text-align: left;
      color: var(--dn-fg);
      /* Flat card: solid fill + hairline border + source-hue left rail.
         The 280%-wide sheen background layer is gone. */
      background: var(--dn-bg-raise);
      border: 1px solid var(--dn-border);
      border-left: 3px solid var(--dn-src, var(--dn-accent));
      border-radius: 0;
      padding: var(--dn-space-3) var(--dn-space-4);
      cursor: pointer;
      transition: border-color 120ms, background-color 120ms;
    }
    .src-card:hover {
      background-color: color-mix(in srgb, var(--dn-src, var(--dn-accent)) 8%, var(--dn-bg-raise));
      border-color: var(--dn-src, var(--dn-accent));
    }
    ```

- ANCHOR: `.cta {`
  ACTION: replace
  CSS:
    ```css
    .cta {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--dn-space-1);
      min-width: 15rem;
      text-align: left;
      color: var(--dn-fg);
      background: var(--dn-bg-raise);
      border: 1px solid var(--dn-border-strong);
      border-left: 3px solid var(--dn-src, var(--dn-accent));
      padding: var(--dn-space-3) var(--dn-space-4);
      cursor: pointer;
      transition: border-color 120ms, background-color 120ms;
    }
    .cta:hover {
      background: color-mix(in srgb, var(--dn-src, var(--dn-accent)) 8%, var(--dn-bg-raise));
      border-color: var(--dn-src, var(--dn-accent));
    }
    /* The ::after sheen and the translateY(-2px) lift are gone. */
    ```

- ANCHOR: `.card {`
  ACTION: replace
  CSS:
    ```css
    .card {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--dn-space-1);
      text-align: left;
      font-family: var(--dn-font-prose);
      color: var(--dn-fg);
      background: var(--dn-bg-raise);
      border: 1px solid var(--dn-border);
      border-radius: 0;
      padding: var(--dn-space-3) var(--dn-space-4);
      cursor: pointer;
      transition: border-color 120ms, background-color 120ms;
    }
    .card:hover {
      border-color: var(--dn-src, var(--dn-accent));
      background: color-mix(in srgb, var(--dn-src, var(--dn-accent)) 7%, var(--dn-bg-raise));
    }
    /* The ::before spine and ::after brow hairline are removed — the left
       rail on the base state carries the source hue at rest. */
    ```

---

## PATCH app-shell.svelte.txt 4

- ANCHOR: `.shell {`
  ACTION: replace
  CSS:
    ```css
    .shell {
      display: flex;
      align-items: center;
      gap: var(--dn-space-4);
      height: var(--dn-header-h);
      padding: 0 var(--dn-space-4);
      /* Solid translucent fill. backdrop-filter: blur(9px) saturate(1.3) is
         removed — on a 4GB machine a sticky backdrop-filter repaints the
         blur every scroll frame. A 92%-opaque fill over the board reads the
         same and costs one composite. */
      background: color-mix(in srgb, var(--dn-bg-raise) 92%, transparent);
      border-bottom: 1px solid var(--dn-border-strong);
      position: relative;
    }
    ```

- ANCHOR: `.shell::after {`
  ACTION: replace
  CSS:
    ```css
    .shell::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      bottom: -1px;
      height: 1px;
      pointer-events: none;
      /* Static signal rail: one gradient, no animation, no repeating layer.
         The header is the top of the instrument at rest. */
      background: linear-gradient(90deg,
        transparent 2%,
        color-mix(in srgb, var(--dn-accent) 70%, transparent) 30%,
        color-mix(in srgb, var(--dn-src, var(--dn-accent)) 60%, var(--dn-accent-2)) 55%,
        color-mix(in srgb, var(--dn-accent-2) 70%, transparent) 78%,
        transparent 98%);
      opacity: 0.85;
    }
    ```

- ANCHOR: `.scope {`
  ACTION: replace
  CSS:
    ```css
    .scope {
      position: absolute;
      left: 0.9rem;
      bottom: 0.9rem;
      z-index: 5;
      font: inherit;
      letter-spacing: var(--dn-track);
      color: var(--dn-fg);
      /* Solid fill, no backdrop-filter — the chip floats over the canvas
         and a blur there is the worst place for one. */
      background: color-mix(in srgb, var(--dn-bg) 90%, transparent);
      border: 1px solid var(--dn-border-strong);
      border-radius: 0;
      padding: 0.35em 0.75em;
      cursor: pointer;
      max-width: min(30rem, calc(100vw - 2rem));
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .scope:hover {
      color: var(--dn-accent);
      border-color: var(--dn-accent);
    }
    ```

- ANCHOR: `.layout {`
  ACTION: replace
  CSS:
    ```css
    .layout {
      position: absolute;
      left: 0.9rem;
      bottom: 0.9rem;
      z-index: 5;
      font: inherit;
      letter-spacing: var(--dn-track);
      color: var(--dn-fg);
      background: color-mix(in srgb, var(--dn-bg) 90%, transparent);
      border: 1px solid var(--dn-border-strong);
      border-radius: 0;
      padding: 0.35em 0.75em;
      cursor: pointer;
    }
    .scope ~ .layout { bottom: 2.9rem; }
    .layout:hover {
      color: var(--dn-accent);
      border-color: var(--dn-accent);
    }
    .layout.spread {
      color: var(--dn-accent);
      border-color: var(--dn-accent);
      background: color-mix(in srgb, var(--dn-accent) 12%, var(--dn-bg));
    }
    ```

---

## PATCH graph-view.svelte.txt 1

- ANCHOR: `.skel .sweep {`
  ACTION: replace
  CSS:
    ```css
    .skel .sweep {
      /* The sweep is gone: a full-bleed animated gradient on the loading
         state is exactly when the phone can least afford it. The orbs
         resting on their lit frame are the whole skeleton. */
      display: none;
    }
    ```

---

## PATCH docneural-ui.css 2 (phone)

- ANCHOR: `@media (max-width: 700px) {`
  ACTION: replace
  CSS:
    ```css
    /* ---------- PHONE (≤700px): the static board ---------------------------
       Owner law: performance beats eye candy; phones get performance,
       responsiveness, lightweight, simple. Zero animations. Native document
       scroll. 40px+ tap targets. No horizontal overflow at 390px. */
    @media (max-width: 700px) {
      /* Kill every remaining loop. */
      .spark,
      .dn-firing,
      .dn-led-dot,
      .feed-caret,
      .dn-neuron-mark { animation: none; }

      /* The fixed background attachment drops: on mobile GPUs a fixed layer
         repaints into every scroll frame (and iOS ignores it anyway). */
      body.dn-body {
        background-attachment: scroll, scroll, scroll;
      }

      /* Prose gets a touch more line-height; the grid gets coarser so it
         does not alias into a moiré on phone DPI. */
      body.dn-body {
        background-size: 100% 100%, 96px 96px, 96px 96px;
      }
      .dn-org { line-height: var(--dn-lh-loose); }

      /* Headings clamp so a long title never overflows 390px. */
      .dn-org h1 { font-size: clamp(1.4rem, 6.5vw, var(--dn-text-2xl)); }
      .dn-org h2 { font-size: clamp(1.15rem, 5.5vw, var(--dn-text-xl)); }
      .dn-org h3 { font-size: clamp(1.05rem, 5vw, var(--dn-text-lg)); }

      /* Tap comfort: every interactive chrome clears 40px. */
      .dn-nav a,
      .dn-body .seg,
      .dn-body .tool,
      .dn-body .menu,
      .dn-body .cpy,
      .dn-body .raw,
      .dn-body .pager-btn,
      .dn-body .resume,
      .dn-body .src-card,
      .dn-body .cta,
      .dn-body .card,
      .dn-body .mk,
      .dn-body .tab,
      .dn-body .tag-chip,
      .dn-body .link-btn,
      .dn-body .more,
      .dn-body .expand,
      .dn-body .chapter,
      .dn-body .home,
      .dn-body .pinned button {
        min-height: 44px;
      }

      /* Panels lose their inner keyline (a paint cost for a hairline that
         does not read at phone DPI). */
      .dn-glass,
      .dn-header { box-shadow: none; }

      /* The bracket arms shrink so they do not crowd a small panel. */
      :root { --dn-bracket-l: 10px; }
    }
    ```

- ANCHOR: `@media (max-width: 600px) {` (in `docneural-ui.css`, the safe-area block)
  ACTION: replace
  CSS:
    ```css
    @media (max-width: 600px) {
      :root {
        --dn-header-h: calc(3.25rem + env(safe-area-inset-top, 0px));
      }
    }
    ```

---

## PHONE

The revised phone blocks, consolidated. These replace every `≤640px` / `≤700px` / `≤600px` block I touch across the three component files.

**`docneural-ui.css` — phone block (replaces the existing `@media (max-width: 700px)` at end of file):**

```css
@media (max-width: 700px) {
  .spark,
  .dn-firing,
  .dn-led-dot,
  .feed-caret,
  .dn-neuron-mark { animation: none; }

  body.dn-body {
    background-attachment: scroll, scroll, scroll;
    background-size: 100% 100%, 96px 96px, 96px 96px;
  }
  .dn-org { line-height: var(--dn-lh-loose); }
  .dn-org h1 { font-size: clamp(1.4rem, 6.5vw, var(--dn-text-2xl)); }
  .dn-org h2 { font-size: clamp(1.15rem, 5.5vw, var(--dn-text-xl)); }
  .dn-org h3 { font-size: clamp(1.05rem, 5vw, var(--dn-text-lg)); }

  .dn-nav a,
  .dn-body .seg,
  .dn-body .tool,
  .dn-body .menu,
  .dn-body .cpy,
  .dn-body .raw,
  .dn-body .pager-btn,
  .dn-body .resume,
  .dn-body .src-card,
  .dn-body .cta,
  .dn-body .card,
  .dn-body .mk,
  .dn-body .tab,
  .dn-body .tag-chip,
  .dn-body .link-btn,
  .dn-body .more,
  .dn-body .expand,
  .dn-body .chapter,
  .dn-body .home,
  .dn-body .pinned button { min-height: 44px; }

  .dn-glass,
  .dn-header { box-shadow: none; }
  :root { --dn-bracket-l: 10px; }
}
```

**`home.svelte.txt` — phone block (replaces the existing `@media (max-width: 700px)` at end of style):**

```css
@media (max-width: 700px) {
  .home {
    height: auto;
    overflow: visible;
    min-height: 0;
    padding: var(--dn-space-5) var(--dn-space-4) var(--dn-space-7);
    gap: var(--dn-space-5);
  }
  .hero {
    padding: var(--dn-space-4) var(--dn-space-3) var(--dn-space-2);
    gap: var(--dn-space-3);
    max-width: 100%;
  }
  .wordmark { font-size: clamp(2.2rem, 9vw, 3.4rem); }
  .lede { line-height: var(--dn-lh-loose); max-width: 100%; }
  .stats {
    padding: var(--dn-space-3) var(--dn-space-4);
    width: 100%;
  }
  .stats .dn-kv .num { font-size: 1.3rem; }

  /* Thumb law: every control clears 44px. */
  .resume, .mk { min-height: 44px; align-items: center; }
  .cta { min-height: 48px; }
  .src-card { min-height: 44px; }
  .card { min-height: 44px; }

  /* Zero loops on phone. */
  .rail::before { animation: none; transform: translateX(-120%); }
  .feed-caret { animation: none; }

  /* The rail and bus are static strips — they already are, but restated
     here so a future edit does not reintroduce a loop. */
  .rail, .bus { animation: none; }
}
```

**`app-shell.svelte.txt` — phone block (replaces the existing `@media (max-width: 700px)` at end of style):**

```css
@media (max-width: 700px) {
  .reader-mode { overflow-y: auto; }

  /* Sticky header: solid translucent fill, no backdrop-filter. z 40 sits
     under the scanline overlay (60), over page content. */
  .shell {
    position: sticky;
    top: 0;
    z-index: 40;
    background: color-mix(in srgb, var(--dn-bg-raise) 96%, transparent);
  }
  .shell::after { animation: none; }
  .spark { animation: none; }
  .status .led { animation: none; }
  .panel .dots { animation: none; }
}
```

**`app-shell.svelte.txt` — 600px block (replaces the existing `@media (max-width: 600px)`):**

```css
@media (max-width: 600px) {
  .seg {
    padding: 0;
    width: 44px;
    height: 44px;
    justify-content: center;
  }
  .seg .bracket, .seg .seg-txt { display: none; }
  .seg .seg-ico { font-size: 1.2rem; }
  .tool.kbd, .tool.keys { display: none; }
  .shell {
    padding: env(safe-area-inset-top, 0px)
             max(0.5rem, env(safe-area-inset-right, 0px))
             0
             max(0.5rem, env(safe-area-inset-left, 0px));
    gap: 0.5rem;
  }
  .controls {
    left: 0.5rem;
    right: 0.5rem;
    width: auto;
    padding: 0.5rem 0.7rem;
    top: max(0.5rem, env(safe-area-inset-top, 0px));
  }
  .controls > summary {
    display: flex;
    align-items: center;
    gap: 0.5em;
    min-height: 44px;
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    color: var(--dn-fg);
    cursor: pointer;
    list-style: none;
  }
  .controls > summary::-webkit-details-marker { display: none; }
  .controls > summary .dn-neuron-mark { width: 0.7em; height: 0.7em; }
  .controls > summary .chev { margin-left: auto; color: var(--dn-fg-muted); }
  .controls[open] > summary .chev { transform: rotate(180deg); }
  .scope, .layout { bottom: calc(0.9rem + env(safe-area-inset-bottom, 0px)); }
  .scope ~ .layout { bottom: calc(2.9rem + env(safe-area-inset-bottom, 0px)); }
}
```

---

## RATIONALE

- **Aurora removed** (`body.dn-body::before`): a full-viewport `position: fixed` layer with four radial gradients and a 26s transform loop. It composited once but repainted on theme flip and every time the browser resized the visual viewport (mobile URL-bar). The body vignette already does the edge-falloff job at zero loop cost.
- **Scanline mask removed**: `mask-image: radial-gradient(...)` on a `position: fixed` overlay forces the compositor to evaluate the mask on every scroll frame on low-end GPUs. The unmasked repeating gradient reads identically at 3% and costs one composite.
- **`backdrop-filter` removed from `.shell` and `.scope`**: a sticky backdrop-filter repaints the blur every scroll frame — the single most expensive thing on the phone. A 92–96% opaque solid fill over the board is visually equivalent and free.
- **`filter: blur(8px)` hero halo removed**: a viewport-sized blurred layer was the most expensive paint on Home. The constellation SVG already carries the "signal on" read; the hero now rests on its type and brackets.
- **`.dn-hud` bracket `filter: drop-shadow` removed**: a filter pass on every bracketed surface (hero, stats, src-cards, panels). A 1px stroke at 85% opacity reads the same and paints once.
- **Card/CTA/sheen layers removed**: the 280%-wide `background-image` sheen and the CTA `::after` sweep were both multi-layer backgrounds that repainted on hover. Flat fill + hairline border + source-hue left rail carries the same information at rest.
- **Type scale unified**: the ad-hoc `1.6rem` / `1.12rem` / `1.3rem` values across `docneural-ui.css` and `home.svelte.txt` now all read from `--dn-text-*` and `--dn-lh-*`. Heading rhythm is one system.
- **Color tokens pruned**: `--dn-glow-2` and `--dn-glow-acid` survive only as short-throw focus recipes; the light theme sets all three glows to `none` (no bloom on paper). `--dn-violet` is retained for the wordmark gradient only.
- **Phone: zero loops, native scroll, 44px targets**: every `animation` on phone is parked (`spark`, `dn-firing`, `dn-led-dot`, `feed-caret`, `dn-neuron-mark`, `rail::before`, `shell::after`, `skel .sweep`). `background-attachment: fixed` drops. Tap targets raised from 40px to 44px. Home scrolls the document natively.
- **Skipped areas (out of budget)**: `graph-view.svelte.txt` `.skel` orbs (kept as static lit dots — the sweep is gone but the orbs remain as a "field of neurons" promise); `index.html.txt` (no CSS to change); `docneural-ui.css` §3 `.dn-org` table/footnote refinements (already on-grid); `app-shell.svelte.txt` `.panel` / `.help` / `.overlay` (already flat enough, and the failure/help states are not on the hot path).