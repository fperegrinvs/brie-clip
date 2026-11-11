// Brie IS every character in the song: costumes she wears instead of
// separate characters. costume(kind, t) returns hook options for
// drawBreeSide / drawBreeFront: { under, overBody, overHead, noTail }.
// Hook coordinates are Brie-local: side head centre (98,-150), front head (0,-196).
import { TAU, INK, blob, dblob, fillStroke, lerp } from './util.js';
import { paoDeQueijo, rocketPack } from './props.js';

const GREEN = '#43b75c', GREEN_D = '#2f8f45';
const LEAF = '#7ad46a', LEAF_L = '#a6e88c', LEAF_V = '#4f9f45';

/* ---------------- crocodile ---------------- */
function crocTailSide(ctx, t) {
  ctx.save();
  ctx.translate(-70, -96);
  ctx.rotate(0.1 * Math.sin(t * 9));
  ctx.beginPath();
  ctx.moveTo(10, -30);
  ctx.quadraticCurveTo(-120, -30, -250, 20);
  ctx.quadraticCurveTo(-120, 20, 10, 34);
  ctx.closePath();
  fillStroke(ctx, GREEN, INK, 6);
  ctx.fillStyle = GREEN_D;
  for (let i = 0; i < 4; i++) {
    const x = -40 - i * 48, y = -26 + i * 9;
    ctx.beginPath();
    ctx.moveTo(x + 16, y + 2);
    ctx.lineTo(x, y - 22 + i * 3);
    ctx.lineTo(x - 16, y + 4);
    ctx.closePath();
    fillStroke(ctx, GREEN_D, INK, 4);
  }
  ctx.restore();
}
function backSpikes(ctx) {
  for (let i = 0; i < 5; i++) {
    const x = -70 + i * 32;
    const y = -92 - Math.sqrt(Math.max(0, 1 - (x / 98) ** 2)) * 62 + 6;
    ctx.beginPath();
    ctx.moveTo(x - 15, y + 6);
    ctx.lineTo(x, y - 24);
    ctx.lineTo(x + 15, y + 6);
    ctx.closePath();
    fillStroke(ctx, GREEN, INK, 4);
  }
}
function teeth(ctx, x0, x1, y, n, down = 1) {
  const step = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * step;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + step / 2, y + 16 * down);
    ctx.lineTo(x + step, y);
    ctx.closePath();
    fillStroke(ctx, '#ffffff', INK, 3);
  }
}
function crocEye(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  fillStroke(ctx, GREEN, INK, 5);
  ctx.beginPath();
  ctx.arc(x, y - 3, r * 0.6, 0, TAU);
  fillStroke(ctx, '#ffffff', INK, 3);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(x + r * 0.15, y - 3, r * 0.3, 0, TAU);
  ctx.fill();
}
function crocHoodSide(ctx) {
  ctx.save();
  ctx.translate(98, -150);
  // hood over the skull + long upper jaw over the muzzle
  ctx.beginPath();
  ctx.moveTo(-78, 14);
  ctx.bezierCurveTo(-88, -70, -10, -112, 50, -78);
  ctx.quadraticCurveTo(140, -62, 196, -46);
  ctx.quadraticCurveTo(214, -36, 200, -18);
  ctx.quadraticCurveTo(120, -22, 46, -26);
  ctx.quadraticCurveTo(-30, -28, -50, 20);
  ctx.closePath();
  fillStroke(ctx, GREEN, INK, 6);
  teeth(ctx, 52, 196, -24, 6);
  // nostril bump
  ctx.beginPath();
  ctx.arc(188, -46, 9, 0, TAU);
  fillStroke(ctx, GREEN_D, INK, 4);
  crocEye(ctx, -6, -92, 24);
  crocEye(ctx, 34, -96, 22);
  ctx.restore();
}
function crocHoodFront(ctx, o) {
  ctx.save();
  ctx.translate(0, -196);
  ctx.rotate(o.tilt ?? 0);
  ctx.translate(0, -36);
  ctx.scale(0.82, 0.82);
  ctx.beginPath();
  ctx.ellipse(0, -40, 150, 125, 0, Math.PI * 1.02, Math.PI * 1.98);
  ctx.lineTo(150, 30);
  ctx.quadraticCurveTo(0, -40, -150, 30);
  ctx.closePath();
  fillStroke(ctx, GREEN, INK, 7);
  for (let i = 0; i < 9; i++) {
    const x = -120 + i * 30;
    const yb = -10 + Math.abs(x) * 0.15;
    ctx.beginPath();
    ctx.moveTo(x - 12, yb - 8);
    ctx.lineTo(x, yb + 14);
    ctx.lineTo(x + 12, yb - 8);
    ctx.closePath();
    fillStroke(ctx, '#ffffff', INK, 3);
  }
  crocEye(ctx, -60, -150, 34);
  crocEye(ctx, 60, -150, 34);
  ctx.restore();
}

