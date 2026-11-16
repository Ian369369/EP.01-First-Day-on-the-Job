"""Original sound design + final mix for MOONBOY EP.01.
SFX are synthesized procedurally here (no third-party samples). Dialogue = Higgsfield/ElevenLabs 'Miles' lines,
music = Higgsfield ElevenLabs Music v2.5 cue (jazz take). Timing comes from the render's _info.json + scenes/timeline.js.
Usage: python3 tools/make_audio.py <render_info.json>   -> audio/sfx/*.wav, audio/mix/episode_mix.wav"""
import numpy as np, soundfile as sf, json, sys, os, subprocess, re
SR = 48000; DUR = 35.0; N = int(SR * DUR)
rng = np.random.default_rng(369)
info = json.load(open(sys.argv[1]))
tl = open('scenes/timeline.js').read()
def T(name):
    m = re.search(r'\b' + name + r':\s*([0-9.]+)', tl); return float(m.group(1))
def tt(n): return np.arange(int(n * SR)) / SR
def env(n, a=0.005, r=0.1):
    t = tt(n); e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / r); return e
def lp(x, fc):  # one-pole lowpass
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
    return y
def bp_noise(n, f0, f1, q=6):  # swept band-pass noise via FFT masking per block
    x = rng.standard_normal(int(n * SR)); out = np.zeros_like(x); B = 2048
    for i in range(0, len(x), B // 2):
        blk = x[i:i + B]; if_ = len(blk)
        if if_ < 16: break
        w = np.hanning(if_); X = np.fft.rfft(blk * w); f = np.fft.rfftfreq(if_, 1 / SR); k = i / max(1, len(x))
        fc = f0 * (f1 / f0) ** k; m = np.exp(-0.5 * ((np.log(f + 1) - np.log(fc)) * q) ** 2); out[i:i + if_] += np.fft.irfft(X * m, if_)
    return out / (np.abs(out).max() + 1e-9)
def tone(n, f, kind='sine'):
    t = tt(n); f = np.broadcast_to(f, t.shape) if np.ndim(f) else np.full(t.shape, f); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) if kind == 'sine' else np.sign(np.sin(ph)) * 0.5 + 0.5 * np.sin(ph)
# ---------------- SFX library ----------------
def boing(n=0.55, f=220, depth=0.45):
    t = tt(n); fr = f * (1 + depth * np.sin(2 * np.pi * 14 * t) * np.exp(-t * 6)) * (1 + .35 * np.exp(-t * 14)); return tone(n, fr) * env(n, .003, .22) * 0.8
def whoosh(n=0.5, f0=300, f1=2500): x = bp_noise(n, f0, f1, 3); return x * np.sin(np.pi * np.linspace(0, 1, len(x))) ** 1.5 * 0.7
def plop(n=0.25): t = tt(n); return tone(n, 420 * np.exp(-t * 9) + 90) * env(n, .002, .06) * 0.9
def ting(n=1.2, f=2637): t = tt(n); return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6) + .25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 10)) * env(n, .001, .35) * 0.35
def clunk(n=0.35): t = tt(n); return (tone(n, 70 * np.exp(-t * 3) + 40) * env(n, .001, .08) + bp_noise(n, 2000, 800, 2) * env(n, .001, .03) * .5) * 0.9
def step(n=0.09): return bp_noise(n, 900, 500, 2) * env(n, .001, .02) * .35
def tap(n=0.12): t = tt(n); return (tone(n, 1800) * .3 + bp_noise(n, 3000, 2000, 3) * .6) * env(n, .0005, .02) * .7
def squeak(n=0.18, f0=1400, f1=2300): t = tt(n); return tone(n, np.linspace(f0, f1, len(t)) * (1 + .05 * np.sin(2 * np.pi * 30 * t))) * np.sin(np.pi * t / n) * .18
def slide(n=0.32): x = bp_noise(n, 1800, 900, 2.5); return x * np.linspace(1, .2, len(x)) * .45
def fallwhistle(n=0.6): t = tt(n); return tone(n, np.linspace(1700, 700, len(t))) * np.sin(np.pi * t / n) * .18
def thwip(n=0.18): t = tt(n); return tone(n, 900 * np.exp(-t * 18) + 300) * env(n, .001, .05) * .6 + bp_noise(n, 4000, 1500, 3) * env(n, .001, .04) * .3
def chime(n=3.0):
    t = tt(n); out = np.zeros_like(t)
    for i, f in enumerate([1046.5, 1318.5, 1568, 2093]):
        d = i * 0.09; m = t >= d; tt2 = t[m] - d; out[m] += (np.sin(2 * np.pi * f * tt2) + .3 * np.sin(2 * np.pi * f * 2.01 * tt2)) * np.exp(-tt2 * 1.4) * .22
    return out
