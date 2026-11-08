const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
  const p = await b.newPage({ viewport: { width: 1920, height: 1640 } });
  p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.goto('http://localhost:5178/tools/capes.html');
  await p.waitForFunction(() => window.done);
  await p.screenshot({ path: 'out/capes.png' });
  await b.close();
})();