/* ---------------- pão de queijo ---------------- */
function cheeseBodySide(ctx, t) {
  ctx.save();
  ctx.translate(0, -88);
  ctx.scale(1.12, 0.66);
  paoDeQueijo(ctx, 100, t);
  ctx.restore();
}
function cheeseBodyFront(ctx, t) {
  ctx.save();
  ctx.translate(0, -88);
  paoDeQueijo(ctx, 98, t);
  ctx.restore();
}
function cheeseCap(ctx, x, y, r) {
  // little puffy cheese-bread beret
  const puff = [[x, y, r, r * 0.55, 0]];
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + (i / 6) * Math.PI;
    puff.push([x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.45, r * 0.3]);
  }
  dblob(ctx, puff, '#f7c45a', 6);
  ctx.fillStyle = '#e09a2e';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(x - r * 0.5 + i * r * 0.25, y - r * 0.2 + (i % 2) * 8, r * 0.07, 0, TAU);
    ctx.fill();
  }
}

/* ---------------- shared: onesie hood framing the face ---------------- */
// crescent = outer circle (O,R) minus face opening (F,r). Returns arc info.
function hoodGeom(ox, oy, R, fx, fy, r) {
  const d = Math.hypot(fx - ox, fy - oy);
  const a = (R * R - r * r + d * d) / (2 * d);
  const phi = Math.atan2(fy - oy, fx - ox);
  const alpha = Math.acos(Math.max(-1, Math.min(1, a / R)));
  const beta = Math.acos(Math.max(-1, Math.min(1, (d - a) / r)));
  return { ox, oy, R, fx, fy, r, o0: phi + alpha, o1: phi + TAU - alpha, f0: phi + Math.PI + beta, f1: phi + Math.PI - beta };
}
function hoodPath(ctx, g) {
  ctx.beginPath();
  ctx.arc(g.ox, g.oy, g.R, g.o0, g.o1, false);
  ctx.arc(g.fx, g.fy, g.r, g.f0, g.f1, true);
  ctx.closePath();
}
function hoodFaceEdge(ctx, g, lw = 6) {
  ctx.beginPath();
  ctx.arc(g.fx, g.fy, g.r, g.f0, g.f1, true);
  ctx.strokeStyle = INK;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.stroke();
}
// points along the outer arc
function hoodRim(g, n, rad = g.R, pad = 0.12) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = lerp(g.o0 + pad, g.o1 - pad, i / (n - 1));
    pts.push([g.ox + Math.cos(a) * rad, g.oy + Math.sin(a) * rad, a]);
  }
  return pts;
}
const SIDE_HOOD = () => hoodGeom(84, -164, 84, 150, -134, 70);
const FRONT_HOOD = () => hoodGeom(0, -208, 104, 0, -172, 82);

