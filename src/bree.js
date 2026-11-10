// Brie — a fluffy white Havanese puppy, drawn procedurally.
import { TAU, INK, blob, fillStroke, clover, clamp, lerp } from './util.js';

const FUR = '#ffffff';
const FUR_SHADE = '#e9e3f2';
const FUR_DEEP = '#d9d0e6';
const NOSE = '#231a2b';
const TONGUE = '#ff7d9c';
const BLUSH = 'rgba(255,140,170,0.45)';
const BOW = '#37c45c';

/* ------------------------------------------------------------------ */
/* Side view (facing right). Origin = ground under the body centre.    */
/* ------------------------------------------------------------------ */
/**
 * o.phase   run-cycle phase 0..1 (null => standing)
 * o.amp     leg swing amplitude 0..1
 * o.mouth   0..1 open
 * o.eyes    'open' | 'happy' | 'closed' | 'wide'
 * o.ear     0..1 how much the ear streams backwards
 * o.wag     tail wag phase (radians)
 * o.lw      outline width
 */
export function drawBreeSide(ctx, o = {}) {
  const p = o.phase;
  const running = p !== null && p !== undefined;
  const amp = o.amp ?? 1;
  const lw = o.lw ?? 6;
  const ph = running ? p * TAU : 0;
  const bob = o.bob ?? (running ? -18 * amp * (0.5 + 0.5 * Math.sin(ph - Math.PI / 2)) : 0);
  const pitch = o.pitch ?? (running ? 0.07 * amp * Math.sin(ph) : 0);
  // o.legs = [front, back] overrides the cycle's leg angles (crouch, full-stretch gallop)
  const fA = o.legs ? o.legs[0] : running ? 0.95 * amp * Math.sin(ph) : 0;
  const bA = o.legs ? o.legs[1] : running ? 0.95 * amp * Math.sin(ph + Math.PI * 0.8) : 0;

  ctx.save();
  ctx.translate(0, bob);
  ctx.rotate(pitch);
  if (o.cape) drawCapeBack(ctx, o.cape, running ? amp : 0.25, lw);
  o.under?.(ctx, o, 'side');

  // legs: [hipX, angle, shade]
  const leg = (x, a, far) => {
    ctx.save();
    ctx.translate(x, -62);
    ctx.rotate(a);
    blob(ctx, [[0, 22, 19, 30, 0], [4, 52, 18, 13, 0]], far ? FUR_DEEP : FUR, lw);
    // o.shoe draws footwear at the sole of each paw, so it travels with the leg
    if (o.shoe) {
      ctx.translate(4, 65);
      o.shoe(ctx, { view: 'side', angle: a, far });
    }
    ctx.restore();
  };
  // far legs
  leg(56, fA * 0.8 + 0.15, true);
  leg(-58, bA * 0.8 - 0.15, true);

  // tail plume curling over the back
  if (!o.noTail) drawTail(ctx, -78, -112, o.wag ?? 0, lw);

  // body cloud with fur fringe
  const body = [[0, -92, 98, 56, 0]];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU;
    body.push([Math.cos(a) * 92, -92 + Math.sin(a) * 52, 24 + (i % 2) * 5]);
  }
  // belly fringe hanging down
  for (let i = 0; i < 6; i++) body.push([-60 + i * 24, -44 + (i % 2) * 6, 16]);
  blob(ctx, body, FUR, lw);
  // soft shading on the belly
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = FUR_SHADE;
  ctx.beginPath();
  ctx.ellipse(0, -62, 80, 22, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  // fur strokes
  ctx.strokeStyle = FUR_DEEP;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const x = -60 + i * 28;
    ctx.beginPath();
    ctx.moveTo(x, -110 + (i % 2) * 10);
    ctx.quadraticCurveTo(x - 10, -95, x - 4, -80);
    ctx.stroke();
  }

  if (o.cape && capeStyle(o.cape) === 'drape') {
    drawCapeDrape(ctx, o.cape, lw);
    if (!o.noTail) drawTail(ctx, -78, -112, o.wag ?? 0, lw);
  }
  o.overBody?.(ctx, o, 'side');
  // near legs
  leg(70, fA, false);
  leg(-44, bA, false);

  drawSideCollar(ctx, lw);
  drawSideHead(ctx, 98, -150, o, lw);
  drawTag(ctx, 86, -76, 0.25 + 0.12 * Math.sin((o.wag ?? 0) * 0.5), lw);
  o.overHead?.(ctx, o, 'side');
  ctx.restore();
}

