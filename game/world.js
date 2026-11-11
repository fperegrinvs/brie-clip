// Backgrounds and level art, built from the music video's drawing helpers.
import { W, H, sky, twinkleStars } from '../src/fx.js';
import * as P from '../src/props.js';
import { TAU, INK, blob, fillStroke, clover, clamp, lerp, rand, star } from '../src/util.js';
import { drawBrieSide } from '../src/brie.js';
import { costume, withRocket } from '../src/costumes.js';
import { SING } from '../src/text.js';
import { LEVEL, GY, GOAL } from './level.js';

const HOUSE_END = 5600, LIVING_END = 3700;

/* ---------------- backgrounds (screen space) ---------------- */
export function drawBackground(ctx, camX, camY, t, opts = {}) {
  const houseEdge = HOUSE_END - camX;
  if (houseEdge < W) drawOutdoor(ctx, camX, camY, t, Math.max(0, houseEdge));
  if (houseEdge > 0) drawHouse(ctx, camX, camY, t, Math.min(W, houseEdge));
}

function drawHouse(ctx, camX, camY, t, xEnd) {
  const livEdge = LIVING_END + 210 - camX;
  const part = (theme, x0, x1) => {
    if (x1 <= x0) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, 0, x1 - x0, H);
    ctx.clip();
    ctx.translate(0, GY - P.FLOOR_Y - camY);
    P.roomStrip(ctx, camX, theme, false, t);
    ctx.restore();
  };
  part('living', 0, Math.min(xEnd, livEdge));
  part('kitchen', Math.max(0, livEdge), xEnd);
}

function drawOutdoor(ctx, camX, camY, t, xStart) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(xStart, 0, W - xStart, H);
  ctx.clip();
  const alt = clamp(-camY / 2800);
  const mix = (a, b, k) => {
    const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16));
    const pb = b.match(/\w\w/g).map((h) => parseInt(h, 16));
    return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], k)).toString(16).padStart(2, '0')).join('');
  };
  sky(ctx, mix('#8fd8ff', '#241650', alt), mix('#fff1f7', '#8a5cc8', alt));
  if (alt > 0.15) {
    ctx.save();
    ctx.globalAlpha = clamp((alt - 0.15) / 0.4);
    twinkleStars(ctx, t, 140, H, 3);
    ctx.restore();
  }
  // sun sets, moon rises as we climb
  if (alt < 0.6) {
    ctx.save();
    ctx.globalAlpha = clamp(1 - alt / 0.6);
    P.sun(ctx, 1300, 250 + alt * 700, 70, t);
    ctx.restore();
  }
  if (alt > 0.3) P.moon(ctx, 300, 900 - (alt - 0.3) * 1100, 80);

  const sink = -camY;
  // far castle (garden only)
  const cx = 9800 - camX * 0.25 - 9800 * 0.75 + 600;
  if (cx > -400 && cx < W + 400) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    P.castle(ctx, cx, 640 + sink * 0.1, 0.32, { t });
    ctx.restore();
  }
  P.clouds(ctx, t, camX, 0.08, 80 + sink * 0.05, 0.9);
  ctx.save();
  ctx.translate(0, sink * 0.18);
  P.hills(ctx, camX, 760, 70, '#b9f0c4', 0.15, 1);
  ctx.translate(0, sink * 0.1);
  P.hills(ctx, camX, 860, 60, '#8fe3a0', 0.3, 3, true);
  ctx.restore();
  // pink blossom trees in the mid ground
  ctx.save();
  ctx.translate(0, sink * 0.45);
  const sp = 0.55, span = 900;
  const off = camX * sp;
  for (let k = Math.floor(off / span) - 1; k < Math.floor((off + W) / span) + 2; k++) {
    const x = k * span + rand(k) * 300 - off;
    const wx = k * span;
    if (wx < (HOUSE_END - 1000) * sp) continue;
    tree(ctx, x, 900, 0.8 + rand(k + 7) * 0.4, k);
  }
  ctx.restore();
  ctx.restore();
}

