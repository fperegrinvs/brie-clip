// Outro (2:52), the four hero poses (3:02), the parade (3:08) and the goodnight iris (3:27).
import { sky, sunburst, twinkleStars, confetti, firework, sparkles, speedLines, focusLines, halftone } from '../../fx.js';
import { fillStroke, clover } from '../../util.js';
import { bigLabel, COMIC, logo } from '../../text.js';
import { drawSeatedCrown } from '../../bree.js';
import * as P from '../../props.js';
import { brie, skid } from '../actor.js';
import { cam, crash, shake } from '../camera.js';
import { W, H, INK, TAU, clamp, lerp, easeOut, easeIn, easeInOut, easeOutBack, key, wag, blink, run, puff, ring, pow, frac, rand, lerpColor } from '../kit.js';

const screen = (c, fn) => {
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  fn();
  c.restore();
};
const about = (c, x, y, k) => {
  c.translate(x, y);
  c.scale(k, k);
  c.translate(-x, -y);
};
const FW = ['#ffd84d', '#ff5d8f', '#4cc3ff', '#5fd77a', '#b77dff'];

/* =====================================================================
 * OUTRO: sunset over Cloverleaf
 * ===================================================================== */
const HILL = 905, BX = 1180;
function sunsetSky(c, t, sunY = 330, sunX = 1500, sunR = 120) {
  sky(c, '#ff9ec4', '#ffe0a8');
  P.sun(c, sunX, sunY, sunR, t);
  P.clouds(c, t, 0, 0.1, 140, 0.9);
  P.hills(c, 0, 720, 50, '#c4b0ff', 0, 2);
}
function sunsetLand(c, t) {
  P.castle(c, 700, 760, 0.8, { t });
  P.hills(c, 0, 880, 50, '#7ad46a', 0, 4, true);
}

// 1 · she gallops up the hill, the camera cranes up and back to find the castle
const crane = {
  t: 172.24, tr: 'flash', wash: 0.6, hand: 0.25, punch: 0.5,
  cam: (s) => {
    const e = easeInOut(clamp((s.lt - 0.5) / 2.3));
    const bx = lerp(260, BX, easeOut(clamp(s.lt / 2.6)));
    return cam(lerp(bx + 120, W / 2, e), lerp(800, 540, e), lerp(1.75, 1.0, e), lerp(-0.03, 0, e));
  },
  bg(c, s) {
    sunsetSky(c, s.t, lerp(250, 340, clamp(s.lt / 3.4)));
    sunsetLand(c, s.t);
  },
  cel(c, s) {
    const k = skid(s.lt, { t0: 2.15, dur: 0.45, x0: 0, x1: 1, dir: 1 });
    const x = s.lt < 2.15 ? lerp(-140, BX - 190, s.lt / 2.15) : lerp(BX - 190, BX, easeOut(clamp((s.lt - 2.15) / 0.45)));
    if (s.lt < 2.15) brie(c, { x, y: HILL, s: 0.8, phase: run(s.tc, 2), amp: 1, ear: 0.9, lean: 0.14, wag: wag(s.tc), mouth: 0.6, eyes: 'happy', stretch: 1.08, trail: { dx: 46, n: 2 } });
    else brie(c, { ...k, x, y: HILL, s: 0.8, wag: wag(s.tc), ...(s.lt > 2.7 ? { eyes: 'happy', mouth: 0.5, headTilt: -0.2, ear: 0.2 } : {}) });
  },
  fx(c, s) {
    if (s.lt < 2.6) for (let i = 0; i < 6; i++) {
      const born = 0.25 + i * 0.36;
      puff(c, lerp(-140, BX - 190, born / 2.15) - 40, HILL + 2, s.ltc - born, 0.6, i, '#eaf8d8');
    }
    if (s.lt > 2.9) sparkles(c, s.tc, BX + 90, HILL - 190, 150, 8, 4, '#fff6a8');
  },
};

