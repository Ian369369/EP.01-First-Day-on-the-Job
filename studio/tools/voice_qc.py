"""MOONBOY voice QC: transcript (Whisper base.en), pitch stats (pYIN), speaker similarity vs the reference voice
(SpeechBrain ECAPA, if installed). Usage: python3 studio/tools/voice_qc.py ref.wav clip1.wav [clip2.wav ...]"""
import sys, json, numpy as np, soundfile as sf, librosa, os
os.environ.setdefault('HF_HUB_DISABLE_XET', '1')
def load(p, sr=16000):
    x, s = sf.read(p, dtype='float32'); x = x.mean(1) if x.ndim > 1 else x
    return librosa.resample(x, orig_sr=s, target_sr=sr) if s != sr else x
def f0stats(x):
    f0, vf, _ = librosa.pyin(x, fmin=80, fmax=800, sr=16000, frame_length=1024); v = f0[vf]
    return (float(np.median(v)), float(np.percentile(v, 10)), float(np.percentile(v, 90))) if len(v) else (0, 0, 0)
try:
    from speechbrain.inference.speaker import EncoderClassifier; import torch
    enc = EncoderClassifier.from_hparams(source='speechbrain/spkrec-ecapa-voxceleb', savedir=os.path.expanduser('~/.cache/sb_ecapa'))
    emb = lambda x: enc.encode_batch(torch.tensor(x)[None]).squeeze().numpy()
except Exception as e:
    print('speaker-sim unavailable:', e); emb = None
from faster_whisper import WhisperModel
wm = WhisperModel('base.en', device='cpu', compute_type='int8')
ref = load(sys.argv[1]); re = emb(ref) if emb else None; out = {}
print(f"REF {sys.argv[1]} F0 median/p10/p90 = {f0stats(ref)}")
for p in sys.argv[2:]:
    x = load(p); segs, _ = wm.transcribe(x, word_timestamps=True)
    words = ' '.join(w.word.strip() for s in segs for w in s.words)
    sim = float(np.dot(re, e := emb(x)) / np.linalg.norm(re) / np.linalg.norm(e)) if emb else None
    f = f0stats(x); out[p] = {'dur': len(x) / 16000, 'text': words, 'f0': f, 'speaker_sim': sim}
    print(f"{os.path.basename(p):40s} {len(x)/16000:5.2f}s F0={f[0]:.0f} ({f[1]:.0f}-{f[2]:.0f})  sim={sim if sim is None else round(sim,3)}  '{words}'")
json.dump(out, open('studio/voice/tests/last_qc.json', 'w'), indent=1)
