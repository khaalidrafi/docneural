## 1. VERDICTS

**F1 — SHIP, all three.** a/b are ledger drift (the ledger already lists `Search neurons` at vocab.ts:55, the component never got the edit); c is a factual error against the Owner's own glossary — an axon is the fiber, the synapse is the connection — and it is the most-read sentence on the site.

**F2 — SHIP, narrow.** Accept `graph` (canonical, forever), `network`, `synapses` (the word on the chip the user just clicked). Reject `neurons`: it names the entity, not a destination. Case-insensitive, trimmed, one parse point, unknown → home silently (unchanged). Never emit an alias from the UI.

**F3 — RESHAPE to (a), but detect on labels, not prose ratio.** Measured on the shipped sample: 1,030 of 17,400 ctx values carry ≥2 of `Previous:` / `Up:` / `Next:` (5.9%), plus 36 single-label lines ending in `]Index]` (0.2%) — the brief's 7.7% is the same population. The "strip tokens, <25% prose" rule fails on real data: stripping `Next: Previous: The Fill Prefix Up: Filling Text` leaves five words of prose, so a ratio rule misses it. Detect **≥2 distinct labels, or 1 label plus a bracket-link residue**. (b) is worse than (a): a stripped fragment still reads like a citation and isn't. Never (c).

**F4 — RESHAPE: the plate counts WIRES; refs leave the plate.** `+2` next to 30917 closes the arithmetic (30915+2) and is the same string length, so zero layout risk. Refs stay visible where they belong — as the separate lines in the card.

**F5 — SHIP.** Sizing bug, not a design change. Keep the dashed reticle; cap it, wrap it, stop it growing into the field.

**F6 — SHIP: both pairs `[− +]`.** One axis read left-to-right; spacing already establishes the convention and the Owner has seen it working — flipping spacing instead would undo a settled element.

**F7 — RESHAPE: phone-only one-line copy.** At 10px / 0.14em tracking the current string is ~440px of text in a 180px box — that is the 3 lines. A 22-char line is one line at 180px.

## 2. EXACT COPY

| Slot | String |
|---|---|
| Hero tagline | `docs are neurons · citations are synapses · fire together, wire stronger` |
| Filter aria-label | `Search neurons` |
| Filter visible label (see C2) | `filter neurons` |
| NotePreview kicker | `neuron // preview` |
| Plate | `{n} NEURONS · {m} SYNAPSES · {s} SRC · +{w} recovered` — w = bridge **wires** |
| Card boilerplate fallback | `navigation header — no prose citation recorded` |
| Hover chip boilerplate | `navigation header — no prose citation` |
| Clipboard, boilerplate case | omit the quoted line — copy the bare `[A](?doc=a) → [B](?doc=b)` |
| Phone nc-status | `arrows: selection only` |
| Existing empty state | unchanged: `No citing line recorded` |

Synapse-card legend: **does not** need to match. It prints no counts — it shows the recovered lines themselves, so a number there is redundant. Badge stays `bridge · recovered`; note stays as is.

## 3. PRIORITY (one pass, impact ÷ risk)

1. **F1 + the missing vocab test** (one commit)
2. **F5**
3. **F6**
4. **F4**
5. **F7**
6. **F2**
7. **F3**

1–5 are strings and CSS with no logic. F2 is additive but sits on the URL contract. F3 is the only new predicate and the only one that can regress the card or trail — it goes last so a truncated night still ships everything visible, but it must ship: it is the one finding that makes a careful reader distrust the card.

## 4. CATCHES

- **`vocab.test.ts` does not exist.** vocab.ts:8 claims it asserts both rules. There are 7 test files and none imports `USER_VISIBLE_STRINGS`. That is why F1a/F1b survived the network pass and why 106/106 is green — the ledger is aspirational. F1 without the test regresses identically. Assert (a) ledger strings carry no `graph|nodes|edges` outside the data-contract allowlist, (b) a source scan of `aria-label` / `title` / `placeholder` / `alt`.
- **FilterBar has three names for one control**: visible label `filter chapters` (:26), aria `Search nodes` (:33), placeholder `title contains…`. The control filters canvas neurons (store.svelte.ts:419-445), so the visible label is also a lie. Fix both or F1a makes aria and label disagree.
- **F3 has five consumers, not one**: card (:668), hover chip (:657), clipboard (:632), SynapseRail:152, LinkPeek:34. A card-only fix leaves the header in the reader rail and in copied citations.
- **`mergeBridges` sets `context: b.ctx[0]`** (bridges.ts:97). When a bridge's first ref is a header and a later one is prose, the rail and chip show the header although better text exists in provenance. Prefer the first non-header line for context.
- **F6: swap the buttons, not the glyphs.** Handlers and `disabled` bounds must travel with them, or `+` inherits `ZOOM_MIN`.
- **F4 duplicates the plate in vocab.ts:18** without the suffix. The ledger entry needs the suffix or the new test cannot see it — and cannot catch the next drift.
- **`.status` is `display:none` ≤900px** (DocneuralApp.svelte:800, 838): the recovered suffix is desktop-only, so F4 has no phone cost. Also, F7's "status plate" is a different element (`nc-status`) — the brief's naming conflates them.
- **F5's hint is inside the canvas corner-avoidance pass** (DocneuralGraph.svelte:251-264). Widening it steals field area and moves nodes. Cap at ~18rem, two lines max.
- **`?mode=graph` is held by exactly two tests** (store.test.ts:310-324). Add one per alias plus an unknown value, so "graph works forever" is a test rather than a comment.
- **Verify F5 + F7 + F4 as one 390px screenshot**, not separately — they are the only three findings competing for the same phone corner.
