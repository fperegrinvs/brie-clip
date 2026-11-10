// Brie as an actor: wraps the existing drawings with squash & stretch, lean, smears,
// multiples, and motion primitives built from anticipation -> action -> settle.
import { drawBreeSide, drawBreeFront, drawFrontHead } from '../bree.js';
import { costume } from '../costumes.js';
import { shadow } from '../fx.js';
import { clamp, lerp, easeOut, easeIn, easeOutBack, easeInOut } from '../util.js';

/**
 * o.view   'side' | 'front' | 'head'
 * o.x,o.y  feet on the ground (head view: head centre)
 * o.s      scale, o.dir  1 faces right / -1 faces left
 * o.sq     squash (+) / stretch (-) about the feet, area-preserving
 * o.lean   forward shear, o.rot rotation about the feet, o.spin rotation about the body centre
 * o.stretch  horizontal smear factor (1 = none)
 * o.trail  { dx, dy, n } multiples left behind on a fast move
 * o.ground y of the floor for the contact shadow (defaults to o.y); o.shadow=false disables it
 * o.costume  'lion' | 'croc' | 'cheese' | 'cabbage' | 'worm' (o.ct = costume clock)
 * everything else is passed to the drawing (phase, legs, mouth, eyes, ear, wag, expr, crown, cape ...)
 */
const EAR_OUT = 0.55;
const ghost = document.createElement('canvas');
ghost.width = 1920;
ghost.height = 1080;

export function brie(ctx, o) {
  const view = o.view || 'side';
  const s = o.s ?? 1, dir = o.dir ?? 1;
  const x = o.x ?? 0, y = o.y ?? 0;
  if (o.shadow !== false && view !== 'head') {
    const gy = o.ground ?? y;
    const lift = clamp((gy - y) / (500 * s));
    shadow(ctx, x, gy + 4, (view === 'side' ? 110 : 100) * s * (1 - 0.5 * lift), 0.18 * (1 - 0.6 * lift));
  }
  // front views always show both ears, splayed out from behind the head
  const base = view === 'side' ? o : { earOut: EAR_OUT, ...o };
  const pose = o.costume ? { ...base, ...costume(o.costume, o.ct ?? 0) } : base;
  const draw = (ctx, a) => {
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    const sq = o.sq ?? 0;
    if (sq) ctx.scale(1 + sq * 0.75, 1 - sq);
    ctx.scale(s * dir, s);
    if (o.lean) ctx.transform(1, 0, -o.lean, 1, 0, 0);
    const cy = view === 'head' ? 0 : view === 'side' ? -92 : -110;
    if (o.spin) {
      ctx.translate(0, cy);
      ctx.rotate(o.spin);
      ctx.translate(0, -cy);
    }
    if (o.stretch && o.stretch !== 1) {
      ctx.translate(0, cy);
      ctx.scale(o.stretch, 1 / Math.sqrt(o.stretch));
      ctx.translate(0, -cy);
    }
    if (view === 'side') drawBreeSide(ctx, pose);
    else if (view === 'front') drawBreeFront(ctx, pose);
    else drawFrontHead(ctx, pose.expr ?? 'happy', pose.lw ?? 6, pose);
    ctx.restore();
  };
  if (o.trail) {
    // multiples: flat pale silhouettes of this drawing, left behind along the path
    const n = o.trail.n ?? 3;
    const m = ctx.getTransform();
    const g = ghost.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, ghost.width, ghost.height);
    g.setTransform(m);
    draw(g, 1);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = o.trail.color ?? '#ffffff';
    g.fillRect(0, 0, ghost.width, ghost.height);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = n; i >= 1; i--) {
      const wx = -(o.trail.dx ?? 0) * i, wy = -(o.trail.dy ?? 0) * i;
      ctx.globalAlpha = 0.6 * (1 - (i - 1) / (n + 1));
      ctx.drawImage(ghost, m.a * wx + m.c * wy, m.b * wx + m.d * wy);
    }
    ctx.restore();
  }
  draw(ctx, o.alpha ?? 1);
}

/* ---------- motion primitives: pure functions of local time, return options for brie() ---------- */

/**
 * Jump with anticipation crouch, stretched arc and landing squash.
 * j: { t0, dur, from:[x,y], to:[x,y], h, pre=0.16, land=0.4 }
 */
