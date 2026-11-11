// Verse 1 (0:37 to 0:56): tornado, skid, cute, missile, peek, worm.
import { sky, sunburst, focusLines, sparkles, speedLines, hearts, smokeTrail, flash, shadow } from '../../fx.js';
import { blob, fillStroke, DETAIL } from '../../util.js';
import { glint, motif } from '../paint.js';
import { bigLabel } from '../../text.js';
import * as P from '../../props.js';
import { brie, zip, skid } from '../actor.js';
import { cam, crash, shake } from '../camera.js';
import { W, H, FY, INK, TAU, clamp, lerp, easeOut, easeIn, easeInOut, easeOutBack, rand, key, run, wag, blink, room, puff, ring, pow, frac } from '../kit.js';

/* ---------------- tornado ---------------- */
const tcx = (lt) => W / 2 + Math.sin(lt * 1.5) * 320;
function funnel(c, s, front) {
  const cx = tcx(s.lt);
  if (!DETAIL.on) {
    for (let i = 0; i < 64; i++) {
      const h = i / 64;
      const a = s.tc * 9 + i * 0.7;
      if (Math.sin(a) > 0 !== front) continue;
      const r = lerp(70, 400, h);
      blob(c, [[cx + Math.cos(a) * r + Math.sin(h * 5 + s.tc * 3) * 30, FY + 130 - h * 800, 30 + h * 34]], front ? '#ffffff' : '#ece4f7', 4);
    }
    return;
  }
  const axis = (h) => cx + Math.sin(h * 5 + s.tc * 3) * 30;
  const yOf = (h) => FY + 130 - h * 800;
  const rOf = (h) => lerp(165, 410, Math.pow(h, 1.3));
  const OPEN = 0.66; // below this the near side stays clear, so Brie is in plain view
  const RY = 0.22; // how flat each turn of the spiral looks
  const cloud = (bx, by, br, fill, lw = 4) => {
    blob(c, [[bx, by, br * 1.1, br * 0.82, 0], [bx - br * 0.8, by + br * 0.22, br * 0.56], [bx + br * 0.82, by + br * 0.24, br * 0.52], [bx - br * 0.38, by - br * 0.42, br * 0.55], [bx + br * 0.36, by - br * 0.36, br * 0.5]], fill, lw);
    c.strokeStyle = 'rgba(160,140,210,0.55)';
    c.lineWidth = Math.max(2.5, br * 0.11);
    c.beginPath();
    c.arc(bx - br * 0.3, by - br * 0.22, br * 0.3, 1.05 * Math.PI, 1.85 * Math.PI);
    c.stroke();
    c.beginPath();
    c.arc(bx + br * 0.25, by + br * 0.05, br * 0.5, 0.08 * Math.PI, 0.42 * Math.PI);
    c.stroke();
  };
  c.save();
  c.lineCap = 'round';
  if (!front) {
    // the funnel itself: a soft cone of spinning air
    c.beginPath();
    for (let i = 0; i <= 20; i++) c.lineTo(axis(i / 20) - rOf(i / 20), yOf(i / 20));
    for (let i = 20; i >= 0; i--) c.lineTo(axis(i / 20) + rOf(i / 20), yOf(i / 20));
    c.closePath();
    const g = c.createLinearGradient(cx - 400, 0, cx + 400, 0);
    g.addColorStop(0, 'rgba(214,200,242,0.8)');
    g.addColorStop(0.42, 'rgba(226,214,246,0.72)');
    g.addColorStop(1, 'rgba(196,180,232,0.8)');
    c.fillStyle = g;
    c.fill();
    // the far side of each turn
    for (let k = 0; k < 10; k++) {
      const h = (k + ((s.tc * 1.4) % 1)) / 10;
      c.strokeStyle = 'rgba(160,142,206,0.7)';
      c.lineWidth = 7 + h * 9;
      c.beginPath();
      c.ellipse(axis(h), yOf(h), rOf(h) * 0.97, rOf(h) * RY, 0, Math.PI * 1.06, Math.PI * 1.94);
      c.stroke();
    }
  } else {
    // thin wind lines wrapping the near side
    for (let k = 0; k < 10; k++) {
      const h = (k + 0.5 + ((s.tc * 1.4) % 1)) / 10.5;
      if (h < OPEN) continue;
      const a0 = (s.tc * 7 + k * 2.1) % Math.PI;
      c.strokeStyle = 'rgba(255,255,255,0.85)';
      c.lineWidth = 5 + h * 6;
      for (const [b0, b1] of [[a0 - 1.1, a0 - 0.2], [a0 + 0.3, a0 + 1.5]]) {
        const lo = Math.max(0.1, b0), hi = Math.min(Math.PI - 0.1, b1);
        if (hi - lo < 0.15) continue;
        c.beginPath();
        c.ellipse(axis(h), yOf(h), rOf(h) * 1.0, rOf(h) * RY, 0, lo, hi);
        c.stroke();
      }
    }
  }
  // cotton clouds riding the wind, each trailing a streak along its turn
  for (let i = 0; i < 56; i++) {
    const h = 0.04 + 0.96 * (i / 56);
    const a = s.tc * 9 + i * 0.7;
    if (Math.sin(a) > 0 !== front) continue;
    // keep the middle open low down, where Brie is spinning
    if (front && h < OPEN && Math.abs(Math.cos(a)) < 0.9) continue;
    const r = rOf(h) * (0.96 + 0.12 * rand(i + 9));
    const br = (17 + h * 27) * (0.75 + 0.55 * rand(i + 4));
    const ay = yOf(h), ax = axis(h);
    c.strokeStyle = front ? 'rgba(255,255,255,0.9)' : 'rgba(214,202,240,0.9)';
    c.lineWidth = br * 0.5;
    if (!front || h >= OPEN) {
      c.beginPath();
      c.ellipse(ax, ay, r, r * RY, 0, a - 0.62, a - 0.1);
      c.stroke();
    }
    cloud(ax + Math.cos(a) * r, ay + Math.sin(a) * r * RY, br, front ? '#ffffff' : '#dcd0f1');
  }
  // the crown: a ring of bigger cotton where the funnel opens out
  for (let i = 0; i < 12; i++) {
    const a = s.tc * 5 + i * (TAU / 12);
    if (Math.sin(a) > 0 !== front) continue;
    cloud(axis(1) + Math.cos(a) * 420, yOf(1) - 8 + Math.sin(a) * 420 * RY, 50 + 16 * rand(i + 20), front ? '#ffffff' : '#e9e0f6', 5);
  }
  // loose tufts, clovers and sparkles flung around it
  for (let i = 0; i < 16; i++) {
    const a = s.tc * (6 + (i % 3)) + i * 2.3;
    if (Math.sin(a) > 0 !== front) continue;
    const h = (i * 0.137 + s.tc * 0.35) % 1;
    if (front && h < OPEN && Math.abs(Math.cos(a)) < 0.8) continue;
    const x = axis(h) + Math.cos(a) * rOf(h) * 1.3, y = yOf(h) + Math.sin(a) * rOf(h) * 0.28;
    if (i % 4 === 0) motif(c, 'clover', x, y, 26, front ? '#37c45c' : '#6fcf86');
    else if (i % 4 === 1) glint(c, x, y, 22, front ? 1 : 0.6, '#fff6a8');
    else blob(c, [[x, y, 13], [x + 12, y + 5, 9], [x - 11, y + 6, 8]], front ? '#ffffff' : '#e9e0f6', 3);
  }
  if (front) {
    // dust kicked up where it touches the floor
    for (let i = 0; i < 5; i++) puff(c, cx + (i - 2) * 85, FY + 150, ((s.tc * 1.6 + i * 0.23) % 1) * 0.6, 0.75, i * 5 + Math.floor(s.tc * 1.6 + i * 0.23), '#f1e9fb');
  }
  c.restore();
}
const LEAN = [['window', 100, 180], ['sofa', 620, 240], ['lamp', 1320, 60], ['frame', 1560, 110], ['plant', 1780, 80]];
const tornadoWide = {
  t: 37.3, tr: 'flash', hand: 0.8,
  cam: (s) => cam(W / 2 + (tcx(s.lt) - W / 2) * 0.3, 560, 1.07, Math.sin(s.lt * 1.3) * 0.045),
  bg: (c, s) => room(c, 'living', 0, s.t, false),
  cel(c, s) {
    const cx = tcx(s.lt);
    // the furniture is sucked toward the funnel
    for (const [type, x, half] of LEAN) {
      const pull = clamp((cx - (x + half)) / 800, -1, 1);
      c.save();
      c.translate(x + half, FY);
      c.rotate(pull * (0.16 + 0.05 * Math.sin(s.tc * 11 + x)));
      c.translate(-(x + half), -FY - (type === 'lamp' || type === 'plant' ? Math.abs(pull) * 26 : 0));
      P.furniture(c, type, x, FY, s.tc);
      c.restore();
    }
    funnel(c, s, false);
    const hop = Math.abs(Math.sin(s.tc * 8)) * 70;
    brie(c, { view: 'front', x: cx, y: FY + 60 - hop, ground: FY + 60, s: 1.15, dir: s.d % 2 ? -1 : 1, rot: Math.sin(s.tc * 10) * 0.3, expr: s.d % 4 < 2 ? 'happy' : 'shout', wag: wag(s.tc), earFlop: 1.2 });
    // toys caught in the wind
    ['toast', 'milk', 'sunny', 'onigiri'].forEach((k, i) => {
      const a = s.tc * 5 + i * 1.6;
      if (Math.sin(a) < 0) return;
      c.save();
      c.translate(cx + Math.cos(a) * (300 + i * 40), 170 + i * 85 + Math.sin(a * 2) * 30);
      c.rotate(a * 1.7);
      P.plushToy(c, k, 62);
      c.restore();
    });
  },
  fx(c, s) {
    funnel(c, s, true);
    speedLines(c, s.tc, 0.5, 1);
  },
};

