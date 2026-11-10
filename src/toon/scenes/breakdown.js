// Build (2:01), the telling-off (2:06), the silence (2:15) and the restart (2:19).
import { sky, speedLines, focusLines, halftone, sparkles } from '../../fx.js';
import { fillStroke, clover, blob } from '../../util.js';
import { bigLabel, COMIC } from '../../text.js';
import * as P from '../../props.js';
import { brie, jump, skid, take } from '../actor.js';
import { cam, crash, shake } from '../camera.js';
import { W, H, FY, INK, TAU, clamp, lerp, easeOut, easeIn, easeInOut, easeOutBack, key, wag, blink, room, humanShadow, puff, ring, pow, frac, rand } from '../kit.js';

const GY = 960;
const RAINBOW = ['#ff5d5d', '#ff9a3c', '#ffd84d', '#5fd77a', '#4cc3ff', '#b77dff'];
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
function drop(c, x, y, a = 1) {
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  c.beginPath();
  c.moveTo(0, -30);
  c.quadraticCurveTo(22, 0, 0, 16);
  c.quadraticCurveTo(-22, 0, 0, -30);
  fillStroke(c, '#7fd3ff', INK, 4);
  c.restore();
}
const dark = (c, a, col = '20,10,40') => {
  c.fillStyle = `rgba(${col},${a})`;
  c.fillRect(-600, -600, W + 1200, H + 1200);
};

/* ---------- build: somebody is standing behind her ---------- */
const halt = {
  t: 121.44, hand: 0.4, punch: 0.6,
  cam: (s) => cam(lerp(W / 2 - 60, W / 2 + 60, easeInOut(clamp((s.lt - 0.6) / 0.9))), lerp(660, 560, easeInOut(clamp((s.lt - 0.6) / 0.9))), 1.1, 0),
  bg(c, s) {
    room(c, 'living', 600, s.t);
    const up = easeOut(clamp((s.lt - 0.7) / 0.8));
    dark(c, 0.22 * up);
    humanShadow(c, 1420, FY + 40 + (1 - up) * 500, lerp(0.5, 0.82, up), 0.5 * up);
  },
  cel(c, s) {
    const k = skid(s.lt, { t0: 0, dur: 0.6, x0: -300, x1: 720, dir: 1 });
    const tk = take(s.ltc, 0.95);
    const seen = s.lt > 0.95;
    brie(c, { ...k, y: GY, s: 1.3, wag: seen ? 0 : wag(s.tc), ...(seen ? { sq: tk.sq, eyes: 'wide', look: 1, ear: 0, mouth: 0.15, headTilt: -0.25, lean: -0.1 } : {}) });
  },
  fx(c, s) {
    for (let i = 0; i < 4; i++) puff(c, 560 - i * 130, GY + 4, s.ltc - 0.12 - i * 0.05, 1.0, i, '#f6e2c8');
    if (s.lt < 0.6) speedLines(c, s.tc, 0.6 * (1 - s.lt / 0.6), -1, 'rgba(255,255,255,0.7)', 400, 1000);
    if (s.lt > 0.95) bigLabel(c, '?!', 980, 470, 150, '#ffd84d', (s.lt - 0.95) * 5, 0.12);
  },
};
const GULP = 1.5;
const gulp = {
  t: 123.0, hand: 0.25, punch: 0.4,
  tint: (s) => [1 - 0.1 * s.k, 1 - 0.16 * s.k, 1],
  cam: (s) => cam(W / 2 - 100, 640, lerp(1.0, 1.14, s.k), lerp(0, -0.03, s.k)),
  bg(c, s) {
    // dolly zoom: the room rushes away while she stays put
    c.save();
    about(c, 640, 620, lerp(1.45, 1.0, easeInOut(s.k)));
    room(c, 'living', 600, s.t);
    c.restore();
    dark(c, 0.25 + 0.35 * s.k);
    humanShadow(c, 1280, FY + 60, lerp(0.75, 1.4, easeIn(s.k)), 0.65);
  },
  cel(c, s) {
    const g = s.ltc - GULP;
    const sw = g > 0 && g < 0.35 ? Math.sin((g / 0.35) * Math.PI) : 0;
    const sh = (s.d % 2 ? 1 : -1) * 7 * s.k;
    brie(c, { view: 'front', x: 640 + sh, y: FY + 170, s: 1.3, expr: 'guilty', fLook: s.lt < 0.7 ? 1 : undefined, fEyes: sw > 0.3 ? 'closed' : undefined, wag: 0, tilt: -0.1, sq: 0.16 * sw + 0.05 * s.k, earFlop: 0 });
  },
  fx(c, s) {
    const a = frac(s.lt * 0.9);
    drop(c, 790, FY - 270 + a * 60, 1 - a);
    drop(c, 500, FY - 230 + frac(a + 0.5) * 60, 1 - frac(a + 0.5));
    if (s.lt > GULP && s.lt < GULP + 0.9) bigLabel(c, 'GLUP!', 930, 520, 100, '#7fd3ff', (s.lt - GULP) * 4, 0.08);
    if (s.lt > 2.2) bigLabel(c, 'UH-OH...', 600, 300, 110, '#ffd84d', (s.lt - 2.2) * 2, -0.06);
  },
};

