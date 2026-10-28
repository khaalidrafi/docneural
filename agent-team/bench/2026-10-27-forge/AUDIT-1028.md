# FORGE AUDIT — 2026-10-28 (Owner challenge: "How can a turbo model hold the crown? REVIEW!!")

Scope: full re-read of 2026-10-27-forge records (RESULTS.json, SCORES.json,
KEY.json, submission artifacts) + visual inspection of A and C renders.
Audit by glm-5.3-flash (EM seat). Additive record — scores are NOT rewritten.

## VERDICT UP FRONT

The crown holds on ARTIFACT MERIT — but the process had asymmetries that
were in the raw record yet not flagged loudly enough in SCORES.md. They are
flagged here. Re-running with the sibling slot removed does NOT change the
winner. A clean re-contest under equal process is offered to the Owner.

## WHAT IS SOLID (verified today)

1. Pre-registered rule before the call: FINAL = 0.4*objective + 0.6*mean
   (blind peer sums); crown = highest FINAL; Owner had delegated the call
   2026-10-26 17:16 ("You decide!"). f7eff08 completed the matrix BEFORE
   the call.
2. Blind judging held: codes shuffled (seed 20261027), KEY.json opened only
   after scoring was filed. Judges scored artifacts, not names.
3. The objective leg is Chromium-measured, zero opinions. C's margin over
   A is a MEASURED fact: minContrast 8.46 vs 3.74 — A failed the 4.5:1
   body-text threshold somewhere (contrast score 1 vs 2). The crown's
   margin is not judge vibes.
4. De-duplication robustness: remove the sibling entry B entirely and the
   field is C 9.0 vs A 8.6 — same winner.
5. Artifact quality (visually inspected today, both themes): C is a real,
   disciplined design — correct corpus numbers (1,392 / 30,400 / 304),
   per-source node hue legend (Org/Emacs/Guix), HUD corner brackets,
   terminal boot strip, clean section rhythm. A is also strong; the peer
   sums were EQUAL (9.0 vs 9.0) — the crown was decided by the objective
   contrast defect in A.

## WHAT IS WEAK (now formally flagged)

1. STAGED vs LIVE ASYMMETRY — the decisive finding. RESULTS.json field:
   C and B are `finish: "staged", genMs: null` from "sandbox-gateway";
   only A (antling, 60.3s) and D (gemini, 70.0s) generated LIVE. The
   staged entries came out of an iterative vision loop (draft -> render
   -> look -> refine), while the live entries got one shot. The staged
   pipeline could see and fix its own work; the live ones could not.
2. ONE PIPELINE HELD 2 OF 4 SLOTS — B and C are siblings: same palette
   (#0a0e16 / #10151f / #00e5ff), same fonts (Electrolize + JetBrains
   Mono), same structure; C is the more developed iteration (30,571 vs
   20,128 bytes; identical minContrast 8.46 follows from the shared
   palette). The field was thin: 2 live competitors, 1 DNF.
3. THE BIG MODELS NEVER RACED — glm-4.6 (zai) never generated: HTTP 429
   "Insufficient balance" on the lane. NVIDIA Nemotron-3.5-Super-VL (gmi)
   429 "No available endpoints"; cline lane timed out. So "a turbo model
   beat the big models" was NEVER tested head-to-head. What the forge
   actually showed: a vision-loop pipeline beat two one-shot live
   entries, one of which DNF'd (gemini-2.5-flash truncated -> blank
   page).
4. EFFECTIVELY ONE DISCRIMINATING BLIND JUDGE on the peer leg — gemini
   scored 9/9 on everything (inflation, disclosed in SCORES.json);
   antling was the only judge that discriminated (C 9, B 7, D 0).
5. COMPETITOR-AS-JUDGE — glm-5v-turbo was both a competitor and a peer
   judge (scored A 9/9 and B 9/9 — generous, no harm shown, but a
   conflict of interest that should be designed out next time).

## WHY A "TURBO" CAN HOLD A DESIGN CROWN AT ALL

The winning skill in this bench is SEEING your own output — contrast,
hierarchy, overflow — and iterating until it is right. That is a vision
model's core competence, and the same loop the design seat actually uses
in production (cyberpunk round-3 spec; PERF-MOBILE spec + SHIP IT review,
same day). The forge measured the working method, not a typing contest.
Model size buys breadth of reasoning; it does not buy eyes.

## OPTIONS FOR THE OWNER

1. ACCEPT + CAVEAT (recommended): crown stands on artifact merit; this
   file is the caveat. The seat keeps working — it shipped SHIP IT again
   today.
2. CLEAN RE-CONTEST: same pre-registered rule, equal process for all —
   either EVERY entry staged through the same iterate-with-eyes pipeline,
   or EVERY entry live single-shot; one slot per pipeline; competitors
   never judge. Gateway lanes are $0. Racing glm-4.6 needs a zai balance
   top-up — Owner's call.
