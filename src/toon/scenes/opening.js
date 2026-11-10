// Opening act: intro (0:00), entrance (0:11), title (0:16), arrive (0:27).
import { sky, sunburst, focusLines, halftone, twinkleStars, sparkles, speedLines, vignette, flash, shadow } from '../../fx.js';
import { blob, fillStroke, clover, noise } from '../../util.js';
import { pulse, beatAt } from '../../timeline.js';
import { logo, bigLabel } from '../../text.js';
import * as P from '../../props.js';
import { brie, jump, zip, skid, take } from '../actor.js';
import { cam, crash, shake, punch } from '../camera.js';
import { W, H, FY, INK, TAU, clamp, lerp, easeOut, easeIn, easeInOut, easeOutBack, rand, key, run, wag, blink, house, dayOutdoor, room, puff, ring, pow, frac } from '../kit.js';

const burstBg = (c1, c2, lines = 'rgba(255,255,255,0.85)', inner = 420) => (c, s) => {
  sunburst(c, s.tc, W / 2, H * 0.55, c1, c2, 20, 0.3);
  focusLines(c, s.tc, W / 2, H * 0.5, 1, lines, inner);
};
const scaleAbout = (c, x, y, sx, sy = sx) => {
  c.translate(x, y);
  c.scale(sx, sy);
  c.translate(-x, -y);
};

/* ---------------- intro ---------------- */
const castleWide = {
  t: 0, tr: 'iris', wash: 0.45, hand: 0.2,
  bg(c, s) {
    const k = easeInOut(s.lt / 7.4);
    sky(c, '#140d33', '#4a2b7a');
    c.save();
    scaleAbout(c, W / 2, 500, 1 + 0.06 * k);
    twinkleStars(c, s.t, 160, H * 0.75, 1);
    P.moon(c, 1580, 300, 90);
    c.restore();
    c.save();
    scaleAbout(c, W / 2, 760, 1 + 0.14 * k);
    P.hills(c, 0, 760, 50, '#3b2d6e', 0.0, 2);
    c.restore();
    c.save();
    scaleAbout(c, W / 2, 820, lerp(0.62, 1.2, k));
    P.castle(c, W / 2, 830, 1.25, { t: s.t, night: true, gateOpen: 0, glow: 0 });
    c.restore();
    c.save();
    scaleAbout(c, W / 2, 1300, 1 + 0.55 * k);
    P.hills(c, 0, 900, 40, '#2a1f55', 0.0, 5);
    c.restore();
  },
  fx(c, s) {
    // clouds the camera pushes through
    for (let i = 0; i < 5; i++) {
      const z = s.lt / (2.2 + i * 0.9);
      if (z > 1.25) continue;
      const side = i % 2 ? 1 : -1;
      const sc = 1.1 + z * 2.4;
      c.save();
      c.globalAlpha = clamp(1.25 - z) * 0.85;
      c.translate(W / 2 + side * (260 + z * 1500) + (i - 2) * 90, 420 + i * 70 + z * (i % 3 - 1) * 300);
      c.scale(sc, sc);
      blob(c, [[0, 0, 190, 70, 0], [-130, 20, 90], [120, 16, 100], [30, -40, 90], [-60, -30, 70]], i % 2 ? '#8f7fd0' : '#a99ae0', 0);
      c.restore();
    }
    for (let i = 0; i < 14; i++) {
      const k = (s.t * 0.08 + rand(i)) % 1;
      c.globalAlpha = Math.sin(k * Math.PI) * 0.8;
      clover(c, rand(i + 7) * W + Math.sin(s.t + i) * 30, H - k * H * 1.1, 14 + rand(i + 2) * 10, s.tc + i, '#5fd77a', 2);
    }
    c.globalAlpha = 1;
  },
  over: (c) => vignette(c, 0.55),
};

