// Brie: movement, costume powers and drawing.
import { drawBrieSide } from '../src/brie.js';
import { costume, withRocket } from '../src/costumes.js';
import { skate } from '../src/props.js';
import { clamp, lerp } from '../src/util.js';
import { LEVEL, gravityScale } from './level.js';

export const S = 0.5; // Brie draw scale
const G = 3600;
const RUN = 600, SKATE_RUN = 800, CRAWL_RUN = 330;
const ACC_GROUND = 4400, ACC_AIR = 2800, FRICTION = 5200, SKATE_FRICTION = 1300;
const JUMP_V = 1600, FLOAT_FALL = 230, MAX_FALL = 1700;
const STAND_H = 110, CRAWL_H = 56, W_BOX = 84;
const GRIND_SPEED = 1150;
export const FUEL_MAX = 1.6;

export const COSTUME_NAMES = {
  worm: 'MINHOCA BRIE!',
  cabbage: 'CÔVE BRIE!',
  croc: 'CROC BRIE!',
  rocket: 'ROCKET BRIE!',
};

export function makePlayer(x, y) {
  return {
    x, y, px: x, py: y, vx: 0, vy: 0, w: W_BOX, h: STAND_H,
    onGround: true, ground: null, facing: 1, costume: null,
    coyote: 0, jumpBuf: 0, jumpHeld: false, airT: 0,
    crawling: false, grind: null, inWater: false, swimming: false,
    fuel: FUEL_MAX, thrusting: false, floating: false,
    dist: 0, squash: 0, t: 0, happyT: 0, blinkT: 2, spin: 0,
    visible: true,
  };
}

const overlap = (x0, y0, x1, y1, s) =>
  x1 > s.x + 0.001 && x0 < s.x + s.w - 0.001 && y1 > s.y + 0.001 && y0 < s.y + s.h - 0.001;

export function boxHitsSolid(x, y, w, h) {
  for (const s of LEVEL.solids) if (overlap(x - w / 2, y - h, x + w / 2, y, s)) return s;
  return null;
}

function waterAt(x, y) {
  for (const w of LEVEL.water) if (x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h) return w;
  return null;
}

const railY = (r, x) => lerp(r.y0, r.y1, (x - r.x0) / (r.x1 - r.x0));

