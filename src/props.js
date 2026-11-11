// Backgrounds, sets and side characters.
import { TAU, INK, blob, dblob, fillStroke, clover, rand, rrange, lerp, star, heart, clamp, DETAIL, shadeBlob, drawScale, lightDir, mixHex, shadeOf } from './util.js';
import { W, H } from './fx.js';
import { grain, grainV, knot, motif, tuft, pool, vgrad, hgrad, sheen, shaft, flame } from './toon/paint.js';

/* ---------------- outdoor ---------------- */
export function clouds(ctx, t, camX = 0, speed = 0.15, y0 = 120, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < 7; i++) {
    const span = W + 700;
    let x = (rand(i) * span - camX * speed - t * 12) % span;
    if (x < -350) x += span;
    const y = y0 + rand(i + 4) * 260;
    const s = rrange(i + 2, 0.7, 1.4);
    const cl = [[x, y, 70 * s], [x + 70 * s, y + 10, 55 * s], [x - 70 * s, y + 14, 50 * s], [x + 20 * s, y - 34 * s, 55 * s]];
    if (DETAIL.on) cl.push([x - 30 * s, y - 22 * s, 40 * s], [x + 112 * s, y + 22, 30 * s], [x - 112 * s, y + 24, 28 * s]);
    blob(ctx, cl, '#ffffff', 5, 'rgba(58,39,71,0.35)');
    if (DETAIL.on) {
      shadeBlob(ctx, cl, '#ffffff', '#dfe3fa', 20 * s);
      ctx.strokeStyle = 'rgba(150,160,220,0.5)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (const [cx, cy, r] of [[x - 14 * s, y + 4, 30 * s], [x + 60 * s, y + 16, 24 * s]]) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0.5, 2.3);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

export function hills(ctx, camX, y, amp, color, speed, seed = 0, deco = false) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-50, H + 50);
  const off = camX * speed;
  for (let x = -50; x <= W + 50; x += 20) {
    const wx = x + off;
    const yy = y - amp * (0.6 * Math.sin(wx / 410 + seed) + 0.4 * Math.sin(wx / 170 + seed * 2));
    ctx.lineTo(x, yy);
  }
  ctx.lineTo(W + 50, H + 50);
  ctx.closePath();
  fillStroke(ctx, color, INK, 5);
  const ridge = (wx) => y - amp * (0.6 * Math.sin(wx / 410 + seed) + 0.4 * Math.sin(wx / 170 + seed * 2));
  if (DETAIL.on) {
    // darker toward the foot, a lit band under the ridge line, tufts of grass along it
    ctx.save();
    ctx.clip();
    vgrad(ctx, -50, y - amp, W + 100, 460, 'rgba(30,90,110,0)', 'rgba(30,90,110,0.26)');
    ctx.strokeStyle = 'rgba(255,255,220,0.3)';
    ctx.lineWidth = 9;
    ctx.beginPath();
    for (let x = -50; x <= W + 50; x += 20) ctx.lineTo(x, ridge(x + off) + 9);
    ctx.stroke();
    const dark = shadeOf(color, 0.3);
    const step = deco ? 58 : 84;
    for (let wx = Math.floor((off - 60) / step) * step; wx < off + W + 60; wx += step) {
      const i = Math.round(wx / step);
      const px = wx - off + (rand(i + seed * 13) - 0.5) * 30;
      tuft(ctx, px, ridge(px + off) + 14 + rand(i * 5 + seed) * (deco ? 220 : 60), (deco ? 16 : 11) + rand(i * 3 + seed) * 8, dark, rand(i * 7) - 0.5, deco ? 3 : 2.5);
    }
    ctx.restore();
  }
  if (deco) {
    // little clovers and flowers on the hill
    for (let i = 0; i < 40; i++) {
      const span = W + 200;
      let x = (i * 97 + rand(i + seed) * 60 - off) % span;
      if (x < -100) x += span;
      const wx = x + off;
      const yy = y - amp * (0.6 * Math.sin(wx / 410 + seed) + 0.4 * Math.sin(wx / 170 + seed * 2)) + 40 + rand(i * 3) * 160;
      if (i % 3 === 0) clover(ctx, x, yy, 16, rand(i) - 0.5, '#5fd77a', 3);
      else if (DETAIL.on) {
        // a real little flower: stem, petals, centre
        ctx.strokeStyle = '#3f9a52';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.quadraticCurveTo(x + 4, yy + 10, x + 1, yy + 20);
        ctx.stroke();
        ctx.fillStyle = ['#fff', '#ffd84d', '#ff9ec4'][i % 3];
        ctx.beginPath();
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * TAU + i;
          ctx.moveTo(x + Math.cos(a) * 5 + 4.5, yy + Math.sin(a) * 5);
          ctx.arc(x + Math.cos(a) * 5, yy + Math.sin(a) * 5, 4.5, 0, TAU);
        }
        ctx.fill();
        ctx.fillStyle = i % 3 === 1 ? '#ff9a3c' : '#ffcf4a';
        ctx.beginPath();
        ctx.arc(x, yy, 3, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = ['#fff', '#ffd84d', '#ff9ec4'][i % 3];
        ctx.beginPath();
        ctx.arc(x, yy, 6, 0, TAU);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

export function castle(ctx, x, y, s, o = {}) {
  const t = o.t ?? 0;
  const night = o.night;
  const wall = night ? '#5b4b8a' : '#f4e3ff';
  const roof = night ? '#3b2a6b' : '#7b5cff';
  const win = o.glow ? `rgba(255,220,120,${0.6 + 0.4 * o.glow})` : night ? '#ffd877' : '#7fd3ff';
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const tower = (tx, w, h) => {
    ctx.beginPath();
    ctx.rect(tx - w / 2, -h, w, h);
    fillStroke(ctx, wall, INK, 6);
    if (DETAIL.on) {
      hgrad(ctx, tx, -h + 3, w / 2 - 3, h - 3, 'rgba(70,40,120,0)', 'rgba(70,40,120,0.2)');
      stones(tx - w / 2 + 8, -h + 110, w - 16, h - 120, tx);
    }
    // crenels
    ctx.beginPath();
    ctx.moveTo(tx - w / 2 - 14, -h);
    ctx.lineTo(tx, -h - w * 0.95);
    ctx.lineTo(tx + w / 2 + 14, -h);
    ctx.closePath();
    fillStroke(ctx, roof, INK, 6);
    if (DETAIL.on) {
      // shingles
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(30,10,70,0.3)';
      ctx.lineWidth = 3;
      for (let r = 0; r < 5; r++) {
        const yy = -h - r * w * 0.19 - 4;
        for (let k = -4; k <= 4; k++) {
          ctx.beginPath();
          ctx.arc(tx + (k + (r % 2) * 0.5) * 26, yy - 20, 14, 0.2, Math.PI - 0.2);
          ctx.stroke();
        }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.beginPath();
      ctx.moveTo(tx - w / 2 - 14, -h);
      ctx.lineTo(tx, -h - w * 0.95);
      ctx.lineTo(tx - w * 0.12, -h);
      ctx.fill();
      ctx.restore();
    }
    // flag
    const fy = -h - w * 0.95;
    ctx.beginPath();
    ctx.moveTo(tx, fy);
    ctx.lineTo(tx, fy - 70);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tx, fy - 70);
    for (let k = 0; k <= 6; k++) ctx.lineTo(tx + k * 12, fy - 70 + Math.sin(t * 6 + k * 0.8 + tx) * 5 + k * 0.5);
    for (let k = 6; k >= 0; k--) ctx.lineTo(tx + k * 12, fy - 36 + Math.sin(t * 6 + k * 0.8 + tx) * 5 - k * 0.5);
    ctx.closePath();
    fillStroke(ctx, '#37c45c', INK, 4);
    // windows
    if (DETAIL.on && (night || o.glow)) pool(ctx, tx, -h + 62, 70, 70, '255,214,120', 0.42);
    ctx.beginPath();
    ctx.roundRect(tx - 14, -h + 40, 28, 46, [14, 14, 0, 0]);
    fillStroke(ctx, win, INK, 4);
    if (DETAIL.on) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tx, -h + 42);
      ctx.lineTo(tx, -h + 86);
      ctx.moveTo(tx - 14, -h + 64);
      ctx.lineTo(tx + 14, -h + 64);
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(tx - 20, -h + 86, 40, 7);
      fillStroke(ctx, wall, INK, 3);
    }
  };
  // scattered stone blocks, so the walls read as masonry
  const stones = (x0, y0, w, h, sd) => {
    ctx.strokeStyle = night ? 'rgba(20,10,60,0.4)' : 'rgba(120,80,170,0.4)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    const n = Math.round((w * h) / 9000);
    for (let i = 0; i < n; i++) {
      const bx = x0 + rand(sd + i * 3) * (w - 44), by = y0 + Math.floor(rand(sd + i * 5 + 1) * (h / 30)) * 30;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + 40, by);
      ctx.moveTo(bx + (i % 2 ? 0 : 40), by);
      ctx.lineTo(bx + (i % 2 ? 0 : 40), by + 22);
      ctx.stroke();
    }
  };
  tower(-260, 120, 420);
  tower(260, 120, 420);
  tower(0, 160, 560);
  // main wall
  ctx.beginPath();
  ctx.rect(-260, -300, 520, 300);
  fillStroke(ctx, wall, INK, 6);
  if (DETAIL.on) {
    vgrad(ctx, -257, -297, 514, 60, 'rgba(70,40,120,0.2)', 'rgba(70,40,120,0)');
    vgrad(ctx, -257, -70, 514, 67, 'rgba(70,40,120,0)', 'rgba(70,40,120,0.16)');
    stones(-250, -280, 500, 270, 77);
  }
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.rect(-250 + i * 76, -330, 44, 32);
    fillStroke(ctx, wall, INK, 5);
  }
  // gate
  ctx.beginPath();
  ctx.moveTo(-90, 0);
  ctx.lineTo(-90, -150);
  ctx.arc(0, -150, 90, Math.PI, 0);
  ctx.lineTo(90, 0);
  ctx.closePath();
  const open = clamp(o.gateOpen ?? 0);
  if (open > 0) {
    const g = ctx.createRadialGradient(0, -100, 10, 0, -100, 220);
    g.addColorStop(0, '#fffbe0');
    g.addColorStop(1, '#ffd36b');
    fillStroke(ctx, g, INK, 6);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(-90, -240, 90 * (1 - open), 240);
    ctx.fillRect(90 - 90 * (1 - open), -240, 90 * (1 - open), 240);
    ctx.restore();
  } else {
    fillStroke(ctx, '#8a5a2b', INK, 6);
    ctx.strokeStyle = 'rgba(58,39,71,0.5)';
    ctx.lineWidth = 4;
    for (let i = -60; i <= 60; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, -220);
      ctx.stroke();
    }
  }
  clover(ctx, 0, -270, 50, 0, '#37c45c', 5);
  ctx.restore();
}

