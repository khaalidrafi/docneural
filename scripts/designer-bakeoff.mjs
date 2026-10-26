// designer-bakeoff.mjs — v2 MULTI-LANE (CI edition).
// Owner order 2026-10-26 16:03: "we have a LOT of options in CANDIDATES.org,
// hire again!!!" -> the blind bake-off runs in GitHub Actions with OWNER-KEYS
// lanes; keys live ONLY in Actions secrets and never touch this repo, the
// runner logs (GitHub masks), or any artifact text.
//
// Protocol (blind, fixed rubric, max 9 pts — see header of v1 in git history
// and agent-team/bench/2026-10-26/ for the incumbent baseline 5.5/9):
//   task A: planted-defect screenshot (5 known defects, 3 decoys) — committed
//           input, IDENTICAL to the incumbent baseline run for comparability.
//   task B: deployed-shot critique (home + graph) — committed inputs.
//   blind codes A..N assigned by shuffle; scoring reads ONLY the code files;
//   KEY.json is opened strictly after scores are filed.
//
// Lane law compliance (CANDIDATES.org): opencode zen is client_only -> skipped;
// cline is RE-ARMED (Owner fiat 2026-10-26); gmi/antling/zai/gemini are
// OWNER-KEYS lanes with documented endpoints.
//
// Usage (in Actions): node scripts/designer-bakeoff.mjs
// Outputs: bench-out/{CODE}-A.txt, {CODE}-B.txt, KEY.json, RESULTS.json

import fs from 'node:fs';
import path from 'node:path';

const OUT = 'bench-out';
const IN = 'scripts/bakeoff-inputs';
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------- lanes
const LANES = [
  {
    lane: 'zai',
    baseURL: 'https://api.z.ai/api/paas/v4',
    keyEnv: 'ZAI_API_KEY',
    prefer: ['glm-4.6v-flash', 'glm-4.5v', 'glm-4.5v-flash'],
    regex: /vl/i,
    extraBody: { thinking: { type: 'disabled' } }, // zai-only flag, others tolerate-less
  },
  {
    lane: 'gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    keyEnv: 'GEMINI_API_KEY',
    prefer: ['gemini-2.5-flash', 'gemini-2.0-flash'],
    regex: /flash/i,
  },
  {
    lane: 'antling',
    baseURL: 'https://api.ant-ling.com/v1',
    keyEnv: 'ANTLING_API_KEY',
    prefer: ['Ling-3.0-flash-VL'],
    regex: /vl/i,
  },
  {
    lane: 'gmi',
    baseURL: 'https://api.gmi-serving.com/v1',
    keyEnv: 'GMI_API_KEY',
    prefer: ['nvidia/nemotron-3.5-super-vl'],
    regex: /vl/i,
  },
  {
    lane: 'cline',
    baseURL: 'https://api.cline.bot/api/v1',
    keyEnv: 'CLINE_API_KEY',
    prefer: ['nvidia/nemotron-3.5-super-vl:free', 'inclusionai/ling-3.0-flash-vl', 'moondream/moondream3.1-9b-a2b'],
    regex: /nemotron.*vl|moondream|ling.*vl/i,
  },
];

async function resolveModel(lane) {
  const key = process.env[lane.keyEnv];
  if (!key) return { model: null, why: 'no key in secrets' };
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };
  let ids = null;
  try {
    const res = await fetch(`${lane.baseURL}/models`, { headers, signal: AbortSignal.timeout(30000) });
    if (res.ok) {
      const j = await res.json();
      ids = (j.data || j.models || []).map(m => m.id || m.name).filter(Boolean);
    }
  } catch { /* listing is optional */ }
  if (ids) {
    for (const p of lane.prefer) {
      const hit = ids.find(id => id === p || id.endsWith(`/${p}`));
      if (hit) return { model: hit, ids };
    }
    const reHit = ids.find(id => lane.regex.test(id));
    if (reHit) return { model: reHit, ids };
    return { model: null, why: `no vision-ish id in ${ids.length} listed`, ids };
  }
  return { model: lane.prefer[0], ids: null, guessed: true };
}