// 2 · the crown drops out of the sky and settles with a bounce
const CROWN_HIT = 0.95;
const crowning = {
  t: 175.7, tr: 'cut', wash: 0.6, hand: 0.3, punch: 0.5,
  cam: (s) => {
    const sh = shake(s.lt - CROWN_HIT, 14, s.d, 0.3);
    return cam(BX + sh[0], lerp(740, 720, easeInOut(s.k)) + sh[1], lerp(2.05, 2.25, easeInOut(s.k)), 0);
  },
  bg(c, s) {
    sunsetSky(c, s.t, 660, BX + 30, 190);
    c.save();
    c.globalAlpha = 0.5;
    sunburst(c, s.t, BX + 30, 660, 'rgba(255,246,190,0.55)', 'rgba(255,246,190,0)', 16, 0.25);
    c.restore();
    sunsetLand(c, s.t);
  },
  cel(c, s) {
    const a = s.lt - CROWN_HIT;
    const sq = a < 0 ? -0.05 * clamp((s.lt - 0.3) / 0.5) : 0.3 * Math.exp(-a * 7) * Math.cos(a * 19);
    const on = a >= 0.62;
    const waiting = a < 0;
    brie(c, {
      view: 'front', x: BX, y: HILL, s: 0.8, sq, wag: wag(s.tc), crown: on,
      expr: waiting ? 'innocent' : 'happy', fEyes: waiting ? 'wide' : a < 0.5 ? 'closed' : blink(s.t, 3) ? 'closed' : 'happy',
      fMouth: waiting ? 0.25 : a < 0.5 ? 0.2 : 0.8, tilt: waiting ? 0 : Math.sin(s.tc * 3) * 0.06, earFlop: a > 0 && a < 0.4 ? 1 : 0.3,
    });
    if (!on) {
      // falls, bonks, hops once, sits
      const seat = HILL - 272 * 0.8 * (1 - sq);
      let y, rot;
      if (a < 0) {
        const u = clamp((s.lt - 0.45) / (CROWN_HIT - 0.45));
        y = seat - 620 * (1 - easeIn(u));
        rot = (1 - u) * 2.2;
      } else {
        const u = a / 0.62;
        y = seat - 4 * u * (1 - u) * 130;
        rot = 0.35 * Math.sin(u * Math.PI) * (1 - u);
      }
      if (s.lt > 0.45) drawSeatedCrown(c, BX, y, 0.8, rot);
    }
  },
  fx(c, s) {
    const a = s.ltc - CROWN_HIT;
    pow(c, BX, HILL - 262, 46, a, '#ffd84d', 10, 2, 0.3);
    ring(c, BX, HILL - 215, a - 0.62, 190, '#fff6a8', 0.4);
    if (a > 0 && a < 0.5) bigLabel(c, 'PLIM!', BX + 250, HILL - 290, 60, '#ffd84d', a * 5, 0.12);
    if (a > 0.62) sparkles(c, s.tc, BX, HILL - 250, 110, 10, 7, '#fff6a8');
    if (s.lt > 0.3 && a < 0) {
      // the shine she is looking up at
      c.save();
      c.globalAlpha = 0.6 * clamp((s.lt - 0.3) / 0.2);
      c.fillStyle = '#fff6a8';
      c.beginPath();
      c.moveTo(BX - 26, 380);
      c.lineTo(BX + 26, 380);
      c.lineTo(BX + 70, HILL - 230);
      c.lineTo(BX - 70, HILL - 230);
      c.fill();
      c.restore();
    }
  },
};

// 3 · "pequena no tamanho": the camera falls back until she is a dot with a crown
const small = {
  t: 178.98, tr: 'cut', wash: 0.6, hand: 0.25, punch: 0.4,
  cam: (s) => cam(BX, 780, crash(s.lt, 2.6, 1.0, 0.12, 3), 0),
  bg(c, s) {
    sunsetSky(c, s.t, 340);
    sunsetLand(c, s.t);
  },
  cel(c, s) {
    brie(c, { view: 'front', x: BX, y: HILL, s: 0.42, crown: true, expr: 'happy', fEyes: blink(s.t, 5) ? 'closed' : 'open', fMouth: 0.3, wag: wag(s.tc), tilt: Math.sin(s.tc * 4) * 0.08 });
  },
  fx(c, s) {
    // a ruler somebody held up next to her
    const a = clamp((s.lt - 0.5) / 0.25);
    if (a <= 0) return;
    c.save();
    c.translate(BX + 96, HILL);
    c.strokeStyle = INK;
    c.lineWidth = 5;
    c.lineCap = 'round';
    const h = 132 * easeOutBack(a);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(0, -h);
    for (let i = 0; i <= 4; i++) {
      c.moveTo(-12, -h * i / 4);
      c.lineTo(12, -h * i / 4);
    }
    c.stroke();
    c.restore();
    if (s.lt > 0.8) bigLabel(c, 'pequenina...', BX + 380, HILL - 170, 84, '#ffffff', (s.lt - 0.8) * 4, -0.05);
  },
};

// 4 · "gigante de energia": she comes up behind the castle like a friendly kaiju
const GX = 1270, GS = 3.9;
const giant = {
  t: 180.72, tr: 'impact', wash: 0.5, hand: 0.5, punch: 1.6,
  cam: (s) => {
    const sh = shake(s.lt - 0.1, 30, s.d, 0.5);
    return cam(W / 2 + sh[0], 540 + sh[1], lerp(1.0, 1.07, easeOut(s.k)), -0.035);
  },
  tint: (s) => [1.04, 1.0, 0.9],
  bg(c, s) {
    sunsetSky(c, s.t, 340, 400, 100);
    const g = c.createRadialGradient(GX, 520, 60, GX, 520, 900);
    g.addColorStop(0, 'rgba(255,238,120,0.85)');
    g.addColorStop(1, 'rgba(255,238,120,0)');
    c.fillStyle = g;
    c.fillRect(-200, -200, W + 400, H + 400);
    c.save();
    c.globalAlpha = 0.7;
    sunburst(c, s.t, GX, 560, 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0)', 18, 0.5);
    c.restore();
  },
  cel(c, s) {
    const up = easeOutBack(clamp(s.lt / 0.38));
    const a = s.lt - 0.38;
    brie(c, {
      view: 'front', x: GX, y: 1420 + (1 - up) * 1000, s: GS, crown: true, shadow: false,
      expr: 'shout', fEyes: s.lt > 0.55 ? 'happy' : 'closed', fMouth: 0.75 + 0.25 * Math.sin(s.tc * 20), earFlop: 0.7,
      sq: a > 0 ? 0.08 * Math.exp(-a * 5) * Math.cos(a * 18) : 0, tilt: Math.sin(s.tc * 2.2) * 0.05, wag: wag(s.tc),
    });
    sunsetLand(c, s.t);
  },
  fx(c, s) {
    focusLines(c, s.tc, GX, 600, 0.55, 'rgba(255,246,170,0.8)', 520);
    sparkles(c, s.tc, GX, 560, 620, 22, 11, '#fff27a');
    for (const x of [820, 1720]) puff(c, x, 890, s.ltc - 0.05, 1.2, x, '#eaf8d8');
  },
};