export function moon(ctx, x, y, r) {
  ctx.save();
  ctx.shadowColor = '#fff6c8';
  ctx.shadowBlur = 80;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  fillStroke(ctx, '#fff6d6', INK, 5);
  ctx.restore();
  if (DETAIL.on) {
    // shaded limb and a wide soft halo
    pool(ctx, x, y, r * 3.2, r * 3.2, '255,246,200', 0.2);
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r - 2, 0, TAU);
    ctx.clip();
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.2, x, y, r * 1.1);
    g.addColorStop(0, 'rgba(255,255,255,0.5)');
    g.addColorStop(0.6, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(190,160,120,0.45)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(220,200,150,0.5)';
  for (const [dx, dy, rr] of [[-0.3, -0.2, 0.18], [0.25, 0.2, 0.13], [0.1, -0.35, 0.09]].concat(DETAIL.on ? [[-0.5, 0.35, 0.08], [0.5, -0.15, 0.07], [-0.05, 0.5, 0.1], [0.42, 0.52, 0.05]] : [])) {
    ctx.beginPath();
    ctx.arc(x + dx * r, y + dy * r, rr * r, 0, TAU);
    ctx.fill();
    if (DETAIL.on) {
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = Math.max(1.5, r * 0.02);
      ctx.beginPath();
      ctx.arc(x + dx * r, y + dy * r, rr * r, 0.3, 2.2);
      ctx.stroke();
    }
  }
}

export function sun(ctx, x, y, r, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t * 0.2);
  star(ctx, 0, 0, r * 1.5, r * 1.1, 14, 0);
  fillStroke(ctx, '#ffe066', INK, 5);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  fillStroke(ctx, '#ffcd3c', INK, 5);
  ctx.restore();
  if (DETAIL.on) {
    pool(ctx, x, y, r * 3.4, r * 3.4, '255,240,170', 0.3);
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r - 3, 0, TAU);
    ctx.clip();
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.05);
    g.addColorStop(0, 'rgba(255,255,220,0.75)');
    g.addColorStop(0.55, 'rgba(255,240,150,0)');
    g.addColorStop(1, 'rgba(255,130,40,0.4)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }
}

/* ---------------- house interiors ---------------- */
const THEMES = {
  living: { wall: '#ffd9e6', stripe: '#ffcadb', floor: '#e6ad74', plank: '#c98a55', base: '#fff' },
  kitchen: { wall: '#d4f0ff', stripe: '#c2e8ff', floor: '#fff', plank: '#ffd84d', base: '#fff' },
  hall: { wall: '#fff0c9', stripe: '#ffe6a8', floor: '#d39661', plank: '#b07444', base: '#fff' },
  bedroom: { wall: '#d9d4ff', stripe: '#cbc4ff', floor: '#e6ad74', plank: '#c98a55', base: '#fff' },
};
export const FLOOR_Y = 800;

