// forge-judge-kimi.mjs — sandbox re-run of the REGISTERED forge protocol for
// the kimi-k3 entry vs the round-1 field (design-forge.mjs semantics kept:
// same objective checks, same RUBRIC bytes, same composite math, same
// mulberry32 seed machinery). Two deltas only, both documented:
//  (1) CONCURRENCY: the 4 vision judges run in parallel (sequential per
//      judge) so the whole session fits ONE 600s tool window — the sandbox
//      reaper kills background processes (CANDIDATES.org:222), CI is
//      unavailable for the paid-credential lane (6 runs, 0 credits, filed).
//  (2) POOL: staged pool = entry-kimi-k3 (THE ONE paid kimi-k3 generation,
//      cline gateway) + the four round-1 pages copied verbatim from
//      agent-team/bench/2026-10-27-forge/ with their TRUE origins so
//      "judges never score their own entry" maps correctly.
// Judge cost note: cline judge prefers :free ids; antling/gemini/gmi =
// standard forge judging cost accepted in round 1.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = '/home/z/my-project/docneural';
const OUT = path.join(ROOT, 'forge-out-kimi');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const R1 = path.join(ROOT, 'agent-team/bench/2026-10-27-forge');
const STAGE = '/home/z/my-project/kimi-burn-or';
const POOL = [
  { dir: `${STAGE}`, origin: 'staged:entry-kimi-k3', model: 'moonshotai/kimi-k3' },
  { dir: `${R1}/A`, origin: 'antling', model: 'Ling-3.0-flash-VL' },
  { dir: `${R1}/B`, origin: 'staged:entry-2', model: 'sandbox-gateway' },
  { dir: `${R1}/C`, origin: 'staged:entry-1', model: 'sandbox-gateway (glm-5v-turbo incumbent, round-1 crown)' },
  { dir: `${R1}/D`, origin: 'gemini', model: 'gemini-2.5-flash' },
].filter(e => { const p = path.join(e.dir, 'index.html'); return fs.existsSync(p) && fs.statSync(p).size >= 400; });

const mulberry32 = (seed) => () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const SEED = Number(process.env.FORGE_SEED || 20261028);
const shuffle = (arr) => {
  const rnd = mulberry32(SEED); const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const field = shuffle(POOL);
const key = {}; field.forEach((e, i) => { e.code = 'ABCDE'[i]; key[e.code] = e.origin; });
console.log(`field(${SEED}): ${field.map(e => e.code).join(', ')}`);

// ---- render + objective (verbatim logic from design-forge.mjs) ----
const contrastOf = (rgb1, rgb2) => {
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const [a, b] = [lum(rgb1), lum(rgb2)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
};
const parseColor = (s) => {
  const m = s.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
};
const browser = await chromium.launch();
const objectiveResults = {};
for (const e of field) {
  const dir = path.join(OUT, e.code);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), fs.readFileSync(path.join(e.dir, 'index.html'), 'utf8'));
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', err => errors.push(`pageerror: ${String(err).slice(0, 120)}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 120)}`); });
  const obj = { stability: 0, overflow: 0, contrast: 0, presence: 0, craft: 0 };
  try {
    await page.goto(`file://${path.resolve(dir, 'index.html')}`, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(dir, 'desktop.png'), fullPage: true });
    const ovD = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    const samples = await page.evaluate(() => {
      const out = [];
      const bgOf = (el) => { let n = el; while (n && n !== document.documentElement) { const c = getComputedStyle(n).backgroundColor; if (c && !c.includes('0, 0, 0, 0') && !c.endsWith(', 0)')) return c; n = n.parentElement; } return 'rgb(10, 14, 22)'; };
      for (const sel of ['p', 'li', 'td', '.stat-label', 'footer']) {
        document.querySelectorAll(sel).forEach(el => {
          if (out.length >= 40) return;
          const t = (el.textContent || '').trim();
          if (t.length < 3) return;
          out.push({ sel, color: getComputedStyle(el).color, bg: bgOf(el) });
        });
      }
      return out;
    });
    const ratios = samples.map(s => { const c = parseColor(s.color); const b = parseColor(s.bg); if (!c || !b) return null; return contrastOf(c.slice(0, 3), b.slice(0, 3)); }).filter(r => r !== null);
    const minRatio = ratios.length ? Math.min(...ratios) : 0;
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    const ovM = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    await page.screenshot({ path: path.join(dir, 'mobile.png'), fullPage: true });
    const has = async (sel) => (await page.$(sel)) !== null;
    const bodyTxt = await page.evaluate(() => document.body.innerText || '');
    const presence = [
      await has('nav, header'), await has('h1'),
      /1[,.]?392/.test(bodyTxt), /30[,.]?400/.test(bodyTxt), /304/.test(bodyTxt),
      await has('canvas, .graph, [data-graph], #graph'),
    ].filter(Boolean).length;
    const ehtml = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    const styleLen = (ehtml.match(/<style[\s\S]*?<\/style>/gi) || []).join('').length;
    const hasMotion = /@keyframes|transition\s*:|animation\s*:/.test(ehtml);
    obj.stability = errors.length === 0 ? 2 : errors.length <= 2 ? 1 : 0;
    obj.overflow = ovD && ovM ? 2 : (ovD || ovM) ? 1 : 0;
    obj.contrast = minRatio >= 4.5 ? 2 : minRatio >= 3.5 ? 1 : 0;
    obj.presence = Math.round((presence / 6) * 20) / 10;
    obj.craft = styleLen >= 3000 && hasMotion ? 1 : 0;
    objectiveResults[e.code] = { ...obj, total: Math.round((obj.stability + obj.overflow + obj.contrast + obj.presence + obj.craft) * 10) / 10, detail: { errors: errors.slice(0, 5), ovD, ovM, minContrast: Math.round(minRatio * 100) / 100, presence, styleLen, hasMotion } };
  } catch (err) {
    objectiveResults[e.code] = { stability: 0, overflow: 0, contrast: 0, presence: 0, craft: 0, total: 0, error: String(err.message).slice(0, 200) };
  }
  await page.close();
  console.log(`render+objective ${e.code} (${e.origin}): ${objectiveResults[e.code].total}/9`);
}
await browser.close();

