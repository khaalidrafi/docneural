#!/usr/bin/env bash
# docneural landing gate — CORPUS-FREE: vitest + svelte-check only.
# (make export / linkcheck / verify need the ~/docs corpus — Owner box only.)
#
# SIBLING REPOS (checked out fresh by the gate; they exist only on the
# Owner's box otherwise):
#   khaalidrafi/docneural-ui  — the UI theme (formerly synapt). Public.
#       tsconfig paths still point at ../synapt, so a symlink satisfies
#       both resolvers (vite.config accepts either, docneural-ui wins).
#   khaalidrafi/org-roam-lite-ui — the orui/* source (path-aliased, no npm
#       package). Theme + shell both bare-import orui/*; a node_modules
#       symlink gives svelte-check a resolver without inventing packages.
#   The theme gets its own npm ci: its svelte.config.js loads
#   @sveltejs/vite-plugin-svelte from ITS node_modules (run 40112903121).
#
# GATE SCOPE: svelte-check walks into the vendored siblings through the
# imports; their internals are that repo's own CI concern. Verdict = FAIL
# on shell errors, WARN on sibling-only errors (counted, not gating).
set -euo pipefail
cd "$(dirname "$0")/../.."

clone() { # clone <repo> <dir>
  if [ -n "${GH_PAT:-}" ]; then
    git clone --quiet --depth 1 "https://x-access-token:${GH_PAT}@github.com/khaalidrafi/$1.git" "$2" 2>/dev/null \
      || git clone --quiet --depth 1 "https://github.com/khaalidrafi/$1.git" "$2"
  else
    git clone --quiet --depth 1 "https://github.com/khaalidrafi/$1.git" "$2"
  fi
}

if [ ! -e ../docneural-ui/.git ] && [ ! -e ../synapt/.git ]; then
  clone docneural-ui ../docneural-ui
  ln -s docneural-ui ../synapt
fi
if [ ! -e ../org-roam-lite-ui/.git ]; then
  clone org-roam-lite-ui ../org-roam-lite-ui
fi
( cd ../docneural-ui && npm ci --no-audit --no-fund )

mkdir -p node_modules
ln -sfn ../org-roam-lite-ui/src/lib node_modules/orui

npm ci --no-audit --no-fund
npx vitest run

set +e
npm run check > /tmp/check.log 2>&1
set -e
SHELL_ERRS=$(python3 - << 'PY'
import re
log = open('/tmp/check.log', encoding='utf-8', errors='replace').read()
blocks = re.findall(r'(/home/\S+?):\d+:\d+\s*\n\s*Error:[^\n]*', log)
sib = ('/docneural-ui/', '/synapt/', '/org-roam-lite-ui/')
print(sum(1 for b in blocks if not any(s in b for s in sib)))
PY
)
SIB_ERRS=$(grep -cE "^/home/[^ ]*(docneural-ui|synapt|org-roam-lite-ui)/" /tmp/check.log || true)
echo "svelte-check: $SHELL_ERRS shell error(s), $SIB_ERRS sibling line(s) (non-gating)"
if [ "${SHELL_ERRS:-1}" -ne 0 ]; then
  echo "— gate FAILED on shell errors:"
  rg -A2 "^/home/\S+" /tmp/check.log | head -60 || true
  exit 1
fi
echo "landing gate GREEN"