/* ---------------- côve: cabbage-leaf hood + leafy tunic ---------------- */
const CV = '#4faa4a', CV_L = '#86d672', CV_D = '#3c8f3c', CV_V = '#e3f8cf';
function veins(ctx, g, n) {
  ctx.strokeStyle = CV_V;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = lerp(g.o0 + 0.35, g.o1 - 0.35, i / (n - 1));
    const x1 = g.ox + Math.cos(a) * (g.R - 12), y1 = g.oy + Math.sin(a) * (g.R - 12);
    // start a bit outside the face edge, toward the rim point
    const fa = Math.atan2(y1 - g.fy, x1 - g.fx);
    const x0 = g.fx + Math.cos(fa) * (g.r + 8), y0 = g.fy + Math.sin(fa) * (g.r + 8);
    if (Math.hypot(x1 - x0, y1 - y0) < 16) continue;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo((x0 + x1) / 2 + 6, (y0 + y1) / 2 - 6, x1, y1);
    ctx.stroke();
  }
}
function cabbageHood(ctx, g, t, stem) {
  // ruffled outer leaf layer, then the smooth inner leaf
  const ruff = hoodRim(g, 13, g.R - 4, 0.02).map(([x, y], i) => [x, y, 24 + 4 * Math.sin(i * 2.1 + t * 5)]);
  dblob(ctx, ruff, CV, 6);
  hoodPath(ctx, g);
  ctx.fillStyle = CV_L;
  ctx.fill();
  veins(ctx, g, 7);
  hoodFaceEdge(ctx, g);
  if (!stem) return;
  // little curled leaf tip on top
  const [tx, ty] = hoodRim(g, 3)[1];
  ctx.beginPath();
  ctx.moveTo(tx - 6, ty + 4);
  ctx.quadraticCurveTo(tx - 4, ty - 34, tx + 22, ty - 30);
  ctx.quadraticCurveTo(tx + 14, ty - 10, tx + 8, ty + 4);
  ctx.closePath();
  fillStroke(ctx, CV_L, INK, 5);
}
function leafTunic(ctx, cx, cy, rx, ry, view) {
  // snug leaf wrap: overlapping broad leaves with a scalloped hem
  const parts = [[cx, cy, rx, ry, 0]];
  const n = view === 'side' ? 6 : 5;
  for (let i = 0; i < n; i++) {
    const a = lerp(0.25, Math.PI - 0.25, i / (n - 1));
    parts.push([cx + Math.cos(a) * rx * 0.86, cy + Math.sin(a) * ry * 0.8, ry * 0.32]);
  }
  dblob(ctx, parts, CV, 6);
  // two big overlapping leaves with midribs
  ctx.strokeStyle = CV_V;
  ctx.lineCap = 'round';
  const ribs = view === 'side'
    ? [[cx + rx * 0.5, cy - ry * 0.7, cx - rx * 0.8, cy + ry * 0.1], [cx + rx * 0.4, cy - ry * 0.1, cx - rx * 0.6, cy + ry * 0.75]]
    : [[cx, cy - ry * 0.8, cx - rx * 0.62, cy + ry * 0.7], [cx, cy - ry * 0.8, cx + rx * 0.62, cy + ry * 0.7]];
  for (const [x0, y0, x1, y1] of ribs) {
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - 14, x1, y1);
    ctx.stroke();
    ctx.lineWidth = 3;
    for (let k = 1; k <= 3; k++) {
      const f = k / 4, mx = lerp(x0, x1, f), my = lerp(y0, y1, f) - 9;
      const dx = (x1 - x0) * 0.12, dy = (y1 - y0) * 0.12;
      for (const sgn of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + dx - sgn * dy * 1.6, my + dy + sgn * dx * 1.6);
        ctx.stroke();
      }
    }
  }
}

/* ---------------- lion (Linhão) ---------------- */
const MANE = '#f08a2c', MANE_L = '#ffb347', MANE_D = '#c8661b', GOLD = '#ffd36b';
function lionEar(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  fillStroke(ctx, MANE_L, INK, 5);
  ctx.beginPath();
  ctx.arc(x, y + r * 0.1, r * 0.55, 0, TAU);
  ctx.fillStyle = '#ffb3c6';
  ctx.fill();
}
function lionHood(ctx, g, t, ears) {
  const w = Math.sin(t * 6) * 3;
  const tufts = hoodRim(g, 14, g.R - 6, -0.05).map(([x, y, a], i) => [x + Math.cos(a) * w * 0.3, y + Math.sin(a) * w * 0.3, 26 + 4 * (i % 2)]);
  dblob(ctx, tufts, MANE, 6);
  for (const [x, y, r] of ears) lionEar(ctx, x, y, r);
  hoodPath(ctx, g);
  ctx.fillStyle = MANE;
  ctx.fill();
  // lighter inner ruff lining the face
  ctx.save();
  hoodPath(ctx, g);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(g.fx, g.fy, g.r + 20, 0, TAU);
  ctx.lineWidth = 26;
  ctx.strokeStyle = MANE_L;
  ctx.stroke();
  ctx.restore();
  // fur curls
  ctx.strokeStyle = MANE_D;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (const [x, y, a] of hoodRim(g, 6, g.R - 18, 0.3)) {
    ctx.beginPath();
    ctx.arc(x, y, 9, a + 0.6, a + 2.6);
    ctx.stroke();
  }
  hoodFaceEdge(ctx, g);
}
function lionChest(ctx, view) {
  const tufts = view === 'side'
    ? [[120, -86, 26], [96, -74, 28], [70, -70, 24], [138, -106, 22]]
    : [[0, -110, 34], [-34, -104, 28], [34, -104, 28], [-62, -116, 22], [62, -116, 22]];
  dblob(ctx, tufts, MANE_L, 6);
}
function lionTail(ctx, x, y, t, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const sw = Math.sin(t * 8) * 18;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-50, 6, -70, -30, -86 + sw * 0.4, -64);
  ctx.lineCap = 'round';
  ctx.lineWidth = 22;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 12;
  ctx.strokeStyle = GOLD;
  ctx.stroke();
  const tx = -86 + sw * 0.4, ty = -64;
  dblob(ctx, [[tx, ty - 6, 22], [tx - 13, ty - 20, 16], [tx + 11, ty - 22, 16], [tx, ty - 32, 14]], MANE, 5);
  ctx.restore();
}

