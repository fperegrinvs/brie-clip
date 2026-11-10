// Print page errors for a page: node tools/errs.mjs [page] [t...]
import { chromium } from 'playwright-core';
const page_ = process.argv[2] || 'cartoon.html';
const times = process.argv.slice(3).map(Number);
const EXE = process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const b = await chromium.launch({ executablePath: EXE });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[console]', m.text()); });
p.on('pageerror', (e) => console.log('[pageerror]', e.message, (e.stack || '').split('\n').slice(0, 4).join(' | ')));
p.on('requestfailed', (r) => console.log('[failed]', r.url()));
p.on('response', (r) => { if (r.status() >= 400) console.log('[http]', r.status(), r.url()); });
await p.goto(`http://localhost:5178/${page_}?render`);
await p.waitForFunction('window.ready === true', null, { timeout: 8000 }).catch(() => console.log('not ready'));
for (const t of times) {
  const e = await p.evaluate((t) => { try { window.renderFrame(t); return null; } catch (e) { return e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 4).join(' | '); } }, t);
  if (e) console.log(`t=${t}:`, e);
}
console.log('done');
await b.close();
