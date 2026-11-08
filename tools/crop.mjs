// node tools/crop.mjs out.jpg x y w h t1 t2 ...  -> full-res crops of one region side by side
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const EXE = process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const [out, X, Y, Wd, Ht, ...ts] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://localhost:5178/index.html?render');
await page.waitForFunction(() => window.ready === true);
const data = await page.evaluate(([r, times]) => {
  const sc = document.createElement('canvas');
  sc.width = r[2] * times.length; sc.height = r[3];
  const x = sc.getContext('2d');
  const src = document.getElementById('c');
  times.forEach((t, i) => {
    window.renderFrame(t);
    x.drawImage(src, r[0], r[1], r[2], r[3], i * r[2], 0, r[2], r[3]);
    x.fillStyle = '#000'; x.font = '22px sans-serif'; x.fillText(t.toFixed(2), i * r[2] + 8, 26);
  });
  return sc.toDataURL('image/jpeg', 0.85);
}, [[+X, +Y, +Wd, +Ht], ts.map(Number)]);
writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
await browser.close();
