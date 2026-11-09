// Song structure, beat grid and lyric timings (seconds).
// Timings come from whisper word alignment (tools/transcribe*.py) + energy analysis.

export const SECTIONS = [
  [0, 'intro'],
  [11.4, 'entrance'],
  [16.2, 'title'],
  [26.63, 'arrive'],
  [37.3, 'verse1'],
  [56.05, 'prechorus'],
  [63.34, 'chorus'],
  [77.84, 'thunder'],
  [92.04, 'interlude'],
  [98.24, 'verse2'],
  [121.44, 'build'],
  [126.14, 'breakdown'],
  [135.34, 'silence'],
  [138.84, 'restart'],
  [142.64, 'chorus', { final: true }],
  [156.94, 'thunder', { final: true }],
  [172.24, 'outro'],
  [182.44, 'finale'],
  [188.84, 'parade'],
  [214.64, 'end'],
];
export const DURATION = 216.45;

export function sectionAt(t) {
  let i = 0;
  while (i + 1 < SECTIONS.length && SECTIONS[i + 1][0] <= t) i++;
  const [start, name, opts = {}] = SECTIONS[i];
  const end = i + 1 < SECTIONS.length ? SECTIONS[i + 1][0] : DURATION;
  return { name, start, end, dur: end - start, lt: t - start, opts, index: i };
}

// lyric lines. kind: 'sing' (karaoke), 'burst' (comic pops), 'soft', 'narr'
const B = (words, end, style, layout) => ({ kind: 'burst', t: words[0][0], e: end, words, style, layout });
const SIDES6 = [[0.17, 0.2, -0.1], [0.83, 0.2, 0.1], [0.19, 0.5, 0.06], [0.81, 0.5, -0.08], [0.2, 0.8, -0.05], [0.76, 0.8, 0.07]];
const STORM = [[0.19, 0.31, -0.1], [0.81, 0.31, 0.08], [0.5, 0.1, -0.03]];
const SCOLD = [[0.33, 0.17, -0.08], [0.7, 0.84, 0.05]];
const TOP2 = [[0.25, 0.17, -0.1], [0.75, 0.2, 0.08]];
const S = (t, e, text) => ({ kind: 'sing', t, e, text });