const tornadoIn = {
  t: 39.1, hand: 1, punch: 2,
  cam: (s) => cam(W / 2, H / 2, crash(s.lt, 1, 1.18, 0, 2), Math.sin(s.lt * 3.2) * 0.1),
  bg(c, s) {
    c.fillStyle = '#ffd1e3';
    c.fillRect(-400, -400, W + 800, H + 800);
    sunburst(c, s.t, W / 2, H / 2, '#ffffff', '#ffc2da', 14, 2.6);
  },
  cel(c, s) {
    const turn = s.d % 4;
    const o = { x: W / 2 + Math.sin(s.tc * 7) * 40, y: 1020 + Math.cos(s.tc * 9) * 30, s: 2.3, wag: wag(s.tc), shadow: false };
    if (turn === 0) brie(c, { ...o, view: 'front', expr: 'shout', earFlop: 1.4, tilt: 0.2 });
    else if (turn === 1) brie(c, { ...o, y: o.y - 40, s: 2.0, dir: -1, phase: 0.3, ear: 1, mouth: 1, eyes: 'happy', stretch: 1.25 });
    else if (turn === 2) brie(c, { ...o, view: 'front', expr: 'happy', earFlop: 1.4, tilt: -0.2, dir: -1 });
    else brie(c, { ...o, y: o.y - 40, s: 2.0, dir: 1, phase: 0.7, ear: 1, mouth: 1, eyes: 'happy', stretch: 1.25 });
  },
  fx(c, s) {
    for (let i = 0; i < 16; i++) {
      const a = s.tc * 8 + i * 0.9;
      if (Math.abs(Math.cos(a)) < 0.55) continue;
      blob(c, [[W / 2 + Math.cos(a) * (760 + (i % 3) * 110), 160 + i * 56, 70 + (i % 4) * 22]], '#ffffff', 5);
    }
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.lineWidth = 16;
    c.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.ellipse(W / 2, 250 + i * 150, 620 + i * 30, 70, 0, s.tc * 9 + i, s.tc * 9 + i + 1.3);
      c.stroke();
    }
  },
};

