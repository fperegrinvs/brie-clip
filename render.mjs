// node render.mjs [out.mp4] [startSec] [endSec] [workers]
// Renders the canvas animation headlessly at 30 fps and muxes the song.
// Needs the preview server on :5178 (python3 -m http.server 5178).
import { chromium } from 'playwright-core';
import { spawn, execFileSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync } from 'fs';

const PAGE = process.env.PAGE || 'index.html';
const EXE = process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const FPS = 30;
const out = process.argv[2] || 'bree-clip.mp4';
const t0 = Number(process.argv[3] ?? 0);
const tEnd = process.argv[4] != null ? Number(process.argv[4]) : null;
const WORKERS = Number(process.argv[5] ?? 4);
const TMP = 'out/segments';
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const browser = await chromium.launch({ executablePath: EXE });
const probe = await browser.newPage();
await probe.goto(`http://localhost:5178/${PAGE}${PAGE.includes('?') ? '&' : '?'}render`);
await probe.waitForFunction(() => window.ready === true);
const duration = tEnd ?? (await probe.evaluate(() => window.DURATION));
await probe.close();

const f0 = Math.round(t0 * FPS), f1 = Math.round(duration * FPS);
const total = f1 - f0;
const per = Math.ceil(total / WORKERS);
let done = 0;
const started = Date.now();

async function worker(w) {
  const a = f0 + w * per, b = Math.min(f1, a + per);
  if (a >= b) return null;
  const seg = `${TMP}/seg${w}.mp4`;
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.error(`[w${w}] pageerror`, e.message));
  await page.goto(`http://localhost:5178/${PAGE}${PAGE.includes('?') ? '&' : '?'}render`);
  await page.waitForFunction(() => window.ready === true);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
  const BATCH = 6;
  for (let f = a; f < b; f += BATCH) {
    const ts = [];
    for (let k = f; k < Math.min(b, f + BATCH); k++) ts.push(k / FPS);
    const urls = await page.evaluate((ts) => ts.map((t) => window.grab(t, 0.93)), ts);
    for (const u of urls) {
      const buf = Buffer.from(u.slice(u.indexOf(',') + 1), 'base64');
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    done += urls.length;
    if (w === 0 && (f - a) % (BATCH * 50) === 0) {
      const el = (Date.now() - started) / 1000;
      console.log(`${done}/${total} frames  ${(done / el).toFixed(1)} fps  eta ${((total - done) / (done / el)).toFixed(0)}s`);
    }
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error('ffmpeg ' + c)))));
  await page.close();
  return seg;
}

const segs = (await Promise.all([...Array(WORKERS).keys()].map(worker))).filter(Boolean);
await browser.close();
writeFileSync(`${TMP}/list.txt`, segs.map((s) => `file '${s.split('/').pop()}'`).join('\n'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${TMP}/list.txt`,
  '-ss', String(t0), '-t', String(duration - t0), '-i', 'audio/song.mp3',
  '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
console.log(`wrote ${out} in ${((Date.now() - started) / 1000).toFixed(0)}s`);
