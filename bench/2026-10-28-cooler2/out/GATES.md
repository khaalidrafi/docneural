# COOLER-3 gates (final tree, docneural-ui worktree pre-commit)

- build 3.09s; vitest 65/65; svelte-check 0/0
- script-hashes: 14/14 script blocks byte-identical vs HEAD (OP-21 geometry
  done in TEMPLATE expressions `y * 1.25`, zero script edits — gate GREEN)
- render metrics (probe-cooler3.mjs, 4 views): overflow FALSE x4
  (1280 + 390 both themes); running loops desktop 3 (dn-pulse spark,
  dn-rail sweep, dn-blink caret — unchanged), phone 0; console errors 0;
  DOM 757 desktop / 495 phone; canvases 0
- presence markers x4 views: orbits 6 (2 rings x 3 sources), callouts 2
  ("HUB·1"/"HUB·2"), seam 1, colophon columns 3, foot tick 22px,
  numeral stroke 1px, stats font-variant-numeric tabular-nums
- AA on touched tokens (10/10 PASS): dark visited #2cc4e3 8.83:1 on raise;
  light visited #00455c 10.13:1 on paper; light accent #005a78 7.43:1
  (auto-light arm now unified — cool-pass OP-5 fidelity fix); numeral
  stroke #6b9dc6 6.90:1 (non-text 3:1); seam node 12.85:1; kicker faint
  6.63/6.74:1; colophon keys 6.09:1
- glyph budget: › and · already in vocab; HUB·N text uses · — no new glyphs
- loop budget: dn-mark-in / dn-rise are FINITE entrance animations (not
  loops); infinite loops stay 3 desktop / 0 phone
- no JS logic added; graph bundle hash unchanged (graph-CUGBrCtL.js)