/* ---------------- four paws, zero brakes ---------------- */
const TR0 = 40.86;
const trackRun = {
  t: TR0, tr: 'whipR', hand: 1, punch: 1.5,
  cam: (s) => cam(W / 2 + 60, 700, 1.28, -0.03),
  bg: (c, s) => room(c, 'living', 1500 + s.lt * 1500, s.t),
  cel(c, s) {
    brie(c, { x: 900 + Math.sin(s.lt * 2.4) * 50, y: 960, s: 1.3, phase: run(s.tc, 2), ear: 1, mouth: 0.6, eyes: blink(s.tc, 2) ? 'closed' : 'happy', wag: wag(s.tc), lean: 0.2 });
  },
  fx(c, s) {
    speedLines(c, s.tc, 0.9, -1, 'rgba(255,255,255,0.8)', 520, 1010);
    for (let i = 1; i < 4; i++) puff(c, 900 - i * 190, 968, i * 0.11 + frac(s.tc * 4) * 0.1, 0.6, i + s.d, '#f6e2c8');
    // chair legs whip past the lens
    for (let i = 0; i < 2; i++) {
      const x = W + 700 - frac(s.lt * 0.95 + i * 0.5) * (W + 1500);
      c.fillStyle = '#8a5a2b';
      c.strokeStyle = INK;
      c.lineWidth = 10;
      for (const dx of [0, 300]) {
        c.beginPath();
        c.roundRect(x + dx, 420, 70, 760, 20);
        c.fill();
        c.stroke();
      }
      c.beginPath();
      c.roundRect(x - 40, 380, 450, 80, 24);
      c.fill();
      c.stroke();
    }
  },
};