/* =====================================================================
 * FINALE: four smash-cut hero poses, one per shout
 * ===================================================================== */
function fest(c, t, lt, n = 6, seed = 0) {
  sky(c, '#2a1a5e', '#ff7da5');
  sunburst(c, t, W / 2, H * 0.62, 'rgba(255,230,120,0.35)', 'rgba(255,230,120,0)', 20, 0.4);
  for (let i = 0; i < n; i++) {
    const age = frac((lt + i * 0.47 + seed * 0.2) / 1.9) * 1.9;
    const cyc = Math.floor((lt + i * 0.47 + seed * 0.2) / 1.9);
    firework(c, 160 + rand(i * 3.1 + cyc + seed) * (W - 320), 130 + rand(i * 5.7 + cyc * 2 + seed) * 330, age, i + cyc * 7 + seed, FW[(i + cyc) % 4]);
  }
}
const topWord = (x = 0.5, y = 0.15, r = -0.04, k = 1) => () => [x, y, r, k];

const pose1 = {
  t: 182.44, tr: 'impact', wash: 0.4, hand: 0.4, punch: 1.6,
  wordAt: topWord(0.5, 0.15, -0.04),
  cam: (s) => {
    const sh = shake(s.lt - 0.2, 26, s.d, 0.4);
    return cam(W / 2 + sh[0], 560 + sh[1], lerp(1.12, 1.0, easeOut(clamp(s.lt / 0.5))) + 0.03 * s.k, 0.03);
  },
  bg: (c, s) => fest(c, s.t, s.lt, 6, 0),
  cel(c, s) {
    const up = easeOutBack(clamp(s.lt / 0.22));
    const a = s.lt - 0.22;
    const hop = a > 0.9 ? 70 * Math.abs(Math.sin((a - 0.9) * 7)) : 0;
    brie(c, {
      view: 'front', x: W / 2, y: 1030 + (1 - up) * 700 - hop, ground: 1030, s: 1.85, crown: true, earFlop: 0.7,
      expr: a < 0.9 ? 'shout' : 'happy', sq: a > 0 ? 0.2 * Math.exp(-a * 7) * Math.cos(a * 20) : -0.2, wag: wag(s.tc), tilt: Math.sin(s.tc * 3) * 0.05,
    });
  },
  fx(c, s) {
    confetti(c, s.lt, 120, 7, 1);
    pow(c, W / 2, 1030, 260, s.ltc - 0.2, '#ffd84d', 14, 1, 0.4);
    for (const d of [-1, 1]) puff(c, W / 2 + d * 330, 1034, s.ltc - 0.22, 1.2, d + 2, '#ffe9f3');
  },
};

const pose2 = {
  t: 184.5, tr: 'impact', wash: 0.4, hand: 0.5, punch: 1.6,
  wordAt: topWord(0.5, 0.15, 0.03, 0.9),
  cam: (s) => cam(W / 2 + 40 * s.k, 560, lerp(1.1, 1.0, easeOut(clamp(s.lt / 0.4))), -0.1),
  bg(c, s) {
    fest(c, s.t, s.lt, 5, 3);
    c.save();
    c.globalAlpha = 0.5;
    halftone(c, '#ff9ec4', 40, 11);
    c.restore();
    speedLines(c, s.tc, 0.8, -1, 'rgba(255,255,255,0.55)', 250, 1000);
  },
  cel(c, s) {
    // frozen at the top of the leap, drifting like a held drawing
    const k = easeOut(clamp(s.lt / 1.9));
    brie(c, {
      x: lerp(700, 960, k), y: 950 - 50 * Math.sin(k * Math.PI), s: 2.0, shadow: false, legs: [-1, 1], pitch: -0.16, ear: 1, mouth: 0.85, eyes: 'happy',
      cape: { t: s.tc * 1.5 }, crown: true, wag: wag(s.tc), stretch: 1.06, trail: { dx: 80 * (1 - k * 0.6), dy: 8, n: 3, color: '#ffe9a8' },
    });
  },
  fx(c, s) {
    confetti(c, s.lt + 2, 90, 9, 1);
    sparkles(c, s.tc, 1000, 520, 480, 14, 9, '#fff6a8');
  },
};

