# FORGE — codebuddy-pool kimi-k3 vs the round-1 field (blind, seed 20261028)

Owner order chain: "burn 75 credits from codebuddy … good paid model, not ds
v4.1 flash" → "Use Kimi K3 to improve the design and make it cool. 100
credits limit!" → CLINE burn ruled a PER-POOL PERMISSION VIOLATION → the
CodeBuddy pool only, with the Owner's standing GO plus a fresh CLI login.
This entry is THE ONE paid kimi-k3 generation on the CodeBuddy intl pool,
fired from the sandbox body (z.ai agent harness).

## Auth provenance (why every earlier login "failed")

The CodeBuddy CLI never mints the login `state` locally: it first calls
`POST /v2/plugin/auth/state?platform=CLI` and the backend returns the
official `authUrl` with a **server-minted state**. Every hand-crafted link
before this round carried a locally-invented UUID the backend had never
seen — the web login succeeded, but the redirect to `/started` died with
"request parameter error". Root-caused by reading the installed CLI
(v2.177.0) bundle; fixed by replaying the real protocol. Token validated
live as Bearer on `/v2/plugin/account` and `/v2/plugin/accounts` (2× HTTP
200), stored at `/home/z/.secrets` (0600), never printed.

## SPEND LEDGER (every credit, on the record)

| Event | Pool | Burn |
|---|---|---|
| Launch 1 (nohup bg) | codebuddy | **0.00** — process tree reaped at tool-call return, pre-auth, 0-byte log |
| Launch 2 (setsid bg) | codebuddy | **0.00** — same reaper, pre-auth, 0-byte log |
| Launch 3 (foreground, 600 s window) | codebuddy | generation COMPLETED inside the window: **ONE kimi-k3 generation, 122 s, 16,648 B page** |
| Judging (this file) | local | **0.00** — Playwright renders + objective checks, zero paid calls |

Spend law TEAM.md c6cc6d9: exactly one paid generation, kimi-k3 only,
deepseek-v4.1-flash hard-excluded, no retries, 100-credit ceiling. Sandbox
law discovered en route: NOTHING survives a tool-call return in this
container (nohup, setsid, and even the CLI's own `--bg --exec` daemon are
all reaped) — background execution is impossible; long jobs must fit one
10-minute foreground window. The 122 s generation fit comfortably.

## The field (blind codes, seed 20261028; objective-only)

| Code | True origin | Objective /9 | Peer /9 | FINAL |
|---|---|---|---|---|
| A | staged:entry-2 | 9 | — | 9* |
| D | staged:entry-1 = **glm-5v-turbo (round-1 crown)** | 9 | — | 9* |
| E | staged:entry-codebuddy-kimi = **kimi-k3@codebuddy-intl** | **9** | — | **9*** |
| C | antling = Ling-3.0-flash-VL | 8 | — | 8* |
| B | gemini = gemini-2.5-flash (round-1 DNF page) | 4 | — | 4* |

*objective-only, disclosed: the sandbox holds none of the judge keys
(25 Actions secrets on docneural; antling/gemini/gmi/cline all self-skipped
"NO KEY"). Peer column fills via the CI judge workflow
(forge-judge.yml, reads committed renders) as in rounds 1-2. Composite
rule (pre-registered): FINAL = 0.4*objective + 0.6*mean(peers).

## Entry E detail (objective harness, verbatim logic)

- stability 2/2: zero page errors, zero console errors
- overflow 2/2: no horizontal overflow at 1440×900 AND 390×844
- contrast 2/2: min sampled ratio **8.46:1** (AA needs 4.5)
- presence 2/2: 6/6 — nav/header, h1, stats 1,392 / 30,400 / 304, graph canvas
- craft 1/1: 9,120 B inline CSS + keyframe motion
- renders: `codebuddy-kimi-desktop.png` (this dir), mobile in forge-out

## Contract deviation disclosure (artifact judged as-is, untouched)

The deliverable contract demanded "no external fonts"; the page links
Google Fonts (Electrolize, JetBrains Mono) via `<link rel=preconnect>` +
stylesheet. The objective harness does not test externality, so this does
not move the 9/9 — it is disclosed here for the record. The artifact was
NOT edited after generation: bench integrity over cosmetics.

## Verdict

Objective TIE at the top: the codebuddy-pool kimi-k3 page matches the
crown's objective 9/9 with the cleanest profile in the field (zero errors,
8.46:1, full presence). The blind peer column — the discriminator that
kept the crown alive in the kimi-cline round (8 vs 7) — is pending the CI
judge lane. No crown change is declared on objective-only data.
