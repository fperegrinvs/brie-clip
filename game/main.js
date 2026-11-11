// Brie's Cloverleaf Adventure: boot, input, game states, fixed-step loop and rendering.
import { W, H, sky, confetti, firework, sparkles, twinkleStars } from '../src/fx.js';
import { SING, COMIC, burstWord, logo } from '../src/text.js';
import { TAU, INK, clamp, lerp, easeOutBack, heart, star, clover, fillStroke, rand } from '../src/util.js';
import { drawBrieSide, drawCrown } from '../src/brie.js';
import * as P from '../src/props.js';
import { LEVEL, GY, zoneAt, BOUNDS, camMaxY, GOAL, FRIEND_KINDS, START } from './level.js';
import { makePlayer, updatePlayer, drawPlayer, COSTUME_NAMES, S } from './player.js';
import { drawBackground, drawWorldBack, drawLevel, drawWaterFront, drawCollectibles, drawFriend } from './world.js';
import { drawHUD, speech, friendIcon } from './hud.js';
import { initAudio, resumeAudio, setMuted, isMuted, sfx } from './audio.js';
import { loadSave, writeSave } from './save.js';

const canvas = document.getElementById('c');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');
const DT = 1 / 60;

/* ---------------- fonts ---------------- */
async function loadGameFonts() {
  try {
    const faces = [
      new FontFace('Fredoka', 'url(../fonts/Fredoka.ttf)', { weight: '300 700' }),
      new FontFace('Bangers', 'url(../fonts/Bangers.ttf)'),
    ];
    await Promise.all(faces.map((f) => f.load()));
    faces.forEach((f) => document.fonts.add(f));
  } catch {
    /* fall back to system fonts */
  }
}

/* ---------------- input ---------------- */
const held = new Set();
let pressedQueue = new Set();
const KEYMAP = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  jump: ['Space', 'ArrowUp', 'KeyW', 'KeyZ'],
};
const isDown = (name) => KEYMAP[name].some((k) => held.has(k));
const wasPressed = (name) => KEYMAP[name].some((k) => pressedQueue.has(k));
const GAME_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space']);

function keyDown(code, repeat = false) {
  if (!repeat) pressedQueue.add(code);
  held.add(code);
  onKey(code, repeat);
}
function keyUp(code) {
  held.delete(code);
}
window.addEventListener('keydown', (e) => {
  if (GAME_KEYS.has(e.code)) e.preventDefault();
  keyDown(e.code, e.repeat);
});
window.addEventListener('keyup', (e) => keyUp(e.code));
window.addEventListener('blur', () => held.clear());
canvas.addEventListener('pointerdown', () => canvas.focus());

/* ---------------- game state ---------------- */
const save = loadSave();
const g = {
  state: 'title', // title | play | paused | finale
  t: 0, playT: 0,
  player: makePlayer(START.x, START.y),
  cam: { x: 0, y: 0, px: 0, py: 0, ty: 0 },
  checkpoint: { ...START },
  clovers: 0, treats: 0, friends: new Set(),
  cloverTotal: LEVEL.clovers.length, treatTotal: LEVEL.treats.length,
  bumpC: 0, bumpT: 0, bumpF: {},
  particles: [],
  popups: [], // {text, age, life, style}
  banner: null, zone: null,
  respawnT: 0,
  finale: null,
  gateOpen: 0,
  muted: save.muted,
  debug: false,
  frameMs: 16.7,
  titleT: 0,
};
window.game = g;

function resetLevel() {
  for (const c of LEVEL.clovers) { c.got = false; c.gotT = 0; }
  for (const c of LEVEL.treats) { c.got = false; c.gotT = 0; }
  for (const f of LEVEL.friends) { f.got = false; f.gotT = 0; }
  for (const c of LEVEL.checkpoints) { c.on = false; c.anim = 0; }
  for (const m of LEVEL.movers) { m.time = 0; m.cx = m.x0; m.dx = 0; m.mover = true; }
  g.player = makePlayer(START.x, START.y);
  g.checkpoint = { ...START };
  g.clovers = 0;
  g.treats = 0;
  g.friends = new Set();
  g.practice = false; // set by debug teleports: nothing from this run is saved
  g.particles = [];
  g.popups = [];
  g.banner = null;
  g.zone = null;
  g.finale = null;
  g.gateOpen = 0;
  g.playT = 0;
  g.respawnT = 0;
  g.cam.x = g.cam.px = 0;
  g.cam.y = g.cam.py = g.cam.ty = 0;
}
resetLevel();

