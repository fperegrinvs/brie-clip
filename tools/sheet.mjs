// node tools/sheet.mjs out.jpg t1 t2 ...   -> contact sheet (4 columns, 640x360 cells)
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';
const EXE = process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const [out, ...ts] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await page.goto('http://localhost:5178/index.html?render');
await page.waitForFunction(() => window.ready === true);
const data = await page.evaluate((times) => {
  const cols = 4, cw = 640, ch = 360;
  const rows = Math.ceil(times.length / cols);
  const sc = document.createElement('canvas');
  sc.width = cols * cw; sc.height = rows * ch;
  const x = sc.getContext('2d');
  const src = document.getElementById('c');
  times.forEach((t, i) => {
    window.renderFrame(t);
    x.drawImage(src, (i % cols) * cw, Math.floor(i / cols) * ch, cw, ch);
    x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect((i % cols) * cw, Math.floor(i / cols) * ch, 90, 30);
    x.fillStyle = '#fff'; x.font = '20px sans-serif'; x.fillText(t.toFixed(1), (i % cols) * cw + 8, Math.floor(i / cols) * ch + 22);
  });
  return sc.toDataURL('image/jpeg', 0.85);
}, ts.map(Number));
writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
if (errs.length) console.log('ERRORS:\n' + errs.join('\n'));
await browser.close();
