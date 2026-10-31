# Network controls specification

This is a design contract for the force-graph 1.51 integration. It is
deliberately implementable without a dependency or a second animation loop.
The graph remains the only continuously painted surface: the controls are
DOM chrome over the existing canvas.

## Arrows

Do not paint 30,915 arrowheads. Arrowheads are an interaction LOD:

- At zoom `>= 0.75`, paint arrows only on links incident to the selected node,
  plus the currently hovered link. If no node is selected, paint only the
  hovered link. Cap the selected incident set at 24 links, choosing the
  nearest 24 by the existing graph link order; the cap is deterministic.
- At zoom `< 0.75`, paint only the hovered link. This keeps full zoom-out at
  zero arrows in the common idle case and at most one arrow while inspecting a
  dense field.
- Arrowheads point source -> target, including reciprocal links (each link has
  its own head). They are 4 CSS px long, with a 2.5 CSS px base. The length
  does not scale with zoom; it must remain legible at the threshold rather than
  turning into a large dark wedge near the camera.
- Use `--dn-graph-arrow`: dark `#ffdf3f`, light `#7a5c00`. Against the graph
  well (`#0a1524` dark and the light graph surface in the light theme), the
  dark value measures about 12:1 and the light value is above 4.5:1; the
  token is intentionally the existing hot/reticle color, not a new
  hard-coded canvas color. The CSS token must be resolved to a literal before
  passing it to the canvas.

Use the force-graph link API, not a second canvas painter:

```ts
graph
  .linkDirectionalArrowLength((link) => arrowVisible(link) ? 4 : 0)
  .linkDirectionalArrowRelPos(1)
  .linkDirectionalArrowColor(() => resolved('--dn-graph-arrow'))
```

`arrowVisible` is the zoom/selection/hover predicate above. Keep the existing
directional particles for the selected node only; arrows are the static
direction cue and particles are not an additional direction treatment.
The engine must refresh the accessor state through its existing repaint path
when selection, hover, or zoom changes. No CSS animation is added.

## Spread spacing

Change the spread defaults to:

```ts
link.distance = 220
charge.strength = -(44 + labelExtent * 1.1)
distanceMax = 520
```

`labelExtent` remains the current measured maximum rendered label extent from
`src/lib/core/graph.ts`; it is not replaced with a node-count heuristic. The
current formula starts at `20 + labelWidth * 0.5`, which is less than one
label extent plus a small gap. The new term reserves approximately one full
label extent on each competing node and a 44px baseline halo. The 220px link
length gives two adjacent labels a visible gap at the default fit instead of
asking the camera to reveal the gap only after zooming.

Keep `distanceMax` finite, but raise it from the current effective limit to
520 so the stronger charge does not collapse long citations into a dense
central knot. This is a layout-only change; lattice and route layouts retain
their own spacing.

The acceptance check is a 1386-node corpus render at the default spread fit:
sample all labels in the visible viewport and require zero intersecting label
rectangles, with a documented exception for labels hidden by the existing
far-LOD policy. If the check fails, tune `labelExtent` measurement, not a
one-off node offset.

## Lock

Recommend pinning positions, not trying to pause force-graph internals.
force-graph has no pause API, and `cooldownTicks(0)` would make unlock/reheat
semantics fragile. On lock:

1. Read every current node `{ x, y }` from the graph data and set
   `node.fx = node.x` and `node.fy = node.y`.
2. Set `locked = true`; leave the graph's current camera and selected node
   untouched.
3. Keep navigation, zoom, edge inspection, and endpoint jumps enabled. A
   jump changes the camera, never the pinned coordinates.

On unlock, delete `fx` and `fy` for every node, set `locked = false`, set
`cooldownTicks(90)`, and call `d3ReheatSimulation()` (the force-graph
instance method). The existing cooldown/engine loop owns the short settling
period; do not create a timer or RAF. A layout change while locked first
unpins, applies the layout, then re-pins after the next synchronous node
position read.

