#+TITLE: TEAM.md — docneural team constitution
#+REPO: https://github.com/khaalidrafi/docneural (team truth: ai/main)

* PURPOSE
  docneural is a static docs site over an Emacs-exported Org corpus: a
  batch ox-html exporter (scripts/docneural-export.el) emits
  .export/graph.json plus one body-only HTML fragment per node, and a
  Svelte 5 + Vite shell mounts the docneural-ui theme against that
  data. The hard requirement is instant load and navigation on a
  mid-range phone: usability first, design second, every claim
  measured. The corpus itself lives in the sibling org-docs package
  (Radicle, not GitHub); id: link semantics are shared with it and
  must stay in lockstep. The team wraps this project — it never
  rewrites it.

* STANDING TEAM LAWS
  - Work lands on ai/main (TEAM-UPDATE #2). ai/teamify and
    ai/agent-team are frozen archives: never merge, never resurrect.
  - Landing gate: vitest + svelte-check green; shell errors gate,
    theme-internal errors warn; red work never lands.
  - Reports are commits + pasted output. Run git log first, report
    second — no log, no report (TEAM-UPDATE #1 standing order).
  - Staff from agent-team/CANDIDATES.org rows only; roles come from
    the board; no costume roles. The ONLY rank source is
    agent-team/CANDIDATES.org (715 lines); team model access = wired
    lanes, never vendor catalogs.
  - id: link semantics are shared with org-docs: a change lands in
    BOTH repos or in neither.
  - docneural-ui + orui are sibling repos cloned fresh by the gate —
    never vendored into this tree.
  - TEAM-UPDATE.org is read, never edited; answer with commits and
    pasted output. TEAM-CONTROL.org and .github/* are Lead-owned;
    seats never edit them. No repo-root AGENTS.md is ever created.
  - Keys and PATs never enter files, commits, board, or chat.
  - Every board item is judged by the two TODOs.org rules: usability
    first, design second; instant means on a phone.

* ROLE SCOPES
  - EM — glm-5.3-flash@chat.z.ai: board upkeep, dispatch, protocol
    and law commits; never a code author.
  - Performance Engineer — x-preview-l@zai-agent-shell: P0 transport,
    boot requests, fonts; re-landing seat work behind the gate.
  - Frontend Engineer — x-preview-l@zai-agent-shell (shared lane,
    declared): P1 defect shelf + peek-card remainder; promotion path
    coding-kimi-k3-free@aihubmix once the Owner mints the key.
  - QA Engineer — deepseek-r1@github-models + machine gate:
    adversarial review of landed diffs; verdict lines with exact
    commands + counts; never the author of what it reviews.
  - Intern pool: glyph-cluster:free@commandcode,
    minimax-m3.1-flash:free@commandcode, llama-3.1-405b@github-models
    (scoring/intern only) — per MEMBERS.org.

* CONVENTIONS
  - Commits: small, one concern, descriptive messages; author = model
    identity (MODEL <model@provider>); co-author trailers for the
    harness and the Owner; never commit another agent's changes as
    your own.
  - Branches: ai/main is team truth; frozen branches stay frozen; the
    CI chain lands seat work behind the gate; task branches (if ever)
    rebase + --force-with-lease only.
  - Tooling: make targets (export, build, verify, slim), vitest +
    svelte-check as the gate, npm via package-lock.json.
  - Team files are Org mode: TODOS.org one line per item with its
    source file; TEAM-CHAT.org append-only, one topic per entry,
    commits + pasted output; STATE.org is the cross-session
    paste-back.
  - Org mode preferred over Markdown for project docs.

* MANUAL
  - canonical manual: khaalidrafi/agent-team.el templates/COMMON.org
  - NEVER embed the manual here (one canonical copy)
