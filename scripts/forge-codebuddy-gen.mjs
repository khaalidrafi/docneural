// forge-codebuddy-gen.mjs — burn CodeBuddy PAID credits on forge entries.
// Owner order 2026-10-27: "quickly burn 75 credits from codebuddy to perform
// some quality work with a good paid model, not ds v4.1 flash which is free
// this month. The credits are expiring!!"
//
// Pool law (canonical CANDIDATES.org @6a5653e): CodeBuddy = the WorkBuddy.ai
// cloud pool (Owner confirmation 2026-10-20) — kimi-k3, gemini-3.8-flash,
// glm-5.3/5.2, gpt-6-sol/luna, grok-4.7, step-5-preview, deepseek-v4.1-flash.
// Owner EXCLUDED deepseek-v4.1-flash (free this month — no credits burned).
// Pick rationale = PUBLIC design boards (bench/2026-10-27-public-benchmarks):
// kimi-k3 Design Arena 1335 (#2 designer on the whole board), gemini-3.8-flash
// ~1303 class, grok-4.7 (grok-4.3 was 1294 / Top 13%).
//
// Mechanism: codebuddy CLI (npm @tencent-ai/codebuddy-code), CODEBUDDY_AUTH_TOKEN
// sealed as an Actions secret. Agentic -p mode with -y (tool use) writes
// index.html into a fresh staging dir; scripts/design-forge.mjs picks staged
// entries up (FORGE_STAGED_ONLY=1 keeps the API lanes judge-only).
//
// Usage: node scripts/forge-codebuddy-gen.mjs "kimi-k3 gemini-3.8-flash grok-4.7"

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const STAGING = 'scripts/forge-staging';
// Round-2 field is FRESH: the committed round-1 staging entries (incumbent +
// gateway-plain) stay in git history but do not compete in this round.
fs.rmSync(STAGING, { recursive: true, force: true });
fs.mkdirSync(STAGING, { recursive: true });

const models = (process.argv[2] || 'kimi-k3 gemini-3.8-flash')
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
  try { return execFileSync('codebuddy', ['--version'], { encoding: 'utf8', timeout: 60000 }).trim(); }
  catch (e) { return `version probe failed: ${String(e.message).slice(0, 80)}`; }
})();
console.log(`codebuddy CLI: ${version}`);

const report = [];
for (const model of models) {
  const dirName = 'entry-' + model.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
  const dir = path.join(STAGING, dirName);
  fs.mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  let out = '', err = '', ok = false, how = 'none';

  // Strategy 1: explicit --model flag; Strategy 2: default model + env pin.
  for (const attempt of [
    { args: ['-p', prompt, '-y', '--model', model], how: `--model ${model}` },
    { args: ['-p', prompt, '-y'], how: 'default-model + CODEBUDDY_MODEL env pin' },
  ]) {
    try {
      out = execFileSync('codebuddy', attempt.args, {
        encoding: 'utf8', timeout: 540000, cwd: dir, maxBuffer: 64 * 1024 * 1024,
        env: { ...process.env, CODEBUDDY_MODEL: model },
      });
      ok = true; how = attempt.how;
      break;
    } catch (e) {
      err = `${String(e.message).slice(0, 300)} | stdout tail: ${String(e.stdout || '').slice(-300)}`;
      console.log(`codebuddy ${model} [${attempt.how}] FAILED: ${String(e.message).slice(0, 150)}`);
    }
  }

  // Locate the HTML: written index.html, else first fenced block in stdout.
  const htmlPath = path.join(dir, 'index.html');
  if (ok && !fs.existsSync(htmlPath)) {
    const m = out.match(/```(?:html)?\s*([\s\S]*?)```/);
    if (m && /<html|<!DOCTYPE/i.test(m[1])) {
      fs.writeFileSync(htmlPath, m[1]);
      how += ' +html-from-stdout';
    }
  }

  let status = 'FAIL';
  if (fs.existsSync(htmlPath)) {
    const h = fs.readFileSync(htmlPath, 'utf8');
    status = (h.length >= 400 && /<html|<!DOCTYPE/i.test(h)) ? `OK ${h.length}B` : `NOT HTML (${h.length}B)`;
  }
  fs.writeFileSync(path.join(dir, 'GEN.json'), JSON.stringify({ model, how, ms: Date.now() - t0, status, err: err.slice(0, 600) }, null, 2));
  report.push({ model, dirName, status, how, ms: Date.now() - t0 });
  console.log(`codebuddy ${model}: ${status} via ${how} (${Date.now() - t0}ms)`);
}

fs.writeFileSync('forge-codebuddy-gen-report.json', JSON.stringify({ cli: version, excludedByOwner: 'deepseek-v4.1-flash (free this month)', report }, null, 2));

// Drop failed/empty entries so the forge field stays clean; the report keeps the evidence.
for (const r of report) {
  if (!r.status.startsWith('OK')) fs.rmSync(path.join(STAGING, r.dirName), { recursive: true, force: true });
}
console.log('staging field:', fs.existsSync(STAGING) ? fs.readdirSync(STAGING).join(', ') : '(empty)');
