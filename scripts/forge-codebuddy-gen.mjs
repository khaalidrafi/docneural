// forge-codebuddy-gen.mjs — burn CodeBuddy PAID credits on forge entries.
// Owner order 2026-10-27: "quickly burn 75 credits from codebuddy to perform
// some quality work with a good paid model, not ds v4.1 flash which is free
// this month. The credits are expiring!!"
//
// Pool law (canonical CANDIDATES.org @6a5653e): CodeBuddy = the WorkBuddy.ai
// cloud pool (Owner confirmation 2026-10-20). Owner EXCLUDED
// deepseek-v4.1-flash (free this month — no credits burned on it).
// Model list evidence: CLI 2.177.0 --help (run 40378051072) — supported ids:
// default/fast/balanced/primary/deep-model, hy4-preview, hy3,
// deepseek-v4.1-flash, gpt-6-astra, gpt-5.6-sol/terra/luna, gpt-5.5/5.4,
// gemini-3.5-flash, glm-5.3-flash, glm-5.3, glm-5.2, kimi-k3, kimi-k2.6,
// kimi-k2.8-preview. Best PUBLIC designers drivable here:
// kimi-k3 (Design Arena 1335, #2 on the whole board), gpt-6-astra (1327),
// glm-5.2 (1285), kimi-k2.6 (1268).
//
// Run-field evidence (runs 40377347452 / 40378051072 / 40378703437):
//  - auth failure prints "Authentication required. Please use /login" and
//    exits 0 — exit codes CANNOT be trusted; only a valid index.html counts.
//  - the sealed token mapped into CODEBUDDY_API_KEY ("in non-interactive
//    mode (-p) this key is always used", Tencent doc product/1316/84430)
//    AUTHENTICATES: kimi-k3 generated for 2x8min (killed by the 480s
//    per-attempt timeout mid-generation), gpt-6-astra + glm-5.2 were
//    fast-rejected (~7s, silent) — account/model entitlement unknown.
//  - therefore: stream stdout/stderr to per-attempt log files via spawn
//    (evidence survives SIGTERM), raise the per-attempt budget to 25 min,
//    and default to the single strongest designer (kimi-k3).

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const STAGING = 'scripts/forge-staging';
// Round field is FRESH: committed round-1 staging entries stay in git but do
// not compete here. Failed dirs are KEPT (GEN.json + attempt logs = evidence);
// design-forge only picks up dirs that contain a valid index.html.
fs.rmSync(STAGING, { recursive: true, force: true });
fs.mkdirSync(STAGING, { recursive: true });

const models = (process.argv[2] || 'kimi-k3')
  .split(/\s+/).filter(Boolean)
  .filter(m => !/deepseek|ds[-_]?v4/i.test(m)); // Owner exclusion, hard-enforced
if (models.length === 0) {
  console.error('no eligible models after the deepseek-v4.1-flash exclusion');
  process.exit(1);
}

const brief = fs.readFileSync('scripts/forge-brief.md', 'utf8');
const prompt = `${brief}

DELIVERABLE (strict): create ONE complete single-file HTML page (all CSS and JS inline, no external assets, no external fonts, no external images) implementing the brief EXACTLY, and SAVE it as index.html in the current working directory. Do not ask questions. Do not explain. Write the file and stop.`;

const version = (() => {
  try { return execCapture(['--version'], 60000).out.trim(); }
  catch (e) { return `version probe failed: ${e}`; }
})();
console.log(`codebuddy CLI: ${version}`);

function execCapture(args, timeoutMs, cwd, envExtra, logFile) {
  return new Promise((resolve) => {
    const outFd = fs.openSync(logFile + '.out', 'w');
    const errFd = fs.openSync(logFile + '.err', 'w');
    const child = spawn('codebuddy', args, {
      cwd,
      env: { ...process.env, ...envExtra, DISABLE_AUTOUPDATER: '1' },
      stdio: ['ignore', outFd, errFd],
    });
    let killed = false;
    const timer = setTimeout(() => { killed = true; child.kill('SIGTERM'); }, timeoutMs);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      fs.closeSync(outFd); fs.closeSync(errFd);
      resolve({ code, signal, killed, out: safeRead(logFile + '.out'), err: safeRead(logFile + '.err') });
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      fs.closeSync(outFd); fs.closeSync(errFd);
      resolve({ code: -1, signal: null, killed: false, out: '', err: String(e) });
    });
  });
}
const safeRead = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };

