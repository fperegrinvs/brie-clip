export const TAU = Math.PI * 2;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const inv = (a, b, v) => clamp((v - a) / (b - a));
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t) => Math.pow(clamp(t), 3);
export const easeInOut = (t) => {
  t = clamp(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const easeOutBack = (t) => {
  t = clamp(t);
  const c1 = 2.2, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const easeOutElastic = (t) => {
  t = clamp(t);
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1;
};

// deterministic pseudo-random from integer seed
export function rand(seed) {
  let x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
export const rrange = (seed, a, b) => a + rand(seed) * (b - a);

// smooth deterministic noise
export function noise(t, seed = 0) {
  const i = Math.floor(t), f = t - i;
  const u = f * f * (3 - 2 * f);
  return lerp(rand(i + seed * 101.7), rand(i + 1 + seed * 101.7), u) * 2 - 1;
}

export const INK = '#3a2747';

/**
 * Draw a union of circles/ellipses as one blob with a single outline.
 * shapes: [x, y, r] or [x, y, rx, ry, rot]
 */
export function blob(ctx, shapes, fill, lw = 6, stroke = INK) {
  const path = (s) => {
    ctx.beginPath();
    if (s.length === 3) ctx.arc(s[0], s[1], s[2], 0, TAU);
    else ctx.ellipse(s[0], s[1], s[2], s[3], s[4] || 0, 0, TAU);
  };
  if (lw > 0) {
    ctx.fillStyle = stroke;
    for (const s of shapes) {
      ctx.beginPath();
      if (s.length === 3) ctx.arc(s[0], s[1], s[2] + lw / 2, 0, TAU);
      else ctx.ellipse(s[0], s[1], s[2] + lw / 2, s[3] + lw / 2, s[4] || 0, 0, TAU);
      ctx.fill();
    }
  }
  ctx.fillStyle = fill;
  for (const s of shapes) {
    path(s);
    ctx.fill();
  }
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function fillStroke(ctx, fill, stroke = INK, lw = 6) {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (lw > 0 && stroke) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

export function star(ctx, x, y, r1, r2, n, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? r2 : r1;
    const a = rot + (i / (n * 2)) * TAU - Math.PI / 2;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}

// four-leaf clover
export function clover(ctx, x, y, s, rot, fill = '#3fbf5a', lw = 4) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(s * 0.15, s * 0.6, -s * 0.05, s * 1.1);
  ctx.lineWidth = lw * 1.4;
  ctx.strokeStyle = INK;
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 2 + Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-s * 0.55, -s * 0.35, -s * 0.5, -s * 0.95, 0, -s * 0.62);
    ctx.bezierCurveTo(s * 0.5, -s * 0.95, s * 0.55, -s * 0.35, 0, 0);
    fillStroke(ctx, fill, INK, lw);
    ctx.restore();
  }
  ctx.restore();
}

export function heart(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s, y - s * 0.3, x - s * 0.4, y - s, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.4, y - s, x + s, y - s * 0.3, x, y + s * 0.35);
  ctx.closePath();
}
