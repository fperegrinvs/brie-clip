// Chorus (1:03 and the final one at 2:22): a cut per line.
import { sunburst, focusLines, speedLines, hearts, confetti, sparkles } from '../../fx.js';
import { blob, fillStroke } from '../../util.js';
import { bigLabel, COMIC } from '../../text.js';
import * as P from '../../props.js';
import { brie, jump } from '../actor.js';
import { cam, crash, shake } from '../camera.js';
import { W, H, FY, INK, TAU, clamp, lerp, easeOut, easeIn, easeInOut, easeOutBack, key, run, wag, blink, room, livingRoom, puff, ring, pow, frac } from '../kit.js';

const BEAT = 0.449;
const screen = (c, fn) => {
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  fn();
  c.restore();
};
// pseudo-3D lap around a centre piece
function orbit(th, cx = W / 2, cy = 880, R = 640, r = 120) {
  const depth = Math.sin(th);
  return { x: cx + Math.cos(th) * R, y: cy + depth * r, depth, scl: lerp(0.62, 1.05, (depth + 1) / 2), dir: -Math.sin(th) > 0 ? 1 : -1 };
}
function disco(c, t) {
  screen(c, () => {
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const a = Math.sin(t * 1.3 + i * 1.7) * 0.6;
      c.fillStyle = ['rgba(255,80,160,0.2)', 'rgba(80,200,255,0.2)', 'rgba(255,230,80,0.2)', 'rgba(120,255,140,0.2)', 'rgba(190,120,255,0.2)'][i];
      c.beginPath();
      const ox = 300 + i * 330;
      c.moveTo(ox, -20);
      c.lineTo(ox + Math.sin(a) * 900 - 200, H + 50);
      c.lineTo(ox + Math.sin(a) * 900 + 200, H + 50);
      c.closePath();
      c.fill();
    }
    c.globalCompositeOperation = 'source-over';
    c.save();
    c.translate(W / 2, 80);
    c.beginPath();
    c.arc(0, 0, 60, 0, TAU);
    fillStroke(c, '#d7dbea', INK, 6);
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 12; i++) {
      const a = t * 2 + i;
      c.globalAlpha = 0.5 + 0.5 * Math.sin(a * 3);
      c.fillRect(Math.cos(a) * 40 - 6, Math.sin(i) * 40 - 6, 12, 12);
    }
    c.restore();
  });
}
function stool(c, x) {
  c.fillStyle = '#ff8db5';
  c.strokeStyle = INK;
  c.lineWidth = 12;
  for (const [dx, lean] of [[-110, -40], [110, 40]]) {
    c.beginPath();
    c.moveTo(x + dx - 26, 330);
    c.lineTo(x + dx + 26, 330);
    c.lineTo(x + dx + lean + 26, 1200);
    c.lineTo(x + dx + lean - 26, 1200);
    c.closePath();
    c.fill();
    c.stroke();
  }
  c.beginPath();
  c.roundRect(x - 150, 690, 300, 36, 12);
  c.fill();
  c.stroke();
  c.beginPath();
  c.ellipse(x, 300, 250, 70, 0, 0, TAU);
  fillStroke(c, '#ffffff', INK, 12);
}