const windowShot = {
  t: 7.4, wash: 0.5, hand: 0.25,
  cam: (s) => cam(W / 2, lerp(600, 540, easeInOut(s.k)), lerp(1.0, 1.28, easeInOut(s.k))),
  bg(c, s) {
    c.fillStyle = '#4d3f7c';
    c.fillRect(0, 0, W, H);
    // stonework
    c.strokeStyle = 'rgba(30,18,60,0.45)';
    c.lineWidth = 6;
    for (let r = 0; r < 9; r++) {
      const y = r * 130 - 20;
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(W, y);
      c.stroke();
      for (let x = (r % 2) * 150; x < W; x += 300) {
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x, y + 130);
        c.stroke();
      }
    }
    const lit = key(s.lt, [[0, 0], [0.25, 1, 'hold'], [0.32, 0.4, 'hold'], [0.4, 1, 'hold']]);
    const g = c.createRadialGradient(W / 2, 560, 60, W / 2, 560, 900);
    g.addColorStop(0, `rgba(255,214,120,${0.5 * lit})`);
    g.addColorStop(1, 'rgba(255,214,120,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    winPath(c);
    const wg = c.createLinearGradient(0, 200, 0, 860);
    wg.addColorStop(0, lit ? '#fff3b8' : '#2a1f55');
    wg.addColorStop(1, lit ? '#ffc861' : '#231a4a');
    fillStroke(c, wg, INK, 14);
  },
  cel(c, s) {
    c.save();
    winPath(c);
    c.clip();
    const up = key(s.ltc, [[0.7, 0], [0.95, 0.42, 'out'], [1.25, 0.42], [1.5, 1, 'back']]);
    brie(c, { view: 'head', x: W / 2, y: lerp(1090, 760, up), s: 2.3, expr: 'guilty', earFlop: 0.5, wag: s.tc * 9, tilt: 0, shadow: false });
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = '#2b1c52';
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over';
    // eyes blink open in the dark
    const open = key(s.ltc, [[1.75, 0], [1.9, 1, 'out'], [2.3, 1], [2.36, 0], [2.48, 1], [2.9, 1], [2.96, 0], [3.08, 1]]);
    const look = key(s.ltc, [[2.0, 0], [2.2, -1], [2.6, -1], [2.8, 1], [3.3, 1], [3.5, 0]]);
    if (up > 0.9 && open > 0) {
      for (const sx of [-1, 1]) {
        c.beginPath();
        c.ellipse(W / 2 + sx * 72, 742, 36, 42 * open, 0, 0, TAU);
        fillStroke(c, '#fffbe6', INK, 6);
        c.beginPath();
        c.ellipse(W / 2 + sx * 72 + look * 12, 748, 17, 21 * open, 0, 0, TAU);
        c.fillStyle = INK;
        c.fill();
      }
    }
    c.restore();
    // sill
    c.beginPath();
    c.roundRect(W / 2 - 330, 850, 660, 60, 14);
    fillStroke(c, '#6a59a0', INK, 12);
  },
  over: (c) => vignette(c, 0.6),
};
function winPath(c) {
  c.beginPath();
  c.moveTo(W / 2 - 270, 870);
  c.lineTo(W / 2 - 270, 470);
  c.arc(W / 2, 470, 270, Math.PI, 0);
  c.lineTo(W / 2 + 270, 870);
  c.closePath();
}

const gateShot = {
  t: 9.6, wash: 0.5, hand: 0.3,
  cam: (s) => {
    const sh = shake(s.lt - 1.0, 26, s.d);
    return cam(W / 2 + sh[0], lerp(620, 700, easeInOut(s.k)) + sh[1], lerp(1.0, 1.22, easeInOut(s.k)));
  },
  bg(c, s) {
    sky(c, '#140d33', '#4a2b7a');
    twinkleStars(c, s.t, 120, H * 0.6, 3);
    const open = key(s.lt, [[0.2, 0], [1.0, 1, 'in']]);
    P.castle(c, W / 2, 1010, 2.5, { t: s.t, night: true, gateOpen: open, glow: open });
    c.fillStyle = '#2a1f55';
    c.fillRect(-100, 1000, W + 200, 200);
    const g = c.createRadialGradient(W / 2, 800, 40, W / 2, 800, 900);
    g.addColorStop(0, `rgba(255,236,160,${0.5 * clamp((s.lt - 1) / 0.3)})`);
    g.addColorStop(1, 'rgba(255,236,160,0)');
    c.fillStyle = g;
    c.fillRect(-200, -200, W + 400, H + 400);
  },
  cel(c, s) {
    const a = s.ltc - 1.0;
    if (a < 0.08) return;
    // little silhouette in the doorway, winding up
    const crouch = key(s.ltc, [[1.45, 0], [1.75, 0.3, 'out']]);
    brie(c, { view: 'front', x: W / 2, y: 1004, s: lerp(0.5, 1.15, easeOut(a / 0.5)), expr: 'happy', wag: wag(s.tc), sq: crouch, shadow: false });
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = 'rgba(43,28,82,0.86)';
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over';
  },
  fx(c, s) {
    const a = s.lt - 1.0;
    if (a < 0) return;
    puff(c, W / 2 - 300, 1010, a, 1.3, 1, '#8f7fd0');
    puff(c, W / 2 + 300, 1010, a, 1.3, 2, '#8f7fd0');
  },
  over: (c) => vignette(c, 0.5),
};