// The sealed secret (named CODEBUDDY_AUTH_TOKEN in repo settings) mapped into
// both documented slots; run 40378703437 proved the API-key slot authenticates
// (kimi-k3 generated for 16 min before the timeout kills).
//
// SPEND LAW (Owner 2026-10-27 19:02 "Please note that I have limited credits
// to run paid models on CodeBuddy"): EXACTLY ONE paid generation per model.
// The old 2-variant env matrix is DELETED: forge-codebuddy.yml injects
// CODEBUDDY_API_KEY at job level into EVERY attempt, so a second "variant"
// is the identical env re-billed — a timeout retry would DOUBLE the burn for
// a near-duplicate page. Auth failures burn nothing (proven 40377347452:
// auth fails before any model call) and are classified 0-burn in the ledger.
const TOKEN = process.env.CODEBUDDY_AUTH_TOKEN || process.env.CODEBUDDY_API_KEY || '';
const ENV_MATRIX = [
  { label: 'api-key-slot', extra: { CODEBUDDY_API_KEY: TOKEN } },
];
const ATTEMPT_BUDGET_MS = 25 * 60 * 1000; // kimi-k3 was still generating at 8 min
const MAX_PAID_GENERATIONS = models.length; // spend cap: one real generation per model, hard
let paidAttempts = 0;

const report = [];
for (const model of models) {
  const dirName = 'entry-' + model.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
  const dir = path.join(STAGING, dirName);
  fs.mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  let ok = false, how = 'none', lastTail = '', attempts = 0;
  const htmlPath = path.join(dir, 'index.html');

  for (const [i, envv] of ENV_MATRIX.entries()) {
    if (paidAttempts >= MAX_PAID_GENERATIONS) {
      console.log(`SPEND CAP hit (${paidAttempts}/${MAX_PAID_GENERATIONS} paid generations) — ${model} NOT attempted, zero credits exposed`);
      lastTail = 'skipped: spend cap';
      break;
    }
    attempts++; paidAttempts++;
    if (fs.existsSync(htmlPath)) fs.rmSync(htmlPath);
    const logFile = path.join(dir, `attempt-${i + 1}-${envv.label}`);
    const r = await execCapture(['-p', prompt, '-y', '--model', model], ATTEMPT_BUDGET_MS, dir,
      envv.extra, logFile);
    lastTail = (r.out + ' || ' + r.err).replace(/\s+/g, ' ').slice(-280);
    // success = a real, valid index.html on disk (exit codes lie — auth
    // failures exit 0; timeout kills leave partial work)
    const valid = fs.existsSync(htmlPath) && (() => { const h = fs.readFileSync(htmlPath, 'utf8'); return h.length >= 400 && /<html|<!DOCTYPE/i.test(h); })();
    const authFail = /authentication required|please use \/login/i.test(r.out + r.err);
    if (valid) { ok = true; how = envv.label + ' (--model ' + model + ')'; break; }
    if (authFail) console.log(`codebuddy ${model} [${envv.label}] AUTH-FAIL (0 credits burned) after ${Math.round((Date.now() - t0) / 1000)}s`);
    else if (r.killed) console.log(`codebuddy ${model} [${envv.label}] TIMEOUT at ${ATTEMPT_BUDGET_MS / 1000}s — partial logs kept in ${logFile}.out/.err`);
    else console.log(`codebuddy ${model} [${envv.label}] exit=${r.code} no valid page: ${lastTail || '(silent)'}`);
    // no fenced-HTML fallback from stdout: agentic mode writes the file; chat
    // output here was empty in every observed run. NO RETRY: spend law — a
    // failed attempt is terminal for this model this dispatch.
  }

  let status = 'FAIL';
  if (fs.existsSync(htmlPath)) {
    const h = fs.readFileSync(htmlPath, 'utf8');
    status = (h.length >= 400 && /<html|<!DOCTYPE/i.test(h)) ? `OK ${h.length}B` : `NOT HTML (${h.length}B)`;
  }
  fs.writeFileSync(path.join(dir, 'GEN.json'), JSON.stringify({ model, how, attempts, ms: Date.now() - t0, status, lastTail }, null, 2));
  report.push({ model, dirName, status, how, attempts, genSeconds: Math.round((Date.now() - t0) / 1000), ms: Date.now() - t0 });
  console.log(`codebuddy ${model}: ${status} via ${how} (${Date.now() - t0}ms)`);
}

const authFails = report.filter(r => r.attempts > 0 && r.status === 'FAIL' && r.how === 'none' && r.genSeconds < 30).length;
fs.writeFileSync('forge-codebuddy-gen-report.json', JSON.stringify({
  cli: version,
  excludedByOwner: 'deepseek-v4.1-flash (free this month)',
  attemptBudgetMs: ATTEMPT_BUDGET_MS,
  spendLedger: {
    law: 'ONE paid generation per model; no variant spray, no retries (Owner limited-credits note 2026-10-27)',
    spawnedProcesses: paidAttempts,
    capMax: MAX_PAID_GENERATIONS,
    probableAuthFailsZeroBurn: authFails,
    creditTruth: 'the CLI does not report credit balances; generation seconds per model = exposure proxy',
  },
  note: 'failed dirs KEPT as evidence (attempt logs + GEN.json); forge picks only valid index.html dirs',
  report,
}, null, 2));
console.log('staging field:', fs.readdirSync(STAGING).join(', '));