/* ---------- vai pra cãodeia ---------- */
const SCOLDBG = (c, s, a) => {
  room(c, 'living', 600, s.t);
  dark(c, a, '70,10,40');
};
const finger = {
  t: 126.14, tr: 'impact', hand: 0.5, punch: 2,
  cam: (s) => cam(W / 2 + 40, 600, crash(s.lt, 1.0, 1.1), 0.04),
  bg: (c, s) => SCOLDBG(c, s, 0.4),
  cel(c, s) {
    const jab = Math.pow(Math.max(0, Math.sin(s.lt * 14)), 2);
    const sc = lerp(1.3, 0.78, easeOut(s.k));
    brie(c, { view: 'front', x: 600 - 30 * jab, y: FY + 170, s: sc, expr: 'guilty', tilt: -0.14 - 0.06 * jab, sq: 0.08 * jab, wag: 0, earFlop: 0 });
    c.save();
    c.translate(lerp(W + 700, 1560, easeOutBack(clamp(s.lt / 0.22))) - jab * 150, 540 + jab * 20);
    c.scale(-1, 1);
    P.pointingHand(c, 0, 0, 1.7, 0.22);
    c.restore();
  },
  fx(c, s) {
    const jab = Math.pow(Math.max(0, Math.sin(s.lt * 14)), 2);
    if (jab > 0.6) pow(c, 1120, 640, 90, 0.05, '#ffffff', 6, s.d, 0.2);
    drop(c, 480, FY - 200 + frac(s.lt * 1.4) * 60, 1 - frac(s.lt * 1.4));
  },
};
const SLAM = 0.3;
const jail = {
  t: 127.12, tr: 'impact', hand: 0.3, punch: 2,
  wordAt: (i) => (i === 1 ? [0.81, 0.8, 0.05, 0.85] : null),
  cam: (s) => {
    const sh = shake(s.lt - SLAM, 34, s.d, 0.4);
    return cam(700 + sh[0], 640 + sh[1], crash(s.lt, 1.0, 1.3, SLAM, 2), -0.03);
  },
  bg: (c, s) => SCOLDBG(c, s, 0.45),
  cel(c, s) {
    const a = s.lt - SLAM;
    const hit = a > 0 ? Math.exp(-a * 9) * Math.cos(a * 22) : 0;
    const beg = s.lt > 0.75;
    brie(c, { view: 'front', x: 700, y: FY + 170, s: 0.95, expr: beg ? 'innocent' : 'guilty', fLook: beg ? 0 : undefined, tilt: beg ? 0.1 : -0.1, sq: 0.3 * hit, wag: 0, earFlop: 0 });
    P.jailBars(c, 700, FY + 190, 420, 480, easeIn(clamp((s.lt - 0.14) / (SLAM - 0.14))));
  },
  fx(c, s) {
    const a = s.lt - SLAM;
    ring(c, 700, FY + 190, a, 620, '#ffffff', 0.3);
    for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) puff(c, 700 + sx * (290 + i * 90), FY + 180, s.ltc - SLAM - i * 0.04, 0.9, i + sx, '#f6e2c8');
    if (a > 0) bigLabel(c, 'CLANG!', 1150, 400, 130, '#c9cde0', a * 4, 0.1);
  },
};

