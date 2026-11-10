// Shared helpers for the cartoon cut: timing on twos, keyframe tracks, sets.
import { TAU, INK, clamp, lerp, easeOut, easeIn, easeInOut, easeOutBack, easeOutElastic, rand, fillStroke, clover } from '../util.js';
import { W, H, sky } from '../fx.js';
import { beatAt, LYRICS } from '../timeline.js';
import * as P from '../props.js';

export const FY = P.FLOOR_Y;
export const FPS12 = 12;
export const twos = (t) => Math.floor(t * FPS12 + 1e-6) / FPS12;
export const frac = (v) => ((v % 1) + 1) % 1;
export const run = (t, mult = 1) => frac(beatAt(t) * mult);
export const wag = (t) => t * 18;

export const E = {
  lin: (k) => clamp(k),
  in: easeIn,
  out: easeOut,
  io: easeInOut,
  back: easeOutBack,
  el: easeOutElastic,
  hold: (k) => (k >= 1 ? 1 : 0),
};

/** Keyframe track. keys: [[time, value, ease='io'], ...]; the ease shapes the move arriving at that key. */
export function key(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t < keys[i][0]) {
      const a = keys[i - 1], b = keys[i];
      const k = (E[b[2] || 'io'])((t - a[0]) / (b[0] - a[0]));
      if (Array.isArray(a[1])) return a[1].map((v, j) => v + (b[1][j] - v) * k);
      return a[1] + (b[1] - a[1]) * k;
    }
  }
  return keys[keys.length - 1][1];
}

/** Deterministic blink: true for ~0.12 s every 2.5-4 s. */
export function blink(t, seed = 0) {
  const p = 2.5 + rand(seed + 0.5) * 1.5;
  const i = Math.floor(t / p);
  const a = t - i * p - rand(i * 7.1 + seed) * (p - 0.4);
  return a > 0 && a < 0.13;
}

/** Seconds since the latest of `times` that is <= t (Infinity if none). */
export function since(t, times) {
  let a = Infinity;
  for (const x of times) if (t >= x) a = Math.min(a, t - x);
  return a;
}

export function nearWord(t, line, win = 0.22) {
  if (!line) return -1;
  for (let i = line.words.length - 1; i >= 0; i--) {
    const d = t - line.words[i][0];
    if (d >= 0 && d < win) return i;
  }
  return -1;
}
export const burstAt = (t) => LYRICS.find((l) => l.kind === 'burst' && t >= l.t - 0.05 && t <= l.e);

export function lerpColor(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp(pa >> 16, pb >> 16, k));
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, k));
  const bl = Math.round(lerp(pa & 255, pb & 255, k));
  return `rgb(${r},${g},${bl})`;
}

/* ---------- sets ---------- */
export function house(ctx, x, y, s, doorOpen = 0, bulge = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * (1 + bulge * 0.12), s * (1 - bulge * 0.08));
  ctx.beginPath();
  ctx.rect(-300, -380, 600, 380);
  fillStroke(ctx, '#ffe3a3', INK, 7);
  ctx.beginPath();
  ctx.moveTo(-360, -370);
  ctx.lineTo(0, -640);
  ctx.lineTo(360, -370);
  ctx.closePath();
  fillStroke(ctx, '#ff7a6b', INK, 7);
  ctx.beginPath();
  ctx.rect(150, -620, 70, 150);
  fillStroke(ctx, '#c96a5a', INK, 6);
  for (const wx of [-220, 110]) {
    ctx.beginPath();
    ctx.roundRect(wx, -300, 110, 110, 12);
    fillStroke(ctx, '#7fd3ff', INK, 6);
    ctx.beginPath();
    ctx.moveTo(wx + 55, -300);
    ctx.lineTo(wx + 55, -190);
    ctx.moveTo(wx, -245);
    ctx.lineTo(wx + 110, -245);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.roundRect(-70, -230, 140, 230, [60, 60, 0, 0]);
  fillStroke(ctx, doorOpen > 0 ? '#fff6c8' : '#8a5a2b', INK, 7);
  if (doorOpen > 0) {
    ctx.save();
    ctx.translate(-70, 0);
    ctx.scale(1 - doorOpen * 0.85, 1);
    ctx.beginPath();
    ctx.roundRect(0, -230, 140, 230, [60, 60, 0, 0]);
    fillStroke(ctx, '#8a5a2b', INK, 7);
    ctx.restore();
  }
  clover(ctx, 0, -470, 40, 0, '#37c45c', 5);
  ctx.restore();
}

