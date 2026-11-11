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

/* The cartoon cut's richer drawing style. Off by default, so the original clip and the game
 * draw exactly as they always have; src/toon/main.js switches it on. */
export const DETAIL = { on: false };
export function setDetail(v) { DETAIL.on = !!v; }

// how many screen pixels one drawing unit covers: fine detail is skipped on small drawings
export function drawScale(ctx) {
  const m = ctx.getTransform();
  return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
}

// unit vector, in the current drawing space, pointing away from the light (which sits top-left on screen)
export function lightDir(ctx) {
  const m = ctx.getTransform();
  const det = m.a * m.d - m.b * m.c || 1;
  const x = (m.d * 0.58 - m.c * 0.81) / det, y = (-m.b * 0.58 + m.a * 0.81) / det;
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}

function subPath(ctx, s, ox, oy) {
  if (s.length === 3) {
    ctx.moveTo(s[0] + ox + s[2], s[1] + oy);
    ctx.arc(s[0] + ox, s[1] + oy, s[2], 0, TAU);
  } else {
    const r = s[4] || 0;
    ctx.moveTo(s[0] + ox + s[2] * Math.cos(r), s[1] + oy + s[2] * Math.sin(r));
    ctx.ellipse(s[0] + ox, s[1] + oy, s[2], s[3], r, 0, TAU);
  }
}

/**
 * Two-tone form shadow for a blob just drawn with `fill`: the part of the blob that the same
 * blob, slid `d` toward the light, does not cover is left in `shade`.
 */
export function shadeBlob(ctx, shapes, fill, shade, d = 10) {
  const [lx, ly] = lightDir(ctx);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of shapes) {
    const r = s.length === 3 ? s[2] : Math.max(s[2], s[3]);
    x0 = Math.min(x0, s[0] - r); y0 = Math.min(y0, s[1] - r);
    x1 = Math.max(x1, s[0] + r); y1 = Math.max(y1, s[1] + r);
  }
  ctx.save();
  ctx.beginPath();
  for (const s of shapes) subPath(ctx, s, 0, 0);
  ctx.clip();
  ctx.fillStyle = shade;
  ctx.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4);
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (const s of shapes) subPath(ctx, s, -lx * d, -ly * d);
  ctx.fill();
  ctx.restore();
}

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
    // detail mode: a thick-and-thin line, heavier on the side away from the light
    let ox = 0, oy = 0, grow = lw / 2;
    if (DETAIL.on) {
      const [lx, ly] = lightDir(ctx);
      ox = lx * lw * 0.13;
      oy = ly * lw * 0.13;
      grow = lw * 0.52;
    }
    for (const s of shapes) {
      ctx.beginPath();
      if (s.length === 3) ctx.arc(s[0] + ox, s[1] + oy, s[2] + grow, 0, TAU);
      else ctx.ellipse(s[0] + ox, s[1] + oy, s[2] + grow, s[3] + grow, s[4] || 0, 0, TAU);
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

// mix two #rrggbb colours
export function mixHex(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  let out = '#';
  for (const sh of [16, 8, 0]) {
    const v = Math.round(lerp((pa >> sh) & 255, (pb >> sh) & 255, k));
    out += v.toString(16).padStart(2, '0');
  }
  return out;
}
const SHADES = {};
// the shadow tone of a flat colour: pulled toward a cool violet
export function shadeOf(c, k = 0.24) {
  return SHADES[c + k] || (SHADES[c + k] = c[0] === '#' && c.length === 7 ? mixHex(c, '#5b3f8a', k) : c);
}
// blob() that, in detail mode, also gets its form shadow
export function dblob(ctx, shapes, fill, lw = 6, d = 9, k = 0.24) {
  blob(ctx, shapes, fill, lw);
  if (DETAIL.on) shadeBlob(ctx, shapes, fill, shadeOf(fill, k), d);
}
