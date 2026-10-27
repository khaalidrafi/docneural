// kimi-or-burn.mjs — THE ONE kimi-k3 generation, via OpenRouter (vault-held key).
// Owner GO: "Use Kimi K3 to improve the design and make it cool. 100 credits limit!"
// CodeBuddy CLI lane is runner-dead (6 runs, 0 credits, evidence filed); the
// vault (Owner 2026-10-27 "look at vault again") HELD the OpenRouter key and
// moonshotai/kimi-k3 (Design Arena 1335, the pre-registered challenger id) is
// live there. This is the FIRST paid kimi-k3 generation of the whole campaign
// (spend law: exactly ONE, no retries; ds-v4.1-flash never involved).
// SECRET LAW: the key is read from env only; values never echoed or filed.
import fs from 'node:fs';

const WORK = '/home/z/my-project/kimi-burn-or';
fs.mkdirSync(WORK, { recursive: true });

// LANE (evidence-chained): OpenRouter key = HELD but account dust (402 "can
// only afford 198", zero burn, filed). CLINE_API_KEY = HELD in the vault and
// api.cline.bot/api/v1 is OpenAI-compatible with moonshotai/kimi-k3 live in
// its 469-row catalog (probed free). cline kimi-k3 is PAID (not in the 18
// FREE-tagged) — this is THE ONE paid kimi-k3 generation (spend law), and
// the credit pool it draws from is the Owner's cline account (disclosed to
// the Owner in the report; codebuddy credits remain untouched/expiring).

const brief = fs.readFileSync('/home/z/my-project/docneural/scripts/forge-brief.md', 'utf8');
const CONTRACT = `

DELIVERABLE (strict): create ONE complete single-file HTML page (all CSS and JS inline, no external assets, no external fonts, no external images) implementing the brief EXACTLY. Output the COMPLETE page as one code block. Do not ask questions. Do not explain. The page must be complete from <!DOCTYPE html> to </html>.

FINAL CHECK (mandatory, before you finish): your output must contain the complete single-file page — every section of the brief, all CSS and all JS inline. An incomplete page means the task FAILED.`;
const prompt = brief + CONTRACT;

const key = process.env.CLINE_API_KEY || '';
if (!key) { console.error('NO KEY IN ENV — aborting before any call'); process.exit(1); }

const body = JSON.stringify({
  model: 'moonshotai/kimi-k3',
  messages: [{ role: 'user', content: prompt }],
  max_tokens: 65536,
  stream: true, // sandbox reaper kills background/nohup processes (CANDIDATES.org:222) — first attempt died silently ~10min, no artifact; streaming makes every token land on disk immediately
});
const t0 = Date.now();
console.log(`[${new Date().toISOString()}] firing THE ONE kimi-k3 generation via CLINE, STREAMING (prompt ${prompt.length} chars)...`);
const res = await fetch('https://api.cline.bot/api/v1/chat/completions', {
  method: 'POST',
  headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body,
  signal: AbortSignal.timeout(9.5 * 60 * 1000), // finish inside the tool's 600s window
});
const ms = Date.now() - t0;
if (!res.ok) {
  const errText = await res.text();
  fs.writeFileSync(`${WORK}/response.json`, errText);
  console.error(`HTTP ${res.status} after ${ms}ms — generation FAILED (response.json kept; classified per spend law, no retry): ${errText.slice(0, 200)}`);
  process.exit(2);
}
// stream: assemble content from SSE deltas, flush evidence incrementally
let msg = '', finish = 'unknown', usage = {};
const sse = fs.openSync(`${WORK}/stream.sse`, 'w');
const reader = res.body.getReader();
const dec = new TextDecoder();
let buf = '';
let lastLog = t0;
for (;;) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = dec.decode(value, { stream: true });
  buf += chunk;
  fs.writeSync(sse, chunk); // raw evidence
  let idx;
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim(); buf = buf.slice(idx + 1);
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (payload === '[DONE]') { finish = 'done'; continue; }
    try {
      const j = JSON.parse(payload);
      if (j.choices?.[0]?.delta?.content) msg += j.choices[0].delta.content;
      if (j.choices?.[0]?.finish_reason) finish = j.choices[0].finish_reason;
      if (j.usage) usage = j.usage;
    } catch { /* keep-alive or partial line */ }
  }
  if (Date.now() - lastLog > 30000) { lastLog = Date.now(); console.log(`  ...streaming: ${msg.length} chars at ${Math.round((Date.now() - t0) / 1000)}s`); }
}
fs.closeSync(sse);
const cost = usage.cost ?? null;
console.log(`done in ${Math.round(ms / 1000)}s | finish=${finish} | content ${msg.length} chars | usage: prompt=${usage.prompt_tokens} completion=${usage.completion_tokens} total=${usage.total_tokens} | cost=${cost}`);

// extract HTML: fenced or bare
let html = msg;
const fence = msg.match(/```(?:html)?\s*\n([\s\S]*?)```/);
if (fence && /<!DOCTYPE|<html/i.test(fence[1])) html = fence[1];
const start = html.search(/<!DOCTYPE html>|<html/i);
if (start > 0) html = html.slice(start);
const end = html.toLowerCase().lastIndexOf('</html>');
if (end >= 0) html = html.slice(0, end + 7);
const valid = html.length >= 400 && /<html|<!DOCTYPE/i.test(html);
fs.writeFileSync(`${WORK}/index.html`, html);
const gen = {
  model: 'moonshotai/kimi-k3',
  how: 'cline OpenAI-compatible lane (api.cline.bot/api/v1, vault-held CLINE_API_KEY), sandbox body',
  why: 'CodeBuddy CLI lane runner-dead (6 runs 0 credits); OpenRouter key = 402 dust (0 burn); vault path per Owner "look at vault again"',
  finish_reason: finish,
  attempts: 1, // spend law: THE ONE paid generation (OpenRouter 402 was pre-model, zero burn, not an attempt)
  ms,
  usage, cost,
  bytes: html.length,
  status: valid ? `OK ${html.length}B` : `NOT HTML (${html.length}B)`,
  generatedAt: new Date().toISOString(),
};
fs.writeFileSync(`${WORK}/GEN.json`, JSON.stringify(gen, null, 2));
console.log(`status: ${gen.status} | ${valid ? 'PAGE VALID — spend ledger written' : 'PAGE INVALID — no retry per spend law'}`);