/* ---------------- entrance: six smash cuts, one per shout ---------------- */
const pawShot = {
  t: 11.4, tr: 'flash', punch: 2, wordAt: () => [0.22, 0.26, -0.1, 1.5],
  cam: (s) => {
    const sh = shake(s.lt - 0.14, 44, s.d);
    return cam(W / 2 + sh[0], H / 2 + sh[1], 1);
  },
  bg(c, s) {
    burstBg('#ff7da5', '#ffd1e3')(c, s);
    c.fillStyle = '#ff5d8f';
    c.fillRect(-100, 860, W + 200, 400);
    c.fillStyle = INK;
    c.fillRect(-100, 852, W + 200, 12);
  },
  cel(c, s) {
    const a = s.ltc - 0.14;
    const y = s.lt < 0.14 ? lerp(-260, 860, easeIn(s.lt / 0.14)) : 860;
    const sq = s.lt < 0.14 ? -0.3 : 0.42 * Math.exp(-Math.max(a, 0) * 8) * Math.cos(Math.max(a, 0) * 20);
    if (a >= 0) pow(c, W / 2, 850, 560, a, '#ffd84d', 12, 3, Infinity);
    shadow(c, W / 2, 866, 330, 0.25);
    c.save();
    c.translate(W / 2, y);
    c.scale(1 + sq * 0.8, 1 - sq);
    blob(c, [[0, -620, 150, 560, 0], [30, -110, 250, 130, 0], [-150, -90, 90, 80, 0], [200, -90, 100, 84, 0]], '#fdfbff', 16);
    c.strokeStyle = '#d9cfe8';
    c.lineWidth = 12;
    c.lineCap = 'round';
    for (const x of [-90, 30, 150]) {
      c.beginPath();
      c.moveTo(x, -60);
      c.lineTo(x + 8, -6);
      c.stroke();
    }
    c.restore();
  },
  fx(c, s) {
    const a = s.ltc - 0.14;
    ring(c, W / 2, 860, a, 1100, '#ffffff');
    puff(c, W / 2 - 330, 850, a, 1.5, 4);
    puff(c, W / 2 + 360, 850, a, 1.5, 5);
  },
};

const tailShot = {
  t: 12.42, punch: 2, wordAt: () => [0.2, 0.3, 0.08, 1.5],
  cam: (s) => cam(W / 2, H / 2, crash(s.lt, 1, 1.25, 0, 2), Math.sin(s.ltc * 26) * 0.02),
  bg: burstBg('#ffd84d', '#fff3b0', 'rgba(255,255,255,0.9)', 460),
  cel(c, s) {
    const w = Math.sin(s.ltc * 30);
    brie(c, { x: 1090 + w * 20, y: 880, s: 2.2, dir: 1, rot: w * 0.045, wag: s.ltc * 46, sq: 0.05 * Math.abs(w), eyes: 'happy', mouth: 0.6, shadow: false });
  },
  fx(c, s) {
    // wag arcs
    c.strokeStyle = '#ffffff';
    c.lineWidth = 14;
    c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const r = 175 + i * 50 + (s.d % 2) * 14;
      for (const sx of [-1, 1]) {
        c.beginPath();
        c.arc(865, 670, r, -Math.PI / 2 + sx * 0.5, -Math.PI / 2 + sx * 0.95, sx < 0);
        c.stroke();
      }
    }
  },
};

const noseShot = {
  t: 13.32, punch: 2, wordAt: () => [0.5, 0.86, -0.04, 1.5],
  cam: (s) => {
    const sh = shake(s.lt - 0.17, 30, s.d);
    return cam(W / 2 + sh[0], H / 2 + sh[1], 1);
  },
  bg: burstBg('#7fd3ff', '#d9f6ff', 'rgba(255,255,255,0.9)', 520),
  cel(c, s) {
    const sc = key(s.ltc, [[0, 1.0], [0.17, 5.2, 'in'], [0.42, 4.2, 'out'], [0.6, 5.4, 'in'], [1.0, 4.6, 'out']]);
    const b1 = s.ltc - 0.17, b2 = s.ltc - 0.6;
    const sq = (b1 >= 0 ? 0.2 * Math.exp(-b1 * 10) : 0) + (b2 >= 0 ? 0.2 * Math.exp(-b2 * 10) : 0);
    brie(c, { view: 'head', x: W / 2, y: 560 - sc * 16, s: sc, sq, expr: 'innocent', fLook: 0, wag: s.tc * 14, earFlop: 0.3 });
  },
  fx(c, s) {
    for (const t0 of [0.17, 0.6]) {
      const a = s.ltc - t0;
      if (a < 0 || a > 0.4) continue;
      c.save();
      c.globalAlpha = 1 - a / 0.4;
      c.strokeStyle = '#ffffff';
      c.lineWidth = 18;
      c.beginPath();
      c.arc(W / 2, 560, 120 + easeOut(a / 0.4) * 520, 0, TAU);
      c.stroke();
      c.restore();
    }
  },
};