Place the 44px lock button in the top-right corner chrome, immediately beside
the layout chip and before the zoom controls. `aria-label` is `"Lock graph
positions"` when unlocked and `"Unlock graph positions"` when locked.
`aria-pressed` mirrors state. Default is unlocked on every load. The locked
state uses `--dn-hot` for the icon/stroke and
`--dn-control-locked-bg` for the button background. Define that token as dark
`#25320a` and light `#fff3bf`; both combinations retain a visible border. Do
not rely on color alone: use the pressed attribute and a closed-lock icon.

On phones the same 44px target remains in the top-right cluster. The cluster
may be inset by the safe-area value, but it does not become a swipe region:
pointer events belong to the buttons, and the canvas remains the pan surface
between controls.

## Zoom buttons

The top-right cluster is one vertical stack: lock, zoom in, zoom out, fit.
Every button is at least 44x44px with a 4px gap. Zoom in and out call the
engine's `zoom` method around the graph viewport center with a factor of
`1.25` and `0.8`, respectively; they do not call `fitReadable`.

The fit button calls `fitReadable` using the active layout and existing
padding. It has no disabled state. Zoom buttons are disabled at the engine's
actual scale bounds (`0.35` minimum and `4` maximum), not at a guessed
camera value; use `aria-disabled` and the native `disabled` property so
keyboard and touch behavior agree. Wheel/pinch behavior remains unchanged.
There are no button keyframe animations.

## Distance buttons

Put `−` and `+` in a horizontal 44px-button pair at bottom-right, above the
canvas edge and outside the trail sheet's bottom-left route area. Use
`aria-label="Decrease graph distance"` and `"Increase graph distance"`.

The persisted value is `localStorage` key
`docneural.graph.spreadDistance.v1`. Valid values are 80..280 inclusive in
20px steps; the default is 220. Ignore a missing, non-numeric, or out-of-range
stored value and use 220. The buttons are disabled at 80 and 280.

Changing the value only affects spread: update each link's `distance`
accessor, call `d3ReheatSimulation()`, and use `cooldownTicks(36)` for the
short settle. Do not rebuild graph data, refetch the corpus, or restart the
WebGL context. Pinning is cleared for this operation (a locked graph must
remain visually locked only if the user explicitly locks again after the
distance change); announce the change in a visually hidden status node.

## Edge click and link peek

Configure the existing force-graph instance with:

```ts
graph.edgeHoverPrecision(8)
```

Eight canvas pixels is the hit tolerance, large enough for a finger without
making adjacent dense wires indistinguishable. On hover, the hit wire is
painted at 2x its normal width and uses `--dn-hot`; the canvas wrapper gets
`cursor: pointer`. Restore the normal width/color on leave. Do not animate
the width.

Register `onLinkHover` and `onLinkClick` at the same pass-through boundary as
`onNodeClick` in `vendor/orui/src/lib/graph/GraphView.svelte`. A click opens a
DOM edge-peek panel; it does not navigate immediately. The panel is
positioned in the upper-left of the graph well below the layout/trail chip,
with a max width of `min(360px, calc(100vw - 32px))`; on narrow phones it
becomes a bottom sheet above the trail sheet with a 12px gap.

For link `{ source, target }`, fetch `ctx/<source>.json` on demand, once per
source per session, with the current Vite base path. Read the entry whose key
is exactly `"<source>><target>"`. Show:

- source and target names as 44px minimum jump buttons;
- the direction glyph and `source -> target`;
- the citing line/value from that context entry, with `white-space: pre-wrap`;
- loading and fetch-error states; and
- an explicit empty state, `"No citing line recorded for this link."`, when
  the JSON has no matching entry.

Endpoint buttons focus the corresponding node through the existing graph
focus path, then close the panel only after the focus request is accepted.
Escape and a close button dismiss the panel. The panel must not cover the
trail sheet or steal pointer events from the rest of the canvas.

## Motion and budget

No new keyframes are permitted. Desktop gets no more than six total animation
loops including existing loops; the control work adds zero. Phone adds zero
loops. Reheat is a bounded force simulation cooldown, not a DOM animation.