export const LYRICS = [
  { kind: 'narr', t: 1.1, e: 11.2, text: 'From the Kingdom of Cloverleaf hails Brie!' },
  B([[11.54, 'PIM!'], [12.42, 'PIM!'], [13.32, 'PIM PINHA!'], [14.0, 'BRIE!'], [14.64, 'BRIE!'], [15.28, 'BRIEZINHA!']], 16.3, undefined, SIDES6),

  S(37.32, 40.8, 'Brie, Briezinha, furacão de algodão'),
  S(40.86, 44.3, 'Quatro patas, zero freio, derrapando pelo chão'),
  S(44.34, 47.5, 'Bebê “goldinho”, bebê fofinho'),
  S(47.6, 51.95, 'Passa pela sala como um míssil pequenininho!'),
  S(52.02, 53.74, 'Debaixo da mesa, atrás do sofá'),
  S(53.78, 56.0, 'Vira uma minhoca e começa a acelerar!'),

  B([[56.08, '“LINHÃO”!'], [56.62, '“LINHÃO” BOMBOM!']], 57.35, undefined, [[0.24, 0.2, -0.1], [0.74, 0.16, 0.07]]),
  S(57.4, 59.72, 'Quem botou foguete nesse queijinho?'),
  B([[59.8, 'LINGUITOS!'], [60.62, '“COCODRILO”!']], 61.32, undefined, TOP2),
  S(61.38, 63.32, 'Uma “côve” de patins descendo um trilho!'),

  S(63.38, 66.84, 'Brie, Briezinha, corre pela cozinha!'),
  S(66.92, 70.54, 'Pim pim, pim pinha, nossa pequenina!'),
  S(70.62, 73.88, 'Zoomies, zoomies, quem vai segurar?'),
  S(73.96, 77.74, 'Faz três voltas pela sala sem parar!'),

  B([[77.86, '“CÔVE”!'], [78.52, 'MINHOCA!'], [79.7, '“LINHÃO” BOMBOM!']], 80.92, 'storm', STORM),
  S(80.98, 84.89, 'Quatro patas contra o mundo, feito um trovão!'),
  B([[85, '“CÔVE”!'], [85.7, 'MINHOCA!'], [86.82, '“LINHÃO” BOMBOM!']], 88.1, 'storm', STORM),
  S(88.16, 92.64, 'Quatro patas contra o mundo, feito um trovão!'),

  S(98.24, 101.64, 'Corredor é pista, tapete é trampolim'),
  S(101.7, 105.64, 'Dobra a esquina e vem voando para cima de mim!'),
  S(105.7, 109.44, 'Um “cocodrilo” fugindo do zoológico'),
  S(109.5, 113.69, 'E um pão de queijo intergaláctico!'),
  S(113.78, 117.34, 'Para dois segundos só pra respirar'),
  S(117.42, 121.44, 'Já liga o turbo, volta a acelerar!'),

  B([[126.2, 'VAI PRA'], [127.12, 'CÃODEIA!']], 128.1, 'scold', SCOLD),
  B([[128.16, 'NÃO!'], [128.64, 'NÃO!'], [129.18, 'NÃO!']], 129.54, 'group'),
  B([[129.6, 'VAI DORMIR'], [130.58, 'DE BUNDA QUENTE!']], 131.72, 'scold', SCOLD),
  B([[131.78, 'ROUBOU'], [132.7, 'MEU'], [133.6, 'EDREDOM!']], 135.24, 'group'),

  { kind: 'soft', t: 135.44, e: 137.29, text: 'pim pim...' },
  { kind: 'soft', t: 137.34, e: 138.79, text: 'pim pinha...' },

  B([[138.88, 'NÃÃÃO!'], [140.72, 'RECOMEÇOU!']], 142.59, 'mega'),

  S(142.7, 145.99, 'Brie, Briezinha, corre pela cozinha!'),
  S(146.06, 149.69, 'Pim pim, pim pinha, nossa pequenina!'),
  S(149.76, 153.06, 'Zoomies, zoomies, quem vai segurar?'),
  S(153.14, 156.89, 'Faz três voltas pela sala sem parar!'),

  B([[157, '“CÔVE”!'], [157.64, 'MINHOCA!'], [158.82, '“LINHÃO” BOMBOM!']], 160.14, 'storm', STORM),
  S(160.2, 164.12, 'Quatro patas contra o mundo, feito um trovão!'),
  B([[164.18, '“CÔVE”!'], [164.88, 'MINHOCA!'], [165.78, '“LINHÃO” BOMBOM!']], 167.46, 'storm', STORM),
  S(167.52, 172.14, 'Quatro patas contra o mundo, feito um trovão!'),

  S(172.48, 175.64, 'Brie of Cloverleaf!'),
  S(175.76, 178.89, 'Uma nova aventura a cada dia!'),
  S(178.98, 182.39, 'Pequena no tamanho, gigante de energia!'),

  B([[182.46, 'BRIE!'], [184.52, 'BRIEZINHA!']], 186.39, 'mega', TOP2),
  B([[186.44, 'PIM PIM!'], [187.12, 'PIM PINHA!']], 188.74, 'mega', TOP2),
];

/* beat grid ---------------------------------------------------------- */
let BPM = 133.69, OFFSET = 0.074;
export let analysis = null;
export function setAnalysis(a) {
  analysis = a;
  BPM = a.bpm;
  OFFSET = a.beatOffset;
}
export const period = () => 60 / BPM;
export const beatAt = (t) => (t - OFFSET) / period();
export const beatPhase = (t) => {
  const b = beatAt(t);
  return b - Math.floor(b);
};
// 1 right on the beat, decaying to 0
export const pulse = (t, k = 6) => Math.exp(-beatPhase(t) * k);

export function energyAt(t) {
  if (!analysis) return 0.5;
  const e = analysis.energy;
  const i = t * 10;
  const a = Math.floor(i);
  const f = i - a;
  return (e[Math.min(a, e.length - 1)] ?? 0) * (1 - f) + (e[Math.min(a + 1, e.length - 1)] ?? 0) * f;
}
export function onsetAt(t) {
  if (!analysis) return 0;
  const o = analysis.onset30;
  return o[Math.min(Math.max(0, Math.round(t * 30)), o.length - 1)] ?? 0;
}
// recent onset strength with decay (for flashes / shake)
export function hitAt(t, win = 0.25) {
  let m = 0;
  for (let k = 0; k <= Math.round(win * 30); k++) {
    const v = onsetAt(t - k / 30) * Math.exp(-k / (win * 12));
    if (v > m) m = v;
  }
  return m;
}