const earsShot = {
  t: 14.0, punch: 2, wordAt: () => [0.2, 0.26, -0.1, 1.6],
  cam: (s) => cam(W / 2, 520, crash(s.lt, 1, 1.5, 0.04, 3), Math.sin(s.ltc * 31) * 0.03),
  bg: burstBg('#b77dff', '#e9d6ff', 'rgba(255,255,255,0.85)', 430),
  cel(c, s) {
    const w = Math.sin(s.ltc * 34);
    brie(c, { view: 'front', x: W / 2 + w * 24, y: 1090, s: 2.0, expr: 'shout', tilt: w * 0.28, earFlop: 1.3, wag: s.ltc * 20, sq: 0.04 * w });
  },
  fx(c, s) {
    sparkles(c, s.tc, W / 2, 500, 620, 14, 5);
  },
};

const eyesShot = {
  t: 14.64, punch: 1.5, hand: 0.6, wordAt: () => [0.8, 0.2, 0.1, 1.6],
  cam: (s) => cam(W / 2, H / 2, lerp(1.12, 1.0, easeOut(s.lt / 0.3))),
  bg: burstBg('#ff9ec4', '#ffe0ee', 'rgba(255,255,255,0.7)', 620),
  cel(c, s) {
    const shut = s.ltc > 0.33 && s.ltc < 0.46;
    brie(c, { view: 'head', x: W / 2, y: 590, s: 3.8, expr: 'innocent', fEyes: shut ? 'closed' : 'wide', fLook: 0, wag: s.tc * 10, earFlop: 0.2, lw: 5 });
  },
  fx(c, s) {
    sparkles(c, s.tc, W / 2, 520, 800, 22, 9, '#ffffff');
  },
};

const heroShot = {
  t: 15.28, punch: 2, wordAt: () => [0.5, 0.16, -0.05, 1.45],
  impact: (s) => (s.d === 2 ? 1 : s.d === 3 ? 2 : 0),
  cam: (s) => {
    const sh = shake(s.lt - 0.167, 50, s.d);
    return cam(W / 2 + sh[0], H / 2 + sh[1], punch(s.lt - 0.167, 0.1, 0.4));
  },
  bg: burstBg('#ff7da5', '#ffd84d', 'rgba(255,255,255,0.9)', 400),
  cel(c, s) {
    const a = s.ltc - 0.167;
    if (a < 0) {
      brie(c, { view: 'front', x: W / 2, y: lerp(-300, 1060, easeIn(s.ltc / 0.167)), ground: 1060, s: 2.3, sq: -0.35, expr: 'shout', earFlop: 0.4, wag: 0 });
    } else {
      pow(c, W / 2, 900, 820, a, '#ffffff', 14, 7, Infinity);
      const sq = 0.45 * Math.exp(-a * 7) * Math.cos(a * 19);
      brie(c, { view: 'front', x: W / 2, y: 1060, s: 2.3, sq, expr: a < 0.12 ? 'innocent' : 'shout', tilt: Math.sin(s.ltc * 9) * 0.07, earFlop: 0.5, wag: wag(s.tc) });
    }
  },
  fx(c, s) {
    const a = s.ltc - 0.167;
    ring(c, W / 2, 1030, a, 1300, '#ffffff', 0.5);
    puff(c, W / 2 - 420, 1020, a, 1.6, 11);
    puff(c, W / 2 + 420, 1020, a, 1.6, 12);
    if (a > 0.2) sparkles(c, s.tc, W / 2, 560, 560, 18, 2);
  },
};

/* ---------------- title ---------------- */
const LAND = 1.0; // Brie lands on the logo
const titleCard = {
  t: 16.2, tr: 'flash',
  cam: (s) => {
    const sh = shake(s.lt - LAND, 30, s.d);
    return cam(W / 2 + sh[0], H / 2 + sh[1], lerp(1.06, 1.0, easeOut(s.lt / 0.5)));
  },
  bg(c, s) {
    sunburst(c, s.tc, W / 2, H / 2, '#ffd84d', '#fff3b0', 22, 0.2);
    halftone(c, 'rgba(255,140,60,0.25)', 34, 9);
  },
  cel(c, s) {
    const a = s.ltc - LAND;
    const leap = key(s.ltc, [[3.0, 0], [3.25, -0.25, 'out'], [3.95, 1, 'in']]); // crouch, then at the lens
    const beat = pulse(s.tc, 6);
    const lsq = a < 0 ? 0 : 0.32 * Math.exp(-a * 6) * Math.cos(a * 18) + 0.03 * beat + (leap < 0 ? -leap * 0.5 : 0);
    // the logo squashes under her and bounces
    c.save();
    c.translate(W / 2, 880);
    c.scale(1 + lsq * 0.5, 1 - lsq);
    logo(c, 0, -260, 1.0, s.ltc, { ribbon: true });
    c.restore();
    const top = 880 - 420 * (1 - lsq);
    if (a < 0) {
      const u = clamp((s.ltc - (LAND - 0.25)) / 0.25);
      if (s.ltc > LAND - 0.25) brie(c, { view: 'front', x: W / 2, y: lerp(-260, top, easeIn(u)), s: 1.45, sq: -0.3, expr: 'shout', shadow: false });
    } else if (leap <= 0) {
      const sq = 0.4 * Math.exp(-a * 7) * Math.cos(a * 18) + 0.06 * beat - leap * 1.2;
      brie(c, { view: 'front', x: W / 2, y: top + 24, s: 1.45, sq, expr: a < 0.15 ? 'innocent' : 'happy', tilt: Math.sin(s.ltc * 5) * 0.08, wag: wag(s.tc), earFlop: 0.4, shadow: false });
    } else {
      brie(c, { view: 'front', x: W / 2, y: lerp(top + 24, 1750, leap), s: lerp(1.45, 9, leap * leap), sq: -0.15 * (1 - leap), expr: 'shout', earFlop: 1, wag: wag(s.tc), shadow: false });
    }
  },
  fx(c, s) {
    const a = s.ltc - LAND;
    ring(c, W / 2, 470, a, 900, '#ffffff');
    if (a > 0) sparkles(c, s.tc, W / 2, 420, 620, 14, 4);
  },
};

