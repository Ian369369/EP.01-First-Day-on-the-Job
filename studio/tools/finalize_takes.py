"""Trim/normalize chosen takes into episode dialogue files and write a takes manifest.
Usage: finalize_takes.py <out_dir> line_id=path [...]"""
import sys, json, numpy as np, soundfile as sf, librosa, os
out = sys.argv[1]; os.makedirs(out, exist_ok=True); man = {}
for arg in sys.argv[2:]:
    lid, p = arg.split('=', 1)
    x, sr = sf.read(p, dtype='float32'); x = x.mean(1) if x.ndim > 1 else x
    if sr != 48000: x = librosa.resample(x, orig_sr=sr, target_sr=48000); sr = 48000
    _, (a, b) = librosa.effects.trim(x, top_db=40); a = max(0, a - int(.04 * sr)); b = min(len(x), b + int(.12 * sr)); y = x[a:b]
    y = y / (np.abs(y).max() + 1e-9) * 0.89; n = int(.008 * sr); y[:n] *= np.linspace(0, 1, n); y[-n:] *= np.linspace(1, 0, n)
    sf.write(f'{out}/{lid}.wav', y, sr)
    hop = 480; env = np.array([np.sqrt(np.mean(y[i:i + hop] ** 2)) for i in range(0, len(y) - hop, hop)]); env = (env / env.max()).round(3)
    man[lid] = {'source_take': p, 'dur': round(len(y) / sr, 3), 'env100': env.tolist()}
    print(lid, round(len(y) / sr, 2), 's')
json.dump(man, open(f'{out}/takes.json', 'w'))
