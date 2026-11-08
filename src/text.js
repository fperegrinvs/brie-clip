import { TAU, INK, clamp, easeOutBack, easeOut, rand, rrange, star, fillStroke, noise } from './util.js';
import { W, H } from './fx.js';

export const SING = '"Fredoka", sans-serif';
export const COMIC = '"Bangers", "Fredoka", sans-serif';

export async function loadFonts() {
  const faces = [
    new FontFace('Fredoka', 'url(fonts/Fredoka.ttf)', { weight: '300 700' }),
    new FontFace('Bangers', 'url(fonts/Bangers.ttf)'),
  ];
  for (const f of faces) {
    await f.load();
    document.fonts.add(f);
  }
  await document.fonts.ready;
}

/* Karaoke line at the bottom third ---------------------------------- */
export function karaoke(ctx, line, t) {
  const age = t - line.t;
  const left = line.e - t;
  const appear = easeOutBack(age / 0.25);
  const fade = clamp(left / 0.2);
  if (appear <= 0 || fade <= 0) return;
  const size = line.text.length > 40 ? 58 : 64;
  ctx.save();
  ctx.font = `600 ${size}px ${SING}`;
  const tw = ctx.measureText(line.text).width;
  const x = W / 2 - tw / 2;
  const y = H - 92;
  ctx.globalAlpha = fade;
  ctx.translate(W / 2, y);
  ctx.scale(appear, appear);
  ctx.translate(-W / 2, -y);
  // pill
  ctx.fillStyle = 'rgba(35,20,52,0.55)';
  ctx.beginPath();
  ctx.roundRect(x - 40, y - size * 0.95, tw + 80, size * 1.5, size);
  ctx.fill();
  // base text
  ctx.lineJoin = 'round';
  ctx.lineWidth = 12;
  ctx.strokeStyle = INK;
  ctx.textBaseline = 'alphabetic';
  ctx.strokeText(line.text, x, y);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(line.text, x, y);
  // sweep fill
  const dur = (line.e - line.t) * 0.8;
  const p = clamp(age / dur);
  if (p > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 10, y - size, (tw + 20) * p, size * 1.6);
    ctx.clip();
    const g = ctx.createLinearGradient(0, y - size, 0, y + 10);
    g.addColorStop(0, '#fff27a');
    g.addColorStop(1, '#ff9ec4');
    ctx.fillStyle = g;
    ctx.fillText(line.text, x, y);
    ctx.restore();
    // little paw cursor at sweep head
    if (p < 1) {
      const px = x + tw * p;
      drawPaw(ctx, px, y - size * 1.05, 16, '#ff7da5');
    }
  }
  ctx.restore();
}

