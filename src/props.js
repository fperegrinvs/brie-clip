// Backgrounds, sets and side characters.
import { TAU, INK, blob, fillStroke, clover, rand, rrange, lerp, star, heart, clamp } from './util.js';
import { W, H } from './fx.js';

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
    blob(ctx, [[x, y, 70 * s], [x + 70 * s, y + 10, 55 * s], [x - 70 * s, y + 14, 50 * s], [x + 20 * s, y - 34 * s, 55 * s]], '#ffffff', 5, 'rgba(58,39,71,0.35)');
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
  if (deco) {
    // little clovers and flowers on the hill
    for (let i = 0; i < 40; i++) {
      const span = W + 200;
      let x = (i * 97 + rand(i + seed) * 60 - off) % span;
      if (x < -100) x += span;
      const wx = x + off;
      const yy = y - amp * (0.6 * Math.sin(wx / 410 + seed) + 0.4 * Math.sin(wx / 170 + seed * 2)) + 40 + rand(i * 3) * 160;
      if (i % 3 === 0) clover(ctx, x, yy, 16, rand(i) - 0.5, '#5fd77a', 3);
      else {
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
    // crenels
    ctx.beginPath();
    ctx.moveTo(tx - w / 2 - 14, -h);
    ctx.lineTo(tx, -h - w * 0.95);
    ctx.lineTo(tx + w / 2 + 14, -h);
    ctx.closePath();
    fillStroke(ctx, roof, INK, 6);
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
    ctx.beginPath();
    ctx.roundRect(tx - 14, -h + 40, 28, 46, [14, 14, 0, 0]);
    fillStroke(ctx, win, INK, 4);
  };
  tower(-260, 120, 420);
  tower(260, 120, 420);
  tower(0, 160, 560);
  // main wall
  ctx.beginPath();
  ctx.rect(-260, -300, 520, 300);
  fillStroke(ctx, wall, INK, 6);
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
  ctx.fillStyle = 'rgba(220,200,150,0.5)';
  for (const [dx, dy, rr] of [[-0.3, -0.2, 0.18], [0.25, 0.2, 0.13], [0.1, -0.35, 0.09]]) {
    ctx.beginPath();
    ctx.arc(x + dx * r, y + dy * r, rr * r, 0, TAU);
    ctx.fill();
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
      }
    }
  } else {
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
  }
  // baseboard
  ctx.fillStyle = th.base;
  ctx.fillRect(-200, FLOOR_Y - 26, W + 400, 26);
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
      fillStroke(ctx, g, INK, 8);
      blob(ctx, [[110, -520, 30], [150, -515, 26], [80, -512, 22]], '#fff', 0);
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
      fillStroke(ctx, '#ffe58a', INK, 6);
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
        ctx.restore();
      }
      ctx.beginPath();
      ctx.moveTo(20, -170);
      ctx.lineTo(140, -170);
      ctx.lineTo(120, 0);
      ctx.lineTo(40, 0);
      ctx.closePath();
      fillStroke(ctx, '#ff8c42', INK, 6);
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
        }
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
      ctx.beginPath();
      ctx.roundRect(90, -450, 160, 110, 18);
      fillStroke(ctx, '#ff8c42', INK, 6);
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
      ctx.beginPath();
      ctx.roundRect(150, -470, 110, 120, 30);
      fillStroke(ctx, '#ffe58a', INK, 6);
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
      ctx.beginPath();
      ctx.arc(255, -320, 16, 0, TAU);
      fillStroke(ctx, '#ffd84d', INK, 4);
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
  ctx.restore();
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
    ctx.restore();
  }
  // tail
  ctx.beginPath();
  ctx.moveTo(-60, -130);
  ctx.quadraticCurveTo(-200, -110 + Math.sin(ph * 2) * 20, -260, -60 + Math.sin(ph * 2) * 30);
  ctx.quadraticCurveTo(-180, -80, -50, -80);
  ctx.closePath();
  fillStroke(ctx, G, INK, 6);
  // body
  ctx.beginPath();
  ctx.ellipse(0, -140, 70, 85, 0.15, 0, TAU);
  fillStroke(ctx, G, INK, 6);
  ctx.beginPath();
  ctx.ellipse(18, -130, 40, 62, 0.15, 0, TAU);
  fillStroke(ctx, BELLY, INK, 4);
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
  blob(ctx, leaves, '#7ad46a', 6);
  blob(ctx, [[0, 0, r * 0.78]], '#a6e88c', 6);
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
export function rocketPack(ctx, t) {
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
  ctx.fillStyle = '#f2b928';
  for (const [hx, hy, hr] of [[-40, -10, 18], [20, 30, 13], [60, 5, 10], [-60, 40, 12]]) {
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, TAU);
    ctx.fill();
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
  blob(ctx, puff, '#f7c45a', 7);
  ctx.fillStyle = '#e09a2e';
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.arc(Math.cos(i * 2.4) * r * 0.6 * rand(i), Math.sin(i * 2.4) * r * 0.6 * rand(i + 3), r * 0.05, 0, TAU);
    ctx.fill();
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
