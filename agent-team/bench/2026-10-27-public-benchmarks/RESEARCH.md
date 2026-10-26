# PUBLIC BENCHMARK CROSS-CHECK — Web Design seats (Owner order 2026-10-27)

Owner: "look at CANDIDATES.org and their scores in web design on the best
benchmarks ONLINE as well as trusted reviews ONLINE."

Method: for every vision/design-capable candidate on the wired lanes
(canonical CANDIDATES.org @6a5653e, agent-team.el repo — the docneural copy
was REMOVED by the Owner a10ef3f, R-2-64), pull the model's PUBLIC design
scores from the three strongest online sources, then judge the in-house
crown against them. Snapshot dates differ per source and are stated.

## Sources (best-in-class, online)

1. **Design Arena** (designarena.ai) — the largest crowdsourced benchmark
   for AI-generated design; blind 4-way tournaments, Bradley-Terry Elo,
   single-file HTML output. Model scores surfaced on OpenRouter model
   pages ("Metrics sourced from Design Arena"). ~107 models with Website
   rows (BenchLM catalog, Oct 19 2026).
2. **WebDev Arena** (arena.ai/leaderboard/code/webdev) — 923,854 votes,
   151 models, snapshot Oct 22 2026.
3. **Artificial Analysis (AA) + meta-reviews** — AAII intelligence index,
   coding index, third-party review sites. Trusted-review tier.

## Table 1 — Design Arena Website Elo (the design-specific board)

| wired-lane candidate               | Website Elo | win    | band      | source |
|------------------------------------|-------------|--------|-----------|--------|
| glm-5v-turbo @ zai (CROWNED craft) | **1229**    | 48.8%  | top-34%   | openrouter.ai/z-ai/glm-5v-turbo (sourced from Design Arena) |
| nemotron-3.5-super-vl (fallback VL)| **1169**    | —      | —         | openrouter.ai/nvidia/nemotron-3.5-super-vl |
| gemini-2.5-flash (forge DNF)       | **1113**    | 47.1%  | top-74%   | openrouter.ai/google/gemini-2.5-flash |
| Ling-3.0-flash-VL (QA crown)       | **absent**  | —      | —         | no Design Arena row exists (openrouter.ai/inclusionai/ling-3.0-flash-vl) |
| glm-4-plus (forge B, echo)         | **absent**  | —      | —         | no OpenRouter benchmark page (legacy model) |

Board context (modelgrep.com/best/design, Oct 2026): Muse Spark 1.3 1355 ·
Kimi K3 1335 · GPT-6 Astra 1327 · Claude Opus 5.5 1326 · Kimi K3.1 Pro 1324 ·
Claude Sonnet 5.5 1322 · Gemini 4 Argon 1317 · DeepSeek V4.1 Flash 1308 ·
Gemini 3.7 Flash 1303. BenchLM (Oct 19): Muse Wonder leads at 1360.
Best of the z.ai family on design: GLM 5.2 at 1285 (modelgrep.com/best/design/z-ai).

## Table 2 — WebDev Arena (front-end generation board, Oct 22 2026)

| wired-lane candidate            | rank/151 | Elo  |
|---------------------------------|----------|------|
| glm-5.3 @ chat.z.ai (text)      | #23      | 1623 |
| glm-5.3-flash (FE seat brain)   | #30      | 1608 |
| qwen3.8-27b @ groq              | #32      | 1591 |
| minimax-m3.1-flash @ mcode      | #34      | 1589 |
| **glm-5v-turbo @ zai (crowned)**| **#97**  | **1401** |
| nemotron-3.5-super-vl (fallback)| #101     | 1398 |
| gemini-2.5-flash / Ling-VL      | absent   | —    |

Top of board: Claude Opus 5.5 (Max) 1807 · GPT-6 Astra 1774 ·
Claude Sonnet 5.5 1769 · Kimi K3.1 Pro 1692.

## Table 3 — trusted reviews / meta indices

