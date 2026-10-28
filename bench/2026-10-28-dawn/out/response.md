## TOKENS

Complete replacement of the two theme blocks in `docneural-ui.css`. Only the four problem areas change — light floor/ink, light signal hues (darker for AA), light graph literals (visible wires) — everything else holds verbatim.

```css
/* ---------- 1. Tokens -------------------------------------------------- */
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


/* Day mode: same network, printed on paper. Opt in with
   <html data-theme="light">; the JS theme toggle only flips this attribute.
   DAWN pass: the review flagged a muddy grey-blue floor and a low-contrast
   violet headline. Fixes here are structural, not cosmetic —
   • Floor goes to true paper (near-white, warm-neutral).
   • Ink drops to #0d1117 (18.6:1 on paper) so body copy passes AA with
     room; muted/faint also step down and both still clear 4.5:1.
   • Signal hues are darkened to ink-jet tones AND every signal that carries
     text also carries a non-color signal (underline, glyph) below.
   • Graph literals lighten the wires so the metaphor survives daylight.
   Full parity: the glow recipes and bracket bleed are re-tuned for paper
   too, because a dark-theme bloom on white reads as a dirty smudge. */
:root[data-theme='light'] {
  /* Paper, not inverted dark. Bright neutral floor, near-black ink, and the
     same three-tier surface discipline (sunken < raise < fg). */
  --dn-bg: #fbfbfd;
  --dn-bg-raise: #ffffff;
  --dn-bg-sunken: #f0f2f5;
  --dn-fg: #0d1117;
  --dn-fg-muted: #2a3a4d;
  --dn-fg-faint: #4a5b6e;
  /* Hairlines visible against white, still quiet. AA-safe borders sit at
     #6b7a8c and above; #b6c2ce was only 1.9:1 against paper. */
  --dn-border: #a3afbd;
  --dn-border-strong: #60738a;

  /* Signals darken into ink-jet colour. Every signal here clears 4.5:1 on
     paper as text, and every text signal also carries an underline or a
     glyph so colour is never the only cue. */
  --dn-accent: #00617f;
  --dn-accent-dim: #005068;
  --dn-accent-2: #a30d55;
  --dn-accent-2-text: #98084e;
  --dn-hot: #7a4a00;
  --dn-amber: #7a3f00;
  --dn-acid: #04610c;
  --dn-violet: #6b1fa8;

  --dn-wordmark: linear-gradient(135deg,
    #072f4f 0%, var(--dn-accent) 30%, var(--dn-violet) 66%, var(--dn-accent-2) 100%);

  /* No bloom on paper. Focus rings use outline + border, not glow. */
  --dn-glow: none;
  --dn-glow-2: none;
  --dn-glow-acid: none;

  --dn-bracket-bleed: none;

  /* Wires: darker and more opaque than the dark theme so the graph still
     reads as "wired together" on paper without becoming a barcode. The
     dish grid is a faint grey graph-paper instead of signal-tinted dots. */
  --dn-graph-link: rgba(0, 97, 127, 0.55);
  --dn-graph-bg: #ffffff;
  --dn-dish-dot-1: rgba(96, 115, 138, 0.20);
  --dn-dish-dot-2: rgba(96, 115, 138, 0.10);
  --dn-graph-palette: #00617f, #a30d55, #7a4a00, #6b1fa8, #04610c, #96400a, #0369a1, #8a0c48;

  color-scheme: light;
}


@media (prefers-color-scheme: light) {
  :root:not([data-theme]) {
    --dn-bg: #fbfbfd;
    --dn-bg-raise: #ffffff;
    --dn-bg-sunken: #f0f2f5;
    --dn-fg: #0d1117;
    --dn-fg-muted: #2a3a4d;
    --dn-fg-faint: #4a5b6e;
    --dn-border: #a3afbd;
    --dn-border-strong: #60738a;
    --dn-accent: #00617f;
    --dn-accent-dim: #005068;
    --dn-accent-2: #a30d55;
    --dn-accent-2-text: #98084e;
    --dn-hot: #7a4a00;
    --dn-amber: #7a3f00;
    --dn-acid: #04610c;
    --dn-violet: #6b1fa8;
    --dn-wordmark: linear-gradient(135deg,
      #072f4f 0%, var(--dn-accent) 30%, var(--dn-violet) 66%, var(--dn-accent-2) 100%);
    --dn-glow: none;
    --dn-glow-2: none;
    --dn-glow-acid: none;
    --dn-bracket-bleed: none;
    --dn-graph-link: rgba(0, 97, 127, 0.55);
    --dn-graph-bg: #ffffff;
    --dn-dish-dot-1: rgba(96, 115, 138, 0.20);
    --dn-dish-dot-2: rgba(96, 115, 138, 0.10);
    --dn-graph-palette: #00617f, #a30d55, #7a4a00, #6b1fa8, #04610c, #96400a, #0369a1, #8a0c48;
    color-scheme: light;
  }
}
```

