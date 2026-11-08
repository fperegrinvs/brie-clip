// One draw function per song section. Each gets (ctx, t, sec) where sec = sectionAt(t).
import { TAU, INK, clamp, lerp, inv, easeOut, easeIn, easeInOut, easeOutBack, rand, rrange, noise, blob, fillStroke, clover, heart, star } from './util.js';
import { W, H, sky, flash, vignette, speedLines, focusLines, sunburst, halftone, twinkleStars, confetti, hearts, dust, lightning, firework, sparkles, smokeTrail, fluffWipe, shadow } from './fx.js';
import { drawBreeSide, drawBreeFront, drawFrontHead, drawCrown, drawBreeZoom, drawWings } from './bree.js';
import { beatAt, beatPhase, pulse, energyAt, hitAt, LYRICS } from './timeline.js';
import { logo, bigLabel, COMIC } from './text.js';
import * as P from './props.js';
import { costume, withRocket } from './costumes.js';

const FY = P.FLOOR_Y;
const run = (t, mult = 1) => ((beatAt(t) * mult) % 1 + 1) % 1;

/* ---------- helpers ---------- */
function bree(ctx, x, y, s, dir, o = {}, withShadow = true) {
  if (withShadow) shadow(ctx, x, y + 4, 110 * s);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * dir, s);
  drawBreeSide(ctx, o);
  ctx.restore();
}
function front(ctx, x, y, s, o = {}, withShadow = true) {
  if (withShadow && !o.bodyless) shadow(ctx, x, y + 4, 100 * s);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  drawBreeFront(ctx, o);
  ctx.restore();
}
function sub(t, cuts) {
  // cuts: [[start, key], ...] -> {key, lt, dur}
  let i = 0;
  while (i + 1 < cuts.length && cuts[i + 1][0] <= t) i++;
  const end = i + 1 < cuts.length ? cuts[i + 1][0] : cuts[i][0] + 4;
  return { key: cuts[i][1], lt: t - cuts[i][0], dur: end - cuts[i][0], start: cuts[i][0], end };
}
function nearWord(t, line, win = 0.22) {
  if (!line) return -1;
  for (let i = line.words.length - 1; i >= 0; i--) {
    const d = t - line.words[i][0];
    if (d >= 0 && d < win) return i;
  }
  return -1;
}
const burstAt = (t) => LYRICS.find((l) => l.kind === 'burst' && t >= l.t - 0.05 && t <= l.e);
const wag = (t) => t * 18;

function cape(ctx, t, x, y, s, dir, color = '#ff3d5a') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * dir, s);
  ctx.beginPath();
  ctx.moveTo(70, -175);
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const k = i / 8;
    pts.push([70 - k * 300, -175 + k * 40 + Math.sin(t * 14 - k * 5) * 26 * k]);
  }
  pts.forEach(([px, py], i) => ctx.lineTo(px, py - 30 * (1 - i / 8)));
  for (let i = 8; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + 40 + 70 * (i / 8));
  ctx.lineTo(90, -130);
  ctx.closePath();
  fillStroke(ctx, color, INK, 6);
  ctx.beginPath();
  ctx.arc(88, -150, 14, 0, TAU);
  fillStroke(ctx, '#ffd84d', INK, 4);
  ctx.restore();
}

function house(ctx, x, y, s, doorOpen = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.rect(-300, -380, 600, 380);
  fillStroke(ctx, '#ffe3a3', INK, 7);
  ctx.beginPath();
  ctx.moveTo(-360, -370);
  ctx.lineTo(0, -640);
  ctx.lineTo(360, -370);
  ctx.closePath();
  fillStroke(ctx, '#ff7a6b', INK, 7);
  ctx.beginPath();
  ctx.rect(150, -620, 70, 150);
  fillStroke(ctx, '#c96a5a', INK, 6);
  for (const wx of [-220, 110]) {
    ctx.beginPath();
    ctx.roundRect(wx, -300, 110, 110, 12);
    fillStroke(ctx, '#7fd3ff', INK, 6);
    ctx.beginPath();
    ctx.moveTo(wx + 55, -300);
    ctx.lineTo(wx + 55, -190);
    ctx.moveTo(wx, -245);
    ctx.lineTo(wx + 110, -245);
    ctx.stroke();
  }
  // door
  ctx.beginPath();
  ctx.roundRect(-70, -230, 140, 230, [60, 60, 0, 0]);
  fillStroke(ctx, doorOpen > 0 ? '#fff6c8' : '#8a5a2b', INK, 7);
  if (doorOpen > 0) {
    ctx.save();
    ctx.translate(-70, 0);
    ctx.scale(1 - doorOpen * 0.85, 1);
    ctx.beginPath();
    ctx.roundRect(0, -230, 140, 230, [60, 60, 0, 0]);
    fillStroke(ctx, '#8a5a2b', INK, 7);
    ctx.restore();
  }
  clover(ctx, 0, -470, 40, 0, '#37c45c', 5);
  ctx.restore();
}

function dayOutdoor(ctx, t, camX, o = {}) {
  sky(ctx, o.top ?? '#6fd0ff', o.bottom ?? '#d9f6ff');
  if (o.sun !== false) P.sun(ctx, 1620, 180, 80, t);
  P.clouds(ctx, t, camX, 0.1);
  P.hills(ctx, camX, 640, 70, '#9be38f', 0.2, 1);
  P.hills(ctx, camX, 780, 60, '#6fd36a', 0.5, 3, true);
}

function room(ctx, theme, camX, t, items = true) {
  P.roomStrip(ctx, camX, theme, items, t);
}

/* ======================= SECTIONS ======================= */