def shimmer(n=1.2): t = tt(n); x = sum(np.sin(2 * np.pi * (3000 + 400 * k) * t + k) * np.exp(-((t - .1 * k - .2) / .12) ** 2) for k in range(8)); return x * .06
def tweet(n=0.16): t = tt(n); return tone(n, 3200 + 900 * np.sin(2 * np.pi * 9 * t)) * np.sin(np.pi * t / n) * .07
def drone(n): t = tt(n); return (np.sin(2 * np.pi * 55 * t) * .5 + np.sin(2 * np.pi * 82.4 * t) * .3) * np.minimum(1, t / .6) * np.minimum(1, (n - t) / .4) * .22
def tick(n=0.05): return bp_noise(n, 5000, 4000, 4) * env(n, .0005, .01) * .35
def rustle(n=1.0): x = bp_noise(n, 2500, 5000, 1.5); m = .5 + .5 * np.sin(2 * np.pi * 7 * tt(n)); return x * m * np.sin(np.pi * tt(n) / n) * .22
os.makedirs('audio/sfx', exist_ok=True); os.makedirs('audio/mix', exist_ok=True)
fx = np.zeros(N); cues = []
def put(name, gen, t, g=1.0, save=True):
    x = gen() if callable(gen) else gen; i = int(t * SR); j = min(N, i + len(x)); fx[i:j] += x[:j - i] * g; cues.append((round(t, 3), name))
    if save and not os.path.exists(f'audio/sfx/{name}.wav'): sf.write(f'audio/sfx/{name}.wav', x / (np.abs(x).max() + 1e-9) * .9, SR)