function tree(ctx, x, y, s, seed) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.roundRect(-18, -230, 36, 230, 14);
  fillStroke(ctx, '#c98a55', INK, 5);
  const col = ['#ffc6de', '#ffd6a8', '#c9f2b0'][seed % 3 < 0 ? 0 : seed % 3];
  blob(ctx, [[0, -300, 110], [-90, -250, 75], [90, -255, 80], [-40, -370, 80], [55, -360, 75]], col, 5);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(-80 + rand(i + seed) * 160, -380 + rand(i * 3 + seed) * 160, 7, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/* ---------------- level art (world space) ---------------- */
const inView = (x0, x1, camX, pad = 300) => x1 > camX - pad && x0 < camX + W + pad;

export function drawWorldBack(ctx, camX, camY, t, state) {
  // house furniture & decor behind everything
  for (const d of LEVEL.decor) {
    if (!inView(d.x - 600, d.x + 900, camX)) continue;
    if (d.kind === 'table') P.furniture(ctx, 'table', d.x, d.y, t);
    else if (d.kind === 'sofa') {
      for (const lx of [20, 480]) {
        ctx.beginPath();
        ctx.rect(d.x + lx, d.y - 40, 20, GY - d.y + 40);
        fillStroke(ctx, '#8a5a2b', INK, 5);
      }
      P.furniture(ctx, 'sofa', d.x, d.y, t);
    } else if (d.kind === 'door') drawDoorway(ctx, d.x, d.y);
    else if (d.kind === 'zooGate') P.zooGate(ctx, d.x, d.y);
  }
  // decorative furniture along the walls
  if (camX < HOUSE_END + 200) {
    for (const [x, type] of [[200, 'window'], [1650, 'frame'], [2440, 'lamp'], [3380, 'plant'], [4160, 'fridge'], [4980, 'window']]) {
      if (inView(x - 100, x + 500, camX)) P.furniture(ctx, type, x, GY, t);
    }
  }
  // zoo fences and reeds
  if (inView(11600, 16000, camX, 0)) {
    for (let x = 11700; x < 12650; x += 120) fencePost(ctx, x, GY);
    for (let x = 15320; x < 15880; x += 120) fencePost(ctx, x, 520);
  }
  // water (back layer)
  for (const w of LEVEL.water) {
    if (!inView(w.x, w.x + w.w, camX)) continue;
    const g = ctx.createLinearGradient(0, w.y, 0, w.y + w.h);
    g.addColorStop(0, '#7fd8ff');
    g.addColorStop(1, '#3d7fd6');
    ctx.fillStyle = g;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    // reeds and pebbles
    for (let i = 0; i < 26; i++) {
      const rx = w.x + 60 + i * (w.w / 26) + rand(i) * 40;
      const rh = 80 + rand(i + 9) * 140;
      ctx.strokeStyle = i % 2 ? '#3fae6a' : '#55c47c';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(rx, w.y + w.h);
      ctx.quadraticCurveTo(rx + Math.sin(t * 1.5 + i) * 26, w.y + w.h - rh * 0.6, rx + Math.sin(t * 1.5 + i + 1) * 30, w.y + w.h - rh);
      ctx.stroke();
    }
  }
  // the castle at the goal
  if (inView(GOAL.x - 800, GOAL.x + 800, camX)) {
    P.castle(ctx, GOAL.x, GOAL.y, 0.85, { t, gateOpen: state.gateOpen ?? 0 });
  }
}

function fencePost(ctx, x, y) {
  ctx.beginPath();
  ctx.roundRect(x - 10, y - 150, 20, 150, [10, 10, 0, 0]);
  fillStroke(ctx, '#fff3d6', INK, 4);
  ctx.beginPath();
  ctx.rect(x - 60, y - 110, 120, 14);
  ctx.rect(x - 60, y - 60, 120, 14);
  fillStroke(ctx, '#fff3d6', INK, 4);
}

function drawDoorway(ctx, x, y) {
  // open front door with daylight spilling in
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x - 10, y - 470, 240, 470, [110, 110, 0, 0]);
  const g = ctx.createLinearGradient(x, y - 470, x, y);
  g.addColorStop(0, '#bdf0ff');
  g.addColorStop(1, '#e8ffd8');
  fillStroke(ctx, g, INK, 8);
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 30);
  ctx.quadraticCurveTo(x + 110, y - 120, x + 230, y - 40);
  ctx.lineTo(x + 230, y);
  ctx.lineTo(x - 10, y);
  ctx.closePath();
  ctx.fillStyle = '#8fe3a0';
  ctx.fill();
  // door swung open
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.lineTo(x - 10, y - 470);
  ctx.lineTo(x - 90, y - 440);
  ctx.lineTo(x - 90, y - 20);
  ctx.closePath();
  fillStroke(ctx, '#ff8fb3', INK, 7);
  ctx.beginPath();
  ctx.arc(x - 70, y - 230, 9, 0, TAU);
  fillStroke(ctx, '#ffd84d', INK, 4);
  clover(ctx, x - 50, y - 360, 22, 0, '#37c45c', 4);
  ctx.restore();
}