function intro(ctx, t, sec) {
  const lt = sec.lt;
  const z = lerp(0.85, 1.12, easeInOut(lt / 11.4));
  sky(ctx, '#140d33', '#4a2b7a');
  twinkleStars(ctx, t, 160, H * 0.75, 1);
  P.moon(ctx, 1580, 330, 90);
  ctx.save();
  ctx.translate(W / 2, H * 0.78);
  ctx.scale(z, z);
  ctx.translate(-W / 2, -H * 0.78);
  P.hills(ctx, 0, 760, 50, '#3b2d6e', 0.0, 2);
  const glow = clamp((lt - 7.5) / 3.5);
  if (glow > 0) {
    const g = ctx.createRadialGradient(W / 2, 760, 20, W / 2, 760, 600);
    g.addColorStop(0, `rgba(255,220,130,${0.55 * glow})`);
    g.addColorStop(1, 'rgba(255,220,130,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  P.castle(ctx, W / 2, 830, 1.25, { t, night: true, gateOpen: easeOut((lt - 9.6) / 1.6), glow: glow });
  P.hills(ctx, 0, 900, 40, '#2a1f55', 0.0, 5);
  // drifting clover sparks rising
  for (let i = 0; i < 18; i++) {
    const k = ((t * 0.08 + rand(i)) % 1);
    const x = rand(i + 7) * W;
    const y = H - k * H * 1.1;
    ctx.globalAlpha = Math.sin(k * Math.PI) * 0.8;
    clover(ctx, x + Math.sin(t + i) * 30, y, 14 + rand(i + 2) * 10, t + i, '#5fd77a', 2);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  // fog
  ctx.fillStyle = 'rgba(200,180,255,0.12)';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(((i * 600 + t * 40) % (W + 800)) - 400, 960 + i * 20, 500, 70, 0, 0, TAU);
    ctx.fill();
  }
  vignette(ctx, 0.55);
}

function entrance(ctx, t, sec) {
  const lt = sec.lt;
  sunburst(ctx, t, W / 2, H * 0.55, '#ff7da5', '#ffd1e3', 20, 0.3);
  focusLines(ctx, t, W / 2, H * 0.5, 1, 'rgba(255,255,255,0.85)', 380);
  const line = burstAt(t);
  const wi = nearWord(t, line, 0.3);
  const hop = wi >= 0 ? Math.sin(clamp((t - line.words[wi][0]) / 0.3) * Math.PI) * 60 : 0;
  const s = 2.1 * easeOutBack(lt / 0.5);
  front(ctx, W / 2, 1010 - hop, s, { expr: wi >= 0 ? 'shout' : 'happy', wag: wag(t), tilt: Math.sin(t * 6) * 0.08, earFlop: 0.3 });
  sparkles(ctx, t, W / 2, 600, 500, 18, 2);
  flash(ctx, clamp(1 - lt / 0.35));
}

function title(ctx, t, sec) {
  const lt = sec.lt;
  if (lt < 4.2) {
    sunburst(ctx, t, W / 2, H / 2, '#ffd84d', '#fff3b0', 22, 0.2);
    halftone(ctx, 'rgba(255,140,60,0.25)', 34, 9);
    // Bree jumping behind logo
    front(ctx, W / 2, 1020 + Math.abs(Math.sin(beatAt(t) * Math.PI)) * -40, 1.5, { expr: 'happy', wag: wag(t), crown: false });
    logo(ctx, W / 2, 420, 1.15, lt, { ribbon: true });
    flash(ctx, clamp(1 - lt / 0.25));
  } else {
    const k = lt - 4.2;
    const camX = k * 900;
    dayOutdoor(ctx, t, camX);
    // house approaching on the right
    const hx = lerp(W + 700, 1450, easeOut(k / 6.2));
    house(ctx, hx, 830, 0.95, 0);
    const bx = lerp(300, hx - 250, easeInOut(k / 6.43));
    speedLines(ctx, t, 0.6, -1, 'rgba(255,255,255,0.7)', 200, 900);
    bree(ctx, bx, 900, 1.3, 1, { phase: run(t, 1), amp: 1, ear: 0.8, mouth: 0.4, eyes: 'happy', wag: wag(t) });
    dust(ctx, t, bx - 120, 900, t - (t % 0.45), 4, 30, '#ffffff');
  }
  const wp = (lt - 3.8) / 0.4;
  if (wp > 0 && wp < 2) fluffWipe(ctx, wp);
}

function arrive(ctx, t, sec) {
  const lt = sec.lt;
  const camX = 300 + Math.sin(lt * 0.3) * 60;
  room(ctx, 'living', camX, t);
  // flying cushions
  for (let i = 0; i < 4; i++) {
    const kick = 1 + i * 2.2;
    const a = lt - kick;
    if (a > 0 && a < 1.6) {
      const x = 500 + i * 300 + a * 500 * (i % 2 ? -1 : 1);
      const y = 640 - 700 * a + 900 * a * a;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a * 9);
      ctx.beginPath();
      ctx.roundRect(-70, -55, 140, 110, 30);
      fillStroke(ctx, ['#ffd84d', '#ff9ec4', '#4cc3ff', '#b77dff'][i], INK, 6);
      ctx.restore();
    }
  }
  // zoom back and forth, 4 beats per sweep
  const b = beatAt(t) / 4;
  const sweep = Math.floor(b);
  const f = b - sweep;
  const dir = sweep % 2 ? -1 : 1;
  let x = dir > 0 ? lerp(220, W - 220, easeInOut(f)) : lerp(W - 220, 220, easeInOut(f));
  if (lt < 0.8) x = lerp(-200, 900, easeOut(lt / 0.8));
  const y = 960 - Math.abs(Math.sin(f * Math.PI * 3)) * 70;
  speedLines(ctx, t, 0.8, dir, 'rgba(255,255,255,0.8)', 600, 1000);
  drawBreeZoom(ctx, x, y, 1.15, lt < 0.8 ? 1 : dir, { phase: run(t, 2), amp: 1, ear: 1, mouth: 0.7, eyes: 'happy', wag: wag(t) }, 5, 70);
  dust(ctx, t, x - dir * 140, 960, t - (t % 0.3), 4, 34, '#f6e2c8');
  if (lt < 0.5) {
    flash(ctx, 1 - lt / 0.5, '#fff6c8');
  }
}

function verse1(ctx, t, sec) {
  const s = sub(t, [[37.3, 'tornado'], [40.86, 'skid'], [44.34, 'cute'], [47.6, 'missile'], [52.02, 'peek'], [53.78, 'worm']]);
  const lt = s.lt;
  if (s.key === 'tornado') {
    room(ctx, 'living', 900, t);
    const cx = W / 2 + Math.sin(lt * 1.5) * 300;
    // funnel of cotton puffs
    for (let i = 0; i < 70; i++) {
      const h = i / 70;
      const r = lerp(60, 380, h);
      const a = t * 9 + i * 0.7;
      const x = cx + Math.cos(a) * r;
      const y = FY + 120 - h * 760;
      const front_ = Math.sin(a) > 0;
      if (front_) continue;
      ctx.globalAlpha = 0.8;
      blob(ctx, [[x, y, 30 + h * 30]], '#ffffff', 4, 'rgba(58,39,71,0.35)');
    }
    ctx.globalAlpha = 1;
    const by = FY - 120 - Math.abs(Math.sin(t * 8)) * 60;
    ctx.save();
    ctx.translate(cx, by);
    ctx.rotate(Math.sin(t * 10) * 0.3);
    front(ctx, 0, 0, 1.1, { expr: 'happy', wag: wag(t), earFlop: 1 }, false);
    ctx.restore();
    for (let i = 0; i < 70; i++) {
      const h = i / 70;
      const r = lerp(60, 380, h);
      const a = t * 9 + i * 0.7;
      if (Math.sin(a) <= 0) continue;
      const x = cx + Math.cos(a) * r;
      const y = FY + 120 - h * 760;
      ctx.globalAlpha = 0.9;
      blob(ctx, [[x, y, 30 + h * 30]], '#ffffff', 4, 'rgba(58,39,71,0.35)');
    }
    ctx.globalAlpha = 1;
    speedLines(ctx, t, 0.4, 1);
  } else if (s.key === 'skid') {
    const skidT = 1.7;
    let x, sliding = lt > skidT && lt < skidT + 0.9;
    if (lt < skidT) x = lerp(-200, 1000, lt / skidT);
    else if (lt < skidT + 0.9) x = 1000 + 320 * easeOut((lt - skidT) / 0.9);
    else x = lerp(1320, W + 400, easeIn((lt - skidT - 0.9) / 0.9));
    const camX = 1500 + x * 0.2;
    room(ctx, 'living', camX, t);
    speedLines(ctx, t, sliding ? 0.3 : 0.9, 1, 'rgba(255,255,255,0.8)', 500, 1000);
    ctx.save();
    ctx.translate(x, 960);
    if (sliding) ctx.rotate(-0.22);
    ctx.scale(1.3, 1.3);
    drawBreeSide(ctx, sliding ? { phase: 0.25, amp: 0.4, eyes: 'wide', ear: 1, mouth: 1 } : { phase: run(t, 2), ear: 1, mouth: 0.4, eyes: 'happy', wag: wag(t) });
    ctx.restore();
    if (sliding || lt > skidT) {
      for (let k = 0; k < 6; k++) dust(ctx, t, 1000 + k * 55, 960, s.start + skidT + k * 0.1, 3, 40, '#f6e2c8', -1);
      ctx.strokeStyle = 'rgba(58,39,71,0.5)';
      ctx.lineWidth = 6;
      for (const dy of [0, 16]) {
        ctx.beginPath();
        ctx.moveTo(1000, 965 + dy);
        ctx.lineTo(Math.min(x, 1320) - 40, 965 + dy);
        ctx.stroke();
      }
    }
    if (sliding) bigLabel(ctx, 'SKRRR!', 1300, 520, 150, '#ff5d8f', (lt - skidT) * 3, -0.1);
  } else if (s.key === 'cute') {
    sky(ctx, '#ffd1e3', '#fff0f6');
    sunburst(ctx, t, W / 2, H * 0.55, 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0)', 16, 0.1);
    hearts(ctx, t, 20, 3);
    const z = lerp(2.2, 2.5, lt / s.dur);
    front(ctx, W / 2, 1180, z, { expr: lt % 1.6 < 1.0 ? 'innocent' : 'happy', wag: wag(t), tilt: Math.sin(t * 2.4) * 0.15 });
    // blush sparkles
    sparkles(ctx, t, W / 2, 500, 420, 14, 8, '#ffffff');
  } else if (s.key === 'missile') {
    const camX = 3000 + lt * 300;
    room(ctx, 'living', camX, t);
    const passes = 3;
    const pd = s.dur / passes;
    const pi = Math.floor(lt / pd);
    const f = (lt % pd) / pd;
    const dir = pi % 2 ? -1 : 1;
    const y = [560, 760, 420][pi % 3];
    const xAt = (ff) => (dir > 0 ? lerp(-300, W + 300, ff) : lerp(W + 300, -300, ff));
    const path = (ff) => [xAt(ff), y - 120 + Math.sin(ff * 12) * 20];
    smokeTrail(ctx, f, path, 0.5, 0.025, '#ffffff');
    speedLines(ctx, t, 1, dir);
    ctx.save();
    ctx.translate(xAt(f), y);
    ctx.scale(dir * 1.1, 1.1);
    ctx.rotate(0.05);
    drawBreeSide(ctx, { phase: 0.7, amp: 0.3, ear: 1, mouth: 0.2, eyes: 'happy' });
    ctx.restore();
    if (f > 0.4 && f < 0.75) bigLabel(ctx, 'ZUUUM!', W / 2, 220, 140, '#4cc3ff', (f - 0.4) * 8, 0.06 * dir);
  } else if (s.key === 'peek') {
    room(ctx, 'living', 300, t, false);
    P.furniture(ctx, 'window', 120, FY);
    // table on the left, sofa on the right
    const half = lt < s.dur / 2;
    const k = half ? lt / (s.dur / 2) : (lt - s.dur / 2) / (s.dur / 2);
    const pop = Math.sin(clamp(k) * Math.PI);
    P.furniture(ctx, 'table', 300, FY + 120);
    if (half) {
      ctx.save();
      ctx.translate(560 + 30 * pop, FY + 40);
      ctx.rotate(0.3);
      ctx.scale(0.7, 0.7);
      drawFrontHead(ctx, 'innocent', 6, { wag: wag(t) });
      ctx.restore();
    }
    if (!half) {
      ctx.save();
      ctx.translate(1320 + 40 * pop, FY - 300 - 50 * pop);
      ctx.rotate(0.25);
      ctx.scale(1.1, 1.1);
      drawFrontHead(ctx, 'happy', 6, { wag: wag(t) });
      ctx.restore();
    }
    P.furniture(ctx, 'sofa', 1060, FY + 40);
    if (half) bigLabel(ctx, '?', 700, 560, 140, '#ffd84d', k * 4, 0.2);
    else bigLabel(ctx, '!', 1640, 380, 160, '#ff5d8f', k * 4, -0.2);
  } else if (s.key === 'worm') {
    room(ctx, 'living', 4200, t);
    const go = lt > 1.4;
    if (!go) {
      // on her back wiggling
      ctx.save();
      ctx.translate(W / 2, FY + 10);
      ctx.rotate(Math.PI + Math.sin(t * 22) * 0.18);
      ctx.scale(-1.3, 1.3);
      ctx.translate(0, 160);
      drawBreeSide(ctx, { phase: (t * 4) % 1, amp: 1, eyes: 'happy', mouth: 0.8, ear: 0.4, wag: wag(t), ...costume('worm', t) });
      ctx.restore();
      bigLabel(ctx, 'WIGGLE WIGGLE', W / 2, 300, 110, '#b77dff', lt * 3, Math.sin(t * 10) * 0.08);
    } else {
      const k = (lt - 1.4) / (s.dur - 1.4);
      const x = lerp(W / 2, W + 600, easeIn(k));
      speedLines(ctx, t, 1, 1);
      drawBreeZoom(ctx, x, 960, 1.3, 1, { phase: run(t, 3), ear: 1, mouth: 0.6, eyes: 'happy', wag: wag(t), ...costume('worm', t) }, 6, 80);
      dust(ctx, t, W / 2, 960, s.start + 1.4, 8, 50, '#f6e2c8');
    }
  }
}

function bonbon(ctx, x, y, r, rot, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * r * 0.8, 0);
    ctx.lineTo(sx * r * 1.8, -r * 0.6);
    ctx.lineTo(sx * r * 1.8, r * 0.6);
    ctx.closePath();
    fillStroke(ctx, color, INK, 5);
  }
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  fillStroke(ctx, '#6b3b1f', INK, 6);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(-r * 0.35, -r * 0.35, r * 0.25, 0, TAU);
  ctx.fill();
  ctx.restore();
}
function prechorus(ctx, t, sec) {
  const s = sub(t, [[56.05, 'lion'], [57.4, 'cheese'], [59.75, 'croc'], [61.34, 'cabbage']]);
  const lt = s.lt;
  if (s.key === 'lion') {
    sky(ctx, '#ffcf3c', '#ffe58a');
    halftone(ctx, 'rgba(255,120,40,0.35)', 30, 10);
    sunburst(ctx, t, W / 2, 560, 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)', 18, 0.4);
    const y = 700;
    const pop = easeOutBack(clamp(lt / 0.3));
    front(ctx, W / 2, y + 330, 1.6, { expr: 'shout', wag: wag(t), ...costume('lion', t), overBody: (c, o, v) => {
      c.save(); c.translate(0, -194); c.scale(pop, pop); c.translate(0, 194); costume('lion', t).overBody(c, o, v); c.restore();
    } });
    for (let i = 0; i < 7; i++) {
      const a = t * 1.4 + (i / 7) * TAU;
      bonbon(ctx, W / 2 + Math.cos(a) * 640, 520 + Math.sin(a) * 300, 44, a * 2, ['#ff5d8f', '#4cc3ff', '#ffd84d', '#37c45c'][i % 4]);
    }
  } else if (s.key === 'cheese') {
    sky(ctx, '#4cb8ff', '#bfe9ff');
    P.clouds(ctx, t, lt * 3000, 0.4, 100);
    speedLines(ctx, t, 1, -1, 'rgba(255,255,255,0.85)');
    const k = lt / s.dur;
    const x = lerp(-300, W + 300, k);
    const y = 560 + Math.sin(lt * 5) * 80 - k * 120;
    smokeTrail(ctx, k, (ff) => [lerp(-300, W + 300, ff) - 200, 560 + Math.sin(ff * s.dur * 5) * 80 - ff * 120], 0.6, 0.02, '#ffffff');
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.12 + Math.sin(lt * 5) * 0.08);
    ctx.scale(1.6, 1.6);
    ctx.translate(0, 90);
    drawBreeSide(ctx, { phase: null, ear: 1, mouth: 1, eyes: 'happy', wag: wag(t), ...withRocket(costume('cheese', t), t) });
    ctx.restore();
    bigLabel(ctx, 'FOGUETE!', W / 2, 170, 120, '#ff8c42', lt * 2.5, -0.05);
  } else if (s.key === 'croc') {
    sky(ctx, '#7ee08a', '#c9f6d3');
    halftone(ctx, 'rgba(30,140,60,0.3)', 30, 10);
    sunburst(ctx, t, W / 2, 560, 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0)', 18, 0.4);
    const x = W / 2 + Math.sin(t * 5) * 30;
    const y = 1040;
    front(ctx, x, y, 1.5, { expr: 'shout', wag: wag(t), tilt: Math.sin(t * 7) * 0.1, ...costume('croc', t) });
  } else if (s.key === 'cabbage') {
    sky(ctx, '#b77dff', '#e7d4ff');
    halftone(ctx, 'rgba(255,255,255,0.25)', 30, 8);
    const x0 = 100, y0 = 300, x1 = W - 100, y1 = 900;
    P.rail(ctx, x0, y0, x1, y1);
    const k = 0.12 + 0.88 * Math.pow(clamp(lt / s.dur), 1.4);
    const x = lerp(x0, x1, k), y = lerp(y0, y1, k);
    const ang = Math.atan2(y1 - y0, x1 - x0);
    ctx.save();
    ctx.translate(x, y - 12);
    ctx.rotate(ang);
    P.skate(ctx, -50, 0, 1, t * 30);
    P.skate(ctx, 80, 0, 1, t * 30);
    ctx.translate(0, -58);
    ctx.rotate(Math.sin(t * 20) * 0.06);
    ctx.scale(1.05, 1.05);
    drawBreeSide(ctx, { phase: null, ear: 1, mouth: 1, eyes: 'wide', wag: wag(t), ...costume('cabbage', t) });
    ctx.restore();
    // sparks
    for (let i = 0; i < 10; i++) {
      const a = (t * 7 + i * 0.3) % 1;
      ctx.fillStyle = '#ffd84d';
      ctx.beginPath();
      ctx.arc(x - a * 200 * Math.cos(ang) + noise(i + t * 5) * 30, y - a * 200 * Math.sin(ang) - 20 + a * 60, 8 * (1 - a), 0, TAU);
      ctx.fill();
    }
  }
  // comic panel border
  ctx.strokeStyle = INK;
  ctx.lineWidth = 26;
  ctx.strokeRect(13, 13, W - 26, H - 26);
}

