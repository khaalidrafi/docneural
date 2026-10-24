// verify-built.mjs — run the FULL pw-verify gate against the BUILT site.
//
// `make verify` points at whatever URL you give it, and until now the default
// habit was the dev server — where Vite transforms modules on the fly and
// every number is about the dev pipeline, not the shipped artifact. This
// runner closes that gap: it serves dist/ with `vite preview` (which carries
// the site's serve-precompressed middleware), then drives scripts/pw-verify
// against it, so every boot-request / transport / font assertion in the gate
// is judged on the BUILT output.
//
//   node scripts/verify-built.mjs --project . --port 4173 --paint 180000 --nav 90000
//
// Exit code is pw-verify's (0 = all checks passed). The preview server is
// always killed, including when pw-verify crashes.
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { startPreview } from './preview-dist.mjs'

const argv = process.argv.slice(2)
const arg = (name, dflt) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? dflt : argv[i + 1]
}
const PROJECT = arg('project', '.')
const PORT = Number(arg('port', '4173'))
const PAINT = arg('paint', '180000')
const NAV = arg('nav', '90000')

const { url, child } = await startPreview(PROJECT, PORT)
console.log(`verify-built: ${resolve(PROJECT)}/dist served at ${url}; running pw-verify against it\n`)
const pw = spawn(process.execPath, ['scripts/pw-verify.mjs', '--url', url, '--paint', PAINT, '--nav', NAV], {
  cwd: resolve(PROJECT),
  stdio: 'inherit'
})
let code = 2
pw.on('exit', (c) => {
  code = c ?? 2
  child.kill('SIGTERM')
})
pw.on('error', (e) => {
  console.error(`verify-built: could not start pw-verify: ${e.message}`)
  child.kill('SIGTERM')
  process.exit(2)
})
// Stay alive until the child is done, then exit with its code.
process.on('exit', () => child.kill('SIGTERM'))
await new Promise((r) => pw.on('exit', r))
process.exit(code)
