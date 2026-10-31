# Risks and mitigations

1. **Arrow paint cost at 30,915 wires.** A per-link arrow accessor must not
   become 30,915 triangle draws at corpus scale. Gate arrows by zoom and
   selection, cap selected incident links at 24, and render at most one
   hovered arrow. Measure canvas frame time at idle and with a high-degree
   node selected; reject the change if the desktop budget exceeds six total
   loops or phone gains any loop.

2. **Distance changes can jank a phone.** Reheating the full simulation on
   every tap can monopolize the main thread. Update the existing link accessor
   in place, use only 36 cooldown ticks, coalesce rapid taps to the latest
   persisted value, and keep the distance range bounded to 80..280. Locking
   pins positions so navigation itself never reheats.

3. **WebGL context loss or accidental second renderer.** Controls and the
   peek panel must be DOM overlays; they must never construct a canvas,
   renderer, RAF, or force-graph instance. Keep the existing `GraphView`
   lifetime and verify a single WebGL context before and after repeated
   open/close, theme, and layout interactions. Fetch context JSON only on
   link click and cache it per source.

4. **Stronger spacing can regress label overlap or make the graph too sparse.**
   The new `labelExtent`-based charge and 220px default must be checked against
   the full 1386-node corpus, not a hand-picked neighborhood. Use rectangle
   intersection sampling at default spread fit, preserve the 520px
   `distanceMax`, and tune the shared extent calculation if labels collide
   rather than adding node-specific offsets.

5. **Chrome and edge highlighting can collide with the trail route painter.**
   Reserve the top-right corner for the vertical controls, reserve the
   bottom-right for distance buttons, and place the desktop peek panel
   upper-left. On phones move the panel above the trail sheet, keep all
   targets at least 44px, and set explicit z-order/pointer ownership. Verify
   route painting, endpoint jumps, Escape dismissal, and canvas pan still work
   with a selected link.
