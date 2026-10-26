// forge-judge.mjs — judge-only completion pass for the DESIGN forge.
// Owner challenge 2026-10-26 17:16: "You decide! If you really read scores
// and judged, where is the benchmark score, source and judgment reasoning?"
// -> the C entry's 9.0 was objective-only (no independent judge completed).
// This pass fills the missing blind peer pairs from the COMMITTED renders
// (bench/2026-10-27-forge/<code>/desktop.png) so the crown rests on a
// COMPLETE matrix. Judges never score their own lane's entry and skip pairs
// already recorded (committed peers.json / peers-glmturbo.json).
//
// Usage (Actions): node scripts/forge-judge.mjs
// Outputs: forge-judge-out/<CODE>-<lane>.json

import fs from 'node:fs';
import path from 'node:path';

const BENCH = 'agent-team/bench/2026-10-27-forge';
const OUT = 'forge-judge-out';
fs.mkdirSync(OUT, { recursive: true });

const LANES = [
  { lane: 'antling', entry: 'A', baseURL: 'https://api.ant-ling.com/v1', keyEnv: 'ANTLING_API_KEY' },
  { lane: 'gemini', entry: 'D', baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai', keyEnv: 'GEMINI_API_KEY' },
  { lane: 'gmi', entry: null, baseURL: 'https://api.gmi-serving.com/v1', keyEnv: 'GMI_API_KEY' },
  { lane: 'cline', entry: null, baseURL: 'https://api.cline.bot/api/v1', keyEnv: 'CLINE_API_KEY' },
];
const CODES = ['A', 'B', 'C', 'D'];

// existing judge->code coverage from committed peer files
const existing = {}; // code -> Set(judge names)
for (const c of CODES) existing[c] = new Set();
for (const c of CODES) {
  for (const f of ['peers.json', 'peers-glmturbo.json']) {
    const p = path.join(BENCH, c, f);
    if (!fs.existsSync(p)) continue;
    try {
      const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
      for (const rec of (Array.isArray(arr) ? arr : [arr])) {
        if (rec && rec.judge && typeof rec.sum === 'number') existing[c].add(rec.judge);
      }
    } catch { /* ignore malformed */ }
  }
}
console.log('existing coverage:', Object.fromEntries(CODES.map(c => [c, [...existing[c]]])));

const RUBRIC = `You are a JUDGE in a blind web-design bake-off. This screenshot is one candidate's rendered design for a dark cyberpunk docs-site homepage. Judge ONLY what you see, strictly:
- aesthetics 0-3: is it STUNNING? composition, color discipline, typography, wow factor
- originality 0-2: creative and memorable vs generic template feel
- spec 0-2: fits the cyberpunk brief (dark canvas, cyan/magenta/amber accents, mono+display fonts, nav/hero/stats/graph/cards/footer present)
- craft 0-2: spacing rhythm, alignment, detail quality; note broken layouts with low scores
Respond with ONLY this JSON, no other text:
{"aesthetics":0,"originality":0,"spec":0,"craft":0,"oneLine":"one-sentence verdict"}`;

const resolveModel = async (l) => {
  const key = process.env[l.keyEnv];
  if (!key) return null;
  try {
    const res = await fetch(`${l.baseURL}/models`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(30000) });
    if (!res.ok) return null;
    const j = await res.json();
    const ids = (j.data || j.models || []).map(m => m.id || m.name).filter(Boolean);
    const prefer = { antling: 'Ling-3.0-flash-VL', gemini: 'gemini-2.5-flash', gmi: 'nemotron-3.5-super-vl', cline: 'nemotron-3.5-super-vl' }[l.lane];
    return ids.find(id => id === prefer || id.endsWith(`/${prefer}`) || id.includes(prefer)) ||
           ids.find(id => /vl|flash/i.test(id)) || null;
  } catch { return null; }
};

for (const l of LANES) {
  const model = await resolveModel(l);
  if (!model) { console.log(`judge ${l.lane}: no usable model, skip`); continue; }
  for (const c of CODES) {
    if (l.entry === c) { console.log(`judge ${l.lane} -> ${c}: own entry, skip`); continue; }
    if (existing[c].has(l.lane)) { console.log(`judge ${l.lane} -> ${c}: already scored, skip`); continue; }
    const img = path.join(BENCH, c, 'desktop.png');
    if (!fs.existsSync(img)) continue;
    try {
      const t0 = Date.now();
      const res = await fetch(`${l.baseURL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env[l.keyEnv]}` },
        body: JSON.stringify({
          model,
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:image/png;base64,${fs.readFileSync(img).toString('base64')}` } },
              { type: 'text', text: RUBRIC },
            ],
          }],
          max_tokens: 1500,
        }),
        signal: AbortSignal.timeout(120000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 100)}`);
      const txt = (await res.json()).choices?.[0]?.message?.content ?? '';
      let parsed = null;
      const cleaned = txt.replace(/```[a-z]*\s*/gi, '').replace(/```/g, '').trim();
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch { parsed = null; } }
      if (!parsed) {
        // tolerate truncation: pull the four numeric fields directly
        const num = (k) => {
          const mm = cleaned.match(new RegExp(`"${k}"\\s*:\\s*([0-9.]+)`));
          return mm ? Number(mm[1]) : null;
        };
        const a = num('aesthetics'), o = num('originality'), s2 = num('spec'), c2 = num('craft');
        if (a !== null && o !== null && s2 !== null && c2 !== null) {
          parsed = { aesthetics: a, originality: o, spec: s2, craft: c2 };
          const ol = cleaned.match(/"oneLine"\s*:\s*"([^"]{3,})/);
          if (ol) parsed.oneLine = ol[1];
        }
      }
      if (!parsed || typeof parsed.aesthetics !== 'number') throw new Error(`unparseable: ${txt.slice(0, 80)}`);
      parsed.sum = parsed.aesthetics + parsed.originality + parsed.spec + parsed.craft;
      parsed.judge = l.lane;
      parsed.model = model;
      parsed.ms = Date.now() - t0;
      fs.writeFileSync(path.join(OUT, `${c}-${l.lane}.json`), JSON.stringify(parsed, null, 2));
      console.log(`judge ${l.lane} -> ${c}: ${parsed.sum}/9 — ${parsed.oneLine ?? '(no one-liner)'}`);
    } catch (e) {
      console.log(`judge ${l.lane} -> ${c}: FAILED ${String(e.message).slice(0, 110)}`);
    }
  }
}
console.log('judge-only pass done');