function startGame() {
  resetLevel();
  pressedQueue.clear();
  g.state = 'play';
  save.plays++;
  writeSave(save);
}

function onKey(code, repeat) {
  if (!repeat) {
    initAudio(g.muted);
    resumeAudio();
  }
  if (repeat) return;
  if (code === 'KeyM') {
    g.muted = !isMuted();
    setMuted(g.muted);
    save.muted = g.muted;
    writeSave(save);
    return;
  }
  if (code === 'Backquote') { g.debug = !g.debug; return; }
  if (g.debug && g.state === 'play' && /^Digit[1-6]$/.test(code)) {
    teleport(+code.slice(5));
    return;
  }
  switch (g.state) {
    case 'title':
      if (code === 'Space' || code === 'Enter') startGame();
      break;
    case 'play':
      if (code === 'Escape' || code === 'KeyP') { g.state = 'paused'; held.clear(); }
      break;
    case 'paused':
      if (code === 'Escape' || code === 'KeyP' || code === 'Space') g.state = 'play';
      else if (code === 'KeyR') startGame();
      else if (code === 'KeyQ') { resetLevel(); g.state = 'title'; }
      break;
    case 'finale':
      if (g.finale && g.finale.t > 5 && (code === 'Space' || code === 'Enter')) { resetLevel(); g.state = 'title'; }
      break;
  }
}

const TELEPORTS = {
  1: { x: 300, y: GY, costume: null },
  2: { x: 5760, y: GY, costume: null },
  3: { x: 11820, y: GY, costume: 'cabbage' },
  4: { x: 15500, y: 520, costume: 'croc' },
  5: { x: 16760, y: -380, costume: 'rocket' },
  6: { x: 17600, y: -2800, costume: 'rocket' },
};
function teleport(n) {
  const tp = typeof n === "object" ? n : TELEPORTS[n];
  if (!tp) return;
  const p = g.player;
  g.practice = true;
  p.x = p.px = tp.x;
  p.y = p.py = tp.y;
  p.vx = p.vy = 0;
  p.grind = null;
  p.costume = tp.costume;
  g.checkpoint = { x: tp.x, y: tp.y };
  snapCamera();
}

/* ---------------- particles ---------------- */
function addP(o) {
  if (g.particles.length > 500) g.particles.shift();
  g.particles.push({ age: 0, vx: 0, vy: 0, grav: 0, rot: 0, spin: 0, ...o });
}
function burstSparkles(x, y, n = 8, color = '#fff6a8', speed = 420) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + Math.random() * 0.4;
    const sp = speed * (0.5 + Math.random() * 0.6);
    addP({ type: 'star', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.6, size: 14 + Math.random() * 10, color, spin: 6 });
  }
}
function burstHearts(x, y, n = 5) {
  for (let i = 0; i < n; i++) {
    addP({ type: 'heart', x: x + (Math.random() - 0.5) * 60, y, vx: (Math.random() - 0.5) * 160, vy: -220 - Math.random() * 180, life: 1.2, size: 18 + Math.random() * 10, color: ['#ff5d8f', '#ff9ec4', '#ffb3d1'][i % 3] });
  }
}
function poof(x, y, n = 12) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    addP({ type: 'puff', x, y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 200, life: 0.55, size: 34 + Math.random() * 20, color: '#ffffff' });
  }
  burstSparkles(x, y, 6, '#ffd84d', 500);
}

