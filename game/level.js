// "A Day in Cloverleaf": one long level, left to right, then up into the sky.
// World units are pixels; y grows downwards. Ground in most places is y = 900.
// Rect solids use {x, y, w, h} with (x, y) the top-left corner.

export const GY = 900;

export const ZONES = [
  { id: 'house', name: 'Cozy House', x0: -400, x1: 5600 },
  { id: 'garden', name: 'Cloverleaf Garden', x0: 5600, x1: 11600 },
  { id: 'zoo', name: 'Zoo Pond', x0: 11600, x1: 15900 },
  { id: 'sky', name: 'Sky & Stars', x0: 15900, x1: 19600 },
];
export const zoneAt = (x) => ZONES.find((z) => x >= z.x0 && x < z.x1) ?? ZONES[x < 0 ? 0 : ZONES.length - 1];

export const BOUNDS = { x0: 0, x1: 19400, y0: -3500 };

// Most of the world: never scroll below ground. Pond: look down into the water.
export function camMaxY(x) {
  return x > 12450 && x < 15450 ? 420 : 0;
}

// gentle low gravity as Brie climbs into space
export function gravityScale(x, y) {
  if (x < 15900) return 1;
  const k = Math.min(1, Math.max(0, (700 - y) / 1600));
  return 1 - 0.45 * k;
}

/* ------------------------------------------------------------------ */
const solids = [];
const oneWays = [];
const bouncers = [];
const movers = [];
const rails = [];
const water = [];
const clovers = [];
const treats = [];
const friends = [];
const bubbles = [];
const checkpoints = [];
const signs = [];
const decor = [];

const S = (x, y, w, h, kind) => solids.push({ x, y, w, h, kind });
const O = (x, y, w, kind, extra = {}) => oneWays.push({ x, y, w, h: 24, kind, ...extra });
const row = (x0, x1, y, n) => {
  for (let i = 0; i < n; i++) clovers.push({ x: x0 + ((x1 - x0) * i) / Math.max(1, n - 1), y });
};
const col = (x, y0, y1, n) => {
  for (let i = 0; i < n; i++) clovers.push({ x, y: y0 + ((y1 - y0) * i) / Math.max(1, n - 1) });
};
const arc = (x0, x1, y, hgt, n) => {
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1);
    clovers.push({ x: x0 + (x1 - x0) * s, y: y - Math.sin(s * Math.PI) * hgt });
  }
};
const T = (x, y) => treats.push({ x, y });
const F = (x, y, kind, line) => friends.push({ x, y, kind, line });
const CP = (x, y) => checkpoints.push({ x, y });
const SIGN = (x, y, lines) => signs.push({ x, y, lines });

/* ---------------- 1. Cozy House (x 0 .. 5600) ---------------- */
S(-400, -1400, 400, 2600, 'wall');
S(-400, GY, 6000, 500, 'floor');
CP(300, GY);
SIGN(560, GY, ['← → walk', 'SPACE jump']);
row(700, 860, GY - 50, 3);

// table (tabletop is a one-way platform)
decor.push({ kind: 'table', x: 900, y: GY });
O(890, GY - 300, 540, 'table');
arc(760, 1000, GY - 60, 240, 5);
row(1000, 1340, GY - 360, 5);
T(1380, GY - 350);

// rug trampoline up to a high shelf
SIGN(1530, GY, ['bounce on', 'the rug!']);
bouncers.push({ x: 1660, y: GY - 16, w: 400, h: 16, power: 2150, kind: 'rug' });
col(1860, GY - 120, GY - 560, 5);
O(1900, 330, 460, 'shelf');
row(1940, 2160, 280, 3);
F(2290, 330, 'onigiri', 'Rice to meet you!');
SIGN(2280, GY, ['hold SPACE', 'to float', 'with your cape']);

// worm costume, then the raised sofa (crawl underneath for a secret friend)
bubbles.push({ x: 2520, y: GY - 90, kind: 'worm' });
S(2660, 630, 600, 190, 'sofa');
S(2660, 580, 80, 50, 'sofa');
S(3180, 580, 80, 50, 'sofa');
O(2700, 490, 520, 'sofaBack');
decor.push({ kind: 'sofa', x: 2700, y: 820 });
row(2800, 3120, 590, 5);
row(2700, 3220, GY - 34, 7);
F(2960, GY, 'toast', 'Toasty hugs!');

// big bookshelf wall with a tiny crawl gap at the bottom
CP(3480, GY);
SIGN(3560, GY, ['hold ↓', 'to wiggle']);
S(3700, -1400, 420, 2215, 'bookshelf');
row(3730, 4090, GY - 34, 5);

// kitchen
row(4200, 4420, GY - 50, 4);
S(4500, 680, 440, 220, 'counter');
arc(4400, 4620, GY - 60, 260, 4);
row(4600, 4880, 630, 4);
T(4720, 620);
O(4990, 460, 320, 'pansShelf');
row(5030, 5270, 410, 3);
T(5280, 400);
row(5050, 5350, GY - 50, 4);
decor.push({ kind: 'door', x: 5440, y: GY });