export function makeChorus({ from, to, L, fin }) {
  const [L0, L1, L2, L3] = L;
  const rotx = fin ? 1 : 0; // the last chorus leans into dutch angles
  const wear = (i) => (fin ? { costume: ['cabbage', 'worm', 'lion', 'croc'][i % 4] } : {});
  const party = (c, s) => {
    if (!fin) return;
    disco(c, s.t);
    screen(c, () => confetti(c, s.t - from, 140, 4, 1));
  };

  /* line 1: corre pela cozinha */
  const LAP = 1.75;
  const orbitWide = {
    t: from, tr: 'flash', hand: 0.6, punch: 1.6,
    cam: (s) => cam(W / 2, lerp(560, 600, s.k), lerp(1.0, 1.14, easeInOut(s.k)), Math.sin(s.lt * 2.2) * 0.03 + rotx * 0.07),
    bg: (c, s) => room(c, 'kitchen', 200, s.t),
    cel(c, s) {
      const th = (s.lt / LAP) * TAU + Math.PI / 2;
      const o = orbit(th);
      const dog = () => {
        brie(c, { x: o.x, y: o.y, s: o.scl * 1.05, dir: o.dir, phase: run(s.tc, 2), amp: 1, ear: 1, mouth: 0.6, eyes: 'happy', wag: wag(s.tc), lean: 0.16, trail: { dx: o.dir * 70 * o.scl, dy: 0, n: 3 }, ...wear(0), ct: s.tc });
        for (let i = 1; i < 4; i++) {
          const b = orbit(th - i * 0.16);
          puff(c, b.x, b.y, i * 0.1 + frac(s.tc * 4) * 0.08, 0.6 * b.scl, i, '#ffffff');
        }
      };
      if (o.depth < 0) dog();
      // the island shudders as she passes
      c.save();
      c.translate(0, Math.abs(Math.cos(th)) > 0.8 ? (s.d % 2 ? -8 : 0) : 0);
      P.island(c, W / 2, 760);
      c.restore();
      if (o.depth >= 0) dog();
    },
    fx(c, s) {
      const fl = frac(s.lt / LAP + 0.2);
      if (fl < 0.4) {
        c.globalAlpha = 1 - fl / 0.4;
        blob(c, [[W / 2 + 175, 560 - fl * 200, 60 + fl * 120], [W / 2 + 100, 520 - fl * 160, 45 + fl * 90], [W / 2 + 250, 510 - fl * 220, 40 + fl * 90]], '#ffffff', 4);
        c.globalAlpha = 1;
      }
      speedLines(c, s.tc, 0.4, 1, 'rgba(255,255,255,0.7)', 0, 460);
      party(c, s);
    },
  };
  const floorTrack = {
    t: L0 + 1.78, tr: 'whipR', hand: 1, punch: 1.6,
    cam: (s) => cam(W / 2 + 40, 720, 1.3, -0.04 - rotx * 0.05),
    bg: (c, s) => room(c, 'kitchen', 700 + s.lt * 1700, s.t),
    cel(c, s) {
      brie(c, { x: 880 + Math.sin(s.lt * 3) * 70, y: 965, s: 1.45, phase: run(s.tc, 2), amp: 1, ear: 1, mouth: 0.8, eyes: blink(s.tc, 5) ? 'closed' : 'happy', wag: wag(s.tc), lean: 0.22, ...wear(1), ct: s.tc });
    },
    fx(c, s) {
      speedLines(c, s.tc, 0.9, -1, 'rgba(255,255,255,0.8)', 520, 1010);
      for (let i = 1; i < 4; i++) puff(c, 880 - i * 200, 972, i * 0.11 + frac(s.tc * 4) * 0.1, 0.7, i + s.d, '#f6e2c8');
      for (let i = 0; i < 2; i++) stool(c, W + 600 - frac(s.lt * 0.8 + i * 0.5 + 0.2) * (W + 1300));
      party(c, s);
    },
  };

  /* line 2: pim pim, pim pinha, nossa pequenina */
  const HOPX = [520, 1400, 760, 1160, 960];
  const hops = {
    t: L1, tr: 'flash', hand: 0.5, punch: 2,
    cam: (s) => cam(W / 2, 560, 1.03, (Math.floor(s.lt / BEAT) % 2 ? 0.035 : -0.035) * (1 + rotx)),
    bg(c, s) {
      c.fillStyle = '#ffd1e3';
      c.fillRect(-300, -300, W + 600, H + 600);
      sunburst(c, s.tc, W / 2, 620, '#fff0f6', '#ffc2da', 16, 0.5);
    },
    cel(c, s) {
      const n = Math.min(3, Math.floor(s.lt / BEAT));
      const j = jump(s.lt, { t0: n * BEAT + 0.1, dur: BEAT - 0.16, from: [HOPX[n], 960], to: [HOPX[n + 1], 960], h: 300, pre: 0.1 });
      brie(c, { view: 'front', x: j.x, y: j.y, ground: 960, s: 1.7, sq: j.sq, expr: j.air ? 'shout' : 'happy', tilt: (n % 2 ? -1 : 1) * 0.16, dir: n % 2 ? -1 : 1, wag: wag(s.tc), earFlop: j.air ? 1.3 : 0.2, ...wear(n), ct: s.tc });
    },
    fx(c, s) {
      for (let n = 0; n < 4; n++) {
        const age = s.lt - n * BEAT;
        ring(c, HOPX[n], 955, age, 320, '#ffffff', 0.3);
        if (age >= 0 && age < BEAT * 1.6) bigLabel(c, n === 3 ? 'PINHA!' : 'PIM!', HOPX[n] + (n % 2 ? 230 : -230), 330 + (n % 2) * 90, 120, ['#ff5d8f', '#4cc3ff', '#ffd84d', '#37c45c'][n], age * 4, n % 2 ? 0.12 : -0.12);
      }
      party(c, s);
    },
  };
  const tiny = {
    t: L1 + BEAT * 4, hand: 0.2, punch: 0.6,
    cam: (s) => cam(W / 2, H / 2, lerp(1.0, 1.1, easeInOut(s.k)), rotx * 0.04),
    bg(c, s) {
      c.fillStyle = '#fff0f6';
      c.fillRect(-300, -300, W + 600, H + 600);
      sunburst(c, s.t, W / 2, 560, 'rgba(255,255,255,0.8)', 'rgba(255,209,227,0.6)', 16, 0.1);
    },
    cel(c, s) {
      // tiny Brie in a big frame, then a look to camera and a wind-up for the zoomies
      const wind = clamp((s.left - 0.05) / 0.3);
      const a = clamp((s.ltc - 0.1) / 0.25);
      brie(c, { view: 'front', x: W / 2, y: 900, s: lerp(0.5, 1.9, easeOutBack(a)), expr: s.left < 0.36 ? 'shout' : 'innocent', fEyes: blink(s.tc, 6) ? 'closed' : undefined, tilt: key(s.ltc, [[0.5, 0], [0.75, 0.18, 'back'], [1.15, -0.14, 'back']]), sq: s.left < 0.36 ? 0.3 * (1 - wind) : 0, wag: wag(s.tc), earFlop: 0.25 });
    },
    fx(c, s) {
      hearts(c, s.tc, 16, 9);
      sparkles(c, s.tc, W / 2, 560, 620, 14, 4, '#ffffff');
      party(c, s);
    },
  };

  /* line 3: zoomies, zoomies, quem vai segurar? */
  const PASS = 0.5;
  const zoomies = {
    t: L2, tr: 'whipR', hand: 1.2, punch: 2,
    cam: (s) => cam(W / 2, 560, 1.03, (Math.floor(s.lt / PASS) % 2 ? 0.05 : -0.05) * (1 + rotx * 0.6)),
    bg: (c, s) => room(c, 'kitchen', 1500, s.t),
    cel(c, s) {
      const n = Math.min(2, Math.floor(s.lt / PASS));
      const u = clamp((s.lt - n * PASS) / (PASS - 0.04));
      const dir = n % 2 ? -1 : 1;
      const sc = [0.8, 1.25, 2.0][n];
      const x = dir > 0 ? lerp(-500 * sc, W + 500 * sc, u) : lerp(W + 500 * sc, -500 * sc, u);
      brie(c, { x, y: [860, 960, 1130][n], dir, s: sc, phase: frac(s.lt * 9), amp: 1, ear: 1, mouth: 0.8, eyes: 'happy', wag: wag(s.tc), lean: 0.3, stretch: 1.5, trail: { dx: dir * 150 * sc, dy: 0, n: 4 }, ...wear(n), ct: s.tc });
    },
    fx(c, s) {
      const n = Math.min(2, Math.floor(s.lt / PASS));
      speedLines(c, s.tc, 1, n % 2 ? -1 : 1);
      bigLabel(c, 'ZOOM!', [520, 1400, 960][n], [330, 300, 260][n], [110, 140, 190][n], ['#4cc3ff', '#ffd84d', '#ff5d8f'][n], (s.lt - n * PASS) * 5, n % 2 ? 0.1 : -0.1);
      party(c, s);
    },
  };
  // "quem vai segurar?" ... the plush toys link up across the kitchen, and go flying like bowling pins
  const HIT = 0.5, TOYR = 92, TOYG = 960 - TOYR * 1.2;
  const WALL = [
    { x: 1060, kind: 'toast', vx: -400, h: 330, spin: -9, T: 0.92 },
    { x: 1210, kind: 'onigiri', vx: -200, h: 430, spin: 11, T: 1.04 },
    { x: 1360, kind: 'milk', vx: -20, h: 400, spin: -13, T: 0.98 },
    { x: 1510, kind: 'sunny', vx: 110, h: 300, spin: 8, T: 0.86 },
  ];
  const toy = (c, s, w, i) => {
    const a = s.lt - HIT - i * 0.025;
    c.save();
    if (a < 0) {
      // bracing: lean into it, knees knocking
      const fear = clamp((s.lt - 0.1) / 0.3);
      c.translate(w.x + Math.sin(s.tc * 60 + i * 2) * 5 * fear, TOYG - 14 * Math.abs(Math.sin(s.tc * 9 + i)) * (1 - fear));
      c.rotate(-0.12 * fear);
    } else if (a < w.T) {
      const u = a / w.T;
      c.translate(w.x + w.vx * u, TOYG - w.h * 4 * u * (1 - u));
      c.rotate(w.spin * u * (1 - 0.35 * u));
      c.scale(1.08, 1.08);
    } else {
      // plop: land on their feet with a wobble
      const b = a - w.T;
      c.translate(w.x + w.vx, TOYG - 40 * Math.abs(Math.sin(b * 11)) * Math.exp(-b * 6));
      c.rotate(0.22 * Math.sin(b * 13 + i) * Math.exp(-b * 3));
      c.scale(1 + 0.16 * Math.exp(-b * 12), 1 - 0.16 * Math.exp(-b * 12));
    }
    P.plushToy(c, w.kind, TOYR);
    c.restore();
  };
  const brieX = (lt) => lerp(-420, 2700, clamp((lt - 0.12) / 0.66));
  const grab = {
    t: L2 + PASS * 3, hand: 0.4,
    cam: (s) => {
      const sh = shake(s.lt - HIT, 30, s.d, 0.3);
      return cam(W / 2 + 60 + sh[0], 620 + sh[1], crash(s.lt, 1.08, 1.22, HIT, 2), rotx * -0.05);
    },
    bg: (c, s) => room(c, 'kitchen', 2400, s.t),
    cel(c, s) {
      WALL.forEach((w, i) => s.lt - HIT - i * 0.025 < 0 && toy(c, s, w, i));
      const x = brieX(s.lt);
      if (x < 2600) {
        brie(c, {
          x, y: 960, s: 1.3, phase: frac(s.lt * 9), amp: 1, ear: 1, mouth: 0.8, eyes: 'happy', wag: wag(s.tc),
          lean: 0.3, stretch: 1.5, trail: { dx: 190, dy: 0, n: 4 },
        });
      }
      WALL.forEach((w, i) => s.lt - HIT - i * 0.025 >= 0 && toy(c, s, w, i));
    },
    fx(c, s) {
      pow(c, 1285, 900, 190, s.ltc - HIT, '#ffd84d', 12, 3, 0.28);
      ring(c, 1270, 950, s.lt - HIT, 700, '#ffffff', 0.35);
      puff(c, 1150, 960, s.ltc - HIT, 1.2, 2, '#f6e2c8');
      if (s.lt > 0.12) speedLines(c, s.tc, clamp(1 - (s.lt - HIT) / 0.6), 1);
      // dizzy stars over each toy once it has landed
      WALL.forEach((w, i) => {
        const b = s.ltc - HIT - i * 0.025 - w.T;
        if (b > 0) sparkles(c, s.tc, w.x + w.vx, TOYG - TOYR * 1.5, 70, 3, i * 5 + 2, '#ffd84d');
      });
      if (s.lt > HIT + 0.12) bigLabel(c, 'NINGUÉM!', 690, 350, 120, '#ff5d8f', (s.lt - HIT - 0.12) * 3, -0.08);
      party(c, s);
    },
  };

  /* line 4: três voltas pela sala */
  const D = (to - L3) / 3;
  const lap = (n) => ({
    t: L3 + n * D, tr: n ? 'whipR' : 'flash', hand: 0.6 + n * 0.4, punch: 2,
    cam: (s) => {
      const o = orbit((s.lt / D) * TAU + Math.PI / 2, W / 2, 880, 600, 130);
      return cam(lerp(W / 2, o.x, [0, 0.25, 0.4][n]), [560, 600, 640][n], [1.0, 1.2, 1.4][n], [0, 0.07, -0.1][n] + rotx * 0.05 * (n % 2 ? -1 : 1) + Math.sin(s.lt * 5) * 0.012 * n);
    },
    bg(c, s) {
      room(c, 'living', 0, s.t, false);
      P.furniture(c, 'window', 140, FY, s.t);
      P.furniture(c, 'frame', 1180, FY, s.t);
      // the rug spins a little faster every lap
      c.save();
      c.translate(W / 2, 880);
      c.beginPath();
      c.ellipse(0, 0, 720, 170, 0, 0, TAU);
      fillStroke(c, '#ffb3cf', INK, 6);
      c.lineWidth = 10;
      c.strokeStyle = '#ffffff';
      c.beginPath();
      c.ellipse(0, 0, 600, 120, 0, 0, TAU);
      c.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU - s.tc * (1 + n * 2);
        c.beginPath();
        c.moveTo(Math.cos(a) * 610, Math.sin(a) * 124);
        c.lineTo(Math.cos(a) * 710, Math.sin(a) * 166);
        c.stroke();
      }
      c.restore();
    },
    cel(c, s) {
      const th = (s.lt / D) * TAU + Math.PI / 2;
      const o = orbit(th, W / 2, 880, 600, 130);
      // lamp and plant swing in her wake
      const sway = (x) => (0.06 + n * 0.07) * Math.sin(s.tc * (9 + n * 3) + x) * (1 + (Math.abs(o.x - x) < 400 ? 1 : 0));
      for (const [type, x, half] of [['lamp', 1580, 60], ['plant', 1760, 80]]) {
        c.save();
        c.translate(x + half, FY);
        c.rotate(sway(x));
        c.translate(-x - half, -FY - (n === 2 ? Math.abs(Math.sin(s.tc * 12 + x)) * 40 : 0));
        P.furniture(c, type, x, FY, s.tc);
        c.restore();
      }
      const dog = () => {
        for (let i = 1; i < 4; i++) {
          const b = orbit(th - i * 0.17, W / 2, 880, 600, 130);
          puff(c, b.x, b.y, i * 0.1 + frac(s.tc * 4) * 0.08, 0.7 * b.scl, i, '#ffffff');
        }
        brie(c, { x: o.x, y: o.y, s: o.scl * 1.1, dir: o.dir, phase: frac(s.lt * (6 + n * 2)), amp: 1, ear: 1, mouth: 0.8, eyes: 'happy', wag: wag(s.tc), lean: 0.2 + n * 0.08, stretch: 1 + n * 0.18, trail: { dx: o.dir * (60 + n * 40) * o.scl, dy: 0, n: 3 }, ...wear(n), ct: s.tc });
      };
      if (o.depth < 0) dog();
      c.save();
      c.translate(W / 2, FY + 20);
      c.rotate(n * 0.03 * Math.sin(s.tc * 14));
      c.translate(0, -(n === 2 ? Math.abs(Math.sin(s.tc * 12)) * 26 : 0));
      P.furniture(c, 'sofa', -312, 0, s.tc);
      c.restore();
      if (o.depth >= 0) dog();
      if (n === 2) ['toast', 'sunny', 'milk', 'birdie'].forEach((k, i) => {
        const b = orbit(th - 0.7 - i * 0.5, W / 2, 620 - i * 60, 660, 100);
        c.save();
        c.translate(b.x, b.y);
        c.rotate(s.tc * 9 + i);
        P.plushToy(c, k, 56);
        c.restore();
      });
    },
    fx(c, s) {
      speedLines(c, s.tc, 0.4 + n * 0.3, 1, 'rgba(255,255,255,0.75)', 0, 520);
      screen(c, () => {
        bigLabel(c, `${n + 1}${n === 2 ? '!!!' : ''}`, 1640, 250, 230 + n * 30, ['#ffd84d', '#4cc3ff', '#ff5d8f'][n], s.lt * 4, 0.1);
        if (s.lt > 0.12) {
          c.font = `64px ${COMIC}`;
          c.textAlign = 'center';
          c.lineWidth = 12;
          c.strokeStyle = '#ffffff';
          c.strokeText('VOLTA', 1640, 410);
          c.fillStyle = INK;
          c.fillText('VOLTA', 1640, 410);
        }
      });
      party(c, s);
    },
  });

  return { from, to, shots: [orbitWide, floorTrack, hops, tiny, zoomies, grab, lap(0), lap(1), lap(2)] };
}

export const chorus1 = makeChorus({ from: 63.34, to: 77.84, L: [63.38, 66.92, 70.62, 73.96], fin: false });
export const chorus2 = makeChorus({ from: 142.64, to: 156.94, L: [142.7, 146.06, 149.76, 153.14], fin: true });
