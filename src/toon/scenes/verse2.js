// Interlude (1:32) and verse 2 (1:38): the hallway race, wings, the zoo break, space, the pause, turbo.
import { sky, speedLines, focusLines, sunburst, twinkleStars, sparkles } from '../../fx.js';
import { blob, fillStroke, DETAIL } from '../../util.js';
import { pool, vgrad, glint, planetShade, sheen, flame } from '../paint.js';
import { drawWings } from '../../brie.js';
import { bigLabel } from '../../text.js';
import * as P from '../../props.js';
import { brie, jump, zip, skid, take, tiptoe } from '../actor.js';
import { cam, crash, shake } from '../camera.js';
import { W, H, FY, INK, TAU, clamp, lerp, easeOut, easeIn, easeInOut, easeOutBack, key, run, wag, blink, room, puff, ring, pow, frac, rand } from '../kit.js';

const GY = 960; // where Brie's feet are on an indoor floor
const screen = (c, fn) => {
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  fn();
  c.restore();
};
const local = (c, x, y, rot, sc, fn) => {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(sc, sc);
  fn();
  c.restore();
};
function checker(c, x, y, cols, rows, sz) {
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
    c.fillStyle = (r + q) % 2 ? '#ffffff' : INK;
    c.fillRect(x + q * sz, y + r * sz, sz, sz);
  }
}
function lane(c, camX) {
  c.strokeStyle = '#ffffff';
  c.lineWidth = 10;
  c.setLineDash([70, 50]);
  c.lineDashOffset = camX;
  c.beginPath();
  c.moveTo(-300, FY + 250);
  c.lineTo(W + 300, FY + 250);
  c.stroke();
  c.setLineDash([]);
}
// the hallway seen straight down its length; `z` scrolls the floor towards the lens
function hallAhead(c, z) {
  const vx = W / 2, vy = 470;
  c.fillStyle = '#fff0c9';
  c.fillRect(-400, -400, W + 800, H + 800);
  if (DETAIL.on) {
    // the corridor darkens towards its far end; a panelled dado runs along both walls
    const g = c.createRadialGradient(vx, vy - 20, 180, vx, vy - 20, 1250);
    g.addColorStop(0, 'rgba(190,130,70,0.36)');
    g.addColorStop(1, 'rgba(190,130,70,0)');
    c.fillStyle = g;
    c.fillRect(-400, -400, W + 800, H + 800);
    for (const sx of [-1, 1]) {
      c.beginPath();
      c.moveTo(vx + sx * 210, vy + 40);
      c.lineTo(vx + sx * 1900, vy + 40 + 620);
      c.lineTo(vx + sx * 1900, H + 500);
      c.lineTo(vx + sx * 210, vy + 140);
      c.closePath();
      c.fillStyle = '#ffdc9a';
      c.fill();
      c.strokeStyle = '#e0a85c';
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(vx + sx * 210, vy + 40);
      c.lineTo(vx + sx * 1900, vy + 40 + 620);
      c.stroke();
      // wallpaper stripes running away from the lens
      c.strokeStyle = 'rgba(240,190,110,0.5)';
      c.lineWidth = 4;
      for (const k of [-0.75, -0.4, -0.05]) {
        c.beginPath();
        c.moveTo(vx + sx * 210, vy + 190 * k);
        c.lineTo(vx + sx * 1900, vy + 190 * k * 9);
        c.stroke();
      }
    }
  }
  // far wall with the door she came through
  c.beginPath();
  c.rect(vx - 210, vy - 190, 420, 330);
  fillStroke(c, '#ffe6a8', INK, 6);
  if (DETAIL.on) {
    vgrad(c, vx - 207, vy - 187, 414, 70, 'rgba(190,120,60,0.3)', 'rgba(190,120,60,0)');
    c.fillStyle = '#ffdc9a';
    c.fillRect(vx - 207, vy + 40, 414, 97);
    c.strokeStyle = '#e0a85c';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(vx - 207, vy + 40);
    c.lineTo(vx + 207, vy + 40);
    c.stroke();
    for (const fx of [-150, 150]) {
      c.beginPath();
      c.roundRect(vx + fx - 34, vy - 130, 68, 56, 6);
      fillStroke(c, '#ffd84d', INK, 4);
      c.fillStyle = fx < 0 ? '#bfe8ff' : '#c8f2c0';
      c.fillRect(vx + fx - 24, vy - 121, 48, 38);
    }
  }
  c.beginPath();
  c.roundRect(vx - 70, vy - 110, 140, 250, 12);
  fillStroke(c, '#ff9ec4', INK, 6);
  if (DETAIL.on) {
    c.strokeStyle = '#e87aa8';
    c.lineWidth = 4;
    c.strokeRect(vx - 50, vy - 90, 100, 96);
    c.strokeRect(vx - 50, vy + 22, 100, 100);
    c.beginPath();
    c.arc(vx + 48, vy + 14, 8, 0, TAU);
    fillStroke(c, '#ffd84d', INK, 3);
  }
  // floor
  c.beginPath();
  c.moveTo(vx - 210, vy + 140);
  c.lineTo(vx + 210, vy + 140);
  c.lineTo(W + 900, H + 400);
  c.lineTo(-900, H + 400);
  c.closePath();
  fillStroke(c, '#d39661', INK, 6);
  if (DETAIL.on) {
    c.save();
    c.clip();
    // boards running down the hall, and the far end of the floor in shade
    c.strokeStyle = 'rgba(160,100,55,0.55)';
    c.lineWidth = 3;
    for (let j = -4; j <= 4; j++) {
      if (!j) continue;
      c.beginPath();
      c.moveTo(vx + j * 50, vy + 140);
      c.lineTo(vx + j * 50 * 9.4, H + 400);
      c.stroke();
    }
    vgrad(c, -900, vy + 140, W + 1800, 260, 'rgba(110,60,30,0.4)', 'rgba(110,60,30,0)');
    // the red runner
    c.beginPath();
    c.moveTo(vx - 78, vy + 140);
    c.lineTo(vx + 78, vy + 140);
    c.lineTo(vx + 78 * 9.4, H + 400);
    c.lineTo(vx - 78 * 9.4, H + 400);
    c.closePath();
    c.fillStyle = '#e2574f';
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 5;
    c.stroke();
    c.strokeStyle = '#ffd84d';
    c.lineWidth = 5;
    for (const sx of [-1, 1]) {
      c.beginPath();
      c.moveTo(vx + sx * 62, vy + 140);
      c.lineTo(vx + sx * 62 * 9.4, H + 400);
      c.stroke();
    }
    c.fillStyle = '#ffd84d';
    for (let i = 0; i < 9; i++) {
      const u = Math.pow(frac(i / 9 + z + 0.055), 2.2);
      const y = lerp(vy + 140, H + 300, u), k = lerp(1, 2400 / 210, u);
      c.beginPath();
      c.moveTo(vx, y - 7 * k);
      c.lineTo(vx + 22 * k, y);
      c.lineTo(vx, y + 7 * k);
      c.lineTo(vx - 22 * k, y);
      c.closePath();
      c.fill();
    }
    c.restore();
  }
  c.strokeStyle = '#b07444';
  c.lineWidth = 5;
  for (let i = 0; i < 9; i++) {
    const u = Math.pow(frac(i / 9 + z), 2.2);
    const y = lerp(vy + 140, H + 300, u);
    const hw = lerp(210, 2400, u);
    c.beginPath();
    c.moveTo(vx - hw, y);
    c.lineTo(vx - (DETAIL.on ? hw * 0.375 : -hw), y);
    if (DETAIL.on) {
      c.moveTo(vx + hw * 0.375, y);
      c.lineTo(vx + hw, y);
    }
    c.stroke();
  }
  // walls and ceiling edges
  c.strokeStyle = INK;
  c.lineWidth = 6;
  for (const sx of [-1, 1]) {
    c.beginPath();
    c.moveTo(vx + sx * 210, vy - 190);
    c.lineTo(vx + sx * 1700, -400);
    c.stroke();
    // doors sliding past on the side walls
    for (let i = 0; i < 3; i++) {
      const u = Math.pow(frac(i / 3 + z * 0.5 + (sx > 0 ? 0.17 : 0)), 2);
      const x0 = vx + sx * lerp(230, 1500, u), x1 = vx + sx * lerp(260, 1900, u);
      const top = lerp(vy - 120, -40, u), bot = lerp(vy + 142, 1010, u);
      c.beginPath();
      c.moveTo(x0, top);
      c.lineTo(x1, top - (x1 - x0) * 0.16 * 1);
      c.lineTo(x1, bot + Math.abs(x1 - x0) * 0.42);
      c.lineTo(x0, bot);
      c.closePath();
      fillStroke(c, i % 2 ? '#8ed4ff' : '#ff9ec4', INK, 6);
      if (DETAIL.on) {
        // a lit edge, a shaded foot and a brass knob
        c.save();
        c.clip();
        vgrad(c, Math.min(x0, x1), bot - (bot - top) * 0.3, Math.abs(x1 - x0), (bot - top) * 0.75, 'rgba(60,40,120,0)', 'rgba(60,40,120,0.28)');
        c.fillStyle = 'rgba(255,255,255,0.3)';
        c.fillRect(Math.min(x0, x1), top - 400, Math.abs(x1 - x0) * 0.16, bot - top + 900);
        c.restore();
        c.beginPath();
        c.arc(lerp(x0, x1, 0.22), lerp(top, bot, 0.56), lerp(5, 20, u), 0, TAU);
        fillStroke(c, '#ffd84d', INK, 3.5);
      }
    }
  }
}
function trampoline(c, x, dip) {
  c.save();
  c.translate(x, GY);
  if (DETAIL.on) {
    // legs, and the shadow it throws on the floor
    pool(c, 0, 70, 300, 34, '50,25,80', 0.3);
    c.strokeStyle = INK;
    c.lineCap = 'round';
    for (const lx of [-200, -70, 70, 200]) {
      c.lineWidth = 16;
      c.beginPath();
      c.moveTo(lx, 30);
      c.lineTo(lx * 1.06, 76);
      c.stroke();
      c.strokeStyle = '#b9c3d9';
      c.lineWidth = 9;
      c.stroke();
      c.strokeStyle = INK;
    }
  }
  c.beginPath();
  c.ellipse(0, 6, 250, 58, 0, 0, TAU);
  fillStroke(c, '#2b6fd6', INK, 6);
  if (DETAIL.on) {
    // padded rim: seams and a shine
    c.strokeStyle = '#1f55ad';
    c.lineWidth = 4;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + 0.26;
      c.beginPath();
      c.moveTo(Math.cos(a) * 214, 6 + Math.sin(a) * 40);
      c.lineTo(Math.cos(a) * 248, 6 + Math.sin(a) * 57);
      c.stroke();
    }
    c.strokeStyle = 'rgba(255,255,255,0.5)';
    c.lineWidth = 5;
    c.beginPath();
    c.ellipse(0, 6, 240, 51, 0, Math.PI * 1.08, Math.PI * 1.45);
    c.stroke();
  }
  c.beginPath();
  c.moveTo(-210, 0);
  c.quadraticCurveTo(0, 2 * dip + 36, 210, 0);
  c.quadraticCurveTo(0, 2 * dip - 40, -210, 0);
  fillStroke(c, '#4cc3ff', INK, 5);
  c.strokeStyle = '#ffffff';
  c.lineWidth = 6;
  c.setLineDash([18, 14]);
  c.beginPath();
  c.ellipse(0, 6, 228, 46, 0, 0, TAU);
  c.stroke();
  c.setLineDash([]);
  c.restore();
}
function night(c, t, camX) {
  sky(c, '#141a4d', '#4a3f8f');
  c.fillStyle = '#141a4d';
  c.fillRect(-400, -400, W + 800, 400);
  twinkleStars(c, t, 90, 520, 3);
  P.moon(c, 1620, 190, 80);
  if (DETAIL.on) {
    // a glow on the horizon behind the far hills
    vgrad(c, -400, 360, W + 800, 320, 'rgba(150,130,255,0)', 'rgba(150,130,255,0.32)');
  }
  P.hills(c, camX, 640, 70, '#3f5f8f', 0.2, 1);
  if (DETAIL.on) vgrad(c, -400, 600, W + 800, 200, 'rgba(120,150,255,0)', 'rgba(120,150,255,0.25)');
  P.hills(c, camX, 780, 60, '#2f7a5a', 0.5, 3, true);
  c.fillStyle = '#2f7a5a';
  c.fillRect(-400, 900, W + 800, 600);
  if (DETAIL.on) {
    vgrad(c, -400, 880, W + 800, 320, 'rgba(15,40,70,0)', 'rgba(15,40,70,0.4)');
    // fireflies
    for (let i = 0; i < 16; i++) {
      const x = frac((rand(i * 3.1) * 2400 - camX * 0.6 + Math.sin(t * 0.5 + i) * 40) / 2400) * 2400 - 240;
      const y = 660 + rand(i * 5.3) * 300 + Math.sin(t * 0.9 + i * 2) * 22;
      const a = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.9);
      pool(c, x, y, 16, 16, '230,255,140', 0.5 * a);
      c.fillStyle = `rgba(240,255,170,${0.4 + 0.6 * a})`;
      c.beginPath();
      c.arc(x, y, 3.2, 0, TAU);
      c.fill();
    }
  }
}
function spot(c, x, y, rx, a = 0.5) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = `rgba(255,240,150,${a * 0.5})`;
  c.beginPath();
  c.moveTo(x - 40, -400);
  c.lineTo(x + 40, -400);
  c.lineTo(x + rx, y);
  c.lineTo(x - rx, y);
  c.closePath();
  c.fill();
  c.fillStyle = `rgba(255,240,150,${a})`;
  c.beginPath();
  c.ellipse(x, y, rx, rx * 0.22, 0, 0, TAU);
  c.fill();
  c.restore();
}
function trafficLight(c, x, y, lit) {
  c.fillStyle = INK;
  c.fillRect(x - 6, y - 400, 12, 400);
  c.beginPath();
  c.roundRect(x - 62, y, 124, 310, 30);
  fillStroke(c, '#3a2747', INK, 6);
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.arc(x, y + 60 + i * 96, 38, 0, TAU);
    fillStroke(c, lit === i ? ['#ff5d5d', '#ffd84d', '#5fd77a'][i] : '#5c4a6b', INK, 5);
    if (lit === i) {
      c.fillStyle = 'rgba(255,255,255,0.6)';
      c.beginPath();
      c.arc(x - 12, y + 48 + i * 96, 11, 0, TAU);
      c.fill();
    }
  }
}