async function chat(lane, model, content) {
  const key = process.env[lane.keyEnv];
  const t0 = Date.now();
  const res = await fetch(`${lane.baseURL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content }], ...(lane.extraBody || {}) }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const j = await res.json();
  const text = j.choices?.[0]?.message?.content ?? '(no content)';
  return { text, ms: Date.now() - t0 };
}

// ---------------------------------------------------------------- prompts
const b64 = (p) => `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;

const promptA = `You are a senior UI design QA reviewer. This is a screenshot of a dark sci-fi/cyberpunk landing page (1280x800).

List EVERY visual DEFECT you can find. For each defect, exactly one line:
- WHAT is wrong (name the element/text) | WHERE (top/mid/bottom + which panel/row) | FIX (one concrete line: color in hex or size in px)

After the defect list, a section "INTENTIONAL": unusual-but-deliberate design elements you can see, one per line.
Do not invent defects; accuracy beats volume.`;

const promptB = `Design review of a deployed dark cyberpunk docs site. IMAGE 1 = home. IMAGE 2 = its org-roam graph view.
Rank the TOP 3 highest-impact visual fixes. For each: WHAT, WHERE, exact treatment (colors in hex, sizes in px). No preamble.`;

// ---------------------------------------------------------------- run
const letters = 'ABCDEFGHIJ';
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const resolved = [];
for (const lane of LANES) {
  const r = await resolveModel(lane);
  resolved.push({ lane: lane.lane, ...r, keyEnv: lane.keyEnv });
  console.log(`lane ${lane.lane}: model=${r.model ?? '(none)'} ${r.why ?? ''}${r.guessed ? ' (guess, no listing)' : ''}`);
}

const runnable = resolved.filter(r => r.model);
const field = shuffle(runnable);
const key = {};
const results = [];

for (let i = 0; i < field.length; i++) {
  const code = letters[i];
  const spec = field[i];
  const lane = LANES.find(l => l.lane === spec.lane);
  key[code] = `${spec.lane}:${spec.model}`;
  console.log(`candidate ${code}: running...`);
  const rec = { code, lane: spec.lane, model: spec.model };
  try {
    const A = await chat(lane, spec.model, [
      { type: 'image_url', image_url: { url: b64(path.join(IN, 'planted-shot.png')) } },
      { type: 'text', text: promptA },
    ]);
    fs.writeFileSync(path.join(OUT, `${code}-A.txt`), `${A.text}\n\n[latency=${A.ms}ms]\n`);
    rec.aMs = A.ms;
    const B = await chat(lane, spec.model, [
      { type: 'image_url', image_url: { url: b64(path.join(IN, 'home-after.png')) } },
      { type: 'image_url', image_url: { url: b64(path.join(IN, 'graph-after.png')) } },
      { type: 'text', text: promptB },
    ]);
    fs.writeFileSync(path.join(OUT, `${code}-B.txt`), `${B.text}\n\n[latency=${B.ms}ms]\n`);
    rec.bMs = B.ms;
    rec.ok = true;
    console.log(`candidate ${code}: A=${A.ms}ms B=${B.ms}ms ok`);
  } catch (e) {
    rec.ok = false;
    rec.error = String(e.message).slice(0, 220);
    console.log(`candidate ${code}: FAILED ${rec.error}`);
  }
  results.push(rec);
}

for (const r of resolved.filter(r => !r.model)) {
  results.push({ code: '-', lane: r.lane, model: null, ok: false, error: r.why ?? 'unresolved' });
}

fs.writeFileSync(path.join(OUT, 'KEY.json'), JSON.stringify(key, null, 2));
fs.writeFileSync(path.join(OUT, 'RESULTS.json'), JSON.stringify(results, null, 2));
console.log('done. codes:', Object.keys(key).join(','), '| open KEY.json only AFTER scores are filed');
