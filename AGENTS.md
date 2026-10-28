# AGENTS.md — docneural local agent law

Project law for every agent touching khaalidrafi/docneural. Lean on
purpose: the CANONICAL global law is a separate file that is always
loaded — this file holds only what a seat must know before touching
code here. (Root AGENTS.md authorized by Owner dual-law order
2026-10-27 #hq, relayed in agent-team/NOTICE.org UPDATE #9/#10;
the old "no root AGENTS.md" line in CHARTER.md is superseded.)

## READ BOTH LAWS — ALWAYS (Owner order 2026-10-27)

1. GLOBAL LAW: `AGENTS.md` in khaalidrafi/vault — the Owner's global
   instructions for LLM agents. It owns commit identity, co-author
   trailers, subject/body discipline, tests-first, AI-REVIEW.org,
   Org-over-Markdown, key handling, response style. Never restate it;
   load it.
2. LOCAL LAW: this file + `agent-team/CHARTER.md` (team constitution:
   standing laws, role scopes, spend laws).
3. CONFIG RULE (global + local must be WIRED, not merely told):
   each harness loads the global law at its verified global path —
   OpenCode `~/.config/opencode/AGENTS.md`; Goose
   `~/.config/goose/.goosehints`; CodeBuddy `~/.codebuddy/CODEBUDDY.md`;
   Qoder and CodeBuddy also auto-read this repo-root file; web models
   get the global law inline in dispatch #1. CI lanes compose every
   brief as GLOBAL + LOCAL + segment via `ci/bin/law_brief.sh` once the
   `ci/` submodule (khaalidrafi/agent-team-ci) is seeded — status:
   WAITING as of 2026-10-27 (kit repo empty; lands with the next
   dispatch per UPDATE #10).
4. Reading this file never substitutes for the global one. An agent
   that cannot load either law reports it and stops before touching
   code.

## WHAT THIS REPO IS

Static docs site over an Emacs-exported Org corpus: the batch ox-html
exporter (`scripts/docneural-export.el`) emits `.export/graph.json`
plus one body-only HTML fragment per node, and a Svelte 5 + Vite shell
mounts the docneural-ui theme against that data. Hard requirement:
instant load and navigation on a mid-range phone — usability first,
design second, every claim measured.

- The Org corpus lives in the sibling `org-docs` package (Radicle, not
  GitHub). `id:` link semantics are shared with it: a change lands in
  BOTH repos or in neither.
- `docneural-ui` + `orui` are sibling repos cloned fresh by the gate —
  never vendored into this tree.

## BUILD / TEST / GATE

- `make export`  — Emacs batch ox-html export into `.export/`
- `make build`   — vite build
- `make verify`  — full gate
- LANDING GATE (red work never lands): vitest + svelte-check green;
  shell errors gate, theme-internal errors warn.
- npm installs only from `package-lock.json`; `node_modules` is never
  committed.
- A behavior change lands WITH its test in `tests/` (written before
  the implementation, per global law).

## BOARD + RECORDS DISCIPLINE

- `agent-team/TODOS.org` — the board, single source of truth for work;
  chat handoffs never count.
- `agent-team/CHAT.org` — append-only mesh; one topic per entry;
  verdicts land here as commits + pasted output.
- `agent-team/NOTICE.org` — read, never edit.
- `agent-team/STATE.org` — cross-session state paste-back.
- `agent-team/CONTROL.org` and `.github/*` — Lead-owned; seats
  never edit them.
- Work lands on `ai/main` only (team truth). `ai/teamify` and
  `ai/agent-team` are frozen archives: never merge, never resurrect.

## PAID LANES

CHARTER.md owns the money laws: PAID-LANE SPEND LAW and PER-POOL
PERMISSION LAW. Summary pointer only — read them there: one paid
generation per model per dispatch, per-pool Owner go before first
burn, vault access is discovery not authorization, paid artifacts land
with a spend ledger under `bench/<date>-<topic>/`.

## CODE FLOOR

- Scripts stay small, single-purpose, and commented for a future human
  developer; no framework without need; no unexplained cleverness.
- Review-worthy work documents its review tree in `AI-REVIEW.org`.
- Project docs prefer Org mode; `.md` only where tooling demands it
  (this file is the Owner-ordered exception).
