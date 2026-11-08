"""Map new-audio time -> old-audio time by windowed spectrogram matching.

Usage: python3 -I tools/align.py old.mp3 new.mp3
"""
import subprocess
import sys

import numpy as np

SR, HOP, WIN = 11025, 220, 2048  # ~50 frames/s


def feats(path):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(pcm, dtype=np.float32)
    n = (len(x) - WIN) // HOP
    fr = np.lib.stride_tricks.as_strided(x, (n, WIN), (x.strides[0] * HOP, x.strides[0]))
    sp = np.abs(np.fft.rfft(fr * np.hanning(WIN), axis=1))
    # 40 log-spaced bands
    edges = np.unique(np.geomspace(3, sp.shape[1] - 1, 41).astype(int))
    b = np.stack([sp[:, edges[i]:edges[i + 1]].mean(1) for i in range(len(edges) - 1)], 1)
    b = np.log1p(b * 20)
    b = b - b.mean(0)
    return b / (np.linalg.norm(b, axis=1, keepdims=True) + 1e-9)


old, new = feats(sys.argv[1]), feats(sys.argv[2])
fps = SR / HOP
W = int(float(sys.argv[6]) * fps) if len(sys.argv) > 6 else int(3 * fps)
MAXLAG = int(20 * fps)
T0, T1, STEP = (float(a) for a in (sys.argv[3:6] if len(sys.argv) > 5 else (0, len(new) / fps - 3, 2.0)))
for t in np.arange(T0, T1, STEP):
    i = int(t * fps)
    seg = new[i:i + W]
    best, bl = -1, 0
    for lag in range(-MAXLAG, MAXLAG + 1):
        j = i + lag
        if j < 0 or j + W > len(old):
            continue
        s = (seg * old[j:j + W]).sum() / W
        if s > best:
            best, bl = s, lag
    print(f"new {t:6.1f}  old {t + bl / fps:7.2f}  shift {bl / fps:+6.2f}  sim {best:.2f}")
