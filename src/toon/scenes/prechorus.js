// Pre-chorus (0:56 to 1:03): lion roar, cheese rocket, croc chomp, côve on skates.
import { sky, sunburst, focusLines, halftone, speedLines, flash } from '../../fx.js';
import { blob, fillStroke, noise } from '../../util.js';
import { bigLabel } from '../../text.js';
import * as P from '../../props.js';
import { costume, withRocket } from '../../costumes.js';
import { brie } from '../actor.js';
import { cam, crash, shake } from '../camera.js';
import { W, H, INK, TAU, clamp, lerp, easeOut, easeIn, easeInOut, easeOutBack, rand, key, run, wag, puff, ring, frac } from '../kit.js';

const screen = (c, fn) => {
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  fn();
  c.restore();
};
export function bonbon(c, x, y, r, rot, color) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  for (const sx of [-1, 1]) {
    c.beginPath();
    c.moveTo(sx * r * 0.8, 0);
    c.lineTo(sx * r * 1.75, -r * 0.62);
    c.lineTo(sx * r * 1.75, r * 0.62);
    c.closePath();
    fillStroke(c, color, INK, 6);
  }
  c.beginPath();
  c.arc(0, 0, r, 0, TAU);
  fillStroke(c, '#6b3b1f', INK, 6);
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.beginPath();
  c.ellipse(-r * 0.35, -r * 0.35, r * 0.28, r * 0.16, -0.6, 0, TAU);
  c.fill();
  c.restore();
}
export const CANDY = ['#ff5d8f', '#4cc3ff', '#ffd84d', '#37c45c'];
const HEAD = 194; // front view: head centre above the feet

/* ---------------- lion ---------------- */
const lionBg = (c, s) => {
  c.fillStyle = '#ffcf3c';
  c.fillRect(-300, -300, W + 600, H + 600);
  sunburst(c, s.tc, W / 2, 540, '#ffe58a', '#ffcf3c', 18, 0.5);
  halftone(c, 'rgba(255,120,40,0.35)', 30, 10);
};
const lionRoar = {
  t: 56.05, tr: 'impact', hand: 0.8, punch: 2,
  wordAt: () => [0.2, 0.2, -0.1],
  cam: (s) => {
    const sh = shake(s.lt, 34, s.d);
    return cam(W / 2 + sh[0], H / 2 + sh[1], 1.02);
  },
  bg: lionBg,
  cel(c, s) {
    // inhale, then ROAR
    const sq = key(s.ltc, [[0, 0.3], [0.1, -0.2, 'out'], [0.3, 0, 'io']]) + 0.03 * Math.sin(s.ltc * 50);
    brie(c, { view: 'front', x: W / 2, y: 950, s: 1.95, sq, expr: 'shout', wag: wag(s.tc), costume: 'lion', ct: s.tc, earFlop: 0.6 });
  },
  fx(c, s) {
    for (let i = 0; i < 3; i++) ring(c, W / 2, 600, s.lt - i * 0.14, 1300, '#ffffff', 0.5);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + 0.3, r = 240 + easeOut(clamp(s.ltc / 0.5)) * (520 + (i % 3) * 90);
      bonbon(c, W / 2 + Math.cos(a) * r, 590 + Math.sin(a) * r * 0.62, 42, a * 2 + s.tc * 6, CANDY[i % 4]);
    }
  },
};
const lionMouth = {
  t: 56.62, hand: 1, punch: 2, keepWords: false,
  wordAt: (i) => (i === 1 ? [0.5, 0.9, -0.04, 0.85] : null),
  cam: (s) => cam(W / 2, 520, crash(s.lt, 1, 1.5, 0, 3), Math.sin(s.ltc * 30) * 0.02),
  bg: lionBg,
  cel(c, s) {
    brie(c, { view: 'front', x: W / 2, y: 540 + HEAD * 3.1, s: 3.1, sq: 0.03 * Math.sin(s.ltc * 60), expr: 'shout', costume: 'lion', ct: s.tc, shadow: false });
  },
  fx(c, s) {
    focusLines(c, s.tc, W / 2, 560, 1, 'rgba(255,255,255,0.9)', 560);
    // bonbons fly out of the roar, past the lens
    for (let i = 0; i < 8; i++) {
      const u = 0.3 + 0.7 * frac(s.lt * 1.5 + i / 8);
      const a = i * 2.4;
      bonbon(c, W / 2 + Math.cos(a) * u * 1000, 640 + Math.sin(a) * u * 620, 16 + u * 90, a + s.tc * 8, CANDY[i % 4]);
    }
  },
};