/* ---------- NÃO! NÃO! NÃO! ---------- */
const NAOS = [[0.22, 0.2, -0.1, 1.1], [0.79, 0.22, 0.1, 1.25], [0.5, 0.17, -0.03, 1.45]];
const nao = (t, i) => ({
  t, tr: i === 1 ? 'cut' : 'impact', hand: 0.2, punch: 2,
  wordAt: (w) => NAOS[w],
  cam: (s) => cam(W / 2, 560, crash(s.lt, 1.0, 1.12, 0, 2), [-0.07, 0.08, -0.04][i]),
  bg(c, s) {
    sky(c, ['#ff5d5d', '#e0364f', '#b3123f'][i], ['#ff9a8a', '#ff6b6b', '#ff4d6d'][i]);
    dark(c, 0);
    halftone(c, 'rgba(120,0,30,0.3)', 30, 10);
    screen(c, () => focusLines(c, s.tc, W / 2, 620, 0.8, 'rgba(255,255,255,0.5)', 420 + i * 120));
  },
  cel(c, s) {
    const sh = Math.sin(s.ltc * 40) * Math.exp(-s.ltc * 6);
    brie(c, { view: 'head', x: W / 2 + sh * 50, y: [660, 700, 800][i], s: [2.4, 3.2, 3.8][i], rot: [-0.1, 0.12, -0.05][i] + sh * 0.3, expr: 'guilty', fEyes: i === 2 ? 'closed' : undefined, fLook: i === 1 ? 1 : undefined });
  },
  fx(c, s) {
    if (i === 2) for (const sx of [-1, 1]) drop(c, W / 2 + sx * (520 + s.lt * 300), 520 + s.lt * 500, 1);
  },
});

