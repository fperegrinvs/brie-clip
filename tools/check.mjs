// Determinism + regression checks.
//   node tools/check.mjs det  [page] t1 t2 ...   frames rendered in order, then shuffled in a fresh page, must hash the same
//   node tools/check.mjs base [page] t1 t2 ...   page rendered with the working-tree src/*.js vs those at REF (default HEAD) must hash the same
import { chromium } from 'playwright-core';
import { execSync } from 'child_process';
const [mode, pageName, ...rest] = process.argv.slice(2);
const times = rest.map(Number);
const REF = process.env.REF || 'HEAD';
const EXE = process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const browser = await chromium.launch({ executablePath: EXE });

async function hashes(order, route) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  // every shared source file is served as it was at REF (default HEAD)
  if (route) await page.route('**/src/*.js', (r) => {
    const name = new URL(r.request().url()).pathname.slice(1);
    let body;
    try { body = execSync(`git show ${REF}:${name}`, { maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch { return r.continue(); }
    return r.fulfill({ contentType: 'text/javascript', body });
  });
  await page.goto(`http://localhost:5178/${pageName}${pageName.includes('?') ? '&' : '?'}render`);
  await page.waitForFunction(() => window.ready === true);
  const out = await page.evaluate((ts) => {
    const sc = document.createElement('canvas');
    sc.width = 1920; sc.height = 1080;
    const x = sc.getContext('2d', { willReadFrequently: true });
    const src = document.getElementById('c');
    const res = {};
    for (const t of ts) {
      window.renderFrame(t);
      x.drawImage(src, 0, 0);
      const d = x.getImageData(0, 0, 1920, 1080).data;
      let h = 2166136261;
      for (let i = 0; i < d.length; i += 1) h = Math.imul(h ^ d[i], 16777619) >>> 0;
      res[t] = h;
    }
    return res;
  }, order);
  await page.close();
  return out;
}

let a, b;
if (mode === 'det') {
  a = await hashes(times);
  const shuffled = [...times].reverse().flatMap((t, i) => [times[(i * 7 + 3) % times.length], t]);
  b = await hashes(shuffled);
} else {
  a = await hashes(times);
  b = await hashes(times, true);
}
let bad = 0;
for (const t of times) if (a[t] !== b[t]) { bad++; console.log('DIFF at t=' + t, a[t], b[t]); }
console.log(`${mode}: ${times.length - bad}/${times.length} frames identical`);
await browser.close();