const RUN0 = 20.4;
const runWide = {
  t: RUN0, tr: 'fluff', hand: 0.6,
  cam: (s) => cam(W / 2 + 40, H / 2 + Math.sin(s.lt * 7) * 6, 1.02),
  bg: (c, s) => dayOutdoor(c, s.t, (s.t - RUN0) * 900),
  cel(c, s) {
    const x = key(s.lt, [[0, -260], [0.8, 640, 'out']]) + Math.sin(s.lt * 1.7) * 30;
    const ph = run(s.tc, 1);
    brie(c, { x, y: 910, s: 1.3, phase: ph, ear: 0.85, mouth: 0.5, eyes: blink(s.tc, 3) ? 'closed' : 'happy', wag: wag(s.tc), lean: 0.12 });
  },
  fx(c, s) {
    const x = key(s.lt, [[0, -260], [0.8, 640, 'out']]) + Math.sin(s.lt * 1.7) * 30;
    speedLines(c, s.tc, 0.6, -1, 'rgba(255,255,255,0.75)', 200, 900);
    const step = 0.449;
    for (let i = 0; i < 3; i++) {
      const t0 = Math.floor(s.tc / step) * step - i * step;
      puff(c, x - 150 - (s.tc - t0) * 900, 915, s.tc - t0, 0.55, Math.floor(t0 * 10));
    }
  },
};

const runClose = {
  t: 22.6, tr: 'whipR', hand: 1.2, punch: 2,
  cam: (s) => cam(W / 2, H / 2 + Math.abs(Math.sin(beatAt(s.t) * Math.PI)) * 18, 1.06, -0.045),
  bg: (c, s) => dayOutdoor(c, s.t, (s.t - RUN0) * 900 + (s.t - 22.6) * 1500),
  cel(c, s) {
    const ph = run(s.tc, 1);
    brie(c, { x: 820 + Math.sin(s.lt * 2.2) * 40, y: 985, s: 1.8, phase: ph, ear: 1, mouth: 0.85, eyes: blink(s.tc, 5) ? 'closed' : 'happy', wag: wag(s.tc), lean: 0.14 });
  },
  fx(c, s) {
    speedLines(c, s.tc, 1, -1, 'rgba(255,255,255,0.8)', 80, 1000);
    // grass and flowers whipping past the lens
    for (let i = 0; i < 7; i++) {
      const x = W + 500 - frac(s.lt * 1.35 + rand(i * 3.1)) * (W + 1000);
      const h = 150 + rand(i + 5) * 170;
      c.fillStyle = i % 3 ? '#3fae4e' : '#57c765';
      for (let b = -2; b <= 2; b++) {
        c.beginPath();
        c.moveTo(x + b * 34 - 26, H + 20);
        c.quadraticCurveTo(x + b * 34 - 60, H - h * 0.6, x + b * 50 - 150, H - h - Math.abs(b) * -30);
        c.quadraticCurveTo(x + b * 34 - 10, H - h * 0.5, x + b * 34 + 26, H + 20);
        c.fill();
      }
    }
  },
};

