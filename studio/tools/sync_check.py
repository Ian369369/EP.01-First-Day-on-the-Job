"""Compare the speech envelope of a generated clip's own audio with the intended dialogue track:
reports best lag (s) and correlation, so we know if replacing the audio keeps lip-sync."""
import sys, numpy as np, soundfile as sf, librosa
def env(p):
    x, s = sf.read(p, dtype='float32'); x = x.mean(1) if x.ndim > 1 else x; x = librosa.resample(x, orig_sr=s, target_sr=16000)
    S = np.abs(librosa.stft(x, n_fft=512, hop_length=160)); f = librosa.fft_frequencies(sr=16000, n_fft=512)
    e = S[(f > 250) & (f < 4000)].sum(0); e = np.log1p(e); return (e - e.mean()) / (e.std() + 1e-9)
a, b = env(sys.argv[1]), env(sys.argv[2]); n = min(len(a), len(b)); a, b = a[:n], b[:n]
best = max(range(-100, 101), key=lambda L: np.corrcoef(a[max(0, L):n + min(0, L)], b[max(0, -L):n - max(0, L)])[0, 1])
c = np.corrcoef(a[max(0, best):n + min(0, best)], b[max(0, -best):n - max(0, best)])[0, 1]
c0 = np.corrcoef(a, b)[0, 1]
print(f'lag={best/100:+.2f}s corr@lag={c:.3f} corr@0={c0:.3f}')