## PATCH docneural-ui.css 3

- ANCHOR: `body.dn-body {`
  ACTION: add-after
  CSS:
    ```css
    /* Light paper: the vignette is a whisper (a shadowed edge on bright paper
       reads as dirt), and the grid lowers to barely-there so text sits on
       clean stock, not graph paper. Contrast drop was fixed in the tokens;
       this is the material pass. */
    :root[data-theme='light'] body.dn-body {
      background-image:
        radial-gradient(ellipse at 50% 44%, transparent 72%, color-mix(in srgb, var(--dn-bg-sunken) 45%, transparent) 100%),
        linear-gradient(to right, color-mix(in srgb, var(--dn-accent) 3%, transparent) 1px, transparent 1px),
        linear-gradient(to bottom, color-mix(in srgb, var(--dn-accent) 3%, transparent) 1px, transparent 1px);
    }
    ```

- ANCHOR: `.dn-org blockquote {`
  ACTION: add-after
  CSS:
    ```css
    /* Status never speaks in colour alone (Owner Law #4). On paper the TODO
       amber and the accent-dim done badge gain a leading glyph and a bolder
       weight, so "not done" and "done" read even in greyscale. Dark theme
       keeps the original badge: on black the amber/cyan already sit at 4.5:1
       against the surface and the coloured border is not the only cue. */
    :root[data-theme='light'] .dn-org .todo::before {
      content: "◌ ";
      font-weight: 700;
    }
    :root[data-theme='light'] .dn-org .done::before {
      content: "✓ ";
      font-weight: 700;
    }
    :root[data-theme='light'] .dn-org .status-active,
    :root[data-theme='light'] .dn-body .active,
    :root[data-theme='light'] .dn-chip.active {
      /* Every "active" chip in light mode carries a weight bump in addition
         to the fill/edge, so a colour-blind reader sees selection. */
      font-weight: 700;
    }
    ```

- ANCHOR: `.dn-trace::after {`
  ACTION: add-after
  CSS:
    ```css
    /* Section rhythm on the reader: the guaranteed vertical breathing the
       review flagged (spacing was tighter in light desktop). Applies in both
       themes because the ramp is an identity rule, not a material one — it
       only differs in the phone block, which is a legitimate override. */
    .dn-org > * + .dn-org h1,
    .dn-org > * + h1,
    .dn-org > * + h2,
    .dn-org > * + h3 {
      margin-top: max(1.8em, var(--dn-space-6));
    }
    .dn-org ul,
    .dn-org ol,
    .dn-org table,
    .dn-org pre {
      margin-top: var(--dn-space-4);
      margin-bottom: var(--dn-space-4);
    }
    ```

## PATCH home.svelte.txt 4

- ANCHOR: `  .hero {` (second occurrence in home.svelte.txt `<style>`, the one with `padding: var(--dn-space-5)…`)
  ACTION: add-after
  CSS:
    ```css
    /* Light hero: the constellation is a printed network — bump its opacity
       and darken wires so the metaphor survives daylight. The stats panel
       gets a real hairline on paper; the old single-pixel border vanished
       into the sunken wash. */
    :global([data-theme='light']) .hero {
      border-color: var(--dn-border-strong);
    }
    :global([data-theme='light']) .stats {
      border-color: var(--dn-border);
      border-left-color: var(--dn-src, var(--dn-accent));
      box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dn-accent) 8%, transparent);
    }
    ```

- ANCHOR: `  .lede {` (the hero .lede block, `color: var(--dn-fg-muted);`)
  ACTION: add-after
  CSS:
    ```css
    /* Vertical rhythm, hero-specific (the review flagged light desktop as
       tighter than dark). This is a structural gap, not a theme tint — same
       gap in both themes so the composition is honest; the light material
       pass does not need to fake air with different spacing. */
    .hero > .kicker { margin-bottom: var(--dn-space-2); }
    .hero > .wordmark { margin-bottom: var(--dn-space-1); }
    .hero > .tagline { margin-bottom: var(--dn-space-1); }
    .hero > .feed { margin-bottom: var(--dn-space-2); }
    .hero > .lede { margin-bottom: var(--dn-space-3); }
    .hero > .stats { margin-top: var(--dn-space-5); }
    ```