export function roomStrip(ctx, camX, theme = 'living', items = true, t = 0) {
  const th = THEMES[theme];
  ctx.fillStyle = th.wall;
  ctx.fillRect(-200, -200, W + 400, FLOOR_Y + 200);
  // wallpaper
  ctx.fillStyle = th.stripe;
  const sw = 90;
  let sx = -((camX * 1) % (sw * 2));
  for (let x = sx - sw * 2; x < W + sw * 2; x += sw * 2) ctx.fillRect(x, -200, sw, FLOOR_Y + 200);
  if (DETAIL.on) {
    // a printed motif down every stripe, a pinstripe at the seams
    const kind = { living: 'clover', kitchen: 'diamond', hall: 'star', bedroom: 'star' }[theme];
    const deep = shadeOf(th.stripe, 0.2), pale = mixHex(th.wall, '#ffffff', 0.62);
    const i0 = Math.floor(camX / sw);
    for (let i = i0 - 2; i < i0 + W / sw + 3; i++) {
      const x = i * sw + sw / 2 - camX, even = ((i % 2) + 2) % 2 === 0;
      for (let y = -140 + (even ? 0 : 80); y < FLOOR_Y - 60; y += 160) {
        const k = theme === 'bedroom' && (i + Math.round(y / 80)) % 3 === 0 ? 'moon' : kind;
        motif(ctx, k, x, y, k === 'clover' ? 14 : 13, even ? deep : pale);
      }
      ctx.fillStyle = even ? pale : deep;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(x - sw / 2 - 1.5, -200, 3, FLOOR_Y + 200);
      ctx.globalAlpha = 1;
    }
    // the wall falls into shade under the ceiling and down by the skirting
    vgrad(ctx, -200, -200, W + 400, 420, 'rgba(90,50,130,0.2)', 'rgba(90,50,130,0)');
    vgrad(ctx, -200, FLOOR_Y - 300, W + 400, 300, 'rgba(90,50,130,0)', 'rgba(90,50,130,0.13)');
  }
  if (theme === 'kitchen') {
    // tiles on lower wall
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-200, 470, W + 400, FLOOR_Y - 470);
    ctx.strokeStyle = '#bfe3f5';
    ctx.lineWidth = 3;
    const ts = 60;
    for (let y = 470; y < FLOOR_Y; y += ts) {
      ctx.beginPath();
      ctx.moveTo(-200, y);
      ctx.lineTo(W + 200, y);
      ctx.stroke();
    }
    if (DETAIL.on) {
      // a few coloured tiles and a glazed shine on each
      const c0 = Math.floor(camX / ts);
      for (let c = c0 - 1; c < c0 + W / ts + 2; c++) {
        for (let r = 0; r < 6; r++) {
          const x = c * ts - camX, y = 470 + r * ts, h = rand(c * 13 + r * 71);
          if (h < 0.16) {
            ctx.fillStyle = h < 0.06 ? '#ffe9a6' : h < 0.11 ? '#cdeeff' : '#ffd6e6';
            ctx.fillRect(x, y, ts, Math.min(ts, FLOOR_Y - y));
          }
          ctx.fillStyle = 'rgba(255,255,255,0.75)';
          ctx.fillRect(x + 8, y + 8, 14, 4);
          ctx.fillRect(x + 8, y + 8, 4, 12);
        }
      }
      vgrad(ctx, -200, 470, W + 400, 70, 'rgba(60,110,160,0.16)', 'rgba(60,110,160,0)');
      // a border row of little diamonds along the top of the tiles
      ctx.fillStyle = '#8fd0f0';
      ctx.fillRect(-200, 462, W + 400, 10);
    }
    for (let x = -((camX) % ts) - ts; x < W + ts; x += ts) {
      ctx.beginPath();
      ctx.moveTo(x, 470);
      ctx.lineTo(x, FLOOR_Y);
      ctx.stroke();
    }
  }
  // floor
  ctx.fillStyle = th.floor;
  ctx.fillRect(-200, FLOOR_Y, W + 400, H - FLOOR_Y + 200);
  if (theme === 'kitchen') {
    const ts = 110;
    for (let r = 0; r < 4; r++) {
      for (let x = -((camX * 1.2) % (ts * 2)) - ts * 2 + (r % 2) * ts; x < W + ts; x += ts * 2) {
        ctx.fillStyle = th.plank;
        ctx.fillRect(x, FLOOR_Y + r * 75, ts, 75);
        if (DETAIL.on) {
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.fillRect(x + 10, FLOOR_Y + r * 75 + 8, 34, 6);
          ctx.fillStyle = 'rgba(200,140,20,0.22)';
          ctx.fillRect(x, FLOOR_Y + r * 75 + 66, ts, 9);
          ctx.fillStyle = 'rgba(120,150,190,0.16)';
          ctx.fillRect(x + ts, FLOOR_Y + r * 75 + 66, ts, 9);
        }
      }
    }
  } else {
    if (DETAIL.on) {
      // every plank its own tone, with grain and the odd knot
      const dark = shadeOf(th.plank, 0.12);
      for (let r = 0; r < 5; r++) {
        const y = Math.max(FLOOR_Y, FLOOR_Y - 30 + r * 60), o2 = camX * 1.2 + r * 170;
        for (let k = Math.floor(o2 / 340) - 1; k * 340 - o2 < W + 340; k++) {
          const x = k * 340 - o2, h = rand(k * 17 + r * 91);
          ctx.fillStyle = h < 0.5 ? `rgba(255,236,200,${0.1 + h * 0.3})` : `rgba(120,60,30,${(h - 0.5) * 0.3})`;
          ctx.fillRect(x, y, 340, FLOOR_Y + 30 + r * 60 - y);
          ctx.globalAlpha = 0.55;
          grain(ctx, x + 12, y + 6, 316, FLOOR_Y + 22 + r * 60 - y, dark, r ? 3 : 2, k * 31 + r * 7, 2.2);
          if (h > 0.72 && r) knot(ctx, x + 60 + rand(k + r * 5) * 220, y + 30, 7, dark);
          ctx.globalAlpha = 1;
        }
      }
    }
    ctx.strokeStyle = th.plank;
    ctx.lineWidth = 4;
    for (let r = 0; r < 5; r++) {
      const y = FLOOR_Y + 30 + r * 60;
      ctx.beginPath();
      ctx.moveTo(-200, y);
      ctx.lineTo(W + 200, y);
      ctx.stroke();
      for (let x = -((camX * 1.2 + r * 170) % 340) - 340; x < W + 340; x += 340) {
        ctx.beginPath();
        ctx.moveTo(x, y - 60);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  }
  if (theme === 'hall') {
    // runner rug
    ctx.fillStyle = '#e8505b';
    ctx.fillRect(-200, FLOOR_Y + 70, W + 400, 140);
    ctx.fillStyle = '#ffd84d';
    ctx.fillRect(-200, FLOOR_Y + 84, W + 400, 10);
    ctx.fillRect(-200, FLOOR_Y + 186, W + 400, 10);
    if (DETAIL.on) {
      // woven diamonds down the middle of the runner, darker selvedge
      const o2 = camX * 1.2;
      for (let k = Math.floor(o2 / 150) - 1; k * 150 - o2 < W + 150; k++) {
        const x = k * 150 - o2;
        motif(ctx, 'diamond', x + 75, FLOOR_Y + 140, 26, '#c93a4b');
        motif(ctx, 'diamond', x + 75, FLOOR_Y + 140, 13, '#ffd84d');
        motif(ctx, 'dot', x, FLOOR_Y + 140, 6, '#ffb0a8');
      }
      ctx.fillStyle = 'rgba(120,20,50,0.28)';
      ctx.fillRect(-200, FLOOR_Y + 70, W + 400, 8);
      ctx.fillRect(-200, FLOOR_Y + 202, W + 400, 8);
    }
  }
  if (DETAIL.on) {
    // contact shade under the skirting, and the floor darkening toward the lens
    vgrad(ctx, -200, FLOOR_Y, W + 400, 46, 'rgba(70,30,60,0.22)', 'rgba(70,30,60,0)');
    vgrad(ctx, -200, FLOOR_Y + 90, W + 400, H - FLOOR_Y + 110, 'rgba(70,30,60,0)', 'rgba(70,30,60,0.2)');
  }
  // baseboard
  ctx.fillStyle = th.base;
  ctx.fillRect(-200, FLOOR_Y - 26, W + 400, 26);
  if (DETAIL.on) {
    ctx.fillStyle = 'rgba(120,90,170,0.2)';
    ctx.fillRect(-200, FLOOR_Y - 11, W + 400, 11);
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-200, FLOOR_Y - 26);
  ctx.lineTo(W + 200, FLOOR_Y - 26);
  ctx.moveTo(-200, FLOOR_Y);
  ctx.lineTo(W + 200, FLOOR_Y);
  ctx.stroke();

  if (!items) return;
  const PERIOD = 2600;
  const LIST = {
    living: [[200, 'window'], [760, 'sofa'], [1350, 'lamp'], [1650, 'frame'], [2050, 'plant'], [2350, 'shelf']],
    kitchen: [[150, 'fridge'], [620, 'window'], [1150, 'stove'], [1650, 'cabinet'], [2150, 'pans']],
    hall: [[250, 'door'], [800, 'frame'], [1150, 'door'], [1700, 'frame2'], [2100, 'door']],
    bedroom: [[300, 'window'], [1300, 'frame'], [2000, 'lamp']],
  }[theme];
  const base = Math.floor((camX - 600) / PERIOD);
  for (let k = base; k <= base + 2; k++) {
    for (const [ox, type] of LIST) {
      const x = k * PERIOD + ox - camX;
      if (x < -700 || x > W + 400) continue;
      furniture(ctx, type, x, FLOOR_Y, t);
    }
  }
}

export function furniture(ctx, type, x, fy, t = 0) {
  ctx.save();
  ctx.translate(x, fy);
  switch (type) {
    case 'window': {
      ctx.beginPath();
      ctx.roundRect(0, -620, 360, 300, 16);
      const g = ctx.createLinearGradient(0, -620, 0, -320);
      g.addColorStop(0, '#7fd3ff');
      g.addColorStop(1, '#c9f0ff');
      if (DETAIL.on) {
        // daylight spilling onto the wall around the window and across the floor
        pool(ctx, 180, -470, 460, 380, '255,250,215', 0.3);
        pool(ctx, 330, 120, 420, 90, '255,246,200', 0.34);
      }
      fillStroke(ctx, g, INK, 8);
      blob(ctx, [[110, -520, 30], [150, -515, 26], [80, -512, 22]], '#fff', 0);
      if (DETAIL.on) {
        blob(ctx, [[262, -396, 22], [292, -392, 18], [240, -390, 16]], '#fff', 0);
        // far hills through the glass, then the shine on the panes
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(4, -616, 352, 292, 12);
        ctx.clip();
        ctx.fillStyle = '#a9e6a0';
        ctx.beginPath();
        ctx.ellipse(90, -300, 190, 60, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#86d68a';
        ctx.beginPath();
        ctx.ellipse(300, -296, 170, 48, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
        sheen(ctx, 4, -616, 352, 292, 0.3);
      }
      ctx.strokeStyle = INK;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(180, -620);
      ctx.lineTo(180, -320);
      ctx.moveTo(0, -470);
      ctx.lineTo(360, -470);
      ctx.stroke();
      for (const sx of [-30, 330]) {
        ctx.beginPath();
        ctx.moveTo(sx, -650);
        ctx.quadraticCurveTo(sx + 40, -470, sx + 10, -300);
        ctx.lineTo(sx + 60, -300);
        ctx.quadraticCurveTo(sx + 80, -470, sx + 60, -650);
        ctx.closePath();
        fillStroke(ctx, '#ff8fb3', INK, 5);
        if (DETAIL.on) {
          // folds, a lit edge and a tie-back; the hem sways a touch
          const sway = Math.sin(t * 1.4 + sx) * 3;
          ctx.lineCap = 'round';
          ctx.strokeStyle = '#e06a95';
          ctx.lineWidth = 3.5;
          for (const k of [0.3, 0.62]) {
            ctx.beginPath();
            ctx.moveTo(sx + 60 * k, -640);
            ctx.quadraticCurveTo(sx + 40 + 36 * k, -470, sx + 10 + 50 * k + sway, -312);
            ctx.stroke();
          }
          ctx.strokeStyle = 'rgba(255,255,255,0.55)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(sx + 9, -636);
          ctx.quadraticCurveTo(sx + 46, -470, sx + 18 + sway, -316);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(sx + 46, -452, 26, 8, 0.1, 0, TAU);
          fillStroke(ctx, '#ffd84d', INK, 3.5);
        }
      }
      if (DETAIL.on) {
        // curtain rod and a sill with a little pot of clover
        ctx.beginPath();
        ctx.roundRect(-52, -664, 464, 14, 7);
        fillStroke(ctx, '#b77a3d', INK, 4);
        for (const kx of [-52, 412]) {
          ctx.beginPath();
          ctx.arc(kx, -657, 13, 0, TAU);
          fillStroke(ctx, '#ffd84d', INK, 4);
        }
        ctx.beginPath();
        ctx.roundRect(-14, -322, 388, 22, 6);
        fillStroke(ctx, '#ffffff', INK, 5);
        ctx.fillStyle = 'rgba(120,90,170,0.22)';
        ctx.fillRect(-10, -310, 380, 8);
        ctx.beginPath();
        ctx.moveTo(236, -322);
        ctx.lineTo(292, -322);
        ctx.lineTo(284, -364);
        ctx.lineTo(244, -364);
        ctx.closePath();
        fillStroke(ctx, '#ff8c42', INK, 4);
        clover(ctx, 252, -384, 13, -0.3 + Math.sin(t * 1.6) * 0.06, '#43c26a', 3);
        clover(ctx, 276, -392, 15, 0.3 + Math.sin(t * 1.6 + 1) * 0.06, '#5fd77a', 3);
        // a sunbeam with dust drifting in it
        shaft(ctx, 30, -300, 300, 430, 0.5, 0.15, t, x * 0.01);
      }
      break;
    }
    case 'sofa': {
      ctx.beginPath();
      ctx.roundRect(0, -330, 520, 200, 40);
      fillStroke(ctx, '#7a8cff', INK, 7);
      ctx.beginPath();
      ctx.roundRect(-20, -190, 560, 150, 30);
      fillStroke(ctx, '#8d9dff', INK, 7);
      for (const ax of [-40, 480]) {
        ctx.beginPath();
        ctx.roundRect(ax, -240, 80, 200, 36);
        fillStroke(ctx, '#7a8cff', INK, 7);
      }
      ctx.beginPath();
      ctx.roundRect(60, -260, 140, 110, 30);
      fillStroke(ctx, '#ffd84d', INK, 6);
      ctx.beginPath();
      ctx.roundRect(320, -260, 140, 110, 30);
      fillStroke(ctx, '#ff9ec4', INK, 6);
      for (const lx of [20, 480]) {
        ctx.beginPath();
        ctx.rect(lx, -40, 20, 40);
        fillStroke(ctx, '#8a5a2b', INK, 5);
      }
      if (DETAIL.on) {
        pool(ctx, 260, 4, 330, 26, '60,30,80', 0.3);
        // seat seam, stitching, button tufts, patterned cushions, shade under the back
        vgrad(ctx, 46, -196, 428, 34, 'rgba(50,40,140,0.3)', 'rgba(50,40,140,0)');
        ctx.strokeStyle = INK;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(260, -186);
        ctx.lineTo(260, -44);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(52, -62);
        ctx.lineTo(468, -62);
        ctx.moveTo(60, -306);
        ctx.lineTo(460, -306);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#5c6de0';
        for (const bx of [130, 260, 390]) {
          ctx.beginPath();
          ctx.arc(bx, -292, 6, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = '#f2b93a';
        for (let i = 0; i < 9; i++) {
          ctx.beginPath();
          ctx.arc(86 + (i % 3) * 44, -236 + Math.floor(i / 3) * 30, 7, 0, TAU);
          ctx.fill();
        }
        ctx.strokeStyle = '#ff6fa5';
        ctx.lineWidth = 7;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(336, -236 + i * 30);
          ctx.lineTo(444, -236 + i * 30);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        for (const ax of [-28, 492]) {
          ctx.beginPath();
          ctx.ellipse(ax + 28, -220, 22, 9, 0, 0, TAU);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.ellipse(150, -166, 80, 8, 0, 0, TAU);
        ctx.ellipse(376, -166, 80, 8, 0, 0, TAU);
        ctx.fill();
      }
      break;
    }
    case 'table': {
      ctx.beginPath();
      ctx.roundRect(0, -300, 520, 40, 10);
      fillStroke(ctx, '#c98a45', INK, 7);
      ctx.beginPath();
      ctx.moveTo(-10, -270);
      ctx.lineTo(530, -270);
      ctx.lineTo(500, -170);
      ctx.lineTo(20, -170);
      ctx.closePath();
      fillStroke(ctx, '#ffffff', INK, 6);
      ctx.fillStyle = '#ff9ec4';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(40 + i * 88, -220, 12, 0, TAU);
        ctx.fill();
      }
      for (const lx of [30, 470]) {
        ctx.beginPath();
        ctx.rect(lx, -170, 26, 170);
        fillStroke(ctx, '#c98a45', INK, 6);
        if (DETAIL.on) grainV(ctx, lx + 4, -160, 18, 150, '#a86c34', 2, lx, 2);
      }
      if (DETAIL.on) {
        grain(ctx, 12, -294, 496, 28, '#a86c34', 2, 5, 2);
        // scalloped cloth hem and fold lines
        ctx.strokeStyle = 'rgba(160,140,200,0.55)';
        ctx.lineWidth = 3;
        for (const fx2 of [140, 270, 400]) {
          ctx.beginPath();
          ctx.moveTo(fx2, -266);
          ctx.lineTo(fx2 - (fx2 - 260) * 0.08, -176);
          ctx.stroke();
        }
        pool(ctx, 260, 4, 300, 22, '60,30,80', 0.26);
      }
      break;
    }
    case 'lamp': {
      ctx.beginPath();
      ctx.rect(56, -520, 12, 500);
      fillStroke(ctx, '#3a2747', INK, 3);
      ctx.beginPath();
      ctx.ellipse(62, -14, 60, 16, 0, 0, TAU);
      fillStroke(ctx, '#5a4a7a', INK, 5);
      ctx.beginPath();
      ctx.moveTo(0, -520);
      ctx.lineTo(124, -520);
      ctx.lineTo(100, -640);
      ctx.lineTo(24, -640);
      ctx.closePath();
      if (DETAIL.on) {
        // the lamp is on: a warm bloom, and a cone of light falling to the floor
        pool(ctx, 62, -560, 300, 300, '255,232,150', 0.4);
        ctx.save();
        const lg = ctx.createLinearGradient(0, -520, 0, 0);
        lg.addColorStop(0, 'rgba(255,236,160,0.3)');
        lg.addColorStop(1, 'rgba(255,236,160,0)');
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.moveTo(4, -520);
        ctx.lineTo(120, -520);
        ctx.lineTo(300, 0);
        ctx.lineTo(-176, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        pool(ctx, 62, 10, 250, 40, '255,236,160', 0.3);
        ctx.beginPath();
        ctx.moveTo(0, -520);
        ctx.lineTo(124, -520);
        ctx.lineTo(100, -640);
        ctx.lineTo(24, -640);
        ctx.closePath();
      }
      fillStroke(ctx, '#ffe58a', INK, 6);
      if (DETAIL.on) {
        ctx.save();
        ctx.clip();
        hgrad(ctx, 0, -640, 124, 120, 'rgba(255,255,255,0.5)', 'rgba(255,170,60,0.3)');
        ctx.fillStyle = '#ffb74a';
        ctx.fillRect(0, -536, 124, 10);
        ctx.fillRect(0, -640, 124, 8);
        ctx.restore();
        // pull chain and a shine on the stand
        ctx.strokeStyle = INK;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(88, -520);
        ctx.lineTo(88 + Math.sin(t * 2) * 3, -476);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(88 + Math.sin(t * 2) * 3, -472, 5, 0, TAU);
        fillStroke(ctx, '#ffd84d', INK, 2.5);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(58, -510, 3, 470);
      }
      break;
    }
    case 'frame':
    case 'frame2': {
      ctx.beginPath();
      ctx.rect(0, -620, 220, 180);
      fillStroke(ctx, '#ffd84d', INK, 7);
      ctx.beginPath();
      ctx.rect(20, -600, 180, 140);
      fillStroke(ctx, type === 'frame' ? '#c9f6d3' : '#ffe0ec', INK, 4);
      if (type === 'frame') clover(ctx, 110, -540, 34, 0.2, '#37c45c', 4);
      else {
        heart(ctx, 110, -525, 40);
        fillStroke(ctx, '#ff7da5', INK, 4);
      }
      if (DETAIL.on) {
        // carved frame, the cord it hangs from, glass shine and the shadow it throws on the wall
        ctx.strokeStyle = '#e0a92a';
        ctx.lineWidth = 3;
        ctx.strokeRect(9, -611, 202, 162);
        ctx.fillStyle = '#fff3b0';
        for (const [cx, cy] of [[10, -610], [210, -610], [10, -450], [210, -450]]) {
          ctx.beginPath();
          ctx.arc(cx, cy, 5, 0, TAU);
          ctx.fill();
        }
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(40, -622);
        ctx.lineTo(110, -664);
        ctx.lineTo(180, -622);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(110, -666, 5, 0, TAU);
        fillStroke(ctx, '#b9c3d9', INK, 3);
        vgrad(ctx, 22, -598, 176, 30, 'rgba(60,40,100,0.2)', 'rgba(60,40,100,0)');
        sheen(ctx, 22, -598, 176, 136, 0.28);
        ctx.fillStyle = 'rgba(90,50,130,0.16)';
        ctx.fillRect(8, -436, 220, 10);
        ctx.fillRect(224, -610, 10, 184);
      }
      break;
    }
    case 'plant': {
      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.translate(80, -160);
        ctx.rotate(-1.1 + i * 0.45 + Math.sin(t * 2 + i) * 0.05);
        ctx.beginPath();
        ctx.ellipse(0, -90, 26, 90, 0, 0, TAU);
        fillStroke(ctx, i % 2 ? '#43c26a' : '#5fd77a', INK, 5);
        if (DETAIL.on) {
          // midrib, veins and a lit side
          ctx.save();
          ctx.clip();
          ctx.fillStyle = 'rgba(255,255,200,0.2)';
          ctx.fillRect(-26, -180, 26, 180);
          ctx.restore();
          ctx.strokeStyle = i % 2 ? '#2f9a50' : '#43b862';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.lineTo(0, -168);
          for (let v = 0; v < 4; v++) {
            ctx.moveTo(0, -40 - v * 30);
            ctx.lineTo(15, -58 - v * 30);
            ctx.moveTo(0, -40 - v * 30);
            ctx.lineTo(-15, -58 - v * 30);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.beginPath();
      ctx.moveTo(20, -170);
      ctx.lineTo(140, -170);
      ctx.lineTo(120, 0);
      ctx.lineTo(40, 0);
      ctx.closePath();
      fillStroke(ctx, '#ff8c42', INK, 6);
      if (DETAIL.on) {
        ctx.save();
        ctx.clip();
        hgrad(ctx, 20, -170, 120, 170, 'rgba(255,255,255,0.28)', 'rgba(150,40,20,0.3)');
        ctx.fillStyle = '#ffd84d';
        ctx.fillRect(20, -118, 120, 14);
        ctx.restore();
        ctx.beginPath();
        ctx.roundRect(10, -186, 140, 26, 8);
        fillStroke(ctx, '#ff9d5c', INK, 5);
        pool(ctx, 80, 4, 120, 16, '60,30,80', 0.28);
      }
      break;
    }
    case 'shelf': {
      ctx.beginPath();
      ctx.rect(0, -560, 200, 560);
      fillStroke(ctx, '#c98a45', INK, 7);
      for (let r = 0; r < 4; r++) {
        ctx.beginPath();
        ctx.rect(14, -540 + r * 135, 172, 116);
        fillStroke(ctx, '#a86c34', INK, 4);
        for (let b = 0; b < 5; b++) {
          ctx.beginPath();
          ctx.rect(22 + b * 32, -520 + r * 135 + (b % 2) * 10, 26, 96 - (b % 2) * 10);
          fillStroke(ctx, ['#ff7da5', '#4cc3ff', '#ffd84d', '#37c45c', '#b77dff'][(b + r) % 5], INK, 3);
          if (DETAIL.on) {
            // spine bands and a lit edge
            const by = -520 + r * 135 + (b % 2) * 10, bh = 96 - (b % 2) * 10;
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.fillRect(25 + b * 32, by + 14, 20, 5);
            ctx.fillRect(25 + b * 32, by + bh - 22, 20, 5);
            ctx.fillStyle = 'rgba(255,255,255,0.28)';
            ctx.fillRect(24 + b * 32, by + 3, 4, bh - 6);
            ctx.fillStyle = 'rgba(40,20,70,0.16)';
            ctx.fillRect(42 + b * 32, by + 3, 5, bh - 6);
          }
        }
        if (DETAIL.on) vgrad(ctx, 16, -538 + r * 135, 168, 26, 'rgba(50,20,10,0.4)', 'rgba(50,20,10,0)');
      }
      if (DETAIL.on) {
        grainV(ctx, 2, -550, 10, 540, '#a86c34', 1, 3, 2);
        grainV(ctx, 188, -550, 10, 540, '#a86c34', 1, 4, 2);
        // a little something on top
        ctx.beginPath();
        ctx.roundRect(30, -600, 60, 40, 8);
        fillStroke(ctx, '#4cc3ff', INK, 4);
        clover(ctx, 140, -584, 20, 0.2, '#43c26a', 3.5);
        pool(ctx, 100, 4, 150, 18, '60,30,80', 0.28);
      }
      break;
    }
    case 'fridge': {
      ctx.beginPath();
      ctx.roundRect(0, -640, 280, 640, 26);
      fillStroke(ctx, '#f2f6ff', INK, 7);
      ctx.beginPath();
      ctx.moveTo(0, -400);
      ctx.lineTo(280, -400);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(230, -560, 18, 110, 9);
      ctx.roundRect(230, -360, 18, 150, 9);
      fillStroke(ctx, '#b9c3d9', INK, 4);
      if (DETAIL.on) {
        // enamel: a cool shade down the far side, a long shine, the door seal
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(4, -636, 272, 632, 22);
        ctx.clip();
        hgrad(ctx, 150, -640, 130, 640, 'rgba(110,130,190,0)', 'rgba(110,130,190,0.3)');
        vgrad(ctx, 0, -70, 280, 70, 'rgba(110,130,190,0)', 'rgba(110,130,190,0.25)');
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.roundRect(20, -616, 12, 190, 6);
        ctx.roundRect(20, -384, 12, 300, 6);
        ctx.fill();
        ctx.fillStyle = 'rgba(110,130,190,0.3)';
        ctx.fillRect(0, -397, 280, 8);
        ctx.restore();
        // a drawing under a magnet
        ctx.save();
        ctx.translate(150, -560);
        ctx.rotate(0.08);
        ctx.beginPath();
        ctx.rect(0, 0, 60, 74);
        fillStroke(ctx, '#fffdf2', INK, 3);
        ctx.strokeStyle = '#4cc3ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(30, 44, 14, 0, TAU);
        ctx.moveTo(20, 28);
        ctx.lineTo(14, 16);
        ctx.moveTo(40, 28);
        ctx.lineTo(46, 16);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(30, 4, 7, 0, TAU);
        fillStroke(ctx, '#ffd84d', INK, 3);
        ctx.restore();
        pool(ctx, 140, 4, 190, 22, '60,30,80', 0.3);
      }
      clover(ctx, 90, -520, 30, 0.3, '#37c45c', 4);
      heart(ctx, 140, -300, 30);
      fillStroke(ctx, '#ff7da5', INK, 4);
      break;
    }
    case 'stove': {
      ctx.beginPath();
      ctx.roundRect(0, -330, 340, 330, 12);
      fillStroke(ctx, '#ffffff', INK, 7);
      ctx.beginPath();
      ctx.roundRect(30, -250, 280, 190, 14);
      fillStroke(ctx, '#3a2747', INK, 5);
      ctx.fillStyle = 'rgba(255,170,90,0.6)';
      ctx.fillRect(50, -230, 240, 150);
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(50 + i * 80, -295, 14, 0, TAU);
        fillStroke(ctx, '#ff5d8f', INK, 4);
      }
      // pot with steam
      if (DETAIL.on) {
        // oven glow, the glass glare, a handle, knob pointers, enamel shade
        pool(ctx, 170, -150, 150, 90, '255,200,110', 0.45);
        sheen(ctx, 50, -230, 240, 150, 0.22);
        ctx.beginPath();
        ctx.roundRect(60, -268, 220, 12, 6);
        fillStroke(ctx, '#b9c3d9', INK, 3.5);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(50 + i * 80, -295);
          ctx.lineTo(50 + i * 80 + 6, -304);
          ctx.stroke();
        }
        hgrad(ctx, 250, -326, 86, 322, 'rgba(110,130,190,0)', 'rgba(110,130,190,0.24)');
        ctx.fillStyle = 'rgba(110,130,190,0.3)';
        ctx.fillRect(4, -40, 332, 36);
        pool(ctx, 170, 4, 220, 22, '60,30,80', 0.3);
      }
      ctx.beginPath();
      ctx.roundRect(90, -450, 160, 110, 18);
      fillStroke(ctx, '#ff8c42', INK, 6);
      if (DETAIL.on) {
        // lid with a knob, handles, a shine and a band
        ctx.save();
        ctx.clip();
        hgrad(ctx, 90, -450, 160, 110, 'rgba(255,255,255,0.3)', 'rgba(150,40,20,0.3)');
        ctx.fillStyle = '#ffd84d';
        ctx.fillRect(90, -384, 160, 12);
        ctx.restore();
        ctx.beginPath();
        ctx.roundRect(80, -466, 180, 22, 10);
        fillStroke(ctx, '#ffa25e', INK, 5);
        ctx.beginPath();
        ctx.arc(170, -474, 11, 0, TAU);
        fillStroke(ctx, '#3a2747', INK, 3);
        for (const hx of [74, 250]) {
          ctx.beginPath();
          ctx.roundRect(hx, -420, 16, 30, 6);
          fillStroke(ctx, '#3a2747', INK, 3);
        }
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 8;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const sx = 120 + i * 50;
        ctx.moveTo(sx, -470);
        ctx.bezierCurveTo(sx - 20, -510, sx + 20, -540 + Math.sin(t * 4 + i) * 8, sx, -580);
        ctx.stroke();
      }
      break;
    }
    case 'cabinet': {
      ctx.beginPath();
      ctx.rect(0, -330, 420, 330);
      fillStroke(ctx, '#ffb3cf', INK, 7);
      ctx.beginPath();
      ctx.rect(-14, -350, 448, 30);
      fillStroke(ctx, '#ffffff', INK, 6);
      for (const dx of [20, 220]) {
        ctx.beginPath();
        ctx.rect(dx, -300, 180, 280);
        fillStroke(ctx, '#ffc6db', INK, 4);
      }
      // upper cabinets
      ctx.beginPath();
      ctx.rect(0, -760, 420, 220);
      fillStroke(ctx, '#ffb3cf', INK, 7);
      // cookie jar
      if (DETAIL.on) {
        // panelled doors with knobs, upper doors, shade under the counter and the wall units
        for (const dx of [20, 220]) {
          ctx.beginPath();
          ctx.roundRect(dx + 22, -278, 136, 236, 10);
          ctx.strokeStyle = '#f29abc';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(dx === 20 ? 178 : 242, -170, 9, 0, TAU);
          fillStroke(ctx, '#ffd84d', INK, 3.5);
        }
        vgrad(ctx, 4, -320, 412, 26, 'rgba(150,40,90,0.3)', 'rgba(150,40,90,0)');
        ctx.strokeStyle = INK;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(210, -756);
        ctx.lineTo(210, -544);
        ctx.stroke();
        for (const dx of [20, 226]) {
          ctx.beginPath();
          ctx.roundRect(dx, -738, 174, 176, 10);
          ctx.strokeStyle = '#f29abc';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(dx === 20 ? 178 : 242, -590, 8, 0, TAU);
          fillStroke(ctx, '#ffd84d', INK, 3.5);
        }
        vgrad(ctx, 0, -540, 420, 44, 'rgba(60,40,100,0.22)', 'rgba(60,40,100,0)');
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillRect(-8, -346, 436, 5);
        pool(ctx, 210, 4, 270, 22, '60,30,80', 0.3);
      }
      ctx.beginPath();
      ctx.roundRect(150, -470, 110, 120, 30);
      fillStroke(ctx, '#ffe58a', INK, 6);
      if (DETAIL.on) {
        // cookies in the jar, a lid and a label
        ctx.fillStyle = '#c98a45';
        for (const [cx, cy] of [[180, -388], [212, -380], [236, -392], [196, -408], [226, -412]]) {
          ctx.beginPath();
          ctx.arc(cx, cy, 13, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = '#7a4a22';
        for (const [cx, cy] of [[176, -390], [214, -384], [238, -396], [198, -412], [228, -408], [186, -382]]) {
          ctx.beginPath();
          ctx.arc(cx, cy, 2.6, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.roundRect(162, -452, 10, 78, 5);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(160, -486, 90, 22, 8);
        fillStroke(ctx, '#ff7da5', INK, 4);
        ctx.beginPath();
        ctx.arc(205, -492, 9, 0, TAU);
        fillStroke(ctx, '#ff7da5', INK, 3.5);
      }
      break;
    }
    case 'pans': {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-20, -680);
      ctx.lineTo(380, -680);
      ctx.stroke();
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(40 + i * 130, -680);
        ctx.rotate(Math.sin(t * 5 + i) * 0.12);
        ctx.beginPath();
        ctx.rect(-6, 0, 12, 90);
        fillStroke(ctx, '#3a2747', INK, 3);
        ctx.beginPath();
        ctx.arc(0, 140, 56 - i * 6, 0, TAU);
        fillStroke(ctx, ['#ff8c42', '#4cc3ff', '#ffd84d'][i], INK, 6);
        if (DETAIL.on) {
          ctx.beginPath();
          ctx.arc(0, 140, 40 - i * 6, 0, TAU);
          ctx.strokeStyle = 'rgba(40,20,70,0.25)';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 140, 46 - i * 6, Math.PI * 1.05, Math.PI * 1.5);
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 5;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 4, 6, 0, TAU);
          fillStroke(ctx, '#b9c3d9', INK, 3);
        }
        ctx.restore();
      }
      break;
    }
    case 'door': {
      ctx.beginPath();
      ctx.roundRect(0, -620, 300, 620, [20, 20, 0, 0]);
      fillStroke(ctx, '#c98a45', INK, 7);
      for (const [dx, dy, w, h] of [[30, -580, 240, 240], [30, -310, 240, 270]]) {
        ctx.beginPath();
        ctx.roundRect(dx, dy, w, h, 10);
        fillStroke(ctx, '#d99c58', INK, 4);
      }
      if (DETAIL.on) {
        // wood grain, bevelled panels, hinges, a keyhole plate and the frame around the door
        ctx.globalAlpha = 0.6;
        grainV(ctx, 6, -600, 20, 590, '#a86c34', 1, 11, 2.5);
        grainV(ctx, 274, -600, 20, 590, '#a86c34', 1, 12, 2.5);
        grainV(ctx, 40, -570, 220, 220, '#b97c42', 4, 13, 2.5);
        grainV(ctx, 40, -300, 220, 250, '#b97c42', 4, 14, 2.5);
        ctx.globalAlpha = 1;
        knot(ctx, 190, -180, 9, '#b97c42');
        for (const [dx, dy, w, h] of [[30, -580, 240, 240], [30, -310, 240, 270]]) {
          ctx.fillStyle = 'rgba(80,40,10,0.22)';
          ctx.fillRect(dx + 3, dy + 3, w - 6, 9);
          ctx.fillRect(dx + 3, dy + 3, 9, h - 6);
          ctx.fillStyle = 'rgba(255,240,200,0.4)';
          ctx.fillRect(dx + 3, dy + h - 11, w - 6, 8);
          ctx.fillRect(dx + w - 11, dy + 3, 8, h - 6);
        }
        for (const hy of [-540, -120]) {
          ctx.beginPath();
          ctx.roundRect(-8, hy, 16, 44, 4);
          fillStroke(ctx, '#b9c3d9', INK, 3);
        }
        ctx.beginPath();
        ctx.roundRect(238, -356, 34, 100, 10);
        fillStroke(ctx, '#e6b93a', INK, 3.5);
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(255, -280, 4, 0, TAU);
        ctx.fill();
        ctx.fillRect(253.5, -280, 3, 11);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 12;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(-16, -612);
        ctx.quadraticCurveTo(-16, -636, 8, -636);
        ctx.lineTo(292, -636);
        ctx.quadraticCurveTo(316, -636, 316, -612);
        ctx.lineTo(316, 0);
        ctx.stroke();
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-23, 0);
        ctx.lineTo(-23, -614);
        ctx.quadraticCurveTo(-23, -643, 6, -643);
        ctx.lineTo(294, -643);
        ctx.quadraticCurveTo(323, -643, 323, -614);
        ctx.lineTo(323, 0);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(255, -320, 16, 0, TAU);
      fillStroke(ctx, '#ffd84d', INK, 4);
      if (DETAIL.on) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.arc(250, -326, 5, 0, TAU);
        ctx.fill();
      }
      break;
    }
  }
  ctx.restore();
}

/* kitchen island (front) */
export function island(ctx, x, y, w = 760) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.roundRect(-w / 2, -40, w, 260, 14);
  fillStroke(ctx, '#ffb3cf', INK, 7);
  ctx.beginPath();
  ctx.roundRect(-w / 2 - 20, -70, w + 40, 44, 12);
  fillStroke(ctx, '#ffffff', INK, 7);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.rect(-w / 2 + 30 + i * ((w - 60) / 3), -10, (w - 60) / 3 - 20, 200);
    fillStroke(ctx, '#ffc6db', INK, 4);
    if (DETAIL.on) {
      const px = -w / 2 + 30 + i * ((w - 60) / 3), pw = (w - 60) / 3 - 20;
      ctx.strokeStyle = '#f29abc';
      ctx.lineWidth = 4;
      ctx.strokeRect(px + 16, 6, pw - 32, 168);
      ctx.beginPath();
      ctx.arc(px + pw / 2, 28, 8, 0, TAU);
      fillStroke(ctx, '#ffd84d', INK, 3.5);
    }
  }
  if (DETAIL.on) {
    vgrad(ctx, -w / 2, -26, w, 30, 'rgba(150,40,90,0.3)', 'rgba(150,40,90,0)');
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(-w / 2 - 8, -62, w + 16, 5);
    pool(ctx, 0, 224, w * 0.6, 26, '60,30,80', 0.3);
  }
  // fruit bowl & flour bag
  blob(ctx, [[-120, -100, 26], [-80, -104, 24], [-100, -128, 22]], '#ff5d5d', 5);
  ctx.beginPath();
  ctx.ellipse(-100, -78, 80, 20, 0, 0, Math.PI);
  fillStroke(ctx, '#4cc3ff', INK, 5);
  ctx.beginPath();
  ctx.roundRect(120, -190, 110, 130, 18);
  fillStroke(ctx, '#f7f0e0', INK, 6);
  ctx.font = '40px "Bangers"';
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.fillText('FARINHA', 175, -112);
  if (DETAIL.on) {
    // apple shines and stalk, a rim on the bowl, the bag's folded top and stitching
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (const [ax, ay] of [[-128, -110], [-88, -114], [-108, -138]]) {
      ctx.beginPath();
      ctx.ellipse(ax, ay, 7, 4, -0.6, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-100, -148);
    ctx.lineTo(-96, -160);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(-100, -76, 70, 13, 0, 0.3, Math.PI - 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(116, -204, 118, 22, 6);
    fillStroke(ctx, '#ece2cb', INK, 4);
    ctx.strokeStyle = '#c9b98f';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(130, -78);
    ctx.lineTo(220, -78);
    ctx.stroke();
    ctx.setLineDash([]);
    hgrad(ctx, 190, -180, 40, 120, 'rgba(120,100,60,0)', 'rgba(120,100,60,0.22)');
  }
  ctx.restore();
}

/* ---------------- characters & objects ---------------- */
export function globe(ctx, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  fillStroke(ctx, '#4cb8ff', INK, 8);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#5fd77a';
  for (let i = 0; i < 9; i++) {
    const a = rot + i * 0.9;
    const cx = Math.cos(a) * r * 0.9;
    const cy = -r * 0.6 + (i % 3) * r * 0.55;
    const vis = Math.sin(a);
    if (vis < -0.2) continue;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.28 * Math.max(0.2, Math.abs(Math.sin(a))), r * 0.18, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.arc(-r * 0.35, -r * 0.4, r * 0.35, 0, TAU);
  ctx.fill();
  if (DETAIL.on) {
    // a terminator shadow, drifting cloud wisps and a thin halo of air
    const g = ctx.createRadialGradient(-r * 0.4, -r * 0.45, r * 0.5, -r * 0.2, -r * 0.2, r * 1.5);
    g.addColorStop(0, 'rgba(40,30,110,0)');
    g.addColorStop(1, 'rgba(40,30,110,0.5)');
    ctx.fillStyle = g;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = r * 0.07;
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const a = rot * 1.4 + i * 1.3;
      if (Math.sin(a) < 0) continue;
      const cx = Math.cos(a) * r * 0.85, cy = -r * 0.7 + i * r * 0.34;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.2 * Math.sin(a), cy);
      ctx.lineTo(cx + r * 0.2 * Math.sin(a), cy);
      ctx.stroke();
    }
  }
  ctx.restore();
  if (DETAIL.on) {
    ctx.beginPath();
    ctx.arc(0, 0, r + 9, 0, TAU);
    ctx.strokeStyle = 'rgba(170,225,255,0.5)';
    ctx.lineWidth = 6;
    ctx.stroke();
  }
  ctx.restore();
}

// cartoon crocodile running on two legs, facing right
export function croc(ctx, phase, o = {}) {
  const ph = phase * TAU;
  ctx.save();
  const bob = -Math.abs(Math.sin(ph)) * 14;
  ctx.translate(0, bob);
  const G = '#43b75c', G2 = '#2f9a48', BELLY = '#d6f5a8';
  // legs
  for (const [k, sh] of [[0, G2], [Math.PI, G]]) {
    ctx.save();
    ctx.translate(-10, -70);
    ctx.rotate(Math.sin(ph + k) * 0.8);
    ctx.beginPath();
    ctx.roundRect(-14, 0, 28, 70, 14);
    fillStroke(ctx, sh, INK, 5);
    ctx.beginPath();
    ctx.ellipse(10, 70, 26, 12, 0, 0, TAU);
    fillStroke(ctx, sh, INK, 5);
    if (DETAIL.on) {
      ctx.fillStyle = '#fff8d8';
      for (const cx of [18, 27, 35]) {
        ctx.beginPath();
        ctx.moveTo(cx - 4, 70);
        ctx.lineTo(cx + 3, 66);
        ctx.lineTo(cx + 5, 76);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  // tail
  ctx.beginPath();
  ctx.moveTo(-60, -130);
  ctx.quadraticCurveTo(-200, -110 + Math.sin(ph * 2) * 20, -260, -60 + Math.sin(ph * 2) * 30);
  ctx.quadraticCurveTo(-180, -80, -50, -80);
  ctx.closePath();
  fillStroke(ctx, G, INK, 6);
  if (DETAIL.on) {
    // underside shade, ridge scutes and bands along the tail
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(30,90,70,0.35)';
    ctx.beginPath();
    ctx.moveTo(-270, -40 + Math.sin(ph * 2) * 30);
    ctx.quadraticCurveTo(-180, -96, -40, -98);
    ctx.lineTo(-40, -60);
    ctx.lineTo(-270, -20);
    ctx.fill();
    ctx.strokeStyle = G2;
    ctx.lineWidth = 4;
    for (let i = 0; i < 5; i++) {
      const u = 0.15 + i * 0.16;
      const tx = -60 - u * 190, ty = -122 + u * 50 + Math.sin(ph * 2) * 24 * u;
      ctx.beginPath();
      ctx.moveTo(tx, ty - 22);
      ctx.quadraticCurveTo(tx - 12, ty, tx + 2, ty + 26);
      ctx.stroke();
    }
    ctx.restore();
  }
  // body
  ctx.beginPath();
  ctx.ellipse(0, -140, 70, 85, 0.15, 0, TAU);
  fillStroke(ctx, G, INK, 6);
  if (DETAIL.on) {
    ctx.save();
    ctx.clip();
    // scales on the back, a shadow down the spine side, a lit shoulder
    ctx.strokeStyle = G2;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 3; c++) {
        const sx = -58 + c * 22 + (r % 2) * 11 + r * 3, sy = -196 + r * 26;
        ctx.beginPath();
        ctx.arc(sx, sy, 9, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      }
    }
    const g = ctx.createLinearGradient(-70, -220, 60, -70);
    g.addColorStop(0, 'rgba(255,255,170,0.22)');
    g.addColorStop(0.45, 'rgba(255,255,170,0)');
    g.addColorStop(1, 'rgba(20,80,70,0.38)');
    ctx.fillStyle = g;
    ctx.fillRect(-90, -240, 180, 200);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.ellipse(18, -130, 40, 62, 0.15, 0, TAU);
  fillStroke(ctx, BELLY, INK, 4);
  if (DETAIL.on) {
    // belly plates
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = '#a9d47c';
    ctx.lineWidth = 3.5;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(-30, -182 + i * 20);
      ctx.quadraticCurveTo(22, -172 + i * 20, 66, -186 + i * 20);
      ctx.stroke();
    }
    hgrad(ctx, 20, -200, 50, 140, 'rgba(90,140,60,0)', 'rgba(90,140,60,0.3)');
    ctx.restore();
  }
  // back spikes
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    const sx = -60 + i * 22, sy = -200 + i * 6;
    ctx.moveTo(sx - 10, sy + 12);
    ctx.lineTo(sx - 4, sy - 14);
    ctx.lineTo(sx + 12, sy + 8);
    fillStroke(ctx, G2, INK, 4);
  }
  // arms flailing
  for (const k of [0, Math.PI]) {
    ctx.save();
    ctx.translate(30, -170);
    ctx.rotate(-0.8 + Math.sin(ph + k) * 0.9);
    ctx.beginPath();
    ctx.roundRect(-10, 0, 20, 60, 10);
    fillStroke(ctx, G, INK, 5);
    ctx.restore();
  }
  // head with long snout
  ctx.save();
  ctx.translate(40, -240);
  ctx.rotate(-0.1 + Math.sin(ph * 2) * 0.05);
  const jaw = 0.25 + 0.2 * Math.abs(Math.sin(ph * 2));
  ctx.beginPath();
  ctx.roundRect(-10, 0, 200, 46, 22);
  ctx.save();
  ctx.translate(0, 20);
  ctx.rotate(jaw);
  ctx.beginPath();
  ctx.roundRect(-10, 0, 190, 40, 20);
  fillStroke(ctx, G, INK, 6);
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.moveTo(20 + i * 22, 2);
    ctx.lineTo(30 + i * 22, -12);
    ctx.lineTo(40 + i * 22, 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.roundRect(-20, -30, 220, 56, 26);
  fillStroke(ctx, G, INK, 6);
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.moveTo(30 + i * 22, 24);
    ctx.lineTo(40 + i * 22, 40);
    ctx.lineTo(50 + i * 22, 24);
    ctx.fill();
  }
  // eye bumps
  for (const ex of [20, 60]) {
    ctx.beginPath();
    ctx.arc(ex, -34, 24, 0, TAU);
    fillStroke(ctx, G, INK, 5);
    ctx.beginPath();
    ctx.arc(ex + 2, -36, 14, 0, TAU);
    fillStroke(ctx, '#fff', INK, 3);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(ex + 6, -36, 7, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(186, -16, 5, 0, TAU);
  ctx.fill();
  if (DETAIL.on) {
    // snout bumps, a lit top to the snout, a shaded jawline, eye shines
    ctx.fillStyle = G2;
    for (const [bx, by, br] of [[96, -14, 5], [120, -8, 4], [142, -15, 5], [164, -6, 4], [108, 2, 3.5], [150, 4, 3.5]]) {
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,190,0.55)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(86, -23);
    ctx.lineTo(176, -23);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(20,80,70,0.4)';
    ctx.beginPath();
    ctx.moveTo(0, 17);
    ctx.lineTo(180, 17);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    for (const ex of [20, 60]) {
      ctx.beginPath();
      ctx.arc(ex + 3, -40, 3, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(176, -18, 5, Math.PI, TAU);
    ctx.stroke();
  }
  ctx.restore();
  // little zoo number tag
  if (o.tag) {
    ctx.beginPath();
    ctx.roundRect(-20, -120, 50, 34, 6);
    fillStroke(ctx, '#ffd84d', INK, 4);
    ctx.font = '26px "Bangers"';
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.fillText('ZOO', 5, -94);
  }
  ctx.restore();
}

// cabbage (couve) — a leafy ball
export function cabbage(ctx, r, t, face = true) {
  const leaves = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + 0.3;
    leaves.push([Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, r * 0.55]);
  }
  dblob(ctx, leaves, '#7ad46a', 6);
  dblob(ctx, [[0, 0, r * 0.78]], '#a6e88c', 6);
  ctx.strokeStyle = '#4f9f45';
  ctx.lineWidth = 4;
  for (let i = 0; i < 5; i++) {
    const a = -1.2 + i * 0.6;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.6);
    ctx.quadraticCurveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.2, Math.cos(a - 1.57) * r * 0.7, Math.sin(a - 1.57) * r * 0.7);
    ctx.stroke();
  }
}

export function skate(ctx, x, y, s, spin) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.roundRect(-50, -70, 70, 70, [30, 10, 6, 6]);
  fillStroke(ctx, '#ff5d8f', INK, 5);
  ctx.beginPath();
  ctx.roundRect(-60, -10, 110, 20, 8);
  fillStroke(ctx, '#ffd84d', INK, 5);
  if (DETAIL.on) {
    // laces, a cuff, a toe cap, a stripe and a stopper
    ctx.beginPath();
    ctx.roundRect(-54, -76, 78, 16, 8);
    fillStroke(ctx, '#ffffff', INK, 3.5);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-4, -52 + i * 13);
      ctx.lineTo(14, -48 + i * 13);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(-34, -44, 7, 16, 0.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(150,20,70,0.3)';
    ctx.fillRect(-48, -22, 66, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(-52, -6, 94, 4);
    ctx.beginPath();
    ctx.roundRect(40, 0, 18, 18, 6);
    fillStroke(ctx, '#ff8c42', INK, 3.5);
  }
  for (const wx of [-36, 26]) {
    ctx.save();
    ctx.translate(wx, 22);
    ctx.rotate(spin);
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, TAU);
    fillStroke(ctx, '#4cc3ff', INK, 5);
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();
    if (DETAIL.on) {
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(0, 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, TAU);
      fillStroke(ctx, '#ffffff', INK, 2.5);
      ctx.rotate(-spin);
      ctx.beginPath();
      ctx.arc(0, 0, 11, Math.PI * 1.05, Math.PI * 1.55);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 3.5;
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

// cheese wedge with a rocket booster, pointing right
export function cheeseRocket(ctx, t) {
  rocketPack(ctx, t);
  cheeseWedge(ctx);
}
// flame + booster only (strapped to Brie's back in the costume scenes)
// the detailed pack: a little rocket with a nose cone, nozzle, swept fins and a real flame
function rocketPackDetail(ctx, t, power) {
  const d = Math.floor(t * 12 + 1e-6);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (power > 0.02) flame(ctx, -212, 0, 250 * power, 40 * (0.6 + 0.4 * Math.min(power, 1)), d, t, 11);
  // swept fins
  for (const sy of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-118, sy * 42);
    ctx.quadraticCurveTo(-176, sy * 58, -214, sy * 100);
    ctx.quadraticCurveTo(-204, sy * 66, -188, sy * 40);
    ctx.closePath();
    fillStroke(ctx, '#ff5d5d', INK, 5);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-140, sy * 52);
    ctx.quadraticCurveTo(-176, sy * 66, -198, sy * 86);
    ctx.stroke();
  }
  // nozzle bell, glowing at the mouth
  ctx.beginPath();
  ctx.moveTo(-176, -28);
  ctx.lineTo(-212, -40);
  ctx.quadraticCurveTo(-222, 0, -212, 40);
  ctx.lineTo(-176, 28);
  ctx.closePath();
  fillStroke(ctx, '#7a7f9c', INK, 5);
  ctx.strokeStyle = power > 0.02 ? '#ffd23f' : '#4b4f6a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-211, -30);
  ctx.quadraticCurveTo(-218, 0, -211, 30);
  ctx.stroke();
  // tank
  ctx.beginPath();
  ctx.roundRect(-182, -48, 104, 96, 14);
  fillStroke(ctx, '#d0d6e8', INK, 6);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(112,118,168,0.36)';
  ctx.fillRect(-190, 16, 130, 40);
  ctx.fillStyle = '#ffd84d';
  ctx.fillRect(-166, -52, 14, 104);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(-146, -38, 58, 7);
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  for (const x of [-166, -152]) {
    ctx.beginPath();
    ctx.moveTo(x, -46);
    ctx.lineTo(x, 46);
    ctx.stroke();
  }
  ctx.fillStyle = '#8a90ad';
  for (const y of [-30, -10, 10, 30]) {
    ctx.beginPath();
    ctx.arc(-88, y, 2.6, 0, TAU);
    ctx.fill();
  }
  // porthole
  ctx.beginPath();
  ctx.arc(-120, 0, 17, 0, TAU);
  fillStroke(ctx, '#8fd8ff', INK, 4.5);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(-120, 0, 10, 1.1 * Math.PI, 1.6 * Math.PI);
  ctx.stroke();
  // nose cone
  ctx.beginPath();
  ctx.moveTo(-80, -48);
  ctx.quadraticCurveTo(-34, -42, -24, 0);
  ctx.quadraticCurveTo(-34, 42, -80, 48);
  ctx.closePath();
  fillStroke(ctx, '#ff5d5d', INK, 6);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-70, -32);
  ctx.quadraticCurveTo(-48, -28, -40, -12);
  ctx.stroke();
  ctx.restore();
}

export function rocketPack(ctx, t, power = 1) {
  if (DETAIL.on) return rocketPackDetail(ctx, t, power);
  // flame
  const fl = 1 + 0.25 * Math.sin(t * 50);
  ctx.beginPath();
  ctx.moveTo(-170, -40);
  ctx.quadraticCurveTo(-170 - 160 * fl, 0, -170, 40);
  ctx.closePath();
  fillStroke(ctx, '#ff8c42', INK, 5);
  ctx.beginPath();
  ctx.moveTo(-170, -22);
  ctx.quadraticCurveTo(-170 - 90 * fl, 0, -170, 22);
  ctx.closePath();
  fillStroke(ctx, '#fff27a', null, 0);
  // booster
  ctx.beginPath();
  ctx.roundRect(-180, -48, 90, 96, 14);
  fillStroke(ctx, '#d0d6e8', INK, 6);
  ctx.beginPath();
  ctx.moveTo(-160, -48);
  ctx.lineTo(-190, -90);
  ctx.lineTo(-130, -48);
  ctx.closePath();
  fillStroke(ctx, '#ff5d5d', INK, 5);
  ctx.beginPath();
  ctx.moveTo(-160, 48);
  ctx.lineTo(-190, 90);
  ctx.lineTo(-130, 48);
  ctx.closePath();
  fillStroke(ctx, '#ff5d5d', INK, 5);
}
function cheeseWedge(ctx) {
  ctx.beginPath();
  ctx.moveTo(-100, -70);
  ctx.lineTo(190, 10);
  ctx.lineTo(-100, 80);
  ctx.closePath();
  fillStroke(ctx, '#ffd84d', INK, 7);
  if (DETAIL.on) {
    // rind along the back, a lit top face, a darker underside
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#f0a92a';
    ctx.fillRect(-104, -80, 22, 170);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(-100, -70);
    ctx.lineTo(190, 10);
    ctx.lineTo(-100, -34);
    ctx.fill();
    ctx.fillStyle = 'rgba(200,110,20,0.25)';
    ctx.beginPath();
    ctx.moveTo(-100, 80);
    ctx.lineTo(190, 10);
    ctx.lineTo(-100, 46);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#f2b928';
  for (const [hx, hy, hr] of [[-40, -10, 18], [20, 30, 13], [60, 5, 10], [-60, 40, 12]]) {
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, TAU);
    ctx.fill();
    if (DETAIL.on) {
      // holes have depth: a dark upper lip and a lit lower one
      ctx.strokeStyle = 'rgba(160,90,10,0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(hx, hy, hr - 1.5, Math.PI * 0.95, Math.PI * 1.9);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,220,0.7)';
      ctx.beginPath();
      ctx.arc(hx, hy, hr - 1.5, Math.PI * 0.1, Math.PI * 0.8);
      ctx.stroke();
    }
  }
}

// pão de queijo: golden puffy ball
export function paoDeQueijo(ctx, r, t, rings = false) {
  if (rings) {
    ctx.save();
    ctx.rotate(-0.3);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.8, r * 0.45, 0, Math.PI, TAU);
    ctx.lineWidth = 16;
    ctx.strokeStyle = '#b77dff';
    ctx.stroke();
    ctx.restore();
  }
  const puff = [[0, 0, r]];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU;
    puff.push([Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82, r * 0.3]);
  }
  dblob(ctx, puff, '#f7c45a', 7);
  ctx.fillStyle = '#e09a2e';
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.arc(Math.cos(i * 2.4) * r * 0.6 * rand(i), Math.sin(i * 2.4) * r * 0.6 * rand(i + 3), r * 0.05, 0, TAU);
    ctx.fill();
  }
  if (DETAIL.on) {
    // a baked crust: toasted patches, cracks, fine speckle, a warm glow from the top-left
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.02, 0, TAU);
    ctx.clip();
    ctx.fillStyle = 'rgba(214,130,40,0.4)';
    for (let i = 0; i < 6; i++) {
      const a = 0.4 + i * 1.07, d = r * (0.3 + 0.45 * rand(i + 40));
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * (0.16 + 0.1 * rand(i + 50)), r * (0.1 + 0.06 * rand(i + 60)), a, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(170,96,20,0.65)';
    ctx.lineWidth = Math.max(1.5, r * 0.022);
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const a = 0.9 + i * 1.6, d = r * 0.45;
      const cx = Math.cos(a) * d, cy = Math.sin(a) * d;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.13, cy - r * 0.03);
      ctx.quadraticCurveTo(cx, cy + r * 0.07, cx + r * 0.12, cy - r * 0.02);
      ctx.moveTo(cx, cy + r * 0.03);
      ctx.lineTo(cx + r * 0.03, cy + r * 0.11);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,240,190,0.7)';
    for (let i = 0; i < 16; i++) {
      const a = i * 2.1, d = r * 0.85 * Math.sqrt(rand(i + 70));
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r * 0.022, 0, TAU);
      ctx.fill();
    }
    const g = ctx.createRadialGradient(-r * 0.4, -r * 0.45, 0, -r * 0.4, -r * 0.45, r * 1.1);
    g.addColorStop(0, 'rgba(255,246,200,0.4)');
    g.addColorStop(1, 'rgba(255,246,200,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.3, r * 0.18, -0.5, 0, TAU);
  ctx.fill();
  if (rings) {
    ctx.save();
    ctx.rotate(-0.3);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.8, r * 0.45, 0, 0, Math.PI);
    ctx.lineWidth = 16;
    ctx.strokeStyle = '#b77dff';
    ctx.stroke();
    ctx.restore();
  }
}

