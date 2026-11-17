"""Assemble the MOONBOY voice-identity training clip: the original reference vocal + QC-approved takes
(correct words, F0 near the reference). Silences trimmed, loudness matched, 0.35 s gaps."""
import numpy as np, soundfile as sf, librosa, sys, json
SR = 44100
files = sys.argv[2:]; out = sys.argv[1]; parts = []
for f in files:
    x, sr = sf.read(f, dtype='float32'); x = x.mean(1) if x.ndim > 1 else x
    if sr != SR: x = librosa.resample(x, orig_sr=sr, target_sr=SR)
    x, _ = librosa.effects.trim(x, top_db=38)
    x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * 0.08; x = np.clip(x, -0.95, 0.95)
    parts += [x, np.zeros(int(0.35 * SR), np.float32)]
y = np.concatenate(parts); sf.write(out, y, SR)
json.dump({'sources': files, 'duration_s': round(len(y) / SR, 2)}, open(out.replace('.wav', '.json'), 'w'), indent=1)
print(out, round(len(y) / SR, 2), 's')