/* ---------------- minhoca: felt-plush pink worm ---------------- */
const WP = '#f794bf', WP_L = '#ffc7de', WP_D = '#d9689a';
function crease(ctx, x, y, r, ang) {
  // soft segment fold across the body, perpendicular to its direction
  ctx.beginPath();
  ctx.arc(x - Math.cos(ang) * r * 1.3, y - Math.sin(ang) * r * 1.3, r * 1.25, ang - 0.62, ang + 0.62);
  ctx.strokeStyle = WP_D;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.stroke();
}
function wormTube(ctx, segs) {
  dblob(ctx, segs, WP, 6);
  ctx.save();
  ctx.beginPath();
  for (const [x, y, r] of segs) {
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, TAU);
  }
  ctx.clip();
  for (let i = 1; i < segs.length; i++) {
    const [x0, y0] = segs[i - 1], [x1, y1, r1] = segs[i];
    const ang = Math.atan2(y1 - y0, x1 - x0);
    crease(ctx, (x0 + x1) / 2, (y0 + y1) / 2, r1, ang);
  }
  // one long soft shine along the back
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  segs.slice(1, -1).forEach(([x, y, r], i) => (i ? ctx.lineTo(x, y - r * 0.62) : ctx.moveTo(x, y - r * 0.62)));
  ctx.stroke();
  ctx.restore();
}
function wormBodySide(ctx, t) {
  // chubby body that tapers into an S-curled tail going back and up
  const pts = [[44, -92, 60], [-4, -92, 60], [-52, -94, 56], [-96, -98, 48], [-132, -104, 39], [-160, -118, 30], [-176, -138, 23], [-178, -160, 18]];
  const segs = pts.map(([x, y, r], i) => [x, y + Math.sin(t * 12 - i * 0.9) * (i > 2 ? 5 : 2), r]);
  wormTube(ctx, segs.slice().reverse());
}
function wormBodyFront(ctx, t) {
  const segs = [[0, -48, 84, 50, 0], [0, -92, 92, 54, 0], [0, -136, 84, 50, 0]].map(([x, y, rx, ry], i) => [x + Math.sin(t * 12 - i) * 4, y, rx, ry, 0]);
  dblob(ctx, segs, WP, 6);
  ctx.strokeStyle = WP_D;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (const y of [-70, -114]) {
    ctx.beginPath();
    ctx.ellipse(0, y - 30, 80, 34, 0, 0.35, Math.PI - 0.35);
    ctx.stroke();
  }
}
function wormTailFront(ctx, t) {
  const segs = [[60, -50, 26], [92, -64, 21], [114, -86, 17], [120, -112, 14], [108, -130, 11]].map(([x, y, r], i) => [x + Math.sin(t * 12 - i) * 3 * i, y, r]);
  wormTube(ctx, segs.reverse());
}
function antenna(ctx, x0, y0, x1, y1, bend, br, t, ph) {
  const wx = Math.sin(t * 9 + ph) * 6;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo((x0 + x1) / 2 + bend, (y0 + y1) / 2, x1 + wx, y1);
  ctx.lineCap = 'round';
  ctx.lineWidth = 16;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 8;
  ctx.strokeStyle = WP;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x1 + wx, y1, br, 0, TAU);
  fillStroke(ctx, WP, INK, 5);
  ctx.beginPath();
  ctx.arc(x1 + wx - br * 0.3, y1 - br * 0.3, br * 0.32, 0, TAU);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fill();
}
function wormHood(ctx, g, t, ants) {
  for (const [x0, y0, x1, y1, bend, ph] of ants) antenna(ctx, x0, y0, x1, y1, bend, 15, t, ph);
  hoodPath(ctx, g);
  fillStroke(ctx, WP, INK, 6);
  // felt crease following the face opening + soft shine
  ctx.save();
  hoodPath(ctx, g);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(g.fx, g.fy, g.r + 22, 0, TAU);
  ctx.strokeStyle = WP_D;
  ctx.lineWidth = 4;
  ctx.stroke();
  const [hx, hy] = hoodRim(g, 5, g.R - 14)[1];
  ctx.beginPath();
  ctx.ellipse(hx, hy, 18, 8, -0.6, 0, TAU);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();
  ctx.restore();
  hoodFaceEdge(ctx, g);
}