export function pointingHand(ctx, x, y, s, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  // sleeve
  ctx.beginPath();
  ctx.roundRect(-520, -80, 340, 160, 30);
  fillStroke(ctx, '#4c6fff', INK, 8);
  // palm/fist
  ctx.beginPath();
  ctx.roundRect(-200, -90, 190, 170, 60);
  fillStroke(ctx, '#ffd2b0', INK, 8);
  // index finger
  ctx.beginPath();
  ctx.roundRect(-40, -88, 200, 56, 28);
  fillStroke(ctx, '#ffd2b0', INK, 8);
  // knuckles
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-60, -20 + i * 30);
    ctx.lineTo(-20, -20 + i * 30);
    ctx.stroke();
  }
  ctx.restore();
}

export function jailBars(ctx, x, y, w, h, drop) {
  ctx.save();
  ctx.translate(x, y - (1 - drop) * 1200);
  ctx.beginPath();
  ctx.roundRect(-w / 2 - 20, -h - 30, w + 40, 60, 10);
  fillStroke(ctx, '#8a8fa8', INK, 7);
  ctx.font = '64px "Bangers"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd84d';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 10;
  ctx.strokeText('CÃODEIA', 0, -h - 92);
  ctx.fillText('CÃODEIA', 0, -h - 92);
  const n = 7;
  for (let i = 0; i < n; i++) {
    const bx = -w / 2 + (i / (n - 1)) * w;
    ctx.beginPath();
    ctx.roundRect(bx - 10, -h, 20, h, 10);
    fillStroke(ctx, '#b5bad0', INK, 5);
  }
  ctx.beginPath();
  ctx.roundRect(-w / 2 - 20, -20, w + 40, 40, 10);
  fillStroke(ctx, '#8a8fa8', INK, 7);
  ctx.restore();
}