/* ---------- interlude: down the hall to the start line ---------- */
const hallTrot = {
  t: 92.04, tr: 'whipR', hand: 0.8, punch: 1.6,
  cam: (s) => {
    const j = jump(s.lt, { t0: 1.0, dur: 0.62, from: [900, GY], to: [900, GY], h: 300 });
    return cam(W / 2 + 40, 700 - (GY - j.y) * 0.25, 1.15, -0.03);
  },
  bg: (c, s) => room(c, 'hall', 8000 + s.lt * 1500, s.t),
  cel(c, s) {
    const j = jump(s.lt, { t0: 1.0, dur: 0.62, from: [900, GY], to: [900, GY], h: 300 });
    // a plush toy left in the hall: hop over it
    c.save();
    c.translate(900 + (1.31 - s.lt) * 1500, GY - 60);
    P.plushToy(c, 'toast', 62);
    c.restore();
    const idle = !j.air && !j.anticip && !(j.landAge < 0.2);
    brie(c, { x: 900, y: j.y, ground: GY, s: 1.35, sq: j.sq, legs: j.legs, pitch: j.pitch, phase: idle ? run(s.tc, 2) : null, amp: 1, ear: j.ear ?? 1, mouth: 0.6, eyes: j.air ? 'wide' : 'happy', wag: wag(s.tc), lean: 0.12 });
  },
  fx(c, s) {
    speedLines(c, s.tc, 0.8, -1, 'rgba(255,255,255,0.8)', 300, 1000);
    for (let i = 1; i < 3; i++) puff(c, 900 - i * 190, GY + 6, i * 0.12 + frac(s.tc * 4) * 0.1, 0.6, i + s.d, '#f6e2c8');
    ring(c, 900, GY, s.lt - 1.62, 420, '#ffffff', 0.3);
  },
};
const hallFront = {
  t: 94.24, hand: 0.6, punch: 2,
  cam: (s) => cam(W / 2, 560, lerp(1.0, 1.1, s.k), Math.sin(s.lt * 7) * 0.02),
  bg: (c, s) => hallAhead(c, s.lt * 1.2),
  cel(c, s) {
    const hop = Math.abs(Math.sin((s.lt / 0.449) * Math.PI));
    const sc = lerp(0.7, 2.0, easeIn(s.k));
    const gy = lerp(700, 1080, easeIn(s.k));
    brie(c, { view: 'front', x: W / 2 + Math.sin(s.lt * 7) * 40 * sc, y: gy - hop * 70 * sc, ground: gy, s: sc, expr: 'happy', fEyes: blink(s.tc, 8) ? 'closed' : undefined, tilt: Math.sin(s.lt * 7) * 0.12, earFlop: 0.3 + hop, wag: wag(s.tc), sq: -0.1 * hop + 0.08 });
  },
  fx: (c, s) => screen(c, () => focusLines(c, s.tc, W / 2, 500, 0.5, 'rgba(255,255,255,0.6)', 520)),
};
const GO = 98.24;
const startLine = {
  t: 96.14, tr: 'whipR', hand: 0.3, punch: 1,
  cam: (s) => cam(lerp(W / 2, 820, easeInOut(clamp((s.lt - 0.5) / 1.2))), lerp(600, 720, easeInOut(clamp((s.lt - 0.5) / 1.2))), lerp(1.0, 1.4, easeInOut(clamp((s.lt - 0.5) / 1.2))), 0),
  bg(c, s) {
    room(c, 'hall', 11300, s.t);
    lane(c, 0);
    checker(c, 860, FY + 10, 2, 9, 44);
  },
  cel(c, s) {
    const k = skid(s.lt, { t0: 0.1, dur: 0.5, x0: -200, x1: 700, dir: 1 });
    const set = clamp((s.lt - 1.0) / 0.3); // ready... set...
    const wig = set * Math.sin(s.tc * 26);
    brie(c, { ...k, y: GY, s: 1.3, wag: wag(s.tc) * (1 + set), ...(set > 0 ? { sq: 0.22 * set, lean: -0.12 * set + wig * 0.03, legs: [0.4 * set, -0.4 * set], eyes: 'wide', look: 1, ear: 0.3, mouth: 0.2, rot: wig * 0.02 } : {}) });
    const n = s.t < GO - 1.35 ? -1 : s.t < GO - 0.9 ? 0 : s.t < GO - 0.45 ? 1 : 2;
    trafficLight(c, 1160, 250, n);
  },
  fx(c, s) {
    for (let i = 0; i < 3; i++) puff(c, 520 - i * 120, GY + 4, s.ltc - 0.2 - i * 0.05, 0.9, i, '#f6e2c8');
    [GO - 1.35, GO - 0.9, GO - 0.45].forEach((t0, i) => {
      const a = s.t - t0;
      if (a >= 0 && a < 0.45) bigLabel(c, ['3', '2', '1'][i], 520, 470, 200, ['#ff5d5d', '#ffd84d', '#5fd77a'][i], a * 5, -0.1);
    });
  },
};

