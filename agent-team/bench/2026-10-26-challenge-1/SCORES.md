# Bake-off challenge #1 — 2026-10-26 (Actions run 40356936635, artifact bench-out)

Blind multi-lane bake-off, Owner order 16:03 ("hire again!!!"). Same planted
shot + prompts as the incumbent baseline (bench/2026-10-26). Keys stayed in
Actions secrets; codes shuffled; KEY.json opened only after scoring was filed.

## Scores (rubric: recall /5, decoy FP −0.5, actionability /2, critique /2)

| code | lane:model | recall | FP | act | crit | TOTAL | latency A/B |
|------|------------|--------|----|-----|------|-------|-------------|
| D | antling:Ling-3.0-flash-VL | 4/5 | 0 | 2 | 2 | **8.0/9** | 22.4s / 23.3s |
| B | gemini:gemini-2.5-flash | 2.5/5 | 0 | 2 | 2 | 6.5/9 | 23.6s / 28.3s |
| C | cline:nemotron-3.5-super-vl:free | 0/5 | 0 | 0 | 0 | 0/9 (empty outputs, 98s) | — |
| ref | (sandbox) glm-5v-turbo — incumbent baseline | 2/5 | −0.5 | 2 | 2 | 5.5/9 | 7.2s / 9.5s |

Not runnable: gmi:Nemotron-3.5-Super-VL (HTTP 429 "No available endpoints");
zai official lane (11 ids listed, none vision — glm-4.6v-flash absent).

## Winner detail (D = Ling-3.0-flash-VL)

- recall 4/5: caught low-contrast body text (fix #9fb3c4), the button-overlap
  MECHANISM on "wires live" (margin-top 20px), the nav 8px offset on MANUALS
  (measured ~9px), the clipped "MEMBERS 9,4" (max-width 1248px). Missed the
  red-chip color spill (rationalized as "duotone accent system").
- zero decoy false positives (aberration, scanlines, glow all under INTENTIONAL).
- critique: three fixes, all hex/px-specified, tied to real site elements; read
  the per-source node hues off the canvas (Org #ff7a45 / Emacs ~#3ec8ff /
  Guix ~#ffd43b) and proposed a legend row.

## Seat decision (HIRE LAW)

Ling-3.0-flash-VL @ antling takes the Web Designer seat at 8.0/9 vs the
incumbent's 5.5/9 (+2.5). glm-5v-turbo@zai demoted to first fallback;
gemini-2.5-flash second fallback (6.5/9). Seat remains open to challenge —
same harness, same shot, any new lane key reruns the field.