const pose3 = {
  t: 186.42, tr: 'impact', wash: 0.35, hand: 0.4, punch: 1.8,
  wordAt: topWord(0.3, 0.2, -0.09, 0.9),
  cam: (s) => cam(W / 2, 540, crash(s.lt, 0.86, 1.0, 0, 3), 0.05),
  bg(c, s) {
    sky(c, '#ff5d8f', '#ffd84d');
    sunburst(c, s.t, 1180, 660, 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)', 22, 1.2);
    c.save();
    c.globalAlpha = 0.5;
    halftone(c, '#ffffff', 44, 12);
    c.restore();
  },
  cel(c, s) {
    brie(c, { view: 'head', x: 1180, y: 700, s: 2.9, expr: 'shout', fEyes: 'happy', fMouth: 0.8 + 0.2 * Math.sin(s.tc * 22), crown: true, earFlop: 0.8, tilt: -0.1 + Math.sin(s.tc * 5) * 0.04, rot: 0 });
  },
  fx(c, s) {
    focusLines(c, s.tc, 1180, 700, 0.7, 'rgba(255,255,255,0.85)', 560);
  },
};

const GANG = [['lion', 250, 0.95], ['cabbage', 540, 0.85], ['cheese', 1380, 0.85], ['croc', 1670, 0.95]];
const pose4 = {
  t: 187.1, tr: 'impact', wash: 0.4, hand: 0.4, punch: 1.8,
  wordAt: topWord(0.5, 0.14, -0.03, 0.9),
  cam: (s) => {
    const sh = shake(s.lt - 0.3, 24, s.d, 0.4);
    return cam(W / 2 + sh[0], 560 + sh[1], crash(s.lt, 1.3, 1.0, 0.02, 3), 0);
  },
  bg: (c, s) => fest(c, s.t, s.lt + 1, 8, 6),
  cel(c, s) {
    GANG.forEach(([kind, x, sc], i) => {
      const up = easeOutBack(clamp((s.lt - 0.34 - i * 0.07) / 0.22));
      if (up <= 0) return;
      const hop = 50 * Math.abs(Math.sin((s.ltc + i * 0.13) * 7));
      brie(c, { view: 'front', x, y: 1040 + (1 - up) * 500 - hop, ground: 1040, s: sc, costume: kind, ct: s.tc, expr: 'happy', wag: wag(s.tc + i), tilt: Math.sin(s.tc * 4 + i) * 0.08 });
    });
    const j = clamp(s.lt / 0.3);
    const a = s.lt - 0.3;
    const hop = a > 0.5 ? 90 * Math.abs(Math.sin((a - 0.5) * 7)) : 0;
    brie(c, {
      view: 'front', x: W / 2, y: 1030 - 4 * j * (1 - j) * 260 - hop, ground: 1030, s: 1.65, crown: true, earFlop: j < 1 ? 1 : 0.6,
      expr: 'shout', sq: a > 0 ? 0.24 * Math.exp(-a * 7) * Math.cos(a * 20) : -0.18, wag: wag(s.tc),
    });
  },
  fx(c, s) {
    confetti(c, s.lt + 0.6, 150, 12, 1);
    pow(c, W / 2, 1040, 170, s.ltc - 0.3, '#ff5d8f', 14, 5, 0.3);
    ring(c, W / 2, 1030, s.ltc - 0.3, 760, '#ffffff', 0.5);
  },
};

/* =====================================================================
 * PARADE
 * ===================================================================== */
const PT = 188.84, ROAD = 940, PSPEED = 700;
const MARCH = [
  { x: 1680, s: 0.95, kind: null, label: 'BRIE!', col: '#ffd84d' },
  { x: 1235, s: 0.72, kind: 'lion', label: '“LINHÃO”!', col: '#ffb347' },
  { x: 975, s: 0.72, kind: 'cabbage', label: '“CÔVE”!', col: '#7ad46a' },
  { x: 735, s: 0.72, kind: 'cheese', label: 'QUEIJINHO!', col: '#ffd84d' },
  { x: 490, s: 0.72, kind: 'worm', label: 'MINHOCA!', col: '#ff9ec4' },
  { x: 230, s: 0.72, kind: 'croc', label: '“COCODRILO”!', col: '#5fd77a' },
];
const duskAt = (t) => clamp((t - PT - 11.8) / 6);

function paradeBg(c, t, dusk = duskAt(t), speed = 1) {
  const camX = (t - PT) * PSPEED * speed;
  sky(c, lerpColor('#6fd0ff', '#ff9ec4', dusk), lerpColor('#d9f6ff', '#ffe0a8', dusk));
  P.sun(c, 1620, 180 + dusk * 300, 80, t);
  P.clouds(c, t, camX, 0.1);
  P.hills(c, camX, 640, 70, lerpColor('#9be38f', '#b7a6ee', dusk * 0.7), 0.2, 1);
  P.hills(c, camX, 780, 60, lerpColor('#6fd36a', '#62b86c', dusk), 0.5, 3, true);
  // the road
  c.fillStyle = lerpColor('#f6e0b0', '#eec9a0', dusk);
  c.fillRect(-400, ROAD - 86, W + 800, 190);
  c.fillStyle = lerpColor('#62c85f', '#56a865', dusk);
  c.fillRect(-400, ROAD + 100, W + 800, 400);
  c.strokeStyle = INK;
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(-400, ROAD - 86);
  c.lineTo(W + 400, ROAD - 86);
  c.moveTo(-400, ROAD + 100);
  c.lineTo(W + 400, ROAD + 100);
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.75)';
  for (let i = 0; i < 9; i++) {
    const x = W + 300 - frac((camX + i * 300) / 2700) * 2700;
    c.beginPath();
    c.ellipse(x, ROAD + 72, 60, 7, 0, 0, TAU);
    c.fill();
  }
  // bunting posts along the far side of the road
  for (let i = 0; i < 5; i++) {
    const x = W + 300 - frac((camX * 0.9 + i * 520) / 2600) * 2600;
    c.strokeStyle = INK;
    c.lineWidth = 6;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x, ROAD - 86);
    c.lineTo(x, ROAD - 330);
    c.stroke();
    c.save();
    c.translate(x, ROAD - 330);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(-84 - 10 * Math.sin(t * 6 + i), 26);
    c.lineTo(0, 54);
    c.closePath();
    fillStroke(c, FW[i % 5], INK, 5);
    c.restore();
  }
}