/* ---------------- cheese rocket ---------------- */
const LIFT = 0.56;
const padY = (lt) => 820 - easeIn(clamp((lt - LIFT) / 0.62)) * 1500;
const launch = {
  t: 57.4, tr: 'whipR', hand: 0.4,
  cam: (s) => {
    const sh = s.lt < LIFT ? [rand(s.d) * 14 - 7, rand(s.d + 3) * 14 - 7] : shake(s.lt - LIFT, 46, s.d, 0.6);
    return cam(W / 2 + sh[0], lerp(600, 420, easeInOut(clamp((s.lt - LIFT + 0.1) / 0.6))) + sh[1], 1.08);
  },
  bg(c, s) {
    sky(c, '#4cb8ff', '#bfe9ff');
    P.clouds(c, s.t, 300, 0.3, 140);
    P.hills(c, 400, 900, 50, '#7ed957', 0, 3);
    // launch pad
    c.beginPath();
    c.rect(560, 880, 800, 240);
    fillStroke(c, '#c9cfe0', INK, 10);
    for (let i = 0; i < 10; i++) {
      c.fillStyle = i % 2 ? INK : '#ffd84d';
      c.fillRect(565 + i * 79, 885, 79, 44);
    }
    c.beginPath();
    c.rect(1260, 330, 60, 550);
    fillStroke(c, '#ff5d5d', INK, 8);
    c.beginPath();
    c.rect(1140, 430, 130, 30);
    fillStroke(c, '#c9cfe0', INK, 8);
  },
  cel(c, s) {
    const y = padY(s.lt);
    const up = s.lt > LIFT;
    const sc = 1.5;
    brie(c, {
      x: W / 2 + 92 * sc + (up ? 0 : (s.d % 2 ? 6 : -6)), y, s: sc, rot: -Math.PI / 2, shadow: false,
      phase: null, ear: up ? 1 : 0.2, mouth: up ? 1 : 0.3, eyes: up ? 'happy' : 'wide', wag: wag(s.tc),
      stretch: up ? 1 + 0.5 * clamp((s.lt - LIFT) / 0.3) : 1 - 0.12 * clamp(s.lt / LIFT),
      trail: up ? { dx: 0, dy: -130, n: 3 } : null,
      ...withRocket(costume('cheese', s.tc), s.tc),
    });
  },
  fx(c, s) {
    const y = padY(s.lt);
    // exhaust column and pad smoke
    if (s.lt > LIFT - 0.3) {
      for (let i = 0; i < 9; i++) {
        const py = y + 60 + i * 110;
        if (py > 900) break;
        blob(c, [[W / 2 + noise(i + s.tc * 9) * 30, py, 44 + i * 9]], i < 2 ? '#ffd84d' : '#ffffff', 5);
      }
      for (let i = 0; i < 12; i++) {
        const side = i % 2 ? 1 : -1;
        puff(c, W / 2 + side * (150 + i * 52 * easeOut(clamp((s.lt - LIFT + 0.3) / 0.7))), 900 - (i % 3) * 16, (s.ltc - LIFT + 0.3) * 0.5 + (i % 4) * 0.03, 1.25, i, '#ffffff');
      }
    }
    const n = Math.floor(s.lt / 0.18);
    if (n < 3) bigLabel(c, String(3 - n), 420, 400, 260, CANDY[n], (s.lt - n * 0.18) * 5, -0.1);
    else bigLabel(c, 'FOGUETE!', 430, 380, 130, '#ff8c42', (s.lt - 0.54) * 4, -0.08);
  },
};
const flight = {
  t: 58.6, tr: 'whipU', hand: 1.2, punch: 1.5,
  cam: (s) => cam(W / 2, H / 2, 1.05, -0.06 + Math.sin(s.lt * 4) * 0.03),
  bg(c, s) {
    c.fillStyle = '#4cb8ff';
    c.fillRect(-200, -200, W + 400, H + 400);
    sky(c, '#3aa2ff', '#bfe9ff');
    P.clouds(c, s.t, s.lt * 3600, 0.4, 100);
    P.clouds(c, s.t + 40, s.lt * 2200 + 500, 0.4, 560);
  },
  cel(c, s) {
    const out = easeIn(clamp((s.lt - 0.82) / 0.3));
    const x = 820 + Math.sin(s.lt * 3) * 120 + out * 1700, y = 560 + Math.sin(s.lt * 7) * 70 - out * 500;
    for (let i = 10; i >= 1; i--) blob(c, [[x - 150 - i * 115, y - 60 + Math.sin((s.lt - i * 0.035) * 7) * 70 + i * 6, 30 + i * 9]], i < 2 ? '#ffd84d' : '#ffffff', 5);
    brie(c, {
      x, y: y + 130, s: 1.45, rot: -0.14 + Math.cos(s.lt * 7) * 0.1 - out * 0.4, shadow: false, phase: null, ear: 1, mouth: 1, eyes: 'happy', wag: wag(s.tc),
      stretch: 1 + out * 0.8, trail: out > 0 ? { dx: 150, dy: -40, n: 3 } : null, ...withRocket(costume('cheese', s.tc), s.tc),
    });
  },
  fx(c, s) {
    speedLines(c, s.tc, 1, -1, 'rgba(255,255,255,0.85)');
    // clouds whipping past the lens
    for (let i = 0; i < 3; i++) {
      const u = frac(s.lt * 1.3 + i * 0.37);
      const x = W + 700 - u * (W + 1500), y = [200, 930, 80][i];
      blob(c, [[x, y, 190], [x + 210, y + 30, 150], [x - 200, y + 40, 140]], '#ffffff', 6);
    }
  },
};

