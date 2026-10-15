import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath } from 'node:url'
import { precompressed } from './scripts/serve-precompressed'

// Where the batch Emacs exporter (scripts/docneural-export.el) drops
// its artifacts.  Vite serves this as the public dir: dev hits it directly,
// production copies it into dist/ verbatim.  The theme store fetches
// `${base}/graph.json` and `${base}/docs/${slug}.html`, so with base="" the
// site root must expose exactly those two paths — which .export/ already does.
const PUBDIR = fileURLToPath(new URL('.export', import.meta.url))

// Subpath aliases for the sibling docneural-ui theme (see docneural/package.json
// "exports"): import from source rather than installing a file: dependency,
// so vite-plugin-svelte compiles the .svelte files as first-class modules
// (no node_modules include dance).  force-graph is declared in our
// dependencies so optimizeDeps can still prebundle it.
const lib = (p: string) => fileURLToPath(new URL(`../docneural-ui/src/lib/${p}`, import.meta.url))
// org-roam-lite-ui is the REAL roam UI we build on (Layer 2 of the
// embed-org-roam-graph skill): its graphStore + GraphView + filters are plain
// modules with RELATIVE internal imports, so a single `orui/*` alias resolves
// its whole subtree with no `$lib` collision against docneural-ui.  We feed its
// store a static `graphdata` snapshot via applyGraphdata(), so the genuine roam
// UI runs with zero live Emacs (see the site's graph mode).  Sibling repo, so
// the '../' in server.fs.allow already covers it.
const ORUI_LIB = fileURLToPath(new URL('../org-roam-lite-ui/src/lib/', import.meta.url))
const themeAliases = [
  { find: /^docneural-ui$/, replacement: lib('DocneuralApp.svelte') },
  { find: /^docneural-ui\/store$/, replacement: lib('core/store.svelte.ts') },
  { find: /^docneural-ui\/core$/, replacement: lib('core/graph.ts') },
  { find: /^docneural-ui\/styles\/docneural-ui\.css$/,
    replacement: fileURLToPath(new URL('../docneural-ui/styles/docneural-ui.css', import.meta.url)) },
  { find: /^orui\/(.+)$/, replacement: `${ORUI_LIB}$1` },
  // ONE force-graph on disk. docneural/ and org-roam-lite-ui/ each carry their
  // own node_modules copy, and bare imports resolve relative to the IMPORTER,
  // so without this pin the build ships two ~175 kB copies of the same engine
  // (two lazy chunks). Point every resolution at THIS site's declared
  // dependency instead.
  { find: /^force-graph$/,
    replacement: fileURLToPath(new URL('node_modules/force-graph/dist/force-graph.mjs', import.meta.url)) },
]

export default defineConfig({
  // Vite serves neither dev nor preview with `content-encoding`, so the 2.2 MB
  // graph.json went out uncompressed and a tunneled visitor timed out on the
  // boot request. This makes it serve the .gz the slim step already wrote.
  plugins: [svelte(), precompressed(PUBDIR)],
  resolve: { alias: themeAliases },
  // Vite 6 confines server.fs to the workspace root; setting `allow` REPLACES
  // the default (it does not append), so '../' must cover BOTH this project's
  // src/ AND the sibling ../docneural-ui the alias pulls in.  The two repos are
  // siblings under $HOME, so allowing the parent is the right, simple bound.
  // `host: true` + `allowedHosts: true`: the dev server is reached through a
  // cloudflare tunnel (Host header is the trycloudflare URL, and the tunnel
  // connects from another machine), so bind all interfaces and accept any
  // host. Dev-only convenience — the shipped site is `npm run build` + sirv.
  server: { fs: { allow: ['..'] }, host: true, allowedHosts: true },
  publicDir: PUBDIR,
  build: { outDir: 'dist', emptyOutDir: true },
})