const SK = { t0: 0, dur: 0.85, x0: 0, x1: 1500, dir: 1 };
const lead = (lt) => key(lt, [[0.3, 0], [0.7, 330, 'out'], [0.92, -30, 'io'], [1.05, 0, 'io']]); // camera overshoots, snaps back
const skidShot = {
  t: 42.2, hand: 0.5,
  cam: (s) => cam(W / 2, 640, 1.16, key(s.lt, [[0, -0.05], [0.85, 0.03, 'out'], [1.1, 0]])),
  bg: (c, s) => room(c, 'living', 3600 + skid(s.lt, SK).x - 700 + lead(s.lt), s.t),
  cel(c, s) {
    const k = skid(s.ltc, SK);
    const sx = (wx) => wx - (skid(s.lt, SK).x - 700 + lead(s.lt));
    // skid marks
    c.strokeStyle = 'rgba(58,39,71,0.45)';
    c.lineWidth = 7;
    for (const dy of [0, 18]) {
      c.beginPath();
      c.moveTo(sx(300), 968 + dy);
      c.lineTo(sx(skid(s.lt, SK).x) - 30, 968 + dy);
      c.stroke();
    }
    brie(c, { ...k, x: sx(skid(s.lt, SK).x), y: 960, s: 1.3, wag: 0, sq: k.skidding ? 0.08 : 0 });
  },
  fx(c, s) {
    const sx = (wx) => wx - (skid(s.lt, SK).x - 700 + lead(s.lt));
    for (let i = 0; i < 6; i++) puff(c, sx(lerp(200, 1500, easeOut((s.ltc - i * 0.11) / 0.85))) + 110, 965, s.ltc - i * 0.11, 0.8, i, '#f6e2c8');
    if (s.ltc > 0.15) bigLabel(c, 'SKRRR!', 1300, 380, 150, '#ff5d8f', (s.ltc - 0.15) * 3, -0.1);
  },
};