/* ---------------- 2. Cloverleaf Garden (x 5600 .. 11600) ---------------- */
S(5600, GY, 1300, 700, 'grass');
CP(5760, GY);
bubbles.push({ x: 6060, y: GY - 90, kind: 'cabbage' });
SIGN(6260, GY, ['skates!', 'jump onto', 'the rail']);
row(6380, 6640, GY - 50, 4);

// long grind rail over a big pit
rails.push({ x0: 6700, y0: 780, x1: 8560, y1: 640 });
for (let i = 0; i < 12; i++) {
  const s = (i + 0.5) / 12;
  clovers.push({ x: 6700 + 1860 * s, y: 780 - 140 * s - 70 });
}
T(7640, 560);

S(8500, 860, 800, 740, 'grass');
CP(8640, 860);
row(8580, 8780, 810, 3);
O(8780, 640, 280, 'cloud');
O(9120, 450, 280, 'cloud');
O(9420, 270, 240, 'cloud');
row(8820, 9020, 590, 3);
row(9160, 9360, 400, 3);
F(9540, 270, 'sunny', 'Sunny side up!');
T(9240, 390);

// pit with a côve buddy on skates as a moving platform
movers.push({ x0: 9420, x1: 10140, y: 820, w: 170, period: 6, kind: 'buddy' });
arc(9400, 10200, 760, 120, 7);
O(9760, 560, 220, 'cloud');
F(9880, 560, 'birdie', 'Tweet tweet, friend!');
T(9790, 500);

S(10300, GY, 1400, 700, 'grass');
CP(10440, GY);
rails.push({ x0: 10700, y0: 770, x1: 11300, y1: 660 });
row(10720, 11280, 680, 6);
row(11350, 11550, GY - 50, 3);

/* ---------------- 3. Zoo Pond (x 11600 .. 15900) ---------------- */
S(11700, GY, 1000, 760, 'grass');
CP(11820, GY);
decor.push({ kind: 'zooGate', x: 12060, y: GY });
bubbles.push({ x: 12420, y: GY - 90, kind: 'croc' });
SIGN(12560, GY, ['croc suit:', 'swim with', '↑ ↓ ← →']);

water.push({ x: 12700, y: 830, w: 2600, h: 620 });
S(12700, 1450, 2600, 300, 'pondBed');
// rock pillars: dive under them
S(13660, 260, 240, 940, 'rock');
S(14560, 300, 240, 880, 'rock');
row(12820, 13560, 1000, 6);
row(13620, 13940, 1330, 4);
row(14020, 14460, 1100, 4);
row(14520, 14840, 1330, 4);
row(14900, 15180, 1000, 3);
F(14190, 1450, 'milk', 'Moo-velous!');
T(13780, 1400);
T(14680, 1250);

// friendly croc floating at the far bank: bounce up the ledge
bouncers.push({ x: 15020, y: 806, w: 240, h: 24, power: 2050, kind: 'croc' });
S(15300, 520, 600, 1230, 'grass');
CP(15420, 520);
row(15460, 15800, 470, 4);

/* ---------------- 4. Sky & Stars (x 15900 .. 19400) ---------------- */
S(15900, GY, 3600, 700, 'grass');
S(19400, -4000, 400, 5600, 'wall');
bubbles.push({ x: 16260, y: GY - 90, kind: 'rocket' });
SIGN(16080, GY, ['rocket!', 'hold SPACE', 'in the air']);
row(16380, 16560, GY - 50, 3);

const CLIMB = [
  [16700, 650, 'cloud', 300],
  [17120, 420, 'planet', 90],
  [16700, 170, 'cloud', 280],
  [17160, -90, 'planet', 95],
  [16760, -380, 'cloud', 300],
  [17220, -660, 'planet', 100],
  [16820, -920, 'cloud', 280],
  [17300, -1180, 'planet', 95],
  [16860, -1440, 'cloud', 300],
  [17360, -1720, 'planet', 100],
  [16920, -1990, 'cloud', 300],
  [17420, -2260, 'planet', 95],
  [17020, -2540, 'cloud', 320],
];
for (const [cx, y, kind, sz] of CLIMB) {
  if (kind === 'cloud') {
    O(cx - sz / 2, y, sz, 'cloud');
    row(cx - sz / 2 + 50, cx + sz / 2 - 50, y - 50, 3);
  } else {
    O(cx - sz * 0.8, y, sz * 1.6, 'planet', { r: sz });
    clovers.push({ x: cx, y: y - 60 });
  }
}
CP(16760, -380);
CP(16920, -1990);
T(17160, -170);
T(17360, -1800);
// side trip for the UFO plush, rocket required
O(17600, -1500, 280, 'cloud');
row(17630, 17850, -1560, 4);
O(17980, -1500, 220, 'cloud');
F(18090, -1500, 'ufo', 'Beep boop, a friend!');
T(18000, -1560);

// the castle on its cloud island
O(17300, -2800, 2100, 'island');
CP(17420, -2800);
row(17500, 18200, -2860, 8);
export const GOAL = { x: 18640, y: -2800 };

export const LEVEL = {
  solids, oneWays, bouncers, movers, rails, water,
  clovers, treats, friends, bubbles, checkpoints, signs, decor,
};

export const FRIEND_KINDS = ['toast', 'onigiri', 'sunny', 'birdie', 'milk', 'ufo'];
export const START = { x: 300, y: GY };