/* ---------- corredor é pista, tapete é trampolim ---------- */
const race = {
  t: GO, tr: 'flash', hand: 1.2, punch: 2,
  cam: (s) => cam(W / 2 + 60, 720, 1.25, -0.05),
  bg(c, s) {
    const camX = 11300 + easeIn(clamp(s.lt / 0.3)) * 300 + Math.max(0, s.lt - 0.3) * 2600;
    room(c, 'hall', camX, s.t);
    lane(c, camX);
    checker(c, 860 - (camX - 11300), FY + 10, 2, 9, 44);
  },
  cel(c, s) {
    // toy racers get overtaken
    ['sunny', 'milk', 'birdie'].forEach((k, i) => {
      c.save();
      c.translate(1500 + i * 420 - s.lt * (620 + i * 90), GY - 60 - Math.abs(Math.sin(s.tc * 12 + i)) * 50);
      c.rotate(Math.sin(s.tc * 12 + i) * 0.2);
      P.plushToy(c, k, 54);
      c.restore();
    });
    const go = easeOut(clamp(s.lt / 0.3));
    brie(c, { x: lerp(560, 900, go) + Math.sin(s.lt * 3) * 50, y: GY, s: 1.4, phase: frac(s.lt * 6), amp: 1, ear: 1, mouth: 0.8, eyes: 'happy', wag: wag(s.tc), lean: 0.26, stretch: lerp(1.6, 1.12, go), trail: { dx: 90, dy: 0, n: 3 } });
  },
  fx(c, s) {
    speedLines(c, s.tc, 1, -1, 'rgba(255,255,255,0.85)', 420, 1010);
    for (let i = 1; i < 4; i++) puff(c, 860 - i * 210, GY + 8, i * 0.1 + frac(s.tc * 4) * 0.1, 0.8, i + s.d, '#f6e2c8');
    if (s.lt < 0.5) bigLabel(c, 'JÁ!', 1350, 420, 220, '#5fd77a', s.lt * 5, 0.1);
    // the flag whips past the lens
    const fx0 = 1500 - s.lt * 5200;
    if (fx0 > -700) {
      c.save();
      c.translate(fx0, 250);
      c.rotate(-0.2);
      c.fillStyle = INK;
      c.fillRect(-14, -60, 28, 1100);
      checker(c, 14, -40, 6, 4, 70);
      c.strokeStyle = INK;
      c.lineWidth = 8;
      c.strokeRect(14, -40, 420, 280);
      c.restore();
    }
  },
};
const T_JUMP = 100.92, TX = 1060;
const boing = {
  t: 100.3, hand: 0.4, punch: 2,
  cam: (s) => {
    const a = s.t - T_JUMP;
    return cam(lerp(820, 1020, easeInOut(clamp(s.lt / 0.6))), lerp(640, 440, easeOut(clamp(a / 0.5))), lerp(1.24, 1.08, easeOut(clamp(a / 0.5))), lerp(0, -0.07, easeOut(clamp(a / 0.5))));
  },
  bg(c, s) {
    room(c, 'hall', 15200, s.t);
    lane(c, 0);
    const a = s.t - T_JUMP;
    const dip = a > -0.16 && a < 0.1 ? Math.sin(((a + 0.16) / 0.26) * Math.PI) * 44 : a >= 0.1 ? -18 * Math.exp(-(a - 0.1) * 6) * Math.cos((a - 0.1) * 30) : 0;
    trampoline(c, TX, dip);
  },
  cel(c, s) {
    const a = s.t - T_JUMP;
    if (a < -0.16) {
      brie(c, { x: lerp(-200, TX, (s.lt) / (T_JUMP - 0.16 - 100.3)), y: GY, s: 1.3, phase: frac(s.lt * 6), amp: 1, ear: 1, mouth: 0.8, eyes: 'happy', wag: wag(s.tc), lean: 0.22, trail: { dx: 80, dy: 0, n: 2 } });
    } else if (a < 0) {
      const d = Math.sin(((a + 0.16) / 0.26) * Math.PI);
      brie(c, { x: TX, y: GY + d * 40, s: 1.3, sq: 0.42 * d, legs: [0.4, -0.4], ear: 0.2, mouth: 0.3, eyes: 'wide', wag: wag(s.tc) });
    } else {
      const u = clamp(a / 0.78);
      const y = GY - (u * u * 0.4 + u * 0.6) * 1500;
      if (u < 1) brie(c, { x: TX + u * 90, y, ground: GY, s: 1.3, sq: -0.42 * (1 - u * 0.5), spin: -u * TAU * 1.0, legs: [-0.9, 0.9], ear: 1, mouth: 1, eyes: 'happy', wag: wag(s.tc), trail: { dx: -12, dy: -150, n: 4 } });
    }
  },
  fx(c, s) {
    const a = s.t - T_JUMP;
    ring(c, TX, GY, a, 620, '#ffffff', 0.35);
    pow(c, TX, GY - 30, 190, a, '#4cc3ff', 10, 4, 0.22);
    if (a >= 0) bigLabel(c, 'BOING!', 1500, 520, 170, '#4cc3ff', a * 4, 0.1);
    if (a >= 0) screen(c, () => {
      c.strokeStyle = 'rgba(255,255,255,0.7)';
      c.lineWidth = 8;
      c.lineCap = 'round';
      for (let i = 0; i < 12; i++) {
        const x = 500 + rand(i + s.d) * 1100, y = frac(rand(i) + a * 2) * H;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x, y + 150);
        c.stroke();
      }
    });
  },
};