const glassShot = {
  t: 43.45, tr: 'impact',
  cam: (s) => {
    const sh = shake(s.lt, 40, s.d);
    return cam(W / 2 + sh[0], H / 2 + sh[1], 1);
  },
  bg: (c, s) => room(c, 'living', 5000, s.t),
  cel(c, s) {
    // face squashed flat against the lens, sliding down
    const slip = Math.floor(clamp((s.ltc - 0.3) / 0.55) * 4) / 4;
    const y = 500 + slip * 230;
    const sq = 0.3 * (1 - 0.3 * slip) + 0.14 * Math.exp(-s.ltc * 9) * Math.cos(s.ltc * 26);
    for (const sx of [-1, 1]) {
      c.save();
      c.translate(W / 2 + sx * 620, y - 40 + sx * 30);
      c.scale(0.8, 0.8);
      c.rotate(sx * 0.35);
      blob(c, [[0, 0, 130, 150, 0], [-70, -130, 50], [0, -160, 54], [70, -130, 50]], '#fdfbff', 12);
      c.fillStyle = '#ffb3cf';
      for (const [px, py, r] of [[0, 20, 62], [-66, -110, 26], [0, -138, 28], [66, -110, 26]]) {
        c.beginPath();
        c.ellipse(px, py, r, r * 0.9, 0, 0, TAU);
        c.fill();
      }
      c.restore();
    }
    brie(c, { view: 'head', x: W / 2, y, s: 3.6, sq, expr: 'innocent', fEyes: 'wide', fLook: 0, earFlop: 0.2, tilt: 0.06, lw: 5 });
  },
  fx(c, s) {
    ring(c, W / 2, 520, s.ltc, 1500, '#ffffff', 0.35);
    if (s.ltc > 0.3) {
      c.strokeStyle = '#ffffff';
      c.lineWidth = 12;
      c.lineCap = 'round';
      for (const x of [420, 560, 1360, 1500]) {
        c.beginPath();
        c.moveTo(x, 150 + (s.d % 2) * 14);
        c.lineTo(x, 300 + (s.d % 2) * 14);
        c.stroke();
      }
      bigLabel(c, 'NHIIIC…', 1540, 250, 100, '#4cc3ff', (s.ltc - 0.3) * 3, -0.06);
    }
  },
};

/* ---------------- cute ---------------- */
const cuteBg = (c, s) => {
  sky(c, '#ffd1e3', '#fff0f6');
  sunburst(c, s.t, W / 2, H * 0.55, 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0)', 16, 0.1);
};
const cuteShot = {
  t: 44.34, hand: 0.15, punch: 0.4,
  cam: (s) => cam(W / 2, lerp(540, 480, easeInOut(s.k)), lerp(1.0, 1.25, easeInOut(s.k))),
  bg: cuteBg,
  cel(c, s) {
    const shut = blink(s.tc, 4) || (s.ltc > 1.2 && s.ltc < 1.34);
    brie(c, { view: 'front', x: W / 2, y: 930, s: 2.2, expr: 'innocent', fEyes: shut ? 'closed' : undefined, wag: wag(s.tc) * 0.5, tilt: key(s.ltc, [[0.9, 0], [1.3, 0.16, 'back']]), earFlop: 0.2 });
  },
  fx(c, s) {
    hearts(c, s.tc, 18, 3);
    sparkles(c, s.tc, W / 2, 500, 460, 12, 8, '#ffffff');
  },
};
const cuteClose = {
  t: 46.3, hand: 0.15, punch: 0.4,
  cam: (s) => cam(W / 2, H / 2, lerp(1.0, 1.08, s.k)),
  bg: cuteBg,
  cel(c, s) {
    const smirk = s.ltc > 0.62;
    brie(c, { view: 'head', x: W / 2, y: 580, s: 3.5, expr: smirk ? 'happy' : 'innocent', fEyes: s.ltc > 0.42 && s.ltc < 0.56 ? 'closed' : smirk ? 'happy' : 'wide', tilt: smirk ? 0.12 * easeOutBack((s.ltc - 0.62) / 0.2) : 0, sq: smirk ? 0.07 * Math.exp(-(s.ltc - 0.62) * 8) : 0, earFlop: 0.3, lw: 5 });
  },
  fx(c, s) {
    sparkles(c, s.tc, W / 2, 520, 820, 22, 9, '#ffffff');
    if (s.ltc > 0.62) for (let i = 0; i < 2; i++) {
      // glint
      c.save();
      c.translate(i ? 1191 : 729, 398);
      c.scale(0.7, 0.7);
      c.rotate(s.tc * 2);
      c.fillStyle = '#ffffff';
      c.beginPath();
      for (let j = 0; j < 8; j++) c.lineTo(Math.cos((j / 8) * TAU) * (j % 2 ? 14 : 70), Math.sin((j / 8) * TAU) * (j % 2 ? 14 : 70));
      c.fill();
      c.restore();
    }
  },
};