// ---- blind peer review (RUBRIC verbatim) ----
const RUBRIC = `You are a JUDGE in a blind web-design bake-off. This screenshot is one candidate's rendered design for a dark cyberpunk docs-site homepage. Judge ONLY what you see, strictly:
- aesthetics 0-3: is it STUNNING? composition, color discipline, typography, wow factor
- originality 0-2: creative and memorable vs generic template feel
- spec 0-2: fits the cyberpunk brief (dark canvas, cyan/magenta/amber accents, mono+display fonts, nav/hero/stats/graph/cards/footer present)
- craft 0-2: spacing rhythm, alignment, detail quality; note broken layouts with low scores
Respond with ONLY this JSON, no other text:
{"aesthetics":0,"originality":0,"spec":0,"craft":0,"oneLine":"one-sentence verdict"}`;

const LANES = [
  { lane: 'antling', baseURL: 'https://api.ant-ling.com/v1', keyEnv: 'ANTLING_API_KEY', prefer: ['Ling-3.0-flash-VL'], regex: /ling/i },
  { lane: 'gemini', baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai', keyEnv: 'GEMINI_API_KEY', prefer: ['gemini-2.5-flash', 'gemini-2.0-flash'], regex: /flash/i },
  { lane: 'gmi', baseURL: 'https://api.gmi-serving.com/v1', keyEnv: 'GMI_API_KEY', prefer: ['nvidia/nemotron-3.5-super-vl'], regex: /nemotron/i },
  { lane: 'cline', baseURL: 'https://api.cline.bot/api/v1', keyEnv: 'CLINE_API_KEY', prefer: ['nvidia/nemotron-3.5-super-vl:free', 'inclusionai/ling-3.0-flash-vl'], regex: /nemotron|ling/i },
];
// resolve judge model per lane (same logic as design-forge resolveModel)
const judgeLaneSpecs = [];
for (const l of LANES) {
  const k = process.env[l.keyEnv];
  if (!k) { console.log(`judge ${l.lane}: NO KEY — skipped`); continue; }
  try {
    let r = await fetch(`${l.baseURL}/models`, { headers: { Authorization: `Bearer ${k}` }, signal: AbortSignal.timeout(30000) });
    if (!r.ok && l.lane === 'gemini') r = await fetch(`${l.baseURL}/models`, { headers: { 'x-goog-api-key': k }, signal: AbortSignal.timeout(30000) }); // gemini 400 on Bearer /models retry: key-header auth shape
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const ids = (j.data || j.models || []).map(m => m.id || m.name).filter(Boolean);
    let model = null;
    for (const p of l.prefer) { const hit = ids.find(id => id === p || id.endsWith(`/${p}`)); if (hit) { model = hit; break; } }
    if (!model) model = ids.find(id => l.regex.test(id)) || null;
    if (model) judgeLaneSpecs.push({ lane: l.lane, model, key: k, baseURL: l.baseURL });
    console.log(`judge ${l.lane}: ${model ?? `no usable id in ${ids.length}`}`);
  } catch (e) { console.log(`judge ${l.lane}: resolve FAIL ${String(e).slice(0, 60)}`); }
}

const OWN = { antling: ['antling'], gemini: ['gemini'], gmi: [], cline: ['staged:entry-kimi-k3'] }; // never judge own origin
const peerScores = {}; for (const e of field) peerScores[e.code] = [];

await Promise.all(judgeLaneSpecs.map(async (j) => {
  for (const e of field) {
    if ((OWN[j.lane] || []).includes(e.origin)) { console.log(`peer ${j.lane} -> ${e.code}: SKIPPED (own origin ${e.origin})`); continue; }
    const img = path.join(OUT, e.code, 'desktop.png');
    if (!fs.existsSync(img)) continue;
    const t0 = Date.now();
    try {
      const res = await fetch(`${j.baseURL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${j.key}` },
        body: JSON.stringify({
          model: j.model,
          messages: [{ role: 'user', content: [
            { type: 'image_url', image_url: { url: `data:image/png;base64,${fs.readFileSync(img).toString('base64')}` } },
            { type: 'text', text: RUBRIC },
          ] }],
          max_tokens: 1500,
        }),
        signal: AbortSignal.timeout(120000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const txt = (await res.json()).choices?.[0]?.message?.content ?? '';
      const m = txt.match(/\{[\s\S]*\}/);
      const parsed = m ? JSON.parse(m[0]) : null;
      if (!parsed || typeof parsed.aesthetics !== 'number') throw new Error('unparseable review');
      const sum = (parsed.aesthetics || 0) + (parsed.originality || 0) + (parsed.spec || 0) + (parsed.craft || 0);
      peerScores[e.code].push({ judge: j.lane, model: j.model, ...parsed, sum, ms: Date.now() - t0 });
      console.log(`peer ${j.lane} -> ${e.code}: ${sum}/9`);
    } catch (err) {
      console.log(`peer ${j.lane} -> ${e.code}: FAILED ${String(err.message).slice(0, 100)}`);
    }
  }
}));
for (const e of field) fs.writeFileSync(path.join(OUT, e.code, 'peers.json'), JSON.stringify(peerScores[e.code], null, 2));

// ---- composite (pre-registered rule, verbatim) ----
const scores = field.map(e => {
  const o = objectiveResults[e.code]?.total ?? 0;
  const peers = peerScores[e.code];
  const pAvg = peers.length ? peers.reduce((s, p) => s + p.sum, 0) / peers.length : null;
  const final = pAvg === null ? o : Math.round((0.4 * o + 0.6 * pAvg) * 10) / 10;
  return { code: e.code, origin: e.origin, model: e.model, objective: o, peerAvg: pAvg === null ? null : Math.round(pAvg * 10) / 10, peerCount: peers.length, final, oneLiners: peers.map(p => p.oneLine).filter(Boolean).slice(0, 4) };
}).sort((a, b) => b.final - a.final);

fs.writeFileSync(path.join(OUT, 'KEY.json'), JSON.stringify({ seed: SEED, key }, null, 2));
fs.writeFileSync(path.join(OUT, 'SCORES.json'), JSON.stringify({ rule: 'PRE-REGISTERED: FINAL = 0.4*objective + 0.6*mean(all completed blind peer sums); tie-break = higher objective', scores }, null, 2));
fs.writeFileSync(path.join(OUT, 'RESULTS.json'), JSON.stringify({ objectiveResults }, null, 2));
console.log('=== LEADERBOARD ===');
for (const s of scores) console.log(`${s.code} (${s.origin}): FINAL ${s.final} = 0.4*${s.objective} + 0.6*${s.peerAvg} [${s.peerCount} peers]`);
