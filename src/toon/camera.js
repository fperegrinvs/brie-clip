// A virtual camera: { x, y, zoom, rot } where (x, y) is the world point at screen centre.
import { W, H } from '../fx.js';
import { clamp, lerp, noise, rand, easeOut } from '../util.js';

export const cam = (x = W / 2, y = H / 2, zoom = 1, rot = 0) => ({ x, y, zoom, rot });

export const mixCam = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), zoom: lerp(a.zoom, b.zoom, k), rot: lerp(a.rot || 0, b.rot || 0, k) });

export function applyCam(ctx, c) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(W / 2, H / 2);
  ctx.rotate(c.rot || 0);
  ctx.scale(c.zoom, c.zoom);
  ctx.translate(-c.x, -c.y);
}

/** Keep the view inside the drawn 1920x1080 world (so no edges show). */
export function fitCam(c) {
  const r = Math.abs(c.rot || 0);
  const cs = Math.cos(r), sn = Math.sin(r);
  const zoom = Math.max(c.zoom, cs + sn * (W / H) + 0.001);
  const hw = (W / 2 * cs + H / 2 * sn) / zoom, hh = (W / 2 * sn + H / 2 * cs) / zoom;
  return { x: clamp(c.x, hw, W - hw), y: clamp(c.y, hh, H - hh), zoom, rot: c.rot || 0 };
}

/** Crash zoom: `steps` hard jumps from z0 to z1 starting at t0, one every `step` seconds. */
export function crash(lt, z0, z1, t0 = 0, steps = 3, step = 1 / 12) {
  const i = clamp(Math.floor((lt - t0) / step) + 1, 0, steps);
  const settle = i >= steps ? 1 + 0.035 * Math.exp(-(lt - t0 - (steps - 1) * step) * 14) : 1;
  return lerp(z0, z1, i / steps) * settle;
}

/** Handheld drift (smooth). */
export function handheld(t, amt = 1, seed = 0) {
  return { x: noise(t * 0.7, seed + 11) * 14 * amt, y: noise(t * 0.9, seed + 12) * 10 * amt, rot: noise(t * 0.5, seed + 13) * 0.006 * amt };
}

/** Impact shake, re-posed on every drawing so it reads as animated on twos. */
export function shake(age, amt = 30, drawing = 0, dur = 0.45) {
  if (age < 0 || age > dur) return [0, 0];
  const k = Math.pow(1 - age / dur, 2) * amt;
  const d = Math.floor(age * 24) + drawing * 31;
  return [(rand(d * 1.7 + 3) * 2 - 1) * k, (rand(d * 2.3 + 5) * 2 - 1) * k];
}

/** Quick punch-in that eases back: zoom multiplier. */
export const punch = (age, amt = 0.08, dur = 0.3) => (age < 0 || age > dur ? 1 : 1 + amt * (1 - easeOut(age / dur)));