const SLAM = 1.66;
const houseShot = {
  t: 24.4, tr: 'whipR', hand: 0.3,
  cam: (s) => {
    const sh = shake(s.lt - SLAM, 34, s.d);
    const z = s.lt < SLAM ? 1 : crash(s.lt, 1, 1.42, SLAM, 3);
    return cam(lerp(W / 2, 1400, clamp((z - 1) / 0.42)) + sh[0], lerp(H / 2, 560, clamp((z - 1) / 0.42)) + sh[1], z);
  },
  bg(c, s) {
    dayOutdoor(c, s.t, 5200);
  },
  cel(c, s) {
    const a = s.ltc - SLAM;
    const bulge = a < 0 ? 0 : Math.exp(-a * 5) * Math.cos(a * 22) + (a > 0.45 ? 0.25 * Math.abs(Math.sin(a * 13)) * Math.exp(-(a - 0.45) * 1.5) : 0);
    const open = s.ltc > 1.3 && a < 0 ? 1 : 0;
    house(c, 1400, 850, 0.95, open, bulge);
    const lt = s.ltc;
    let o;
    if (lt < 0.72) o = { ...skid(lt, { t0: 0, dur: 0.5, x0: -200, x1: 520, dir: 1 }), wag: 0 };
    else {
      const tk = take(lt, 0.72);
      const z = zip(lt, { t0: 1.4, x: 520, dir: 1, wind: 0.34, dist: 1000 });
      o = { ...z, sq: tk.sq * (z.scramble ? 0 : 1), eyes: tk.wide && !z.scramble ? 'wide' : z.eyes ?? 'happy', mouth: z.mouth ?? 0.3, wag: wag(s.tc) };
    }
    if (o.x < 1330) brie(c, { y: 910, s: 1.1, ...o });
    if (a >= 0) pow(c, 1400, 800, 210, a, '#ffffff', 10, 3, 0.3);
  },
  fx(c, s) {
    const lt = s.ltc;
    if (lt < 0.6) for (let i = 0; i < 3; i++) puff(c, lerp(-200, 520, easeOut((lt - i * 0.1) / 0.5)) + 90, 915, lt - i * 0.12, 0.6, i);
    if (lt > 0.86 && lt < 1.3) bigLabel(c, '!', 640, 600, 220, '#ff5d8f', (lt - 0.86) * 3, 0.1);
    puff(c, 480, 905, lt - 1.4, 1.2, 9);
    const a = lt - SLAM;
    if (a >= 0) {
      bigLabel(c, 'BAM!', 1010, 420, 200, '#ffd84d', a * 3, -0.12);
      puff(c, 1250, 850, a, 1.1, 13);
      puff(c, 1550, 850, a, 1.1, 14);
    }
  },
};

/* ---------------- arrive: chaos in the living room ---------------- */
const TOYS = ['toast', 'onigiri', 'milk', 'sunny', 'birdie'];
function tossToy(c, kind, x, y, a, dir, seed, r = 90) {
  if (a < 0 || a > 1.7) return;
  c.save();
  c.translate(x + a * 420 * dir, y - 760 * a + 880 * a * a);
  c.rotate(Math.sin(a * 7 + seed) * 0.9 + a * 2.4 * dir);
  P.plushToy(c, kind, r);
  c.restore();
}

const burstIn = {
  t: 26.63, tr: 'flash',
  cam: (s) => cam(W / 2 - 60 + clamp(s.lt / 1.8) * 120, H / 2, lerp(1.1, 1.0, easeOut(s.lt / 0.4))),
  bg: (c, s) => room(c, 'living', 300, s.t),
  cel(c, s) {
    const lt = s.ltc;
    let o;
    if (lt < 0.75) o = skid(lt, { t0: 0, dur: 0.55, x0: -260, x1: 760, dir: 1 });
    else {
      const tk = take(lt, 0.8);
      const z = zip(lt, { t0: 1.62, x: 760, dir: 1, wind: 0.34 });
      o = { ...z, sq: z.scramble ? 0 : tk.sq, eyes: z.scramble || z.gone ? z.eyes : tk.wide ? 'wide' : 'happy', look: lt < 1.1 ? -1 : 1, headTilt: z.scramble ? 0 : Math.sin(lt * 10) * 0.12 };
    }
    brie(c, { y: 960, s: 1.15, wag: wag(s.tc), mouth: 0.5, ...o });
  },
  fx(c, s) {
    const lt = s.ltc;
    for (let i = 0; i < 4; i++) puff(c, lerp(-260, 760, easeOut((lt - i * 0.1) / 0.55)) + 100, 962, lt - i * 0.1, 0.7, i, '#f6e2c8');
    puff(c, 720, 950, lt - 1.62, 1.4, 6, '#f6e2c8');
  },
};