/* ---------------- missile: three passes ---------------- */
const missile = (t, dir, y, arc, camX) => ({
  t, tr: dir > 0 ? 'whipR' : 'whipL', hand: 0.8, punch: 2,
  cam: (s) => cam(W / 2 + dir * lerp(-80, 80, s.k), H / 2 - 20, 1.06, dir * -0.03),
  bg: (c, s) => room(c, 'living', camX + dir * s.lt * 500, s.t),
  cel(c, s) {
    const u = clamp(s.lt / (s.dur - 0.1));
    const x = dir > 0 ? lerp(-420, W + 520, u) : lerp(W + 420, -520, u);
    const yy = y - Math.sin(u * Math.PI) * arc;
    smokeTrail(c, u, (f) => [(dir > 0 ? lerp(-420, W + 520, f) : lerp(W + 420, -520, f)) - dir * 150, y - 110 - Math.sin(f * Math.PI) * arc + Math.sin(f * 14) * 14], 0.5, 0.03, '#ffffff');
    brie(c, { x, y: yy, ground: 965, dir, s: 1.2, phase: 0.7, amp: 0.3, bob: 0, pitch: -Math.cos(u * Math.PI) * arc / 900, ear: 1, mouth: 0.25, eyes: 'happy', stretch: 1.45, wag: wag(s.tc), trail: { dx: dir * 110, dy: 0, n: 3 } });
  },
  fx(c, s) {
    speedLines(c, s.tc, 1, dir);
    if (s.lt > 0.3) bigLabel(c, dir > 0 ? 'ZUUUM!' : 'VUUUSH!', W / 2 - dir * 380, 200, 130, dir > 0 ? '#4cc3ff' : '#ff8c42', (s.lt - 0.3) * 4, 0.06 * dir);
  },
});

const headOn = {
  t: 50.1, tr: 'whipR', hand: 1.2, punch: 2,
  cam: (s) => cam(W / 2, H / 2, 1 + 0.06 * s.k, Math.sin(s.lt * 8) * 0.015),
  bg(c, s) {
    room(c, 'hall', 1300, s.t);
    focusLines(c, s.tc, W / 2, 600, 1, 'rgba(255,255,255,0.8)', 260 + s.k * 520);
  },
  cel(c, s) {
    const g = key(s.lt, [[0, 0], [1.0, 0.36], [1.86, 1, 'in']]);
    const sc = lerp(0.5, 10, g * g);
    // nose-first, ears streaming: a little white missile
    brie(c, { view: 'head', x: W / 2 + Math.sin(s.ltc * 14) * 22 * (1 - g), y: lerp(640, 560, g) + Math.sin(s.ltc * 21) * 10, s: sc, expr: 'innocent', fEyes: s.lt > 1.3 ? 'wide' : 'happy', earFlop: 1.0, tilt: Math.sin(s.ltc * 14) * 0.06, lw: 6 / Math.max(1, sc * 0.4) });
  },
  fx(c, s) {
    if (s.lt < 1.4) {
      c.strokeStyle = 'rgba(255,255,255,0.9)';
      c.lineWidth = 10;
      for (let i = 0; i < 3; i++) {
        const a = frac(s.lt * 2 + i / 3);
        c.globalAlpha = 1 - a;
        c.beginPath();
        c.ellipse(W / 2, 630, 120 + a * 900, 80 + a * 560, 0, 0, TAU);
        c.stroke();
      }
      c.globalAlpha = 1;
    }
  },
  top(c, s) {
    if (s.left < 0.14) flash(c, 1 - s.left / 0.14);
  },
};