/* ---------- dobra a esquina e vem voando para cima de mim ---------- */
const LANDT = 0.2;
const corner = {
  t: 101.7, tr: 'whipD', hand: 0.8, punch: 2,
  cam: (s) => {
    const sh = shake(s.lt - LANDT, 22, s.d, 0.3);
    return cam(W / 2 + 80 + sh[0], 660 + sh[1], 1.15, 0.05);
  },
  bg(c, s) {
    room(c, 'hall', 15900, s.t);
    // the corner: the side wall of the next hall
    c.beginPath();
    c.moveTo(1500, -200);
    c.lineTo(2300, -200);
    c.lineTo(2300, H + 200);
    c.lineTo(1500, FY);
    c.closePath();
    fillStroke(c, '#ffe0a0', INK, 8);
    c.beginPath();
    c.moveTo(1500, FY);
    c.lineTo(2300, H + 200);
    c.lineTo(2300, H + 400);
    c.lineTo(1300, H + 400);
    c.closePath();
    fillStroke(c, '#c98a55', INK, 6);
  },
  cel(c, s) {
    const a = s.lt - LANDT;
    if (a < 0) {
      brie(c, { x: lerp(260, 420, s.lt / LANDT), y: lerp(-200, GY, easeIn(s.lt / LANDT)), ground: GY, s: 1.3, sq: -0.3, legs: [-0.6, 0.6], ear: 1, eyes: 'wide', mouth: 0.6, wag: wag(s.tc), trail: { dx: 30, dy: 180, n: 3 } });
      return;
    }
    // land, two strides, then the back end swings out round the corner
    const u = clamp(a / 0.95);
    const x = lerp(420, 1320, easeOut(u));
    const drift = clamp((a - 0.3) / 0.5);
    const out = clamp((s.left - 0.02) / 0.16);
    brie(c, {
      x: x + (1 - out) * 500, y: GY + drift * 40, s: 1.3 + drift * 0.25, sq: a < 0.25 ? 0.4 * Math.exp(-a * 9) * Math.cos(a * 21) : 0,
      phase: frac(s.lt * 6), amp: 1, ear: 1, mouth: 0.7, eyes: drift > 0 ? 'wide' : 'happy', wag: wag(s.tc),
      lean: 0.2 - drift * 0.6, rot: drift * 0.3, legs: drift > 0.1 && out >= 1 ? [-0.8, -0.5] : undefined,
      stretch: out < 1 ? 1.5 : 1, trail: { dx: 70, dy: 0, n: 2 },
    });
  },
  fx(c, s) {
    const a = s.lt - LANDT;
    ring(c, 420, GY, a, 480, '#ffffff', 0.3);
    const drift = clamp((a - 0.3) / 0.5);
    if (drift > 0) {
      for (let i = 0; i < 5; i++) puff(c, lerp(700, 1250, i / 4) - 80, GY + 30 + i * 6, s.ltc - LANDT - 0.3 - i * 0.07, 1.1, i, '#f6e2c8');
      bigLabel(c, 'DRIFT!', 640, 420, 150, '#ff9a3c', (a - 0.3) * 4, -0.1);
      // skid marks
      c.strokeStyle = 'rgba(58,39,71,0.45)';
      c.lineWidth = 12;
      c.lineCap = 'round';
      for (const o of [0, 46]) {
        c.beginPath();
        c.moveTo(640, GY + 14 + o);
        c.quadraticCurveTo(1000, GY + 20 + o, lerp(640, 1300, drift), GY + 44 + o + drift * 30);
        c.stroke();
      }
    }
    speedLines(c, s.tc, 0.5, -1, 'rgba(255,255,255,0.7)', 300, 900);
  },
};
const WINGS = 0.25;
const flyIn = {
  t: 102.9, hand: 0.6, punch: 2,
  cam: (s) => cam(W / 2, 540, lerp(1.0, 1.12, s.k), Math.sin(s.lt * 2.4) * 0.05),
  bg: (c, s) => hallAhead(c, s.lt * 1.6),
  cel(c, s) {
    const k = clamp(s.lt / (s.dur - 0.1));
    const g = key(s.lt, [[0, 0.34], [0.5, 0.42, 'out'], [1.7, 1.3, 'io'], [s.dur - 0.1, 9, 'in']]);
    const open = easeOutBack(clamp((s.ltc - WINGS) / 0.3));
    const flap = Math.sin(s.tc * 17) * 0.32;
    const weave = Math.sin(s.lt * 3.2) * 260 * (1 - k);
    const up = key(s.lt, [[0, 0], [WINGS, 0], [1.2, 150, 'io'], [s.dur, 60, 'io']]);
    const y = lerp(650, 1500, easeIn(k)) - up * (1 - k);
    brie(c, {
      view: 'front', x: W / 2 + weave, y, ground: lerp(650, 1700, easeIn(k)), s: g, shadow: k < 0.7,
      expr: k > 0.6 ? 'shout' : 'happy', fEyes: s.lt < WINGS + 0.3 && s.lt > WINGS ? 'wide' : undefined, wag: wag(s.tc), earFlop: 1 + 0.4 * flap,
      tilt: Math.cos(s.lt * 3.2) * 0.22 * (1 - k), under: (x) => drawWings(x, open, flap),
    });
  },
  fx(c, s) {
    const k = s.k;
    pow(c, W / 2, 560, 150, s.ltc - WINGS, '#ffffff', 10, 6, 0.25);
    if (s.lt > WINGS && s.lt < WINGS + 0.9) bigLabel(c, 'FLAP!', 1300, 380, 130, '#b77dff', (s.lt - WINGS) * 4, 0.1);
    screen(c, () => focusLines(c, s.tc, W / 2, H / 2, 0.3 + k, 'rgba(255,255,255,0.7)', lerp(560, 300, k)));
    // loose feathers
    for (let i = 0; i < 7; i++) {
      const u = frac(s.lt * 0.7 + i / 7);
      c.save();
      c.translate(W / 2 + (rand(i) - 0.5) * 1700 * u, 520 + (rand(i + 9) - 0.3) * 900 * u);
      c.rotate(i + s.tc * 3);
      c.beginPath();
      c.ellipse(0, 0, 10 + u * 40, 4 + u * 14, 0, 0, TAU);
      fillStroke(c, '#ffffff', INK, 4);
      c.restore();
    }
  },
};