export function dayOutdoor(ctx, t, camX, o = {}) {
  sky(ctx, o.top ?? '#6fd0ff', o.bottom ?? '#d9f6ff');
  if (o.sun !== false) P.sun(ctx, 1620, 180, 80, t);
  P.clouds(ctx, t, camX, 0.1);
  P.hills(ctx, camX, 640, 70, o.far ?? '#9be38f', 0.2, 1);
  P.hills(ctx, camX, 780, 60, o.near ?? '#6fd36a', 0.5, 3, true);
}

export const room = (ctx, theme, camX, t, items = true) => P.roomStrip(ctx, camX, theme, items, t);

export function rug(ctx, cx = W / 2, cy = 880, rx = 720, ry = 170) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  fillStroke(ctx, '#ffb3cf', INK, 6);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx - 120, ry - 50, 0, 0, TAU);
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
}

export function livingRoom(ctx, t, withRug = true) {
  room(ctx, 'living', 0, t, false);
  P.furniture(ctx, 'window', 140, FY, t);
  P.furniture(ctx, 'lamp', 1580, FY, t);
  P.furniture(ctx, 'plant', 1760, FY, t);
  P.furniture(ctx, 'frame', 1180, FY, t);
  if (withRug) rug(ctx);
}

export function humanShadow(ctx, x, y, s, a) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = `rgba(30,15,50,${a})`;
  ctx.beginPath();
  ctx.arc(0, -760, 90, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-130, -650);
  ctx.lineTo(130, -650);
  ctx.lineTo(170, -300);
  ctx.lineTo(110, 0);
  ctx.lineTo(-110, 0);
  ctx.lineTo(-170, -300);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 60;
  ctx.lineCap = 'round';
  ctx.strokeStyle = ctx.fillStyle;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * 120, -620);
    ctx.lineTo(sx * 280, -470);
    ctx.lineTo(sx * 160, -360);
    ctx.stroke();
  }
  ctx.restore();
}

/** Cartoon dust puff cloud: bursts out from (x, y) and dissolves. age in seconds. */
export function puff(ctx, x, y, age, size = 1, seed = 0, color = '#ffffff') {
  if (age < 0 || age > 0.6) return;
  const k = age / 0.6;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + rand(seed + i) * 0.8;
    const d = easeOut(k) * (70 + rand(seed + i * 3) * 60) * size;
    const r = (34 + rand(seed + i * 5) * 22) * size * (1 - k * k);
    if (r < 1) continue;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.55 - k * 30 * size, r, 0, TAU);
    fillStroke(ctx, color, INK, 5);
  }
}

/** Radial shock ring. */
export function ring(ctx, x, y, age, maxR = 500, color = '#ffffff', dur = 0.45) {
  if (age < 0 || age > dur) return;
  const k = age / dur;
  ctx.save();
  ctx.globalAlpha = 1 - k;
  ctx.lineWidth = 26 * (1 - k) + 4;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, easeOut(k) * maxR, easeOut(k) * maxR * 0.32, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

/** Comic impact star burst behind something. */
export function pow(ctx, x, y, r, age, color = '#ffd84d', n = 12, seed = 0, dur = 0.42) {
  if (age < 0 || age > dur) return;
  const k = easeOutBack(age / 0.18) * (dur === Infinity ? 1 : 1 - easeIn(clamp((age - dur + 0.12) / 0.12)));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rand(seed) * 0.6 - 0.3);
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const rr = (i % 2 ? 0.58 : 1) * r * k * (0.85 + 0.3 * rand(seed + i));
    const a = (i / (n * 2)) * TAU;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  fillStroke(ctx, color, INK, 8);
  ctx.restore();
}

export { W, H, INK, TAU, clamp, lerp, easeOut, easeIn, easeInOut, easeOutBack, easeOutElastic, rand };