// toys cheering by the roadside pass in front of the lens
const TOYS = ['toast', 'onigiri', 'milk', 'sunny'];
function roadside(c, t, tc, speed = 1.35, y = 1052, r = 82) {
  const camX = (t - PT) * PSPEED * speed;
  for (let i = 0; i < 5; i++) {
    const x = W + 400 - frac((camX + i * 560) / 2800) * 2800;
    const hop = 26 * Math.abs(Math.sin(tc * 7 + i * 1.7));
    c.save();
    c.translate(x, y - hop);
    c.rotate(Math.sin(tc * 7 + i) * 0.08);
    P.plushToy(c, TOYS[i % 4], r);
    c.restore();
  }
}

function marcher(c, m, i, s, o = {}) {
  const skates = m.kind === 'cabbage';
  const beat = (run(s.tc, 0.5) + i * 0.17) * Math.PI * 2;
  // the côve rolls: no hop, just a skating sway, and the skates stay on her paws when she jumps
  const hop = skates ? 0 : 30 * Math.abs(Math.sin(beat));
  const x = m.x + (o.dx ?? 0), y = ROAD - hop - (o.lift ?? 0);
  const sc = m.s * (o.k ?? 1);
  const k = sc / 0.66;
  const air = clamp((o.lift ?? 0) / 60);
  const stride = skates ? Math.sin(beat) * 12 * k * (1 - air) : 0;
  if (skates) {
    c.save();
    c.translate(x, y - 40 * k);
    c.rotate(Math.sin(beat) * 0.05 - 0.22 * air);
    c.translate(-x, -(y - 40 * k));
    P.skate(c, x - 34 * k - stride, y - 8 * k * air, sc, s.tc * 12);
    P.skate(c, x + 52 * k + stride, y, sc, s.tc * 12);
    c.restore();
  }
  brie(c, {
    x, y: y - (skates ? 40 * k : 0), ground: ROAD, s: sc, phase: skates ? null : run(s.tc + i * 0.1, 1), amp: 0.7, ear: 0.4, wag: wag(s.tc + i),
    ...(skates ? { rot: Math.sin(beat) * 0.05 - 0.22 * air, legs: [0.22 + stride / (60 * k), -0.22 - stride / (60 * k)], lean: 0.08 } : {}),
    mouth: 0.5, eyes: 'happy', costume: m.kind || undefined, ct: s.tc,
    ...(m.kind ? {} : { cape: { t: s.tc }, crown: true, headTilt: -0.12 }),
  });
}

