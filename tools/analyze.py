"""Analyze song.mp3: tempo, beat phase, energy envelope -> src/analysis.json.

Usage: python3 -I tools/analyze.py audio/song.mp3 src/analysis.json
"""
import json
import subprocess
import sys

import numpy as np

src, out = sys.argv[1], sys.argv[2]
SR = 11025
pcm = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
    capture_output=True, check=True,
).stdout
x = np.frombuffer(pcm, dtype=np.float32)
dur = len(x) / SR

# --- onset envelope (spectral flux on 512-sample hops) ---
HOP, WIN = 256, 1024
n = (len(x) - WIN) // HOP
frames = np.lib.stride_tricks.as_strided(x, (n, WIN), (x.strides[0] * HOP, x.strides[0]))
spec = np.abs(np.fft.rfft(frames * np.hanning(WIN), axis=1))
spec = np.log1p(spec * 10)
flux = np.maximum(0, np.diff(spec, axis=0)).sum(axis=1)
flux = np.concatenate([[0], flux])
fps = SR / HOP
flux = flux - np.convolve(flux, np.ones(int(fps)) / int(fps), mode="same")
flux = np.maximum(flux, 0)

# --- tempo via autocorrelation over the main body ---
a, b = int(15 * fps), int(130 * fps)
o = flux[a:b] - flux[a:b].mean()
ac = np.correlate(o, o, "full")[len(o) - 1:]
lags = np.arange(len(ac))
with np.errstate(divide="ignore"):
    bpms = 60 * fps / lags
mask = (bpms > 100) & (bpms < 180)
lag0 = lags[mask][np.argmax(ac[mask])]
# refine with parabolic interpolation
y0, y1, y2 = ac[lag0 - 1], ac[lag0], ac[lag0 + 1]
lag = lag0 + 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2)
bpm = 60 * fps / lag
period = 60 / bpm

# --- phase: pick offset maximizing summed onset strength at beat times ---
best, best_off = -1, 0
for off in np.linspace(0, period, 200, endpoint=False):
    ts = np.arange(off + 15, 130, period)
    idx = np.round(ts * fps).astype(int)
    s = flux[idx].sum()
    if s > best:
        best, best_off = s, off

# --- energy envelope at 10 Hz, normalized 0..1 ---
E_HOP = SR // 10
rms = np.array([np.sqrt(np.mean(x[i:i + E_HOP] ** 2)) for i in range(0, len(x) - E_HOP, E_HOP)])
rms = rms / rms.max()

# --- onset envelope at 30 fps (for punchy hits), normalized ---
on30 = np.interp(np.arange(0, dur, 1 / 30), np.arange(len(flux)) / fps, flux)
on30 = on30 / np.percentile(on30, 99.5)
on30 = np.clip(on30, 0, 1)

# --- quiet regions (silences) ---
quiet = []
q = rms < 0.12
i = 0
while i < len(q):
    if q[i]:
        j = i
        while j < len(q) and q[j]:
            j += 1
        if (j - i) >= 5:
            quiet.append([round(i / 10, 2), round(j / 10, 2)])
        i = j
    else:
        i += 1

res = {
    "duration": round(dur, 3),
    "bpm": round(float(bpm), 3),
    "beatOffset": round(float(best_off), 4),
    "energy": [round(float(v), 3) for v in rms],
    "onset30": [round(float(v), 3) for v in on30],
    "quiet": quiet,
}
with open(out, "w") as f:
    json.dump(res, f)
print(f"duration {dur:.2f}s  bpm {bpm:.2f}  offset {best_off:.3f}s  quiet {quiet}")