export function jump(lt, j) {
  const pre = j.pre ?? 0.16, t0 = j.t0, dur = j.dur;
  const [x0, y0] = j.from, [x1, y1] = j.to;
  if (lt < t0 - pre) return { x: x0, y: y0, sq: 0, air: false };
  if (lt < t0) {
    const u = easeOut((lt - (t0 - pre)) / pre);
    return { x: x0, y: y0, sq: 0.34 * u, legs: [0.35 * u, -0.35 * u], air: false, anticip: u };
  }
  if (lt < t0 + dur) {
    const u = (lt - t0) / dur;
    const edge = Math.abs(1 - 2 * u);
    return {
      x: lerp(x0, x1, u), y: lerp(y0, y1, u) - j.h * 4 * u * (1 - u), ground: lerp(y0, y1, u),
      sq: -0.26 * edge, pitch: -0.38 * (1 - 2 * u) * (j.pitch ?? 1), bob: 0,
      legs: [lerp(-1.0, 0.25, 1 - edge) * (u < 0.5 ? 1 : 0.9), lerp(1.0, -0.25, 1 - edge) * (u < 0.5 ? 1 : 0.2)],
      ear: 0.4 + 0.6 * u, air: true, u,
    };
  }
  const a = lt - (t0 + dur);
  return { x: x1, y: y1, sq: 0.4 * Math.exp(-a * 9) * Math.cos(a * 21), air: false, landAge: a };
}

/**
 * Zip away: scramble on the spot leaning back, then gone in a few drawings.
 * z: { t0, x, dir, wind=0.3, dist=2600 }
 */
export function zip(lt, z) {
  const wind = z.wind ?? 0.3, dir = z.dir ?? 1;
  if (lt < z.t0 - wind) return { x: z.x, dir, gone: false };
  if (lt < z.t0) {
    const u = (lt - (z.t0 - wind)) / wind;
    return { x: z.x - dir * 46 * easeOut(u), dir, phase: (lt * 7) % 1, amp: 1, lean: -0.28 * easeOut(u), ear: 0.2, mouth: 0.4, eyes: 'wide', gone: false, scramble: u };
  }
  const v = (lt - z.t0) / 0.26;
  return {
    x: z.x - dir * 46 + dir * easeIn(v) * (z.dist ?? 2600), dir, phase: (lt * 7) % 1, amp: 1, lean: 0.35, ear: 1, mouth: 0.8, eyes: 'happy',
    stretch: 1 + 1.3 * clamp(v), trail: { dx: dir * 90 * clamp(v * 2), n: 3 }, gone: v > 1, goneAge: lt - z.t0,
  };
}

/**
 * Skid to a stop: lean back, legs braced, then a wobble forward.
 * k: { t0, dur, x0, x1, dir }
 */
export function skid(lt, k) {
  const dir = k.dir ?? (Math.sign(k.x1 - k.x0) || 1);
  const u = clamp((lt - k.t0) / k.dur);
  const a = lt - (k.t0 + k.dur);
  if (a < 0) return { x: lerp(k.x0, k.x1, easeOut(u)), dir, lean: -0.5 * Math.pow(1 - u, 0.5), legs: [-0.85, -0.6], ear: 0.9 * (1 - u), eyes: 'wide', mouth: 0.5, skidding: 1 - u };
  return { x: k.x1, dir, lean: 0.22 * Math.exp(-a * 7) * Math.sin(a * 19 + 1.2), ear: 0, skidding: 0, stopAge: a };
}

/** Double take at t0: duck, then pop up tall with wide eyes, settle. Returns { sq, wide }. */
export function take(lt, t0) {
  const a = lt - t0;
  if (a < 0) return { sq: 0, wide: false };
  if (a < 0.1) return { sq: 0.26 * (a / 0.1), wide: false };
  const b = a - 0.1;
  return { sq: -0.34 * easeOutBack(b / 0.14) * Math.exp(-Math.max(0, b - 0.3) * 5), wide: b < 0.9 };
}

/** Sitting bounce on the beat (use with pulse()). */
export const bounce = (p, amt = 0.1) => ({ sq: amt * p });

/** Tiptoe sneak: little high steps. Returns { phase, amp, bob, headTilt }. */
export function tiptoe(lt, rate = 3.2) {
  const p = (lt * rate) % 1;
  return { phase: p, amp: 0.42, bob: -14 * Math.abs(Math.sin(p * Math.PI * 2)), headTilt: 0.12, ear: 0, eyes: 'wide', look: 1 };
}

/** Out-of-breath panting. */
export function pant(lt, rate = 4.5) {
  const p = Math.sin(lt * rate * Math.PI * 2);
  return { sq: 0.05 * p, mouth: 0.55 + 0.4 * p, tongue: true };
}

/** Velocity of a path function (per second) by central difference. */
export function vel(fn, t, h = 1 / 60) {
  const a = fn(t - h), b = fn(t + h);
  return [(b[0] - a[0]) / (2 * h), (b[1] - a[1]) / (2 * h)];
}
