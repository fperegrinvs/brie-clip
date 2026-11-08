// Gentle WebAudio sound: a music-box loop plus tiny synthesized effects.
let ac = null, master = null, musicBus = null, sfxBus = null, echo = null;
let muted = false;
let nextNote = 0, step = 0, timer = null;

const BPM = 104;
const STEP = 60 / BPM / 2; // eighth notes
// C major pentatonic, MIDI numbers
const MEL = [
  76, 0, 79, 0, 81, 79, 76, 0, 74, 0, 76, 0, 72, 0, 0, 0,
  74, 0, 76, 79, 76, 0, 74, 72, 69, 0, 72, 0, 74, 0, 0, 0,
  76, 0, 79, 0, 84, 81, 79, 0, 81, 0, 79, 76, 74, 0, 76, 0,
  72, 0, 74, 76, 79, 0, 76, 74, 72, 0, 0, 0, 72, 0, 0, 0,
];
const BASS = [48, 43, 45, 41, 48, 43, 41, 43]; // one per bar (8 steps)
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

export function initAudio(startMuted) {
  muted = !!startMuted;
  if (ac) return;
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    ac = null;
    return;
  }
  master = ac.createGain();
  master.gain.value = muted ? 0 : 0.9;
  master.connect(ac.destination);
  musicBus = ac.createGain();
  musicBus.gain.value = 0.55;
  sfxBus = ac.createGain();
  sfxBus.gain.value = 0.8;
  // soft echo for sparkle
  echo = ac.createDelay(1);
  echo.delayTime.value = STEP * 3;
  const fb = ac.createGain();
  fb.gain.value = 0.28;
  const wet = ac.createGain();
  wet.gain.value = 0.35;
  echo.connect(fb).connect(echo);
  echo.connect(wet).connect(master);
  musicBus.connect(master);
  musicBus.connect(echo);
  sfxBus.connect(master);
  nextNote = ac.currentTime + 0.1;
  timer = setInterval(schedule, 50);
}

export function resumeAudio() {
  if (ac && ac.state === 'suspended') ac.resume();
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.9, ac.currentTime, 0.05);
}
export const isMuted = () => muted;

function tone(bus, freq, t0, dur, { type = 'sine', gain = 0.1, attack = 0.005, slideTo = null, slideT = dur } = {}) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + slideT);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(bus);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function noise(bus, t0, dur, { gain = 0.1, freq = 1200, q = 0.8, type = 'bandpass', slideTo = null } = {}) {
  const len = Math.ceil(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t0);
  if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  f.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(bus);
  src.start(t0);
}

function musicBox(m, t0, vel = 1) {
  const f = mtof(m);
  tone(musicBus, f, t0, 1.1, { gain: 0.07 * vel, attack: 0.003 });
  tone(musicBus, f * 2, t0, 0.5, { gain: 0.018 * vel, attack: 0.002 });
  tone(musicBus, f * 3.01, t0, 0.25, { gain: 0.008 * vel, type: 'triangle' });
}

function schedule() {
  if (!ac) return;
  while (nextNote < ac.currentTime + 0.25) {
    const i = step % MEL.length;
    if (MEL[i]) musicBox(MEL[i], nextNote, i % 4 === 0 ? 1 : 0.8);
    if (i % 8 === 0) {
      const b = BASS[(i / 8) % BASS.length];
      tone(musicBus, mtof(b), nextNote, STEP * 6, { type: 'triangle', gain: 0.06, attack: 0.02 });
      tone(musicBus, mtof(b + 7), nextNote + STEP * 4, STEP * 3, { type: 'triangle', gain: 0.03, attack: 0.02 });
    }
    if (i % 4 === 2) noise(musicBus, nextNote, 0.05, { gain: 0.012, freq: 7000, type: 'highpass' });
    nextNote += STEP;
    step++;
  }
}

/* ---------------- effects ---------------- */
let cloverCombo = 0, lastClover = 0;
export function sfx(name) {
  if (!ac || muted) return;
  const t = ac.currentTime + 0.005;
  switch (name) {
    case 'clover': {
      cloverCombo = t - lastClover < 0.6 ? Math.min(cloverCombo + 1, 7) : 0;
      lastClover = t;
      const base = [84, 86, 88, 91, 93, 96, 98, 100][cloverCombo];
      tone(sfxBus, mtof(base), t, 0.25, { gain: 0.07 });
      tone(sfxBus, mtof(base + 7), t + 0.05, 0.3, { gain: 0.05 });
      break;
    }
    case 'treat':
      [72, 76, 79, 84].forEach((m, k) => tone(sfxBus, mtof(m), t + k * 0.07, 0.35, { gain: 0.08, type: 'triangle' }));
      break;
    case 'friend':
      [79, 84, 88, 91, 96].forEach((m, k) => tone(sfxBus, mtof(m), t + k * 0.09, 0.5, { gain: 0.07 }));
      [67, 72].forEach((m, k) => tone(sfxBus, mtof(m), t + k * 0.18, 0.6, { gain: 0.05, type: 'triangle' }));
      break;
    case 'jump':
      tone(sfxBus, 420, t, 0.16, { gain: 0.05, slideTo: 760, slideT: 0.12, type: 'triangle' });
      break;
    case 'boing':
      tone(sfxBus, 180, t, 0.45, { gain: 0.1, slideTo: 620, slideT: 0.3, type: 'sine' });
      tone(sfxBus, 360, t, 0.3, { gain: 0.03, slideTo: 1240, slideT: 0.3, type: 'triangle' });
      break;
    case 'pop':
      noise(sfxBus, t, 0.12, { gain: 0.12, freq: 2500, slideTo: 600 });
      [72, 79, 84, 88].forEach((m, k) => tone(sfxBus, mtof(m), t + 0.04 + k * 0.05, 0.3, { gain: 0.06 }));
      break;
    case 'poof':
      noise(sfxBus, t, 0.4, { gain: 0.12, freq: 900, slideTo: 300, type: 'lowpass' });
      tone(sfxBus, 660, t + 0.1, 0.3, { gain: 0.04, slideTo: 990 });
      break;
    case 'checkpoint':
      tone(sfxBus, mtof(84), t, 0.4, { gain: 0.06 });
      tone(sfxBus, mtof(91), t + 0.12, 0.6, { gain: 0.06 });
      break;
    case 'splash':
      noise(sfxBus, t, 0.35, { gain: 0.1, freq: 1400, slideTo: 400, type: 'lowpass' });
      break;
    case 'grind':
      noise(sfxBus, t, 0.2, { gain: 0.05, freq: 3000, q: 2 });
      break;
    case 'whee':
      tone(sfxBus, 500, t, 0.35, { gain: 0.05, slideTo: 1200, slideT: 0.3 });
      break;
    case 'land':
      noise(sfxBus, t, 0.12, { gain: 0.06, freq: 300, type: 'lowpass' });
      break;
    case 'wiggle':
      tone(sfxBus, 500, t, 0.2, { gain: 0.04, slideTo: 300, type: 'triangle' });
      break;
    case 'bonk':
      tone(sfxBus, 300, t, 0.12, { gain: 0.04, slideTo: 200, type: 'triangle' });
      break;
    case 'finale':
      [72, 76, 79, 84, 79, 84, 88, 91, 96].forEach((m, k) => tone(sfxBus, mtof(m), t + k * 0.12, 0.7, { gain: 0.07, type: k % 2 ? 'sine' : 'triangle' }));
      break;
    case 'firework':
      noise(sfxBus, t, 0.5, { gain: 0.05, freq: 3000, slideTo: 800 });
      break;
  }
}