/* ------------------------------------------------------------------ */
// ev: callback(name, data) for sound/particles; inp: {left,right,up,down,jump,jumpPressed}
export function updatePlayer(p, inp, dt, ev) {
  p.t += dt;
  p.px = p.x;
  p.py = p.y;
  p.happyT = Math.max(0, p.happyT - dt);
  p.blinkT -= dt;
  if (p.blinkT < -0.12) p.blinkT = 2.5 + Math.random() * 2;
  p.squash *= Math.pow(0.0005, dt);

  const ax = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  const skates = p.costume === 'cabbage';
  const gs = gravityScale(p.x, p.y);
  if (inp.jumpPressed) p.jumpBuf = 0.14;
  else p.jumpBuf = Math.max(0, p.jumpBuf - dt);

  // ride moving platforms
  if (p.onGround && p.ground?.mover) {
    p.x += p.ground.dx;
  }

  /* ---------- rail grinding (côve skates) ---------- */
  if (p.grind) {
    const g = p.grind, r = g.rail;
    g.sp = Math.min(GRIND_SPEED, g.sp + 900 * dt);
    p.x += g.dir * g.sp * dt;
    p.spin += g.sp * dt * 0.05;
    p.dist += g.sp * dt * 0.3;
    const slope = (r.y1 - r.y0) / (r.x1 - r.x0);
    if (p.jumpBuf > 0) {
      p.jumpBuf = 0;
      p.grind = null;
      p.vx = g.dir * g.sp * 0.85;
      p.vy = -JUMP_V;
      p.onGround = false;
      ev('jump');
      return finish(p, dt, ev);
    }
    if (p.x >= r.x1 || p.x <= r.x0) {
      p.grind = null;
      p.vx = g.dir * g.sp * 0.85;
      p.vy = slope * p.vx * g.dir - 650;
      p.onGround = false;
      ev('whee');
      return finish(p, dt, ev);
    }
    p.y = railY(r, p.x);
    p.vx = g.dir * g.sp;
    p.vy = 0;
    p.facing = g.dir;
    if (Math.random() < 0.6) ev('spark', { x: p.x - g.dir * 20, y: p.y });
    return finish(p, dt, ev);
  }

  /* ---------- water ---------- */
  const wat = waterAt(p.x, p.y - p.h * 0.45);
  const wasIn = p.inWater;
  p.inWater = !!wat;
  if (p.inWater !== wasIn && Math.abs(p.vy) > 150) ev('splash', { x: p.x, y: (wat ?? waterAt(p.x, p.py + 10) ?? { y: p.y }).y });
  p.swimming = p.inWater && p.costume === 'croc';

  if (p.swimming) {
    const ay = (inp.down ? 1 : 0) - (inp.up || inp.jump ? 1 : 0);
    const k = 1 - Math.pow(0.004, dt);
    p.vx = lerp(p.vx, ax * 560, k);
    p.vy = lerp(p.vy, ay * 500 + (ay === 0 ? 30 : 0), k);
    if (ax) p.facing = ax;
    // leap out at the surface
    p.wetT = 0.3;
    // leap out at the surface: tap jump, or keep holding it while swimming up
    if ((p.jumpBuf > 0 || inp.jump) && p.y - p.h * 0.5 < wat.y + 50) {
      p.jumpBuf = 0;
      p.vy = -1400;
      ev('jump');
    }
    p.dist += Math.hypot(p.vx, p.vy) * dt;
    if (Math.random() < 0.05) ev('bubble', { x: p.x + p.facing * 40, y: p.y - 70 });
  } else if (p.inWater) {
    // no croc suit: Brie floats at the surface like a little cotton cloud
    const target = wat.y + 46;
    const k = 1 - Math.pow(0.02, dt);
    p.vx = lerp(p.vx, ax * 300, k);
    p.vy += (G * 0.4 * gs) * dt;
    if (p.y > target) p.vy -= (p.y - target) * 90 * dt + p.vy * 6 * dt;
    if (p.y > target + 40) { p.y = target + 40; p.vy = Math.min(p.vy, 0); }
    if (ax) p.facing = ax;
    if (p.jumpBuf > 0 && p.y > wat.y) {
      p.jumpBuf = 0;
      p.vy = -1300;
      ev('jump');
    }
    p.dist += Math.abs(p.vx) * dt;
  } else {
    /* ---------- on land / in the air ---------- */
    const crawlWanted = p.costume === 'worm' && inp.down && p.onGround;
    if (crawlWanted && !p.crawling) {
      p.crawling = true;
      ev('wiggle');
    } else if (p.crawling && !(p.costume === 'worm' && inp.down && p.onGround)) {
      // stand up only if there is room
      if (!boxHitsSolid(p.x, p.y, p.w, STAND_H)) p.crawling = false;
    }
    p.h = p.crawling ? CRAWL_H : STAND_H;

    const maxV = p.crawling ? CRAWL_RUN : skates ? SKATE_RUN : RUN;
    const acc = p.onGround ? ACC_GROUND : ACC_AIR;
    if (ax) {
      if (Math.sign(p.vx) !== ax && p.onGround) p.vx += ax * (skates ? SKATE_FRICTION : FRICTION) * dt;
      // keep extra momentum from rails and bounces; on the ground it eases back below
      const lim = Math.max(maxV, Math.abs(p.vx));
      p.vx = clamp(p.vx + ax * acc * dt, -lim, lim);
      if (Math.abs(p.vx) > maxV && p.onGround) p.vx = Math.sign(p.vx) * Math.max(maxV, Math.abs(p.vx) - 2400 * dt);
      p.facing = ax;
    } else {
      const fr = (p.onGround ? (skates ? SKATE_FRICTION * 0.6 : FRICTION) : 900) * dt;
      p.vx = Math.abs(p.vx) <= fr ? 0 : p.vx - Math.sign(p.vx) * fr;
    }

    // jump (coyote time + buffer)
    if (p.onGround) { p.coyote = 0.1; p.airT = 0; }
    else { p.coyote = Math.max(0, p.coyote - dt); p.airT += dt; }
    p.wetT = Math.max(0, (p.wetT ?? 0) - dt);
    // bobbing just above the water still counts as being able to leap
    const fromWater = p.wetT > 0 && p.costume === 'croc' && p.vy > -400;
    if (p.jumpBuf > 0 && (p.coyote > 0 || fromWater) && !p.crawling) {
      p.wetT = 0;
      p.jumpBuf = 0;
      p.coyote = 0;
      p.vy = -JUMP_V * (gs < 1 ? 0.9 : 1);
      p.onGround = false;
      p.ground = null;
      p.squash = -0.18;
      p.jumpHeld = true;
      p.hop = true; // only a normal jump gets the short-hop cut
      ev('jump');
    }
    if (!inp.jump) p.jumpHeld = false;
    // variable height: let go early for a little hop
    if (p.vy >= 0) p.hop = false;
    if (p.hop && !inp.jump && p.vy < -500 && !p.thrusting && p.airT > 0) p.vy = Math.max(p.vy, -500);

    p.vy += G * gs * dt;

    // pão de queijo rocket
    p.thrusting = false;
    if (p.costume === 'rocket' && !p.onGround && inp.jump && p.fuel > 0 && p.airT > 0.16) {
      p.thrusting = true;
      p.fuel = Math.max(0, p.fuel - dt);
      p.vy = Math.max(-760, p.vy - 7600 * dt);
      if (Math.random() < 0.7) ev('flame', { x: p.x - p.facing * 46, y: p.y - 60 });
    }
    if (p.onGround) p.fuel = Math.min(FUEL_MAX, p.fuel + dt * 1.6);

    // royal cape float
    p.floating = !p.thrusting && !p.onGround && inp.jump && p.vy > FLOAT_FALL;
    if (p.floating) p.vy = Math.max(FLOAT_FALL, p.vy - 9000 * dt);
    p.vy = Math.min(p.vy, MAX_FALL);
    if (p.onGround) p.dist += Math.abs(p.vx) * dt;
  }

  /* ---------- integrate & collide ---------- */
  const wasGround = p.onGround;
  const fallV = p.vy;
  // X
  p.x += p.vx * dt;
  for (const s of LEVEL.solids) {
    if (!overlap(p.x - p.w / 2, p.y - p.h, p.x + p.w / 2, p.y, s)) continue;
    const midS = s.x + s.w / 2;
    if (p.x < midS) p.x = s.x - p.w / 2 - 0.01;
    else p.x = s.x + s.w + p.w / 2 + 0.01;
    p.vx = 0;
  }
  // Y
  const prevY = p.y;
  p.y += p.vy * dt;
  p.onGround = false;
  p.ground = null;
  for (const s of LEVEL.solids) {
    if (!overlap(p.x - p.w / 2, p.y - p.h, p.x + p.w / 2, p.y, s)) continue;
    if (p.vy >= 0 && prevY <= s.y + 1) {
      p.y = s.y;
      p.vy = 0;
      p.onGround = true;
      p.ground = s;
    } else if (p.vy < 0) {
      p.y = s.y + s.h + p.h;
      p.vy = 0;
      ev('bonk');
    }
  }
  if (p.vy >= 0) {
    const land = (top, x0, x1, ref) => {
      if (p.x + p.w / 2 * 0.7 < x0 || p.x - p.w / 2 * 0.7 > x1) return false;
      if (prevY <= top + 1 && p.y >= top) {
        p.y = top;
        p.vy = 0;
        p.onGround = true;
        p.ground = ref;
        return true;
      }
      return false;
    };
    for (const o of LEVEL.oneWays) land(o.y, o.x, o.x + o.w, o);
    for (const m of LEVEL.movers) land(m.y, m.cx - m.w / 2, m.cx + m.w / 2, m);
    for (const b of LEVEL.bouncers) {
      // landing on it from above, or walking onto a floor-level bouncer
      const walkOn = wasGround && p.x > b.x + 30 && p.x < b.x + b.w - 30 && p.y >= b.y && p.y <= b.y + b.h + 2;
      if (land(b.y, b.x, b.x + b.w, b) || walkOn) {
        p.onGround = false;
        p.ground = null;
        p.vy = -b.power * (inp.jump ? 1.08 : 1);
        p.squash = 0.3;
        b.boing = 1;
        ev('boing', { x: p.x, y: b.y });
      }
    }
  }

  // catch a rail with the skates
  if (skates && !p.onGround && p.vy >= 0) {
    for (const r of LEVEL.rails) {
      if (p.x < r.x0 || p.x > r.x1) continue;
      const ry = railY(r, p.x);
      if (prevY <= ry + 8 && p.y >= ry - 2) {
        p.grind = { rail: r, dir: p.vx < -50 ? -1 : p.vx > 50 ? 1 : p.facing, sp: Math.max(Math.abs(p.vx), 750) };
        p.y = ry;
        p.vy = 0;
        p.squash = 0.2;
        ev('grind');
        break;
      }
    }
  }

  if (p.onGround && !wasGround && !p.grind) {
    if (fallV > 700) {
      p.squash = clamp(fallV / 5000, 0.08, 0.28);
      ev('land', { x: p.x, y: p.y, big: fallV > 1300 });
    }
  }
  return finish(p, dt, ev);
}

