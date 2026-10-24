#!/usr/bin/env bash
# docneural landing gate — CORPUS-FREE: vitest + svelte-check only.
# (make export / linkcheck / verify need the ~/docs corpus, which exists
# only on the Owner's box — never required in CI.)
set -euo pipefail
cd "$(dirname "$0")/../.."
npm ci
npx vitest run
npm run check