/* ---------------- superhero cape (side view) ----------------
 * o.cape = { t, color, lining, style }. Styles (CAPE.style is the default):
 *  'strap' cape tucked under the ears, lying along the top of the back
 *  'fly'   same, but the cloth lifts up and flies higher off the back
 *  'drape' cloth drapes over the top of the back like a little blanket, then flows
 *  'royal' longer, wider cape with a gold-trimmed hem */
export const CAPE = { style: 'royal' };
export function setCapeStyle(st) { CAPE.style = st; }
const capeStyle = (c) => c.style ?? CAPE.style;

function capeEdges(c, speed) {
  const t = c.t ?? 0, st = capeStyle(c);
  const royal = st === 'royal', fly = st === 'fly';
  const N = 14, L = (royal ? 270 : 235) + 45 * speed;
  const top = [], bot = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const x = 44 - s * L * (1 - 0.04 * Math.sin(t * 7.3));
    const lift = (1 - speed) * 90 * s * s; // hangs lower when slow
    const rise = fly ? -70 * s * speed : 0; // flies up off the back
    const yc = -176 + 22 * s * s + lift + rise;
    const w = 40 + (royal ? 130 : 100) * s;
    const wv = Math.sin(t * (8 + 6 * speed) - s * 6.5) * (8 + 20 * speed) * s;
    const wv2 = Math.sin(t * (8 + 6 * speed) - s * 6.5 - 0.9) * (10 + 26 * speed) * s;
    top.push([x, yc - w / 2 + wv]);
    bot.push([x - 8 * s, yc + w / 2 + wv2]);
  }
  return { top, bot, t, N };
}
function capeOutline(ctx, e) {
  const { top, bot, t, N } = e;
  ctx.beginPath();
  ctx.moveTo(top[0][0], top[0][1]);
  for (let i = 1; i <= N; i++) ctx.lineTo(top[i][0], top[i][1]);
  const [tx, ty] = top[N], [bx, by] = bot[N];
  for (let k = 1; k <= 3; k++) {
    const a = k / 3, b = (k - 0.5) / 3;
    ctx.quadraticCurveTo(lerp(tx, bx, b) - 22 - 6 * Math.sin(t * 11 + k), lerp(ty, by, b), lerp(tx, bx, a), lerp(ty, by, a));
  }
  for (let i = N - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
  ctx.closePath();
}
function drawCapeBack(ctx, c, speed, lw) {
  const col = c.color ?? '#ff3d5a', lin = c.lining ?? '#b8173a';
  const e = capeEdges(c, speed);
  const { top, bot, t, N } = e;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  capeOutline(ctx, e);
  fillStroke(ctx, col, INK, lw);
  ctx.save();
  capeOutline(ctx, e);
  ctx.clip();
  // darker lining showing along the lower edge where the cloth curls
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const [x, y] = bot[i];
    const d = 10 + 18 * s * (0.6 + 0.4 * Math.sin(t * 9 - s * 6));
    i ? ctx.lineTo(x, y - d) : ctx.moveTo(x, y - d);
  }
  for (let i = N; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1] + 10);
  ctx.closePath();
  ctx.fillStyle = lin;
  ctx.fill();
  // fold lines following the ripple
  ctx.strokeStyle = 'rgba(0,0,0,0.16)';
  ctx.lineWidth = 5;
  for (const f of [0.35, 0.65]) {
    ctx.beginPath();
    for (let i = 2; i <= N; i++) {
      const x = lerp(top[i][0], bot[i][0], f), y = lerp(top[i][1], bot[i][1], f);
      i > 2 ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  if (capeStyle(c) === 'royal') {
    // gold trim along the trailing hem
    ctx.strokeStyle = '#ffd84d';
    ctx.lineWidth = 16;
    ctx.beginPath();
    const [tx, ty] = top[N], [bx, by] = bot[N];
    ctx.moveTo(tx, ty);
    for (let k = 1; k <= 3; k++) {
      const a = k / 3, b = (k - 0.5) / 3;
      ctx.quadraticCurveTo(lerp(tx, bx, b) - 22 - 6 * Math.sin(t * 11 + k), lerp(ty, by, b), lerp(tx, bx, a), lerp(ty, by, a));
    }
    ctx.stroke();
  }
  ctx.restore();
  capeOutline(ctx, e);
  ctx.lineWidth = lw;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.restore();
}
// 'drape': cloth lying over the top of the back (drawn over the body)
function drawCapeDrape(ctx, c, lw) {
  const col = c.color ?? '#ff3d5a', t = c.t ?? 0;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(70, -186);
  ctx.quadraticCurveTo(-10, -200, -112, -170);
  // scalloped lower edge hanging over her side, swaying a little
  const pts = [[-112, -170], [-84, -128], [-46, -128], [-8, -134], [30, -140]];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const sw = Math.sin(t * 10 + i) * 4;
    ctx.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + 16 + sw, x1, y1);
  }
  ctx.quadraticCurveTo(52, -150, 70, -186);
  ctx.closePath();
  fillStroke(ctx, col, INK, lw);
  ctx.strokeStyle = 'rgba(0,0,0,0.16)';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (const x of [-60, -20]) {
    ctx.beginPath();
    ctx.moveTo(x + 6, -186);
    ctx.quadraticCurveTo(x - 4, -160, x, -132);
    ctx.stroke();
  }
  ctx.restore();
}
// collar look: band colour, optional stitch line / studs, tag colours
export const COLLAR_STYLE = { band: '#0f5a45', stitch: null, studs: '#ffcf3f', ring: '#ffcf3f', tag: '#ffcf3f', clover: BOW, cloverOnly: false, studShape: 'dot', charmRim: null, charmSize: 30 };
export function setCollarStyle(st) { Object.assign(COLLAR_STYLE, st); }

