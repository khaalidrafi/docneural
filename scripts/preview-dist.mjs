// preview-dist.mjs — serve a BUILT dist the way production would.
//
// One spawner, two consumers (verify-built.mjs, boot-audit.mjs): `vite
// preview` is used instead of a hand-rolled static server because the site's
// config attaches the serve-precompressed middleware to it — a real preview
// of what a visitor's boot requests meet, not a second, divergent server.
//
// CLI, for poking at a build by hand:
//   node scripts/preview-dist.mjs --project . --port 4173
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve, join } from 'node:path'

const argv = process.argv.slice(2)
const arg = (name, dflt) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? dflt : argv[i + 1]
}

/** Start `vite preview` for a project dir and wait until it answers.
 *  Returns { url, close } — close() kills the child, always call it. */
export async function startPreview(projectDir = '.', port = 4173) {
  const root = resolve(projectDir)
  const dist = join(root, 'dist')
  if (!existsSync(dist)) {
    throw new Error(`preview-dist: ${dist} does not exist — build first (make build / npx vite build)`)
  }
  // The project's own node_modules binary first; `npx` as the fallback (it
  // resolves the same Vite without a local install). --host pins IPv4: vite
  // binds `localhost`, which on dual-stack boxes can be ::1-only, and the
  // readiness poll (and every assertion URL) speaks 127.0.0.1.
  const bin = join(root, 'node_modules', '.bin', 'vite')
  const cmd = existsSync(bin) ? bin : 'npx'
  const args = existsSync(bin)
    ? ['preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort']
    : ['exec', '--no', '--', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort']
  const child = spawn(cmd, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
  let err = ''
  child.stderr.on('data', (d) => (err += d))
  const url = `http://127.0.0.1:${port}/`
  const deadline = Date.now() + 30_000
  for (;;) {
    if (child.exitCode !== null) {
      throw new Error(`preview-dist: vite preview exited (${child.exitCode})\n${err}`)
    }
    try {
      const res = await fetch(url)
      if (res.status < 500) break // up (a 404 on / is still a serving server)
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) {
      child.kill('SIGTERM')
      throw new Error(`preview-dist: ${url} never answered in 30 s\n${err}`)
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  return { url, child }
}

// CLI mode: hold the server open until interrupted.
if (import.meta.url === `file://${process.argv[1]}`) {
  const project = arg('project', '.')
  const port = Number(arg('port', '4173'))
  const { url, child } = await startPreview(project, port)
  console.log(`preview-dist: serving ${resolve(project)}/dist at ${url}`)
  const bye = () => { child.kill('SIGTERM'); process.exit(0) }
  process.on('SIGINT', bye)
  process.on('SIGTERM', bye)
}
