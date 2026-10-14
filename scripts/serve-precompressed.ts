// serve-precompressed.ts — hand the browser the .gz that is already on disk.
//
// WHY THIS EXISTS
// The transport pass (scripts/slim-graph.mjs) writes graph.json.gz next to
// graph.json — 112 kB against 2,252 kB, a 20x difference — on the assumption
// that a static server picks it up automatically. Vite does not: neither its
// dev server nor `vite preview` ever sent `content-encoding: gzip`, so a
// visitor's FIRST request was the full 2.2 MB. On a laptop that is a shrug;
// through a tunnel on a 4 GB box it is a timeout and a Bad Gateway.
//
// WHAT IT DOES
// One middleware for both servers: if the client accepts gzip and a sibling
// `<file>.gz` exists, stream that instead with the right headers. Nothing
// else changes — a browser without gzip, or a file we never compressed,
// falls through to Vite's own handler untouched.
//
// Deploy note: this is a DEV/PREVIEW fix. A real host should do it in the
// server (nginx `gzip_static on;`, Caddy `encode gzip`) and skip this file.

import { existsSync, statSync } from 'node:fs'
import { createReadStream } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import type { Connect, PreviewServer, ViteDevServer } from 'vite'

/** Extension -> Content-Type. Only these are ever candidates: everything
 *  else (a hashed .woff2, an image) is already small or already hashed. */
const TYPES: Record<string, string> = {
  '.json': 'application/json',
  '.html': 'text/html',
  '.txt': 'text/plain; charset=utf-8',
  '.org': 'text/plain; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
}

export function servePrecompressed(dir: string): Connect.NextHandleFunction {
  const root = resolve(dir)
  return (req, res, next) => {
    // Strip the query and any base prefix, then decode: a doc slug can carry
    // percent-encoded characters (org--Agenda-Views#Foo%20Bar style ids).
    let rel = (req.url ?? '/').split('?')[0].replace(/^\/+/, '')
    try {
      rel = decodeURIComponent(rel)
    } catch {
      return next() // a malformed escape is Vite's problem, not ours
    }
    const type = TYPES[extname(rel)]
    if (!rel || !type) return next()
    if (!/\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''))) return next()

    const gz = join(root, rel + '.gz')
    if (!existsSync(gz)) return next()

    res.setHeader('Content-Encoding', 'gzip')
    res.setHeader('Content-Type', type)
    // Cached on "did this client take the compressed copy" — a proxy that
    // ignores Vary would hand an uncompressed client a gzip body.
    res.setHeader('Vary', 'Accept-Encoding')
    res.setHeader('Content-Length', String(statSync(gz).size))
    createReadStream(gz).pipe(res)
  }
}

/** The plugin: same middleware on the dev server and on `vite preview`. */
export function precompressed(publicDir: string) {
  return {
    name: 'serve-precompressed',
    // Added directly (not via a returned callback) so it runs BEFORE Vite's
    // own static handler and actually wins the race for the file.
    configureServer(server: ViteDevServer) {
      server.middlewares.use(servePrecompressed(publicDir))
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use(servePrecompressed(resolve('dist')))
    },
  }
}