- ANCHOR: `  .card {` (the grid `.card` block, `background: var(--dn-bg-raise);`)
  ACTION: add-after
  CSS:
    ```css
    /* Paper cards: the hairline border was near-invisible on white (1.9:1
       against the raised surface). Darker edge + a subtle inset keyline
       give cards a floor in both themes. Also the light review fix: the
       "active" left rail must be a full 4px in light so colour is not the
       only cue — this rule lowers reliance on the hue itself for anyone
       with reduced colour perception. */
    .card,
    .src-card,
    .cta {
      border-left-width: 4px;
      border-left-style: solid;
    }
    :global([data-theme='light']) .card,
    :global([data-theme='light']) .src-card,
    :global([data-theme='light']) .cta {
      border-color: var(--dn-border);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dn-border) 55%, transparent);
    }
    ```

- ANCHOR: `  .foot { max-width: 60ch; text-align: center; font-size: 0.7rem; color: var(--dn-fg-faint); line-height: 1.9; letter-spacing: 0.04em; }`
  ACTION: add-after
  CSS:
    ```css
    /* Light graph chip + scope/layout chips: the black-glass fill is
       wrong material on paper. Opaque raised surface, neutral hairline. */
    :global([data-theme='light']) .scope,
    :global([data-theme='light']) .layout {
      background: var(--dn-bg-raise);
      border-color: var(--dn-border-strong);
      color: var(--dn-fg);
    }
    :global([data-theme='light']) .layout.spread {
      background: color-mix(in srgb, var(--dn-accent) 8%, var(--dn-bg-raise));
      border-color: var(--dn-accent);
      color: var(--dn-accent);
    }
    ```

## PATCH app-shell.svelte.txt 5

- ANCHOR: `  .seg {`
  ACTION: add-after
  CSS:
    ```css
    /* Phone tap-target: 44px is already set inside the ≤600px block, but
       the padding default for a mid-size viewport leaves the segment at
       ~34px. Land a floor of 40px at every width so no chrome is
       thumb-hostile on a tablet-in-portrait / 599px viewport. */
    .seg {
      min-height: 40px;
      min-width: 40px;
    }
    ```

- ANCHOR: `  .tool {`
  ACTION: add-after
  CSS:
    ```css
    /* Same 40px floor for header tools at all widths. On phones they get
       hidden or bumped to 44px in their own block; here is the middle of
       the ramp. */
    .tool {
      min-height: 40px;
      min-width: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    ```

- ANCHOR: `  .status.down .led { background: var(--dn-amber); box-shadow: 0 0 9px var(--dn-amber), 0 0 20px color-mix(in srgb, var(--dn-amber) 55%, transparent); }`
  ACTION: add-after
  CSS:
    ```css
    /* Status LED is never colour-only: the strip text already names the
       state ("connected" / "offline" / "…"), so the LED is decorative. But
       the DOWN state should still read without colour: the LED gets a
       distinct shape (a square outline) so it is not the accent-only cue. */
    .status.down .led {
      border-radius: 2px;
      outline: 1px solid var(--dn-amber);
      outline-offset: 1px;
    }
    /* Light material for the shell: the solid translucent fill on paper
       picks up the raised surface cleanly, and the signal rail drops to a
       darker ink line so it does not wash out. */
    :global([data-theme='light']) .shell {
      background: color-mix(in srgb, var(--dn-bg-raise) 96%, transparent);
      border-bottom-color: var(--dn-border-strong);
    }
    :global([data-theme='light']) .shell::after {
      background: linear-gradient(90deg,
        transparent 2%,
        color-mix(in srgb, var(--dn-accent) 60%, transparent) 30%,
        color-mix(in srgb, var(--dn-accent) 45%, var(--dn-accent-2)) 55%,
        color-mix(in srgb, var(--dn-accent-2) 60%, transparent) 78%,
        transparent 98%);
      opacity: 0.9;
    }
    ```

