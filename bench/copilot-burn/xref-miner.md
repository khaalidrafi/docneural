You are a consultant for DOCNEURAL. Work from the repo you are checked out into (it contains site-corpus/{emacs,guix,org}/*.org — converted manual sources). CONSULTANT ROLE: write ONLY into bench/2026-10-31-copilot-burn/xref-miner/ — never touch src/, styles/, or workflows.

PROBLEM: the deployed corpus has 30915 wires, ALL within-manual; cross-manual references (emacs manual <-> org manual <-> guix manual) were dropped by the export pipeline: makeinfo rendered cross-manual info-refs as plain text like '(org)Top' or '(emacs)File Archives'. At least one real trace exists: site-corpus/org/Advanced-topics-in-ODT-export.org mentions '(emacs)File Archives]]' inside a link label.

THE NODE INDEX lives in docneural-ui (not checked out). Fetch it at:
https://raw.githubusercontent.com/khaalidrafi/docneural-ui/ai/main/public/sample/graph.json
(1386 nodes: fields id, slug, title, tags; ids look like 'org--Beamer-Export', 'emacs--Org-Mode', 'guix--...').

DELIVERABLE: bench/2026-10-31-copilot-burn/xref-miner/ containing:
1. mine-crossrefs.py — a dependency-free python 3 script that:
   a. loads graph.json from the raw URL above (or a local path given as argv[1]),
   b. builds an index of node short titles (title minus the '(The X Manual)' suffix) and node ids,
   c. scans site-corpus/**/*.org for cross-manual reference patterns: '(org)Node Name', '(emacs)Node Name', '(guix)Node Name', also 'info:org#Node' and 'info:emacs#Node' styles if present,
   d. maps each hit to the best target node by normalized title match (case-insensitive, underscores/hyphens/spaces equivalent; report ambiguous matches and skip them),
   e. emits proposed-wires.json: [{source, target, kind: 'xref', ctx: '<the matching source line, trimmed to 160 chars>', src_file, confidence}] — source = the node id of the file containing the hit (file basename maps to slug via the '<manual>--<basename>' convention),
   f. prints a summary: hits per manual pair, matched, ambiguous, skipped.
2. RUN IT against the real site-corpus and SAVE the output: proposed-wires.json + run.log (stdout) must be committed in the same directory. Report the exact count of recovered cross-manual references.
3. verdict.md — one page: how many honest cross-manual wires are recoverable, the false-positive risk of title matching, a confidence threshold recommendation, and whether the count justifies a UI treatment (distinct wire kind with its own styling + ctx entries).
Honesty rule: no invented references — every proposed wire must carry the exact source line it came from. If the recoverable count is near zero, say so plainly and recommend the alternative (exporter-side fix list).