/* ---------------- croc ---------------- */
const crocBg = (c, s) => {
  c.fillStyle = '#7ee08a';
  c.fillRect(-300, -300, W + 600, H + 600);
  sunburst(c, s.tc, W / 2, 540, '#c9f6d3', '#7ee08a', 18, 0.5);
  halftone(c, 'rgba(30,140,60,0.3)', 30, 10);
};
function jaws(c, k) {
  const gap = (1 - k) * 700;
  if (k >= 0.97) {
    c.fillStyle = INK;
    c.fillRect(0, H / 2 - 60, W, 120);
  }
  for (const sy of [-1, 1]) {
    c.save();
    c.translate(W / 2, H / 2 + sy * gap);
    c.scale(1, sy);
    c.beginPath();
    c.rect(-W, 40, W * 2, H);
    fillStroke(c, '#37c45c', INK, 16);
    c.fillStyle = '#2aa24a';
    for (let i = -6; i <= 6; i++) {
      c.beginPath();
      c.ellipse(i * 170 + 40, 260 + (i & 1) * 120, 46, 30, 0, 0, TAU);
      c.fill();
    }
    for (let i = -9; i <= 9; i++) {
      const x = i * 124 + (sy > 0 ? 62 : 0);
      c.beginPath();
      c.moveTo(x - 58, 46);
      c.lineTo(x, -62);
      c.lineTo(x + 58, 46);
      c.closePath();
      fillStroke(c, '#ffffff', INK, 10);
    }
    c.restore();
  }
}
const crocStomp = {
  t: 59.75, tr: 'impact', hand: 0.8, punch: 2,
  wordAt: () => [0.3, 0.17, -0.1],
  cam: (s) => cam(W / 2, 600, 1.06, -0.05),
  bg(c, s) {
    crocBg(c, s);
    c.fillStyle = '#5cc76e';
    c.fillRect(-300, 900, W + 600, 500);
    c.fillStyle = INK;
    c.fillRect(-300, 894, W + 600, 12);
  },
  cel(c, s) {
    // stomping in from the left, jaws snapping
    const x = lerp(-200, 1060, easeOut(clamp(s.lt / 0.7)));
    const snap = s.d % 4 < 2;
    brie(c, { x, y: 900 - Math.abs(Math.sin(s.ltc * 14)) * 40, ground: 900, s: 1.7, phase: frac(s.ltc * 3.5), amp: 1, lean: 0.12, mouth: snap ? 1 : 0, eyes: 'happy', ear: 0.6, costume: 'croc', ct: s.tc });
  },
  fx(c, s) {
    for (let i = 0; i < 4; i++) puff(c, lerp(-200, 1060, easeOut(clamp((s.ltc - i * 0.15) / 0.7))) - 140, 905, s.ltc - i * 0.15, 1.2, i, '#eafff0');
    if (s.d % 4 < 2 && s.lt > 0.2) bigLabel(c, 'NHAC!', 1480, 520, 120, '#ffffff', 0.5, 0.1);
  },
};
const crocLunge = {
  t: 60.62, hand: 1, punch: 2,
  wordAt: (i) => (i === 1 ? [0.5, 0.12, -0.03, 0.9] : null),
  cam: (s) => cam(W / 2, H / 2, 1, Math.sin(s.ltc * 26) * 0.02),
  bg: crocBg,
  cel(c, s) {
    const g = key(s.lt, [[0, 0], [0.14, -0.06, 'out'], [0.6, 1, 'in']]);
    const sc = lerp(1.5, 5.2, g);
    brie(c, { view: 'front', x: W / 2 + Math.sin(s.ltc * 20) * 14, y: 560 + HEAD * sc, s: sc, expr: 'shout', tilt: Math.sin(s.ltc * 9) * 0.08, costume: 'croc', ct: s.tc, shadow: false });
  },
  fx(c, s) {
    focusLines(c, s.tc, W / 2, 560, 1, 'rgba(255,255,255,0.9)', 420 + s.k * 300);
  },
  top(c, s) {
    if (s.left < 0.26) jaws(c, easeIn(1 - s.left / 0.26));
  },
};