function ev(name, d = {}) {
  const p = g.player;
  switch (name) {
    case 'jump':
      sfx('jump');
      for (let i = 0; i < 3; i++) addP({ type: 'puff', x: p.x + (i - 1) * 24, y: p.y, vx: (i - 1) * 90, vy: -40, life: 0.35, size: 18, color: '#ffffff' });
      break;
    case 'whee':
      sfx('whee');
      burstSparkles(p.x, p.y - 40, 8);
      break;
    case 'spark':
      addP({ type: 'spark', x: d.x, y: d.y, vx: -p.facing * (150 + Math.random() * 250), vy: -100 - Math.random() * 300, grav: 1800, life: 0.35, size: 6, color: ['#ffd84d', '#fff6a8', '#ff9ec4'][(Math.random() * 3) | 0] });
      break;
    case 'splash':
      sfx('splash');
      for (let i = 0; i < 14; i++) addP({ type: 'drop', x: d.x + (Math.random() - 0.5) * 70, y: d.y, vx: (Math.random() - 0.5) * 500, vy: -300 - Math.random() * 500, grav: 2400, life: 0.7, size: 9 + Math.random() * 7, color: '#bfeaff' });
      break;
    case 'bubble':
      addP({ type: 'bubble', x: d.x, y: d.y, vx: (Math.random() - 0.5) * 30, vy: -120, life: 1.4, size: 8 + Math.random() * 10, color: '#ffffff' });
      break;
    case 'wiggle':
      sfx('wiggle');
      break;
    case 'flame':
      addP({ type: 'flame', x: d.x + (Math.random() - 0.5) * 12, y: d.y, vx: -p.facing * 60 + (Math.random() - 0.5) * 60, vy: 380 + Math.random() * 200, life: 0.3, size: 20 + Math.random() * 10, color: '#ffb347' });
      break;
    case 'bonk':
      if (g.t - (g.lastBonk ?? 0) > 0.3) { sfx('bonk'); g.lastBonk = g.t; }
      break;
    case 'boing':
      sfx('boing');
      burstSparkles(d.x, d.y, 10, '#ffffff', 520);
      burstHearts(d.x, d.y - 20, 3);
      break;
    case 'grind':
      sfx('grind');
      break;
    case 'land':
      sfx('land');
      for (let i = 0; i < (d.big ? 6 : 3); i++) addP({ type: 'puff', x: d.x + (i - 1) * 26, y: d.y, vx: (i % 2 ? 1 : -1) * (120 + i * 40), vy: -60, life: 0.4, size: 20, color: '#ffffff' });
      break;
    case 'dust':
      addP({ type: 'puff', x: d.x, y: d.y - 8, vx: -p.facing * 60, vy: -60, life: 0.4, size: 14 + Math.random() * 8, color: '#ffffff' });
      break;
  }
}

function updateParticles(dt) {
  for (const q of g.particles) {
    q.age += dt;
    q.vy += q.grav * dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.vx *= Math.pow(0.08, dt);
    if (q.type !== 'spark' && q.type !== 'drop') q.vy *= Math.pow(0.08, dt);
    q.rot += q.spin * dt;
  }
  g.particles = g.particles.filter((q) => q.age < q.life);
}

function drawParticles(ctx) {
  for (const q of g.particles) {
    const k = q.age / q.life;
    ctx.save();
    ctx.globalAlpha = clamp(1 - k);
    ctx.fillStyle = q.color;
    switch (q.type) {
      case 'star':
        star(ctx, q.x, q.y, q.size * (1 - k * 0.5), q.size * 0.35, 4, q.rot);
        ctx.fill();
        break;
      case 'heart':
        heart(ctx, q.x, q.y, q.size);
        fillStroke(ctx, q.color, INK, 3);
        break;
      case 'puff':
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.size * (0.6 + k * 0.8), 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(58,39,71,0.25)';
        ctx.lineWidth = 3;
        ctx.stroke();
        break;
      case 'spark':
      case 'drop':
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.size * (1 - k * 0.5), 0, TAU);
        ctx.fill();
        break;
      case 'bubble':
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(q.x + Math.sin(q.age * 6) * 6, q.y, q.size, 0, TAU);
        ctx.stroke();
        break;
      case 'flame': {
        const gr = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.size);
        gr.addColorStop(0, '#fff6a8');
        gr.addColorStop(0.5, '#ffb347');
        gr.addColorStop(1, 'rgba(255,120,80,0)');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.size * (1 - k * 0.4), 0, TAU);
        ctx.fill();
        break;
      }
    }
    ctx.restore();
  }
}

/* ---------------- camera ---------------- */
function camTargetX() {
  const p = g.player;
  return clamp(p.x - W / 2 + p.facing * 160 + p.vx * 0.15, BOUNDS.x0, BOUNDS.x1 - W);
}
function updateCamera(dt) {
  const p = g.player, c = g.cam;
  c.px = c.x;
  c.py = c.y;
  c.x = lerp(c.x, camTargetX(), 1 - Math.pow(0.004, dt));
  // vertical: keep Brie inside a comfy band, settle when she stands
  const sy = p.y - c.ty;
  if (p.onGround || p.swimming || p.grind) c.ty = p.y - 640;
  else if (sy < 330) c.ty = p.y - 330;
  else if (sy > 820) c.ty = p.y - 820;
  let ty = clamp(c.ty, BOUNDS.y0, camMaxY(p.x));
  if (p.x < 5600) ty = 0;
  c.y = lerp(c.y, ty, 1 - Math.pow(0.01, dt));
}
function snapCamera() {
  const p = g.player, c = g.cam;
  c.x = c.px = camTargetX();
  c.ty = p.y - 640;
  c.y = c.py = p.x < 5600 ? 0 : clamp(c.ty, BOUNDS.y0, camMaxY(p.x));
}

