"""Original synthesized foley for V1; no samples, speech, or external music.
Run from project root: python3 src/tiktok/theBear/soundtrack.py
"""
import array
import json
import math
import random
import subprocess
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
meta = json.loads(subprocess.check_output(['node', '--input-type=module', '-e',
    "import { SHOTS } from './src/tiktok/theBear/shots.js'; console.log(JSON.stringify(SHOTS))"], cwd=ROOT))
shots = {s['id']: s for s in meta}
RATE = 48000
DURATION = meta[-1]['end']
track = array.array('f', [0]) * round(DURATION * RATE)
rng = random.Random(23)
def event(start, duration, kind, gain=0.2, frequency=100):
    phase = 0.0
    filtered = 0.0
    for j in range(round(duration * RATE)):
        i = round(start * RATE) + j
        if not 0 <= i < len(track):
            continue
        t = j / RATE
        p = t / duration
        noise = rng.uniform(-1, 1)
        filtered = filtered * 0.93 + noise * 0.07
        attack = min(1, t / 0.008)
        if kind == 'hit':
            phase += 2 * math.pi * (frequency * (1 - 0.65 * p)) / RATE
            value = (math.sin(phase) * 0.7 + noise * 0.3) * math.exp(-8 * p)
        elif kind == 'creak':
            phase += 2 * math.pi * (frequency + 35 * math.sin(t * 19) + p * 110) / RATE
            value = (math.sin(phase) * 0.45 + math.sin(phase * 2.03) * 0.2 + filtered) * math.sin(math.pi * p)
        elif kind == 'swish':
            value = noise * math.sin(math.pi * p) ** 2 * 0.5 + filtered
        elif kind == 'rumble':
            value = (math.sin(t * 2 * math.pi * frequency) * 0.4 + filtered) * math.sin(math.pi * p)
        elif kind == 'laugh':
            pulse = max(0, math.sin(t * 2 * math.pi * 3.8)) ** 2
            phase += 2 * math.pi * (frequency - p * 15 + 8 * pulse) / RATE
            value = (math.sin(phase) + 0.3 * math.sin(phase * 2) + 0.4 * filtered) * pulse * math.sin(math.pi * p)
        else:
            value = filtered * math.sin(math.pi * p)
        track[i] += gain * attack * value

def at(shot, source):
    s = shots[shot]
    return s['start'] + (source - s['from']) / (s['to'] - s['from']) * s['duration']

# Gentle air under daylight; silence after the second landing is intentional.
event(0, shots['fall']['end'], 'air', 0.045)
event(0.1, 2.35, 'creak', 0.14, 230)
event(at('snap', 16.2), 0.22, 'hit', 0.6, 440)
event(at('snap', 16.4), 1.05, 'swish', 0.22)
event(at('snap', 17.65), 0.65, 'hit', 0.5, 85)
event(shots['mockery']['start'], 1.85, 'laugh', 0.11, 390)
event(shots['ladder']['start'] + 0.4, 1.7, 'creak', 0.085, 270)
for step in range(8):
    event(shots['climb']['start'] + step * 0.44, 0.13, 'hit', 0.08, 260)
event(shots['hesitate']['start'], 3.5, 'rumble', 0.07, 62)
event(at('release', 35.5), 0.3, 'creak', 0.19, 360)
event(shots['fall']['start'], 0.9, 'swish', 0.19)
event(at('fall', 37.15), 0.7, 'hit', 0.6, 68)
event(shots['anger']['start'], 2.4, 'rumble', 0.14, 49)
event(shots['hands']['start'], 3.2, 'creak', 0.08, 90)
event(shots['weapon']['start'], 2.8, 'rumble', 0.09, 55)
event(shots['fire']['start'], 1.75, 'swish', 0.10)
event(at('throw', 21.65) - 0.15, 0.62, 'swish', 0.45)
event(shots['shock']['start'], 0.65, 'hit', 0.55, 78)
event(shots['point']['start'], 2.1, 'rumble', 0.10, 43)
for step in range(12):
    event(shots['run']['start'] + 0.95 + step * 0.16, 0.12, 'hit', 0.065, 190)
event(at('grin', 43.6), 1.9, 'laugh', 0.18, 78)
# Peak headroom; remove DC and fade the endpoints.
mean = sum(track) / len(track)
peak = max(abs(v - mean) for v in track)
scale = min(1, 0.78 / max(peak, 0.001))
output = array.array('h')
for i, v in enumerate(track):
    fade = min(1, i / (RATE * 0.03), (len(track) - 1 - i) / (RATE * 0.12))
    output.append(round((v - mean) * scale * fade * 32767))
path = ROOT / 'exports/tiktok/tiktok-the-bear-v1-soundtrack.wav'
path.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(path), 'wb') as wav:
    wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(RATE); wav.writeframes(output.tobytes())
print(path)