| model                    | AAII (Artificial Analysis)      | other trusted-review data |
|--------------------------|---------------------------------|---------------------------|
| glm-5v-turbo             | 23.5 (#88/352)                  | tau2-Bench Telecom 98.5% #3/230; official docs.z.ai positioning: design-mockup -> runnable frontend, pixel-level consistency; arXiv 2604.26752: strong UI-to-code / visual website dev |
| Ling-3.0-flash-VL        | 24.6 (v4.3.2); HF card cites 42 on v4.1.1 (index-version scale differs — both cited honestly) | Coding Index 57.0, GPQA 86.2%, TB2.1 64.4%; designforonline.com review: #44/198 coding, #97/443 overall; ZERO design-specific public scores anywhere |
| nemotron-3.5-super-vl    | 26.5                            | SciCode 47.8% |
| gemini-2.5-flash         | 15.5 (Sep'25 preview, reasoning)| — |
| glm-4-plus               | no current public record        | legacy |

## JUDGMENT (critical, on the record)

1. **The crown is publicly mid-upper, NOT frontier.** glm-5v-turbo's Design
   Arena Website Elo 1229 sits ~75-130 Elo below the world's best designers
   (Kimi K3 1335, GPT-6 Astra 1327, Claude Opus 5.5 1326). Stated plainly:
   our crowned model would be expected to LOSE most blind head-to-heads
   against frontier designers (100 Elo ~= 64% expected loss rate).
2. **But it is the best designer we can actually DRIVE.** The craft seat's
   real job includes image-input design consults (screenshot critique), and
   the sandbox gateway /vision lane pins to glm-5v-turbo. Among wired
   vision-capable lanes WITH public design data:
   glm-5v-turbo 1229 > nemotron-3.5-super-vl 1169 > gemini-2.5-flash 1113.
   HIRE LAW promise is "best at its work" — the honest scope is: best
   AVAILABLE vision designer, not best designer in the world.
3. **The forge still measures something no public board can:** our brief,
   our site, objective Chromium checks (C: AA 8.46:1, no overflow either
   viewport, 6/6 sections) and blind peers on the actual artifact. Public
   Elo cannot validate OUR page; the forge cannot measure the world. Both
   stand.
4. **The real threat the internet surfaced:** our own TEXT lanes publicly
   out-code the crowned VL — glm-5.3-flash 1608 (+207) and glm-5.3 1623
   (+222) on WebDev Arena; GLM 5.2 leads the z.ai design family at 1285
   (+56); and a gemini-3.x-flash class id (sealed on the gemini lane, 25
   ids incl. 3.1->3.8) rates ~1303 on design boards (+74). Page GENERATION
   needs no vision — vision is only the critique loop, which is Ling's QA
   seat. Per HIRE LAW (and the anti-GLM-bias clause: this data does NOT
   favor GLM), a **forge round 2 with text-lane challengers** is the
   pre-registered next test: glm-5.3-flash + gemini-3.8-flash +
   nemotron-3.5-super-vl against the incumbent, same brief, same harness.
5. **Ling's QA crown is untouched by public data** — no public design row
   exists for Ling-3.0-flash-VL either way; its public record is general
   intelligence/coding. QA evidence remains in-house (stage-1 8.0/9,
   strictest judge in the forge matrix). Public absence is disclosed, not
   spun.
6. Frontier designers (Kimi K3 / GPT-6 Astra / Claude Opus 5.5 class) are
   NOT on wired lanes today. If the Owner ever seals such a key, both
   standing benches (designer-bakeoff eyes + design-forge hands) rerun the
   same day.

## FULL-FIELD SWEEP — Owner challenge 2026-10-27 ("I can't blv that among ALL
## the candidates in CANDIDATES.org of agent-team.el, only 5 are good at
## designing web")

Correct — the first pass covered only the VISION-seat field. Swept the whole
canon (every lane: OWNER-KEYS API secrets, Web couriers, Cloud shells,
WorkBuddy.ai/CodeBuddy pool, opencode zen + cline free rosters, ollama,
groq, cloudflare). Result: the canon holds **~13 ids with public
design/front-end rows**, and EIGHT of them sit ABOVE the crowned
glm-5v-turbo on design boards — most in the WorkBuddy.ai / CodeBuddy pool.

### Wired ids WITH public design/front-end rows (Design Arena Website unless noted)

| model (canon lane) | public score | source |
|---|---|---|
| kimi-k3 (WorkBuddy/CodeBuddy pool) | **1335** — #2 designer on the whole public board | modelgrep.com/best/design |
| deepseek-v4.1-flash (tokenharbor/zen-free/WorkBuddy pool) | **1308** — #14 (Owner: FREE this month — excluded from paid burn, not from benches) | modelgrep.com/best/design |
| gemini-3.x-flash class (gemini lane 3.1→3.8; 3.8 also on WorkBuddy/CodeBuddy) | **~1303** (3.7 Flash measured) | modelgrep.com/best/design |
| glm-5.2 (chat.z.ai, WorkBuddy/CodeBuddy) | **1285** — best z.ai-family designer | modelgrep.com/best/design/z-ai |
| kimi-k2.6 (kimi.ai courier + pool) | **1268**, 54.2% win, top 20% | openrouter.ai/moonshotai/kimi-k2.6 |
| glm-5 turbo (opencode zen roster) | **1262** | modelgrep.com/best/design/z-ai |
| grok-4.7 (WorkBuddy/CodeBuddy) | **1253**, 46.1% win, top 27%, AAII 46.4 | openrouter.ai/x-ai/grok-4.7 |
| glm-5 (opencode zen roster) | **1248** | modelgrep.com/best/design/z-ai |
| **glm-5v-turbo (crowned craft)** | **1229**, 48.8% win, top 34% | openrouter.ai/z-ai/glm-5v-turbo |
| glm-4.7-flash (zai secret lane) | **1194**, 54.0% win, top 45% | openrouter.ai/z-ai/glm-4.7-flash |
| nemotron-3.5-super-vl (gmi/openrouter/cline) | **1169** | openrouter.ai/nvidia/nemotron-3.5-super-vl |
| gemini-2.5-flash (gemini lane) | **1113**, 47.1% | openrouter.ai/google/gemini-2.5-flash |
| gpt-oss-120b (groq/ollama-cloud) | **968** | openrouter.ai/openai/gpt-oss-120b |

WebDev Arena cross-refs (Oct 22 2026): glm-5.3 1623 #23 · glm-5.3-flash 1608
#30 (FE seat) · qwen3.8-max 1673 #12 (no Design Arena row; AAII 45.4,
Coding Index 76.2) · gpt-6-sol 1681 #10 (no Design Arena row for the exact
id) · glm-4.7 1435 #86 · glm-4.6 1341 #123.