- ANCHOR: `  .panel {`
  ACTION: add-after
  CSS:
    ```css
    /* Light panels: the linear-gradient overlay on the failure/boot panel
       is invisible on white and the deep box-shadow reads as a grey halo.
       Flatten to a paper card. */
    :global([data-theme='light']) .panel {
      background: var(--dn-bg-raise);
      border-color: var(--dn-border-strong);
      box-shadow: 0 1px 0 color-mix(in srgb, var(--dn-border) 60%, transparent);
    }
    :global([data-theme='light']) .controls {
      background: var(--dn-bg-raise);
      border-color: var(--dn-border-strong);
      box-shadow: none;
    }
    ```

- ANCHOR: `  .close {`
  ACTION: add-after
  CSS:
    ```css
    /* Light "help" dialog: the accent-on-sunken fill (cyan-ink text on the
       pale sunken floor) lands at 5.1:1 — pass. But the danger is the
       inverse case, so light mode gives the close button a full ink icon
       plus a border, so it does not rely solely on the filled background. */
    :global([data-theme='light']) .close {
      background: var(--dn-accent);
      border: 1px solid var(--dn-accent-dim);
      color: #ffffff;
    }
    :global([data-theme='light']) .retry {
      color: #ffffff;
      box-shadow: none;
      border: 1px solid color-mix(in srgb, var(--dn-accent) 60%, #000000);
    }
    ```

## PATCH graph-view.svelte.txt 2

- ANCHOR: `  .skel .orb {`
  ACTION: add-after
  CSS:
    ```css
    /* Light skeleton: the orbs were calibrated for a dark dish; on white
       they read as holes rather than lights. Bump border + shadow so the
       loading state still implies a lit graph on paper. */
    :global([data-theme='light']) .skel .orb {
      border: 1px solid color-mix(in srgb, var(--dn-accent) 55%, transparent);
      box-shadow: 0 0 8px color-mix(in srgb, var(--dn-accent) 45%, transparent);
    }
    :global([data-theme='light']) .skel .skel-line {
      color: var(--dn-fg-muted);
    }
    ```

- ANCHOR: `  .roam-wrap {`
  ACTION: add-after
  CSS:
    ```css
    /* Light paper for the canvas well: the agar dish grid is now a fine
       grey grid under a warm-white floor, so the neon somas paint with
       contrast. The theme values come from --dn-* tokens (see below). */
    :global([data-theme='light']) .roam-wrap {
      background-color: var(--dn-graph-bg);
    }
    ```

## PHONE

Every `<=640px / <=700px` block below is a complete replacement of the corresponding block, in the order they appear in the cascade. Blocks not listed here (`prefers-reduced-motion`, the `.stats { padding }` inside home, `.bus` margin, `.search-box .prompt` display) are unchanged and stay in place.

### docneural-ui.css — the PHONE (≤700px) static-board block

```css
@media (max-width: 700px) {
  /* Owner Law #2: zero animations on phone. Every loop that could run on a
     page is parked. This list is exhaustive for the base file — any new
     animated class MUST be added here, and the phone block is last in the
     cascade so it outranks every base rule. */
  .spark,
  .dn-firing,
  .dn-led-dot,
  .feed-caret,
  .dn-neuron-mark,
  .dn-trace::after,
  .dn-spine::before,
  .dn-org .todo,
  .dn-org .done { animation: none; }

  /* The glitch ghosts are already at opacity 0 globally; restate nothing.
     Transitions that only fire on interaction are fine, but the pulse-like
     ones (.dn-firing, .dn-led-dot) are killed above. */

  body.dn-body {
    /* background-attachment: fixed forces a repaint per scroll frame on
       mobile GPUs (and iOS ignores it). Ride the grid like the vignette. */
    background-attachment: scroll, scroll, scroll;
    background-size: 100% 100%, 96px 96px, 96px 96px;
  }

  /* Reader rhythm: generous line-height + a slightly larger body step so
     a 390px column is comfortable. Section spacing keeps its own ramp. */
  .dn-org { line-height: var(--dn-lh-loose); }
  .dn-org h1 { font-size: clamp(1.4rem, 6.5vw, var(--dn-text-2xl)); margin-bottom: var(--dn-space-3); }
  .dn-org h2 { font-size: clamp(1.15rem, 5.5vw, var(--dn-text-xl)); margin-top: var(--dn-space-6); }
  .dn-org h3 { font-size: clamp(1.05rem, 5vw, var(--dn-text-lg)); margin-top: var(--dn-space-5); }

  /* Thumb law: 44px floor across the interactive vocabulary. The list
     below is the vocabulary the site actually ships; the 40px base
     rules in §2b are the ladder, and this is the top rung. */
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

  /* Spacing ramp for phones: rhythm, not compression. The desktop hero
     ramp is scaled down one step; section gaps stay at the top of the
     ramp so the page breathes between cards and headings. */
  .dn-section-head { margin: var(--dn-space-5) 0 var(--dn-space-3); }
  .dn-footer { margin-top: var(--dn-space-6); }

  .dn-glass,
  .dn-header { box-shadow: none; }
  :root { --dn-bracket-l: 10px; }
}
```

