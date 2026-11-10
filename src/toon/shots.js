// The shot table: every shot is { t, tr, cam(s), bg(ctx,s), cel(ctx,s), fx(ctx,s), over(ctx,s), top(ctx,s) }.
// `s` carries the shot clock: t / lt on ones (camera, travel), tc / ltc on twos (drawings).
import { W, H, fluffWipe, flash } from '../fx.js';
import { SECTIONS, sectionAt, DURATION, pulse, energyAt } from '../timeline.js';
import { SCENES } from '../scenes.js';
import { easeIn, easeOut, clamp } from '../util.js';
import { cam, applyCam, fitCam, handheld } from './camera.js';
import { ACTS } from './scenes/index.js';

const SHOTS = [];
for (const act of ACTS) for (const sh of act.shots) SHOTS.push(sh);
// sections nobody has re-staged fall back to the original scene, drawn on twos
for (const [start, name] of SECTIONS) {
  if (!ACTS.some((a) => start >= a.from - 1e-6 && start < a.to - 1e-6)) SHOTS.push({ t: start, legacy: name });
}
SHOTS.sort((a, b) => a.t - b.t);
export { SHOTS };

const TR = {
  cut: {}, flash: { type: 'flash' }, impact: { type: 'impact' }, fluff: { type: 'fluff' }, iris: { type: 'iris' },
  whipR: { type: 'whip', dx: 1, dy: 0 }, whipL: { type: 'whip', dx: -1, dy: 0 }, whipU: { type: 'whip', dx: 0, dy: -1 }, whipD: { type: 'whip', dx: 0, dy: 1 },
};
const tr = (sh) => (sh && TR[sh.tr || 'cut']) || {};

export function irisMask(ctx, cx, cy, r) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0b0714';
  ctx.beginPath();
  ctx.rect(-10, -10, W + 20, H + 20);
  ctx.arc(cx, cy, Math.max(0, r), 0, Math.PI * 2, true);
  ctx.fill('evenodd');
  if (r > 2) {
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#0b0714';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

const CALM_ZOOM = 0.45, CALM_ROT = 0.6;

export function shotIndex(t) {
  let i = 0;
  while (i + 1 < SHOTS.length && SHOTS[i + 1].t <= t + 1e-6) i++;
  return i;
}

export function renderShot(t, stage) {
  const i = shotIndex(t);
  const sh = SHOTS[i], next = SHOTS[i + 1];
  const end = next ? next.t : DURATION;
  const lt = Math.max(0, t - sh.t);
  const d = Math.floor(lt * 12 + 1e-6);
  const s = { t, lt, dur: end - sh.t, k: lt / (end - sh.t), ltc: d / 12, tc: sh.t + d / 12, d, end, left: end - t, i };

  if (sh.legacy) {
    SCENES[sh.legacy](stage.cel, s.tc, sectionAt(s.tc));
    return { drawing: i * 97 + d, cam: cam() };
  }

  let c = sh.cam ? sh.cam(s) : cam();
  // a calm camera keeps the clip cute: push-ins and dutch tilts are scaled back, the beat pulse is gentle
  c = { ...c, zoom: c.zoom > 1 ? 1 + (c.zoom - 1) * CALM_ZOOM : c.zoom, rot: (c.rot || 0) * (sh.free ? 1 : CALM_ROT) };
  const hh = handheld(t, sh.hand ?? 0.35, i);
  const bp = 1 + 0.006 * pulse(t, 7) * energyAt(t) * (sh.punch ?? 1);
  c = { x: c.x + hh.x, y: c.y + hh.y, zoom: c.zoom * 1.04 * bp, rot: (c.rot || 0) + hh.rot };
  if (!sh.free) c = fitCam(c);
  s.cam = c;
  for (const [ctx, fn] of [[stage.bg, sh.bg], [stage.cel, sh.cel], [stage.fx, sh.fx]]) {
    if (!fn) continue;
    ctx.save();
    applyCam(ctx, c);
    fn(ctx, s);
    ctx.restore();
  }

  // transitions: `tr` describes how a shot is entered; the previous shot plays its out-half
  const tin = tr(sh), tout = tr(next);
  let shift = [0, 0], blur = sh.blur ? sh.blur(s) : [0, 0], impact = sh.impact ? sh.impact(s) : 0;
  const IN = 0.16, OUT = 0.1;
  if (tin.type === 'whip' && lt < IN) {
    const e = 1 - easeOut(lt / IN);
    shift = [-tin.dx * e * 1300, -tin.dy * e * 760];
    blur = [tin.dx * e * 900, tin.dy * e * 520];
  }
  if (tout.type === 'whip' && s.left < OUT) {
    const e = easeIn(1 - s.left / OUT);
    shift = [tout.dx * e * 1300, tout.dy * e * 760];
    blur = [tout.dx * e * 900, tout.dy * e * 520];
  }
  if (tin.type === 'impact' && d < 2) impact = d + 1;

  return {
    cam: c, drawing: i * 97 + d, shift, blur, impact, shotT: sh.t, keepWords: sh.keepWords, wordAt: sh.wordAt, wash: sh.wash ?? 1, boil: sh.boil, tint: sh.tint ? sh.tint(s) : null,
    over(ctx) {
      sh.over?.(ctx, s);
      if (tin.type === 'flash' && lt < 0.25) flash(ctx, 1 - lt / 0.25);
    },
    top(ctx) {
      sh.top?.(ctx, s);
      if (tout.type === 'fluff' && s.left < 0.4) fluffWipe(ctx, 1 - s.left / 0.4);
      if (tin.type === 'fluff' && lt < 0.4) fluffWipe(ctx, 1 + lt / 0.4);
      if (tin.type === 'iris' && lt < 0.9) irisMask(ctx, sh.irisAt?.[0] ?? W / 2, sh.irisAt?.[1] ?? H / 2, easeIn(lt / 0.9) * 1250);
      if (tout.type === 'iris' && s.left < 0.6) irisMask(ctx, W / 2, H / 2, (1 - easeOut(1 - s.left / 0.6)) * 1250);
    },
  };
}
