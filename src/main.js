import { W, H } from './fx.js';
import { sectionAt, LYRICS, DURATION, setAnalysis, pulse, energyAt, hitAt } from './timeline.js';
import { SCENES, SHAKE } from './scenes.js';
import { loadFonts, karaoke, burstLine, softText, narration } from './text.js';
import { noise, clamp } from './util.js';

const canvas = document.getElementById('c');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');

export function render(t) {
  const sec = sectionAt(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // camera: slight overscan, beat pulse zoom, onset shake
  const sh = (SHAKE[sec.name] ?? 0.4) * hitAt(t) * 16;
  const zoom = 1.035 + 0.014 * pulse(t, 7) * energyAt(t) * (SHAKE[sec.name] ?? 0.4);
  ctx.save();
  ctx.translate(W / 2 + noise(t * 23, 1) * sh, H / 2 + noise(t * 23, 2) * sh);
  ctx.rotate(noise(t * 11, 3) * sh * 0.0008);
  ctx.scale(zoom, zoom);
  ctx.translate(-W / 2, -H / 2);
  SCENES[sec.name](ctx, t, sec);
  ctx.restore();

  // lyrics overlay
  for (const l of LYRICS) {
    if (t < l.t - 0.05 || t > l.e + 0.05) continue;
    ctx.save();
    if (l.kind === 'sing') karaoke(ctx, l, t);
    else if (l.kind === 'burst') burstLine(ctx, l, t, l.layout);
    else if (l.kind === 'soft') softText(ctx, l, t);
    else if (l.kind === 'narr') narration(ctx, l, t);
    ctx.restore();
  }
  // fade in from black
  if (t < 0.8) {
    ctx.fillStyle = `rgba(0,0,0,${clamp(1 - t / 0.8)})`;
    ctx.fillRect(0, 0, W, H);
  }
}

async function boot() {
  const [, a] = await Promise.all([loadFonts(), fetch('src/analysis.json').then((r) => r.json())]);
  setAnalysis(a);
  window.renderFrame = (t) => render(t);
  window.grab = (t, q = 0.92) => {
    render(t);
    return canvas.toDataURL('image/jpeg', q);
  };
  window.DURATION = DURATION;
  window.ready = true;
  if (new URLSearchParams(location.search).has('render')) {
    document.body.classList.add('render');
    render(0);
    return;
  }
  setupPlayer();
}

function setupPlayer() {
  const audio = document.getElementById('audio');
  const scrub = document.getElementById('scrub');
  const time = document.getElementById('time');
  const play = document.getElementById('play');
  const taps = [];
  let tapMode = false;
  scrub.max = DURATION;
  const q = new URLSearchParams(location.search);
  if (q.has('t')) audio.currentTime = parseFloat(q.get('t'));
  play.onclick = () => (audio.paused ? audio.play() : audio.pause());
  scrub.oninput = () => (audio.currentTime = parseFloat(scrub.value));
  window.seek = (t) => {
    audio.currentTime = t;
    render(t);
  };
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      play.onclick();
    } else if (e.code === 'ArrowLeft') audio.currentTime -= 2;
    else if (e.code === 'ArrowRight') audio.currentTime += 2;
    else if (e.key === 't') {
      tapMode = !tapMode;
      document.getElementById('tap').textContent = tapMode ? 'TAP MODE: press L at each line start, D to dump' : '';
    } else if (tapMode && e.key === 'l') taps.push(+audio.currentTime.toFixed(2));
    else if (tapMode && e.key === 'd') {
      console.log(JSON.stringify(taps));
      navigator.clipboard?.writeText(JSON.stringify(taps));
    }
  });
  const loop = () => {
    const t = audio.currentTime;
    render(t);
    if (document.activeElement !== scrub) scrub.value = t;
    const sec = sectionAt(t);
    time.textContent = `${t.toFixed(2)}s · ${sec.name}`;
    requestAnimationFrame(loop);
  };
  loop();
}

boot();