function finish(p, dt, ev) {
  if (p.costume === 'cabbage') p.spin += p.vx * dt * 0.05;
  if (p.onGround && Math.abs(p.vx) > 420 && Math.random() < 0.12) ev('dust', { x: p.x - p.facing * 30, y: p.y });
  return p;
}

/* ------------------------------------------------------------------ */
function costumeOpts(kind, t) {
  if (!kind) return {};
  if (kind === 'rocket') return withRocket(costume('cheese', t), t);
  return costume(kind, t);
}

export function drawPlayer(ctx, p, alpha = 1, extra = {}) {
  if (!p.visible) return;
  const x = lerp(p.px, p.x, alpha), y = lerp(p.py, p.y, alpha);
  const t = p.t;
  const running = (p.onGround || p.grind) && Math.abs(p.vx) > 30;
  const speed = clamp(Math.abs(p.vx) / RUN);
  let phase = null, amp = 1, rot = 0;
  if (p.grind) { phase = 0.1; amp = 0.25; rot = Math.atan2(p.grind.rail.y1 - p.grind.rail.y0, p.grind.rail.x1 - p.grind.rail.x0) * p.facing; }
  else if (p.swimming) { phase = (t * 1.6) % 1; amp = 0.8; rot = clamp(p.vy / 1400, -0.5, 0.5); }
  else if (p.inWater) { phase = (t * 1.2) % 1; amp = 0.5; }
  else if (running) { phase = (p.dist / (p.crawling ? 120 : 200)) % 1; amp = p.costume === 'cabbage' ? 0.35 : 0.4 + 0.6 * speed; }
  else if (!p.onGround) { phase = p.vy < 0 ? 0.3 : 0.75; amp = 0.55; rot = clamp(p.vy / 4000, -0.15, 0.2); }
  if (p.thrusting) rot = -0.25;

  let eyes = 'open';
  if (p.happyT > 0 || extra.happy) eyes = 'happy';
  else if (p.thrusting || (p.vy < -1700)) eyes = 'wide';
  else if (p.blinkT < 0) eyes = 'closed';
  const mouth = p.happyT > 0 || extra.happy ? 0.8 : running ? 0.35 + 0.4 * speed : p.floating ? 0.6 : 0.15;

  let sx = 1 + p.squash, sy = 1 - p.squash;
  if (p.crawling) { sx *= 1.25; sy *= 0.5; }
  const wiggle = p.crawling && running ? Math.sin(t * 22) * 0.05 : 0;

  ctx.save();
  ctx.translate(x, y);
  if (extra.rise) ctx.translate(0, extra.rise);
  ctx.rotate(rot + wiggle);
  ctx.scale(p.facing * S * sx, S * sy);
  const opts = {
    phase, amp,
    mouth, eyes,
    ear: clamp(speed * 0.8 + (p.vy < 0 ? 0.3 : 0) + (p.floating ? 0.6 : 0)),
    wag: t * (running ? 14 : 9),
    cape: { t, style: 'royal' },
    crown: !!extra.crown,
    ...costumeOpts(p.costume, t),
  };
  drawBrieSide(ctx, opts);
  if (p.costume === 'cabbage') {
    skate(ctx, -66, 10, 0.62, p.spin);
    skate(ctx, 64, 10, 0.62, p.spin);
  }
  ctx.restore();
}
