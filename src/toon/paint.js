// Painterly helpers for the detailed style: wood grain, wallpaper motifs, grass, light.
// Everything here is a pure function of its arguments, so frames stay reproducible.
import { TAU, rand, clamp } from '../util.js';

/** Wavy grain lines inside a rect. */
export function grain(ctx, x, y, w, h, color, n = 3, seed = 0, lw = 2) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const yy = y + ((i + 0.5 + (rand(seed + i * 7) - 0.5) * 0.6) / n) * h;
    const x0 = x + rand(seed + i * 3 + 1) * w * 0.35, x1 = x + w - rand(seed + i * 5 + 2) * w * 0.35;
    const b = (rand(seed + i * 11 + 3) - 0.5) * h * 0.5;
    ctx.beginPath();
    ctx.moveTo(x0, yy);
    ctx.bezierCurveTo(x0 + (x1 - x0) * 0.3, yy + b, x0 + (x1 - x0) * 0.7, yy - b, x1, yy);
    ctx.stroke();
  }
  ctx.restore();
}

/** Vertical grain (door panels, shelf sides). */
export function grainV(ctx, x, y, w, h, color, n = 3, seed = 0, lw = 2) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const xx = x + ((i + 0.5 + (rand(seed + i * 7) - 0.5) * 0.6) / n) * w;
    const y0 = y + rand(seed + i * 3 + 1) * h * 0.3, y1 = y + h - rand(seed + i * 5 + 2) * h * 0.3;
    const b = (rand(seed + i * 11 + 3) - 0.5) * w * 0.5;
    ctx.beginPath();
    ctx.moveTo(xx, y0);
    ctx.bezierCurveTo(xx + b, y0 + (y1 - y0) * 0.3, xx - b, y0 + (y1 - y0) * 0.7, xx, y1);
    ctx.stroke();
  }
  ctx.restore();
}

/** A knot in the wood. */
export function knot(ctx, x, y, r, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.55, 0, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.9, r * 1.1, 0, 0.3, Math.PI - 0.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.9, r * 1.1, 0, Math.PI + 0.3, TAU - 0.3);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.4, r * 0.25, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** Small flat motif stamps for wallpaper. */
export function motif(ctx, kind, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  if (kind === 'clover') {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + 0.78;
      ctx.moveTo(x + Math.cos(a) * s * 0.5 + s * 0.45, y + Math.sin(a) * s * 0.5);
      ctx.arc(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5, s * 0.45, 0, TAU);
    }
  } else if (kind === 'diamond') {
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.7, y);
    ctx.lineTo(x, y + s);
    ctx.lineTo(x - s * 0.7, y);
    ctx.closePath();
  } else if (kind === 'star') {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU - Math.PI / 2, r = i % 2 ? s * 0.45 : s;
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
  } else if (kind === 'moon') {
    ctx.arc(x, y, s, 0.6, TAU - 0.6);
    ctx.arc(x + s * 0.55, y, s * 0.75, TAU - 0.9, 0.9, true);
    ctx.closePath();
  } else ctx.arc(x, y, s, 0, TAU);
  ctx.fill();
}

/** Grass tuft: three blades fanning up from (x, y). */
export function tuft(ctx, x, y, s, color, lean = 0, lw = 3) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [dx, h] of [[-0.55, 0.75], [0, 1], [0.55, 0.7]]) {
    ctx.moveTo(x + dx * s * 0.5, y);
    ctx.quadraticCurveTo(x + dx * s * 0.7, y - h * s * 0.6, x + (dx * 1.2 + lean) * s, y - h * s);
  }
  ctx.stroke();
}

