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

## Seat verdict after cross-check (Owner delegated the call; public data now on the record)

- DESIGN CRAFT: glm-5v-turbo@zai — HOLDS, re-scoped honestly: best wired
  vision lane, publicly top-34% Design Arena / #97 WebDev, forge 9.0/9 on
  our artifact. Standing challenge filed: forge-2 vs text lanes
  (glm-5.3-flash, gemini-3.8-flash, nemotron-3.5-super-vl) — runs on Owner
  go, or automatically at the next design consult.
- DESIGN QA: Ling-3.0-flash-VL@antling — HOLDS (in-house evidence only;
  zero public design data exists, disclosed).