/* ---------------- play step ---------------- */
function input() {
  return {
    left: isDown('left'), right: isDown('right'), up: isDown('up'), down: isDown('down'),
    jump: isDown('jump'), jumpPressed: wasPressed('jump'),
  };
}

function updateMovers(dt) {
  for (const m of LEVEL.movers) {
    m.time += dt;
    const k = 0.5 - 0.5 * Math.cos((TAU * m.time) / m.period);
    const nx = lerp(m.x0, m.x1, k);
    m.dx = nx - m.cx;
    m.cx = nx;
  }
}

const near = (ax, ay, bx, by, r) => (ax - bx) ** 2 + (ay - by) ** 2 < r * r;

function collect(dt) {
  const p = g.player;
  const cx = p.x, cy = p.y - p.h / 2;
  for (const c of LEVEL.clovers) {
    if (c.got) { c.gotT += dt; continue; }
    if (near(cx, cy, c.x, c.y, 72)) {
      c.got = true;
      c.gotT = 0;
      g.clovers++;
      g.bumpC = 1;
      sfx('clover');
      burstSparkles(c.x, c.y, 5, '#c9ffb0', 300);
    }
  }
  for (const c of LEVEL.treats) {
    if (c.got) { c.gotT += dt; continue; }
    if (near(cx, cy, c.x, c.y, 80)) {
      c.got = true;
      c.gotT = 0;
      g.treats++;
      g.bumpT = 1;
      p.happyT = 0.8;
      sfx('treat');
      burstSparkles(c.x, c.y, 10, '#ffd84d', 420);
      g.popups.push({ text: 'YUM!', age: 0, life: 1.1, style: 'group', wx: c.x, wy: c.y - 60, size: 70 });
    }
  }
  for (const f of LEVEL.friends) {
    if (f.got) { f.gotT += dt; continue; }
    if (near(cx, cy, f.x, f.y - 45, 95)) {
      f.got = true;
      f.gotT = 0;
      g.friends.add(f.kind);
      g.bumpF[f.kind] = 1;
      p.happyT = 1.6;
      sfx('friend');
      burstHearts(f.x, f.y - 80, 7);
      burstSparkles(f.x, f.y - 60, 12, '#fff6a8', 500);
      if (!g.practice && !save.friendsEver.includes(f.kind)) {
        save.friendsEver.push(f.kind);
        writeSave(save);
      }
    }
  }
  for (const b of LEVEL.bubbles) {
    if (p.costume === b.kind) continue;
    if (near(cx, cy, b.x, b.y, 95)) {
      p.costume = b.kind;
      p.happyT = 1;
      sfx('pop');
      poof(b.x, b.y, 14);
      g.popups.push({ text: COSTUME_NAMES[b.kind], age: 0, life: 1.8, style: 'mega', size: 120 });
    }
  }
  for (const c of LEVEL.checkpoints) {
    c.anim = lerp(c.anim, c.on ? 1 : 0, 1 - Math.pow(0.02, dt));
    if (c.on) continue;
    if (Math.abs(p.x - c.x) < 90 && Math.abs(p.y - c.y) < 260) {
      for (const o of LEVEL.checkpoints) o.on = o === c ? true : o.on;
      c.on = true;
      g.checkpoint = { x: c.x, y: c.y };
      sfx('checkpoint');
      burstSparkles(c.x + 50, c.y - 170, 8, '#c9ffb0', 360);
    }
  }
}

function fell(p) {
  const inPond = p.x > 12700 && p.x < 15300;
  return (!inPond && p.y > 1300) || p.y > 1800;
}

function stepPlay(dt) {
  g.playT += dt;
  const p = g.player;
  updateMovers(dt);
  if (g.respawnT > 0) {
    g.respawnT -= dt;
    if (g.respawnT <= 0) {
      p.x = p.px = g.checkpoint.x;
      p.y = p.py = g.checkpoint.y;
      p.vx = p.vy = 0;
      p.grind = null;
      p.visible = true;
      p.happyT = 0.6;
      snapCamera();
      poof(p.x, p.y - 50, 10);
    }
  } else {
    updatePlayer(p, input(), dt, ev);
    if (fell(p)) {
      sfx('poof');
      poof(p.x, Math.min(p.y, g.cam.y + H - 40) - 40, 14);
      p.visible = false;
      g.respawnT = 0.6;
    }
    collect(dt);
    // finale trigger: walking up to the castle gate
    if (p.onGround && p.ground?.kind === 'island' && p.x > GOAL.x - 380) startFinale();
  }
  // zone banner
  const z = zoneAt(p.x);
  if (z !== g.zone) {
    if (g.zone) g.banner = { text: z.name, age: 0 };
    else g.banner = { text: z.name, age: 0 };
    g.zone = z;
  }
  updateCamera(dt);
}