export function bed(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.roundRect(-420, -380, 80, 380, 20);
  fillStroke(ctx, '#c98a45', INK, 7);
  ctx.beginPath();
  ctx.roundRect(-380, -200, 800, 120, 20);
  fillStroke(ctx, '#ffffff', INK, 7);
  ctx.beginPath();
  ctx.roundRect(-380, -90, 800, 60, 10);
  fillStroke(ctx, '#c98a45', INK, 7);
  ctx.beginPath();
  ctx.roundRect(-340, -270, 200, 90, 40);
  fillStroke(ctx, '#ffffff', INK, 6);
  if (DETAIL.on) {
    // turned headboard post, wood grain, a quilted mattress edge, pillow creases, the shadow under the bed
    grainV(ctx, -410, -360, 60, 350, '#a86c34', 3, 21, 2.5);
    ctx.beginPath();
    ctx.arc(-380, -392, 26, 0, TAU);
    fillStroke(ctx, '#c98a45', INK, 6);
    ctx.fillStyle = 'rgba(255,240,200,0.5)';
    ctx.beginPath();
    ctx.arc(-388, -400, 8, 0, TAU);
    ctx.fill();
    grain(ctx, -370, -84, 780, 48, '#a86c34', 3, 22, 2.5);
    vgrad(ctx, -376, -196, 792, 30, 'rgba(120,100,180,0.22)', 'rgba(120,100,180,0)');
    ctx.strokeStyle = 'rgba(150,130,200,0.5)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(-360, -104);
    ctx.lineTo(400, -104);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(150,130,200,0.6)';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-300, -236);
    ctx.quadraticCurveTo(-270, -224, -250, -240);
    ctx.moveTo(-220, -214);
    ctx.quadraticCurveTo(-196, -222, -176, -210);
    ctx.stroke();
    ctx.fillStyle = 'rgba(120,100,180,0.25)';
    ctx.beginPath();
    ctx.ellipse(-240, -186, 90, 10, 0, 0, TAU);
    ctx.fill();
    for (const lx of [-360, 380]) {
      ctx.beginPath();
      ctx.roundRect(lx - 14, -34, 28, 34, 6);
      fillStroke(ctx, '#a86c34', INK, 5);
    }
    pool(ctx, 20, 2, 440, 26, '50,25,80', 0.34);
  }
  ctx.restore();
}

