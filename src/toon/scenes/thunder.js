// Thunder (1:18 and the final one at 2:37): costume chants on crash zooms, hero shots on the sung lines.
import { speedLines, focusLines, lightning, sparkles } from '../../fx.js';
import { blob } from '../../util.js';
import { bigLabel } from '../../text.js';
import * as P from '../../props.js';
import { brie, zip } from '../actor.js';
import { cam, crash, shake } from '../camera.js';
import { W, H, INK, TAU, clamp, lerp, easeOut, easeIn, easeInOut, key, run, wag, blink, puff, ring, pow, frac, rand } from '../kit.js';
import { bonbon, CANDY } from './prechorus.js';

const screen = (c, fn) => {
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  fn();
  c.restore();
};
// storm sky; vy scrolls the clouds vertically (falling / rising shots), speed is the sideways drift
function storm(c, t, o = {}) {
  const g = c.createLinearGradient(0, -200, 0, H + 200);
  g.addColorStop(0, o.top ?? '#1d1240');
  g.addColorStop(1, o.bottom ?? '#5b3a8f');
  c.fillStyle = g;
  c.fillRect(-500, -500, W + 1000, H + 1000);
  const n = o.n ?? 9, sp = o.speed ?? 40, vy = o.vy ?? 0;
  for (let i = 0; i < n; i++) {
    const x = frac((i * 260 - t * sp) / (W + 800)) * (W + 800) - 400;
    const y = vy ? frac((i * 0.37 + t * vy) % 1) * (H + 500) - 250 : 110 + (i % 3) * 40 + (o.dy ?? 0);
    const k = 1 + (i % 3) * 0.25;
    blob(c, [[x, y, 120 * k], [x + 110 * k, y + 30, 90 * k], [x - 110 * k, y + 40, 80 * k]], i % 2 ? '#3d2b6b' : '#4a357c', 5, '#140b2e');
  }
}
function rain(c, t, a = 0.4) {
  screen(c, () => {
    c.strokeStyle = `rgba(200,210,255,${a})`;
    c.lineWidth = 4;
    for (let i = 0; i < 110; i++) {
      const x = (rand(i) * W + t * 200) % W;
      const y = (rand(i + 50) * H + t * 1700) % H;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x - 14, y + 46);
      c.stroke();
    }
  });
}
// a bolt that lives for `dur` after age 0, with a lilac flash
function bolt(c, x, y0, y1, age, seed, dur = 0.28, w = 16) {
  if (age < 0 || age > dur) return;
  lightning(c, x, y0, y1, seed + Math.floor(age * 12), w);
  c.fillStyle = `rgba(232,224,255,${0.4 * (1 - age / dur)})`;
  c.fillRect(-500, -500, W + 1000, H + 1000);
}
const poof = (c, x, y, age, size = 2) => {
  const out = 1 + easeOut(clamp(age / 0.3)) * 0.7;
  for (let i = 0; i < 7; i++) puff(c, x + Math.cos(i * 0.9) * 130 * size * out, y + Math.sin(i * 0.9) * 100 * size * out, age * 1.6, size * 0.4, i, '#ffffff');
};
function streaks(c, tc, dir, n = 26) {
  c.strokeStyle = 'rgba(255,255,255,0.6)';
  c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = rand(i * 3 + Math.floor(tc * 12)) * W;
    const y = frac(rand(i) + tc * 2.4 * dir) * (H + 400) - 200;
    c.lineWidth = 4 + (i % 3) * 3;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x, y + 120 + (i % 4) * 60);
    c.stroke();
  }
}