/* ---------------- finale ---------------- */
function startFinale() {
  g.state = 'finale';
  g.finale = { t: 0, crownOn: false, fw: [] };
  const p = g.player;
  p.vx = 0;
  p.thrusting = false;
  const time = g.playT;
  if (g.practice) return;
  const best = (k, v) => { if (v > save[k]) save[k] = v; };
  best('bestClovers', g.clovers);
  best('bestTreats', g.treats);
  if (!save.bestTime || time < save.bestTime) save.bestTime = time;
  writeSave(save);
}

function stepFinale(dt) {
  const f = g.finale, p = g.player;
  f.t += dt;
  updateMovers(dt);
  const target = GOAL.x - 60;
  const walking = f.t < 2.2 && Math.abs(p.x - target) > 8;
  const auto = { left: false, right: false, up: false, down: false, jump: false, jumpPressed: false };
  if (walking) { auto.right = p.x < target; auto.left = p.x > target; }
  updatePlayer(p, auto, dt, ev);
  if (!walking && f.t < 2.2) { p.vx *= 0.8; p.facing = 1; }
  g.gateOpen = clamp((f.t - 0.6) / 1.2);
  if (f.t > 2.2 && !f.crownOn) {
    // crown falls from the sky
    const k = clamp((f.t - 2.2) / 0.9);
    if (k >= 1) {
      f.crownOn = true;
      p.happyT = 99;
      sfx('finale');
      burstSparkles(p.x + 50, p.y - 120, 16, '#ffd84d', 600);
      burstHearts(p.x, p.y - 100, 8);
      g.popups.push({ text: 'BRIE!', age: -0.2, life: 2, style: 'mega', size: 170, x: W / 2 - 300, y: 300, rot: -0.12 });
      g.popups.push({ text: 'BRIEZINHA!', age: -0.9, life: 2.4, style: 'mega', size: 150, x: W / 2 + 260, y: 420, rot: 0.08, i: 1 });
    }
  }
  if (f.crownOn) {
    f.fwT = (f.fwT ?? 0) - dt;
    if (f.fwT <= 0 && f.fw.length < 40) {
      f.fwT = 0.35 + Math.random() * 0.3;
      f.fw.push({ x: 200 + Math.random() * (W - 400), y: 120 + Math.random() * 380, t0: f.t, seed: Math.random() * 10, color: ['#ff5d8f', '#ffd84d', '#4cc3ff', '#37c45c', '#b77dff'][f.fw.length % 5] });
      sfx('firework');
    }
  }
  updateCamera(dt);
  g.cam.ty = p.y - 700;
}

/* ---------------- main step ---------------- */
function step(dt) {
  g.t += dt;
  g.bumpC = Math.max(0, g.bumpC - dt * 4);
  g.bumpT = Math.max(0, g.bumpT - dt * 4);
  for (const k in g.bumpF) g.bumpF[k] = Math.max(0, g.bumpF[k] - dt * 1.5);
  for (const q of g.popups) q.age += dt;
  g.popups = g.popups.filter((q) => q.age < q.life);
  if (g.banner) { g.banner.age += dt; if (g.banner.age > 3) g.banner = null; }
  if (g.state === 'play') stepPlay(dt);
  else if (g.state === 'finale') stepFinale(dt);
  else if (g.state === 'title') g.titleT += dt;
  if (g.state !== 'paused') updateParticles(dt);
  pressedQueue.clear();
}

