// network-sweep.mjs — acceptance sweep for the 2026-10-31 network pass.
// Surfaces: home TOC (emacs/org), network view controls + lock + arrows,
// synapse card, bridges, rename, trail regression. dark/light x desktop/phone
// + WebGL-off. Zero console errors required.
import { chromium } from 'playwright';
import { preview } from 'vite';
import { writeFileSync } from 'node:fs';

const OUT = '/tmp/render';
const results = [];
const errors = [];
const ok = (name, cond, extra = '') => {
  results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
  return cond;
};

const server = await preview({ root: '/home/z/my-project/docneural-ui', preview: { port: 4199, strictPort: true } });
const browser = await chromium.launch();

async function newPage(opts = {}, tag2 = 'pass') {
  const TAG = tag2;
  let tag = tag2;
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...opts });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push('[' + tag + '] ' + m.text()); });
  page.on('pageerror', (e) => errors.push('[' + tag + '] pageerror: ' + (e.stack || e.message).slice(0, 300)));
  page.on('response', (r) => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ' ' + r.url()); });
  return { ctx, page };
}

// ---------- desktop dark: home + TOC ----------
{
  const { ctx, page } = await newPage({}, 'toc');
  await page.goto('http://localhost:4199/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // rename: status plate
  const plate = await page.locator('text=/NEURONS·.*SYNAPSES|NEURONS · /i').first();
  ok('status plate renamed', (await plate.count()) > 0 || (await page.locator('body', { hasText: 'NEURONS' }).count()) > 0);

  // TOC emacs: click the emacs manual tab if present, else contents already shows emacs
  const emacsTab = page.locator('[role="tab"]', { hasText: /emacs/i }).first();
  if (await emacsTab.count()) await emacsTab.click();
  await page.waitForTimeout(800);
  const tocRows = page.locator('[class*="toc"] summary, [class*="toc"] button');
  const emacsRowCount = await tocRows.count();
  ok('emacs TOC shows rows beyond lone Top', emacsRowCount >= 3, `${emacsRowCount} rows`);
  await page.screenshot({ path: `${OUT}/ns-toc-emacs.png` });

  // expand-all control present
  const expandAll = page.locator('button[aria-label*="expand" i], button[title*="expand" i]').first();
  ok('TOC expand-all control', (await expandAll.count()) > 0);

  // TOC org: flat list, no letter groups
  const orgTab = page.locator('[role="tab"]', { hasText: /org/i }).first();
  if (await orgTab.count()) await orgTab.click();
  await page.waitForTimeout(800);
  const bodyText = await page.locator('body').innerText();
  const letterGroups = /\nA\n|\nB\n|\nC\n/.test(bodyText) || (await page.locator('summary:text-is("A")').count()) > 0;
  ok('org TOC has no letter groups', !letterGroups);
  ok('org TOC flat badge', bodyText.includes('flat list'), '');
  await page.screenshot({ path: `${OUT}/ns-toc-org.png` });

  // TOC filter
  const tocFilter = page.locator('input[aria-label*="chapter" i], input[placeholder*="chapter" i], input[aria-label*="filter" i]').first();
  if (await tocFilter.count()) {
    await tocFilter.fill('export');
    await page.waitForTimeout(500);
    const hits = await page.locator('[class*="toc"] a, [class*="toc"] button').count();
    ok('TOC filter yields hits', hits > 0, `${hits} rows`);
  } else ok('TOC filter field', false, 'not found');
  await ctx.close();
}

// ---------- desktop dark: network view ----------
{
  const { ctx, page } = await newPage({}, 'network');
  await page.goto('http://localhost:4199/?mode=graph', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);

  // rename in status
  const bodyText = await page.locator('body').innerText();
  ok('network: no user-visible "graph" (except contract)', !/\bgraph\b/i.test(bodyText.replace(/graph\.json/g, '')), bodyText.match(/\bgraph\b/i)?.[0] ?? '');

  // controls stack
  const lockBtn = page.locator('button[aria-label*="lock" i]').first();
  ok('lock button', (await lockBtn.count()) > 0);
  const zoomIn = page.locator('button[aria-label*="zoom in" i], button[aria-label*="closer" i]').first();
  ok('zoom+ button', (await zoomIn.count()) > 0);
  const zoomOut = page.locator('button[aria-label*="zoom out" i], button[aria-label*="farther" i]').first();
  ok('zoom− button', (await zoomOut.count()) > 0);
  const fitBtn = page.locator('button[aria-label*="fit" i], button[aria-label*="reset" i]').first();
  ok('fit button', (await fitBtn.count()) > 0);

  // lock freezes: two canvas frames identical while locked
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (box && (await lockBtn.count())) {
    await page.waitForTimeout(6000); // let physics settle
    const shot = () => page.screenshot({ clip: box });
    await lockBtn.click();
    await page.waitForTimeout(400);
    const f1 = await shot();
    await page.waitForTimeout(900);
    const f2 = await shot();
    ok('lock freezes canvas', f1.equals(f2));
    await lockBtn.click(); // unlock
    await page.waitForTimeout(300);
  } else ok('lock freeze check', false, 'no canvas/lock');

  // zoom moves camera: canvas pixels change after zoom+
  if (box && (await zoomIn.count())) {
    await page.waitForTimeout(4500);
    const a = await page.screenshot({ clip: box });
    await zoomIn.click();
    await page.waitForTimeout(500);
    const b = await page.screenshot({ clip: box });
    ok('zoom+ changes camera', !a.equals(b));
  }

  // bridges: fetch + legend + status
  const bridgeReq = errors.filter((e) => e.includes('bridges.json'));
  ok('no bridges.json fetch error', bridgeReq.length === 0);
  ok('bridge discoverable (status/keymap/card)', /bridge · recovered/i.test(bodyText) || /\+3 recovered/i.test(bodyText), '');
  ok('+3 recovered in status', /\+3 recovered/i.test(bodyText));

  // trail regression: visit 2 docs directly, then expect the chip in graph mode
  await page.goto('http://localhost:4199/?doc=org--Introduction', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  await page.goto('http://localhost:4199/?doc=org--Tables', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  await page.goto('http://localhost:4199/?mode=graph', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  const chip = await page.locator('text=/TRAIL \\d/i').count();
  ok('trail chip still earned', chip > 0);

  await page.screenshot({ path: `${OUT}/ns-network-dark.png`, fullPage: false });
  await ctx.close();
}

// ---------- phone (390) + light theme ----------
{
  const { ctx, page } = await newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'light' }, 'phone');
  await page.goto('http://localhost:4199/?mode=graph', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);
  const bodyText = await page.locator('body').innerText();
  ok('phone: lock defaults locked', (await page.locator('button[aria-label*="lock" i][aria-pressed="true"]').count()) > 0, 'lock pressed on phone');
  await page.screenshot({ path: `${OUT}/ns-network-phone.png` });
  await ctx.close();
}

// ---------- WebGL-off honesty arm ----------
{
  const { ctx, page } = await newPage({}, 'webgl');
  await page.addInitScript(() => {
    const orig = globalThis.HTMLCanvasElement.prototype.getContext;
    globalThis.HTMLCanvasElement.prototype.getContext = function (t, ...a) {
      if (t === 'webgl2' || t === 'webgl') return null;
      return orig.call(this, t, ...a);
    };
  });
  await page.goto('http://localhost:4199/?mode=graph', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  const bodyText = await page.locator('body').innerText();
  ok('WebGL-off honesty copy', /unavailable|WebGL/i.test(bodyText));
  await ctx.close();
}

await browser.close();
await server.close();

writeFileSync(`${OUT}/ns-verdict.txt`, [...results, '', `console errors: ${errors.length}`, ...errors.slice(0, 8)].join('\n'));
console.log([...results, '', `console errors: ${errors.length}`, ...errors.slice(0, 8)].join('\n'));
const fails = results.filter((r) => r.startsWith('FAIL')).length;
process.exit(fails || errors.length ? 1 : 0);
