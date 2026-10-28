// shoot4.mjs — the 4-view contract: dark/light × phone/desktop of a dist.
// Usage: node shoot4.mjs <dist> <outdir>
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/home/z/my-project/org-roam-lite-ui/package.json');
const { chromium } = require('playwright-core');

const dist = process.argv[2] || '/home/z/my-project/docneural-ui/dist';
const outdir = process.argv[3] || '/tmp/shots';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p === '/') p = '/index.html';
    const fp = normalize(join(dist, p));
    if (!fp.startsWith(normalize(dist))) { if (!res.headersSent) res.writeHead(403); return res.end(); }
    const data = await readFile(fp);
    if (!res.headersSent) res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' });
    res.end(data);
  } catch { if (!res.headersSent) res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: '/home/z/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const views = [
  { name: 'dark-phone',   vp: { width: 390, height: 844 },  dsf: 2, theme: 'dark' },
  { name: 'light-phone',  vp: { width: 390, height: 844 },  dsf: 2, theme: 'light' },
  { name: 'dark-desktop', vp: { width: 1280, height: 900 }, dsf: 1, theme: 'dark' },
  { name: 'light-desktop',vp: { width: 1280, height: 900 }, dsf: 1, theme: 'light' }
];
mkdirSync(outdir, { recursive: true });
for (const v of views) {
  const ctx = await browser.newContext({
    viewport: v.vp, deviceScaleFactor: v.dsf, colorScheme: v.theme,
    isMobile: v.name.endsWith('phone'), hasTouch: v.name.endsWith('phone')
  });
  const page = await ctx.newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, v.theme);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${outdir}/${v.name}.png` });
  console.log('shot', v.name);
  await ctx.close();
}
await browser.close();
server.close();
console.log('DONE', outdir);