export function drawLevel(ctx, camX, camY, t, state) {
  const L = LEVEL;
  // soft cloud bank below the outdoor world, so gaps read as "sky below"
  if (camX + W > HOUSE_END) {
    const x0 = Math.max(HOUSE_END, Math.floor(camX / 110) * 110 - 110);
    const shapes = [];
    for (let x = x0; x < camX + W + 160; x += 110) {
      if (x > 12600 && x < 15400) continue; // the pond has its own floor
      shapes.push([x, 1110 + Math.sin(x * 0.013 + t * 0.8) * 14, 90 + rand(Math.floor(x / 110)) * 40]);
      shapes.push([x + 55, 1220, 80, 60, 0]);
    }
    if (shapes.length) blob(ctx, shapes, '#ffffff', 5, 'rgba(58,39,71,0.25)');
  }
  for (const s of L.solids) {
    if (!inView(s.x, s.x + s.w, camX)) continue;
    drawSolid(ctx, s, t);
  }
  // côve buddy track
  if (inView(9300, 10300, camX)) P.rail(ctx, 9300, 990, 10300, 990);
  for (const r of L.rails) if (inView(r.x0, r.x1, camX)) P.rail(ctx, r.x0, r.y0, r.x1, r.y1);
  for (const o of L.oneWays) {
    if (!inView(o.x, o.x + o.w, camX)) continue;
    drawOneWay(ctx, o, t);
  }
  for (const b of L.bouncers) if (inView(b.x, b.x + b.w, camX)) drawBouncer(ctx, b, t);
  for (const m of L.movers) if (inView(m.cx - 200, m.cx + 200, camX)) drawBuddy(ctx, m, t);
  for (const s of L.signs) if (inView(s.x - 150, s.x + 150, camX)) drawSign(ctx, s);
  for (const c of L.checkpoints) if (inView(c.x - 100, c.x + 100, camX)) drawCheckpoint(ctx, c, t);
  for (const b of L.bubbles) if (inView(b.x - 100, b.x + 100, camX)) drawBubble(ctx, b, t, state.costume);
}

