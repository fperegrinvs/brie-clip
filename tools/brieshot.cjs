const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
  const p = await b.newPage({ viewport: { width: 1600, height: 700 } });
  p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.goto('http://localhost:5178/tools/brie.html');
  await p.waitForFunction(() => window.done);
  await p.screenshot({ path: 'out/brie.png' });
  await b.close();
})();
