"""Transcribe a time range with a custom prompt. Usage: transcribe_range.py song.mp3 start end prompt"""
import subprocess, sys
import numpy as np
from faster_whisper import WhisperModel
src, a, b, prompt = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
pcm = subprocess.run(["ffmpeg","-v","error","-ss",str(a),"-to",str(b),"-i",src,"-ac","1","-ar","16000","-f","f32le","-"],capture_output=True,check=True).stdout
audio = np.frombuffer(pcm, dtype=np.float32).copy()
model = WhisperModel("medium", device="cpu", compute_type="int8")
segs, _ = model.transcribe(audio, language="pt", word_timestamps=True, initial_prompt=prompt, condition_on_previous_text=False, vad_filter=False, beam_size=5)
for s in segs:
    print(f"[{s.start+a:7.2f} - {s.end+a:7.2f}] {s.text.strip()}")
    print("    " + " ".join(f"{w.word.strip()}@{w.start+a:.2f}" for w in (s.words or [])), flush=True)