/* ---------- vai dormir de bunda quente ---------- */
const BEDY = 960 - 200 * 1.4 + 10;
function bedroomNight(c) {
  sky(c, '#3a2a6b', '#6c4fa8');
  c.fillStyle = '#3a2a6b';
  c.fillRect(-400, -400, W + 800, 400);
  c.fillStyle = '#6c4fa8';
  c.fillRect(-400, H, W + 800, 400);
  const g = c.createRadialGradient(W / 2, 640, 50, W / 2, 640, 800);
  g.addColorStop(0, 'rgba(255,170,90,0.75)');
  g.addColorStop(1, 'rgba(255,170,90,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  P.bed(c, W / 2, 960, 1.4);
}
function heat(c, t, x0, y0, n = 3) {
  c.strokeStyle = 'rgba(255,120,60,0.85)';
  c.lineWidth = 8;
  c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = x0 + i * 44;
    c.beginPath();
    for (let k = 0; k < 10; k++) {
      const yy = y0 - k * 16 - ((t * 60) % 16);
      const xx = x + Math.sin(k * 0.9 + t * 6) * 12;
      k ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
    }
    c.stroke();
  }
}
function zzz(c, t, x, y) {
  for (let i = 0; i < 3; i++) {
    const a = frac(t * 0.6 + i / 3);
    c.globalAlpha = Math.sin(a * Math.PI);
    c.font = `${50 + a * 40}px ${COMIC}`;
    c.lineWidth = 8;
    c.strokeStyle = INK;
    c.lineJoin = 'round';
    c.strokeText('Z', x - a * 80, y - a * 200);
    c.fillStyle = '#ffffff';
    c.fillText('Z', x - a * 80, y - a * 200);
  }
  c.globalAlpha = 1;
}
const HOP = 0.3;
const toBed = {
  t: 129.56, tr: 'whipD', hand: 0.3, punch: 1,
  cam: (s) => cam(W / 2, 620, lerp(1.0, 1.08, s.k), 0),
  bg: bedroomNight,
  cel(c, s) {
    const j = jump(s.lt, { t0: HOP, dur: 0.36, from: [470, GY], to: [W / 2 - 20, BEDY], h: 260, pre: 0.14 });
    const down = s.lt > HOP + 0.36;
    // a sulky stomp to the bed, then flop with her back to us
    brie(c, { x: j.x, y: j.y, ground: down ? BEDY : j.ground ?? GY, s: 1.2, dir: down ? -1 : 1, sq: j.sq, legs: down ? undefined : j.legs, pitch: j.pitch, ear: 0, eyes: down ? 'closed' : 'happy', mouth: 0, headTilt: down ? 0 : 0.3, wag: 0, phase: null, shadow: !down });
  },
  fx(c, s) {
    const a = s.lt - HOP - 0.36;
    for (const sx of [-1, 1]) puff(c, W / 2 - 20 + sx * 230, BEDY - 10, s.ltc - HOP - 0.36, 0.9, sx, '#ffffff');
    if (a > 0) bigLabel(c, 'HUMPF!', 1400, 400, 110, '#b77dff', a * 4, 0.08);
  },
};
const warmBum = {
  t: 130.58, hand: 0.15, punch: 0.6,
  wordAt: (i) => (i === 1 ? [0.5, 0.88, 0.03, 0.85] : null),
  cam: (s) => cam(W / 2 + 30, lerp(600, 580, s.k), lerp(1.5, 1.62, s.k), 0.02),
  bg: bedroomNight,
  cel(c, s) {
    const peek = false; // fast asleep: her eyes stay shut
    brie(c, { x: W / 2 - 20, y: BEDY, s: 1.2, dir: -1, phase: null, eyes: peek ? 'open' : 'closed', look: peek ? -1 : 0, mouth: 0, ear: 0, sq: 0.14 + 0.03 * Math.sin(s.tc * 4), wag: Math.sin(s.tc * 2), shadow: false });
  },
  fx(c, s) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(W / 2 + 110, BEDY - 130, 10, W / 2 + 110, BEDY - 130, 150);
    g.addColorStop(0, `rgba(255,110,50,${0.5 + 0.15 * Math.sin(s.tc * 8)})`);
    g.addColorStop(1, 'rgba(255,110,50,0)');
    c.fillStyle = g;
    c.fillRect(W / 2 - 100, BEDY - 330, 420, 400);
    c.restore();
    heat(c, s.tc, W / 2 + 70, BEDY - 230);
    zzz(c, s.tc, W / 2 - 300, 560);
  },
};

