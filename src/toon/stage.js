// Layers and the hand-drawn treatment.
// Three 2D layers are drawn each frame and combined by one WebGL pass:
//   bg  – painted background: steady hand-wobble anchored to the camera, paper wash
//   cel – characters and props: line boil (re-seeded per drawing) + cel rim shadow
//   fx  – effects and comic labels: boil, no shadow
import { W, H } from '../fx.js';
import { rand, DETAIL } from '../util.js';

const mk = () => {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  return c;
};
export const bgC = mk(), celC = mk(), fxC = mk();
export const bg = bgC.getContext('2d');
export const cel = celC.getContext('2d');
export const fx = fxC.getContext('2d');

const glC = mk();
const gl = glC.getContext('webgl', { premultipliedAlpha: true, alpha: false, antialias: false, preserveDrawingBuffer: true });
export const hasGL = !!gl;

const VS = `
attribute vec2 p;
varying vec2 vUv;
void main() { vUv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }`;

const FS = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uBg, uCel, uFx, uNoise;
uniform vec2 uRes;
uniform vec3 uCam;      // x, y, zoom
uniform vec2 uSeed;     // boil seed
uniform float uBoil;    // boil amplitude, px
uniform vec2 uBlur;     // motion blur vector, px
uniform vec2 uShift;    // whip-pan shift, px
uniform float uTaps;
uniform vec2 uShadow;   // rim shadow shift, px
uniform float uImpact;  // 0 none, 1 white-on-black, 2 black-on-white
uniform float uHasFx;
uniform float uWash;    // background wash strength
uniform vec3 uTint;     // overall light colour
uniform float uFin;     // 1 = the detailed finish (rim light, depth shadow, glow, pigment, vignette)
uniform float uRim;     // rim light strength
uniform float uDepth;   // shadow the characters cast on the set
uniform float uGlow;    // bloom on bright paint
uniform float uVig;     // vignette strength