// one pass across the room; dir alternates and the camera whips after her
const pass = (t, dir, camX, variant) => ({
  t, tr: dir > 0 ? 'whipR' : 'whipL', hand: 0.8, punch: 2,
  cam: (s) => cam(W / 2 + dir * lerp(-70, 70, s.k), H / 2, 1.05, dir * 0.015),
  bg: (c, s) => room(c, 'living', camX + dir * s.lt * 160, s.t),
  cel(c, s) {
    const u = clamp(s.lt / s.dur);
    const x = dir > 0 ? lerp(-300, W + 400, u) : lerp(W + 300, -400, u);
    for (let i = 0; i < 3; i++) tossToy(c, TOYS[(i + variant * 2) % 5], dir > 0 ? 300 + i * 520 : W - 300 - i * 520, 760, s.ltc - 0.12 - i * 0.2, dir * (i % 2 ? 0.5 : -0.3), i + variant, 96);
    if (variant === 1) {
      // bounding over the furniture
      const hop = Math.abs(Math.sin(u * Math.PI * 2));
      brie(c, { x, y: 960 - hop * 300, ground: 960, dir, s: 1.2, pitch: -0.3 * Math.cos(u * Math.PI * 2), legs: [-0.9 + hop * 0.6, 0.9 - hop * 0.6], bob: 0, sq: -0.14, ear: 1, mouth: 0.9, eyes: 'happy', wag: wag(s.tc), trail: { dx: dir * 70, dy: 0, n: 2 } });
    } else {
      brie(c, { x, y: 960, dir, s: 1.2, phase: frac(s.ltc * 5), ear: 1, mouth: 0.8, eyes: 'happy', wag: wag(s.tc), lean: 0.3, stretch: 1.25, trail: { dx: dir * 80, dy: 0, n: 3 } });
    }
  },
  fx(c, s) {
    speedLines(c, s.tc, 1, dir, 'rgba(255,255,255,0.85)', 560, 1010);
    const u = clamp(s.lt / s.dur);
    const x = dir > 0 ? lerp(-300, W + 400, u) : lerp(W + 300, -400, u);
    if (variant !== 1) for (let i = 1; i < 4; i++) puff(c, x - dir * i * 210, 965, i * 0.1, 0.6, i + s.d, '#f6e2c8');
  },
});

const vaseShot = {
  t: 31.13, tr: 'whipR', hand: 0.5,
  cam: (s) => cam(1010, 560, lerp(1.5, 1.72, easeOut(s.k))),
  bg(c, s) {
    room(c, 'living', 0, s.t, false);
    P.furniture(c, 'frame', 520, FY, s.t);
    P.furniture(c, 'shelf', 1480, FY, s.t);
  },
  cel(c, s) {
    const lt = s.ltc;
    // gusts as she streaks past behind the plant
    const g1 = lt - 0.3, g2 = lt - 1.25;
    const rot = (g1 > 0 ? 0.3 * Math.exp(-g1 * 1.6) * Math.sin(g1 * 15) : 0) + (g2 > 0 ? -0.62 * Math.exp(-g2 * 1.25) * Math.sin(g2 * 11) : 0);
    for (const [t0, dir] of [[0.12, 1], [1.07, -1]]) {
      const u = (lt - t0) / 0.3;
      if (u < 0 || u > 1) continue;
      brie(c, { x: dir > 0 ? lerp(300, 1750, u) : lerp(1750, 300, u), y: 900, dir, s: 1.15, phase: frac(lt * 6), ear: 1, mouth: 0.8, eyes: 'happy', stretch: 2.1, lean: 0.3, shadow: false, trail: { dx: dir * 150, dy: 0, n: 3 } });
    }
    shadow(c, 1010, FY + 6, 110, 0.2);
    c.save();
    c.translate(1010 + rot * 30, FY);
    c.rotate(rot);
    P.furniture(c, 'plant', 0, 0, s.tc);
    c.restore();
  },
  fx(c, s) {
    const lt = s.ltc;
    for (const [t0, dir] of [[0.12, 1], [1.07, -1]]) if (lt > t0 && lt < t0 + 0.45) speedLines(c, s.tc, 1, dir, 'rgba(255,255,255,0.9)', 500, 900);
    // sweat drops off the pot while it teeters
    if (lt > 1.4 && lt < 2.1) for (let i = 0; i < 3; i++) {
      const a = (lt - 1.4 - i * 0.12) * 2.2;
      if (a < 0 || a > 1) continue;
      c.save();
      c.translate(1010 + (i - 1) * 170 * a + (i - 1) * 60, 560 - Math.sin(a * Math.PI) * 60);
      c.rotate((i - 1) * 0.6);
      c.beginPath();
      c.moveTo(0, -24);
      c.quadraticCurveTo(16, 0, 0, 12);
      c.quadraticCurveTo(-16, 0, 0, -24);
      fillStroke(c, '#7fd3ff', INK, 4);
      c.restore();
    }
    if (lt > 2.15) bigLabel(c, 'UFA!', 1270, 470, 90, '#5fd77a', (lt - 2.15) * 3, 0.1);
  },
};