/* ---------- roubou meu edredom ---------- */
const TUG0 = 131.74, SNAP = 133.6;
// The Hand: a soft round fist in a spotty pyjama sleeve, fingers curled around the duvet
const SKIN = '#ffdcc4', SLEEVE = '#b9a4ff';
function fist(c, x, y) {
  c.save();
  c.translate(x, y);
  // sleeve
  c.beginPath();
  c.roundRect(110, -78, 620, 156, 56);
  fillStroke(c, SLEEVE, INK, 7);
  c.save();
  c.clip();
  c.fillStyle = '#ffffff';
  for (let i = 0; i < 16; i++) {
    c.beginPath();
    c.arc(190 + (i >> 1) * 74 + (i % 2) * 37, i % 2 ? 34 : -34, 11, 0, TAU);
    c.fill();
  }
  c.restore();
  // fluffy cuff
  blob(c, [[118, -62, 34], [128, -22, 36], [128, 22, 36], [118, 62, 34]], '#fff6fb', 7);
  // fist: palm, four curled fingers, and the thumb folded over the top
  blob(c, [[6, 6, 92, 84, 0], [-66, -50, 32], [-86, -14, 32], [-86, 24, 32], [-66, 58, 30]], SKIN, 7);
  c.strokeStyle = INK;
  c.lineWidth = 5;
  c.lineCap = 'round';
  for (const [fy, len] of [[-33, 34], [5, 42], [42, 34]]) {
    c.beginPath();
    c.moveTo(-104 + (42 - len), fy);
    c.quadraticCurveTo(-80, fy + 3, -104 + (42 - len) + len, fy);
    c.stroke();
  }
  blob(c, [[-6, -64, 58, 27, -0.22]], SKIN, 7);
  // rosy knuckles and a little shine
  c.fillStyle = 'rgba(255,140,150,0.35)';
  for (const [kx, ky] of [[-70, -52], [-90, -14], [-90, 24], [-70, 58]]) {
    c.beginPath();
    c.ellipse(kx, ky, 15, 11, 0, 0, TAU);
    c.fill();
  }
  c.fillStyle = 'rgba(255,255,255,0.7)';
  c.beginPath();
  c.ellipse(-20, -72, 20, 7, -0.22, 0, TAU);
  c.fill();
  c.restore();
}
const tugAt = (t) => {
  const k = clamp((t - TUG0) / (SNAP - TUG0));
  const heave = Math.sin((t - TUG0) * 9);
  return { k, x: 600 + k * 90 - Math.max(0, heave) * 70 * (1 - k * 0.5), hx: W - 330 + Math.max(0, -heave) * 50 };
};
function tugBg(c, s) {
  room(c, 'bedroom', 900, s.t);
}
function tugCel(c, s) {
  const g = tugAt(s.t);
  const tr = (s.d % 2 ? 1 : -1) * 5 * g.k;
  const mx = g.x - 150 * 1.25, my = GY - 205 * 1.25;
  // the duvet, stretched thinner and thinner between her teeth and The Hand
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const u = i / 14;
    pts.push([lerp(mx + 20, g.hx - 30, u), lerp(my - 30, 560, u) + Math.sin(u * Math.PI) * lerp(120, 12, g.k) + Math.sin(s.tc * 30 + i) * 5 * g.k]);
  }
  P.duvetShape(c, pts, lerp(130, 64, g.k));
  fist(c, g.hx, 600);
  brie(c, { x: g.x + tr, y: GY, s: 1.25, dir: -1, lean: 0.42 + 0.1 * g.k, legs: [0.75, 0.55], phase: null, ear: 0.6, eyes: s.t > 132.7 ? 'closed' : 'wide', mouth: 0.25, wag: wag(s.tc) * 2, sq: -0.06 * g.k });
}
function tugFx(c, s) {
  const g = tugAt(s.t);
  for (let i = 0; i < 2; i++) puff(c, g.x + 150 + i * 70, GY + 6, frac(s.tc * 3 + i / 2) * 0.35, 0.6, i + s.d, '#f6e2c8');
  drop(c, g.x - 20, GY - 330 - frac(s.lt * 2) * 50, 1 - frac(s.lt * 2));
  drop(c, g.x - 250, GY - 300 - frac(s.lt * 2 + 0.5) * 50, 1 - frac(s.lt * 2 + 0.5));
}
const tug = {
  t: TUG0, tr: 'flash', hand: 0.6, punch: 2,
  cam: (s) => cam(W / 2, 640, lerp(1.0, 1.06, s.k), 0.02),
  bg: tugBg, cel: tugCel,
  fx(c, s) {
    tugFx(c, s);
  },
};
const tugClose = {
  t: 132.7, tr: 'impact', hand: 0.5, punch: 2,
  cam: (s) => {
    const g = tugAt(s.t);
    return cam(g.x + 120, 700, crash(s.lt, 1.5, 1.75), -0.05);
  },
  bg: tugBg, cel: tugCel,
  fx(c, s) {
    tugFx(c, s);
    const g = tugAt(s.t);
    // threads starting to go
    c.strokeStyle = '#ffffff';
    c.lineWidth = 6;
    c.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const a = frac(s.tc * 3 + i / 5);
      const x = lerp(g.x + 100, g.x + 620, rand(i + s.d * 0)), y = 640 + rand(i + 4) * 80;
      c.globalAlpha = 1 - a;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + (rand(i + 7) - 0.5) * 80, y - 40 - a * 90);
      c.stroke();
    }
    c.globalAlpha = 1;
    screen(c, () => focusLines(c, s.tc, 780, 560, 0.7, 'rgba(255,255,255,0.7)', 520));
  },
};
const snap = {
  t: SNAP, tr: 'impact', hand: 1.2, punch: 2,
  wordAt: (i) => (i === 2 ? [0.3, 0.2, -0.05, 1] : null),
  cam: (s) => {
    const sh = shake(s.lt, 26, s.d, 0.35);
    return cam(W / 2 - 60 + sh[0], 700 + sh[1], 1.2, 0.05);
  },
  bg: (c, s) => room(c, 'bedroom', 9000 - s.lt * 2200, s.t),
  cel(c, s) {
    const up = clamp((s.lt - 1.3) / 0.4);
    const bx = 900 - Math.sin(s.lt * 3) * 60, by = GY - easeIn(up) * 1500;
    // the hand, left empty and shrinking into the distance
    if (s.lt < 0.5) fist(c, 1590 + s.lt * 2600, 600);
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const d = i * 62;
      pts.push([bx + 40 + d * (1 - up * 0.6), by - 250 + d * (0.12 + up * 0.5) + Math.sin(s.t * 16 - i * 0.6) * (10 + i * 3.4)]);
    }
    P.duvetShape(c, pts, 130);
    brie(c, { x: bx, y: by, ground: GY, s: 1.3, dir: -1, phase: up > 0 ? null : frac(s.lt * 6), amp: 1, legs: up > 0 ? [-0.9, 0.9] : undefined, sq: -0.25 * up, ear: 1, mouth: 0.4, eyes: 'happy', wag: wag(s.tc), lean: 0.24, shadow: up < 0.5 });
  },
  fx(c, s) {
    speedLines(c, s.tc, 0.9, 1, 'rgba(255,255,255,0.8)', 380, 1000);
    for (let i = 1; i < 4; i++) puff(c, 940 + i * 200, GY + 8, i * 0.1 + frac(s.tc * 4) * 0.1, 0.7, i + s.d, '#f6e2c8');
    pow(c, 1500, 600, 200, s.ltc, '#ffffff', 10, 3, 0.25);
    if (s.lt < 0.9) bigLabel(c, 'SNAP!', 1380, 380, 150, '#4cc3ff', s.lt * 4, 0.1);
    if (s.lt > 1.3) bigLabel(c, 'HOP!', 1260, 420, 120, '#ffd84d', (s.lt - 1.3) * 4, -0.08);
  },
};

