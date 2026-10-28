## VERDICT
*   **KEEP: Dark Theme (Img 1, 3).** The terminal aesthetic is cohesive, high-contrast, and perfectly matches the "night terminal" identity. The neon accents on dark provide excellent visual hierarchy.
*   **KEEP: Typography & Data Density.** The use of monospaced fonts for data (Electrolize/JetBrains) and the information-dense "Corpus" card create a strong technical identity that feels like a real tool.
*   **KEEP: Layout Structure (Desktop, Img 3).** The centered hero with the floating network graph and the left-aligned stats card creates a solid, grounded composition.
*   **FIX: Light Theme Contrast (Img 2, 4).** The light mode fails the "clean paper" identity. The background is a muddy grey-blue, and text contrast is dangerously low (especially the purple headline and grey body text), likely failing WCAG AA.
*   **FIX: Phone Header Behavior (Img 1 vs 2).** On the phone (390px), the top navigation bar (`[DOCS]`, `[SYNAPSES]`) is cramped. In the dark version, it looks like a sticky header; in the light version, it blends into the background noise.
*   **FIX: Visual Rhythm/Spacing (Img 4).** The light desktop view lacks "breathing room." The section spacing between the Hero, Description, and Corpus card feels tighter and less rhythmic than the dark version.
*   **FIX: Graph Visibility (Img 4).** The "neural network" connection lines in the background graph are nearly invisible in the light theme, losing the visual metaphor of "wired together."
*   **FIX: Status Colors (Img 2).** The orange accent color used for the `[DOCS]` button and the left border of the corpus card has insufficient contrast against the light grey background.

## FIX TARGETS
1.  **Light Mode Background & Text (Img 2, 4)** -> Shift to true "Paper" white (`#ffffff` or `#fafafa`) for the base. Increase body text contrast to near-black (`#111`) and ensure the primary headline (Purple) meets WCAG AA (4.5:1) against white.
2.  **Graph Opacity/Lightness (Img 4)** -> Increase the stroke opacity and node visibility of the background network graph for the light theme so the "synapses" are visible without being distracting.
3.  **Phone Navigation Tap Targets (Img 1, 2)** -> Increase padding inside the top nav buttons (`[DOCS]`, etc.) to ensure they meet the 44px minimum touch target height, or switch to icon-only labels if space is critical.
4.  **Accent Color Accessibility (Img 2)** -> Darken the "Active" orange/red accent colors used for borders and buttons in the light theme to ensure they aren't the only signal (add an underline or bold weight).
5.  **Vertical Spacing Ramp (Img 4)** -> Add `margin-bottom` or `gap` increments between the Hero Title, Subtitle, Body Copy, and the Corpus Card in the light view to match the airy feel of the dark view.
6.  **Animation Policy (Owner Law #2)** -> Verify that the 4 running CSS animations (`dn-pulse`, etc.) are completely disabled or reduced to `prefers-reduced-motion: reduce` defaults on the phone viewport (390px) to satisfy "zero animations" on mobile.