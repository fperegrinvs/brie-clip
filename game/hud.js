// On-screen counters: clovers, treats, friend album and the rocket meter.
import { W, H } from '../src/fx.js';
import { SING, COMIC } from '../src/text.js';
import { INK, TAU, clover, fillStroke, clamp, easeOutBack, star } from '../src/util.js';
import * as P from '../src/props.js';
import { FRIEND_KINDS } from './level.js';
import { FUEL_MAX } from './player.js';

function pill(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  fillStroke(ctx, 'rgba(255,255,255,0.88)', INK, 6);
}

function count(ctx, text, x, y, bump) {
  ctx.save();
  ctx.translate(x, y);
  const s = 1 + 0.25 * bump;
  ctx.scale(s, s);
  ctx.font = `600 50px ${SING}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = INK;
  ctx.fillText(text, 0, 2);
  ctx.restore();
}

export function friendIcon(ctx, kind, x, y, r, found) {
  ctx.save();
  if (!found) {
    ctx.filter = 'brightness(0)';
    ctx.globalAlpha = 0.18;
  }
  ctx.translate(x, y);
  if (kind === 'ufo') P.ufoToy(ctx, r * 1.2);
  else P.plushToy(ctx, kind, r);
  ctx.restore();
}

export function drawHUD(ctx, g) {
  const t = g.t;
  // clovers
  pill(ctx, 30, 26, 300, 86);
  clover(ctx, 80, 66, 26, Math.sin(t * 2) * 0.15, '#3fdc66', 4);
  count(ctx, `${g.clovers} / ${g.cloverTotal}`, 128, 70, g.bumpC);
  // treats
  pill(ctx, 350, 26, 230, 86);
  ctx.save();
  ctx.translate(400, 69);
  P.paoDeQueijo(ctx, 26, t);
  ctx.restore();
  count(ctx, `${g.treats} / ${g.treatTotal}`, 446, 70, g.bumpT);

  // friend album
  const n = FRIEND_KINDS.length, slot = 92;
  const x0 = W - 40 - n * slot - 20;
  pill(ctx, x0, 22, n * slot + 30, 96);
  FRIEND_KINDS.forEach((k, i) => {
    const found = g.friends.has(k);
    const bump = g.bumpF[k] ?? 0;
    const cx = x0 + 15 + slot * i + slot / 2;
    const s = 1 + 0.5 * bump;
    ctx.save();
    ctx.translate(cx, 70);
    ctx.scale(s, s);
    friendIcon(ctx, k, 0, 0, 28, found);
    ctx.restore();
    if (bump > 0) {
      ctx.save();
      ctx.globalAlpha = bump;
      for (let j = 0; j < 5; j++) {
        const a = (j / 5) * TAU + t * 3;
        star(ctx, cx + Math.cos(a) * 54, 70 + Math.sin(a) * 54, 12, 5, 4, a);
        ctx.fillStyle = '#ffd84d';
        ctx.fill();
      }
      ctx.restore();
    }
  });

  // rocket fuel
  if (g.player.costume === 'rocket') {
    const f = clamp(g.player.fuel / FUEL_MAX);
    pill(ctx, 30, 128, 300, 52);
    ctx.font = `28px ${COMIC}`;
    ctx.fillStyle = INK;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText('BOOST', 52, 156);
    ctx.beginPath();
    ctx.roundRect(140, 142, 170, 26, 13);
    ctx.fillStyle = '#efe4f5';
    ctx.fill();
    if (f > 0.01) {
      ctx.beginPath();
      ctx.roundRect(140, 142, 170 * f, 26, 13);
      ctx.fillStyle = f < 0.25 ? '#ff9ec4' : '#ffc23d';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.roundRect(140, 142, 170, 26, 13);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  if (g.muted) {
    ctx.font = `600 30px ${SING}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(58,39,71,0.6)';
    ctx.fillText('♪ off  (M)', W - 40, H - 30);
  }
}

// speech bubble above a friend, in world space
export function speech(ctx, text, x, y, age) {
  const p = easeOutBack(age / 0.3);
  const out = clamp((2.6 - age) / 0.3);
  if (p <= 0 || out <= 0) return;
  ctx.save();
  ctx.globalAlpha = out;
  ctx.translate(x, y);
  ctx.scale(p, p);
  ctx.font = `600 38px ${SING}`;
  const w = ctx.measureText(text).width + 60, h = 74;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h, w, h, 30);
  ctx.moveTo(-16, 0);
  ctx.lineTo(0, 26);
  ctx.lineTo(16, 0);
  fillStroke(ctx, '#ffffff', INK, 6);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-14, -6, 28, 8);
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, -h / 2 + 2);
  ctx.restore();
}