function drawSolid(ctx, s, t) {
  switch (s.kind) {
    case 'grass': {
      ctx.beginPath();
      ctx.roundRect(s.x, s.y, s.w, s.h, [36, 36, 0, 0]);
      const g = ctx.createLinearGradient(0, s.y, 0, s.y + 400);
      g.addColorStop(0, '#ffd9b3');
      g.addColorStop(1, '#f0a88c');
      fillStroke(ctx, g, INK, 6);
      // grass cap with scallops
      ctx.beginPath();
      ctx.moveTo(s.x, s.y + 40);
      ctx.lineTo(s.x, s.y + 30);
      ctx.arcTo(s.x, s.y, s.x + 36, s.y, 30);
      ctx.lineTo(s.x + s.w - 36, s.y);
      ctx.arcTo(s.x + s.w, s.y, s.x + s.w, s.y + 30, 30);
      ctx.lineTo(s.x + s.w, s.y + 40);
      const n = Math.max(2, Math.round(s.w / 60));
      for (let i = n; i >= 0; i--) {
        const x = s.x + (s.w * i) / n;
        ctx.quadraticCurveTo(x + s.w / n / 2, s.y + 64, x, s.y + 40);
      }
      ctx.closePath();
      fillStroke(ctx, '#6fdc86', INK, 6);
      // flowers & clovers
      for (let i = 0; i < s.w / 140; i++) {
        const fx = s.x + 40 + i * 140 + rand(i + s.x) * 60;
        if (fx > s.x + s.w - 30) break;
        if (i % 3 === 0) clover(ctx, fx, s.y + 6, 13, rand(i) - 0.5, '#3fbf5a', 3);
        else flower(ctx, fx, s.y + 4, ['#fff', '#ffd84d', '#ff9ec4'][i % 3]);
      }
      // pebbles in the soil
      ctx.fillStyle = 'rgba(200,120,100,0.35)';
      for (let i = 0; i < s.w / 110; i++) {
        ctx.beginPath();
        ctx.ellipse(s.x + 50 + i * 110 + rand(i * 7 + s.x) * 50, s.y + 120 + rand(i * 5) * 240, 16, 10, 0, 0, TAU);
        ctx.fill();
      }
      break;
    }
    case 'bookshelf': {
      const x = s.x, y0 = s.y, y1 = s.y + s.h;
      ctx.beginPath();
      ctx.roundRect(x, y0, s.w, s.h, 12);
      fillStroke(ctx, '#c98a55', INK, 8);
      // shelves of books
      const cols = ['#ff8fb3', '#7fd3ff', '#ffd84d', '#a6e88c', '#b9a6ff', '#ffb37a'];
      for (let sy = y1 - 150; sy > y0 + 60; sy -= 190) {
        ctx.beginPath();
        ctx.rect(x + 22, sy - 150, s.w - 44, 150);
        fillStroke(ctx, '#e2a66e', INK, 5);
        let bx = x + 30, k = Math.floor(sy);
        while (bx < x + s.w - 60) {
          const bw = 26 + rand(k++) * 22, bh = 90 + rand(k++) * 50;
          ctx.beginPath();
          ctx.roundRect(bx, sy - bh, bw, bh, 5);
          fillStroke(ctx, cols[k % cols.length], INK, 4);
          bx += bw + 4;
        }
      }
      // little arched pet hole at the bottom
      ctx.beginPath();
      ctx.moveTo(x - 4, y1);
      ctx.lineTo(x - 4, y1 + 85);
      ctx.lineTo(x + s.w + 4, y1 + 85);
      ctx.lineTo(x + s.w + 4, y1);
      ctx.closePath();
      ctx.fillStyle = '#5a3d4f';
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x, y1 + 85);
      ctx.lineTo(x, y1);
      ctx.lineTo(x + s.w, y1);
      ctx.lineTo(x + s.w, y1 + 85);
      ctx.stroke();
      // fairy lights along the hole
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = ['#ffd84d', '#ff9ec4', '#7fd3ff'][i % 3];
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 4 + i);
        ctx.beginPath();
        ctx.arc(x + 25 + i * ((s.w - 50) / 8), y1 + 12, 7, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'counter': {
      ctx.beginPath();
      ctx.roundRect(s.x + 10, s.y + 30, s.w - 20, s.h - 30, 8);
      fillStroke(ctx, '#ffffff', INK, 7);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.roundRect(s.x + 30 + i * ((s.w - 60) / 3), s.y + 60, (s.w - 60) / 3 - 16, s.h - 80, 10);
        fillStroke(ctx, '#d4f0ff', INK, 4);
        ctx.beginPath();
        ctx.arc(s.x + 30 + i * ((s.w - 60) / 3) + (s.w - 60) / 6 - 8, s.y + 100, 7, 0, TAU);
        fillStroke(ctx, '#ffd84d', INK, 3);
      }
      ctx.beginPath();
      ctx.roundRect(s.x, s.y, s.w, 34, 10);
      fillStroke(ctx, '#ff9ec4', INK, 7);
      // cookie jar
      ctx.beginPath();
      ctx.roundRect(s.x + s.w - 110, s.y - 90, 80, 90, 18);
      fillStroke(ctx, '#e7f7ff', INK, 5);
      ctx.beginPath();
      ctx.roundRect(s.x + s.w - 116, s.y - 104, 92, 22, 10);
      fillStroke(ctx, '#ffd84d', INK, 5);
      break;
    }
    case 'pondBed': {
      ctx.beginPath();
      ctx.rect(s.x, s.y, s.w, s.h);
      fillStroke(ctx, '#ffe0a3', INK, 6);
      ctx.fillStyle = '#f5c57a';
      for (let i = 0; i < s.w / 90; i++) {
        ctx.beginPath();
        ctx.ellipse(s.x + 40 + i * 90, s.y + 26 + rand(i) * 30, 18, 9, 0, 0, TAU);
        ctx.fill();
      }
      break;
    }
    case 'rock': {
      blob(ctx, [
        [s.x + s.w / 2, s.y + 80, s.w * 0.55, 90, 0],
        [s.x + s.w / 2, s.y + s.h / 2, s.w / 2, s.h / 2 - 20, 0],
        [s.x + s.w / 2, s.y + s.h - 70, s.w * 0.58, 80, 0],
      ], '#c7b8e8', 7);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.ellipse(s.x + s.w * 0.35, s.y + 110, 22, 50, 0.2, 0, TAU);
      ctx.fill();
      // little moss & starfish
      clover(ctx, s.x + s.w / 2, s.y + 10, 16, 0.2, '#3fbf5a', 3);
      star(ctx, s.x + s.w * 0.7, s.y + s.h - 120, 22, 10, 5, 0.3);
      fillStroke(ctx, '#ff9ec4', INK, 4);
      break;
    }
    default:
      break; // walls, floor and sofa parts are drawn by the backdrop/decor
  }
}