# ---- cue sheet (episode seconds) ----
put('spot_clunk', clunk, T('spot'))
hi, hl = T('hopIn'), T('hopLand')
for k in range(3): put('boing_hop', lambda: boing(.45, 260 - 30 * k, .4), hi + (hl - hi) * (k + 1) / 3 - .02, .55)
put('trip_scuff', lambda: bp_noise(.25, 1200, 300, 2) * env(.25, .002, .08) * .6, T('trip'))
put('squeak', lambda: squeak(.2, 1100, 1900), T('trip') + .15, .8)
for k in range(6): put('step', step, T('walk0') + .15 + k * .29, .9)
put('glove_stretch', lambda: squeak(.28, 600, 1300), T('glove0') + .3, 1.0); put('glove_snap', tap, T('glove0') + 1.05, 1.0); put('ting', ting, 7.78, .5)
for k in range(5): put('nose_twitch', lambda: squeak(.07, 2400, 2800), T('twitch0') + .15 + k * .2, .6)
SNEEZE = T('SNEEZE'); put('sneeze_gust', lambda: whoosh(.55, 500, 3500), SNEEZE - .01, 1.0)
put('book_slide', slide, T('gustHit'), 1.0)
edge = T('gustHit') + 0.30; put('edge_tip', tap, edge, .8); put('fall_whistle', fallwhistle, edge + .02, 1.0)
put('slowmo_drone', lambda: drone(5.6), 12.3, 1.0)
for k in range(11): put('slowmo_tick', tick, 12.6 + k * .5, 1.0)
put('glint_ting', lambda: ting(1.4, 3136), T('glint'), .9)
put('crouch_stretch', lambda: squeak(.4, 500, 260), T('crouch'), 1.2)
put('launch_whoosh', lambda: whoosh(.75, 250, 2200), T('launch'), 1.0)
put('catch_thwip', thwip, T('CATCH'), 1.0); put('ting', ting, T('CATCH') + .02, .4)
land = 19.55; put('boing_land', lambda: boing(.7, 150, .55), land, 1.0); put('plop', plop, land + .28, 1.0)
for k in range(5): put('dizzy_tweet', tweet, land + .35 + k * .3, 1.0)
put('roll_whoosh', lambda: whoosh(.6, 400, 1600), T('upright0'), .7); put('plop', plop, T('upright1'), .7)
for k in range(4): put('step', step, T('walkBack0') + .1 + k * .25, .9)
put('set_down_tap', tap, T('walkBack1') + .33, .8)
c0 = T('check0')
for k, d in enumerate([.15, .8, 1.45, 2.1, 2.75]): put('check_ding', lambda: ting(.6, 1975 + 120 * k), c0 + d + .44, .55)
put('sleeve_rustle', lambda: rustle(1.0), T('sleeve0'), 1.0); put('sleeve_shine', shimmer, T('sleeve1'), 1.0)
put('wink_ting', lambda: ting(1.0, 3520), T('wink') + .1, .6)
put('outro_chime', chime, T('logo0') + .05, 1.0); put('outro_shimmer', shimmer, 33.05, 1.2)
# ---- dialogue ----
vo = np.zeros(N); duck = np.ones(N)
for v in info['voStarts']:
    x, sr = sf.read(f"audio/voice/{v['id']}.wav"); i = int(v['start'] * SR); j = min(N, i + len(x)); vo[i:j] += x[:j - i] * 0.95
    a, b = int((v['start'] - .08) * SR), int((v['start'] + v['dur'] + .15) * SR); duck[a:b] = np.minimum(duck[a:b], 0.36)
duck = lp(np.r_[duck], 12.0)
# ---- music ----
m, sr = sf.read('audio/higgsfield/music_a_jazz.wav'); m = m if m.ndim == 1 else m.mean(1)
mus = np.zeros(N); mus[:min(N, len(m))] = m[:N]
t = np.arange(N) / SR
gain = np.ones(N) * 0.42
gain *= np.clip(t / 0.6, 0, 1)
slow = np.clip((t - 12.25) / .35, 0, 1) * np.clip((18.0 - t) / .2, 0, 1)        # slow-mo: music drops + muffles
mus = mus * (1 - slow) + lp(mus, 500) * slow * 0.9
gain *= (1 - .55 * slow)
gain *= np.where(t < SNEEZE - .9, 1, np.where(t < SNEEZE, 1 - .75 * (t - (SNEEZE - .9)) / .9, 1))   # tension before the sneeze
gain *= np.clip((32.25 - t) / 0.9, 0, 1)                                         # music out into the outro
mix = mus * gain * duck + fx * 0.8 + vo
mix = np.tanh(mix * 1.1) / 1.1
sf.write('audio/mix/episode_mix_raw.wav', mix.astype(np.float32), SR)
sf.write('audio/mix/dialogue_stem.wav', vo.astype(np.float32), SR); sf.write('audio/mix/sfx_stem.wav', (fx * .8).astype(np.float32), SR)
sf.write('audio/mix/music_stem.wav', (mus * gain * duck).astype(np.float32), SR)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'audio/mix/episode_mix_raw.wav', '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11', '-ar', '48000', '-ac', '2', 'audio/mix/episode_mix.wav'], check=True)
json.dump(cues, open('audio/sfx/cue_sheet.json', 'w'), indent=0)
print('mixed', len(cues), 'sfx cues; peak', np.abs(mix).max().round(3))