function band(ctx, lw, path) {
  const C = COLLAR_STYLE;
  ctx.save();
  ctx.lineCap = 'round';
  path();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 22 + lw;
  ctx.stroke();
  ctx.strokeStyle = C.band;
  ctx.lineWidth = 22;
  ctx.stroke();
  if (C.stitch) {
    ctx.setLineDash([7, 7]);
    ctx.strokeStyle = C.stitch;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function studs(ctx, pts) {
  if (!COLLAR_STYLE.studs) return;
  for (const [x, y] of pts) {
    if (COLLAR_STYLE.studShape === 'clover') {
      clover(ctx, x, y, 9, 0, COLLAR_STYLE.studs, 1.2);
      continue;
    }
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, TAU);
    ctx.fillStyle = COLLAR_STYLE.studs;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
}

// collar peeking out under the fluffy neck; the tag is drawn after the head
function drawSideCollar(ctx, lw) {
  band(ctx, lw, () => {
    ctx.beginPath();
    ctx.moveTo(34, -124);
    ctx.quadraticCurveTo(42, -82, 92, -76);
  });
  studs(ctx, [[40, -104], [54, -86]]);
}

function drawTag(ctx, x, y, swing, lw) {
  const C = COLLAR_STYLE;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(swing);
  // ring
  ctx.beginPath();
  ctx.arc(0, 6, 8, 0, TAU);
  ctx.lineWidth = 9;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.strokeStyle = C.ring;
  ctx.stroke();
  if (C.cloverOnly) {
    // the clover itself hangs as the charm
    const cs = C.charmSize ?? 30;
    if (C.charmRim) clover(ctx, 0, 30, cs * 1.22, 0, C.charmRim, 4);
    clover(ctx, 0, 30, cs, 0, C.clover, C.charmRim ? 2.5 : 4);
  } else {
    ctx.beginPath();
    ctx.arc(0, 34, 22, 0, TAU);
    ctx.fillStyle = C.tag;
    ctx.fill();
    ctx.lineWidth = lw * 0.8;
    ctx.strokeStyle = INK;
    ctx.stroke();
    clover(ctx, 0, 34, 22, 0, C.clover, 3);
  }
  ctx.restore();
}

function drawFrontCollar(ctx, lw, wag) {
  band(ctx, lw, () => {
    ctx.beginPath();
    ctx.moveTo(-66, -128);
    ctx.quadraticCurveTo(0, -96, 66, -128);
  });
  studs(ctx, [[-48, -118], [-26, -110], [26, -110], [48, -118]]);
  drawTag(ctx, 0, -110, 0.12 * Math.sin(wag * 0.5), lw);
}

function drawTail(ctx, x, y, wag, lw) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.25 + 0.28 * Math.sin(wag));
  const pts = [];
  for (let i = 0; i <= 9; i++) {
    const t = i / 9;
    const a = lerp(Math.PI * 1.05, Math.PI * 0.05, t);
    const R = lerp(20, 62, Math.sin(t * Math.PI * 0.9));
    pts.push([Math.cos(a) * R * 0.9 + 20, -Math.sin(a) * R * 1.2 - 10 - t * 40, lerp(26, 16, t)]);
  }
  blob(ctx, pts, FUR, lw);
  ctx.strokeStyle = FUR_DEEP;
  ctx.lineWidth = 3.5;
  for (let i = 2; i < 8; i += 2) {
    const [px, py] = pts[i];
    ctx.beginPath();
    ctx.moveTo(px - 8, py + 2);
    ctx.quadraticCurveTo(px, py - 8, px + 8, py - 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSideHead(ctx, x, y, o, lw) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(o.headTilt ?? 0);
  const head = [[0, 0, 62, 58, 0], [52, 22, 40, 30, 0.1]];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + 0.3;
    if (Math.sin(a) > 0.5 && Math.cos(a) > 0) continue; // keep muzzle side cleaner
    head.push([Math.cos(a) * 56, Math.sin(a) * 52, 18]);
  }
  // topknot
  head.push([-6, -60, 24], [14, -66, 18], [-24, -54, 18]);
  blob(ctx, head, FUR, lw);


  // blush
  ctx.fillStyle = BLUSH;
  ctx.beginPath();
  ctx.ellipse(40, 26, 16, 9, 0, 0, TAU);
  ctx.fill();

  // mouth
  const m = clamp(o.mouth ?? 0);
  if (m > 0.05) {
    ctx.beginPath();
    ctx.moveTo(58, 34);
    ctx.quadraticCurveTo(76, 40 + 30 * m, 90, 32);
    ctx.quadraticCurveTo(76, 40, 58, 34);
    fillStroke(ctx, '#7a2a43', INK, 4);
    if (o.tongue !== false) {
      ctx.beginPath();
      ctx.ellipse(72, 44 + 22 * m, 11, 7 + 12 * m, 0.2, 0, TAU);
      fillStroke(ctx, TONGUE, INK, 4);
      ctx.beginPath();
      ctx.moveTo(72, 40 + 18 * m);
      ctx.lineTo(73, 50 + 22 * m);
      ctx.strokeStyle = '#d9496d';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.moveTo(84, 30);
    ctx.quadraticCurveTo(76, 40, 66, 34);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  // nose
  ctx.beginPath();
  ctx.ellipse(90, 12, 15, 12, 0.15, 0, TAU);
  fillStroke(ctx, NOSE, INK, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.ellipse(86, 7, 5, 3, -0.3, 0, TAU);
  ctx.fill();

  drawEye(ctx, 34, -6, o.eyes ?? 'open', 1, o.look ?? 0);

  // ear (droopy, streams backwards when running)
  const ear = clamp(o.ear ?? 0);
  ctx.save();
  ctx.translate(-14, -30);
  ctx.rotate(0.15 + ear * 0.9 + (o.earFlop ?? 0));
  blob(
    ctx,
    [[-8, 26, 26, 36, 0.1], [-14, 58, 24, 22, 0], [-2, 72, 16], [-24, 74, 14]],
    '#f7f3fb',
    lw,
  );
  ctx.strokeStyle = FUR_DEEP;
  ctx.lineWidth = 3.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-18 + i * 9, 20);
    ctx.quadraticCurveTo(-24 + i * 9, 50, -16 + i * 9, 70);
    ctx.stroke();
  }
  ctx.restore();
  if (o.crown) drawSeatedCrown(ctx, 0, -70, 0.8, -0.12, lw);
  ctx.restore();
}

function drawEye(ctx, x, y, kind, s = 1, look = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineCap = 'round';
  if (kind === 'happy') {
    ctx.beginPath();
    ctx.moveTo(-12, 4);
    ctx.quadraticCurveTo(0, -12, 12, 4);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.stroke();
  } else if (kind === 'closed') {
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.quadraticCurveTo(0, 9, 12, 0);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.stroke();
  } else {
    const big = kind === 'wide' ? 1.25 : 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13 * big, 16 * big, 0, 0, TAU);
    ctx.fillStyle = NOSE;
    ctx.fill();
    ctx.fillStyle = '#5a3f6e';
    ctx.beginPath();
    ctx.ellipse(look * 3, 5 * big, 9 * big, 8 * big, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-4 + look * 4, -6 * big, 5.5 * big, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5 + look * 4, 6 * big, 2.6 * big, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Front view, sitting. Origin = ground centre.                        */
/* ------------------------------------------------------------------ */
/**
 * o.expr  'innocent' | 'happy' | 'guilty' | 'shout' | 'sleepy'
 * o.wag   tail wag phase
 * o.tilt  head tilt (radians)
 * o.crown bool
 * o.bodyless  only draw the head (for blanket shots)
 */
export function drawBreeFront(ctx, o = {}) {
  const lw = o.lw ?? 6;
  const expr = o.expr ?? 'happy';
  ctx.save();
  if (!o.bodyless) o.under?.(ctx, o, 'front');
  if (!o.bodyless && !o.noTail) {
    // tail peeking out on the right
    ctx.save();
    ctx.translate(70, -70);
    ctx.rotate(0.5 + 0.35 * Math.sin(o.wag ?? 0));
    blob(ctx, [[10, -10, 24], [26, -36, 22], [30, -62, 18], [20, -82, 14]], FUR, lw);
    ctx.restore();
  }
  if (!o.bodyless) {
    // body
    const body = [[0, -92, 84, 84, 0]];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      body.push([Math.cos(a) * 80, -92 + Math.sin(a) * 80, 22 + (i % 2) * 4]);
    }
    blob(ctx, body, FUR, lw);
    ctx.fillStyle = FUR_SHADE;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.ellipse(0, -40, 60, 26, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    o.overBody?.(ctx, o, 'front');
    // front paws
    blob(ctx, [[-34, -50, 22, 40, 0], [-36, -12, 26, 16, 0]], FUR, lw);
    blob(ctx, [[34, -50, 22, 40, 0], [36, -12, 26, 16, 0]], FUR, lw);
    if (o.shoe) {
      for (const sx of [-1, 1]) {
        ctx.save();
        ctx.translate(sx * 36, 4);
        o.shoe(ctx, { view: 'front', side: sx });
        ctx.restore();
      }
    }
    ctx.strokeStyle = FUR_DEEP;
    ctx.lineWidth = 3.5;
    for (const sx of [-1, 1]) {
      for (const d of [-8, 8]) {
        ctx.beginPath();
        ctx.moveTo(sx * 36 + d, -20);
        ctx.lineTo(sx * 36 + d, -6);
        ctx.stroke();
      }
    }
  }
  // head
  ctx.save();
  ctx.translate(0, o.bodyless ? 0 : -196);
  ctx.rotate(o.tilt ?? 0);
  drawFrontHead(ctx, expr, lw, o);
  ctx.restore();
  if (!o.bodyless) drawFrontCollar(ctx, lw, o.wag ?? 0);
  o.overHead?.(ctx, o, 'front');
  ctx.restore();
}

export function drawFrontHead(ctx, expr, lw = 6, o = {}) {
  const earDrop = expr === 'guilty' ? 0.25 : expr === 'shout' ? -0.35 : 0;
  // ears behind
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(sx * 62, -24);
    // o.earOut splays both ears out past the head so they are both visible; they then sway together
    ctx.rotate(o.earOut != null
      ? sx * (0.25 + earDrop - o.earOut) + (o.earFlop ?? 0) * 0.35 * Math.sin((o.wag ?? 0) * 2)
      : sx * (0.25 + earDrop + (o.earFlop ?? 0) * Math.sin((o.wag ?? 0) * 2 + sx)));
    blob(ctx, [[sx * 8, 34, 28, 44, 0], [sx * 12, 76, 24, 22, 0], [sx * 2, 92, 14], [sx * 22, 90, 14]], '#f7f3fb', lw);
    ctx.strokeStyle = FUR_DEEP;
    ctx.lineWidth = 3.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(sx * (-2 + i * 9), 26);
      ctx.quadraticCurveTo(sx * (-8 + i * 9), 60, sx * (i * 9), 88);
      ctx.stroke();
    }
    ctx.restore();
  }
  const head = [[0, 0, 76, 68, 0]];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU + 0.1;
    head.push([Math.cos(a) * 70, Math.sin(a) * 62, 18 + (i % 2) * 4]);
  }
  head.push([0, -70, 26], [-22, -64, 20], [22, -64, 20]);
  blob(ctx, head, FUR, lw);
  // muzzle
  blob(ctx, [[0, 30, 40, 28, 0]], '#fbf9fd', 0);
  if (o.crown) drawSeatedCrown(ctx, 0, -76, 1, 0, lw);

  // blush
  ctx.fillStyle = BLUSH;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sx * 46, 22, 15, 9, 0, 0, TAU);
    ctx.fill();
  }
  // eyes
  const eyes = o.fEyes ?? ({ innocent: 'wide', happy: 'happy', guilty: 'open', shout: 'closed', sleepy: 'closed' }[expr] || 'open');
  const look = o.fLook ?? (expr === 'guilty' ? -1 : 0);
  drawEye(ctx, -30, -6, eyes, 1.15, look);
  drawEye(ctx, 30, -6, o.fEyeR ?? eyes, 1.15, look);
  if (expr === 'innocent') {
    // sparkly brows
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sx * 18, -36);
      ctx.quadraticCurveTo(sx * 32, -44, sx * 44, -38);
      ctx.stroke();
    }
  }
  if (expr === 'guilty') {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sx * 16, -32);
      ctx.lineTo(sx * 44, -40);
      ctx.stroke();
    }
  }
  // nose
  ctx.beginPath();
  ctx.ellipse(0, 16, 16, 12, 0, 0, TAU);
  fillStroke(ctx, NOSE, INK, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.ellipse(-5, 11, 5, 3, 0, 0, TAU);
  ctx.fill();
  // mouth
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const m = o.fMouth ?? (expr === 'shout' ? 1 : expr === 'happy' ? 0.6 : 0);
  if (m > 0) {
    ctx.beginPath();
    ctx.moveTo(-22, 34);
    ctx.quadraticCurveTo(0, 34 + 46 * m, 22, 34);
    ctx.quadraticCurveTo(0, 42, -22, 34);
    fillStroke(ctx, '#7a2a43', INK, 4);
    ctx.beginPath();
    ctx.ellipse(0, 36 + 30 * m, 12, 6 + 10 * m, 0, 0, TAU);
    fillStroke(ctx, TONGUE, INK, 4);
  } else {
    ctx.beginPath();
    ctx.moveTo(-16, 34);
    ctx.quadraticCurveTo(-8, 42, 0, 30);
    ctx.quadraticCurveTo(8, 42, 16, 34);
    ctx.stroke();
    if (expr === 'innocent') {
      ctx.beginPath();
      ctx.ellipse(4, 44, 7, 8, 0.2, 0, TAU);
      fillStroke(ctx, TONGUE, INK, 3);
    }
  }
}