/* ---------------- render ---------------- */
function renderWorld(alpha) {
  const c = g.cam;
  const camX = lerp(c.px, c.x, alpha), camY = lerp(c.py, c.y, alpha);
  const t = g.t;
  drawBackground(ctx, camX, camY, t);
  ctx.save();
  ctx.translate(-camX, -camY);
  const st = { gateOpen: g.gateOpen, costume: g.player.costume };
  drawWorldBack(ctx, camX, camY, t, st);
  drawLevel(ctx, camX, camY, t, st);
  drawCollectibles(ctx, camX, t);
  // friends that were just found: say hi, then hop into the album
  for (const f of LEVEL.friends) {
    if (!f.got || f.gotT > 2.6) continue;
    const k = clamp((f.gotT - 2.2) / 0.4);
    ctx.save();
    ctx.globalAlpha = 1 - k;
    drawFriend(ctx, f.kind, f.x, f.y - k * 200, t);
    ctx.restore();
    speech(ctx, f.line, f.x, f.y - (f.kind === 'ufo' ? 180 : 120), f.gotT);
  }
  drawParticles(ctx);
  const f = g.finale;
  drawPlayer(ctx, g.player, alpha, { crown: f?.crownOn, happy: !!f?.crownOn });
  if (f && f.t > 2.2 && !f.crownOn) {
    const k = clamp((f.t - 2.2) / 0.9);
    const p = g.player;
    const hx = p.x + p.facing * 98 * S, hy = p.y - 228 * S;
    ctx.save();
    ctx.translate(hx, lerp(hy - 700, hy, k * k));
    ctx.rotate((1 - k) * 4);
    ctx.scale(S * 0.8, S * 0.8);
    drawCrown(ctx, 0, 0);
    ctx.restore();
    sparkles(ctx, t, hx, lerp(hy - 700, hy, k * k), 60, 6, 3);
  }
  drawWaterFront(ctx, camX, t);
  for (const q of g.popups) if (q.wx !== undefined) burstWord(ctx, q.text, q.wx, q.wy - q.age * 60, q.size, q.age, q.life, { style: q.style, starburst: false });
  if (g.debug) drawDebug(ctx);
  ctx.restore();
  return { camX, camY };
}

function drawDebug(ctx) {
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,0,0,0.6)';
  for (const s of LEVEL.solids) ctx.strokeRect(s.x, s.y, s.w, s.h);
  ctx.strokeStyle = 'rgba(0,0,255,0.6)';
  for (const o of LEVEL.oneWays) ctx.strokeRect(o.x, o.y, o.w, 4);
  for (const m of LEVEL.movers) ctx.strokeRect(m.cx - m.w / 2, m.y, m.w, 4);
  const p = g.player;
  ctx.strokeStyle = '#0a0';
  ctx.strokeRect(p.x - p.w / 2, p.y - p.h, p.w, p.h);
  ctx.restore();
}