/* ---------- um "cocodrilo" fugindo do zoológico ---------- */
const CAUGHT = 1.15;
// little crocodiles from the zoo, tagging along on her escape
const KIDS = [[0.62, 0], [0.5, 0.37], [0.56, 0.71]];
function crocKid(c, x, y, k, phase, tag) {
  c.save();
  c.translate(x, y);
  c.scale(k, k);
  P.croc(c, phase, { tag });
  c.restore();
}
const sneak = {
  t: 105.7, tr: 'fluff', hand: 0.3, punch: 0.6,
  tint: () => [0.82, 0.86, 1.08],
  cam: (s) => cam(lerp(860, 1000, s.k), 640, crash(s.lt, 1.1, 1.35, CAUGHT, 2), 0),
  bg(c, s) {
    night(c, s.t, 0);
    P.zooGate(c, 760, 900);
  },
  cel(c, s) {
    const tk = take(s.ltc, CAUGHT);
    const caught = s.lt >= CAUGHT;
    const x = lerp(620, 1040, clamp(s.lt / CAUGHT));
    // they sneak out in a line behind her, and freeze with a little jump when the lights hit
    KIDS.forEach(([k, off], i) => {
      const a = s.ltc - CAUGHT - 0.06 * i;
      const hop = a > 0 ? 70 * Math.exp(-a * 4) * Math.abs(Math.sin(a * 11)) : 0;
      crocKid(c, x - 350 - i * 175, GY - 44 - (i % 2) * 22 - hop, k, caught ? 0 : frac(s.ltc * 1.6 + off) * 0.5 + (i % 2) * 0.5, i === 0);
    });
    brie(c, { x, y: GY, s: 1.25, costume: 'croc', ct: s.tc, wag: 0, ...(caught ? { sq: tk.sq, eyes: 'wide', ear: 0.6, mouth: 0.4, look: -1, legs: [0.3, -0.3] } : tiptoe(s.lt, 3.4)) });
  },
  fx(c, s) {
    // searchlights hunting, then both snap onto her
    const lock = easeOut(clamp((s.lt - CAUGHT + 0.12) / 0.12));
    spot(c, lerp(300 + Math.sin(s.lt * 2.2) * 260, 1040, lock), GY + 10, 230, 0.5);
    spot(c, lerp(1600 + Math.sin(s.lt * 1.7 + 2) * 240, 1040, lock), GY + 10, 200, 0.4);
    if (s.lt > CAUGHT) bigLabel(c, '!', 1230, 520, 220, '#ffd84d', (s.lt - CAUGHT) * 5, 0.15);
  },
};
const escape = {
  t: 107.55, tr: 'whipR', hand: 1.2, punch: 2,
  tint: () => [0.86, 0.9, 1.08],
  cam: (s) => cam(W / 2 + 80, 700, 1.2, -0.05),
  bg(c, s) {
    night(c, s.t, 600 + s.lt * 1500);
    P.zooGate(c, 300 - s.lt * 1500 * 0.6, 900);
  },
  cel(c, s) {
    const bx = 1040 + Math.sin(s.lt * 2.5) * 90;
    // the little ones run for it too, further back
    [[1700, 0], [1470, 1], [370, 2]].forEach(([kx, i]) => {
      const [k, off] = KIDS[i];
      crocKid(c, kx + Math.sin(s.lt * 3 + i * 2) * 45, GY - 62 - (i % 2) * 24, k, frac(s.ltc * 4.5 + off), i === 0);
    });
    brie(c, { x: bx, y: GY, s: 1.35, costume: 'croc', ct: s.tc, phase: frac(s.lt * 6), amp: 1, ear: 1, mouth: 0.9, eyes: blink(s.tc, 3) ? 'closed' : 'happy', wag: wag(s.tc), lean: 0.24, trail: { dx: 80, dy: 0, n: 2 } });
    // the keeper's net, always one swipe behind
    const sw = Math.sin(s.lt * 7);
    c.save();
    c.translate(600 + sw * 100, 1150);
    c.rotate(0.12 + sw * 0.36);
    c.strokeStyle = INK;
    c.lineWidth = 22;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, 200);
    c.lineTo(0, -430);
    c.stroke();
    c.strokeStyle = '#c98a55';
    c.lineWidth = 12;
    c.stroke();
    c.beginPath();
    c.ellipse(0, -560, 150, 130, 0, 0, TAU);
    c.fillStyle = 'rgba(255,255,255,0.3)';
    c.fill();
    c.lineWidth = 12;
    c.strokeStyle = INK;
    c.stroke();
    c.lineWidth = 3;
    for (let i = -3; i <= 3; i++) {
      c.beginPath();
      c.moveTo(i * 40, -680);
      c.lineTo(i * 40, -440);
      c.moveTo(-140, -560 + i * 34);
      c.lineTo(140, -560 + i * 34);
      c.stroke();
    }
    c.restore();
  },
  fx(c, s) {
    spot(c, 820 + Math.sin(s.lt * 5) * 200, GY + 10, 230, 0.45);
    spot(c, 520 + Math.sin(s.lt * 4 + 1) * 160, GY + 10, 190, 0.35);
    speedLines(c, s.tc, 0.8, -1, 'rgba(255,255,255,0.6)', 300, 950);
    for (let i = 1; i < 4; i++) puff(c, 1000 - i * 190, GY + 8, i * 0.1 + frac(s.tc * 4) * 0.1, 0.7, i + s.d, '#d9e6c8');
    bigLabel(c, 'FUGIU!', 1480, 300, 150, '#43b75c', s.lt * 2.5, -0.08);
  },
};