function flower(ctx, x, y, col) {
  ctx.strokeStyle = '#3fae6a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y + 6);
  ctx.lineTo(x, y - 18);
  ctx.stroke();
  ctx.fillStyle = col;
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * TAU;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 8, y - 22 + Math.sin(a) * 8, 6, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#ffb347';
  ctx.beginPath();
  ctx.arc(x, y - 22, 5, 0, TAU);
  ctx.fill();
}

function cloudPlat(ctx, x, y, w, t) {
  const n = Math.max(3, Math.round(w / 70));
  const shapes = [];
  for (let i = 0; i < n; i++) {
    const cx = x + 30 + ((w - 60) * i) / (n - 1);
    shapes.push([cx, y + 26 + Math.sin(i * 2.1) * 6, 42 + (i % 2) * 10]);
  }
  shapes.push([x + w / 2, y + 50, w * 0.42, 34, 0]);
  blob(ctx, shapes, '#ffffff', 6, 'rgba(58,39,71,0.75)');
  ctx.fillStyle = 'rgba(255,190,220,0.45)';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + 66, w * 0.36, 14, 0, 0, TAU);
  ctx.fill();
}

function drawOneWay(ctx, o, t) {
  switch (o.kind) {
    case 'shelf':
    case 'pansShelf': {
      ctx.beginPath();
      ctx.roundRect(o.x, o.y, o.w, 26, 8);
      fillStroke(ctx, '#e2a66e', INK, 6);
      for (const bx of [o.x + 30, o.x + o.w - 50]) {
        ctx.beginPath();
        ctx.moveTo(bx, o.y + 26);
        ctx.lineTo(bx + 20, o.y + 26);
        ctx.lineTo(bx, o.y + 76);
        ctx.closePath();
        fillStroke(ctx, '#c98a55', INK, 5);
      }
      if (o.kind === 'pansShelf') {
        for (let i = 0; i < 3; i++) {
          const px = o.x + 60 + i * 100;
          ctx.save();
          ctx.translate(px, o.y + 30);
          ctx.rotate(Math.sin(t * 2 + i) * 0.06);
          ctx.strokeStyle = INK;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, 40);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 80, 34, 0, TAU);
          fillStroke(ctx, ['#ff9ec4', '#7fd3ff', '#ffd84d'][i], INK, 5);
          ctx.restore();
        }
      }
      break;
    }
    case 'cloud':
      cloudPlat(ctx, o.x, o.y, o.w, t);
      break;
    case 'planet': {
      ctx.save();
      ctx.translate(o.x + o.w / 2, o.y + o.r * 0.82);
      P.paoDeQueijo(ctx, o.r, t, true);
      ctx.restore();
      break;
    }
    case 'island': {
      // a long pink-and-white cloud island holding the castle
      const n = Math.round(o.w / 90);
      const shapes = [];
      for (let i = 0; i <= n; i++) shapes.push([o.x + (o.w * i) / n, o.y + 40 + Math.sin(i * 1.7) * 10, 70 + (i % 3) * 12]);
      shapes.push([o.x + o.w / 2, o.y + 120, o.w * 0.48, 90, 0]);
      blob(ctx, shapes, '#ffe3f0', 7);
      ctx.beginPath();
      ctx.roundRect(o.x - 20, o.y - 4, o.w + 40, 40, 20);
      fillStroke(ctx, '#ffffff', INK, 6);
      break;
    }
    default:
      break; // table and sofa back are drawn by decor
  }
}

