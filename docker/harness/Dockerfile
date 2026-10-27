# docneural project harness — THIN EXTENSION of the canonical kit image.
#
# ci contract §2 (khaalidrafi/agent-team-ci, TEAM-UPDATE #10): body
# installs + global-law bakes are INHERITED from the canonical
# ci/docker/harness/Dockerfile (built FIRST from this repo root as
# agent-harness:base — the canonical build bakes ci/AGENTS.md into every
# body's law slot). This file carries ONLY docneural's project layers.
# Local forks of body/law bakes are a compliance violation — port
# upstream first.
#
# Secrets are NEVER baked: provider keys are env-injected per run from
# repo secrets. Project deps (svelte 5 / vite 6 / vitest / svelte-check,
# design scripts) are baked so segments run offline-fast; the landing
# gate still installs fresh via npm ci.

FROM agent-harness:base

# --- Project deps (baked; source is mounted at segment start) ----------
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# --- Cline body (docneural hire order 2026-10-26: the @cline intern
#     body; NOT part of the canonical kit). Version pinned to the
#     CANDIDATES.org body-profile row (cline@3.0.73). Creds are NEVER
#     baked: `cline auth -p cline -k "$CLINE_API_KEY" -m <model>` seeds
#     providers.json headless at dispatch; --auto-approve stays OFF.
RUN npm i -g cline@3.0.73 \
 && command -v cline

# --- agent-org batch send lane (Owner R-2-77 endgame 2026-10-26 #hq:
#     team CI sends run THROUGH agent-org). agent-org is the
#     capability layer: it spawns the provider's ACP agent, creates
#     agent sessions (initialize + session/new) and sends prompts —
#     the same primitives an interactive send uses; agent-team.el
#     depends on it for ALL ACP agent tasks. This bake pins emacs
#     30.1 (Debian bookworm backport, dpkg-relocated, no apt
#     conflicts, deterministic bytes), agent-org at a PINNED sha and
#     the pinned acp.el. agent-org-batch.el is the thin headless
#     DRIVER: one `emacs --batch' run calls those agent-org
#     primitives for a CI send (one prompt per turn, raw chunks to
#     a file) and fires the SAME prompt-send hook an interactive
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

# --- Project body config deltas (model routing ONLY — the LAW bakes in
#     the canonical image live in SEPARATE files (opencode/AGENTS.md,
#     goose hints, CODEBUDDY.md) and are NOT touched here; the dual-law
#     brief additionally rides every prompt via ci/bin/law_brief.sh).
COPY docker/harness/opencode.json     /home/agent/.config/opencode/opencode.json
COPY docker/harness/goose-config.yaml /home/agent/.config/goose/config.yaml
RUN chown -R agent:agent /home/agent

ENV HOME=/home/agent \
    GOOSE_PROVIDER=openai \
    GOOSE_MODEL=glm-4.7-flash

STOPSIGNAL SIGTERM