/* ---------------- under the table, behind the sofa ---------------- */
const underTable = {
  t: 52.02, wash: 0.35, hand: 0.2, punch: 0.3,
  cam: (s) => cam(W / 2, H / 2, lerp(1.0, 1.1, s.k)),
  bg(c) {
    c.fillStyle = '#3d2a5c';
    c.fillRect(-200, -200, W + 400, H + 400);
    c.fillStyle = '#f6d9a8';
    c.fillRect(-200, 880, W + 400, 400);
    c.fillStyle = INK;
    c.fillRect(-200, 872, W + 400, 12);
    // table top and legs, tablecloth scallops
    c.fillStyle = '#8a5a2b';
    c.strokeStyle = INK;
    c.lineWidth = 14;
    for (const x of [150, 1650]) {
      c.beginPath();
      c.rect(x, 60, 120, 900);
      c.fill();
      c.stroke();
    }
    c.fillStyle = '#ff9ec4';
    c.beginPath();
    c.moveTo(-200, -200);
    c.lineTo(W + 200, -200);
    c.lineTo(W + 200, 200);
    for (let x = W + 200; x > -200; x -= 240) c.quadraticCurveTo(x - 120, 330, x - 240, 200);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = 'rgba(30,16,60,0.7)';
    c.fillRect(-200, -200, W + 400, 1080);
  },
  cel(c, s) {
    const open = key(s.ltc, [[0.08, 0], [0.2, 1, 'out'], [0.5, 1], [0.56, 0], [0.66, 1]]);
    const look = key(s.ltc, [[0.2, 0], [0.36, -1], [0.56, -1], [0.7, 1]]);
    if (open <= 0) return;
    for (const sx of [-1, 1]) {
      c.beginPath();
      c.ellipse(W / 2 + sx * 120, 640, 62, 74 * open, 0, 0, TAU);
      fillStroke(c, '#fffbe6', INK, 8);
      c.beginPath();
      c.ellipse(W / 2 + sx * 120 + look * 22, 650, 30, 38 * open, 0, 0, TAU);
      c.fillStyle = INK;
      c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(W / 2 + sx * 120 + look * 22 - 10, 636, 9 * open, 0, TAU);
      c.fill();
    }
  },
  fx(c, s) {
    if (s.ltc > 0.25) bigLabel(c, '?', 1300, 420, 170, '#ffd84d', (s.ltc - 0.25) * 4, 0.2);
  },
};

const sofaPop = {
  t: 52.9, hand: 0.3,
  cam: (s) => cam(W / 2, 560, crash(s.lt, 1, 1.14, 0.12, 2)),
  bg(c, s) {
    room(c, 'living', 300, s.t, false);
    P.furniture(c, 'window', 120, FY, s.t);
    P.furniture(c, 'lamp', 1560, FY, s.t);
  },
  cel(c, s) {
    const up = key(s.ltc, [[0.08, 0], [0.26, 1.25, 'out'], [0.4, 0.95, 'io'], [0.52, 1, 'io'], [0.74, 1], [0.86, 0, 'in']]);
    const hy = FY - 240 - up * 210;
    const pose = { x: 960, s: 1.45, sq: -0.2 * clamp(up - 0.9, 0, 1) * 3, expr: 'innocent', fEyes: 'wide', fLook: s.ltc < 0.56 ? -1 : 1, earFlop: 0.3 + (up > 1 ? 1 : 0), tilt: Math.sin(s.ltc * 12) * 0.05 };
    if (up > 0.05 && !DETAIL.on) {
      // long stretchy neck
      blob(c, [[960, (hy + FY - 200) / 2 + 40, 86 - up * 24, (FY - 200 - hy) / 2 + 60, 0]], '#fdfbff', 8);
      brie(c, { view: 'head', y: hy, ...pose });
    }
    // she stands up on her hind legs behind the sofa: chest, collar and all
    if (up > 0.05 && DETAIL.on) {
      c.save();
      c.beginPath();
      c.rect(0, -600, W, FY - 100 + 600);
      c.clip();
      brie(c, { view: 'front', y: hy + 194 * 1.45, shadow: false, wag: wag(s.tc), blink: false, breath: false, puffs: false, ...pose });
      c.restore();
    }
    P.furniture(c, 'sofa', 660, FY + 60, s.tc);
    if (DETAIL.on) {
      // front paws hooked over the back of the sofa
      const grip = clamp((up - 0.25) / 0.3);
      if (grip > 0) for (const sx of [-1, 1]) {
        const px = 960 + sx * 118, py = FY - 262 + (1 - grip) * 46 - clamp(up - 1, 0, 1) * 30;
        blob(c, [[px, py, 46, 36, 0], [px - 30, py + 10, 20], [px, py + 16, 21], [px + 30, py + 10, 20], [px - sx * 6, py - 22, 30]], '#fdfbff', 6);
        c.strokeStyle = '#cbbfe2';
        c.lineWidth = 4.5;
        c.lineCap = 'round';
        for (const tx of [-15, 15]) {
          c.beginPath();
          c.moveTo(px + tx, py + 10);
          c.lineTo(px + tx, py + 30);
          c.stroke();
        }
      }
    }
  },
  fx(c, s) {
    if (s.ltc > 0.2 && s.ltc < 0.8) bigLabel(c, '!', 1330, 300, 190, '#ff5d8f', (s.ltc - 0.2) * 4, -0.2);
    c.strokeStyle = '#ffffff';
    c.lineWidth = 10;
    c.lineCap = 'round';
    const far = DETAIL.on ? 250 : 170, lo = DETAIL.on ? 500 : 560, hi = DETAIL.on ? 360 : 420;
    if (s.ltc > 0.1 && s.ltc < 0.4) for (const dx of [-far, far]) {
      c.beginPath();
      c.moveTo(960 + dx, lo);
      c.lineTo(960 + dx, hi);
      c.stroke();
    }
  },
};