/** Soft elliptical pool of light (or of shadow, with a dark colour). rgb = 'r,g,b'. */
export function pool(ctx, x, y, rx, ry, rgb, a = 0.3) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(0.6, `rgba(${rgb},${a * 0.45})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/**
 * A shaft of light slanting down from a window, with dust motes drifting in it.
 * (x, y) top-left of the opening, w its width, len how far it reaches, slant = dx/dy.
 */
export function shaft(ctx, x, y, w, len, slant = 0.45, a = 0.16, t = 0, seed = 0, rgb = '255,244,200') {
  ctx.save();
  const dx = slant * len, spread = w * 0.35;
  const g = ctx.createLinearGradient(x, y, x + dx, y + len);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w + dx + spread, y + len);
  ctx.lineTo(x + dx - spread, y + len);
  ctx.closePath();
  ctx.fill();
  // motes: slow drift, each fading in and out
  for (let i = 0; i < 14; i++) {
    const u = (rand(seed + i * 3) + t * (0.02 + 0.03 * rand(seed + i * 5))) % 1;
    const v = rand(seed + i * 7 + 1);
    const px = x + v * w + dx * u + Math.sin(t * 0.7 + i * 1.7) * 14;
    const py = y + u * len * 0.9;
    const al = Math.sin(u * Math.PI) * (0.35 + 0.35 * Math.sin(t * 1.3 + i * 2.1));
    if (al <= 0.02) continue;
    ctx.fillStyle = `rgba(255,252,230,${clamp(al)})`;
    ctx.beginPath();
    ctx.arc(px, py, 2 + rand(seed + i * 9) * 2.5, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/** Vertical gradient rect between two rgba colours. */
export function vgrad(ctx, x, y, w, h, c0, c1) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}
/** Horizontal gradient rect. */
export function hgrad(ctx, x, y, w, h, c0, c1) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

/** Diagonal sheen streaks on glass or enamel, clipped to a rect. */
export function sheen(ctx, x, y, w, h, a = 0.35) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = `rgba(255,255,255,${a})`;
  for (const [u, k] of [[0.18, 0.09], [0.34, 0.035]]) {
    ctx.beginPath();
    ctx.moveTo(x + w * u + h * 0.35, y);
    ctx.lineTo(x + w * (u + k) + h * 0.35, y);
    ctx.lineTo(x + w * (u + k) - h * 0.35, y + h);
    ctx.lineTo(x + w * u - h * 0.35, y + h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Drifting petals / leaves across the frame. kinds of colour cycle through `colors`. */
export function petals(ctx, t, n = 14, colors = ['#ffd1e3', '#ffffff', '#ffe58a'], seed = 0, wind = 60, y0 = 0, y1 = 1080) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const sp = 0.6 + rand(seed + i * 3) * 0.8;
    const span = 1920 + 200;
    let x = (rand(seed + i * 7) * span + t * wind * sp) % span;
    const life = (rand(seed + i * 5) + t * 0.05 * sp) % 1;
    const y = y0 + life * (y1 - y0) + Math.sin(t * 1.3 * sp + i) * 26;
    ctx.save();
    ctx.translate(x - 100, y);
    ctx.rotate(t * 1.6 * sp + i);
    ctx.scale(1, 0.55 + 0.4 * Math.sin(t * 2.2 * sp + i * 2));
    ctx.globalAlpha *= 0.85 * Math.sin(life * Math.PI);
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/** Four-point star glint. */
export function glint(ctx, x, y, r, a = 1, color = '#ffffff') {
  if (a <= 0.02 || r < 0.5) return;
  ctx.save();
  ctx.globalAlpha *= clamp(a);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rr = i % 2 ? r * 0.22 : r, an = (i / 8) * TAU;
    ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Shading for a round planet already drawn at (x, y, r): bands, a terminator shadow, a highlight. */
export function planetShade(ctx, x, y, r, band, n = 3) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r - 2, 0, TAU);
  ctx.clip();
  ctx.strokeStyle = band;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const by = y - r * 0.55 + (i * r * 1.1) / Math.max(1, n - 1);
    ctx.lineWidth = r * (0.1 + 0.05 * (i % 2));
    ctx.beginPath();
    ctx.moveTo(x - r, by + r * 0.12);
    ctx.quadraticCurveTo(x, by - r * 0.1, x + r, by + r * 0.14);
    ctx.stroke();
  }
  const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.4, x - r * 0.2, y - r * 0.2, r * 1.45);
  g.addColorStop(0, 'rgba(30,15,80,0)');
  g.addColorStop(1, 'rgba(30,15,80,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.4, y - r * 0.45, r * 0.26, r * 0.15, -0.6, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// one flame layer blowing toward -x from a mouth at x = 0: swept-back tongues along both edges, a wavering tip
function flameShape(ctx, len, h, d, seed, K) {
  const w = (u) => h * Math.pow(Math.max(0, 1 - u), 0.6) * (1 + 0.28 * Math.sin(Math.PI * clamp(u / 0.55)));
  const p = (d * 0.37) % 1; // tongues stream back, a step per drawing
  const tipY = (rand(seed + d * 3.1) - 0.5) * h * 0.5;
  const edge = (sg, so) => {
    const pts = [];
    for (let k = 0; k <= K; k++) {
      const u0 = k === 0 ? 0 : (k - 1 + p) / K, u1 = Math.min(1, (k + p) / K);
      if (u1 - u0 < 0.02) continue;
      const um = (u0 + u1) / 2;
      const th = h * 0.62 * Math.sin(Math.PI * clamp(um * 1.05 + 0.08)) * (0.55 + 0.75 * rand(seed + so + (k - Math.floor(d * 0.37)) * 7.3)) * Math.min(1, (u1 - u0) * K * 1.4);
      pts.push([u0, u1, th]);
    }
    return pts.map(([u0, u1, th]) => {
      const span = u1 - u0;
      return {
        c1: [-(u0 + span * 0.3) * len, sg * (w(u0 + span * 0.3) + th * 1.15)],
        tip: [-(u0 + span * 0.98) * len, sg * (w(u0 + span * 0.9) + th * 0.8)],
        c2: [-(u0 + span * 0.72) * len, sg * (w(u1) + th * 0.12)],
        end: [-u1 * len, u1 >= 1 ? tipY : sg * w(u1)],
      };
    });
  };
  const top = edge(-1, 0), bot = edge(1, 41);
  ctx.beginPath();
  ctx.moveTo(0, -h);
  for (const g of top) {
    ctx.quadraticCurveTo(g.c1[0], g.c1[1], g.tip[0], g.tip[1]);
    ctx.quadraticCurveTo(g.c2[0], g.c2[1], g.end[0], g.end[1]);
  }
  // back along the lower edge
  for (let i = bot.length - 1; i >= 0; i--) {
    const g = bot[i], prev = i > 0 ? bot[i - 1].end : [0, h];
    ctx.quadraticCurveTo(g.c2[0], g.c2[1], g.tip[0], g.tip[1]);
    ctx.quadraticCurveTo(g.c1[0], g.c1[1], prev[0], prev[1]);
  }
  // a rounded mouth, so the fire does not start at a flat cut
  ctx.bezierCurveTo(h * 0.75, h, h * 0.75, -h, 0, -h);
  ctx.closePath();
}

/**
 * A cartoon jet flame blowing toward -x from (x, y). `len` long, `h` half as tall as its mouth;
 * `d` is the drawing number (it boils on twos), `t` the clock for the sparks.
 */
export function flame(ctx, x, y, len, h, d, t, seed = 0, ink = '#2b1b3d') {
  ctx.save();
  ctx.translate(x, y);
  const fl = 0.86 + 0.28 * rand(seed + d * 5.7);
  ctx.lineJoin = 'round';
  // heat in the air around it
  pool(ctx, -len * 0.42, 0, len * 0.8, h * 2.6, '255,170,70', 0.34);
  // outer flame, drawn line and all
  flameShape(ctx, len * fl, h, d, seed + 1, 5);
  ctx.fillStyle = '#ff5a2e';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = ink;
  ctx.stroke();
  // darker licks inside the outer flame's edge
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(214,44,30,0.75)';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const u = (i + ((d * 0.37) % 1)) / 6, sg = i % 2 ? 1 : -1;
    const yy = sg * h * (0.78 - 0.5 * u), xx = -u * len * fl;
    ctx.beginPath();
    ctx.moveTo(xx, yy);
    ctx.quadraticCurveTo(xx - len * 0.06, yy + sg * h * 0.16, xx - len * 0.13, yy - sg * h * 0.04);
    ctx.stroke();
  }
  ctx.restore();
  // the hotter layers
  for (const [kl, kh, K, col, line] of [[0.8, 0.72, 4, '#ff9838', '#f06a1e'], [0.58, 0.47, 3, '#ffd23f', '#ffae2e'], [0.36, 0.25, 2, '#fff6b8', null]]) {
    flameShape(ctx, len * fl * kl, h * kh, d + 1, seed + K * 13, K);
    ctx.fillStyle = col;
    ctx.fill();
    if (line) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = line;
      ctx.stroke();
    }
  }
  // white-hot heart with shock diamonds
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 3; i++) {
    const r = h * (0.17 - i * 0.04) * (0.85 + 0.3 * rand(seed + d * 2.3 + i));
    ctx.beginPath();
    ctx.ellipse(-len * (0.05 + i * 0.075) * fl, 0, r * 1.7, r, 0, 0, TAU);
    ctx.fill();
  }
  // flames torn loose past the tip
  for (let i = 0; i < 4; i++) {
    const u = (t * 2.6 + i / 4 + rand(seed + i) * 0.2) % 1;
    const fx = -len * fl * (0.9 + u * 0.55), fy = (rand(seed + i * 9.1 + Math.floor(t * 2.6 + i / 4)) - 0.5) * h * 1.5, r = h * 0.3 * (1 - u);
    if (r < 3) continue;
    ctx.beginPath();
    ctx.moveTo(fx + r * 1.2, fy);
    ctx.quadraticCurveTo(fx + r * 0.2, fy - r * 1.1, fx - r * 1.9, fy - r * 0.2);
    ctx.quadraticCurveTo(fx + r * 0.1, fy + r * 1.0, fx + r * 1.2, fy);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? '#ff9838' : '#ff5a2e';
    ctx.fill();
    ctx.lineWidth = Math.min(4, r * 0.3);
    ctx.strokeStyle = ink;
    ctx.stroke();
  }
  // sparks
  for (let i = 0; i < 12; i++) {
    const u = (t * (1.6 + rand(seed + i * 3.7)) + rand(seed + i * 1.9)) % 1;
    const sx = -len * (0.25 + u * 1.25), sy = (rand(seed + i * 5.3) - 0.5) * h * 3 * (0.4 + u) - u * u * h * 0.8;
    glint(ctx, sx, sy, (1 - u) * (10 + 12 * rand(seed + i)), 1 - u * 0.6, i % 3 ? '#ffe37a' : '#ffffff');
  }
  ctx.restore();
}

/** A billow of smoke: a lumpy cloud with an ink line, shaded underneath, a curl or two inside. */
export function smoke(ctx, x, y, r, seed = 0, fill = '#ffffff', ink = '#2b1b3d', lw = 5) {
  if (r < 2) return;
  const lumps = [[0, 0, r * 0.78]];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + rand(seed + i * 3.1) * 0.7, d = r * (0.5 + 0.18 * rand(seed + i * 5.3));
    lumps.push([Math.cos(a) * d, Math.sin(a) * d * 0.85, r * (0.42 + 0.2 * rand(seed + i * 7.7))]);
  }
  const trace = (grow) => {
    ctx.beginPath();
    for (const [lx, ly, lr] of lumps) {
      ctx.moveTo(lx + lr + grow, ly);
      ctx.arc(lx, ly, lr + grow, 0, TAU);
    }
  };
  ctx.save();
  ctx.translate(x, y);
  trace(lw);
  ctx.fillStyle = ink;
  ctx.fill();
  trace(0);
  ctx.fillStyle = fill;
  ctx.fill();
  // shade on the side away from the light
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(140,120,196,0.3)';
  ctx.fillRect(-r * 2, -r * 2, r * 4, r * 4);
  ctx.translate(-r * 0.13, -r * 0.2);
  trace(0);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(140,120,196,0.5)';
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(-r * 0.25, -r * 0.2, r * 0.3, 1.05 * Math.PI, 1.8 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(r * 0.28, r * 0.12, r * 0.24, 1.2 * Math.PI, 1.9 * Math.PI);
  ctx.stroke();
  ctx.restore();
}
