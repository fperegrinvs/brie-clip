// Brie as an actor: wraps the existing drawings with squash & stretch, lean, smears,
// multiples, and motion primitives built from anticipation -> action -> settle.
import { drawBrieSide, drawBrieFront, drawFrontHead } from '../brie.js';
import { costume } from '../costumes.js';
import { shadow } from '../fx.js';
import { skate } from '../props.js';
import { clamp, lerp, easeOut, easeIn, easeOutBack, easeInOut, DETAIL, TAU, rand, fillStroke } from '../util.js';
import { glint } from './paint.js';

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
 *
 * In the detailed style she is never quite still: she breathes, blinks and glances about when a shot
 * leaves her eyes alone, her ears, tail and fur lag behind the stride and the squash, and her paws kick
 * up dust. o.life=false turns all of it off; o.blink=false, o.breath=false, o.puffs=false one at a time.
 * o.vel [vx, vy] (px/s) adds drag on ears, tail and fur for a big move.
 */
const frac = (v) => v - Math.floor(v);
const CLOCK = { tc: 0, ltc: 0, i: 0, n: 0 };
/** The shot clock, handed over once per frame before the shot is drawn. */
export function setActorClock(s) {
  CLOCK.tc = s.tc;
  CLOCK.ltc = s.ltc;
  CLOCK.i = s.i;
  CLOCK.n = 0;
}

function alive(o, view) {
  const id = CLOCK.i * 7.31 + CLOCK.n++ * 3.17;
  const a = { ...o };
  const running = o.phase != null, sq = o.sq ?? 0;
  let ear = o.earSwing ?? 0, tail = o.tailSwing ?? 0, fur = o.furLean ?? 0;
  if (view === 'side') {
    if (running) {
      // the stride: ears flap a beat behind the bob, the plume a beat behind the ears
      const ph = o.phase * TAU, amp = o.amp ?? 1;
      ear += 0.2 * amp * Math.sin(ph - 1.9);
      tail += 0.15 * amp * Math.sin(ph - 2.7);
      fur += amp * (0.6 + 0.4 * Math.sin(ph - 1.2));
    }
    // squash and stretch: ears stream on the way up and flop on the landing, the plume answers
    ear += -sq * (sq < 0 ? 0.9 : 0.55);
    tail += sq * 0.7;
    if (o.vel) {
      const dx = clamp((o.vel[0] * (o.dir ?? 1)) / 1800, -1, 1), dy = clamp(o.vel[1] / 1600, -1, 1);
      ear += 0.3 * dx + 0.32 * dy;
      tail += -0.2 * dx + 0.22 * dy;
      fur += Math.max(0, dx);
    }
    if (o.blink !== false && o.eyes == null) {
      if (blinking(id)) a.eyes = 'closed';
      else if (!running && o.look == null) {
        // now and then a glance to one side
        const D = 1.9 + rand(id + 3), k = Math.floor(CLOCK.ltc / D), r = rand(k * 5.3 + id);
        if (k > 0 && r > 0.55 && CLOCK.ltc - k * D < 0.75) a.look = r > 0.8 ? -0.7 : 0.7;
      }
    }
  } else {
    // seen from the front both ears lift together on a stretch and splay on a squash
    if (o.earOut != null) a.earOut = o.earOut + sq * (sq < 0 ? 0.9 : 0.6);
    tail += sq * 0.5;
    const e = o.expr ?? 'happy';
    if (o.blink !== false && o.fEyes == null && (e === 'innocent' || e === 'guilty') && blinking(id)) a.fEyes = 'closed';
  }
  if (view !== 'head' && !running && !o.air && o.breath !== false && Math.abs(sq) < 0.03) {
    a.sq = sq + 0.013 * Math.sin(CLOCK.tc * 2.5 + id);
  }
  if (ear) a.earSwing = ear;
  if (tail) a.tailSwing = tail;
  if (fur) a.furLean = fur;
  return a;
}

function blinking(id) {
  const T = 2.7 + 1.5 * rand(id + 1), first = 0.8 + 1.2 * rand(id + 2);
  return CLOCK.ltc >= first && (CLOCK.ltc - first) % T < 0.16;
}

