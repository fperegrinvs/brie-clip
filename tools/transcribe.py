"""Word-level transcription of the song (rough lyric alignment).

Usage: .venv/bin/python tools/transcribe.py audio/song.mp3 tools/words.json [model]
"""
import json
import subprocess
import sys

import numpy as np

from faster_whisper import WhisperModel

src, out = sys.argv[1], sys.argv[2]
size = sys.argv[3] if len(sys.argv) > 3 else "medium"
prompt = (
    "Bree, Brizinha, furacão de algodão. Pim pim pim pinha. Linhão Bombom. "
    "Linguistos, cocodrilo, côve de patins. Zoomies. Vai pra cãodeia. Edredom. Recomeçou."
)
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
audio = np.frombuffer(pcm, dtype=np.float32).copy()
model = WhisperModel(size, device="cpu", compute_type="int8")
segs, info = model.transcribe(
    audio, language="pt", word_timestamps=True, initial_prompt=prompt,
    vad_filter=False, condition_on_previous_text=False, beam_size=5,
)
words, lines = [], []
for s in segs:
    lines.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()})
    print(f"[{s.start:7.2f} - {s.end:7.2f}] {s.text.strip()}", flush=True)
    for w in s.words or []:
        words.append({"start": round(w.start, 2), "end": round(w.end, 2), "word": w.word.strip()})
with open(out, "w") as f:
    json.dump({"segments": lines, "words": words}, f, ensure_ascii=False, indent=1)