function drawBanner() {
  const b = g.banner;
  if (!b || g.state !== 'play') return;
  const inK = easeOutBack(b.age / 0.5), out = clamp((3 - b.age) / 0.4);
  ctx.save();
  ctx.globalAlpha = out;
  ctx.translate(W / 2, 190 + (1 - out) * -40);
  ctx.scale(inK, inK);
  ctx.font = `64px ${COMIC}`;
  const w = Math.max(520, ctx.measureText(b.text).width + 160);
  ctx.beginPath();
  ctx.moveTo(-w / 2, -48);
  ctx.lineTo(w / 2, -48);
  ctx.lineTo(w / 2 + 44, 0);
  ctx.lineTo(w / 2, 48);
  ctx.lineTo(-w / 2, 48);
  ctx.lineTo(-w / 2 - 44, 0);
  ctx.closePath();
  fillStroke(ctx, '#ff8fb3', INK, 7);
  clover(ctx, -w / 2 + 40, 0, 20, 0.3, '#ffffff', 3);
  clover(ctx, w / 2 - 40, 0, 20, -0.3, '#ffffff', 3);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 10;
  ctx.strokeStyle = INK;
  ctx.strokeText(b.text, 0, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(b.text, 0, 4);
  ctx.restore();
}

function drawScreenPopups() {
  for (const q of g.popups) {
    if (q.wx !== undefined) continue;
    burstWord(ctx, q.text, q.x ?? W / 2, q.y ?? 330, q.size, q.age, q.life, { style: q.style, i: q.i ?? 0, rot: q.rot ?? -0.05 });
  }
}

function centerText(text, x, y, size, font = COMIC, color = '#ffffff', lw = 10) {
  ctx.font = `${size}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = lw;
  ctx.strokeStyle = INK;
  if (lw) ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function ribbon(x, y, w, text, color = '#37c45c', size = 60) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(-w / 2, -44);
  ctx.lineTo(w / 2, -44);
  ctx.lineTo(w / 2 + 40, 0);
  ctx.lineTo(w / 2, 44);
  ctx.lineTo(-w / 2, 44);
  ctx.lineTo(-w / 2 - 40, 0);
  ctx.closePath();
  fillStroke(ctx, color, INK, 8);
  centerText(text, 0, 4, size);
  ctx.restore();
}

function drawTitle() {
  const t = g.t, tt = g.titleT;
  drawBackground(ctx, 5800 + t * 40, 0, t);
  // grassy hill for Brie
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(W / 2, 1120, 1300, 260, 0, 0, TAU);
  fillStroke(ctx, '#6fdc86', INK, 7);
  for (let i = 0; i < 14; i++) clover(ctx, 120 + i * 130 + rand(i) * 40, 960 + Math.abs(i - 7) * 14, 14, rand(i) - 0.5, '#3fbf5a', 3);
  ctx.restore();
  // Brie trotting happily on the hill
  ctx.save();
  ctx.translate(W / 2 - 40, 900);
  ctx.scale(0.85, 0.85);
  drawBrieSide(ctx, { phase: (t * 1.6) % 1, amp: 0.5, eyes: Math.sin(t * 0.9) > 0.97 ? 'closed' : 'happy', mouth: 0.7, ear: 0.4, wag: t * 12, cape: { t, style: 'royal' } });
  ctx.restore();
  // friends peeking around her
  FRIEND_KINDS.forEach((k, i) => {
    if (!save.friendsEver.includes(k)) return;
    const x = i < 3 ? 380 + i * 170 : W - 380 - (i - 3) * 170;
    drawFriend(ctx, k, x, 950 + Math.abs(x - W / 2) * 0.05, t, 46);
  });
  logo(ctx, W / 2, 250, 0.82, tt, { ribbon: false });
  if (tt > 0.3) {
    const k = easeOutBack((tt - 0.3) / 0.4);
    ctx.save();
    ctx.translate(W / 2, 445);
    ctx.scale(k, 1);
    ribbon(0, 0, 760, 'CLOVERLEAF ADVENTURE', '#37c45c', 64);
    ctx.restore();
  }
  if (tt > 0.8 && Math.sin(t * 4) > -0.4) centerText('press SPACE to play', W / 2, 590, 64, SING, '#ffffff', 12);
  ctx.save();
  ctx.font = `500 32px ${SING}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.globalAlpha = 0.8;
  ctx.fillText('← →  walk     SPACE  jump  (hold to float)     ↓  wiggle     ESC  pause     M  music', W / 2, 1050);
  ctx.restore();
  // album of friends ever found
  const found = save.friendsEver.length;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(W - 610, 30, 580, 130, 40);
  fillStroke(ctx, 'rgba(255,255,255,0.85)', INK, 6);
  ctx.font = `600 30px ${SING}`;
  ctx.fillStyle = INK;
  ctx.textAlign = 'left';
  ctx.fillText(`friends found: ${found} / ${FRIEND_KINDS.length}`, W - 580, 66);
  FRIEND_KINDS.forEach((k, i) => friendIcon(ctx, k, W - 560 + i * 90, 115, 26, save.friendsEver.includes(k)));
  ctx.restore();
  if (save.bestClovers) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(30, 30, 380, 80, 40);
    fillStroke(ctx, 'rgba(255,255,255,0.85)', INK, 6);
    clover(ctx, 80, 70, 24, 0, '#3fdc66', 4);
    ctx.font = `600 34px ${SING}`;
    ctx.fillStyle = INK;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`best: ${save.bestClovers} / ${g.cloverTotal}`, 125, 72);
    ctx.restore();
  }
}

function drawPause() {
  ctx.save();
  ctx.fillStyle = 'rgba(58,39,71,0.45)';
  ctx.fillRect(0, 0, W, H);
  ctx.beginPath();
  ctx.roundRect(W / 2 - 420, H / 2 - 260, 840, 520, 60);
  fillStroke(ctx, '#fff4fa', INK, 8);
  centerText('PAUSED', W / 2, H / 2 - 150, 120, COMIC, '#ff8fb3', 14);
  const lines = [['ESC / SPACE', 'keep playing'], ['R', 'start over'], ['Q', 'title screen'], ['M', g.muted ? 'music on' : 'music off']];
  ctx.font = `600 44px ${SING}`;
  ctx.textBaseline = 'middle';
  lines.forEach(([k, v], i) => {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff5d8f';
    ctx.fillText(k, W / 2 - 20, H / 2 - 30 + i * 68);
    ctx.textAlign = 'left';
    ctx.fillStyle = INK;
    ctx.fillText(v, W / 2 + 20, H / 2 - 30 + i * 68);
  });
  ctx.restore();
}

