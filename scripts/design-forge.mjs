// design-forge.mjs — DESIGN bake-off stage 2: HANDS, NOT EYES.
// Owner challenge 2026-10-26 (~16:31): "Did you read benchmark scores, trusted
// reviews and critically judge based on that? Designing means to be able
// develop creative, cool, stunning designs for websites!!"
//
// Stage-1 bake-off (designer-bakeoff.mjs) measured DEFECT-SPOTTING (vision QA).
// This harness measures DESIGN CREATION — the actual job of a Web Designer:
//   1. GENERATION : every lane receives the IDENTICAL brief (scripts/forge-brief.md)
//                   and must BUILD a complete single-file HTML page. No eyes needed.
//   2. RENDER     : Chromium (playwright) renders each entry: desktop 1440x900
//                   fullPage + mobile 390x844 fullPage; console/page errors captured.
//   3. OBJECTIVE  : 0-9 automated score — render stability (2), no horizontal
//                   overflow desktop+mobile (2), WCAG AA body-text contrast (2),
//                   required sections present (2), craft signal: real <style>
//                   budget + motion (1). Zero opinions involved.
//   4. PEER BLIND : every vision-capable lane judges every OTHER lane's desktop
//                   render (blind codes, shuffled with recorded seed): aesthetics
//                   /3, originality /2, spec /2, craft /2 -> JSON only.
//   5. COMPOSITE  : FINAL = 0.4*objective + 0.6*peerAvg (both /9). The gallery
//                   then goes to the OWNER — final vision gate (DELEGATION LAW).
//
// The incumbent (glm-5v-turbo) competes via scripts/forge-staging/ entries
// generated sandbox-side through the sealed gateway; CI treats staged entries
// identically (its identity stays in the local key file until scoring closes).
//
// Usage (Actions): node scripts/design-forge.mjs
// Outputs: forge-out/<CODE>/{index.html,desktop.png,mobile.png,objective.json,peers.json}
//          forge-out/{KEY.json,RESULTS.json,SCORES.json,GALLERY.md}

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const OUT = 'forge-out';
const STAGING = 'scripts/forge-staging';
fs.mkdirSync(OUT, { recursive: true });
const BRIEF = fs.readFileSync('scripts/forge-brief.md', 'utf8');

// ---------------------------------------------------------------- lanes
const LANES = [
  {
    lane: 'antling',
    baseURL: 'https://api.ant-ling.com/v1',
    keyEnv: 'ANTLING_API_KEY',
    prefer: ['Ling-3.0-flash-VL'],
    regex: /ling/i,
  },
  {
    lane: 'gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    keyEnv: 'GEMINI_API_KEY',
    prefer: ['gemini-2.5-flash', 'gemini-2.0-flash'],
    regex: /flash/i,
  },
  {
    lane: 'zai',
    baseURL: 'https://api.z.ai/api/paas/v4',
    keyEnv: 'ZAI_API_KEY',
    prefer: ['glm-4.6', 'glm-4.5-air', 'glm-4.5'],
    regex: /glm/i,
  },
  {
    lane: 'gmi',
    baseURL: 'https://api.gmi-serving.com/v1',
    keyEnv: 'GMI_API_KEY',
    prefer: ['nvidia/nemotron-3.5-super-vl'],
    regex: /nemotron/i,
  },
  {
    lane: 'cline',
    baseURL: 'https://api.cline.bot/api/v1',
    keyEnv: 'CLINE_API_KEY',
    prefer: ['nvidia/nemotron-3.5-super-vl:free', 'inclusionai/ling-3.0-flash-vl'],
    regex: /nemotron|ling/i,
  },
];

// vision-capable lanes may also serve as PEER JUDGES (judges never score
// their own entry)
const VISION_JUDGES = new Set(['antling', 'gemini', 'gmi', 'cline']);

async function resolveModel(l) {
  const key = process.env[l.keyEnv];
  if (!key) return { model: null, why: 'no key in secrets' };
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };
  let ids = null;
  try {
    const res = await fetch(`${l.baseURL}/models`, { headers, signal: AbortSignal.timeout(30000) });
    if (res.ok) {
      const j = await res.json();
      ids = (j.data || j.models || []).map(m => m.id || m.name).filter(Boolean);
    }
  } catch { /* listing optional */ }
  if (ids) {
    for (const p of l.prefer) {
      const hit = ids.find(id => id === p || id.endsWith(`/${p}`));
      if (hit) return { model: hit, ids };
    }
    const reHit = ids.find(id => l.regex.test(id));
    if (reHit) return { model: reHit, ids };
    return { model: null, why: `no usable id in ${ids.length} listed`, ids };
  }
  return { model: l.prefer[0], ids: null, guessed: true };
}