export function makeThunder({ from, to, w1, s1, k1, w2, s2, k2, fin }) {
  const GX = W / 2, TOP = 786; // where Brie stands on the big globe
  const world = (c, t, r = 760, top = TOP, x = GX) => P.globe(c, x, top + r - 6, r, -t * 0.9);
  const wet = (c, s) => {
    if (fin) rain(c, s.t);
  };
  const glit = (c, s, x, y, r = 320) => {
    if (fin) sparkles(c, s.tc, x, y, r, 12, 7, '#fff6a8');
  };

  /* chant 1: three crash zooms, a costume per shout */
  const cabbage = {
    t: from, tr: 'impact', hand: 0.6, punch: 2,
    cam: (s) => cam(GX, 620, crash(s.lt, 1.0, 1.32), -0.04),
    bg(c, s) {
      storm(c, s.t);
      bolt(c, 520, -40, 700, s.lt - 0.1, 3);
      world(c, s.t);
    },
    cel(c, s) {
      brie(c, { x: GX, y: TOP, s: 1.3, costume: 'cabbage', ct: s.tc, cape: { t: s.tc }, phase: run(s.tc, 2), amp: 1, ear: 1, mouth: 0.9, eyes: 'wide', wag: wag(s.tc), lean: 0.14, shadow: false });
    },
    fx(c, s) {
      poof(c, GX, TOP - 130, s.ltc - 0.1, 2.2);
      speedLines(c, s.tc, 0.5, -1, 'rgba(255,255,255,0.6)', 200, 800);
      wet(c, s);
    },
  };
  const worm = {
    t: w1[1], tr: 'impact', hand: 0.5, punch: 2,
    cam: (s) => cam(GX - 60, 560, crash(s.lt, 1.0, 1.15), 0.05),
    bg(c, s) {
      storm(c, s.t, { speed: 90 });
      bolt(c, 1500, -40, 760, s.lt - 0.1, 11);
      world(c, s.t, 1500, 900);
    },
    cel(c, s) {
      const wig = Math.sin(s.tc * 16);
      brie(c, { view: 'front', x: GX - 190 + wig * 26, y: 900, s: 1.75, costume: 'worm', ct: s.tc, expr: s.lt < 0.5 ? 'shout' : 'happy', tilt: wig * 0.16, sq: 0.07 * Math.sin(s.tc * 32), wag: wag(s.tc), earFlop: 0.6 });
    },
    fx(c, s) {
      poof(c, GX - 190, 620, s.ltc - 0.1, 2.4);
      screen(c, () => focusLines(c, s.tc, W / 2, 560, 0.6, 'rgba(255,255,255,0.5)', 520));
      wet(c, s);
    },
  };
  const lion = {
    t: w1[2], tr: 'impact', hand: 0.5, punch: 2.4,
    cam: (s) => {
      const sh = shake(s.lt - 0.1, 26, s.d, 0.5);
      return cam(GX + sh[0], 560 + sh[1], crash(s.lt, 1.0, 1.2), -0.05);
    },
    bg(c, s) {
      storm(c, s.t, { speed: 120 });
      bolt(c, 330, -40, 900, s.lt - 0.1, 5, 0.4);
      bolt(c, 1600, -40, 900, s.lt - 0.34, 17, 0.4);
      if (fin) bolt(c, 960, -40, 500, s.lt - 0.7, 27, 0.3);
    },
    cel(c, s) {
      const roar = clamp(s.ltc / 0.2);
      brie(c, { view: 'front', x: GX, y: 1150, s: 3.0, costume: 'lion', ct: s.tc, expr: 'shout', sq: -0.05 * roar + 0.03 * Math.sin(s.tc * 40), tilt: 0.04 * Math.sin(s.tc * 9), earFlop: 1, shadow: false });
    },
    fx(c, s) {
      for (let i = 0; i < 2; i++) ring(c, GX, 620, s.lt - 0.1 - i * 0.22, 1500, '#fff6a8', 0.55);
      for (let i = 0; i < 12; i++) {
        const u = clamp((s.lt - 0.08) / 1.1 - (i % 3) * 0.06);
        if (u <= 0) continue;
        const a = (i / 12) * TAU + 0.3;
        const d = easeOut(u) * 1150;
        bonbon(c, GX + Math.cos(a) * d, 640 + Math.sin(a) * d * 0.62 + u * u * 160, 26 + u * 40, a + s.tc * 8, CANDY[i % 4]);
      }
      wet(c, s);
    },
  };

  /* sung line 1: the wide, then the low-angle hero shot, the strike and the leap */
  const WIDE = 1.95;
  const globeRun = {
    t: s1, tr: 'flash', hand: 0.6, punch: 1.6,
    cam: (s) => cam(GX, lerp(560, 620, easeInOut(s.k)), lerp(1.0, 1.16, easeInOut(s.k)), Math.sin(s.lt * 1.6) * 0.035),
    bg(c, s) {
      storm(c, s.t, { speed: 70 });
      bolt(c, 420 + rand(Math.floor(s.lt / 0.9)) * 1100, -40, 640, frac(s.lt / 0.9) * 0.9 - 0.3, Math.floor(s.lt / 0.9) * 7, 0.22, 12);
      world(c, s.t);
    },
    cel(c, s) {
      brie(c, { x: GX, y: TOP, s: 1.3, cape: { t: s.tc }, phase: run(s.tc, 2), amp: 1, ear: 1, mouth: 0.6, eyes: blink(s.tc, 4) ? 'closed' : 'happy', wag: wag(s.tc), lean: 0.16, rot: Math.sin(s.tc * 2) * 0.04, shadow: false });
    },
    fx(c, s) {
      for (let i = 1; i < 4; i++) puff(c, GX - 90 - i * 120, TOP + 4 + i * i * 7, i * 0.1 + frac(s.tc * 4) * 0.09, 0.6, i + s.d, '#ffffff');
      speedLines(c, s.tc, 0.6, -1, 'rgba(255,255,255,0.6)', 200, 820);
      // clouds whipping past the lens
      const x = W + 700 - frac(s.lt * 0.55 + 0.3) * (W + 1500);
      blob(c, [[x, -40, 210], [x + 200, 10, 170], [x - 210, 0, 150]], '#4a357c', 6, '#140b2e');
      glit(c, s, GX, TOP - 200);
      wet(c, s);
    },
  };
  const HX = GX - 60, HY = 940;
  const hero = {
    t: s1 + WIDE, hand: 0.4, punch: 1.4,
    impact: (s) => (s.t >= k1 && s.t < k1 + 1 / 12 ? 2 : 0),
    cam: (s) => {
      const sh = shake(s.t - k1, 34, s.d, 0.4);
      const up = easeIn(clamp((s.t - k1 - 0.42) / 0.3));
      return cam(GX + sh[0], lerp(600, 520, easeInOut(clamp(s.lt / 1.6))) - up * 60 + sh[1], lerp(1.0, 1.14, easeInOut(clamp(s.lt / 2))), lerp(-0.1, -0.05, s.k));
    },
    bg(c, s) {
      storm(c, s.t, { speed: 260, n: 12, dy: 40 });
      bolt(c, HX + 330, -40, HY - 40, s.t - k1, 41, 0.45, 26);
      if (fin) bolt(c, HX - 520, -40, HY - 60, s.t - k1 - 0.1, 53, 0.35, 14);
      world(c, s.t, 2400, HY);
    },
    cel(c, s) {
      // stands tall into the wind, crouches after the strike, and is gone upward
      const a = s.t - k1;
      const crouch = clamp((a - 0.14) / 0.24), go = clamp((a - 0.42) / 0.26);
      if (go >= 1) return;
      brie(c, {
        x: HX + go * 240, y: HY - easeIn(go) * 1500, ground: HY, s: 2.5,
        cape: { t: s.tc * 1.4 }, ear: 0.8, wag: wag(s.tc), shadow: false,
        phase: a < 0 ? run(s.tc, 2) : null, amp: 0.8,
        mouth: a > 0 && a < 0.14 ? 1 : 0.5, eyes: a > 0 && go === 0 ? 'wide' : blink(s.tc, 2) ? 'closed' : 'happy',
        sq: go > 0 ? -0.4 : 0.34 * easeOut(crouch), legs: go > 0 ? [-0.9, 0.9] : crouch > 0 ? [0.35 * crouch, -0.35 * crouch] : undefined,
        pitch: go > 0 ? -0.5 : 0, lean: a < 0 ? 0.1 : 0, rot: go > 0 ? -0.5 : 0,
        trail: go > 0 ? { dx: 40, dy: -220, n: 4 } : null,
      });
    },
    fx(c, s) {
      const a = s.t - k1;
      ring(c, HX, HY, a - 0.42, 900, '#ffffff', 0.4);
      puff(c, HX - 120, HY, s.tc - k1 - 0.42, 2, 1, '#ffffff');
      puff(c, HX + 140, HY, s.tc - k1 - 0.42, 2, 2, '#ffffff');
      if (a > 0 && a < 0.6) bigLabel(c, 'CRAC!', HX + 620, 330, 170, '#ffd84d', a * 5, 0.12);
      speedLines(c, s.tc, 0.7, -1, 'rgba(255,255,255,0.55)', 120, 900);
      glit(c, s, HX, HY - 300, 420);
      wet(c, s);
    },
  };

  /* chant 2: in the air */
  const airCabbage = {
    t: w2[0], tr: 'impact', hand: 0.8, punch: 2,
    cam: (s) => cam(GX, 540, crash(s.lt, 1.0, 1.2), 0.08),
    bg: (c, s) => storm(c, s.t, { vy: 1.3, n: 11, speed: 0 }),
    cel(c, s) {
      const up = lerp(160, -60, easeOut(s.k));
      brie(c, { x: GX + 120, y: 700 + up, s: 1.35, costume: 'cabbage', ct: s.tc, spin: -s.ltc * 9, legs: [-0.7, 0.7], ear: 1, mouth: 0.9, eyes: 'happy', wag: wag(s.tc), shadow: false, trail: { dx: 0, dy: -90, n: 3 } });
    },
    fx(c, s) {
      poof(c, GX + 120, 600, s.ltc - 0.1, 2);
      streaks(c, s.tc, 1);
      wet(c, s);
    },
  };
  const airWorm = {
    t: w2[1], tr: 'whipD', hand: 0.8, punch: 2,
    cam: (s) => cam(GX, 540, 1.05, -0.06 + Math.sin(s.lt * 5) * 0.03),
    bg(c, s) {
      storm(c, s.t, { vy: -1.5, n: 11, speed: 0 });
      // the world coming up fast
      const g = easeIn(clamp(s.k));
      P.globe(c, GX + 260, lerp(980, 1260, g), lerp(110, 520, g), -s.t * 0.9);
    },
    cel(c, s) {
      const wig = Math.sin(s.tc * 18);
      const hang = key(s.lt, [[0, -40], [0.3, -90, 'out'], [1.2, 60, 'in']]);
      brie(c, { view: 'front', x: GX - 200 + wig * 40, y: 820 + hang, s: 1.6, costume: 'worm', ct: s.tc, expr: s.lt < 0.34 ? 'happy' : 'shout', fEyes: s.lt > 0.34 ? 'wide' : undefined, tilt: wig * 0.3, sq: -0.12 + 0.05 * wig, earFlop: 1.4, wag: wag(s.tc), shadow: false });
    },
    fx(c, s) {
      poof(c, GX - 200, 520, s.ltc - 0.16, 2.2);
      streaks(c, s.tc, -1);
      wet(c, s);
    },
  };
  const LAND = 0.2;
  const landLion = {
    t: w2[2], tr: 'impact', hand: 0.5, punch: 2.4,
    cam: (s) => {
      const sh = shake(s.lt - LAND, 44, s.d, 0.55);
      return cam(GX + sh[0], 610 + sh[1], crash(s.lt, 1.25, 1.0, LAND, 2), 0.04);
    },
    bg(c, s) {
      storm(c, s.t, { speed: 80 });
      bolt(c, 380, -40, 720, s.lt - LAND, 61, 0.4, 20);
      bolt(c, 1560, -40, 720, s.lt - LAND - 0.12, 67, 0.4, 16);
      const dip = 46 * Math.exp(-Math.max(0, s.lt - LAND) * 7) * (s.lt > LAND ? 1 : 0);
      world(c, s.t, 760, TOP + dip);
    },
    cel(c, s) {
      const a = s.ltc - LAND;
      const dip = 46 * Math.exp(-Math.max(0, s.lt - LAND) * 7) * (s.lt > LAND ? 1 : 0);
      const y = a < 0 ? lerp(520, TOP, easeIn(clamp(s.lt / LAND))) : TOP + dip;
      brie(c, {
        x: GX, y, s: 1.45, costume: 'lion', ct: s.tc, cape: { t: s.tc }, shadow: false, wag: wag(s.tc), ear: 1,
        sq: a < 0 ? -0.34 : 0.46 * Math.exp(-a * 8) * Math.cos(a * 20),
        legs: a < 0 ? [-0.6, 0.6] : a < 0.5 ? [0.3, -0.3] : undefined,
        phase: a > 0.5 ? run(s.tc, 2) : null, amp: 1, lean: a > 0.5 ? 0.14 : 0,
        mouth: a > 0.1 ? 1 : 0.3, eyes: a < 0.1 ? 'wide' : 'happy',
        trail: a < 0 ? { dx: 0, dy: 200, n: 3 } : null,
      });
    },
    fx(c, s) {
      const a = s.lt - LAND;
      pow(c, GX, TOP - 10, 300, s.ltc - LAND, '#ffd84d', 14, 5, 0.3);
      ring(c, GX, TOP, a, 1300, '#ffffff', 0.5);
      ring(c, GX, TOP, a - 0.12, 1000, '#fff6a8', 0.5);
      for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) puff(c, GX + sd * (300 + i * 150 + (s.ltc - LAND) * 300), TOP + 30 + i * 40, (s.ltc - LAND) * 1.4, 1.3 - i * 0.3, sd + 2 + i, '#ffffff');
      for (let i = 0; i < 10; i++) {
        const u = clamp(a / 1.0);
        if (u <= 0) continue;
        const ang = -Math.PI * (0.12 + 0.76 * (i / 9));
        const d = easeOut(u) * (520 + (i % 3) * 160);
        bonbon(c, GX + Math.cos(ang) * d, TOP - 60 + Math.sin(ang) * d + u * u * 520, 30, ang + s.tc * 9, CANDY[i % 4]);
      }
      if (a > 0 && a < 0.7) bigLabel(c, 'BUM!', GX + 560, 420, 190, '#ff5d8f', a * 5, 0.1);
      wet(c, s);
    },
  };

  /* sung line 2: once round the world, then the last strike */
  const LOOP = 1.9, CX = GX, CY = 560, R = 210;
  const around = {
    t: s2, tr: 'flash', hand: 0.5, punch: 1.6,
    cam: (s) => cam(CX, CY - 20, lerp(1.0, 1.1, s.k), -s.lt * 0.07),
    bg(c, s) {
      storm(c, s.t, { speed: 50, dy: -60 });
      bolt(c, 300 + rand(Math.floor(s.lt / 0.9) + 3) * 1300, -40, 420, frac(s.lt / 0.9) * 0.9 - 0.4, Math.floor(s.lt / 0.9) * 5, 0.2, 10);
      P.globe(c, CX, CY, R, -s.t * 0.5);
    },
    cel(c, s) {
      const a = -Math.PI / 2 + easeInOut(clamp(s.lt / LOOP)) * TAU;
      for (let i = 1; i < 6; i++) {
        const b = a - i * 0.2;
        puff(c, CX + Math.cos(b) * (R + 20), CY + Math.sin(b) * (R + 20), i * 0.09 + frac(s.tc * 4) * 0.08, 0.6, i, '#ffffff');
      }
      brie(c, { x: CX + Math.cos(a) * (R - 4), y: CY + Math.sin(a) * (R - 4), rot: a + Math.PI / 2, s: 0.8, cape: { t: s.tc * 1.3 }, phase: frac(s.lt * 7), amp: 1, ear: 1, mouth: 0.7, eyes: 'happy', wag: wag(s.tc), lean: 0.2, stretch: 1.15, shadow: false });
    },
    fx(c, s) {
      const a = -Math.PI / 2 + easeInOut(clamp(s.lt / LOOP)) * TAU;
      // the speed ring she leaves round the planet
      c.strokeStyle = 'rgba(255,255,255,0.75)';
      c.lineWidth = 10;
      c.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.arc(CX, CY, R + 150 + i * 46, a - 1.5 - i * 0.2, a - 0.5 - i * 0.2);
        c.stroke();
      }
      glit(c, s, CX, CY, 520);
      wet(c, s);
    },
  };
  const finale = {
    t: s2 + LOOP, tr: 'whipU', hand: 0.4, punch: 1.6,
    impact: (s) => (s.t >= k2 && s.t < k2 + 1 / 12 ? 2 : 0),
    cam: (s) => {
      const sh = shake(s.t - k2, 34, s.d, 0.4);
      return cam(GX + 60 + sh[0], lerp(640, 560, easeInOut(clamp(s.lt / 1.4))) + sh[1], lerp(1.0, 1.26, easeInOut(clamp(s.lt / (k2 - s2 - LOOP)))), lerp(0.07, -0.03, s.k));
    },
    bg(c, s) {
      storm(c, s.t, { speed: 200, n: 12, dy: 30 });
      bolt(c, GX - 330, -40, 900, s.t - k2, 71, 0.45, 26);
      bolt(c, GX + 560, -40, 880, s.t - k2 - 0.08, 79, 0.4, 16);
      world(c, s.t, 2000, 920);
    },
    cel(c, s) {
      // proud trot on top of the world, a howl at the strike, then off she goes
      const a = s.t - k2;
      const z = zip(s.lt, { t0: s.dur - 0.24, x: GX, dir: 1, wind: 0.22, dist: 2400 });
      const howl = a > 0 && s.left > 0.46;
      if (z.gone) return;
      brie(c, {
        y: 920, s: 2.2, cape: { t: s.tc * 1.4 }, wag: wag(s.tc), shadow: false,
        phase: run(s.tc, 2), amp: 0.9, ear: 0.9, lean: 0.1, mouth: 0.6, eyes: blink(s.tc, 3) ? 'closed' : 'happy',
        ...(howl ? { phase: null, lean: -0.1, mouth: 1, eyes: 'closed', pitch: -0.3, sq: -0.08 + 0.03 * Math.sin(s.tc * 40) } : {}),
        ...z,
      });
    },
    fx(c, s) {
      const a = s.t - k2;
      for (let i = 0; i < 3; i++) ring(c, GX + 150, 560, a - i * 0.16, 1200, '#fff6a8', 0.6);
      if (a > 0 && a < 0.7) bigLabel(c, 'TROVÃO!', GX + 520, 300, 170, '#ffd84d', a * 5, 0.1);
      if (s.left < 0.26) puff(c, GX - 60, 920, 0.26 - s.left, 2.4, 3, '#ffffff');
      speedLines(c, s.tc, 0.6, -1, 'rgba(255,255,255,0.55)', 120, 900);
      glit(c, s, GX, 560, 460);
      wet(c, s);
    },
  };

  return { from, to, shots: [cabbage, worm, lion, globeRun, hero, airCabbage, airWorm, landLion, around, finale] };
}

export const thunder1 = makeThunder({ from: 77.84, to: 92.04, w1: [77.86, 78.52, 79.7], s1: 80.98, k1: 84.19, w2: [85, 85.7, 86.82], s2: 88.16, k2: 91.6, fin: false });
export const thunder2 = makeThunder({ from: 156.94, to: 172.24, w1: [157, 157.64, 158.82], s1: 160.2, k1: 163.41, w2: [164.18, 164.88, 165.78], s2: 167.52, k2: 171.31, fin: true });