function drawFinaleOverlay() {
  const f = g.finale;
  if (!f) return;
  for (const fw of f.fw) firework(ctx, fw.x, fw.y, f.t - fw.t0, fw.seed, fw.color);
  if (f.crownOn) confetti(ctx, f.t - 3.1, 160, 4, 1);
  const k = clamp((f.t - 4.6) / 0.6);
  if (k <= 0) return;
  const p = easeOutBack(k);
  ctx.save();
  ctx.translate(W / 2, H / 2 + 70);
  ctx.scale(p, p);
  ctx.beginPath();
  ctx.roundRect(-480, -260, 960, 540, 60);
  fillStroke(ctx, 'rgba(255,248,252,0.96)', INK, 8);
  centerText('A PERFECT DAY!', 0, -185, 92, COMIC, '#ffd84d', 14);
  const mins = Math.floor(g.playT / 60), secs = Math.floor(g.playT % 60);
  const rows = [
    ['clover', `${g.clovers} / ${g.cloverTotal}`],
    ['treat', `${g.treats} / ${g.treatTotal}`],
    ['time', `${mins}:${String(secs).padStart(2, '0')}`],
  ];
  ctx.font = `600 50px ${SING}`;
  ctx.textBaseline = 'middle';
  rows.forEach(([icon, v], i) => {
    const y = -80 + i * 74;
    if (icon === 'clover') clover(ctx, -150, y, 26, 0, '#3fdc66', 4);
    else if (icon === 'treat') { ctx.save(); ctx.translate(-150, y); P.paoDeQueijo(ctx, 28, g.t); ctx.restore(); }
    else { ctx.beginPath(); ctx.arc(-150, y, 26, 0, TAU); fillStroke(ctx, '#bfeaff', INK, 5); ctx.beginPath(); ctx.moveTo(-150, y); ctx.lineTo(-150, y - 16); ctx.moveTo(-150, y); ctx.lineTo(-138, y + 6); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke(); }
    ctx.fillStyle = INK;
    ctx.textAlign = 'left';
    ctx.fillText(v, -100, y + 2);
  });
  FRIEND_KINDS.forEach((kd, i) => friendIcon(ctx, kd, -300 + i * 120, 160, 34, g.friends.has(kd)));
  if (f.t > 5.2 && Math.sin(g.t * 4) > -0.4) centerText('press SPACE to play again', 0, 300, 50, SING, '#ffffff', 10);
  ctx.restore();
}

function render(alpha) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (g.state === 'title') {
    drawTitle();
    return;
  }
  renderWorld(alpha);
  if (g.state !== 'finale' || g.finale.t < 4.6) drawHUD(ctx, g);
  drawBanner();
  drawScreenPopups();
  if (g.state === 'finale') drawFinaleOverlay();
  if (g.state === 'paused') drawPause();
  if (g.debug) {
    ctx.font = `24px monospace`;
    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    const p = g.player;
    ctx.fillText(`x ${p.x.toFixed(0)} y ${p.y.toFixed(0)} vx ${p.vx.toFixed(0)} vy ${p.vy.toFixed(0)} ${p.costume ?? '-'} ${g.frameMs.toFixed(1)}ms`, 30, H - 30);
  }
}

/* ---------------- loop ---------------- */
let last = performance.now(), acc = 0;
function frame(now) {
  const el = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += el;
  while (acc >= DT) {
    if (g.state !== 'paused') step(DT);
    else { g.t += 0; pressedQueue.clear(); }
    acc -= DT;
  }
  const t0 = performance.now();
  render(acc / DT);
  g.frameMs = lerp(g.frameMs, performance.now() - t0, 0.05);
  requestAnimationFrame(frame);
}

// test helpers for the dev overlay / automation
g.hold = (codes, secs) => {
  for (const c of codes) keyDown(c);
  setTimeout(() => codes.forEach(keyUp), secs * 1000);
};
g.tap = (code) => { keyDown(code); setTimeout(() => keyUp(code), 60); };
// run the game synchronously with some keys held (for automated playtests)
g.sim = (codes, secs) => {
  codes.forEach((c) => keyDown(c));
  for (let i = 0; i < Math.round(secs * 60); i++) step(DT);
  codes.forEach(keyUp);
  render(1);
  const p = g.player;
  return { x: Math.round(p.x), y: Math.round(p.y), vx: Math.round(p.vx), vy: Math.round(p.vy), ground: p.onGround, gk: p.ground?.kind, costume: p.costume, clovers: g.clovers, treats: g.treats, friends: [...g.friends], state: g.state, grind: !!p.grind, cp: g.checkpoint.x, vis: p.visible };
};
g.teleport = teleport;
g.LEVEL = LEVEL;

loadGameFonts().then(() => {
  canvas.focus();
  requestAnimationFrame(frame);
});