async function gen(l, model) {
  const key = process.env[l.keyEnv];
  const call = async (maxTokens) => {
    const t0 = Date.now();
    const res = await fetch(`${l.baseURL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: BRIEF }],
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(300000),
    });
    if (!res.ok) {
      const body = (await res.text()).slice(0, 200);
      const e = new Error(`HTTP ${res.status}: ${body}`);
      e.status = res.status;
      e.body = body;
      throw e;
    }
    const j = await res.json();
    return {
      text: j.choices?.[0]?.message?.content ?? '',
      finish: j.choices?.[0]?.finish_reason ?? '?',
      ms: Date.now() - t0,
    };
  };
  try {
    return await call(16384);
  } catch (e) {
    if (e.status === 400) return await call(8192); // some lanes cap lower
    throw e;
  }
}

const stripFences = (t) => {
  let s = String(t).trim();
  s = s.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/i, '');
  const i = s.indexOf('<!DOCTYPE');
  const j = s.indexOf('<html');
  const k = i >= 0 ? i : j;
  if (k > 0) s = s.slice(k);
  return s.trim();
};

// ---------------------------------------------------------------- shuffle
const mulberry32 = (seed) => () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const SEED = Number(process.env.FORGE_SEED || 20261027);
const shuffle = (arr) => {
  const rnd = mulberry32(SEED);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---------------------------------------------------------------- 1+2 field
const entries = [];
// FORGE_STAGED_ONLY=1 — skip API generation entirely (staged entries only);
// peer judging still runs. Used by forge-codebuddy (paid-credit rounds):
// sealed API lanes contribute JUDGING, not generation.
const STAGED_ONLY = process.env.FORGE_STAGED_ONLY === '1';
if (STAGED_ONLY) console.log('FORGE_STAGED_ONLY=1 — API generation skipped (staged entries + judges only)');
for (const l of STAGED_ONLY ? [] : LANES) {
  const r = await resolveModel(l);
  console.log(`lane ${l.lane}: model=${r.model ?? '(none)'} ${r.why ?? ''}${r.guessed ? ' (guess)' : ''}`);
  if (!r.model) { entries.push({ origin: l.lane, model: null, ok: false, why: r.why }); continue; }
  process.stdout.write(`forge ${l.lane}:${r.model} generating... `);
  try {
    const g = await gen(l, r.model);
    const html = stripFences(g.text);
    if (html.length < 400 || !/<html|<!DOCTYPE/i.test(html)) {
      entries.push({ origin: l.lane, model: r.model, ok: false, why: `output not HTML (${html.length}B, finish=${g.finish})` });
      console.log('NOT HTML');
      continue;
    }
    entries.push({ origin: l.lane, model: r.model, ok: true, html, genMs: g.ms, finish: g.finish });
    console.log(`ok ${html.length}B ${g.ms}ms finish=${g.finish}`);
  } catch (e) {
    entries.push({ origin: l.lane, model: r.model, ok: false, why: String(e.message).slice(0, 200) });
    console.log(`FAILED ${String(e.message).slice(0, 120)}`);
  }
}

// staged entries (sandbox-generated via sealed gateway, e.g. the incumbent)
if (fs.existsSync(STAGING)) {
  for (const d of fs.readdirSync(STAGING)) {
    const p = path.join(STAGING, d, 'index.html');
    if (d.startsWith('.') || !fs.existsSync(p)) continue;
    entries.push({ origin: `staged:${d}`, model: 'sandbox-gateway', ok: true, html: fs.readFileSync(p, 'utf8'), genMs: null, finish: 'staged' });
    console.log(`staged entry picked up: ${d}`);
  }
}

const runnable = entries.filter(e => e.ok);
const field = shuffle(runnable);
const key = {};
field.forEach((e, i) => { e.code = 'ABCDEFGHIJ'[i]; key[e.code] = e.origin; });
console.log(`field: ${field.map(e => e.code).join(', ')} (seed ${SEED})`);

// ---------------------------------------------------------------- 3 render+objective
const browser = await chromium.launch();
const contrastOf = (rgb1, rgb2) => {
  const lum = ([r, g, b]) => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const [a, b] = [lum(rgb1), lum(rgb2)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
};
const parseColor = (s) => {
  const m = s.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
};

const objectiveResults = {};
for (const e of field) {
  const dir = path.join(OUT, e.code);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), e.html);
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', err => errors.push(`pageerror: ${String(err).slice(0, 120)}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 120)}`); });
  const obj = { stability: 0, overflow: 0, contrast: 0, presence: 0, craft: 0 };
  try {
    await page.goto(`file://${path.resolve(dir, 'index.html')}`, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(2500); // let animations settle
    await page.screenshot({ path: path.join(dir, 'desktop.png'), fullPage: true });

    // overflow @1440
    const ovD = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

    // contrast sample (desktop)
    const samples = await page.evaluate(() => {
      const out = [];
      const bgOf = (el) => {
        let n = el;
        while (n && n !== document.documentElement) {
          const c = getComputedStyle(n).backgroundColor;
          if (c && !c.includes('0, 0, 0, 0') && !c.endsWith(', 0)')) return c;
          n = n.parentElement;
        }
        return 'rgb(10, 14, 22)';
      };
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
    const ratios = samples.map(s => {
      const c = parseColor(s.color); const b = parseColor(s.bg);
      if (!c || !b) return null;
      return contrastOf(c.slice(0, 3), b.slice(0, 3));
    }).filter(r => r !== null);
    const minRatio = ratios.length ? Math.min(...ratios) : 0;

    // mobile pass
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    const ovM = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    await page.screenshot({ path: path.join(dir, 'mobile.png'), fullPage: true });

    const has = async (sel) => (await page.$(sel)) !== null;
    const bodyTxt = await page.evaluate(() => document.body.innerText || '');
    const presence = [
      await has('nav, header'),
      await has('h1'),
      /1[,.]?392/.test(bodyTxt),
      /30[,.]?400/.test(bodyTxt),
      /304/.test(bodyTxt),
      await has('canvas, .graph, [data-graph], #graph'),
    ].filter(Boolean).length;

    const styleLen = (e.html.match(/<style[\s\S]*?<\/style>/gi) || []).join('').length;
    const hasMotion = /@keyframes|transition\s*:|animation\s*:/.test(e.html);

    obj.stability = errors.length === 0 ? 2 : errors.length <= 2 ? 1 : 0;
    obj.overflow = ovD && ovM ? 2 : (ovD || ovM) ? 1 : 0;
    obj.contrast = minRatio >= 4.5 ? 2 : minRatio >= 3.5 ? 1 : 0;
    obj.presence = Math.round((presence / 6) * 20) / 10;
    obj.craft = styleLen >= 3000 && hasMotion ? 1 : 0;
    objectiveResults[e.code] = {
      ...obj,
      total: Math.round((obj.stability + obj.overflow + obj.contrast + obj.presence + obj.craft) * 10) / 10,
      detail: { errors: errors.slice(0, 5), ovD, ovM, minContrast: Math.round(minRatio * 100) / 100, presence, styleLen, hasMotion },
    };
  } catch (err) {
    objectiveResults[e.code] = { stability: 0, overflow: 0, contrast: 0, presence: 0, craft: 0, total: 0, error: String(err.message).slice(0, 200) };
  }
  await page.close();
  console.log(`render+objective ${e.code} (${e.origin}): ${objectiveResults[e.code].total}/9`);
}
await browser.close();

// ---------------------------------------------------------------- 4 blind peer review
const RUBRIC = `You are a JUDGE in a blind web-design bake-off. This screenshot is one candidate's rendered design for a dark cyberpunk docs-site homepage. Judge ONLY what you see, strictly:
- aesthetics 0-3: is it STUNNING? composition, color discipline, typography, wow factor
- originality 0-2: creative and memorable vs generic template feel
- spec 0-2: fits the cyberpunk brief (dark canvas, cyan/magenta/amber accents, mono+display fonts, nav/hero/stats/graph/cards/footer present)
- craft 0-2: spacing rhythm, alignment, detail quality; note broken layouts with low scores
Respond with ONLY this JSON, no other text:
{"aesthetics":0,"originality":0,"spec":0,"craft":0,"oneLine":"one-sentence verdict"}`;

const judgeLaneSpecs = [];
for (const l of LANES) {
  if (!VISION_JUDGES.has(l.lane)) continue;
  const r = await resolveModel(l);
  if (r.model) judgeLaneSpecs.push({ lane: l.lane, model: r.model, spec: l });
}
console.log(`peer judges: ${judgeLaneSpecs.map(j => j.lane).join(', ') || '(none)'}`);

const peerScores = {}; // code -> [{judge, ...}]
for (const e of field) peerScores[e.code] = [];

for (const j of judgeLaneSpecs) {
  for (const e of field) {
    if (e.origin === j.lane || e.origin === `staged:${j.lane}`) continue; // never judge own entry
    const img = path.join(OUT, e.code, 'desktop.png');
    if (!fs.existsSync(img)) continue;
    try {
      const t0 = Date.now();
      const res = await fetch(`${j.spec.baseURL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env[j.spec.keyEnv]}` },
        body: JSON.stringify({
          model: j.model,
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:image/png;base64,${fs.readFileSync(img).toString('base64')}` } },
              { type: 'text', text: RUBRIC },
            ],
          }],
          max_tokens: 1500, // 600 truncated judge JSON mid-key (run 40367431379) — a4ff3fd fix ported
        }),
        signal: AbortSignal.timeout(120000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const txt = (await res.json()).choices?.[0]?.message?.content ?? '';
      const m = txt.match(/\{[\s\S]*\}/);
      const parsed = m ? JSON.parse(m[0]) : null;
      if (!parsed || typeof parsed.aesthetics !== 'number') throw new Error('unparseable review');
      const sum = (parsed.aesthetics || 0) + (parsed.originality || 0) + (parsed.spec || 0) + (parsed.craft || 0);
      peerScores[e.code].push({ judge: j.lane, ...parsed, sum, ms: Date.now() - t0 });
      console.log(`peer ${j.lane} -> ${e.code}: ${sum}/9`);
    } catch (err) {
      console.log(`peer ${j.lane} -> ${e.code}: FAILED ${String(err.message).slice(0, 100)}`);
    }
  }
}
for (const e of field) fs.writeFileSync(path.join(OUT, e.code, 'peers.json'), JSON.stringify(peerScores[e.code], null, 2));

// ---------------------------------------------------------------- 5 composite
const scores = field.map(e => {
  const o = objectiveResults[e.code]?.total ?? 0;
  const peers = peerScores[e.code];
  const pAvg = peers.length ? peers.reduce((s, p) => s + p.sum, 0) / peers.length : null;
  const final = pAvg === null ? o : Math.round((0.4 * o + 0.6 * pAvg) * 10) / 10;
  return {
    code: e.code,
    origin: e.origin,
    model: e.model,
    objective: o,
    peerAvg: pAvg === null ? null : Math.round(pAvg * 10) / 10,
    peerCount: peers.length,
    final,
    finish: e.finish,
    genMs: e.genMs,
    oneLiners: peers.map(p => p.oneLine).filter(Boolean).slice(0, 4),
  };
}).sort((a, b) => b.final - a.final);

fs.writeFileSync(path.join(OUT, 'KEY.json'), JSON.stringify({ seed: SEED, key }, null, 2));
fs.writeFileSync(path.join(OUT, 'SCORES.json'), JSON.stringify({ rubric: 'FINAL = 0.4*objective(9) + 0.6*peerAvg(9); objective: stability2+overflow2+contrast2+presence2+craft1; peer: aesthetics3+originality2+spec2+craft2', scores }, null, 2));
fs.writeFileSync(path.join(OUT, 'RESULTS.json'), JSON.stringify({ field: entries.map(({ html, ...r }) => r), objectiveResults }, null, 2));

const rows = scores.map(s => `| ${s.code} | ${s.origin}${s.model ? ` (${s.model})` : ''} | obj ${s.objective}/9 | peer ${s.peerAvg ?? '—'}/9 (n=${s.peerCount}) | **${s.final}/9** |`).join('\n');
fs.writeFileSync(path.join(OUT, 'GALLERY.md'), `# Design forge — blind gallery (seed ${SEED})\n\n| code | entry | objective | peer | FINAL |\n|------|-------|-----------|------|-------|\n${rows}\n`);
console.log('FORGE DONE. Ranking:');
for (const s of scores) console.log(`  ${s.code} ${s.origin}: FINAL ${s.final}/9 (obj ${s.objective}, peer ${s.peerAvg})`);
