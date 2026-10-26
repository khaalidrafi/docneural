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

# --- Cline body (Owner hire order 2026-10-26: hire cline free models via
#     BOTH routes — API and its OWN CLI; the CLI is the @cline intern body).
#     Version pinned to the CANDIDATES.org body-profile row (cline@3.0.73).
#     Creds are NEVER baked: `cline auth -p cline -k "$CLINE_API_KEY" -m
#     <model>` seeds providers.json headless at dispatch (docs-proven
#     non-interactive path); --auto-approve stays OFF for accountable work. --
RUN npm i -g cline@3.0.73 \
 && command -v cline

# --- agent-org batch send lane (Owner R-2-77 endgame 2026-10-26 #hq:
#     team CI sends run THROUGH agent-org). emacs 30.1 from the Debian
#     bookworm backport, dpkg-relocated (no apt conflicts, deterministic
#     bytes), plus agent-org at a PINNED sha and the pinned acp.el.
#     One `emacs --batch` then spawns the provider's ACP agent, sends
#     ONE prompt and fires the SAME prompt-send hook an interactive
#     send fires — the CI clock lands at the exact send moment. Exit 42
#     = the batch lane is unavailable -> direct CLI lane (unchanged).
ARG AGENT_ORG_PIN=bbe8ca2d4567eaf455ab58f557b9eed3ac375742
RUN mkdir -p /opt/emacs30 /opt/deb \
 && curl -fsSL -o /opt/deb/emacs-common.deb \
      "http://deb.debian.org/debian/pool/main/e/emacs/emacs-common_30.1+1-6~bpo12+1_all.deb" \
 && curl -fsSL -o /opt/deb/emacs-bin-common.deb \
      "http://deb.debian.org/debian/pool/main/e/emacs/emacs-bin-common_30.1+1-6~bpo12+1_amd64.deb" \
 && curl -fsSL -o /opt/deb/emacs-nox.deb \
      "http://deb.debian.org/debian/pool/main/e/emacs/emacs-nox_30.1+1-6~bpo12+1_amd64.deb" \
 && dpkg -x /opt/deb/emacs-common.deb /opt/emacs30 \
 && dpkg -x /opt/deb/emacs-bin-common.deb /opt/emacs30 \
 && dpkg -x /opt/deb/emacs-nox.deb /opt/emacs30 \
 && rm -rf /opt/deb \
 && printf '#!/bin/sh\nexec /opt/emacs30/usr/bin/emacs-nox "$@"\n' > /usr/local/bin/emacs \
 && chmod 0755 /usr/local/bin/emacs \
 && emacs --batch --eval '(message "emacs %s relocated ok" emacs-version)' \
 && git clone --quiet https://github.com/khaalidrafi/agent-org /opt/agent-org \
 && git -C /opt/agent-org checkout --quiet "${AGENT_ORG_PIN}" \
 && curl -fsSL https://raw.githubusercontent.com/xenodium/acp.el/v0.14.3/acp.el -o /opt/agent-org/acp.el \
 && curl -fsSL https://raw.githubusercontent.com/xenodium/acp.el/v0.14.3/acp-traffic.el -o /opt/agent-org/acp-traffic.el \
 && emacs --batch -L /opt/agent-org --eval '(require (quote agent-org-batch))' \
 && echo "agent-org batch lane baked (pin ${AGENT_ORG_PIN})"

ENV LD_LIBRARY_PATH=/opt/emacs30/usr/lib/x86_64-linux-gnu \
    EMACSDATA=/opt/emacs30/usr/share/emacs/30.1/etc \
    EMACSLOADPATH=/opt/emacs30/usr/share/emacs/30.1/lisp \
    EMACSNATIVELOADPATH=""

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