function drawBouncer(ctx, b, t) {
  b.boing = Math.max(0, (b.boing ?? 0) - 0.04);
  const sq = Math.sin(b.boing * 12) * b.boing;
  if (b.kind === 'rug') {
    ctx.save();
    ctx.translate(b.x + b.w / 2, b.y + 10);
    ctx.scale(1 + sq * 0.05, 1 - sq * 0.5);
    ctx.beginPath();
    ctx.ellipse(0, 0, b.w / 2, 26, 0, 0, TAU);
    fillStroke(ctx, '#ff8fb3', INK, 6);
    ctx.beginPath();
    ctx.ellipse(0, 0, b.w / 2 - 34, 14, 0, 0, TAU);
    fillStroke(ctx, '#ffd84d', INK, 4);
    clover(ctx, 0, -2, 14, 0, '#37c45c', 3);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    for (const sx of [-1, 1]) {
      for (let k = -2; k <= 2; k++) {
        ctx.beginPath();
        ctx.moveTo(sx * (b.w / 2 - 4), k * 7);
        ctx.lineTo(sx * (b.w / 2 + 18), k * 9);
        ctx.stroke();
      }
    }
    ctx.restore();
  } else if (b.kind === 'croc') {
    // the friendly zoo croc, floating with a smile
    ctx.save();
    ctx.translate(b.x + b.w / 2, b.y + 100 + Math.sin(t * 2) * 6 + sq * 30);
    ctx.scale(-0.8, 0.8);
    P.croc(ctx, 0.25 + Math.sin(t * 1.5) * 0.03);
    ctx.restore();
  }
}

function drawBuddy(ctx, m, t) {
  const r = 60;
  ctx.save();
  ctx.translate(m.cx, m.y + r + 96 + 12);
  P.skate(ctx, -r * 0.45, 0, r / 85, m.cx * 0.05);
  P.skate(ctx, r * 0.6, 0, r / 85, m.cx * 0.05);
  ctx.translate(0, -r * 1.6);
  ctx.rotate(Math.sin(t * 6) * 0.05);
  P.cabbageBuddy(ctx, r, t, 1);
  ctx.restore();
}

function drawSign(ctx, s) {
  const lines = s.lines;
  const h = 40 + lines.length * 40;
  const w = 230;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.beginPath();
  ctx.rect(-9, -h - 70, 18, h + 70);
  fillStroke(ctx, '#c98a55', INK, 5);
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h - 110, w, h, 20);
  fillStroke(ctx, '#fff7e6', INK, 6);
  ctx.font = `600 32px ${SING}`;
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, 0, -h - 110 + 40 + i * 40));
  ctx.restore();
}

function drawCheckpoint(ctx, c, t) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.beginPath();
  ctx.roundRect(-7, -200, 14, 200, 7);
  fillStroke(ctx, '#ffffff', INK, 5);
  const up = c.anim ?? 0;
  const fy = lerp(-60, -195, up);
  ctx.beginPath();
  ctx.moveTo(6, fy);
  for (let k = 0; k <= 6; k++) ctx.lineTo(6 + k * 14, fy + Math.sin(t * 5 + k * 0.8) * 5 * up);
  for (let k = 6; k >= 0; k--) ctx.lineTo(6 + k * 14, fy + 56 + Math.sin(t * 5 + k * 0.8) * 5 * up);
  ctx.closePath();
  fillStroke(ctx, up > 0.5 ? '#6fdc86' : '#e5dcef', INK, 5);
  clover(ctx, 50, fy + 28, 15, 0, up > 0.5 ? '#ffffff' : '#c9bcd9', 3);
  ctx.beginPath();
  ctx.arc(0, -204, 12, 0, TAU);
  fillStroke(ctx, '#ffd84d', INK, 4);
  ctx.restore();
}

function costumeOpts(kind, t) {
  if (kind === 'rocket') return withRocket(costume('cheese', t), t);
  return costume(kind, t);
}