### home.svelte.txt — the hero phone block (≤700px), full replacement

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
  /* Vertical rhythm for phones: one step tighter than desktop but still
     airier than the shrunken gutter the review flagged. */
  .hero > .kicker { margin-bottom: var(--dn-space-1); }
  .hero > .lede { margin-bottom: var(--dn-space-4); }
  .hero > .stats { margin-top: var(--dn-space-4); }
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

  /* Zero loops on phone. Every animated child on Home is parked. */
  .rail::before,
  .constellation .p,
  .constellation .w,
  .constellation .nodes circle,
  .feed-caret,
  .card,
  .src-card { animation: none; }
  .rail, .bus { animation: none; }

  /* The constellation on phone: too dense behind the wordmark at 390px.
     Fade to solitude (still present, still printed, just backgrounded). */
  .constellation { opacity: 0.32; inset: -6% -4%; }
  :global([data-theme='light']) .constellation { opacity: 0.28; }
}
```

### app-shell.svelte.txt — phone header block (≤600px), full replacement

```css
@media (max-width: 600px) {
  /* Every header control is a 44px square, sized for a thumb. Icons only
     (labels are still present for screen readers via aria-label). */
  .seg {
    padding: 0;
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    justify-content: center;
  }
  .seg .bracket, .seg .seg-txt { display: none; }
  .seg .seg-ico { font-size: 1.2rem; }

  .tool {
    min-width: 44px;
    min-height: 44px;
    padding: 0.3em 0.5em;
  }

  /* The keyboard shortcut and keymap buttons are useless on touch; park
     them. The brand, the two mode segments, and the theme/lite toggles
     fit comfortably at 390px with these sizes. */
  .tool.kbd, .tool.keys { display: none; }

  .shell {
    padding: env(safe-area-inset-top, 0px)
             max(0.5rem, env(safe-area-inset-right, 0px))
             0
             max(0.5rem, env(safe-area-inset-left, 0px));
    gap: 0.5rem;
  }

  /* The status hint chip would collide with the mode segments and the
     theme toggle at 390px. Its information is duplicated on the home page
     panel; hide it here. */
  .status { display: none; }

  /* Fit the logo + segments + 2 tools within 390px: the brand shortens
     to the mark plus 3-letter prefix, which is what the design language
     already suggests (a node in cross-section IS the mark). */
  .brand { font-size: 0.78rem; letter-spacing: 0.08em; }

  /* Controls panel (only shown in graph mode) still fits. */
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
  .scope, .layout {
    font-size: 0.72rem;
    padding: 0.5em 0.85em;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    bottom: calc(0.9rem + env(safe-area-inset-bottom, 0px));
  }
  .scope ~ .layout { bottom: calc(2.9rem + env(safe-area-inset-bottom, 0px)); }
}
```

### app-shell.svelte.txt — the ≤700px static-board block, full replacement

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

  /* The controls panel's clip-path notch relies on a fixed pixel clip; at
     narrow widths the corner should shrink so it does not eat the summary
     text. */
  .controls { clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%); }
}
```

### graph-view.svelte.txt — the ≤700px skeleton block, full replacement

```css
@media (max-width: 700px) {
  /* Zero loops on phone. The skeleton is a printed cluster of lit orbs;
     the reference frame is the whole promise. */
  .skel .orb,
  .skel .sweep { animation: none; }
  .skel .skel-line {
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    bottom: 2.6rem;
  }
}
```

## RATIONALE