/* ---------- e um pão de queijo intergaláctico: slow and floaty on purpose ---------- */
const SP0 = 109.5;
const spaceAt = (t) => {
  const lt = t - SP0;
  return { x: lerp(620, 1040, lt / 4.3), y: 730 + Math.sin(lt * 1.4) * 40, r: -0.2 + Math.sin(lt * 0.9) * 0.12 };
};
function spaceBg(c, s) {
  const lt = s.t - SP0;
  sky(c, '#06051a', '#1d1450');
  c.fillStyle = '#06051a';
  c.fillRect(-400, -400, W + 800, 400);
  c.fillStyle = '#1d1450';
  c.fillRect(-400, H, W + 800, 400);
  if (DETAIL.on) {
    // nebula washes, a river of star dust, a few bright stars with glints
    pool(c, 520 - lt * 8, 300, 640, 380, '150,90,255', 0.3);
    pool(c, 1300 - lt * 12, 840, 720, 360, '60,170,255', 0.2);
    pool(c, 1040 - lt * 10, 520, 520, 250, '255,110,190', 0.15);
    for (let i = 0; i < 90; i++) {
      const u = rand(i * 2.3), v = rand(i * 4.7) - 0.5;
      const x = -100 + u * 2200 - lt * 6, y = 880 - u * 620 + v * 190 * (0.5 + rand(i));
      c.fillStyle = `rgba(${i % 3 ? '220,210,255' : '255,220,240'},${0.25 + 0.4 * rand(i * 7)})`;
      c.beginPath();
      c.arc(x, y, 1 + rand(i * 9) * 1.8, 0, TAU);
      c.fill();
    }
  }
  twinkleStars(c, s.tc, 220, H, 5);
  if (DETAIL.on) {
    for (let i = 0; i < 9; i++) {
      const tw = 0.55 + 0.45 * Math.sin(s.tc * (1.5 + rand(i) * 2) + i * 2.4);
      glint(c, 120 + rand(i * 3.7 + 1) * 1700 - lt * 5, 70 + rand(i * 5.9 + 2) * 940, (9 + rand(i * 8) * 13) * tw, 0.9 * tw, i % 3 ? '#ffffff' : '#ffe9a8');
    }
  }
  c.beginPath();
  c.arc(1650 - lt * 20, 220, 110, 0, TAU);
  fillStroke(c, '#ff9ec4', INK, 6);
  if (DETAIL.on) planetShade(c, 1650 - lt * 20, 220, 110, 'rgba(255,255,255,0.3)', 4);
  c.beginPath();
  c.arc(260 - lt * 30, 900, 70, 0, TAU);
  fillStroke(c, '#7fd3ff', INK, 6);
  if (DETAIL.on) planetShade(c, 260 - lt * 30, 900, 70, 'rgba(255,255,255,0.35)', 3);
  local(c, 1560 - lt * 40 + Math.sin(lt) * 20, 640 + Math.cos(lt * 0.8) * 20, Math.sin(lt * 0.5) * 0.05, 1, () => P.paoDeQueijo(c, 145, s.tc, true));
}
function astronaut(c, s) {
  const lt = s.t - SP0;
  const p = spaceAt(s.t);
  // her plush UFO buzzing about with its tractor beam
  local(c, 430 + Math.sin(lt * 1.3) * 110 + lt * 60, 290 + Math.sin(lt * 2.6) * 45, Math.cos(lt * 1.3) * 0.18, 1, () => {
    const beam = c.createLinearGradient(0, 60, 0, 420);
    beam.addColorStop(0, 'rgba(255,240,150,0.55)');
    beam.addColorStop(1, 'rgba(255,240,150,0)');
    c.fillStyle = beam;
    c.beginPath();
    c.moveTo(-60, 70);
    c.lineTo(60, 70);
    c.lineTo(170 + Math.sin(lt * 6) * 15, 420);
    c.lineTo(-170 - Math.sin(lt * 6) * 15, 420);
    c.closePath();
    c.fill();
    P.ufoToy(c, 130);
  });
  brie(c, { x: p.x, y: p.y, s: 1.35, rot: p.r, costume: 'cheese', ct: s.tc, phase: frac(s.tc * 0.6), amp: 0.5, ear: 0.2, mouth: 0.4, eyes: blink(s.tc, 1) ? 'closed' : 'happy', wag: wag(s.tc) * 0.3, shadow: false });
  local(c, p.x, p.y, p.r, 1.35, () => {
    // a glass bowl big enough for the whole head: beret, ear, nose and tongue
    const hx = 112, hy = -166, R = 138, cut = 1.02;
    c.beginPath();
    c.arc(hx, hy, R, Math.PI - cut, cut);
    c.closePath();
    const g = c.createRadialGradient(hx - R * 0.35, hy - R * 0.4, R * 0.1, hx, hy, R);
    g.addColorStop(0, 'rgba(225,245,255,0.34)');
    g.addColorStop(0.75, 'rgba(180,222,255,0.16)');
    g.addColorStop(1, 'rgba(150,200,255,0.4)');
    c.fillStyle = g;
    c.fill();
    c.lineWidth = 8;
    c.strokeStyle = INK;
    c.stroke();
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = 11;
    c.beginPath();
    c.arc(hx, hy, R - 24, -2.5, -1.75);
    c.stroke();
    c.lineWidth = 7;
    c.beginPath();
    c.arc(hx, hy, R - 24, -1.6, -1.42);
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.4)';
    c.lineWidth = 6;
    c.beginPath();
    c.arc(hx, hy, R - 16, 0.25, 0.75);
    c.stroke();
    // the collar ring the bowl sits in
    const ry = hy + Math.sin(cut) * R, rw = Math.cos(cut) * R;
    c.beginPath();
    c.ellipse(hx, ry, rw + 8, 17, 0, 0, TAU);
    fillStroke(c, '#d0d6e8', INK, 6);
    c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.lineWidth = 5;
    c.beginPath();
    c.ellipse(hx, ry - 3, rw - 6, 9, 0, Math.PI * 1.1, Math.PI * 1.6);
    c.stroke();
    c.fillStyle = '#ff5d8f';
    c.beginPath();
    c.arc(hx + rw - 14, ry + 1, 6, 0, TAU);
    c.fill();
    glint(c, hx - R * 0.52, hy - R * 0.5, 20, 0.9);
  });
}
const drift = {
  t: SP0, tr: 'flash', hand: 0.15, punch: 0.3,
  cam: (s) => cam(W / 2, H / 2, lerp(1.0, 1.08, s.k), lerp(-0.05, 0.03, s.k)),
  bg: spaceBg,
  cel: astronaut,
  fx: (c, s) => bigLabel(c, 'INTERGALÁCTICO!', W / 2, 150, 100, '#ffd84d', s.lt * 2, -0.03),
};
const driftClose = {
  t: 111.75, hand: 0.15, punch: 0.3,
  cam: (s) => {
    const p = spaceAt(s.t);
    return cam(p.x + 120, p.y - 190, lerp(1.7, 1.95, s.k), lerp(0.1, -0.06, s.k));
  },
  bg: spaceBg,
  cel: astronaut,
  fx(c, s) {
    const p = spaceAt(s.t);
    sparkles(c, s.tc, p.x + 120, p.y - 200, 420, 10, 3, '#fff6a8');
  },
};