// crown nestled into the topknot: fur tufts poke over the band so it sits *in* the fluff
export function drawSeatedCrown(ctx, x, y, s = 1, rot = 0, lw = 6) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  drawCrown(ctx, 0, 0);
  const tufts = [[-38, 12, 13], [-13, 16, 15], [13, 16, 15], [38, 12, 13]];
  ctx.fillStyle = FUR;
  for (const [tx, ty, tr] of tufts) {
    ctx.beginPath();
    ctx.arc(tx, ty, tr, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = lw * 0.8;
  ctx.lineCap = 'round';
  for (const [tx, ty, tr] of tufts) {
    ctx.beginPath();
    ctx.arc(tx, ty, tr, Math.PI + 0.45, TAU - 0.45);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCrown(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(-44, 10);
  ctx.lineTo(-50, -34);
  ctx.lineTo(-24, -12);
  ctx.lineTo(0, -46);
  ctx.lineTo(24, -12);
  ctx.lineTo(50, -34);
  ctx.lineTo(44, 10);
  ctx.closePath();
  fillStroke(ctx, '#ffcd3c', INK, 5);
  for (const [cx, cy, c] of [[0, -6, '#37c45c'], [-28, 0, '#ff5d8f'], [28, 0, '#4cc3ff']]) {
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, TAU);
    fillStroke(ctx, c, INK, 3);
  }
  ctx.restore();
}

/* Motion-blurred zoomie: ghosts trailing behind */
export function drawBreeZoom(ctx, x, y, s, dir, o, trail = 4, gap = 40) {
  for (let i = trail; i >= 1; i--) {
    ctx.save();
    ctx.globalAlpha = 0.5 * (1 - i / (trail + 1));
    ctx.translate(x - dir * i * gap, y);
    ctx.scale(s * dir, s);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -100, 110, 62, 0, 0, TAU);
    ctx.ellipse(95, -150, 70, 66, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * dir, s);
  drawBreeSide(ctx, o);
  ctx.restore();
}

/* Feathered wings for the front pose. Draw BEFORE drawBreeFront in the same
   transform. open 0..1 (pop-in scale), flap in radians. */
export function drawWings(ctx, open, flap = 0, lw = 6) {
  if (open <= 0) return;
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(sx * 58, -128);
    ctx.scale(sx * open, open);
    ctx.rotate(-flap);
    // main wing silhouette
    const tips = [[236, -150], [226, -96], [198, -48], [152, -12], [96, 12], [40, 22]];
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(30, -96, 130, -168, 236, -150);
    for (let i = 1; i < tips.length; i++) {
      const [ax, ay] = tips[i - 1], [bx, by] = tips[i];
      ctx.quadraticCurveTo((ax + bx) / 2 + 26, (ay + by) / 2 + 30, bx, by);
    }
    ctx.quadraticCurveTo(14, 30, 0, 0);
    ctx.closePath();
    fillStroke(ctx, '#ffffff', INK, lw);
    // blue-tinted feather rows
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#cdeeff';
    for (let i = 1; i < tips.length; i++) {
      const [bx, by] = tips[i];
      ctx.beginPath();
      ctx.ellipse(bx * 0.86, by * 0.86 + 6, 34, 20, Math.atan2(by, bx), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = '#9fc8e8';
    ctx.lineWidth = lw * 0.6;
    ctx.lineCap = 'round';
    for (let i = 1; i < tips.length - 1; i++) {
      const [bx, by] = tips[i];
      ctx.beginPath();
      ctx.moveTo(bx * 0.25, by * 0.25 - 10);
      ctx.quadraticCurveTo(bx * 0.55, by * 0.55 - 26, bx * 0.82, by * 0.82);
      ctx.stroke();
    }
    // gold leading-edge trim to match the collar
    ctx.strokeStyle = '#ffcf3f';
    ctx.lineWidth = lw * 0.9;
    ctx.beginPath();
    ctx.moveTo(10, -14);
    ctx.bezierCurveTo(38, -94, 130, -152, 224, -142);
    ctx.stroke();
    ctx.restore();
  }
}
