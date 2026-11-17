"""Speaker-embedding similarity of clips vs a reference and between takes of the same engine (ECAPA)."""
import sys, glob, os, itertools, numpy as np, soundfile as sf, librosa, torch
os.environ.setdefault('HF_HUB_DISABLE_XET', '1')
from speechbrain.inference.speaker import EncoderClassifier
enc = EncoderClassifier.from_hparams(source='speechbrain/spkrec-ecapa-voxceleb', savedir=os.path.expanduser('~/.cache/sb_ecapa'))
def emb(p):
    x, s = sf.read(p, dtype='float32'); x = x.mean(1) if x.ndim > 1 else x; x = librosa.resample(x, orig_sr=s, target_sr=16000)
    e = enc.encode_batch(torch.tensor(x)[None]).squeeze().numpy(); return e / np.linalg.norm(e)
ref = emb(sys.argv[1]); clips = sorted(sys.argv[2:]); E = {c: emb(c) for c in clips}
groups = {}
for c in clips: groups.setdefault(os.path.basename(c).rsplit('_', 1)[0], []).append(c)
for g, cs in groups.items():
    r = [float(E[c] @ ref) for c in cs]; pair = [float(E[a] @ E[b]) for a, b in itertools.combinations(cs, 2)]
    print(f'{g:14s} sim_to_ref={np.mean(r):.3f}  take_to_take={np.mean(pair) if pair else float("nan"):.3f}')