/* ---------- para dois segundos só pra respirar ---------- */
const P0 = 113.78;
const pause = {
  t: P0, hand: 0, punch: 0,
  cam: (s) => cam(W / 2, lerp(560, 520, easeInOut(s.k)), lerp(1.0, 1.3, easeInOut(s.k)), 0),
  bg: (c, s) => room(c, 'living', 500, 0),
  cel(c, s) {
    // a held drawing: only the panting moves, then a tremble as the engine restarts
    const p = Math.sin(s.tc * 16);
    const rev = clamp((s.lt - 2.5) / 1.1);
    brie(c, { view: 'front', x: W / 2 + (s.d % 2 ? 1 : -1) * rev * 9, y: FY + 160, s: 1.7, expr: 'happy', fMouth: 0.6 + 0.3 * p, fEyes: rev > 0.5 ? 'wide' : blink(s.tc, 2) ? 'closed' : undefined, sq: 0.025 * p + rev * 0.08, tilt: 0.06 * (1 - rev), wag: wag(s.tc) * 0.3 * (1 - rev) + rev * s.tc * 60, earFlop: 0.2 + rev * 0.5 });
    P.clock(c, 1500, 330, 110, Math.min(2, s.lt * 0.8));
  },
  fx(c, s) {
    for (let i = 0; i < 3; i++) {
      const a = frac(s.tc * 2 + i / 3);
      c.globalAlpha = 1 - a;
      blob(c, [[W / 2 + 150 + a * 150, FY - 300 - a * 110, 18 + a * 28]], '#ffffff', 4, 'rgba(58,39,71,0.4)');
    }
    c.globalAlpha = 1;
    bigLabel(c, s.lt < 1.5 ? '1...' : s.lt < 3 ? '2...' : '', 1500, 540, 100, '#4cc3ff', (s.lt % 1.5) * 3, 0.05);
    if (s.lt < 2.5) bigLabel(c, 'HAF HAF', 470, 400, 90, '#ff9ec4', s.lt * 2, -0.08);
    // sweat drop
    const dr = frac(s.lt * 0.8);
    local(c, W / 2 - 190, FY - 250 + dr * 70, 0, 1, () => {
      c.globalAlpha = 1 - dr;
      c.beginPath();
      c.moveTo(0, -30);
      c.quadraticCurveTo(22, 0, 0, 16);
      c.quadraticCurveTo(-22, 0, 0, -30);
      fillStroke(c, '#7fd3ff', INK, 4);
      c.globalAlpha = 1;
    });
  },
};