// duvet with clover pattern; path is an array of points along its top edge
export function duvetShape(ctx, pts, thick) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + thick);
  ctx.closePath();
  fillStroke(ctx, '#7fb6ff', INK, 7);
  ctx.save();
  ctx.clip();
  for (let i = 0; i < pts.length; i += 2) {
    clover(ctx, pts[i][0], pts[i][1] + thick / 2, 18, i, '#ffffff', 0);
  }
  if (DETAIL.on) {
    // quilting: a lit top band, a shaded hem, stitched channels and small clovers between the big ones
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = thick * 0.16;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + thick * 0.14) : ctx.moveTo(x, y + thick * 0.14)));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(50,70,170,0.28)';
    ctx.lineWidth = thick * 0.22;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + thick * 0.94) : ctx.moveTo(x, y + thick * 0.94)));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(40,70,170,0.4)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([9, 8]);
    for (let i = 1; i < pts.length; i += 2) {
      ctx.beginPath();
      ctx.moveTo(pts[i][0], pts[i][1] + 6);
      ctx.lineTo(pts[i][0], pts[i][1] + thick - 6);
      ctx.stroke();
    }
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + thick * 0.8) : ctx.moveTo(x, y + thick * 0.8)));
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 1; i < pts.length; i += 2) {
      clover(ctx, pts[i][0] + 16, pts[i][1] + thick * 0.34, 9, i * 1.7, 'rgba(255,255,255,0.7)', 0);
      clover(ctx, pts[i][0] - 18, pts[i][1] + thick * 0.66, 8, i * 0.9, '#b8d8ff', 0);
    }
  }
  ctx.restore();
}