function chorus(ctx, t, sec) {
  const lt = sec.lt;
  const fin = sec.opts.final;
  // kitchen for 'corre pela cozinha', living room for 'três voltas pela sala'
  const tv = (fin ? 153.14 : 73.96) - sec.start;
  const sala = lt >= tv;
  if (sala) livingRoom(ctx, t);
  else room(ctx, 'kitchen', 200, t);
  if (fin) {
    // disco lights
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const a = Math.sin(t * 1.3 + i * 1.7) * 0.6;
      const c = ['rgba(255,80,160,0.18)', 'rgba(80,200,255,0.18)', 'rgba(255,230,80,0.18)', 'rgba(120,255,140,0.18)', 'rgba(190,120,255,0.18)'][i];
      ctx.fillStyle = c;
      ctx.beginPath();
      const ox = 300 + i * 330;
      ctx.moveTo(ox, -20);
      ctx.lineTo(ox + Math.sin(a) * 900 - 200, H + 50);
      ctx.lineTo(ox + Math.sin(a) * 900 + 200, H + 50);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // disco ball
    ctx.save();
    ctx.translate(W / 2, 90);
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, TAU);
    fillStroke(ctx, '#d7dbea', INK, 6);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 12; i++) {
      const a = t * 2 + i;
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(a * 3);
      ctx.fillRect(Math.cos(a) * 40 - 6, Math.sin(i) * 40 - 6, 12, 12);
    }
    ctx.restore();
  }
  // lap progress (laps per second), faster on 'três voltas'
  const base = 1 / 3.4;
  const laps = lt < tv ? lt * base : tv * base + (lt - tv) * (3 / 3.7);
  const th = laps * TAU + Math.PI / 2;
  const cx = W / 2, cy = 880, R = 640, r = 120;
  const bx = cx + Math.cos(th) * R;
  const depth = Math.sin(th); // >0 front
  const by = cy + depth * r;
  const scl = lerp(0.62, 1.05, (depth + 1) / 2);
  const dir = -Math.sin(th) > 0 ? 1 : -1;
  const o = { phase: run(t, 2), amp: 1, ear: 1, mouth: 0.6, eyes: 'happy', wag: wag(t) };
  const drawB = () => {
    drawBreeZoom(ctx, bx, by, scl, dir, o, 4, 50 * scl);
    dust(ctx, t, bx - dir * 120 * scl, by, t - (t % 0.25), 3, 26 * scl, '#ffffff');
  };
  if (depth < 0) drawB();
  if (sala) {
    P.furniture(ctx, 'sofa', cx - 312, 820);
  } else P.island(ctx, cx, 760);
  if (depth >= 0) drawB();
  // flour puffs on hits
  const h = hitAt(t);
  if (h > 0.5 && !sala) {
    ctx.globalAlpha = (h - 0.5) * 1.5;
    blob(ctx, [[cx + 175, 560, 60], [cx + 120, 520, 45], [cx + 230, 520, 40]], '#ffffff', 0);
    ctx.globalAlpha = 1;
  }
  speedLines(ctx, t, 0.35, dir, 'rgba(255,255,255,0.7)', 0, 500);
  // line-specific gags
  const ll = t - sec.start;
  if (ll > 3.58 && ll < 7.2) hearts(ctx, t, 14, 9);
  if (ll > 7.28 && ll < 10.5) {
    // a hand trying to grab her
    const k = (ll - 7.28) / 3.2;
    const gx = bx + 200 * Math.sin(k * 20);
    P.pointingHand(ctx, gx, -120 + Math.sin(k * Math.PI) * 300, 0.6, Math.PI / 2);
    bigLabel(ctx, 'ESCAPOU!', 1580, 240, 110, '#ff5d8f', (ll - 8.6) * 3, 0.1);
  }
  if (lt >= tv) {
    const n = Math.min(3, Math.floor(laps - tv * base) + 1);
    const age = (laps - tv * base) % 1;
    bigLabel(ctx, `${n}${n === 3 ? '!!!' : ''}`, 1700, 240, 220, ['#ffd84d', '#4cc3ff', '#ff5d8f'][n - 1], age * 4, 0.1);
    ctx.font = `64px ${COMIC}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = INK;
    ctx.fillText('VOLTA', 1700, 380);
  }
  if (fin) confetti(ctx, lt, 160, 4, 1);
  // fluffy wipe kitchen -> sala
  const wk = (lt - (tv - 0.3)) / 0.3;
  if (wk > 0 && wk < 2) fluffWipe(ctx, wk);
}
function livingRoom(ctx, t) {
  room(ctx, 'living', 0, t, false);
  P.furniture(ctx, 'window', 140, FY, t);
  P.furniture(ctx, 'lamp', 1580, FY, t);
  P.furniture(ctx, 'plant', 1760, FY, t);
  P.furniture(ctx, 'frame', 1180, FY, t);
  // round rug she laps around
  ctx.beginPath();
  ctx.ellipse(W / 2, 880, 720, 170, 0, 0, TAU);
  fillStroke(ctx, '#ffb3cf', INK, 6);
  ctx.beginPath();
  ctx.ellipse(W / 2, 880, 600, 120, 0, 0, TAU);
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
}

function thunder(ctx, t, sec) {
  const lt = sec.lt;
  const fin = sec.opts.final;
  sky(ctx, '#1d1240', '#5b3a8f');
  // storm clouds
  ctx.save();
  for (let i = 0; i < 9; i++) {
    const x = ((i * 260 - t * 40) % (W + 400) + W + 400) % (W + 400) - 200;
    blob(ctx, [[x, 110 + (i % 3) * 40, 120], [x + 110, 140, 90], [x - 110, 150, 80]], '#3d2b6b', 5, '#140b2e');
  }
  ctx.restore();
  // lightning on chant words and big hits
  const line = burstAt(t);
  const wi = nearWord(t, line, 0.25);
  let L = 0;
  if (wi >= 0) L = 1 - (t - line.words[wi][0]) / 0.25;
  const trov = LYRICS.find((l) => l.kind === 'sing' && t > l.t && t < l.e);
  if (trov) {
    const tk = trov.t + (trov.e - trov.t) * 0.82;
    if (t > tk && t < tk + 0.3) L = Math.max(L, 1 - (t - tk) / 0.3);
  }
  const hh = hitAt(t);
  if (fin && hh > 0.75) L = Math.max(L, (hh - 0.75) * 3);
  if (L > 0) {
    const seed = Math.floor(t * 4);
    lightning(ctx, 300 + rand(seed) * 1300, -20, 700, seed, 16);
    if (fin) lightning(ctx, 200 + rand(seed + 9) * 1500, -20, 650, seed + 9, 12);
    flash(ctx, L * 0.45, '#e8e0ff');
  }
  if (fin) {
    // rain
    ctx.strokeStyle = 'rgba(200,210,255,0.35)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 120; i++) {
      const x = (rand(i) * W + t * 200) % W;
      const y = (rand(i + 50) * H + t * 1600) % H;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 12, y + 40);
      ctx.stroke();
    }
  }
  // the world
  const gr = 760;
  P.globe(ctx, W / 2, H + gr - 300, gr, -t * 0.9);
  // Bree running on top with cape
  const bx = W / 2, by = H - 300 + 6;
  const tilt = Math.sin(t * 2) * 0.04;
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(tilt);
  cape(ctx, t, 0, 0, 1.25, 1);
  // Brie turns into whatever is being chanted: “CÔVE” / MINHOCA / “LINHÃO”
  let cw = -1;
  if (line) for (let i = 0; i < line.words.length; i++) if (t >= line.words[i][0]) cw = i;
  const kind = cw >= 0 ? (/CÔVE/.test(line.words[cw][1]) ? 'cabbage' : /MINHOCA/.test(line.words[cw][1]) ? 'worm' : 'lion') : null;
  bree(ctx, 0, 0, 1.25, 1, { phase: run(t, 2), amp: 1, ear: 1, mouth: wi >= 0 ? 1 : 0.5, eyes: wi >= 0 ? 'wide' : 'happy', wag: wag(t), ...(kind ? costume(kind, t) : {}) }, false);
  if (cw >= 0) {
    // costume-change poof
    const pa = (t - line.words[cw][0]) / 0.3;
    if (pa < 1) {
      ctx.globalAlpha = 1 - pa;
      const pr = 60 + pa * 90;
      blob(ctx, [[-60, -130, pr], [80, -170, pr * 0.9], [10, -60, pr * 0.8], [150, -120, pr * 0.6]], '#ffffff', 5, 'rgba(58,39,71,0.5)');
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
  speedLines(ctx, t, 0.5, -1, 'rgba(255,255,255,0.6)', 200, 800);
  if (fin) sparkles(ctx, t, bx, by - 200, 300, 12, 7, '#fff6a8');
  vignette(ctx, 0.45);
  void lt;
}

function interlude(ctx, t, sec) {
  const lt = sec.lt;
  const camX = 8000 + lt * 1500;
  room(ctx, 'hall', camX, t);
  const b = beatAt(t);
  const jumpPh = (b / 4) % 1;
  const jy = jumpPh > 0.75 ? Math.sin(((jumpPh - 0.75) / 0.25) * Math.PI) * 200 : 0;
  speedLines(ctx, t, 1, -1, 'rgba(255,255,255,0.8)', 300, 1000);
  shadow(ctx, 900, 960, 140 * (1 - jy / 400));
  bree(ctx, 900, 960 - jy, 1.35, 1, { phase: jy > 0 ? 0.3 : run(t, 2), amp: jy > 0 ? 0.3 : 1, ear: 1, mouth: 0.6, eyes: 'happy', wag: wag(t) }, false);
  dust(ctx, t, 760, 960, t - (t % 0.22), 3, 30, '#f6e2c8');
}

function verse2(ctx, t, sec) {
  const s = sub(t, [[98.24, 'track'], [101.7, 'fly'], [105.7, 'zoo'], [109.5, 'space'], [113.78, 'pause'], [117.42, 'turbo']]);
  const lt = s.lt;
  if (s.key === 'track') {
    const camX = 12000 + lt * 900;
    room(ctx, 'hall', camX, t);
    // lane lines and checkered flag
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.setLineDash([60, 40]);
    ctx.lineDashOffset = camX;
    ctx.beginPath();
    ctx.moveTo(-50, FY + 240);
    ctx.lineTo(W + 50, FY + 240);
    ctx.stroke();
    ctx.setLineDash([]);
    const fx = 400 - lt * 900;
    if (fx > -200) {
      for (let r = 0; r < 6; r++) for (let c = 0; c < 2; c++) {
        ctx.fillStyle = (r + c) % 2 ? '#fff' : INK;
        ctx.fillRect(fx + c * 40, FY + 20 + r * 40, 40, 40);
      }
    }
    // "tapete é trampolim": a round trampoline rug scrolls in with the floor,
    // Brie runs onto it and launches right on the word "trampolim".
    const T_JUMP = 100.92, JUMP_DUR = 0.78;
    const rx = 900 - (t - (T_JUMP - 0.04)) * 900;
    const dip = t > T_JUMP - 0.14 && t < T_JUMP + 0.08 ? Math.sin(((t - (T_JUMP - 0.14)) / 0.22) * Math.PI) * 34 : 0;
    if (rx > -300 && rx < W + 300) {
      ctx.save();
      ctx.translate(rx, FY + 95);
      ctx.beginPath();
      ctx.ellipse(0, 6, 210, 50, 0, 0, TAU);
      fillStroke(ctx, '#2b6fd6', INK, 6);
      ctx.beginPath();
      ctx.moveTo(-176, 0);
      ctx.quadraticCurveTo(0, 2 * dip + 30, 176, 0);
      ctx.quadraticCurveTo(0, 2 * dip - 34, -176, 0);
      fillStroke(ctx, '#4cc3ff', INK, 4);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.setLineDash([18, 14]);
      ctx.beginPath();
      ctx.ellipse(0, 6, 192, 40, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    const jp = (t - T_JUMP) / JUMP_DUR;
    const air = jp >= 0 && jp < 1;
    const jy = air ? Math.sin(jp * Math.PI) * 380 : 0;
    const crouch = dip > 0 && !air;
    shadow(ctx, 900, FY + 95, 140 * (1 - jy / 600));
    ctx.save();
    ctx.translate(900, FY + 95 - jy + (crouch ? dip : 0));
    ctx.rotate(air ? -Math.sin(jp * Math.PI) * 0.22 : 0);
    ctx.scale(crouch ? 1.38 : 1.25, crouch ? 1.06 : 1.25);
    drawBreeSide(ctx, { phase: air ? 0.3 : run(t, 2), amp: air ? 0.6 : 1, ear: air ? 0.4 + jp : 1, mouth: 0.8, eyes: 'happy', wag: wag(t) });
    ctx.restore();
    if (t >= T_JUMP) bigLabel(ctx, 'BOING!', 1300, 420, 140, '#4cc3ff', t - T_JUMP, 0.1);
    speedLines(ctx, t, 0.5, -1);
  } else if (s.key === 'fly') {
    room(ctx, 'hall', 16000, t);
    const k = lt / s.dur;
    const z = lerp(0.3, 4.5, easeIn(k));
    const x = lerp(W * 0.35, W / 2, k), y = lerp(820, 1350, easeIn(k));
    focusLines(ctx, t, W / 2, H / 2, k, 'rgba(255,255,255,0.7)', 300);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(z, z);
    // wings sprout on "voando" ("e vem voando")
    drawWings(ctx, easeOutBack(clamp((t - 102.9) / 0.35)), Math.sin(t * 17) * 0.32);
    drawBreeFront(ctx, { expr: k > 0.55 ? 'shout' : 'happy', wag: wag(t), earFlop: 1, tilt: Math.sin(t * 6) * 0.1 });
    ctx.restore();
    if (k > 0.82) fluffWipe(ctx, (k - 0.82) / 0.18);
  } else if (s.key === 'zoo') {
    const camX = lt * 900;
    dayOutdoor(ctx, t, camX, { sun: true });
    P.zooGate(ctx, 760 - camX * 0.35, 900);
    speedLines(ctx, t, 0.7, -1, 'rgba(255,255,255,0.7)', 300, 900);
    const bx = 1000 + Math.sin(lt * 2.5) * 80;
    bree(ctx, bx, 960, 1.3, 1, { phase: run(t, 2), ear: 1, mouth: 0.9, eyes: 'happy', wag: wag(t), ...costume('croc', t) });
    dust(ctx, t, bx - 150, 960, t - (t % 0.25), 3, 30, '#f6e2c8');
    bigLabel(ctx, 'FUGIU!', 1450, 250, 130, '#43b75c', lt * 2.5, -0.08);
    if (lt < 0.45) fluffWipe(ctx, 1 + lt / 0.45);
  } else if (s.key === 'space') {
    sky(ctx, '#06051a', '#1d1450');
    twinkleStars(ctx, t, 220, H, 5);
    // planets
    ctx.beginPath();
    ctx.arc(1650, 220, 110, 0, TAU);
    fillStroke(ctx, '#ff9ec4', INK, 6);
    ctx.beginPath();
    ctx.arc(260, 880, 70, 0, TAU);
    fillStroke(ctx, '#7fd3ff', INK, 6);
    // ringed planet
    ctx.save();
    ctx.translate(1500 + Math.sin(lt) * 20, 640 + Math.cos(lt * 0.8) * 20);
    ctx.rotate(-0.3);
    ctx.beginPath();
    ctx.ellipse(0, 0, 260, 60, 0, Math.PI, TAU);
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#b77dff';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 140, 0, TAU);
    fillStroke(ctx, '#5fd77a', INK, 7);
    ctx.beginPath();
    ctx.ellipse(0, 0, 260, 60, 0, 0, Math.PI);
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#b77dff';
    ctx.stroke();
    ctx.restore();
    // Brie floating as a pão de queijo with orbit rings + astronaut helmet
    ctx.save();
    ctx.translate(820, 700 + Math.sin(lt * 1.4) * 40);
    ctx.rotate(-0.2 + Math.sin(lt * 0.9) * 0.12);
    ctx.scale(1.35, 1.35);
    ctx.save();
    ctx.translate(20, -110);
    ctx.rotate(-0.25);
    ctx.beginPath();
    ctx.ellipse(0, 0, 230, 52, 0, Math.PI, TAU);
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#b77dff';
    ctx.stroke();
    ctx.restore();
    drawBreeSide(ctx, { phase: (t * 0.6) % 1, amp: 0.5, ear: 0.2, mouth: 0.7, eyes: 'happy', wag: wag(t) * 0.3, ...costume('cheese', t) });
    ctx.save();
    ctx.translate(20, -110);
    ctx.rotate(-0.25);
    ctx.beginPath();
    ctx.ellipse(0, 0, 230, 52, 0, 0, Math.PI);
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#b77dff';
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(98, -165, 105, 0, TAU);
    ctx.fillStyle = 'rgba(190,230,255,0.25)';
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(98, -165, 80, -2.4, -1.6);
    ctx.stroke();
    ctx.restore();
    bigLabel(ctx, 'INTERGALÁCTICO!', W / 2, 140, 100, '#ffd84d', lt * 2, -0.03);
  } else if (s.key === 'pause') {
    room(ctx, 'living', 500, t);
    const pant = Math.sin(t * 16);
    front(ctx, W / 2, FY + 160, 1.7 + pant * 0.015, { expr: 'happy', wag: wag(t) * 0.5, tilt: 0.06 });
    // panting puffs
    for (let i = 0; i < 4; i++) {
      const a = ((t * 2 + i / 4) % 1);
      ctx.globalAlpha = 1 - a;
      blob(ctx, [[W / 2 + 140 + a * 160, FY - 290 - a * 120, 20 + a * 30]], '#ffffff', 4, 'rgba(58,39,71,0.4)');
    }
    ctx.globalAlpha = 1;
    P.clock(ctx, 1550, 300, 110, Math.min(2, lt * 0.8) * 1 + 0.0);
    bigLabel(ctx, lt < 1.5 ? '1...' : '2...', 1550, 520, 110, '#4cc3ff', (lt % 1.5) * 3, 0.05);
    bigLabel(ctx, 'HAF HAF', 420, 360, 100, '#ff9ec4', lt * 2, -0.08);
  } else if (s.key === 'turbo') {
    const launch = 2.6;
    const k = lt < launch ? 0 : (lt - launch) / (s.dur - launch);
    room(ctx, 'hall', 20000 + easeIn(k) * 4000, t);
    if (k > 0) speedLines(ctx, t, 1.2, -1);
    const v = clamp(lt / launch * 1.05);
    P.gauge(ctx, 1600, 330, 200, v + (v >= 1 ? Math.sin(t * 40) * 0.03 : 0));
    const shake = lt < launch ? noise(t * 40) * 6 * v : 0;
    const x = lerp(700, W + 500, easeIn(k));
    if (k > 0) {
      // flame burst behind
      ctx.save();
      ctx.translate(x - 160, 900);
      const fl = 1 + 0.3 * Math.sin(t * 60);
      ctx.beginPath();
      ctx.moveTo(0, -60);
      ctx.quadraticCurveTo(-320 * fl, 0, 0, 60);
      ctx.closePath();
      fillStroke(ctx, '#ff8c42', INK, 5);
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.quadraticCurveTo(-180 * fl, 0, 0, 30);
      ctx.closePath();
      fillStroke(ctx, '#fff27a', null, 0);
      ctx.restore();
    }
    drawBreeZoom(ctx, x + shake, 960, 1.3, 1, { phase: k > 0 ? run(t, 3) : run(t, 4) * 0.3, amp: k > 0 ? 1 : 0.25, ear: k > 0 ? 1 : 0.3, mouth: 0.5, eyes: k > 0 ? 'happy' : 'wide', wag: wag(t) }, k > 0 ? 6 : 0, 90);
    if (lt > launch - 0.1 && lt < launch + 1.2) bigLabel(ctx, 'TURBO!', W / 2, 520, 200, '#ff5d8f', (lt - launch) * 3, -0.06);
    if (lt > launch) dust(ctx, t, 600, 960, s.start + launch, 10, 60, '#f6e2c8');
  }
}

function humanShadow(ctx, x, y, s, a) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = `rgba(30,15,50,${a})`;
  ctx.beginPath();
  ctx.arc(0, -760, 90, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-130, -650);
  ctx.lineTo(130, -650);
  ctx.lineTo(170, -300);
  ctx.lineTo(110, 0);
  ctx.lineTo(-110, 0);
  ctx.lineTo(-170, -300);
  ctx.closePath();
  ctx.fill();
  // arms on hips
  ctx.lineWidth = 60;
  ctx.lineCap = 'round';
  ctx.strokeStyle = ctx.fillStyle;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * 120, -620);
    ctx.lineTo(sx * 280, -470);
    ctx.lineTo(sx * 160, -360);
    ctx.stroke();
  }
  ctx.restore();
}

function build(ctx, t, sec) {
  const lt = sec.lt;
  const k = lt / sec.dur;
  room(ctx, 'living', 600, t);
  ctx.fillStyle = `rgba(20,10,40,${0.25 + 0.35 * k})`;
  ctx.fillRect(0, 0, W, H);
  humanShadow(ctx, 1250, FY + 40, lerp(0.6, 1.25, easeIn(k)), 0.65);
  const shake = noise(t * 30) * 8 * k;
  front(ctx, 640 + shake, FY + 170, 1.3, { expr: 'guilty', wag: 0, tilt: -0.1 });
  // sweat drop
  ctx.save();
  ctx.translate(780, FY - 260 + (lt % 1) * 40);
  ctx.beginPath();
  ctx.moveTo(0, -30);
  ctx.quadraticCurveTo(22, 0, 0, 16);
  ctx.quadraticCurveTo(-22, 0, 0, -30);
  fillStroke(ctx, '#7fd3ff', INK, 4);
  ctx.restore();
  if (lt > 2.6) bigLabel(ctx, 'UH-OH...', 640, 300, 110, '#ffd84d', (lt - 2.6) * 2, -0.06);
  vignette(ctx, 0.6 + k * 0.3);
}

function breakdown(ctx, t, sec) {
  const s = sub(t, [[126.14, 'point'], [128.14, 'nao'], [129.56, 'bed'], [131.74, 'duvet']]);
  const lt = s.lt;
  if (s.key === 'point') {
    room(ctx, 'living', 600, t);
    ctx.fillStyle = 'rgba(40,10,30,0.35)';
    ctx.fillRect(0, 0, W, H);
    front(ctx, 700, FY + 170, 1.3, { expr: 'guilty', tilt: -0.12 });
    const hin = easeOutBack(lt / 0.35);
    ctx.save();
    ctx.translate(lerp(W + 400, 1500, hin), 520 + Math.sin(t * 20) * 6);
    ctx.scale(-1, 1);
    P.pointingHand(ctx, 0, 0, 1.0, 0.25);
    ctx.restore();
    const drop = easeOut((t - 127.12) / 0.3);
    if (t > 127.12) {
      P.jailBars(ctx, 700, FY + 190, 420, 480, drop);
      if (drop >= 1 && t < 127.34) flash(ctx, 0.3);
    }
  } else if (s.key === 'nao') {
    sky(ctx, '#ff5d5d', '#ff9a8a');
    halftone(ctx, 'rgba(120,0,30,0.3)', 30, 10);
    const line = burstAt(t);
    const wi = nearWord(t, line, 0.45);
    const shakeAmt = wi >= 0 ? Math.sin((t - line.words[wi][0]) * 40) * Math.exp(-(t - line.words[wi][0]) * 6) : 0;
    ctx.save();
    ctx.translate(W / 2 + shakeAmt * 40, 640);
    ctx.scale(2.4, 2.4);
    ctx.rotate(shakeAmt * 0.35);
    drawFrontHead(ctx, 'guilty', 6, {});
    ctx.restore();
  } else if (s.key === 'bed') {
    sky(ctx, '#3a2a6b', '#6c4fa8');
    // warm glow
    const g = ctx.createRadialGradient(W / 2, 640, 50, W / 2, 640, 800);
    g.addColorStop(0, 'rgba(255,170,90,0.75)');
    g.addColorStop(1, 'rgba(255,170,90,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    P.bed(ctx, W / 2, 960, 1.4);
    // Bree lying on the bed, tail end glowing
    ctx.save();
    ctx.translate(W / 2 - 20, 960 - 200 * 1.4 + 10);
    ctx.scale(-1.2, 1.2);
    drawBreeSide(ctx, { phase: null, eyes: 'closed', mouth: 0, wag: Math.sin(t * 2) });
    ctx.restore();
    // heat waves
    ctx.strokeStyle = 'rgba(255,120,60,0.85)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const x = W / 2 + 120 + i * 40;
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const yy = 600 - k * 16 - ((t * 60) % 16);
        const xx = x + Math.sin(k * 0.9 + t * 6) * 12;
        k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
      }
      ctx.stroke();
    }
    // Zzz
    for (let i = 0; i < 3; i++) {
      const a = (t * 0.6 + i / 3) % 1;
      ctx.globalAlpha = Math.sin(a * Math.PI);
      ctx.font = `${50 + a * 40}px ${COMIC}`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Z', W / 2 - 300 - a * 80, 560 - a * 200);
    }
    ctx.globalAlpha = 1;
  } else if (s.key === 'duvet') {
    room(ctx, 'bedroom', 900 + lt * 600, t);
    const k = lt / s.dur;
    const bx = lerp(200, W + 300, k);
    const by = 960;
    // duvet trailing behind
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const d = i * 60;
      pts.push([bx - 60 - d, by - 150 + d * 0.18 + Math.sin(t * 14 - i * 0.6) * (10 + i * 3)]);
    }
    duvetBehind(ctx, pts);
    bree(ctx, bx, by, 1.1, 1, { phase: run(t, 2), ear: 1, mouth: 0.3, eyes: 'happy', wag: wag(t) });
    speedLines(ctx, t, 0.6, 1, 'rgba(255,255,255,0.7)', 500, 1000);
  }
}
function duvetBehind(ctx, pts) {
  P.duvetShape(ctx, pts, 130);
}

function silence(ctx, t, sec) {
  const lt = sec.lt;
  ctx.fillStyle = '#0c0818';
  ctx.fillRect(-100, -100, W + 200, H + 200);
  // spotlight
  const g = ctx.createRadialGradient(W / 2, 760, 40, W / 2, 760, 520);
  g.addColorStop(0, 'rgba(255,236,190,0.55)');
  g.addColorStop(1, 'rgba(255,236,190,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 90, -50);
  ctx.lineTo(W / 2 + 90, -50);
  ctx.lineTo(W / 2 + 480, 980);
  ctx.lineTo(W / 2 - 480, 980);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,236,190,0.25)';
  ctx.beginPath();
  ctx.ellipse(W / 2, 930, 420, 60, 0, 0, TAU);
  ctx.fill();
  // burrito
  const breathe = 1 + Math.sin(lt * 3) * 0.02;
  ctx.save();
  ctx.translate(W / 2, 900);
  ctx.scale(breathe, breathe);
  ctx.beginPath();
  ctx.ellipse(0, -110, 260, 130, 0, 0, TAU);
  fillStroke(ctx, '#7fb6ff', INK, 8);
  ctx.save();
  ctx.clip();
  for (let i = 0; i < 9; i++) clover(ctx, -220 + i * 55, -110 + (i % 2) * 40 - 20, 18, i, '#ffffff', 0);
  ctx.strokeStyle = 'rgba(58,39,71,0.35)';
  ctx.lineWidth = 6;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(-60 + i * 90, -110, 40, 130, 0.3, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
  ctx.translate(-250, -170);
  ctx.rotate(-0.15);
  ctx.scale(0.95, 0.95);
  drawFrontHead(ctx, lt < 1.8 ? 'innocent' : 'sleepy', 6, {});
  ctx.restore();
}

function restart(ctx, t, sec) {
  const lt = sec.lt;
  // rainbow sunburst
  const cols = ['#ff5d5d', '#ff9a3c', '#ffd84d', '#5fd77a', '#4cc3ff', '#b77dff'];
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(t * 0.8);
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = cols[i % 6];
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 2000, (i / 24) * TAU, ((i + 1) / 24) * TAU);
    ctx.fill();
  }
  ctx.restore();
  focusLines(ctx, t, W / 2, H / 2, 1, 'rgba(255,255,255,0.9)', 260);
  // duvet pieces flying away
  if (lt < 1.4) {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      const d = easeOut(lt / 1.2) * 1200;
      ctx.save();
      ctx.translate(W / 2 + Math.cos(a) * d, 760 + Math.sin(a) * d * 0.6);
      ctx.rotate(lt * 8 + i);
      ctx.beginPath();
      ctx.roundRect(-90, -60, 180, 120, 30);
      fillStroke(ctx, '#7fb6ff', INK, 6);
      clover(ctx, 0, 0, 22, i, '#fff', 0);
      ctx.restore();
    }
  }
  // Bree zooming across in alternating directions after the blast
  if (lt < 1.86) {
    const s = 1.6 * easeOutBack(lt / 0.4);
    front(ctx, W / 2, 1000, s, { expr: 'shout', wag: wag(t), earFlop: 1 }, false);
  } else {
    const k = lt - 1.86;
    const pd = 0.6;
    const i = Math.floor(k / pd);
    const f = (k % pd) / pd;
    const dir = i % 2 ? -1 : 1;
    const y = [700, 900, 560, 820][i % 4];
    const x = dir > 0 ? lerp(-400, W + 400, f) : lerp(W + 400, -400, f);
    // rainbow trail
    for (let c = 0; c < 6; c++) {
      ctx.strokeStyle = cols[c];
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(x - dir * 80, y - 120 + c * 18);
      ctx.lineTo(x - dir * 900, y - 120 + c * 18);
      ctx.stroke();
    }
    drawBreeZoom(ctx, x, y, 1.1, dir, { phase: run(t, 3), ear: 1, mouth: 0.9, eyes: 'happy', wag: wag(t) }, 4, 70);
  }
  flash(ctx, clamp(1 - lt / 0.4));
}

function outro(ctx, t, sec) {
  const lt = sec.lt;
  const k = lt / sec.dur;
  sky(ctx, '#ff9ec4', '#ffe0a8');
  P.sun(ctx, 1500, lerp(900, 260, easeOut(k * 1.4)), 120, t);
  P.clouds(ctx, t, 0, 0.1, 140, 0.9);
  P.hills(ctx, 0, 720, 50, '#c4b0ff', 0, 2);
  P.castle(ctx, 700, 760, 0.8, { t });
  P.hills(ctx, 0, 880, 50, '#7ad46a', 0, 4, true);
  const giant = t > 178.98;
  if (giant) {
    const g = easeOut((t - 178.98) / 1.2);
    ctx.save();
    ctx.globalAlpha = 0.45 * g;
    const gl = ctx.createRadialGradient(1300, 420, 50, 1300, 420, 700);
    gl.addColorStop(0, 'rgba(255,242,122,0.9)');
    gl.addColorStop(1, 'rgba(255,242,122,0)');
    ctx.fillStyle = gl;
    ctx.fillRect(0, 0, W, H);
    front(ctx, 1300, 1080 + 200, lerp(1, 4.4, g), { expr: 'shout', wag: wag(t), crown: true }, false);
    ctx.restore();
    sparkles(ctx, t, 1300, 500, 600, 20, 11, '#fff27a');
  }
  const bs = giant ? 0.9 : 1.4;
  front(ctx, 1300, 980, bs, { expr: giant ? 'shout' : 'happy', wag: wag(t), crown: true, tilt: Math.sin(t * 2) * 0.06 });
  if (!giant) sparkles(ctx, t, 1300, 980 - 300 * bs, 160, 10, 4, '#fff6a8');
  if (lt < 0.5) flash(ctx, 1 - lt / 0.5, '#ffe0a8');
}

function finale(ctx, t, sec) {
  const lt = sec.lt;
  sky(ctx, '#2a1a5e', '#ff7da5');
  sunburst(ctx, t, W / 2, H * 0.6, 'rgba(255,230,120,0.35)', 'rgba(255,230,120,0)', 20, 0.4);
  for (let i = 0; i < 8; i++) {
    const t0 = i * 0.8;
    firework(ctx, 200 + rand(i) * (W - 400), 160 + rand(i + 3) * 300, lt - t0, i, ['#ffd84d', '#ff5d8f', '#4cc3ff', '#5fd77a'][i % 4]);
  }
  const line = burstAt(t);
  const wi = nearWord(t, line, 0.3);
  const hop = wi >= 0 ? Math.sin(clamp((t - line.words[wi][0]) / 0.3) * Math.PI) * 80 : Math.abs(Math.sin(beatAt(t) * Math.PI)) * 20;
  front(ctx, W / 2, 1040 - hop, 1.6, { expr: wi >= 0 ? 'shout' : 'happy', wag: wag(t), crown: true, earFlop: 0.6 });
  confetti(ctx, lt, 120, 7, 1);
  if (lt < 0.3) flash(ctx, 1 - lt / 0.3);
}

function parade(ctx, t, sec) {
  const lt = sec.lt;
  const NIGHT = 18.2; // switch to castle fireworks for the last ~8 s
  if (lt < NIGHT) {
    const camX = lt * 700;
    const dusk = clamp((lt - 13) / 5);
    sky(ctx, lerpColor('#6fd0ff', '#ff9ec4', dusk), lerpColor('#d9f6ff', '#ffe0a8', dusk));
    P.sun(ctx, 1620, 180 + dusk * 300, 80, t);
    P.clouds(ctx, t, camX, 0.1);
    P.hills(ctx, camX, 640, 70, '#9be38f', 0.2, 1);
    P.hills(ctx, camX, 780, 60, '#6fd36a', 0.5, 3, true);
    // banner
    ctx.save();
    ctx.translate(W / 2, 150);
    ctx.rotate(Math.sin(t * 2) * 0.02);
    ctx.font = `110px ${COMIC}`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 16;
    ctx.strokeStyle = INK;
    ctx.lineJoin = 'round';
    ctx.strokeText('O DESFILE DE CLOVERLEAF', 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('O DESFILE DE CLOVERLEAF', 0, 0);
    ctx.restore();
    const enter = (i) => lerp(-900, 0, easeOut((lt - i * 0.6) / 1.5));
    const hop = (i) => Math.abs(Math.sin(beatAt(t) * Math.PI + i)) * 30;
    // the costume parade: every character was Brie all along
    const tr = (i, x, y, sc, kind, o = {}) => {
      shadow(ctx, x + enter(i), 964, 90 * sc);
      bree(ctx, x + enter(i), y - hop(i), sc, 1, { phase: run(t, 2), ear: 0.8, mouth: 0.7, eyes: 'happy', wag: wag(t), ...o, ...costume(kind, t) }, false);
    };
    tr(5, 140, 960, 0.66, 'croc');
    tr(4, 500, 960, 0.66, 'worm');
    tr(3, 770, 960, 0.66, 'cheese');
    // côve on skates
    ctx.save();
    ctx.translate(1030 + enter(2), 960 - hop(2));
    P.skate(ctx, -34, 0, 0.7, t * 25);
    P.skate(ctx, 52, 0, 0.7, t * 25);
    ctx.translate(0, -40);
    ctx.scale(0.66, 0.66);
    drawBreeSide(ctx, { phase: null, ear: 0.8, mouth: 0.7, eyes: 'happy', wag: wag(t), ...costume('cabbage', t) });
    ctx.restore();
    tr(1, 1290, 960, 0.66, 'lion');
    // Bree leading with cape and crown
    const bx = 1650 + enter(0);
    cape(ctx, t, bx, 960, 1.0, 1);
    bree(ctx, bx, 960, 1.0, 1, { phase: run(t, 2), ear: 0.8, mouth: 0.7, eyes: 'happy', wag: wag(t) });
    ctx.save();
    ctx.translate(bx + 98, 960 - 230);
    ctx.scale(0.7, 0.7);
    drawCrown(ctx, 0, 0);
    ctx.restore();
    // floating notes
    for (let i = 0; i < 10; i++) {
      const a = (t * 0.4 + rand(i)) % 1;
      ctx.globalAlpha = Math.sin(a * Math.PI);
      ctx.font = `70px ${COMIC}`;
      ctx.fillStyle = ['#ff5d8f', '#4cc3ff', '#ffd84d'][i % 3];
      ctx.fillText(i % 2 ? '♪' : '♫', rand(i + 3) * W, 900 - a * 600);
    }
    ctx.globalAlpha = 1;
    if (lt > NIGHT - 0.5) fluffWipe(ctx, (lt - (NIGHT - 0.5)) / 0.5);
  } else {
    const k = lt - NIGHT;
    sky(ctx, '#140d33', '#4a2b7a');
    twinkleStars(ctx, t, 160, H * 0.75, 1);
    for (let i = 0; i < 14; i++) {
      firework(ctx, 200 + rand(i + 20) * (W - 400), 140 + rand(i + 23) * 320, k - i * 0.5, i + 20, ['#ffd84d', '#ff5d8f', '#4cc3ff', '#5fd77a', '#b77dff'][i % 5]);
    }
    P.hills(ctx, 0, 760, 50, '#3b2d6e', 0.0, 2);
    P.castle(ctx, W / 2, 820, 0.8, { t, night: true, gateOpen: 1, glow: 1 });
    P.hills(ctx, 0, 920, 40, '#2a1f55', 0.0, 5);
    logo(ctx, W / 2, 300, 0.9, k - 1.0, { ribbon: true });
    front(ctx, W / 2 + 520, 1040, 1.0, { expr: 'happy', wag: wag(t), crown: true });
    if (k < 0.5) fluffWipe(ctx, 1 + k / 0.5);
  }
}

function end(ctx, t, sec) {
  const lt = sec.lt;
  sunburst(ctx, t * 0.3, W / 2, H / 2, '#ffd84d', '#fff3b0', 22, 0.1);
  front(ctx, W / 2, 1070, 1.25, { expr: 'happy', wag: 0, crown: true });
  logo(ctx, W / 2, 260, 0.9, 1, { ribbon: true });
  ctx.font = `600 44px "Fredoka", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.fillText('Brie of Cloverleaf', W / 2, 560);
  if (lt < 0.15) flash(ctx, 1 - lt / 0.15);
  ctx.fillStyle = `rgba(0,0,0,${clamp((lt - 0.9) / 0.9)})`;
  ctx.fillRect(-100, -100, W + 200, H + 200);
}

function lerpColor(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp(pa >> 16, pb >> 16, k));
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, k));
  const bl = Math.round(lerp(pa & 255, pb & 255, k));
  return `rgb(${r},${g},${bl})`;
}

export const SCENES = { intro, entrance, title, arrive, verse1, prechorus, chorus, thunder, interlude, verse2, build, breakdown, silence, restart, outro, finale, parade, end };

// how much camera shake each section allows (0..1)
export const SHAKE = { intro: 0.1, entrance: 0.9, title: 0.5, arrive: 0.6, verse1: 0.45, prechorus: 0.6, chorus: 0.6, thunder: 1, interlude: 0.5, verse2: 0.45, build: 0.3, breakdown: 0.8, silence: 0, restart: 1, outro: 0.3, finale: 0.9, parade: 0.4, end: 0 };