/* ---------------- côve on skates: rollercoaster ---------------- */
const railY = (x) => 620 + 230 * Math.sin(x / 620) + 110 * Math.sin(x / 270 + 1);
const railA = (x) => Math.atan2(railY(x + 20) - railY(x - 20), 40);
const rideX = (lt) => 300 + lt * 2500;
function track(c, x0, x1, yOf, color) {
  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (let x = Math.floor(x0 / 260) * 260; x < x1; x += 260) {
    c.beginPath();
    c.moveTo(x, yOf(x) + 10);
    c.lineTo(x, yOf(x) + 1700);
    c.strokeStyle = INK;
    c.lineWidth = 14;
    c.stroke();
    c.strokeStyle = '#ffd84d';
    c.lineWidth = 6;
    c.stroke();
  }
  c.beginPath();
  for (let x = x0; x <= x1; x += 40) c.lineTo(x, yOf(x));
  c.strokeStyle = INK;
  c.lineWidth = 22;
  c.stroke();
  c.strokeStyle = color;
  c.lineWidth = 12;
  c.stroke();
}
function rider(c, x, yOf, sc, tc, draw) {
  const a = Math.atan2(yOf(x + 20) - yOf(x - 20), 40);
  c.save();
  c.translate(x, yOf(x) - 12);
  c.rotate(a);
  c.scale(sc, sc);
  P.skate(c, -50, 0, 1, tc * 30);
  P.skate(c, 80, 0, 1, tc * 30);
  c.translate(0, -58);
  draw();
  c.restore();
}
const ride = {
  t: 61.34, free: true, hand: 0.6, punch: 1.5,
  cam: (s) => {
    const x = rideX(s.lt);
    return cam(x + 260, railY(x) - 170, 1.12, railA(x + 150) * 0.6);
  },
  bg(c, s) {
    screen(c, () => {
      sky(c, '#b77dff', '#e7d4ff');
      halftone(c, 'rgba(255,255,255,0.25)', 30, 8);
    });
    const cx = rideX(s.lt);
    // far rail with its own little riders, half speed
    const far = (x) => 240 + 150 * Math.sin(x / 480 + 2) + railY(cx) * 0.5;
    c.save();
    c.translate(cx * 0.5, 0);
    track(c, cx * 0.5 - 1800, cx * 0.5 + 1900, far, '#4cc3ff');
    for (let i = 0; i < 4; i++) {
      const bx = cx * 0.5 - 1300 + i * 760 + s.lt * 500;
      rider(c, bx, far, 0.7, s.tc, () => {
        c.translate(0, -100);
        c.rotate(Math.sin(s.tc * 18 + i) * 0.1);
        P.cabbageBuddy(c, 80, s.tc, i * 1.7);
      });
    }
    c.restore();
  },
  cel(c, s) {
    const x = rideX(s.lt);
    track(c, x - 1900, x + 2300, railY, '#ff5d8f');
    // a côve buddy up ahead that she overtakes
    rider(c, x + 900 - s.lt * 620, railY, 1, s.tc, () => {
      c.translate(0, -108);
      c.rotate(Math.sin(s.tc * 18) * 0.1);
      P.cabbageBuddy(c, 84, s.tc, 4);
    });
    const hop = railA(x) < -0.25 ? 0.1 : 0;
    rider(c, x, railY, 1.2, s.tc, () => {
      c.rotate(Math.sin(s.ltc * 20) * 0.06);
      brie(c, { x: 0, y: 0, s: 1.05, shadow: false, phase: null, ear: 1, mouth: 1, eyes: 'wide', wag: wag(s.tc), sq: -hop, lean: -0.1, costume: 'cabbage', ct: s.tc });
    });
  },
  fx(c, s) {
    const x = rideX(s.lt), a = railA(x);
    for (let i = 0; i < 12; i++) {
      const u = frac(s.tc * 7 + i * 0.3);
      c.fillStyle = i % 2 ? '#ffd84d' : '#ffffff';
      c.beginPath();
      c.arc(x - 60 - u * 320 * Math.cos(a) + noise(i + s.tc * 5) * 30, railY(x) - u * 320 * Math.sin(a) - 16 - Math.sin(u * Math.PI) * 70, 11 * (1 - u), 0, TAU);
      c.fill();
    }
    screen(c, () => speedLines(c, s.tc, 0.8, -1, 'rgba(255,255,255,0.8)'));
  },
  top(c, s) {
    if (s.lt < 0.2) jaws(c, 1 - easeOut(s.lt / 0.2));
  },
};

export default { from: 56.05, to: 63.34, shots: [lionRoar, lionMouth, launch, flight, crocStomp, crocLunge, ride] };
