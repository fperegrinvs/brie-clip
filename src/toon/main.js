// Brie clip, cartoon cut: same song and gags, staged like a hand-drawn TV cartoon.
import { W, H } from '../fx.js';
import { sectionAt, LYRICS, DURATION, setAnalysis } from '../timeline.js';
import { loadFonts, karaoke, burstWord, softText, narration } from '../text.js';
import { clamp } from '../util.js';
import * as stage from './stage.js';
import { renderShot } from './shots.js';

const canvas = document.getElementById('c');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');
const SLOTS = [[0.27, 0.3, -0.12], [0.73, 0.3, 0.1], [0.5, 0.52, -0.04], [0.27, 0.72, 0.08], [0.73, 0.72, -0.1], [0.5, 0.2, 0.05]];

export function render(t) {
  stage.begin();
  const look = renderShot(t, stage) || {};
  // comic shout words live on the effects layer so they boil with the drawings;
  // a cut clears the words shouted in earlier shots
  for (const l of LYRICS) {
    if (l.kind !== 'burst' || t < l.t - 0.05 || t > l.e + 0.05) continue;
    const n = l.words.length;
    stage.fx.save();
    stage.fx.setTransform(1, 0, 0, 1, 0, 0);
    l.words.forEach(([wt, text], i) => {
      if (!look.keepWords && wt < (look.shotT ?? 0) - 0.3) return;
      let slot = look.wordAt?.(i, l) ?? l.layout?.[i];
      if (!slot) slot = n === 1 ? [0.5, 0.4, -0.05] : n === 2 ? (i ? [0.62, 0.55, 0.06] : [0.38, 0.3, -0.08]) : SLOTS[i % SLOTS.length];
      const size = (text.length > 10 ? 130 : 170) * (l.style === 'mega' ? 1.25 : 1) * (slot[3] ?? 1);
      burstWord(stage.fx, text, slot[0] * W, slot[1] * H, size, t - wt, l.e - wt, { style: l.style, i, rot: slot[2] });
    });
    stage.fx.restore();
  }
  stage.compose(ctx, look);
  look.over?.(ctx);
  for (const l of LYRICS) {
    if (l.kind === 'burst' || t < l.t - 0.05 || t > l.e + 0.05) continue;
    ctx.save();
    if (l.kind === 'sing') karaoke(ctx, l, t);
    else if (l.kind === 'soft') softText(ctx, l, t);
    else if (l.kind === 'narr') narration(ctx, l, t);
    ctx.restore();
  }
  look.top?.(ctx);
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
  window.hasGL = stage.hasGL;
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
  });
  const loop = () => {
    const t = audio.currentTime;
    render(t);
    if (document.activeElement !== scrub) scrub.value = t;
    time.textContent = `${t.toFixed(2)}s · ${sectionAt(t).name}`;
    requestAnimationFrame(loop);
  };
  loop();
}

boot();