export function gauge(ctx, x, y, r, v) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI, TAU);
  ctx.closePath();
  fillStroke(ctx, '#2b1d3a', INK, 8);
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + (i / 10) * Math.PI;
    ctx.strokeStyle = i > 7 ? '#ff4d4d' : '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75);
    ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
    ctx.stroke();
  }
  const a = Math.PI + clamp(v, 0, 1.05) * Math.PI;
  ctx.strokeStyle = '#ff5d8f';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, TAU);
  fillStroke(ctx, '#ffd84d', INK, 5);
  ctx.font = `${r * 0.32}px "Bangers"`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd84d';
  ctx.fillText('TURBO', 0, -r * 0.3);
  ctx.restore();
}

export function zooGate(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  for (const px of [-300, 300]) {
    ctx.beginPath();
    ctx.rect(px - 40, -520, 80, 520);
    fillStroke(ctx, '#b07444', INK, 7);
  }
  ctx.beginPath();
  ctx.roundRect(-360, -600, 720, 120, 20);
  fillStroke(ctx, '#ffd84d', INK, 7);
  ctx.font = '96px "Bangers"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2f8f45';
  ctx.fillText('ZOOLÓGICO', 0, -538);
  ctx.restore();
}

export function rail(ctx, x0, y0, x1, y1) {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.strokeStyle = '#ff5d8f';
  ctx.lineWidth = 12;
  ctx.stroke();
  // supports
  const n = 6;
  for (let i = 0; i <= n; i++) {
    const x = lerp(x0, x1, i / n), y = lerp(y0, y1, i / n);
    ctx.beginPath();
    ctx.moveTo(x, y + 10);
    ctx.lineTo(x, H + 50);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.strokeStyle = '#ffd84d';
    ctx.lineWidth = 6;
    ctx.stroke();
  }
  ctx.restore();
}