function drawBubble(ctx, b, t, current) {
  const bob = Math.sin(t * 2.2 + b.x) * 10;
  const worn = current === b.kind;
  ctx.save();
  ctx.translate(b.x, b.y + bob);
  ctx.globalAlpha = worn ? 0.45 : 1;
  const g = ctx.createRadialGradient(-20, -24, 10, 0, 0, 80);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.6, 'rgba(210,240,255,0.45)');
  g.addColorStop(1, 'rgba(255,170,220,0.55)');
  ctx.beginPath();
  ctx.arc(0, 0, 78, 0, TAU);
  fillStroke(ctx, g, 'rgba(58,39,71,0.5)', 4);
  // mini Brie wearing the costume
  ctx.save();
  ctx.translate(-4, 48);
  ctx.scale(0.27, 0.27);
  drawBrieSide(ctx, { phase: null, eyes: 'happy', mouth: 0.6, wag: t * 10, lw: 7, ...costumeOpts(b.kind, t) });
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, 62, -2.4, -1.7);
  ctx.stroke();
  ctx.restore();
  if (!worn) {
    for (let i = 0; i < 4; i++) {
      const a = t * 1.5 + (i / 4) * TAU;
      ctx.save();
      ctx.translate(b.x + Math.cos(a) * 100, b.y + bob + Math.sin(a) * 100);
      star(ctx, 0, 0, 12, 5, 4, a);
      ctx.fillStyle = '#fff6a8';
      ctx.fill();
      ctx.restore();
    }
  }
}

export function drawWaterFront(ctx, camX, t) {
  for (const w of LEVEL.water) {
    if (!inView(w.x, w.x + w.w, camX)) continue;
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = '#5fb8ff';
    ctx.fillRect(w.x, w.y + 8, w.w, w.h - 8);
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(w.x, w.y);
    for (let x = w.x; x <= w.x + w.w; x += 30) ctx.lineTo(x, w.y + Math.sin(x / 60 + t * 3) * 6);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 18; i++) {
      const sx = w.x + 80 + i * (w.w / 18) + Math.sin(t + i) * 20;
      const sy = w.y + 60 + rand(i) * (w.h - 140);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 50, sy);
      ctx.stroke();
    }
  }
}

/* ---------------- collectibles ---------------- */
export function drawCollectibles(ctx, camX, t) {
  for (const c of LEVEL.clovers) {
    if (c.got && c.gotT > 0.4) continue;
    if (c.x < camX - 100 || c.x > camX + W + 100) continue;
    const a = c.got ? 1 - c.gotT / 0.4 : 1;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(c.x, c.y + Math.sin(t * 3 + c.x * 0.01) * 6 - (c.got ? c.gotT * 160 : 0));
    ctx.scale(Math.cos(t * 2 + c.x * 0.003) * 0.35 + 0.85, 1);
    clover(ctx, 0, 0, 27 * (c.got ? 1 + c.gotT : 1), 0, '#3fdc66', 4);
    ctx.restore();
  }
  for (const c of LEVEL.treats) {
    if (c.got && c.gotT > 0.5) continue;
    if (c.x < camX - 100 || c.x > camX + W + 100) continue;
    ctx.save();
    ctx.globalAlpha = c.got ? 1 - c.gotT / 0.5 : 1;
    ctx.translate(c.x, c.y + Math.sin(t * 2.4 + c.x) * 8 - (c.got ? c.gotT * 200 : 0));
    ctx.rotate(Math.sin(t * 1.7 + c.x) * 0.15);
    P.paoDeQueijo(ctx, 30, t);
    ctx.restore();
    if (!c.got) {
      ctx.save();
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 5 + c.x);
      star(ctx, c.x + 30, c.y - 30, 10, 4, 4, t);
      ctx.fillStyle = '#fff6a8';
      ctx.fill();
      ctx.restore();
    }
  }
  for (const f of LEVEL.friends) {
    if (f.got) continue;
    if (f.x < camX - 150 || f.x > camX + W + 150) continue;
    drawFriend(ctx, f.kind, f.x, f.y, t);
  }
}

export function drawFriend(ctx, kind, x, y, t, r = 38) {
  const hop = Math.abs(Math.sin(t * 3 + x)) * 14;
  ctx.save();
  if (kind === 'ufo') {
    ctx.translate(x, y - 70 - Math.sin(t * 2) * 12);
    ctx.rotate(Math.sin(t * 1.3) * 0.12);
    P.ufoToy(ctx, r * 1.25);
  } else {
    ctx.translate(x, y - r * 1.15 - hop);
    P.plushToy(ctx, kind, r);
  }
  ctx.restore();
}
