import { TAU, INK, rand, rrange, clamp, star, fillStroke, heart, lerp } from './util.js';

export const W = 1920, H = 1080;

export function sky(ctx, top, bottom, y0 = 0, y1 = H) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(-200, -200, W + 400, H + 400);
}

export function flash(ctx, a, color = '#fff') {
  if (a <= 0.002) return;
  ctx.save();
  ctx.globalAlpha = clamp(a);
  ctx.fillStyle = color;
  ctx.fillRect(-200, -200, W + 400, H + 400);
  ctx.restore();
}

export function vignette(ctx, strength = 0.5, color = '0,0,0') {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  g.addColorStop(0, `rgba(${color},0)`);
  g.addColorStop(1, `rgba(${color},${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// horizontal speed streaks (dir = +1 moving right => streaks fly left)
export function speedLines(ctx, t, amount = 1, dir = 1, color = 'rgba(255,255,255,0.75)', yMin = 0, yMax = H) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  const n = Math.round(26 * amount);
  for (let i = 0; i < n; i++) {
    const sp = rrange(i, 2600, 4200);
    const len = rrange(i + 7, 120, 420);
    const y = lerp(yMin, yMax, rand(i + 3));
    let x = (rand(i + 11) * (W + 800) - t * sp * dir) % (W + 800);
    if (x < 0) x += W + 800;
    x -= 400;
    ctx.lineWidth = rrange(i + 5, 3, 9);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len * dir, y);
    ctx.stroke();
  }
  ctx.restore();
}

// anime focus lines converging to (cx, cy)
export function focusLines(ctx, t, cx = W / 2, cy = H / 2, amount = 1, color = 'rgba(255,255,255,0.8)', inner = 330) {
  ctx.save();
  ctx.fillStyle = color;
  const n = Math.round(70 * amount);
  const frame = Math.floor(t * 15);
  for (let i = 0; i < n; i++) {
    const a = rand(i * 3 + frame * 131) * TAU;
    const w = rrange(i + frame, 0.004, 0.018);
    const r0 = inner + rand(i * 7 + frame) * 160;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a - w) * 1600, cy + Math.sin(a - w) * 1600);
    ctx.lineTo(cx + Math.cos(a + w) * 1600, cy + Math.sin(a + w) * 1600);
    ctx.fill();
  }
  ctx.restore();
}

// rotating sunburst rays
export function sunburst(ctx, t, cx, cy, c1, c2, n = 18, speed = 0.15) {
  ctx.save();
  ctx.fillStyle = c1;
  ctx.fillRect(-200, -200, W + 400, H + 400);
  ctx.fillStyle = c2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + t * speed;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 3000, cy + Math.sin(a) * 3000);
    ctx.lineTo(cx + Math.cos(a + TAU / n / 2) * 3000, cy + Math.sin(a + TAU / n / 2) * 3000);
    ctx.fill();
  }
  ctx.restore();
}

export function halftone(ctx, color, spacing = 34, maxR = 9, angleFade = 'diag') {
  ctx.save();
  ctx.fillStyle = color;
  for (let y = 0; y < H + spacing; y += spacing) {
    for (let x = (y / spacing) % 2 ? spacing / 2 : 0; x < W + spacing; x += spacing) {
      const f = angleFade === 'diag' ? (x / W + y / H) / 2 : 1;
      const r = maxR * f;
      if (r < 0.6) continue;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function twinkleStars(ctx, t, n = 120, yMax = H * 0.7, seed = 0) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const x = rand(i + seed) * W;
    const y = rand(i * 3 + 1 + seed) * yMax;
    const tw = 0.5 + 0.5 * Math.sin(t * rrange(i, 1.5, 4) + i);
    const r = rrange(i + 9, 1, 3.2) * (0.6 + tw * 0.6);
    ctx.globalAlpha = 0.4 + tw * 0.6;
    ctx.fillStyle = '#fff';
    if (i % 9 === 0) {
      star(ctx, x, y, r * 3, r * 0.9, 4, 0);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

const CONF = ['#ff5d8f', '#ffd84d', '#4cc3ff', '#37c45c', '#b77dff', '#ff8c42'];
export function confetti(ctx, age, n = 140, seed = 1, fall = 1) {
  if (age < 0) return;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const s = i + seed * 1000;
    const x0 = rand(s) * W;
    const vy = rrange(s + 1, 160, 360) * fall;
    const y = -40 - rand(s + 2) * 900 + age * vy;
    if (y > H + 40) continue;
    const x = x0 + Math.sin(age * rrange(s + 3, 1, 3) + s) * 60;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(age * rrange(s + 4, -6, 6));
    ctx.scale(1, Math.cos(age * rrange(s + 5, 3, 9)));
    ctx.fillStyle = CONF[i % CONF.length];
    ctx.fillRect(-9, -5, 18, 10);
    ctx.restore();
  }
  ctx.restore();
}

// upward-floating hearts
export function hearts(ctx, t, n = 16, seed = 3) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const s = i + seed * 77;
    const per = rrange(s, 2.5, 4.5);
    const a = ((t + rand(s + 1) * per) % per) / per;
    const x = rand(s + 2) * W + Math.sin(a * 6 + s) * 30;
    const y = H + 60 - a * (H + 160);
    ctx.globalAlpha = Math.sin(a * Math.PI) * 0.9;
    heart(ctx, x, y, rrange(s + 3, 22, 48));
    fillStroke(ctx, i % 2 ? '#ff7da5' : '#ffb3cf', INK, 4);
  }
  ctx.restore();
}

// expanding dust puffs. puffs: array of [x, y, t0]
export function dust(ctx, t, x, y, t0, n = 6, size = 40, color = '#f1e6d8', dir = -1) {
  const age = t - t0;
  if (age < 0 || age > 0.9) return;
  ctx.save();
  ctx.globalAlpha = 1 - age / 0.9;
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (dir > 0 ? Math.PI : 0) + rrange(i + t0 * 13, -1.2, 0.4);
    const d = age * rrange(i + 3, 120, 260);
    const r = size * (0.5 + age) * rrange(i + 5, 0.6, 1.2);
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * d * -dir, y + Math.sin(a) * d * 0.4 - age * 40, r, 0, TAU);
    fillStroke(ctx, color, 'rgba(58,39,71,0.5)', 4);
  }
  ctx.restore();
}

export function lightning(ctx, x, y0, y1, seed, width = 14, color = '#fffbd1') {
  ctx.save();
  const pts = [[x, y0]];
  const n = 9;
  for (let i = 1; i <= n; i++) {
    pts.push([x + rrange(seed + i, -90, 90) * (i < n ? 1 : 0.3), lerp(y0, y1, i / n)]);
  }
  ctx.shadowColor = '#b9a4ff';
  ctx.shadowBlur = 40;
  ctx.lineJoin = 'miter';
  for (const [lw, c] of [[width * 2.2, 'rgba(185,164,255,0.5)'], [width, color]]) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = c;
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.stroke();
  }
  ctx.restore();
}

export function firework(ctx, cx, cy, age, seed, color) {
  if (age < 0 || age > 1.6) return;
  ctx.save();
  const n = 28;
  const R = 260 * (1 - Math.pow(1 - Math.min(age / 1.1, 1), 3));
  ctx.globalAlpha = 1 - Math.max(0, age - 0.8) / 0.8;
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + seed;
    const x = cx + Math.cos(a) * R;
    const y = cy + Math.sin(a) * R + age * age * 60;
    ctx.beginPath();
    ctx.arc(x, y, 7 * (1 - age / 1.8), 0, TAU);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(cx + Math.cos(a) * R * 0.7, cy + Math.sin(a) * R * 0.7 + age * age * 50);
    ctx.stroke();
  }
  ctx.restore();
}

export function sparkles(ctx, t, cx, cy, radius, n = 14, seed = 5, color = '#fff6a8') {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const s = i + seed * 31;
    const per = rrange(s, 0.8, 1.6);
    const a = ((t + rand(s + 1) * per) % per) / per;
    const ang = rand(s + 2) * TAU;
    const r = radius * (0.4 + rand(s + 3) * 0.8);
    const sz = Math.sin(a * Math.PI) * rrange(s + 4, 10, 24);
    ctx.fillStyle = color;
    star(ctx, cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, sz, sz * 0.28, 4, 0);
    ctx.fill();
  }
  ctx.restore();
}

// smoke trail of puffs behind a moving object; path(tt) => [x,y]
export function smokeTrail(ctx, t, path, len = 1.0, step = 0.05, color = '#fff') {
  ctx.save();
  for (let k = Math.floor(len / step); k >= 1; k--) {
    const tt = t - k * step;
    const [x, y] = path(tt);
    const age = k * step;
    const r = 18 + age * 70;
    ctx.globalAlpha = Math.max(0, 0.85 - age / len);
    ctx.beginPath();
    ctx.arc(x + Math.sin(tt * 40) * 6, y + Math.cos(tt * 33) * 6, r, 0, TAU);
    fillStroke(ctx, color, 'rgba(58,39,71,0.35)', 4);
  }
  ctx.restore();
}

// fluffy wipe transition: white puffs covering the screen (p 0..1 cover, 1..2 uncover)
export function fluffWipe(ctx, p) {
  if (p <= 0 || p >= 2) return;
  ctx.save();
  const cover = p <= 1 ? p : 2 - p;
  for (let i = 0; i < 60; i++) {
    const x = rand(i) * W;
    const y = rand(i + 99) * H;
    const r = cover * rrange(i + 5, 220, 420);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    fillStroke(ctx, i % 5 ? '#ffffff' : '#f3eefa', 'rgba(58,39,71,0.25)', 5);
  }
  ctx.restore();
}

export function shadow(ctx, x, y, rx, a = 0.22) {
  ctx.save();
  ctx.fillStyle = `rgba(40,20,60,${a})`;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, rx * 0.16, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}
