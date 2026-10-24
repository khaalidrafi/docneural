// browser.mjs — where the real-browser gates find their stack.
//
// Two halves, both resolved without an install:
//
//   library  playwright-core rides in whichever sibling checkout has it
//            (zero new dependencies for this repo). Order: $DOCNEURAL_PLAYWRIGHT,
//            the sibling org-roam-lite-ui checkout next to this repo, the
//            owner's 4 GB box absolute path, a bare specifier last.
//
//   browser  On the Guix build box PATH's `chromium` is the only one that
//            boots (Playwright's cache wants the FHS loader Guix lacks). On
//            an FHS box — CI, a plain container — PATH may have no chromium
//            while Playwright's own cache DOES. So: PATH first, cache as
//            fallback, $DOCNEURAL_CHROME overrides both.
//
// Consumers: scripts/pw-verify.mjs, scripts/boot-audit.mjs.
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export async function loadPlaywright() {
  const candidates = [
    process.env.DOCNEURAL_PLAYWRIGHT,
    // sibling checkout of this repo (agent-work/org-roam-lite-ui)
    new URL('../../org-roam-lite-ui/node_modules/playwright-core/index.mjs', import.meta.url).pathname,
    // the owner's 4 GB box absolute path
    '/home/khalid/org-roam-lite-ui/node_modules/playwright-core/index.mjs',
    'playwright-core'
  ].filter(Boolean)
  for (const spec of candidates) {
    try {
      return await import(spec)
    } catch {
      /* try the next location */
    }
  }
  console.error('playwright-core not found — set DOCNEURAL_PLAYWRIGHT=/path/to/playwright-core/index.mjs')
  process.exit(2)
}

export function findChrome() {
  const onPath = (process.env.PATH ?? '')
    .split(':')
    .map((d) => `${d}/chromium`)
    .find((p) => existsSync(p))
  if (onPath) return onPath
  // Playwright's own download cache: newest build first, full chrome before
  // the headless shell (clipboard permissions and screenshots want it).
  const cache = join(homedir(), '.cache', 'ms-playwright')
  try {
    const dirs = readdirSync(cache).filter((d) => /^chromium/.test(d)).sort().reverse()
    for (const d of dirs) {
      for (const rel of ['chrome-linux64/chrome', 'chrome-linux/chrome']) {
        const p = join(cache, d, rel)
        if (existsSync(p)) return p
      }
    }
  } catch {
    /* no cache — PATH was the only hope */
  }
  return undefined
}
