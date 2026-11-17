"""Heuristic sneeze-structure detector: finds voiced/breathy build-up segments followed by an explosive burst
(sharp onset, high spectral centroid 'CH' then voiced 'OO'). Prints segment map and a pass/fail verdict."""
import sys, numpy as np, soundfile as sf
for p in sys.argv[1:]:
    x, sr = sf.read(p); x = x.mean(1) if x.ndim > 1 else x; hop = sr // 50
    fr = [x[i:i + hop] for i in range(0, len(x) - hop, hop)]
    db = np.array([20 * np.log10(np.sqrt(np.mean(f ** 2)) + 1e-9) for f in fr])
    cen = np.array([(lambda s, f: (s * f).sum() / (s.sum() + 1e-9))(np.abs(np.fft.rfft(f)), np.fft.rfftfreq(len(f), 1 / sr)) for f in fr])
    act = db > db.max() - 30; segs = []; st = None
    for i, a in enumerate(list(act) + [False]):
        if a and st is None: st = i
        if not a and st is not None:
            if i - st >= 3: segs.append((st, i))
            st = None
    info = []
    for a, b in segs:
        pk = db[a:b].max(); rise = db[a:min(b, a + 3)].max() - db[max(0, a - 1)]
        info.append((a / 50, b / 50, pk, cen[a:b].max(), rise))
    burst = [s for s in info if s[2] >= db.max() - 3]
    pre = [s for s in info if burst and s[1] <= burst[-1][0] + 0.05]
    ok = bool(burst) and len(pre) >= 2 and burst[-1][3] > 3500
    print(p.split('/')[-1], 'segments:', ' | '.join(f'{a:.2f}-{b:.2f}s pk{pk:.0f}dB cen{c/1000:.1f}k' for a, b, pk, c, r in info), '=>', 'SNEEZE-LIKE' if ok else 'not clear')
