# docneural agent harness — CI turn container (node variant).
# Bodies PREINSTALLED (Owner order 2026-10-20 #hq: agents go into the
# image, not into CI). Secrets are NEVER baked: keys are env-injected
# per run from repo secrets.
#
# NO AGENTS.md bake yet (docneural has no repo-root AGENTS.md as of
# 2026-10-24; admincraft-style law bakes start when the Lead lands one).
# The turn brief reads agent-team/TEAM-CONTROL.org + agent-team/TEAM.md
# from the checked-out workspace at runtime.
# Project deps (svelte 5 / vite 6 / vitest / svelte-check) are baked so
# segments run offline-fast; the landing gate still installs fresh.

FROM node:20-slim

RUN apt-get update -qq \
 && apt-get install -y -qq --no-install-recommends \
      git curl ca-certificates jq procps python3 bzip2 \
 && rm -rf /var/lib/apt/lists/*

# --- Project deps (baked; source is mounted at segment start) ----------
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# --- Goose body (direct tarball: the download_cli.sh installer opens
#     /dev/tty and dies on headless runners — admincraft evidence) -------
RUN mkdir -p /tmp/goose-dl \
 && curl -fsSL --retry 5 --retry-all-errors --retry-delay 5 -m 300 -o /tmp/goose-dl/goose.tar.bz2 \
      https://github.com/block/goose/releases/download/stable/goose-x86_64-unknown-linux-gnu.tar.bz2 \
 && test -s /tmp/goose-dl/goose.tar.bz2 && tar -xjf /tmp/goose-dl/goose.tar.bz2 -C /tmp/goose-dl \
 && install -m 0755 /tmp/goose-dl/goose /usr/local/bin/goose \
 && rm -rf /tmp/goose-dl

# --- OpenCode body (preinstalled once, reused every turn) -------------------
RUN export HOME=/usr/local/lib/opencode-home \
 && curl -fsSL https://opencode.ai/install | bash \
 && chmod -R a+rX /usr/local/lib/opencode-home \
 && ln -sf /usr/local/lib/opencode-home/.opencode/bin/opencode /usr/local/bin/opencode

# --- Non-root run user (matches the Actions runner uid 1001) -----------
RUN useradd -m -u 1001 agent

# --- Baked agent configs (keys are env-interpolated at run time) --------
COPY docker/harness/opencode.json     /home/agent/.config/opencode/opencode.json
COPY docker/harness/goose-config.yaml /home/agent/.config/goose/config.yaml
RUN chown -R agent:agent /home/agent

ENV HOME=/home/agent \
    GOOSE_PROVIDER=openai \
    GOOSE_MODEL=glm-4.7-flash

STOPSIGNAL SIGTERM
