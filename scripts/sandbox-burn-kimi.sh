#!/bin/sh
# sandbox-burn-kimi.sh — THE ONE CodeBuddy-pool kimi-k3 burn (sandbox body, intl endpoint).
#
# Provenance chain:
#   - Owner order: "burn 75 credits from codebuddy ... good paid model, not ds v4.1
#     flash" -> "Use Kimi K3 to improve the design and make it cool. 100 credits limit!"
#   - Runner body was DNS-dead to www.codebuddy.ai (6 runs, 0 credits, TEAM-CHAT
#     :msg:forge:go:kimi-three-runs:); the SANDBOX body reaches intl (curl 200 proven).
#   - CLINE burn ($0.4285) was ruled a PER-POOL PERMISSION VIOLATION -> this burn runs
#     on the CodeBuddy pool ONLY, which holds the Owner's standing GO + the fresh CLI
#     login (token captured 2026-10-27 06:24Z via SERVER-MINTED state 3de8b448 - real
#     CLI protocol POST /v2/plugin/auth/state?platform=CLI; locally-minted states were
#     the cause of every prior "request parameter error").
#   - AUTH MODE (evidence): token PROVEN as Bearer on intl /v2/plugin/account AND
#     /v2/plugin/accounts (HTTP 200, live checks). ApiKey mode 401'd an accessToken
#     (runner dispatch 3). Runner Bearer 401 was endpoint mismatch (domestic
#     copilot.tencent.com vs intl-scoped token). Sandbox CLI defaults to INTL ->
#     CODEBUDDY_AUTH_TOKEN (Bearer) is the evidence-backed slot; API_KEY unset.
#
# SPEND LAW (TEAM.md c6cc6d9): EXACTLY ONE paid generation, kimi-k3 ONLY,
# deepseek-v4.1-flash HARD-EXCLUDED, no retries, no variant spray, 100-credit ceiling.
# Token: /home/z/.secrets (0600) injected via CODEBUDDY_AUTH_TOKEN; value NEVER printed.
set -eu
MODEL='kimi-k3'   # Design Arena 1335, #2 public designer. DO NOT change without Owner fiat.
REPO=/home/z/my-project/docneural
OUT=/home/z/my-project/burn/codebuddy-kimi-$(date +%H%M%S)

[ -s /home/z/.secrets ] || { echo "FATAL: no token at /home/z/.secrets"; exit 1; }
mkdir -p "$OUT" && cd "$OUT"

unset CODEBUDDY_API_KEY || true               # ApiKey mode 401'd an accessToken (dispatch 3)
unset CODEBUDDY_INTERNET_ENVIRONMENT || true  # keep DEFAULT = intl endpoint

echo "[1/3] assembling prompt (byte-identical brief + deliverable contract)..."
cp "$REPO/scripts/forge-brief.md" brief.md
{
  cat brief.md
  cat <<'EOF'

DELIVERABLE (strict): create ONE complete single-file HTML page (all CSS and JS inline, no external assets, no external fonts, no external images) implementing the brief EXACTLY, and SAVE it as index.html in the current working directory. Do not ask questions. Do not explain. Write the file and stop.

FINAL CHECK (mandatory, before you finish): the file ./index.html — exactly this name, in the CURRENT directory — must contain the complete page. If you wrote the page anywhere else, or under another name, or only partially, copy/complete it to ./index.html now. Ending without ./index.html means the task FAILED.
EOF
} > prompt.md
echo "      brief: $(wc -c < brief.md) bytes; prompt: $(wc -c < prompt.md) bytes; out=$OUT"

echo "[2/3] burning ONE $MODEL generation (spend law: no retries, no other models)..."
T0=$(date +%s)
CODEBUDDY_AUTH_TOKEN="$(cat /home/z/.secrets)" codebuddy -p "$(cat prompt.md)" \
  --permission-mode bypassPermissions --model "$MODEL" > cli.log 2>&1 || true
GEN_S=$(( $(date +%s) - T0 ))
echo "      generation window: ${GEN_S}s (exposure proxy for the spend ledger)"
echo "      cli.log: $(wc -c < cli.log) bytes; tail:"
tail -3 cli.log | sed 's/^/        /'

echo "[3/3] verifying the page (exit codes lie; only a real index.html counts)..."
if [ ! -s index.html ] || ! grep -qi '<html\|<!DOCTYPE' index.html || [ "$(wc -c < index.html)" -lt 400 ]; then
  echo "FAIL: no valid index.html. Nothing is judged; zero-artifact evidence kept at $OUT"
  exit 1
fi
echo "      OK: index.html $(wc -c < index.html) bytes"
{
  echo '{'
  echo "  \"model\": \"$MODEL\","
  echo "  \"endpoint\": \"intl (www.codebuddy.ai) via sandbox body (z.ai agent harness)\","
  echo "  \"generationSeconds\": $GEN_S,"
  echo "  \"generatedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo "  \"spendLedger\": \"ONE paid generation via CodeBuddy pool, no retries, ds-v4.1-flash excluded (TEAM.md spend law; Owner 100-credit ceiling; per-pool GO on record)\","
  echo "  \"bytes\": $(wc -c < index.html),"
  echo "  \"workdir\": \"$OUT\""
  echo '}'
} > GEN.json
echo "PAGE READY: $OUT/index.html"