function banner(c, age, tc) {
  const drop = easeOutBack(clamp(age / 0.4));
  if (drop <= 0) return;
  c.save();
  c.translate(W / 2, -260 + 400 * drop);
  c.rotate(Math.sin(tc * 2) * 0.012);
  c.strokeStyle = INK;
  c.lineWidth = 6;
  for (const d of [-1, 1]) {
    c.beginPath();
    c.moveTo(d * 600, -70);
    c.lineTo(d * 640, -420);
    c.stroke();
  }
  c.beginPath();
  c.moveTo(-720, -74);
  c.quadraticCurveTo(0, -100, 720, -74);
  c.lineTo(690, 0);
  c.lineTo(720, 74);
  c.quadraticCurveTo(0, 52, -720, 74);
  c.lineTo(-690, 0);
  c.closePath();
  fillStroke(c, '#ff5d8f', INK, 8);
  c.font = `92px ${COMIC}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineJoin = 'round';
  c.lineWidth = 14;
  c.strokeStyle = INK;
  c.strokeText('O DESFILE DE CLOVERLEAF', 0, -6);
  c.fillStyle = '#ffffff';
  c.fillText('O DESFILE DE CLOVERLEAF', 0, -6);
  c.restore();
}

function notes(c, t, tc) {
  c.font = `80px ${COMIC}`;
  c.textAlign = 'center';
  for (let i = 0; i < 7; i++) {
    const p = frac(t * 0.22 + i * 0.37);
    const x = 160 + rand(i * 9.1 + Math.floor(t * 0.22 + i * 0.37)) * (W - 320);
    c.save();
    c.globalAlpha = Math.sin(p * Math.PI);
    c.translate(x + Math.sin(tc * 3 + i) * 20, 700 - p * 380);
    c.rotate(Math.sin(tc * 4 + i) * 0.3);
    c.lineWidth = 10;
    c.strokeStyle = INK;
    c.lineJoin = 'round';
    c.strokeText(i % 2 ? '♪' : '♫', 0, 0);
    c.fillStyle = FW[i % 3];
    c.fillText(i % 2 ? '♪' : '♫', 0, 0);
    c.restore();
  }
}

// wide: they march in under the banner
const paradeIn = {
  t: PT, tr: 'whipR', hand: 0.3, punch: 1.2,
  cam: (s) => cam(W / 2, lerp(560, 540, easeOut(clamp(s.lt / 1.2))), lerp(1.1, 1.0, easeOut(clamp(s.lt / 1.2))), 0),
  bg: (c, s) => paradeBg(c, s.t),
  cel(c, s) {
    for (let i = MARCH.length - 1; i >= 0; i--) {
      const e = easeOut(clamp((s.lt - 0.1 - i * 0.2) / 1.1));
      marcher(c, MARCH[i], i, s, { dx: lerp(-2100, 0, e) });
    }
    roadside(c, s.t, s.tc);
  },
  fx(c, s) {
    screen(c, () => banner(c, s.lt - 0.5, s.tc));
    notes(c, s.t, s.tc);
  },
};

// each costume turns to the lens and takes a bow
const bow = (i, t0, side) => {
  const m = MARCH[i];
  return {
    t: t0, tr: 'whipL', hand: 0.4, punch: 1.2,
    cam: (s) => cam(W / 2 + side * 30, 600, lerp(1.08, 1.0, easeOut(clamp(s.lt / 0.3))), side * 0.02),
    bg(c, s) {
      c.save();
      about(c, W / 2, 900, 1.6);
      paradeBg(c, s.t, duskAt(s.t), 1.3);
      c.restore();
    },
    cel(c, s) {
      // neighbours keep marching past
      const prev = MARCH[i - 1], next = MARCH[i + 1];
      c.save();
      about(c, W / 2, ROAD, 1.9);
      if (next) marcher(c, { ...next, x: W / 2 - 420 }, i + 1, s);
      if (prev) marcher(c, { ...prev, x: W / 2 + 420, s: 0.78 }, i - 1, s);
      c.restore();
      const b = key(s.lt, [[0.3, 0], [0.55, 0.36, 'out'], [0.82, -0.1, 'back'], [1.05, 0]]);
      const down = s.lt > 0.36 && s.lt < 0.74;
      // the côve keeps her skates on for her bow, toes out
      const sk = m.kind === 'cabbage' ? 1.15 : 0;
      for (const sx of sk ? [-1, 1] : []) {
        c.save();
        c.translate(W / 2 + sx * 78, 1040 - 38 * sk);
        c.scale(sx, 1);
        P.skate(c, 0, 0, sk, 0);
        c.restore();
      }
      brie(c, {
        view: 'front', x: W / 2, y: 1040 - 78 * sk, ground: 1040, s: 1.75, costume: m.kind, ct: s.tc, sq: b, wag: wag(s.tc),
        expr: 'happy', fEyes: down ? 'closed' : 'happy', fMouth: down ? 0.15 : 0.8, tilt: down ? 0 : side * 0.07, earFlop: down ? 1 : 0.3,
      });
    },
    fx(c, s) {
      bigLabel(c, m.label, W / 2 + side * 560, 250, 120, m.col, (s.lt - 0.12) * 4, side * 0.07);
      if (s.lt > 0.8) sparkles(c, s.tc, W / 2, 620, 360, 10, i * 3 + 1, '#ffffff');
      pow(c, W / 2, 1040, 200, s.ltc - 0.82, m.col, 10, i, 0.3);
    },
  };
};
const BOW0 = 191.5, BOWD = 1.35;
const bows = [1, 2, 3, 4, 5].map((i, n) => bow(i, BOW0 + n * BOWD, n % 2 ? -1 : 1));

// back to the front of the line: the queen of the parade
const LEAD = BOW0 + 5 * BOWD, BARK = 1.15;
const leader = {
  t: LEAD, tr: 'whipR', hand: 0.4, punch: 1.3,
  cam: (s) => cam(W / 2 + 30, lerp(640, 600, easeInOut(s.k)), lerp(1.0, 1.08, easeInOut(s.k)), -0.04),
  bg(c, s) {
    c.save();
    about(c, W / 2, 900, 1.7);
    paradeBg(c, s.t, duskAt(s.t), 1.3);
    c.restore();
  },
  cel(c, s) {
    const a = s.lt - BARK;
    const bark = a > 0 && a < 0.7;
    brie(c, {
      x: 820, y: 1030 - 26 * Math.abs(Math.sin(run(s.tc, 0.5) * TAU)), ground: 1030, s: 2.1, phase: run(s.tc, 1), amp: 0.6, ear: 0.5, wag: wag(s.tc),
      cape: { t: s.tc * 1.2 }, crown: true, pitch: -0.08, headTilt: bark ? -0.3 : -0.14, eyes: bark ? 'happy' : blink(s.t, 2) ? 'closed' : 'open',
      mouth: bark ? 0.6 + 0.4 * Math.sin(a * 30) : 0.3, sq: bark ? -0.06 * Math.exp(-a * 6) : 0,
    });
    roadside(c, s.t, s.tc, 1.6, 1110, 96);
  },
  fx(c, s) {
    const a = s.ltc - BARK;
    if (a > 0 && a < 0.9) bigLabel(c, 'AU AU!', 1420, 330, 150, '#ffd84d', a * 5, 0.08);
    sparkles(c, s.tc, 1040, 520, 300, 8, 3, '#fff6a8');
  },
};

// wide again as the day turns to dusk; one last wave of jumps down the line
const DUSK = LEAD + 2.35, WAVE = 4.7;
const paradeDusk = {
  t: DUSK, tr: 'whipL', hand: 0.3, punch: 1.2,
  cam: (s) => cam(W / 2, lerp(580, 520, easeInOut(s.k)), lerp(1.14, 1.0, easeInOut(clamp(s.lt / 3))), 0),
  bg(c, s) {
    paradeBg(c, s.t);
    const d = duskAt(s.t);
    for (let i = 0; i < 5; i++) firework(c, 240 + rand(i * 2.3) * (W - 480), 150 + rand(i + 3) * 260, s.lt - 3.6 - i * 0.45, i + 20, FW[i]);
    if (d > 0.5) {
      c.fillStyle = `rgba(60,30,110,${0.18 * (d - 0.5) * 2})`;
      c.fillRect(-200, -200, W + 400, H + 400);
    }
  },
  cel(c, s) {
    for (let i = MARCH.length - 1; i >= 0; i--) {
      const u = clamp((s.lt - WAVE - (5 - i) * 0.13) / 0.5);
      marcher(c, MARCH[i], i, s, { lift: u > 0 && u < 1 ? 4 * u * (1 - u) * 190 : 0 });
    }
    roadside(c, s.t, s.tc);
  },
  fx(c, s) {
    screen(c, () => banner(c, 1, s.tc));
    notes(c, s.t, s.tc);
    for (let i = 0; i < 6; i++) puff(c, MARCH[i].x, ROAD + 4, s.ltc - WAVE - (5 - i) * 0.13 - 0.5, 0.55, i, '#fff3d8');
  },
};

/* =====================================================================
 * NIGHT: fireworks over the castle, and the goodnight iris
 * ===================================================================== */
const NIGHT = PT + 18.2;
function nightSky(c, t, lt, n = 10, k = 0) {
  sky(c, '#140d33', '#4a2b7a');
  c.save();
  about(c, W / 2, 500, 1 + 0.05 * k);
  twinkleStars(c, t, 160, H * 0.75, 1);
  for (let i = 0; i < n; i++) {
    const period = 2.3;
    const v = lt + 10 - i * 0.5;
    const cyc = Math.floor(v / period);
    firework(c, 200 + rand(i * 1.7 + cyc * 3.3) * (W - 400), 140 + rand(i * 4.1 + cyc) * 320, v - cyc * period, i + cyc * 5, FW[(i + cyc) % 5]);
  }
  c.restore();
}

const nightCastle = {
  t: NIGHT, tr: 'fluff', wash: 0.45, hand: 0.2, punch: 0.8,
  bg(c, s) {
    const k = easeInOut(s.k);
    nightSky(c, s.t, s.lt, 12, k);
    c.save();
    about(c, W / 2, 760, 1 + 0.08 * k);
    P.hills(c, 0, 760, 50, '#3b2d6e', 0, 2);
    c.restore();
    c.save();
    about(c, W / 2, 820, 1 + 0.14 * k);
    P.castle(c, W / 2, 820, 0.8, { t: s.t, night: true, gateOpen: 1, glow: 1 });
    c.restore();
    c.save();
    about(c, W / 2, 1200, 1 + 0.2 * k);
    P.hills(c, 0, 920, 40, '#2a1f55', 0, 5);
    c.restore();
  },
  cel(c, s) {
    // she trots out of the gate to the front of the hill and sits
    const k = clamp((s.lt - 0.6) / 1.5);
    if (k < 1) {
      brie(c, { x: lerp(W / 2 + 20, W / 2 + 500, easeInOut(k)), y: lerp(880, 1030, easeInOut(k)), s: lerp(0.35, 0.95, easeInOut(k)), phase: run(s.tc, 2), amp: 0.9, ear: 0.7, wag: wag(s.tc), crown: true, cape: { t: s.tc }, mouth: 0.5, eyes: 'happy' });
    } else {
      const a = s.lt - 2.1;
      brie(c, { view: 'front', x: W / 2 + 500, y: 1030 - 60 * Math.abs(Math.sin(run(s.tc, 0.5) * TAU)) * (a > 0.6 ? 1 : 0), ground: 1030, s: 1.0, crown: true, expr: 'happy', wag: wag(s.tc), sq: 0.2 * Math.exp(-a * 7) * Math.cos(a * 19), tilt: Math.sin(s.tc * 3) * 0.07 });
    }
  },
  fx(c, s) {
    screen(c, () => logo(c, W / 2, 270, 0.9, s.ltc - 1.0, { ribbon: true }));
    puff(c, W / 2 + 500, 1034, s.ltc - 2.1, 0.9, 2, '#cdbcf5');
  },
};

// the iris closes on her... she catches it, winks, and lets it go
const GN = NIGHT + 4.4, IX = W / 2, IY = 668;
const CLOSE0 = 1.25, CATCH = 2.0, WINK = 214.64 - GN, LETGO = WINK + 0.62, SHUT = LETGO + 0.36;
const irisR = (lt) => {
  if (lt < CLOSE0) return 1400;
  if (lt < CATCH) return lerp(1400, 262, easeInOut((lt - CLOSE0) / (CATCH - CLOSE0)));
  if (lt < LETGO) return lerp(262, 372, easeOutBack(clamp((lt - CATCH - 0.1) / 0.32)));
  return Math.max(0, 372 * (1 - easeIn(clamp((lt - LETGO) / (SHUT - LETGO)))));
};
function paw(c, x, y, rot, k) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(k, k);
  c.beginPath();
  c.ellipse(0, 0, 58, 44, 0, 0, TAU);
  fillStroke(c, '#ffffff', INK, 7);
  c.strokeStyle = '#d9d0e6';
  c.lineWidth = 5;
  c.lineCap = 'round';
  for (const d of [-20, 0, 20]) {
    c.beginPath();
    c.moveTo(d, -34);
    c.lineTo(d, -12);
    c.stroke();
  }
  c.restore();
}
const goodnight = {
  t: GN, tr: 'cut', wash: 0.45, hand: 0, punch: 0, free: true,
  cam: () => cam(W / 2, H / 2, 1 / 1.04, 0),
  bg(c, s) {
    nightSky(c, s.t, s.lt + 5, 8, 0);
    P.hills(c, 0, 800, 50, '#3b2d6e', 0, 2);
    P.castle(c, 380, 900, 0.5, { t: s.t, night: true, gateOpen: 1, glow: 1 });
    P.hills(c, 0, 960, 40, '#2a1f55', 0, 5);
  },
  cel(c, s) {
    const lt = s.lt;
    const caught = lt - CATCH, w = lt - WINK;
    const looking = caught > 0.45 && w < -0.25;
    const look = looking ? (caught < 0.75 ? -1 : 1) : 0;
    const winking = w > 0 && w < 0.5;
    brie(c, {
      view: 'front', x: IX, y: 1125, s: 2.25, crown: true, shadow: false, wag: wag(s.tc),
      expr: 'happy',
      fEyes: lt < CLOSE0 + 0.3 ? (blink(s.t, 1) ? 'closed' : 'happy') : caught < 0 ? 'open' : caught < 0.45 ? 'wide' : 'open',
      fEyeR: winking ? 'happy' : undefined, fLook: look,
      fMouth: caught > 0 && caught < 0.45 ? 0.1 : winking ? 0.9 : lt < CLOSE0 ? 0.7 : 0.4,
      tilt: winking ? 0.1 : lt < CLOSE0 ? Math.sin(s.tc * 3) * 0.06 : look * 0.04,
      sq: caught > 0 ? -0.05 * Math.exp(-caught * 6) * Math.cos(caught * 16) : 0, earFlop: 0.3,
    });
  },
  fx(c, s) {
    const lt = s.lt, r = irisR(lt);
    // the iris itself, drawn like the rest so it boils
    c.fillStyle = '#0b0714';
    c.beginPath();
    c.rect(-200, -200, W + 400, H + 400);
    if (r > 0.5) c.arc(IX, IY, r, 0, TAU, true);
    c.fill('evenodd');
    if (r > 2 && r < 1300) {
      c.lineWidth = 12;
      c.strokeStyle = '#0b0714';
      c.beginPath();
      c.arc(IX, IY, r, 0, TAU);
      c.stroke();
    }
    // paws on the rim, holding it open
    const g = clamp((lt - CATCH + 0.04) / 0.12) * (1 - clamp((lt - LETGO + 0.1) / 0.12));
    if (g > 0) {
      for (const d of [-1, 1]) {
        const ang = d > 0 ? 0.42 : Math.PI - 0.42;
        paw(c, IX + Math.cos(ang) * (r + 6), IY + Math.sin(ang) * (r + 6), ang + Math.PI / 2 + (d > 0 ? 0 : Math.PI), easeOutBack(g));
      }
    }
    if (lt > CATCH && lt < CATCH + 0.4) bigLabel(c, 'OPA!', IX + 470, IY - 330, 90, '#ffd84d', (lt - CATCH) * 5, 0.1);
    // the wink
    const w = lt - WINK;
    if (w > 0 && w < 0.5) {
      const k = easeOutBack(clamp(w / 0.15)) * (1 - clamp((w - 0.3) / 0.2));
      c.save();
      c.translate(IX + 150, IY - 80);
      c.rotate(w * 2);
      c.scale(k, k);
      c.beginPath();
      for (let i = 0; i < 8; i++) {
        const rr = i % 2 ? 16 : 64, a = (i / 8) * TAU;
        c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      c.closePath();
      fillStroke(c, '#fff6a8', INK, 6);
      c.restore();
    }
    // FIM
    const f = lt - SHUT - 0.12;
    if (f > 0) {
      c.save();
      c.globalAlpha = 1 - clamp((s.left - 0.05) < 0.3 ? 1 - (s.left - 0.05) / 0.3 : 0);
      bigLabel(c, 'Fim!', W / 2, H / 2 - 10, 150, '#ffffff', f * 3, -0.05);
      clover(c, W / 2 + 270, H / 2 - 80, 1.5 * easeOutBack(clamp((f - 0.12) / 0.25)), 0.3, '#5fd77a', 5);
      c.restore();
    }
  },
};

export default {
  from: 172.24, to: 216.45,
  shots: [crane, crowning, small, giant, pose1, pose2, pose3, pose4, paradeIn, ...bows, leader, paradeDusk, nightCastle, goodnight],
};
