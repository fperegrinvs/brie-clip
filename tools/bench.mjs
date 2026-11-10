// node tools/bench.mjs [page] -> reports WebGL availability and ms per grabbed frame
import { chromium } from 'playwright-core';
const EXE = process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const page_ = process.argv[2] || 'cartoon.html';
const browser = await chromium.launch({ executablePath: EXE, args: (process.env.ARGS || '').split(' ').filter(Boolean) });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.log('pageerror', e.message));
page.on('console', (m) => m.type() === 'error' && console.log('console', m.text()));
await page.goto(`http://localhost:5178/${page_}?render`);
await page.waitForFunction(() => window.ready === true);
console.log(await page.evaluate(() => {
  const t0 = performance.now();
  for (let i = 0; i < 30; i++) window.grab(64 + i / 30, 0.93);
  const c = document.createElement('canvas').getContext('webgl');
  const ext = c && c.getExtension('WEBGL_debug_renderer_info');
  return { hasGL: window.hasGL, msPerFrame: (performance.now() - t0) / 30, renderer: ext ? c.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null };
}));
await browser.close();
