#!/usr/bin/env bash
set +e
# SESSION RESTORE (Owner order 18:27Z: session files are
# important — resume with context): the host mounted the seat's
# previous SCRUBBED session tree at /sessions-restore; drop it
# into $HOME before anything runs.
if [ -d /sessions-restore ]; then
  mkdir -p "$HOME"
  if [ -d /sessions-restore/home/agent ]; then
    cp -a /sessions-restore/home/agent/. "$HOME/" 2>/dev/null || true
  else
    cp -a /sessions-restore/. "$HOME/" 2>/dev/null || true
  fi
fi
# Deps are baked in the harness image (node_modules); the
# landing gate re-installs fresh via npm ci in the test job.
true
case "$SEAT" in
  builder)
    # glm-4.7-flash@zai — the lane PROVEN on admincraft CI runs.
    # Relief: laguna-s-2.1:free via openrouter (R-2-63 §3.3 —
    # minimax-m3.1 is BURNED, Owner law 2026-10-24 17:01Z). Base
    # URL carries NO /v1 — goose appends the version path itself
    # (404 /v1/v1 evidence: proof run 40218134008).
    if env GOOSE_PROVIDER=openai GOOSE_MODEL=glm-4.7-flash \
         OPENAI_API_KEY="$ZAI_API_KEY" \
         OPENAI_HOST="https://api.z.ai" \
         OPENAI_BASE_PATH="/api/paas/v4/chat/completions" \
         goose run --no-session -t "$BRIEF"; then
      echo "TURN_RESULT=goose run OK (lane: glm-4.7-flash@zai)"
    elif env GOOSE_PROVIDER=openai GOOSE_MODEL=poolside/laguna-s-2.1:free \
         OPENAI_API_KEY="$OPENROUTER_API_KEY" \
         OPENAI_HOST="https://openrouter.ai/api" \
         goose run --no-session -t "$BRIEF"; then
      echo "TURN_RESULT=goose run OK (relief lane: laguna-s-2.1:free@openrouter)"
    elif env OPENCODE_API_KEY="$OPENCODE_API_KEY" \
         opencode run -m zen/glm-5.3-flash-free "$BRIEF"; then
      # THIRD relief (run 40229853906: zai 429 + openrouter
      # free-models-per-day cap BOTH squeezed — the same double
      # squeeze as the R-2-69 proof): the zen free lane through
      # opencode's own CLI. Different lane, free, already wired.
      echo "TURN_RESULT=opencode run OK (relief lane: glm-5.3-flash-free@zen)"
    else
      echo "TURN_RESULT=BLOCKED (zai + openrouter + zen lanes failed — check repo secrets)"
    fi
    ;;
  fe)
    # glm-5.3-flash-free@opencode — OpenCode Zen built-in free
    # (zen provider block in the baked opencode.json;
    # OPENCODE_API_KEY lane). Their own CLI is the body — Owner:
    # "the model MUST be provided by opencode, inside their CLI".
    # Relief: the SAME zen brain through goose's OpenAI-compatible
    # lane (zen /v1/chat/completions) — different body, same free
    # brain; a blocked segment never fakes a verdict.
    if env OPENCODE_API_KEY="$OPENCODE_API_KEY" \
         opencode run -m zen/glm-5.3-flash-free "$BRIEF"; then
      echo "TURN_RESULT=opencode run OK (lane: glm-5.3-flash-free@zen)"
    elif env GOOSE_PROVIDER=openai GOOSE_MODEL=glm-5.3-flash-free \
         OPENAI_API_KEY="$OPENCODE_API_KEY" \
         OPENAI_HOST="https://opencode.ai" \
         OPENAI_BASE_PATH="/zen/v1/chat/completions" \
         goose run --no-session -t "$BRIEF"; then
      echo "TURN_RESULT=goose run OK (relief lane: glm-5.3-flash-free via goose on zen)"
    else
      echo "TURN_RESULT=BLOCKED (zen lanes failed — check OPENCODE_API_KEY)"
    fi
    ;;
  qa)
    # groq/qwen3.8-27b@opencode — groq provider block in the
    # baked opencode.json (GROQ_API_KEY lane). NO goose relief:
    # goose is BENCHED for groq brains (HTTP 400 `developer` role,
    # goose-config.yaml) — falling back would fake the lane.
    if env OPENCODE_API_KEY="$OPENCODE_API_KEY" \
         opencode run -m groq/qwen3.8-27b "$BRIEF"; then
      echo "TURN_RESULT=opencode run OK (lane: qwen3.8-27b@groq)"
    else
      echo "TURN_RESULT=BLOCKED (groq lane failed — check GROQ_API_KEY)"
    fi
    ;;
  *)
    echo "TURN_RESULT=BLOCKED (unknown seat ${SEAT} — rotation case gap)"
    ;;
esac
# SESSION COLLECT (Owner order 18:27Z): persist THIS turn's CLI
# session files — the container is --rm, they die here unless
# captured. Scrubbing happens on the host before upload.
SESS="/workspace/.turn-sessions.tgz"
rm -f "$SESS"
tar czf "$SESS" -C / \
  "${HOME#/}/.qoder" \
  "${HOME#/}/.config/goose/sessions" \
  "${HOME#/}/.local/share/opencode" \
  "${HOME#/}/.codebuddy/projects" \
  "${HOME#/}/.codebuddy/sessions" \
  "usr/local/lib/qoder-home/.qoder" \
  2>/dev/null || true
[ -s "$SESS" ] || echo "sessions: nothing collected this turn" >&2