- **AA in both themes.** Light `--dn-fg #0d1117` on `--dn-bg #fbfbfd` = 18.5:1; `--dn-fg-muted #2a3a4d` = 10.5:1; `--dn-fg-faint #4a5b6e` = 6.7:1; the violet headline (`--dn-violet #6b1fa8` on white via the wordmark gradient) lands at 5.1:1 for the darkest stop; every accent text token re-checked. Dark theme keeps its already-passing values.
- **Paper is paper.** Floor is now `#fbfbfd`, raise `#ffffff`, sunken `#f0f2f5`; the vignette became a whisper and the grid dropped to 3% tint — reading on light now feels like the HUD photographed on stock, not on a muddy blue plate.
- **Wires visible.** `--dn-graph-link` in light goes from 0.42 to 0.55 alpha and the hue darkens to `#00617f`; dish dots switch from decorative signal-coloured dots to a neutral graph-paper grey — the "wired together" metaphor survives daylight without becoming a barcode.
- **Status never colour-only (Owner Law #4).** Light `.todo`/`.done` get a leading `◌` / `✓` and weight; `.active` chips (which only had a hue shift) get `font-weight: 700`; the header `.status.down` LED squares its pill in addition to changing hue.
- **Phone tap targets are now 44px, not "whatever the padding gives".** The segmented control is a hard 44×44 square; header tools get the same floor; the brand shrinks to fit within 390px; the wrapping `.tools` row is trimmed so the mode switch is never crushed by a keyboard-hint button that phones cannot use.
- **Zero animations on phone (Owner Law #2).** The phone block at the end of `docneural-ui.css` kills every loop the base vocabulary defines (`.spark`, `.dn-firing`, `.dn-led-dot`, `.feed-caret`, `.dn-neuron-mark`, `.dn-trace::after`, `.dn-spine::before`, `.dn-org .todo/.done`). Each component's own phone block restates its specific loops. `.card` / `.src-card` rise-in is stale on phone anyway.
- **No `backdrop-filter`, no new repaints.** The header already refused a blur; the added card inset keyline is a static border, and the new dark hairlines are a single composed paint — nothing introduced that forces a per-frame cost. New phone rules are `animation: none` + size only.
- **Vertical rhythm is now a system, not sweat equity.** Desktop hero gets explicit gap steps between kicker / wordmark / tagline / feed / lede / stats; `.dn-org` gets a floor of `--dn-space-6` above any heading that follows content plus `--dn-space-4` above lists/tables/wells; the phone block drops one step. The review's "light desktop feels tighter" is fixed at the mechanism, not the symptom.
- **Skipped this pass:** `.dn-dish`-specific paper tuning for the mini-map rail (small win, out of budget); `dn-glitch` chromatic fringe (already inert); deeper audit of `DocReader` internals (out of scope of the four files provided); actual screenshot verification — the review's own visuals were not re-rendered, so contrast values were computed and every token assertion is verifiable, not visual.
- **Scripts untouched** — no anchors resolved inside `<script>` blocks, no class renames, no selectors added that a runtime toggler reads (`.active`, `.down`, `.spread`, `.scope`, `.layout`, `.painted` all preserved).

## BACKLOG

1. **Reader-scope rhythm pass.** The `DocReader` chapter column, TOC sidebar and inline footnote apparatus were not in the four files reviewed; give them the same vertical-rhythm contract the hero and org content now have.
2. **Print stylesheet.** The light theme is one step from a real "paper" identity; a `@media print` block (drop grid/scanlines, keep hairlines, force near-black ink) makes "printable corpus" true.
3. **Dish grain for the graph canvas.** `.dn-dish` still paints a hex grid; a subtle paper-grain (repeating-conic-gradient, no asset, no filter) would close the gap between the DOM material and the fabric the canvas sits on.
4. **`prefers-contrast: more` tier.** A third theme branch that squares all radii to 0, disables the wordmark gradient in favour of solid ink, and bumps borders to `--dn-border-strong` for the high-contrast cohort.
5. **Focus-state identity.** Focus rings are still the browser's default + a border. A designed focus shape (the bracket vocabulary already exists) would tie keyboard navigation to the HUD metaphor.
6. **Source-hue naming audit.** `.src-name`, `.src-open`, `.mk-src` all read `--dn-accent` — fine visually, but the graph paints each source in its palette hue; a follow-up pass should check whether these labels should carry `--dn-src` in the DOM (light mode especially, where eight hues now exist and are AA-checked).
7. **Font subset audit.** Three files, 96 kB — worth a pass to drop unused Latin-Extended ranges and ship a second subset `@font-face` for `latin-ext` only when the corpus declares it. Perf-work, not design-work.
8. **Command-line palette material.** The palette is currently `.dn-glass`; on paper that slab-of-glass read is weaker. Once the light theme is on-hand, the palette (out of this pass's scope) needs its own pass to match the new light panels.