export function clock(ctx, x, y, r, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  fillStroke(ctx, '#fff', INK, 8);
  ctx.strokeStyle = INK;
  ctx.lineCap = 'round';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -r * 0.5);
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#ff5d8f';
  const a = -Math.PI / 2 + Math.floor(t) * (TAU / 12);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8);
  ctx.stroke();
  ctx.restore();
}

/* ---------------- plush food toys (felt legs, embroidered faces) ---------------- */
function feltLegs(ctx, r, col) {
  ctx.strokeStyle = INK;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const sx of [-1, 1]) {
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(sx * r * 0.3, r * 0.6);
      ctx.lineTo(sx * r * 0.34, r * 1.12);
      ctx.lineTo(sx * r * 0.34 + sx * r * 0.2, r * 1.14);
    };
    path();
    ctx.lineWidth = r * 0.2;
    ctx.stroke();
    path();
    ctx.strokeStyle = col;
    ctx.lineWidth = r * 0.2 - 8;
    ctx.stroke();
    ctx.strokeStyle = INK;
  }
}
function stitchFace(ctx, r, o = {}) {
  const ey = o.ey ?? -r * 0.05, ex = o.ex ?? r * 0.28;
  if (o.bigEyes) {
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(sx * ex, ey, r * 0.15, 0, TAU);
      fillStroke(ctx, '#ffffff', INK, 3);
      ctx.fillStyle = o.eyeCol ?? INK;
      ctx.beginPath();
      ctx.arc(sx * ex + r * 0.03, ey + r * 0.02, r * 0.08, 0, TAU);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = o.eyeCol ?? INK;
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(sx * ex, ey, r * 0.075, 0, TAU);
      ctx.fill();
    }
  }
  if (o.beak) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.08, ey + r * 0.06);
    ctx.lineTo(r * 0.08, ey + r * 0.06);
    ctx.lineTo(0, ey + r * 0.26);
    ctx.closePath();
    fillStroke(ctx, '#ff4f4f', INK, 3);
  } else {
    ctx.beginPath();
    ctx.arc(o.smileDx ?? 0, ey + r * 0.06, r * (o.smileR ?? 0.17), 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(3, r * 0.06);
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  if (o.blush !== false) {
    ctx.fillStyle = 'rgba(255,120,150,0.55)';
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(sx * ex * 1.55, ey + r * 0.16, r * 0.11, r * 0.07, 0, 0, TAU);
      ctx.fill();
    }
  }
}
export function plushToy(ctx, kind, r = 70) {
  ctx.lineJoin = 'round';
  if (kind === 'toast') {
    feltLegs(ctx, r, '#6b3a1f');
    const loaf = (k) => {
      ctx.beginPath();
      ctx.moveTo(-r * 0.8 * k, r * 0.75 * k);
      ctx.lineTo(-r * 0.8 * k, -r * 0.2 * k);
      ctx.bezierCurveTo(-r * 1.15 * k, -r * 0.35 * k, -r * 1.05 * k, -r * 0.95 * k, -r * 0.5 * k, -r * 0.9 * k);
      ctx.quadraticCurveTo(0, -r * 1.05 * k, r * 0.5 * k, -r * 0.9 * k);
      ctx.bezierCurveTo(r * 1.05 * k, -r * 0.95 * k, r * 1.15 * k, -r * 0.35 * k, r * 0.8 * k, -r * 0.2 * k);
      ctx.lineTo(r * 0.8 * k, r * 0.75 * k);
      ctx.closePath();
    };
    loaf(1);
    fillStroke(ctx, '#d9822b', INK, 6);
    loaf(0.78);
    fillStroke(ctx, '#fff3d6', '#ffffff', 4);
    stitchFace(ctx, r, { ey: -r * 0.12 });
  } else if (kind === 'onigiri') {
    feltLegs(ctx, r, '#555a66');
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.0);
    ctx.bezierCurveTo(r * 0.45, -r * 1.0, r * 1.15, r * 0.35, r * 0.85, r * 0.72);
    ctx.quadraticCurveTo(0, r * 0.95, -r * 0.85, r * 0.72);
    ctx.bezierCurveTo(-r * 1.15, r * 0.35, -r * 0.45, -r * 1.0, 0, -r * 1.0);
    fillStroke(ctx, '#f1dccb', INK, 6);
    ctx.beginPath();
    ctx.roundRect(-r * 0.36, r * 0.22, r * 0.72, r * 0.62, 6);
    fillStroke(ctx, '#c9a272', INK, 4);
    stitchFace(ctx, r, { ey: -r * 0.2, ex: r * 0.24 });
  } else if (kind === 'milk') {
    feltLegs(ctx, r, '#555a66');
    ctx.beginPath();
    ctx.roundRect(-r * 0.72, -r * 0.78, r * 1.44, r * 1.6, r * 0.22);
    fillStroke(ctx, '#ffc8d6', INK, 6);
    ctx.beginPath();
    ctx.roundRect(-r * 0.7, -r * 1.02, r * 1.4, r * 0.32, r * 0.14);
    fillStroke(ctx, '#8a4a2a', INK, 5);
    stitchFace(ctx, r, { ey: -r * 0.2 });
    ctx.fillStyle = INK;
    ctx.font = `600 ${Math.round(r * 0.34)}px "Fredoka", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('milk', 0, r * 0.45);
  } else if (kind === 'sunny') {
    feltLegs(ctx, r, '#555a66');
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, 0, TAU);
    fillStroke(ctx, '#ffe98a', INK, 6);
    stitchFace(ctx, r, { bigEyes: true, ey: -r * 0.3, ex: r * 0.3, smileR: 0.4, smileDx: r * 0.08, blush: false });
  } else {
    // blue birdie
    feltLegs(ctx, r, '#2ea3ff');
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, 0, TAU);
    fillStroke(ctx, '#aad6ff', INK, 6);
    ctx.fillStyle = '#c9a272';
    for (const [x, y, a] of [[-0.35, -0.62, 0.4], [0.32, -0.58, -0.3], [-0.55, 0.35, 0.8], [0.5, 0.4, -0.7]]) {
      ctx.save();
      ctx.translate(x * r, y * r);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(-r * 0.06, 0);
      ctx.lineTo(r * 0.06, 0);
      ctx.lineTo(0, -r * 0.16);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    stitchFace(ctx, r, { bigEyes: true, eyeCol: '#1d4fd6', beak: true, ey: -r * 0.12, ex: r * 0.24, blush: false });
  }
}

// little cabbage friend (for the côve rail)
export function cabbageBuddy(ctx, r, t, ph = 0) {
  const ruff = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    ruff.push([Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.78, r * (0.3 + 0.04 * Math.sin(t * 6 + i + ph))]);
  }
  dblob(ctx, ruff, '#4faa4a', 6);
  ctx.beginPath();
  ctx.arc(0, r * 0.05, r * 0.82, 0, TAU);
  fillStroke(ctx, '#86d672', INK, 5);
  ctx.strokeStyle = '#e3f8cf';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (const a of [-2.3, -1.9, -1.25, -0.85]) {
    ctx.beginPath();
    ctx.moveTo(0, r * 0.75);
    ctx.quadraticCurveTo(Math.cos(a) * r * 0.2, r * 0.2, Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62 + r * 0.05);
    ctx.stroke();
  }
  stitchFace(ctx, r, { ey: r * 0.05, ex: r * 0.26 });
}

// Brie's plush UFO toy: fuzzy blue dome, blue saucer with orange felt dots,
// pink mesh rim and two stubby legs.
export function ufoToy(ctx, r = 100) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const rx = r, ry = r * 0.3, h = r * 0.24;
  // stubby legs
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.roundRect(sx * r * 0.4 - r * 0.17, h, r * 0.34, r * 0.42, r * 0.14);
    fillStroke(ctx, '#2f6fe0', INK, 6);
  }
  // pink mesh rim band
  const band = () => {
    ctx.beginPath();
    ctx.moveTo(-rx, 0);
    ctx.lineTo(-rx, h);
    ctx.ellipse(0, h, rx, ry, 0, Math.PI, 0, true);
    ctx.lineTo(rx, 0);
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI, false);
    ctx.closePath();
  };
  band();
  fillStroke(ctx, '#ec3f93', INK, 6);
  ctx.save();
  band();
  ctx.clip();
  ctx.strokeStyle = '#b8226a';
  ctx.lineWidth = 2.5;
  const step = r * 0.075;
  for (let x = -rx * 1.4; x < rx * 1.4; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, -ry);
    ctx.lineTo(x + h + ry * 2, h + ry);
    ctx.moveTo(x, -ry);
    ctx.lineTo(x - h - ry * 2, h + ry);
    ctx.stroke();
  }
  ctx.restore();
  band();
  ctx.lineWidth = 6;
  ctx.strokeStyle = INK;
  ctx.stroke();
  // saucer top
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
  fillStroke(ctx, '#2f6fe0', INK, 6);
  // orange felt dots around the saucer
  ctx.fillStyle = '#ff9a3c';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + 0.2;
    const x = Math.cos(a) * rx * 0.76, y = Math.sin(a) * ry * 0.7;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.075, r * 0.045, 0, 0, TAU);
    ctx.fill();
  }
  // fuzzy dome
  const dw = r * 0.5;
  ctx.beginPath();
  ctx.moveTo(-dw, -r * 0.02);
  ctx.bezierCurveTo(-dw * 1.02, -r * 0.62, -dw * 0.55, -r * 0.8, 0, -r * 0.8);
  ctx.bezierCurveTo(dw * 0.55, -r * 0.8, dw * 1.02, -r * 0.62, dw, -r * 0.02);
  ctx.quadraticCurveTo(0, r * 0.13, -dw, -r * 0.02);
  fillStroke(ctx, '#62bdf6', INK, 6);
  // embroidered seam + plush sheen
  ctx.strokeStyle = '#b3e2ff';
  ctx.lineWidth = r * 0.05;
  ctx.beginPath();
  ctx.moveTo(-r * 0.04, -r * 0.76);
  ctx.quadraticCurveTo(-r * 0.12, -r * 0.4, -r * 0.08, r * 0.0);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(-dw * 0.5, -r * 0.5, r * 0.08, r * 0.16, 0.35, 0, TAU);
  ctx.fill();
}
