#!/usr/bin/env bash
# docneural landing gate — CORPUS-FREE: vitest + svelte-check only.
# (make export / linkcheck / verify need the ~/docs corpus — Owner box only.)
#
# The UI theme is a SIBLING checkout: repo khaalidrafi/docneural-ui
# (formerly synapt). Public repo; CI clones it fresh. Both resolvers are
# satisfied: vite.config accepts ../docneural-ui OR ../synapt, while
# tsconfig paths still point at ../synapt — so a symlink covers both.
set -euo pipefail
cd "$(dirname "$0")/../.."
if [ ! -e ../docneural-ui/.git ] && [ ! -e ../synapt/.git ]; then
  git clone --depth 1 https://github.com/khaalidrafi/docneural-ui.git ../docneural-ui
  ln -s docneural-ui ../synapt
fi
npm ci
npx vitest run
npm run check