export function drawPaw(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, s * 0.35, s * 0.7, s * 0.55, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  for (const [dx, dy] of [[-0.75, -0.35], [-0.27, -0.75], [0.27, -0.75], [0.75, -0.35]]) {
    ctx.beginPath();
    ctx.arc(dx * s, dy * s, s * 0.26, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/* Comic burst word ---------------------------------------------------- */
const BURST_COLORS = {
  default: [['#ffd84d', '#ff5d8f'], ['#4cc3ff', '#ffd84d'], ['#ff5d8f', '#4cc3ff'], ['#37c45c', '#ffd84d'], ['#b77dff', '#ffd84d']],
  storm: [['#b77dff', '#fff27a'], ['#4cc3ff', '#fff27a'], ['#ff5d8f', '#fff27a']],
  scold: [['#ff4d4d', '#ffffff'], ['#ff8c42', '#ffffff']],
  group: [['#ffffff', '#ff5d8f'], ['#ffd84d', '#4c6fff']],
  mega: [['#ffd84d', '#ff5d8f'], ['#4cc3ff', '#ff5d8f'], ['#37c45c', '#ffd84d']],
};

export function burstWord(ctx, text, x, y, size, age, life, opts = {}) {
  if (age < 0 || age > life) return;
  const pal = BURST_COLORS[opts.style || 'default'];
  const [bg, fg] = pal[(opts.i ?? 0) % pal.length];
  const s = easeOutBack(age / 0.2) * (1 + 0.04 * Math.sin(age * 30) * Math.exp(-age * 4));
  const out = clamp((life - age) / 0.15);
  ctx.save();
  ctx.globalAlpha = out;
  ctx.translate(x + noise(age * 18, opts.i ?? 0) * 4, y + noise(age * 18, 9 + (opts.i ?? 0)) * 4);
  ctx.rotate(opts.rot ?? 0);
  ctx.scale(s, s);
  ctx.font = `${size}px ${COMIC}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tw = ctx.measureText(text).width;
  if (opts.starburst !== false) {
    const rx = tw / 2 + size * 0.55, ry = size * 0.95;
    ctx.save();
    ctx.scale(1, ry / rx);
    star(ctx, 0, 0, rx * 1.12, rx * 0.86, 16, age * 0.6);
    fillStroke(ctx, bg, INK, 8 * (rx / ry));
    ctx.restore();
  }
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.2;
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  ctx.fillText(text, size * 0.06, size * 0.08);
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = fg;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

// layouts for each word within a burst line
const SLOTS = [
  [0.27, 0.3, -0.12], [0.73, 0.3, 0.1], [0.5, 0.52, -0.04], [0.27, 0.72, 0.08], [0.73, 0.72, -0.1], [0.5, 0.2, 0.05],
];
export function burstLine(ctx, line, t, layout) {
  const n = line.words.length;
  line.words.forEach(([wt, text], i) => {
    const age = t - wt;
    const life = line.e - wt;
    let [sx, sy, rot] = layout?.[i] ?? SLOTS[i % SLOTS.length];
    if (!layout && n === 1) [sx, sy, rot] = [0.5, 0.4, -0.05];
    if (!layout && n === 2) [sx, sy, rot] = i ? [0.62, 0.55, 0.06] : [0.38, 0.3, -0.08];
    const size = (text.length > 10 ? 130 : 170) * (line.style === 'mega' ? 1.25 : 1);
    burstWord(ctx, text, sx * W, sy * H, size, age, life, { style: line.style, i, rot });
  });
}

/* Soft whisper text --------------------------------------------------- */
export function softText(ctx, line, t) {
  const age = t - line.t;
  const a = clamp(age / 0.4) * clamp((line.e - t) / 0.4);
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = `400 italic 72px ${SING}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9f3';
  ctx.shadowColor = '#ff7da5';
  ctx.shadowBlur = 30;
  ctx.fillText(line.text, W / 2, 230 - age * 12);
  ctx.restore();
}

/* Narrator parchment scroll ------------------------------------------ */
export function narration(ctx, line, t) {
  const age = t - line.t;
  const a = clamp(age / 0.6) * clamp((line.e - t) / 0.5);
  if (a <= 0) return;
  const unroll = easeOut(age / 1.2);
  const cx = W / 2, cy = 190;
  const wFull = 1500;
  const w = wFull * unroll;
  ctx.save();
  ctx.globalAlpha = a;
  // parchment
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - 95, w, 190, 18);
  fillStroke(ctx, '#f6e7c1', INK, 6);
  ctx.strokeStyle = 'rgba(160,110,50,0.35)';
  ctx.lineWidth = 3;
  ctx.strokeRect(cx - w / 2 + 22, cy - 72, Math.max(0, w - 44), 144);
  // rollers
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.roundRect(cx + sx * (w / 2) - 22, cy - 115, 44, 230, 22);
    fillStroke(ctx, '#c98a45', INK, 6);
  }
  // text reveal
  const full = line.text;
  const split = full.indexOf('hails');
  const p1 = full.slice(0, split).trim();
  const p2 = full.slice(split).trim();
  const chars = Math.floor(clamp((age - 0.5) / 6.0) * (p1.length + p2.length));
  ctx.beginPath();
  ctx.rect(cx - w / 2 + 30, cy - 95, Math.max(0, w - 60), 190);
  ctx.clip();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#5a3a1a';
  ctx.font = `500 62px ${SING}`;
  ctx.fillText(p1.slice(0, chars), cx, cy - 8);
  const c2 = Math.max(0, chars - p1.length);
  if (c2 > 0) {
    const pop = easeOutBack((age - 0.5 - (p1.length / (p1.length + p2.length)) * 6) / 0.4);
    ctx.save();
    ctx.translate(cx, cy + 62);
    ctx.scale(0.8 + 0.2 * pop, 0.8 + 0.2 * pop);
    ctx.font = `64px ${COMIC}`;
    ctx.fillStyle = '#2f8f45';
    ctx.fillText(p2.slice(0, c2).toUpperCase(), 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

/* Logo --------------------------------------------------------------- */
export function logo(ctx, x, y, s, age, opts = {}) {
  const pop = easeOutBack(age / 0.35);
  if (pop <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * pop, s * pop);
  ctx.rotate(-0.04);
  // BREE
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `330px ${COMIC}`;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 46;
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  ctx.fillText('BRIE', 14, 16);
  ctx.strokeText('BRIE', 0, 0);
  const g = ctx.createLinearGradient(0, -130, 0, 130);
  g.addColorStop(0, '#fff27a');
  g.addColorStop(0.5, '#ffb347');
  g.addColorStop(1, '#ff5d8f');
  ctx.fillStyle = g;
  ctx.fillText('BRIE', 0, 0);
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffffff';
  ctx.globalAlpha = 0.6;
  ctx.strokeText('BRIE', -4, -6);
  ctx.globalAlpha = 1;
  // ribbon
  if (opts.ribbon !== false) {
    const rp = easeOutBack((age - 0.25) / 0.35);
    if (rp > 0) {
      ctx.save();
      ctx.translate(0, 190);
      ctx.scale(rp, 1);
      ctx.beginPath();
      ctx.moveTo(-560, -52);
      ctx.lineTo(560, -52);
      ctx.lineTo(600, 0);
      ctx.lineTo(560, 52);
      ctx.lineTo(-560, 52);
      ctx.lineTo(-600, 0);
      ctx.closePath();
      fillStroke(ctx, '#37c45c', INK, 8);
      const SUB = 'AS CRÔNICAS DE CLOVERLEAF';
      ctx.font = `78px ${COMIC}`;
      const fs = Math.min(78, (78 * 1040) / ctx.measureText(SUB).width);
      ctx.font = `${fs}px ${COMIC}`;
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 10;
      ctx.strokeStyle = INK;
      ctx.strokeText(SUB, 0, 4);
      ctx.fillText(SUB, 0, 4);
      ctx.restore();
    }
  }
  ctx.restore();
}

export function bigLabel(ctx, text, x, y, size, color, age = 1, rot = 0) {
  const p = easeOutBack(age / 0.25);
  if (p <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(p, p);
  ctx.font = `${size}px ${COMIC}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.18;
  ctx.strokeStyle = INK;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}
