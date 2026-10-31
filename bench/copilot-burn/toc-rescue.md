You are a consultant for DOCNEURAL, a static-site reader for public GNU manuals (Svelte 5 runes + Vite + TS). Work from the repo you are checked out into. CONSULTANT ROLE: write ONLY into bench/2026-10-31-copilot-burn/toc-rescue/ — never touch src/, styles/, or workflows.

VERIFIED BUG (reproduced in Chromium this session): the manual TOC is broken at scale.
- emacs manual (791 nodes, 751 with resolvable up fields, 646 next): the tree builds but renders ONE collapsed root row ('Top') — the Owner sees nothing.
- org manual (319 nodes, ZERO up/next fields — export pipeline hole): the builder falls back to A-Z letter groups — the Owner sees an alphabet, not chapters.

KEY FILES (read them): src/lib/core/graph.ts (manualToc at ~line 449, TocNode type, tocTitle), src/lib/reader/Toc.svelte (recursive snippet, details/summary rows), src/lib/reader/Home.svelte (mount ~457-469), src/lib/core/store.svelte.ts (chapters getter).

DELIVERABLE: bench/2026-10-31-copilot-burn/toc-rescue/ containing:
1. diagnosis.md — root-cause table: why emacs renders one row (default open state? tree depth? roots logic?), why org falls to A-Z, with the exact code lines quoted.
2. toc-fix.patch — a complete unified diff against the REAL current files that implements:
   a. default-open depth 2 for the TOC tree (branches open, deep branches closed), persisted open-state optional.
   b. expand-all / collapse-all controls, 40px+ tap targets.
   c. in-TOC filter input (client-side substring over chapter titles, 250ms debounce, 0 network calls).
   d. org fallback REPLACEMENT: instead of A-Z letter groups, cluster chapters by their manual's own title prefixes / known section groups (propose the exact clustering heuristic for a 319-chapter manual with no up/next data; degrade gracefully: if clustering yields <4 groups, fall back to degree-ranked list with wire-count badges).
   e. active-page auto-open stays; degree badges stay.
3. tests.md — the vitest cases (pure, offline) that pin: default-open depth, expand/collapse, filter behavior, org clustering on a synthetic 319-node fixture, A-Z never returned for >24 chapters anymore.
Constraints: Svelte 5 runes ($state/$derived), no new deps, --dn-* tokens only, 40px taps, vitest pure functions only (no network). The patch must apply to the ai/main HEAD of this repo.