/* ------------------------------------------------------------------ */
export function costume(kind, t = 0) {
  switch (kind) {
    case 'croc':
      return {
        noTail: true,
        under: (ctx, o, v) => v === 'side' && crocTailSide(ctx, t),
        overBody: (ctx, o, v) => v === 'side' && backSpikes(ctx),
        overHead: (ctx, o, v) => (v === 'side' ? crocHoodSide(ctx) : crocHoodFront(ctx, o)),
      };
    case 'cheese':
      return {
        overBody: (ctx, o, v) => (v === 'side' ? cheeseBodySide(ctx, t) : cheeseBodyFront(ctx, t)),
        overHead: (ctx, o, v) => (v === 'side' ? cheeseCap(ctx, 92, -206, 58) : cheeseCap(ctx, 0, -262, 74)),
      };
    case 'cabbage':
      return {
        noTail: true,
        overBody: (ctx, o, v) => (v === 'side' ? leafTunic(ctx, 0, -92, 100, 60, v) : leafTunic(ctx, 0, -90, 92, 70, v)),
        overHead: (ctx, o, v) => (v === 'side' ? cabbageHood(ctx, SIDE_HOOD(), t, false) : cabbageHood(ctx, FRONT_HOOD(), t, true)),
      };
    case 'lion':
      return {
        noTail: true,
        under: (ctx, o, v) => (v === 'side' ? lionTail(ctx, -80, -110, t) : lionTail(ctx, -60, -60, t, 0.9)),
        overBody: (ctx, o, v) => lionChest(ctx, v),
        overHead: (ctx, o, v) => (v === 'side'
          ? lionHood(ctx, SIDE_HOOD(), t, [[70, -252, 22]])
          : lionHood(ctx, FRONT_HOOD(), t, [[-74, -292, 26], [74, -292, 26]])),
      };
    case 'worm':
      return {
        noTail: true,
        under: (ctx, o, v) => v === 'front' && wormTailFront(ctx, t),
        overBody: (ctx, o, v) => (v === 'side' ? wormBodySide(ctx, t) : wormBodyFront(ctx, t)),
        overHead: (ctx, o, v) => (v === 'side'
          ? wormHood(ctx, SIDE_HOOD(), t, [[70, -236, 50, -300, -14, 0], [104, -242, 118, -308, 14, 1.7]])
          : wormHood(ctx, FRONT_HOOD(), t, [[-38, -296, -62, -362, -14, 0], [38, -296, 62, -362, 14, 1.7]])),
      };
    default:
      return {};
  }
}

// strap a rocket booster onto Brie's back (side view)
export function withRocket(c, t, power = 1) {
  const ob = c.overBody;
  return {
    ...c,
    noTail: true,
    overBody: (ctx, o, v) => {
      ob?.(ctx, o, v);
      if (v !== 'side') return;
      ctx.save();
      ctx.translate(70, -160);
      ctx.scale(1.05, 1.05);
      rocketPack(ctx, t, power);
      ctx.restore();
      ctx.beginPath();
      ctx.roundRect(-58, -150, 22, 116, 8);
      fillStroke(ctx, '#ff5d5d', INK, 4);
    },
  };
}