### Wired ids with NO public design row (checked, honestly empty)

Ling family (3.0/3.1-flash, 3.0-flash-VL, 3.0-tiny, 2.6-flash/1T,
Ring-2.6-1T — public record is general/coding only) · nemotron-3-ultra-550b
/ 3-super-120b / 3.5-lightning / nano-omni · inkling + inkling-small ·
poolside laguna-s-2.1/xs · flint-40b / flint-v1.0 · dots-3-note ·
xing4.0-29b · north-mini-code · lfm-2.5-2.6b · jev-1.13 · mimo-v2.6 · beam ·
gemma-4-31b · longcat-2.5 · big-pickle · step-3.5-flash / step-5-preview ·
kimi-k2.8-preview · gpt-5.6-terra/luna · gpt-5.5/5.4 · glm-4.5-flash /
4.6v-flash / 5.1 · allam-2-7b · minimax-m2 (no OpenRouter page) ·
gpt-image-2 (bai lane — image GEN, not web design) · clef-flash (xplabs,
card-blocked) · qwen3.8-omni-flash / 3.7-max / 3.7-plus · glm-5.3 /
5.3-flash (text WebDev 1608-1623, no Design Arena Website row).

### Verdict after the full sweep

The Owner is right: **eight canon ids publicly out-design the crowned
vision model** — kimi-k3 1335, ds-v4.1-flash 1308, gemini-3.x 1303,
glm-5.2 1285, kimi-k2.6 1268, glm-5-turbo 1262, grok-4.7 1253, glm-5 1248.
The structural catches, stated plainly:
1. ALL eight are TEXT-only or chat-shaped lanes — none can take a
   screenshot critique (the craft seat's consult loop), which is why the
   vision field was only 3+1.
2. Most sit in the **WorkBuddy.ai / CodeBuddy paid pool** — which the
   Owner ordered burned on quality work the same day (75 credits,
   expiring). forge round 2 (codebuddy): kimi-k3 + gemini-3.8-flash +
   grok-4.7, same brief, same harness, deepseek-v4.1-flash hard-excluded
   per fiat (free this month).
3. Free-lane exceptions that now deserve a forge shot: glm-5.2 + glm-5 +
   glm-5-turbo (chat.z.ai shell / zen roster) and qwen3.8-max (courier) —
   queued for the next unpaid forge round.

## Seat verdict after cross-check (Owner delegated the call; public data now on the record)

- DESIGN CRAFT: glm-5v-turbo@zai — HOLDS, re-scoped honestly: best wired
  vision lane, publicly top-34% Design Arena / #97 WebDev, forge 9.0/9 on
  our artifact. Standing challenge filed: forge-2 vs text lanes
  (glm-5.3-flash, gemini-3.8-flash, nemotron-3.5-super-vl) — runs on Owner
  go, or automatically at the next design consult.
- DESIGN QA: Ling-3.0-flash-VL@antling — HOLDS (in-house evidence only;
  zero public design data exists, disclosed).
