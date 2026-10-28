#!/bin/sh
# owner-burn-kimi.sh — ONE-command kimi-k3 burn from an intl-reachable body.
#
# WHY THIS EXISTS (evidence-chained, 6 runner runs, ZERO credits burned):
#   - www.codebuddy.ai (intl, where the account lives) is UNREACHABLE from
#     GitHub-hosted runners: connect ETIMEDOUT blackhole, 18.6-min CLI retry
#     loops with zero API progress (runs 40378703437 / 40381847436).
#   - copilot.tencent.com (china) IS reachable from runners but rejects the
#     sealed credential in BOTH auth modes: Bearer custom-token (run
#     40388548989, 401 in 7s) AND plain ApiKey (run 40390456013, 401 in 5.5s)
#     -> the token is intl-scoped; the block is NETWORK, not auth mode.
#   - GitHub API never returns secret values, so the token cannot be moved to
#     an intl-reachable body by the agent. CANDIDATES.org lists codebuddy as
#     a RESIDENT harness (Owner box: installed AND logged in).
#
# SPEND LAW (CHARTER.md): EXACTLY ONE paid generation, kimi-k3 ONLY,
# deepseek-v4.1-flash HARD-EXCLUDED (Owner fiat: free this month). 100-credit
# ceiling (Owner 2026-10-27): one generation is the whole budget.
#
# USAGE (on a machine with normal internet + codebuddy logged in):
#   sh owner-burn-kimi.sh            # generate + verify, page in ./kimi-burn-*/
#   sh owner-burn-kimi.sh --push    # ...then ALSO land it on ai/main for
#                                    #     blind judging by the forge lanes
set -eu
MODEL='kimi-k3'   # Design Arena 1335, #2 public designer. DO NOT change without Owner fiat.
PUSH=0
for a in "$@"; do [ "$a" = "--push" ] && PUSH=1; done

WORK="$HOME/kimi-burn-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$WORK" && cd "$WORK"
echo "== work dir: $WORK"

echo "[1/4] fetching the forge brief (same brief as CI round 1 + all lanes)..."
curl -fsSL https://raw.githubusercontent.com/khaalidrafi/docneural/ai/main/scripts/forge-brief.md -o brief.md
echo "      brief: $(wc -c < brief.md) bytes"

# The deliverable contract is byte-identical to scripts/forge-codebuddy-gen.mjs
# so this entry competes under the same rules as every other forge lane.
{
  cat brief.md
  cat <<'EOF'

DELIVERABLE (strict): create ONE complete single-file HTML page (all CSS and JS inline, no external assets, no external fonts, no external images) implementing the brief EXACTLY, and SAVE it as index.html in the current working directory. Do not ask questions. Do not explain. Write the file and stop.

FINAL CHECK (mandatory, before you finish): the file ./index.html — exactly this name, in the CURRENT directory — must contain the complete page. If you wrote the page anywhere else, or under another name, or only partially, copy/complete it to ./index.html now. Ending without ./index.html means the task FAILED.
EOF
} > prompt.md

echo "[2/4] burning ONE $MODEL generation (spend law: no retries, no other models)..."
T0=$(date +%s)
codebuddy -p "$(cat prompt.md)" -y --model "$MODEL" || true
GEN_S=$(( $(date +%s) - T0 ))
echo "      generation window: ${GEN_S}s (exposure proxy for the spend ledger)"

echo "[3/4] verifying the page (exit codes lie; only a real index.html counts)..."
if [ ! -s index.html ] || ! grep -qi '<html\|<!DOCTYPE' index.html || [ "$(wc -c < index.html)" -lt 400 ]; then
  echo "FAIL: no valid index.html. Nothing is judged; keep this dir for evidence."
  exit 1
fi
echo "      OK: index.html $(wc -c < index.html) bytes"
{
  echo '{'
  echo "  \"model\": \"$MODEL\","
  echo "  \"endpoint\": \"intl (www.codebuddy.ai) via resident body\","
  echo "  \"generationSeconds\": $GEN_S,"
  echo "  \"generatedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo "  \"spendLedger\": \"ONE paid generation, no retries (CHARTER.md spend law; Owner 100-credit ceiling)\","
  echo "  \"bytes\": $(wc -c < index.html)"
  echo '}'
} > GEN.json

echo "[4/4] page ready: $WORK/index.html"
if [ "$PUSH" -eq 1 ]; then
  echo "landing the entry on ai/main for blind judging..."
  git clone --depth 1 --branch ai/main https://github.com/khaalidrafi/docneural.git land 2>/dev/null
  mkdir -p land/bench/2026-10-27-codebuddy-kimi/entry-kimi-k3
  cp index.html land/bench/2026-10-27-codebuddy-kimi/entry-kimi-k3/index.html
  cp GEN.json  land/bench/2026-10-27-codebuddy-kimi/entry-kimi-k3/GEN.json
  cd land
  git add bench/2026-10-27-codebuddy-kimi
  git commit -m "owner-burn: kimi-k3 forge entry from resident body (ONE paid generation, spend law intact)" || true
  git push origin ai/main
  echo "PUSHED. The agent lanes will render + judge it blind and report scores."
else
  echo "no --push given: send index.html back to the agent lanes (attach in Discord or push manually)."
fi