/* ---------- já liga o turbo, volta a acelerar ---------- */
const gaugeShot = {
  t: 117.42, hand: 0.4, punch: 2,
  cam: (s) => {
    const v = clamp(s.lt / 1.0);
    return cam(W / 2 + (s.d % 2 ? 1 : -1) * 10 * v, 540, crash(s.lt, 1.0, 1.18, 0, 3, 0.3), 0.04);
  },
  bg(c, s) {
    c.fillStyle = '#ff7a59';
    c.fillRect(-400, -400, W + 800, H + 800);
    sunburst(c, s.tc, W / 2, 600, '#ff9a6b', '#ff5d5d', 18, 0.6);
  },
  cel(c, s) {
    const v = clamp(s.lt / 1.0 * 1.05);
    P.gauge(c, W / 2, 500, 340, v + (v >= 1 ? Math.sin(s.tc * 40) * 0.03 : 0));
    // two ears and a pair of eyes rising into frame
    brie(c, { view: 'head', x: W / 2, y: lerp(1500, 860, easeOutBack(clamp((s.lt - 0.2) / 0.4))), s: 2.0, expr: 'innocent', rot: Math.sin(s.tc * 40) * 0.02 * clamp(s.lt) });
  },
  fx(c, s) {
    if (s.lt > 0.9) bigLabel(c, 'MAX!', 1520, 300, 150, '#ffd84d', (s.lt - 0.9) * 5, 0.12);
  },
};
const eyesShot = {
  t: 118.62, tr: 'impact', hand: 0.3, punch: 2,
  cam: (s) => cam(W / 2 + (s.d % 2 ? 7 : -7), 540, crash(s.lt, 1.0, 1.3), -0.03),
  bg(c, s) {
    c.fillStyle = '#ffd84d';
    c.fillRect(-400, -400, W + 800, H + 800);
    sunburst(c, s.tc, W / 2, 540, '#fff0a0', '#ffb347', 20, 1.2);
  },
  cel(c, s) {
    brie(c, { view: 'head', x: W / 2, y: 550, s: 3.3, expr: s.lt < 0.5 ? 'innocent' : 'shout', fEyes: s.lt < 0.5 ? undefined : 'wide', rot: Math.sin(s.tc * 50) * 0.02 });
  },
  fx: (c, s) => screen(c, () => focusLines(c, s.tc, W / 2, H / 2, 1, 'rgba(255,255,255,0.9)', 560)),
};
const ZIP = 0.5;
const turboGo = {
  t: 119.5, hand: 0.5, punch: 2,
  cam: (s) => {
    const sh = shake(s.lt - ZIP, 30, s.d, 0.4);
    return cam(W / 2 + sh[0], 660 + sh[1], 1.12, 0);
  },
  bg: (c, s) => room(c, 'hall', 20000, s.t),
  cel(c, s) {
    const z = zip(s.lt, { t0: ZIP, x: 760, dir: 1, wind: 0.42, dist: 3000 });
    if (!z.gone) brie(c, { y: GY, s: 1.35, wag: wag(s.tc), ...z });
  },
  fx(c, s) {
    const a = s.lt - ZIP;
    for (let i = 0; i < 4; i++) puff(c, 470 + i * 60, GY - 30 - (i % 2) * 60, s.ltc - ZIP - i * 0.03, 1.5 - i * 0.2, i, '#f6e2c8');
    if (a < 0) for (let i = 0; i < 3; i++) puff(c, 640 - i * 60, GY + 6, frac(s.tc * 5 + i / 3) * 0.3, 0.7, i + s.d, '#f6e2c8');
    if (a > -0.05) bigLabel(c, 'TURBO!', W / 2 + 120, 440, 230, '#ff5d8f', (a + 0.05) * 4, -0.06);
    if (a > 0) speedLines(c, s.tc, 1.2, -1);
  },
};
const turboRun = {
  t: 120.3, tr: 'whipR', hand: 1.4, punch: 2, glow: 0.5,
  blur: () => [7, 0],
  cam: (s) => cam(W / 2 + 60, 700, 1.25, -0.06),
  bg(c, s) {
    const camX = 21000 + s.lt * 5200;
    room(c, 'hall', camX, s.t);
    lane(c, camX);
  },
  cel(c, s) {
    const out = easeIn(clamp((s.left - 0.02) / 0.2));
    const x = 900 + Math.sin(s.lt * 4) * 60 + (1 - out) * 1600;
    brie(c, { x, y: GY, s: 1.4, phase: frac(s.lt * 9), amp: 1, ear: 1, mouth: 0.9, eyes: 'happy', wag: wag(s.tc), lean: 0.34, stretch: 1.3, trail: { dx: 70, dy: 0, n: 2 } });
  },
  fx(c, s) {
    const out = easeIn(clamp((s.left - 0.02) / 0.2));
    const x = 900 + Math.sin(s.lt * 4) * 60 + (1 - out) * 1600 - 215;
    if (DETAIL.on) {
      // a real flame: its light on the floor, then the fire itself
      pool(c, x - 300, GY + 26, 620, 46, '255,160,60', 0.5);
      flame(c, x - 4, GY - 128, 640, 86, s.d, s.lt, 3);
      speedLines(c, s.tc, 1.3, -1);
      for (let i = 1; i < 4; i++) puff(c, 800 - i * 240, GY + 8, i * 0.08 + frac(s.tc * 5) * 0.1, 0.9, i + s.d, '#f6e2c8');
      return;
    }
    const fl = 1 + 0.3 * Math.sin(s.tc * 60);
    c.beginPath();
    c.moveTo(x, GY - 200);
    c.quadraticCurveTo(x - 620 * fl, GY - 130, x, GY - 60);
    c.closePath();
    fillStroke(c, '#ff8c42', INK, 6);
    c.beginPath();
    c.moveTo(x, GY - 168);
    c.quadraticCurveTo(x - 360 * fl, GY - 130, x, GY - 92);
    c.closePath();
    c.fillStyle = '#fff27a';
    c.fill();
    speedLines(c, s.tc, 1.3, -1);
    for (let i = 1; i < 4; i++) puff(c, 800 - i * 240, GY + 8, i * 0.08 + frac(s.tc * 5) * 0.1, 0.9, i + s.d, '#f6e2c8');
  },
};

export default {
  from: 92.04, to: 121.44,
  shots: [hallTrot, hallFront, startLine, race, boing, corner, flyIn, sneak, escape, drift, driftClose, pause, gaugeShot, eyesShot, turboGo, turboRun],
};