vec2 n2(vec2 p) { return texture2D(uNoise, p / 32.0).rg - 0.5; }
float n1(vec2 p) { return texture2D(uNoise, p / 32.0).b - 0.5; }
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 scr = vUv * uRes;
  vec2 px = scr + uShift;
  vec2 world = (px - uRes * 0.5) / uCam.z + uCam.xy;
  // steady hand wobble on the painted layer, pinned to the world so pans do not swim
  vec2 dB = (n2(world / 150.0) * 9.0 + n2(world / 37.0 + 3.7) * 3.0) * uCam.z;
  // boil on the cel layer
  vec2 dC = n2(px / 110.0 + uSeed) * uBoil * 2.2 + n2(px / 31.0 + uSeed.yx * 1.7 + 9.1) * uBoil;

  vec3 b = vec3(0.0);
  vec4 c = vec4(0.0);
  vec4 f = vec4(0.0);
  float a1 = 0.0;
  float n = 0.0;
  for (int i = 0; i < 8; i++) {
    if (float(i) >= uTaps) break;
    vec2 o = uTaps > 1.0 ? uBlur * ((float(i) + hash(scr + 0.37)) / uTaps - 0.5) : vec2(0.0);
    b += texture2D(uBg, (px + dB + o) / uRes).rgb;
    c += texture2D(uCel, (px + dC + o) / uRes);
    a1 += texture2D(uCel, (px + dC + o + uShadow) / uRes).a;
    if (uHasFx > 0.5) f += texture2D(uFx, (px + dC * 0.7 + o) / uRes);
    n += 1.0;
  }
  b /= n; c /= n; f /= n; a1 /= n;

  // painted background: mottled wash, lifted toward warm paper
  float m = n1(world / 260.0) + 0.5 * n1(world / 70.0 + 5.3);
  b *= 1.0 + uWash * 0.16 * m;
  b = mix(b, vec3(1.0, 0.965, 0.9), 0.13 * uWash);

  // cel rim shadow, away from a top-left light
  float sh = smoothstep(0.75, 0.97, c.a) * (1.0 - smoothstep(0.25, 0.75, a1));
  c.rgb *= mix(vec3(1.0), vec3(0.73, 0.69, 0.9), sh);

  vec3 glow = vec3(0.0);
  if (uFin > 0.5) {
    // dry-brush streaks in the paint
    float br = n1(vec2(world.x / 420.0, world.y / 34.0) + 2.1) + 0.6 * n1(vec2(world.x / 160.0, world.y / 13.0) + 7.7);
    b *= 1.0 + uWash * 0.05 * br;
    // pigment pooling inside the cel fills, a little different on every drawing
    c.rgb *= 1.0 - 0.05 * (0.5 + n1(px / 95.0 + uSeed * 3.0) + 0.5 * n1(px / 23.0 + uSeed.yx * 2.0));
    // rim light: the edge that faces the light warms up, so the line reads as coloured
    float a2 = texture2D(uCel, (px + dC - uShadow * 0.55) / uRes).a;
    float rim = smoothstep(0.6, 0.97, c.a) * (1.0 - smoothstep(0.2, 0.8, a2));
    c.rgb += (vec3(1.0, 0.84, 0.6) * c.a - c.rgb) * 0.34 * rim * uRim;
    // soft shadow the characters cast on the set, and bloom from bright paint:
    // a few taps on a spiral, turned per pixel so the softness has a pastel tooth
    float ang = hash(scr + 1.3) * 6.2832;
    float ds = 0.0;
    for (int i = 0; i < 8; i++) {
      float fi = float(i);
      float a = ang + fi * 2.39996;
      vec2 dir = vec2(cos(a), sin(a));
      float r = sqrt((fi + 0.5) / 8.0);
      ds += texture2D(uCel, (px + dC + uShadow * 1.5 + dir * r * 30.0) / uRes).a;
      vec2 gp = px + dir * r * 46.0;
      vec4 gc = texture2D(uCel, (gp + dC) / uRes);
      vec3 gb = texture2D(uBg, (gp + dB) / uRes).rgb * (1.0 - gc.a) + gc.rgb;
      if (uHasFx > 0.5) { vec4 gf = texture2D(uFx, (gp + dC * 0.7) / uRes); gb = gb * (1.0 - gf.a) + gf.rgb; }
      float l = dot(gb, vec3(0.299, 0.587, 0.114));
      glow += gb * smoothstep(0.8, 1.0, l);
    }
    ds /= 8.0; glow /= 8.0;
    b *= mix(vec3(1.0), vec3(0.74, 0.69, 0.86), ds * uDepth);
  }

  vec3 col = b * (1.0 - c.a) + c.rgb;
  if (uImpact > 0.5) {
    float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114)) / max(c.a, 0.001);
    float v = step(0.5, c.a) * step(0.42, lum);
    if (uImpact > 1.5) v = 1.0 - v;
    col = mix(vec3(0.07, 0.02, 0.12), vec3(1.0, 0.98, 0.9), v);
  }
  col = col * (1.0 - f.a) + f.rgb;
  if (uFin > 0.5 && uImpact < 0.5) {
    // bloom (screened on, so it shows most against the dark), a top-to-bottom falloff and the vignette
    col = 1.0 - (1.0 - col) * (1.0 - glow * uGlow);
    col *= 1.0 + 0.05 * (0.45 - vUv.y);
    vec2 vv = (vUv - 0.5) * vec2(1.0, 0.82);
    float vg = smoothstep(0.34, 0.86, length(vv));
    col *= mix(vec3(1.0), vec3(0.6, 0.53, 0.76), vg * uVig);
  }
  col *= uTint;
  // paper grain
  float g = hash(floor(scr / 2.0)) - 0.5;
  col *= 1.0 + 0.05 * g;
  gl_FragColor = vec4(col, 1.0);
}`;

let U = null, tex = null;
function init() {
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  U = {};
  for (const n of ['uBg', 'uCel', 'uFx', 'uNoise', 'uRes', 'uCam', 'uSeed', 'uBoil', 'uBlur', 'uShift', 'uTaps', 'uShadow', 'uImpact', 'uHasFx', 'uWash', 'uTint', 'uFin', 'uRim', 'uDepth', 'uGlow', 'uVig']) U[n] = gl.getUniformLocation(prog, n);
  const mkTex = (unit, wrap) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    return t;
  };
  tex = { bg: mkTex(0, gl.CLAMP_TO_EDGE), cel: mkTex(1, gl.CLAMP_TO_EDGE), fx: mkTex(2, gl.CLAMP_TO_EDGE), noise: mkTex(3, gl.REPEAT) };
  // smooth tileable noise: a 32x32 random lattice, smoothstep-interpolated up to 256x256
  const N = 256, G = 32, data = new Uint8Array(N * N * 4);
  const lat = (x, y, ch) => rand(((x % G) + G) % G + (((y % G) + G) % G) * 57 + ch * 1013);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const gx = (x / N) * G, gy = (y / N) * G;
    const ix = Math.floor(gx), iy = Math.floor(gy);
    let fx_ = gx - ix, fy_ = gy - iy;
    fx_ = fx_ * fx_ * (3 - 2 * fx_);
    fy_ = fy_ * fy_ * (3 - 2 * fy_);
    for (let ch = 0; ch < 3; ch++) {
      const v = (lat(ix, iy, ch) * (1 - fx_) + lat(ix + 1, iy, ch) * fx_) * (1 - fy_) + (lat(ix, iy + 1, ch) * (1 - fx_) + lat(ix + 1, iy + 1, ch) * fx_) * fy_;
      data[(y * N + x) * 4 + ch] = Math.round(v * 255);
    }
    data[(y * N + x) * 4 + 3] = 255;
  }
  gl.activeTexture(gl.TEXTURE3);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.uniform1i(U.uBg, 0);
  gl.uniform1i(U.uCel, 1);
  gl.uniform1i(U.uFx, 2);
  gl.uniform1i(U.uNoise, 3);
  gl.uniform2f(U.uRes, W, H);
  gl.viewport(0, 0, W, H);
}
if (gl) init();

/** Clear the three layers ready for a new frame. */
export function begin() {
  for (const c of [bg, cel, fx]) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.filter = 'none';
    c.clearRect(0, 0, W, H);
  }
  bg.fillStyle = '#000';
  bg.fillRect(0, 0, W, H);
}

/**
 * Combine the layers into `out` (a 2D context).
 * look: { cam:{x,y,zoom}, drawing (int, changes per new drawing), boil, blur:[x,y], impact, wash, tint:[r,g,b], useFx,
 *         rim, depth, glow, vig (detailed finish strengths), finish:false to switch the finish off }
 */
export function compose(out, look = {}) {
  out.setTransform(1, 0, 0, 1, 0, 0);
  out.globalAlpha = 1;
  out.globalCompositeOperation = 'source-over';
  if (!gl) {
    out.drawImage(bgC, 0, 0);
    out.drawImage(celC, 0, 0);
    out.drawImage(fxC, 0, 0);
    return;
  }
  const up = (unit, canvas) => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  };
  up(0, bgC);
  up(1, celC);
  const useFx = look.useFx !== false;
  if (useFx) up(2, fxC);
  const cam = look.cam || { x: W / 2, y: H / 2, zoom: 1 };
  const d = look.drawing || 0;
  const blur = look.blur || [0, 0];
  const bl = Math.hypot(blur[0], blur[1]);
  const tint = look.tint || [1, 1, 1];
  gl.uniform3f(U.uCam, cam.x, cam.y, cam.zoom);
  gl.uniform2f(U.uSeed, rand(d * 3.1 + 1) * 29, rand(d * 7.3 + 2) * 29);
  gl.uniform1f(U.uBoil, look.boil ?? 1.6);
  gl.uniform2f(U.uBlur, blur[0], blur[1]);
  gl.uniform1f(U.uTaps, bl > 1 ? 8 : 1);
  gl.uniform2f(U.uShift, (look.shift || [0, 0])[0], (look.shift || [0, 0])[1]);
  gl.uniform2f(U.uShadow, 10, 13);
  gl.uniform1f(U.uImpact, look.impact || 0);
  gl.uniform1f(U.uHasFx, useFx ? 1 : 0);
  gl.uniform1f(U.uWash, look.wash ?? 1);
  gl.uniform3f(U.uTint, tint[0], tint[1], tint[2]);
  gl.uniform1f(U.uFin, DETAIL.on && look.finish !== false ? 1 : 0);
  gl.uniform1f(U.uRim, look.rim ?? 1);
  gl.uniform1f(U.uDepth, look.depth ?? 1);
  gl.uniform1f(U.uGlow, look.glow ?? 0.24);
  gl.uniform1f(U.uVig, look.vig ?? 0.5);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  out.drawImage(glC, 0, 0);
}
