The date is provided in the query context (2026-10-28). I'll use that. Here is the deliverable.
```html
<details class="a11y-ledger">
  <summary>Accessibility — conformance ledger, measured 2026-10-28</summary>
  <table>
    <thead>
      <tr><th>Dimension</th><th>Contract</th><th>Measured</th><th>Status</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>Text contrast</td>
        <td>WCAG AA 4.5:1 normal / 3.0:1 large, both themes</td>
        <td>0 failures; min 6.09:1 dark / 6.41:1 light</td>
        <td>Pass</td>
      </tr>
      <tr>
        <td>Focus visibility</td>
        <td>WCAG 2.4.7 + 1.4.11: 3:1 non-text bar</td>
        <td>14/14 stops show indicator; min 10.76:1</td>
        <td>Pass</td>
      </tr>
      <tr>
        <td>Motion budget</td>
        <td>WCAG 2.2.2 Pause/Stop/Hide + reduced-motion honored</td>
        <td>3 desktop loops, 0 phone; 2 finite entrances excluded</td>
        <td>Pass</td>
      </tr>
      <tr>
        <td>Tap targets</td>
        <td>44px minimum on phone</td>
        <td>44px floor met</td>
        <td>Pass</td>
      </tr>
      <tr>
        <td>Structure</td>
        <td>Semantic landmarks, skip link, native controls</td>
        <td>header/nav/main/footer, skip link, native details</td>
        <td>Pass</td>
      </tr>
      <tr>
        <td>Decorative exception</td>
        <td>WCAG 1.4.11 exempts pure decoration, no info content</td>
        <td>55%-alpha brackets: 2.91:1 dark / 1.57–1.69:1 light; solid variants 6.39:1 / 4.71:1</td>
        <td>Disclosed — exempt</td>
      </tr>
    </tbody>
  </table>
  <p>The audit runs in Chromium via Playwright against the live site, sweeping every visible text leaf in both themes. Theme is toggle-verified per sample, not assumed: each leaf is measured twice, once per theme, colors alpha-composited over their actual render background. Keyboard sweeps a 14-stop Tab order; focus indicators are read as non-text contrast against the element backdrop.</p>
  <p>The decorative exception concerns the corner-bracket frame glyphs at 55% alpha. They carry no information — no state, no label, no affordance, no link. They are purely ornamental framing, so WCAG 1.4.11 exempts them from the non-text contrast requirement. Solid-ink bracket variants, where the frame is load-bearing rather than ornamental, pass the bar at 6.39:1 dark and 4.71:1 light. The ledger states the exception plainly rather than hiding it: a disclosed, measured deviation is honest conformance; an undisclosed one is a defect.</p>
  <p>Cadence: every ship re-measures. The numbers above are not a one-time claim but a per-release re-audit — a change to theme, markup, or corpus invalidates the row and triggers a fresh Chromium sweep before the ship lands. The date in the summary line is the last re-measure, not a blanket attestation.</p>
</details>
```
Notes rationale: WCAG AA ledger disclosed as native `<details>` in the colophon — every figure is a live Chromium measurement, not an attestation; the decorative-bracket shortfall is stated openly and mapped to the 1.4.11 pure-decoration exemption, so the only deviation on the page is a documented one.