/* ---------------- worm ---------------- */
const wormWiggle = {
  t: 53.78, tr: 'whipD', hand: 0.6,
  cam: (s) => cam(W / 2, 720, lerp(1.35, 1.5, s.k), Math.sin(s.ltc * 11) * 0.03),
  bg: (c, s) => room(c, 'living', 4200, s.t),
  cel(c, s) {
    shadow(c, W / 2, FY + 60, 260, 0.2);
    c.save();
    c.translate(W / 2 + Math.sin(s.ltc * 22) * 26, FY + 40);
    c.rotate(Math.PI + Math.sin(s.ltc * 22) * 0.2);
    c.scale(-1, 1);
    c.translate(0, 205);
    brie(c, { x: 0, y: 0, s: 1.3, phase: frac(s.ltc * 4), amp: 1, eyes: 'happy', mouth: 0.8, ear: 0.4, wag: wag(s.tc), costume: 'worm', ct: s.tc, shadow: false, sq: 0.08 * Math.sin(s.ltc * 44) });
    c.restore();
  },
  fx(c, s) {
    bigLabel(c, 'WIGGLE WIGGLE', W / 2, 420, 84, '#b77dff', s.ltc * 3, Math.sin(s.ltc * 20) * 0.07);
    c.strokeStyle = '#ffffff';
    c.lineWidth = 9;
    c.lineCap = 'round';
    for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) {
      c.beginPath();
      c.arc(W / 2 + sx * (330 + i * 46), 760, 60, sx > 0 ? -0.7 : Math.PI - 0.7, sx > 0 ? 0.7 : Math.PI + 0.7);
      if (s.d % 2 === i) c.stroke();
    }
  },
};

const wormZip = {
  t: 54.95, hand: 0.5,
  cam: (s) => cam(W / 2 + s.k * 120, 620, 1.1),
  bg: (c, s) => room(c, 'living', 4200, s.t),
  cel(c, s) {
    // flips onto her feet, scrambles on the spot, gone
    const flip = key(s.ltc, [[0, 0], [0.25, 1, 'back']]);
    const z = zip(s.ltc, { t0: 0.72, x: 880, dir: 1, wind: 0.42 });
    brie(c, { y: 960 - Math.sin(clamp(s.ltc / 0.25) * Math.PI) * 150, ground: 960, s: 1.3, costume: 'worm', ct: s.tc, wag: wag(s.tc), eyes: 'happy', mouth: 0.6, ...z, spin: (1 - flip) * Math.PI });
  },
  fx(c, s) {
    puff(c, 850, 960, s.ltc - 0.25, 0.9, 1, '#f6e2c8');
    puff(c, 830, 955, s.ltc - 0.72, 1.6, 2, '#f6e2c8');
    if (s.ltc > 0.72) speedLines(c, s.tc, 1, 1);
  },
};

export default {
  from: 37.3, to: 56.05,
  shots: [tornadoWide, tornadoIn, trackRun, skidShot, glassShot, cuteShot, cuteClose,
    missile(47.6, 1, 900, 0, 3000), missile(48.85, -1, 940, 330, 760), headOn, underTable, sofaPop, wormWiggle, wormZip],
};