const CATCH = { t0: 0.55, dur: 0.62, from: [330, 965], to: [1380, 965], h: 470 };
const toysShot = {
  t: 33.7, tr: 'whipL', hand: 0.5,
  cam: (s) => {
    const sh = shake(s.lt - (CATCH.t0 + CATCH.dur), 26, s.d);
    return cam(W / 2 + sh[0], lerp(600, 520, clamp(s.lt / 1.0)) + sh[1], 1.06, -0.02);
  },
  bg: (c, s) => room(c, 'living', 1250, s.t),
  cel(c, s) {
    const lt = s.ltc;
    for (let i = 0; i < 6; i++) tossToy(c, TOYS[i % 4], 200 + i * 300, 900, lt + 0.5 - i * 0.22, i % 2 ? 0.25 : -0.25, i, 84);
    const j = jump(lt, CATCH);
    const grabbed = lt > CATCH.t0 + CATCH.dur * 0.5;
    const after = lt - (CATCH.t0 + CATCH.dur);
    const shakeHead = after > 0.25 ? Math.sin(after * 26) * 0.3 : 0;
    const o = { ...j, x: j.x, y: j.y, s: 1.2, dir: 1, mouth: grabbed ? 0.35 : j.air ? 1 : 0.4, eyes: after > 0.25 ? 'happy' : 'wide', wag: wag(s.tc), headTilt: shakeHead, tongue: !grabbed, phase: null };
    if (lt < CATCH.t0 - 0.16) Object.assign(o, { x: lerp(-200, 330, easeOut(lt / 0.36)), phase: frac(lt * 5), ear: 0.6 });
    if (!grabbed) {
      c.save();
      c.translate(855, 420 + Math.sin(lt * 9) * 14);
      c.rotate(Math.sin(lt * 5) * 0.3);
      P.plushToy(c, 'birdie', 84);
      c.restore();
    }
    brie(c, o);
    if (grabbed) {
      // birdie clamped in her mouth
      const pitch = o.pitch ?? 0;
      c.save();
      c.translate(o.x, o.y);
      c.rotate(pitch);
      c.translate(196 * 1.2, -150 * 1.2 * (1 - (o.sq ?? 0)));
      c.rotate(shakeHead * 1.5 + 0.3);
      P.plushToy(c, 'birdie', 70);
      c.restore();
    }
  },
  fx(c, s) {
    const a = s.ltc - (CATCH.t0 + CATCH.dur);
    ring(c, CATCH.to[0], 970, a, 520, '#ffffff', 0.4);
    puff(c, CATCH.to[0] - 150, 965, a, 0.9, 3, '#f6e2c8');
    puff(c, CATCH.to[0] + 170, 965, a, 0.9, 4, '#f6e2c8');
    puff(c, 300, 960, s.ltc - CATCH.t0, 0.9, 5, '#f6e2c8');
    if (a > 0.3) bigLabel(c, 'NHAC!', 1010, 430, 130, '#ff5d8f', (a - 0.3) * 3, -0.08);
  },
};

const atCamera = {
  t: 35.5, tr: 'whipL', hand: 1, punch: 2,
  cam: (s) => cam(W / 2, H / 2, 1 + 0.05 * s.k, Math.sin(s.lt * 9) * 0.012),
  bg(c, s) {
    room(c, 'hall', 520, s.t);
    focusLines(c, s.tc, W / 2, 640, 0.9, 'rgba(255,255,255,0.75)', 300 + s.k * 500);
  },
  cel(c, s) {
    const g = key(s.lt, [[0, 0], [1.25, 0.24, 'in'], [1.8, 1, 'in']]);
    const sc = lerp(0.3, 11, g * g) + 0.55 * clamp(s.lt / 1.2);
    const b = Math.abs(Math.sin(beatAt(s.tc) * Math.PI * 2));
    brie(c, { view: 'front', x: W / 2 + Math.sin(s.ltc * 12) * 30 * (1 - g), y: lerp(880, 2700, g * g) - b * 90 * sc * 0.5, ground: lerp(880, 2700, g * g), s: sc, sq: 0.12 - b * 0.26, expr: 'shout', earFlop: 1.2, wag: wag(s.tc), tilt: Math.sin(s.ltc * 12) * 0.1 });
  },
  fx(c, s) {
    if (s.lt < 1.2) for (let i = 0; i < 3; i++) puff(c, W / 2 + (i - 1) * 160, 890 + s.lt * 60, frac(s.ltc * 2.2 + i * 0.33) * 0.6, 0.5 + s.lt * 0.5, i, '#f6e2c8');
  },
  top(c, s) {
    if (s.left < 0.25) flash(c, 1 - s.left / 0.25);
  },
};

export default {
  from: 0, to: 37.3,
  shots: [castleWide, windowShot, gateShot, pawShot, tailShot, noseShot, earsShot, eyesShot, heroShot, titleCard, runWide, runClose, houseShot,
    burstIn, pass(28.43, 1, 900, 0), pass(29.33, -1, 1500, 1), pass(30.23, 1, 300, 2), vaseShot, toysShot, atCamera],
};