/** Dust from the paws, fur shaken loose on a skid, a twinkle where she lands. */
function kicked(ctx, o, view, x, gy, s, dir) {
  if ((o.alpha ?? 1) < 1) return;
  const grounded = o.shadow !== false && !o.air && Math.abs(gy - (o.y ?? 0)) < 8 * s;
  if (view === 'side' && o.phase != null && (o.amp ?? 1) > 0.6 && !o.shoe && grounded && o.puffs !== false && (o.stretch ?? 1) < 1.3 && !o.skidding) {
    for (const off of [0.08, 0.58]) {
      const k = frac(o.phase + off) / 0.7;
      if (k >= 1) continue;
      const px = x - dir * s * (64 + 150 * easeOut(k)), py = gy - s * (10 + 30 * k), r = s * 15 * (1 - k * k);
      for (const [dx, dy, kr] of [[0, 0, 1], [-18, 7, 0.7], [11, -11, 0.55]]) {
        if (r * kr < 1.5) continue;
        ctx.beginPath();
        ctx.arc(px + dir * dx * s, py + dy * s, r * kr, 0, TAU);
        fillStroke(ctx, '#ffffff', '#3a2a5c', Math.max(2, 3.5 * s));
      }
    }
  }
  if (o.skidding > 0.05 && o.puffs !== false) {
    // tufts of fur fly on ahead of her
    const u = 1 - o.skidding;
    for (let i = 0; i < 5; i++) {
      const px = x + dir * s * (70 + u * (150 + 70 * i)), py = (o.y ?? 0) - s * (50 + i * 34 + 46 * Math.sin(u * Math.PI) - 60 * u * u);
      const r = s * (8 - i) * (1 - u * 0.6);
      if (r < 1.5) continue;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, TAU);
      fillStroke(ctx, '#ffffff', '#3a2a5c', Math.max(2, 3 * s));
    }
  }
  if (o.landAge != null && o.landAge < 0.34 && o.puffs !== false) {
    const k = o.landAge / 0.34;
    for (let i = 0; i < 4; i++) {
      const sd = i < 2 ? -1 : 1, far = i % 2;
      glint(ctx, x + sd * s * (70 + (90 + far * 60) * easeOut(k)), gy - s * (14 + (30 + far * 44) * easeOut(k)), s * (20 - far * 6) * (1 - k), 1 - k * 0.5, '#ffe58a');
    }
  }
}
const EAR_OUT = 0.55;
const ghost = document.createElement('canvas');
ghost.width = 1920;
ghost.height = 1080;

export function brie(ctx, o) {
  const view = o.view || 'side';
  if (DETAIL.on && o.life !== false) o = alive(o, view);
  const s = o.s ?? 1, dir = o.dir ?? 1;
  const x = o.x ?? 0, y = o.y ?? 0;
  if (o.shadow !== false && view !== 'head') {
    const gy = o.ground ?? y;
    const lift = clamp((gy - y) / (500 * s));
    const rx = (view === 'side' ? 110 : 100) * s * (1 - 0.5 * lift);
    if (DETAIL.on) {
      // a wide soft pool and a darker core where she touches the ground
      shadow(ctx, x, gy + 7, rx * 1.3, 0.08 * (1 - 0.5 * lift));
      shadow(ctx, x, gy + 5, rx, 0.12 * (1 - 0.6 * lift));
      shadow(ctx, x, gy + 4, rx * 0.62, 0.12 * (1 - 0.9 * lift));
    } else shadow(ctx, x, gy + 4, rx, 0.18 * (1 - 0.6 * lift));
  }
  if (DETAIL.on && o.life !== false && view !== 'head') kicked(ctx, o, view, x, o.ground ?? y, s, dir);
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
    if (view === 'side') drawBrieSide(ctx, pose);
    else if (view === 'front') drawBrieFront(ctx, pose);
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

/**
 * Roller skates worn on the paws: pass as o.shoe. Each skate is drawn at the sole of its paw, so
 * it follows the leg exactly; it stays flat on the floor while the leg swings.
 * Raise Brie by SKATE_H * s so the wheels (not the paws) touch the ground.
 */
const SKATE_K = 0.6;
export const SKATE_H = 38 * SKATE_K;
export const skates = (spin = 0) => (ctx, i) => {
  ctx.save();
  if (i.view === 'side') {
    ctx.rotate(-i.angle);
    skate(ctx, 15 * SKATE_K, 0, SKATE_K, spin);
  } else {
    // front view: toes out
    ctx.scale(i.side, 1);
    skate(ctx, 15 * SKATE_K + 6, 0, SKATE_K, spin);
  }
  ctx.restore();
};

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
      vel: [(x1 - x0) / dur, (y1 - y0) / dur - (j.h * 4 * (1 - 2 * u)) / dur],
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