/* ---------- silence: a suspicious burrito ---------- */
function roll(c, breathe, bulge) {
  c.save();
  c.scale(breathe * (1 + bulge * 0.06), breathe * (1 - bulge * 0.04));
  c.beginPath();
  c.ellipse(0, -110, 260, 130, 0, 0, TAU);
  fillStroke(c, '#7fb6ff', INK, 8);
  c.save();
  c.clip();
  for (let i = 0; i < 9; i++) clover(c, -220 + i * 55, -110 + (i % 2) * 40 - 20, 18, i, '#ffffff', 0);
  c.strokeStyle = 'rgba(58,39,71,0.35)';
  c.lineWidth = 6;
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.ellipse(-60 + i * 90, -110, 40, 130, 0.3, 0, TAU);
    c.stroke();
  }
  c.restore();
  c.restore();
}
// she nods off at ASLEEP and stays asleep; the duvet starts to rumble at UHOH
const ASLEEP = 1.3, UHOH = 3.05;
const burrito = {
  t: 135.34, wash: 0.35, hand: 0.1, punch: 0,
  cam: (s) => cam(lerp(W / 2, W / 2 - 110, easeInOut(s.k)), lerp(600, 740, easeInOut(s.k)), lerp(1.0, 1.45, easeInOut(s.k)), 0),
  bg(c, s) {
    c.fillStyle = '#0c0818';
    c.fillRect(-600, -600, W + 1200, H + 1200);
    const g = c.createRadialGradient(W / 2, 760, 40, W / 2, 760, 520);
    g.addColorStop(0, 'rgba(255,236,190,0.55)');
    g.addColorStop(1, 'rgba(255,236,190,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(W / 2 - 90, -50);
    c.lineTo(W / 2 + 90, -50);
    c.lineTo(W / 2 + 480, 980);
    c.lineTo(W / 2 - 480, 980);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(255,236,190,0.25)';
    c.beginPath();
    c.ellipse(W / 2, 930, 420, 60, 0, 0, TAU);
    c.fill();
  },
  cel(c, s) {
    const fall = clamp(s.lt / 0.22);
    const a = s.lt - 0.22;
    const land = a > 0 ? 0.35 * Math.exp(-a * 8) * Math.cos(a * 20) : -0.2;
    const rev = clamp((s.lt - UHOH) / 0.4);
    const tr = (s.d % 2 ? 1 : -1) * rev * 8;
    c.save();
    c.translate(W / 2 + tr, 900 - (1 - easeIn(fall)) * 1100);
    c.scale(1 + land * 0.75, 1 - land);
    roll(c, 1 + Math.sin(s.tc * 3) * 0.02, rev * Math.abs(Math.sin(s.tc * 20)));
    c.restore();
    const asleep = s.lt > ASLEEP;
    const nod = asleep ? 0.03 * Math.sin(s.tc * 3) : 0;
    brie(c, {
      view: 'head', x: W / 2 - 250 + tr, y: 900 - 170 - (1 - easeIn(fall)) * 1100 + land * 60, rot: -0.15 + nod, s: 0.95,
      expr: asleep ? 'sleepy' : 'innocent', fEyes: asleep || blink(s.tc, 4) || s.lt > ASLEEP - 0.25 ? 'closed' : undefined, earFlop: rev, wag: s.tc * 30,
    });
  },
  fx(c, s) {
    ring(c, W / 2, 930, s.lt - 0.22, 520, 'rgba(255,236,190,0.9)', 0.3);
    if (s.lt > ASLEEP) zzz(c, s.tc, W / 2 - 330, 640);
    if (s.lt > UHOH) {
      sparkles(c, s.tc, W / 2, 780, 360, 10, 5, '#fff6a8');
      for (let i = 0; i < 6; i++) {
        const an = -0.3 - i * 0.5, r0 = 300 + (s.d % 2) * 20;
        c.strokeStyle = '#ffffff';
        c.lineWidth = 7;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(W / 2 + Math.cos(an) * r0, 790 + Math.sin(an) * r0 * 0.6);
        c.lineTo(W / 2 + Math.cos(an) * (r0 + 50), 790 + Math.sin(an) * (r0 + 50) * 0.6);
        c.stroke();
      }
    }
  },
};

/* ---------- NÃÃÃO! RECOMEÇOU! ---------- */
function rainbowBurst(c, t, speed = 0.8) {
  c.save();
  c.translate(W / 2, H / 2);
  c.rotate(t * speed);
  for (let i = 0; i < 24; i++) {
    c.fillStyle = RAINBOW[i % 6];
    c.beginPath();
    c.moveTo(0, 0);
    c.arc(0, 0, 2400, (i / 24) * TAU, ((i + 1) / 24) * TAU + 0.01);
    c.fill();
  }
  c.restore();
}
const burst = {
  t: 138.84, tr: 'impact', hand: 0.8, punch: 2.5, wash: 0.5,
  cam: (s) => {
    const sh = shake(s.lt, 40, s.d, 0.5);
    return cam(W / 2 + sh[0], 540 + sh[1], crash(s.lt, 1.0, 1.12), Math.sin(s.lt * 3) * 0.03);
  },
  bg(c, s) {
    rainbowBurst(c, s.tc);
    screen(c, () => focusLines(c, s.tc, W / 2, H / 2, 1, 'rgba(255,255,255,0.9)', 300));
  },
  cel(c, s) {
    const up = easeOutBack(clamp(s.lt / 0.3));
    const hop = Math.abs(Math.sin((s.lt / 0.449) * Math.PI));
    brie(c, { view: 'front', x: W / 2, y: lerp(1500, 1060, up) - hop * 40 * (s.lt > 0.5 ? 1 : 0), s: 1.75, sq: s.lt < 0.3 ? -0.25 * (1 - s.lt / 0.3) : 0.06 * (1 - hop), expr: 'shout', wag: wag(s.tc), earFlop: 1, tilt: Math.sin(s.lt * 7) * 0.08, shadow: false });
  },
  fx(c, s) {
    // what's left of the burrito, flying past the lens
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU + 0.3;
      const d = easeOut(clamp(s.lt / 1.1)) * 1500;
      if (s.lt > 1.1) break;
      c.save();
      c.translate(W / 2 + Math.cos(a) * d, 760 + Math.sin(a) * d * 0.7);
      c.rotate(s.tc * 8 + i);
      const g = 1 + s.lt * 1.6 * rand(i);
      c.scale(g, g);
      c.beginPath();
      c.roundRect(-90, -60, 180, 120, 30);
      fillStroke(c, '#7fb6ff', INK, 6);
      clover(c, 0, 0, 22, i, '#fff', 0);
      c.restore();
    }
    ring(c, W / 2, 800, s.lt, 1500, '#ffffff', 0.4);
  },
};
const PASS = 0.64;
const rainbowZips = {
  t: 140.72, tr: 'impact', hand: 1.0, punch: 2.5, wash: 0.5,
  wordAt: (i) => (i === 1 ? [0.5, 0.19, -0.03, 1] : null),
  cam: (s) => cam(W / 2, 540, 1.05, [0.06, -0.07, 0.04][Math.min(2, Math.floor(s.lt / PASS))]),
  bg(c, s) {
    rainbowBurst(c, s.tc, 1.6);
    dark(c, 0.18, '255,255,255');
  },
  cel(c, s) {
    const i = Math.min(2, Math.floor(s.lt / PASS));
    const f = clamp((s.lt - i * PASS) / PASS);
    const dir = i % 2 ? -1 : 1;
    const sc = [1.1, 1.5, 2.0][i];
    const y = [720, 1020, 900][i];
    const x = W / 2 + dir * lerp(-1500, 1500, f);
    c.lineCap = 'butt';
    RAINBOW.forEach((col, k) => {
      c.strokeStyle = col;
      c.lineWidth = 19 * sc;
      c.beginPath();
      c.moveTo(x - dir * 60 * sc, y - (160 - k * 18) * sc);
      c.lineTo(x - dir * 1400, y - (160 - k * 18) * sc);
      c.stroke();
    });
    brie(c, { x, y, s: sc, dir, phase: frac(s.lt * 7), amp: 1, ear: 1, mouth: 0.9, eyes: 'happy', wag: wag(s.tc), lean: 0.3, stretch: 1.3, trail: { dx: dir * 80, dy: 0, n: 3 }, shadow: false });
  },
  fx(c, s) {
    const i = Math.min(2, Math.floor(s.lt / PASS));
    speedLines(c, s.tc, 1.2, i % 2 ? 1 : -1);
  },
};

export default {
  from: 121.44, to: 142.64,
  shots: [halt, gulp, finger, jail, nao(128.14, 0), nao(128.64, 1), nao(129.18, 2), toBed, warmBum, tug, tugClose, snap, burrito, burst, rainbowZips],
};
