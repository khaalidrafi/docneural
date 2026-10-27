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

// DUAL-LAW BRIEF (ci contract §3, TEAM-UPDATE #10): the generation prompt
// carries the composed GLOBAL+LOCAL law. CI composes it via ci/bin/
// law_brief.sh and points CI_LAW_BRIEF_FILE at the file; unset (local
// runs) leaves behavior unchanged.
const LAW_FILE = process.env.CI_LAW_BRIEF_FILE || '';
const LAW = LAW_FILE && fs.existsSync(LAW_FILE) ? fs.readFileSync(LAW_FILE, 'utf8') + '\n\n' : '';

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
const prompt = `${LAW}${brief}

DELIVERABLE (strict): create ONE complete single-file HTML page (all CSS and JS inline, no external assets, no external fonts, no external images) implementing the brief EXACTLY, and SAVE it as index.html in the current working directory. Do not ask questions. Do not explain. Write the file and stop.

FINAL CHECK (mandatory, before you finish): the file ./index.html — exactly this name, in the CURRENT directory — must contain the complete page. If you wrote the page anywhere else, or under another name, or only partially, copy/complete it to ./index.html now. Ending without ./index.html means the task FAILED.`;

const version = await (async () => {
  const r = await execCapture(['--version'], 60000, process.cwd(), {}, '/tmp/cb-version');
  return r.out.trim() || `probe: exit=${r.code} err=${r.err.slice(0, 80)}`;
})();
console.log(`codebuddy CLI: ${version}`);

// ENDPOINT CONNECTIVITY PROBE (zero cost, zero credits) — run 40381847436
// died with "502 ... connect ETIMEDOUT 0.0.0.1:443 (target:
// https://www.codebuddy.ai)": GitHub runners may be unable to reach the
// INTERNATIONAL endpoint at all (DNS blackhole). Probe every documented
// site BEFORE burning wall-clock on retries. The pool models (kimi/glm/
// deepseek/hy) suggest the account may live on the CHINESE site
// (copilot.tencent.com, CODEBUDDY_INTERNET_ENVIRONMENT=internal).
const ENDPOINTS = [
  'https://www.codebuddy.ai',
  'https://codebuddy.ai',
  'https://api.codebuddy.ai',
  'https://copilot.tencent.com',
  'https://www.codebuddy.cn',
];
for (const ep of ENDPOINTS) {
  const t0 = Date.now();
  try {
    const res = await fetch(ep, { signal: AbortSignal.timeout(8000), redirect: 'manual' });
    console.log(`probe ${ep}: HTTP ${res.status} (${Date.now() - t0}ms)`);
  } catch (e) {
    console.log(`probe ${ep}: UNREACHABLE (${String(e.cause?.code || e.name).slice(0, 40)}, ${Date.now() - t0}ms)`);
  }
}

function execCapture(args, timeoutMs, cwd, envExtra, logFile, envUnset) {
  return new Promise((resolve) => {
    const outFd = fs.openSync(logFile + '.out', 'w');
    const errFd = fs.openSync(logFile + '.err', 'w');
    // run 40386541436 follow-up: spawn errors fire 'error' THEN 'close' —
    // double closeSync = EBADF crash. close each fd exactly once, ignore EBADF.
    let fdsClosed = false;
    const closeFds = () => {
      if (fdsClosed) return;
      fdsClosed = true;
      for (const fd of [outFd, errFd]) { try { fs.closeSync(fd); } catch { /* EBADF: already closed */ } }
    };
    const childEnv = { ...process.env, ...envExtra, DISABLE_AUTOUPDATER: '1' };
    for (const k of envUnset || []) delete childEnv[k]; // alt auth mode: remove the losing slot entirely
    const child = spawn('codebuddy', args, {
      cwd,
      env: childEnv,
      stdio: ['ignore', outFd, errFd],
    });
    let killed = false;
    const timer = setTimeout(() => { killed = true; child.kill('SIGTERM'); }, timeoutMs);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      closeFds();
      resolve({ code, signal, killed, out: safeRead(logFile + '.out'), err: safeRead(logFile + '.err') });
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      closeFds();
      resolve({ code: -1, signal: null, killed: false, out: '', err: String(e) });
    });
  });
}
// hoisted function declaration, NOT a const arrow — run 40386541436 crashed
// with "ReferenceError: Cannot access 'safeRead' before initialization" when
// the --version probe's child closed while the const below was still in TDZ.
// Zero credits burned (crash at version probe, before auth, before any model
// call) — classified 0-burn; the ONE paid generation stays ahead of us.
function safeRead(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }

// The sealed secret (named CODEBUDDY_AUTH_TOKEN in repo settings) mapped into
// both documented slots.
// AUTH EVIDENCE REWRITE (run 40388548989, the FIRST real auth verdict from a
// REACHABLE endpoint): with BOTH slots set the CLI chose Bearer custom-token
// mode ("auth-type:custom-token,token-type:Bearer,token-length:1450") and
// copilot.tencent.com returned 401 in 7s — 0 credits. The old proof that
// "the API-key slot authenticates" (run 40378703437, 2x8min "generation") is
// network-hang-contaminated: that run hit the UNREACHABLE intl endpoint, so
// the CLI was looping on connect timeouts, never reaching an auth verdict.
// Per the CLI's own note the two env vars are ALTERNATIVE auth modes — the
// single allowed experiment is now API-KEY-ONLY on the reachable china
// endpoint (AUTH_TOKEN unset in the child env). If this 401s too, the token
// is intl-scoped and the burn moves to an Owner-side body — NO further
// runner dispatches (spend law cap on 0-burn auth experiments: 2).
//
// SPEND LAW (Owner 2026-10-27 19:02 "Please note that I have limited credits
// to run paid models on CodeBuddy"): EXACTLY ONE paid generation per model.
// The old 2-variant env matrix is DELETED: forge-codebuddy.yml injects
// CODEBUDDY_API_KEY at job level into EVERY attempt, so a second "variant"
// is the identical env re-billed — a timeout retry would DOUBLE the burn for
// a near-duplicate page. Auth failures burn nothing (proven 40377347452:
// auth fails before any model call) and are classified 0-burn in the ledger.
const TOKEN = process.env.CODEBUDDY_AUTH_TOKEN || process.env.CODEBUDDY_API_KEY || '';
// SPEND-LAW-COMPLIANT single attempt, aimed at the REACHABLE endpoint:
// run 40381847436 proved the INTERNATIONAL site (www.codebuddy.ai) is
// UNREACHABLE from GitHub runners — "502 网络请求超时 (connect ETIMEDOUT
// 0.0.0.1:443, target https://www.codebuddy.ai)" after 18.6 min of the
// CLI's own retry loop with zero API progress. The pool models (kimi/glm/
// deepseek/hy) are domestic-flavored: the account most likely lives on the
// CHINESE site (copilot.tencent.com) = CODEBUDDY_INTERNET_ENVIRONMENT=internal.
// Auth failures burn ZERO credits (proven run 40377347452); a connect
// timeout also burns zero (fails before any model call) — but it wastes
// the dispatch window, so the one allowed attempt goes to the reachable
// endpoint first. The zero-cost endpoint probe above logs the evidence.
const ENV_MATRIX = [
  { label: 'api-key-ONLY+internal-china', extra: { CODEBUDDY_API_KEY: TOKEN, CODEBUDDY_INTERNET_ENVIRONMENT: 'internal' }, unset: ['CODEBUDDY_AUTH_TOKEN'] },
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
      envv.extra, logFile, envv.unset);
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
