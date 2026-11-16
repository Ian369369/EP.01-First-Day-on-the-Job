"""English dialogue via local Kokoro-82M TTS (Apache-2.0, no paid credits). One voice for the whole episode,
pitched up for a youthful cartoon timbre. Usage: make_voice.py <model_dir>"""
import sys, json, subprocess, os, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
md=sys.argv[1]
k=Kokoro(f'{md}/kokoro-v1.0.onnx',f'{md}/voices-v1.0.bin')
VOICE='am_puck'; SEMIS=3.2
LINES=[  # id, text, speed
 ('01_hey',"Hey! Name's Moonboy!",0.88),
 ('02_firstday',"First day! Easy peasy!",0.88),
 ('03a_ah',"Ah... Aah...",0.8),
 ('03b_achoo',"Ah-choo!",0.9),
 ('04_watch',"Not on my watch!",0.82),
 ('05_gotcha',"Gotcha!",0.9),
 ('06_phew',"Phew... Not a scratch!",0.85),
]
os.makedirs('audio/voice/raw',exist_ok=True); meta={}
def trim(x,sr,thr=0.012,pad=0.05):
    e=np.abs(x); idx=np.where(e>thr*e.max()/0.5 if e.max()>0 else e>0)[0]
    a=max(0,idx[0]-int(pad*sr)); b=min(len(x),idx[-1]+int(pad*2*sr)); return x[a:b]
for id,text,speed in LINES:
    s,sr=k.create(text,voice=VOICE,speed=speed,lang='en-us')
    raw=f'audio/voice/raw/{id}.wav'; sf.write(raw,s,sr)
    tmp=f'audio/voice/raw/{id}_p.wav'; r=2**(SEMIS/12)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',raw,'-af',f'asetrate={sr}*{r},aresample=48000,atempo={1/r},highpass=f=90',
      '-ar','48000','-ac','1',tmp],check=True)
    x,sr2=sf.read(tmp,dtype='float32'); x=trim(x,sr2)
    x=x/ max(1e-6,np.sqrt(np.mean(x**2)))*0.12; x=np.tanh(x*1.6)/1.6; x=x/np.abs(x).max()*0.89
    n=int(0.01*sr2); x[:n]*=np.linspace(0,1,n); x[-n:]*=np.linspace(1,0,n)
    out=f'audio/voice/{id}.wav'; sf.write(out,x,sr2); os.remove(tmp)
    d=len(x)/sr2; meta[id]={'text':text,'dur':round(d,3)}; print(id,d)
json.dump({'engine':'Kokoro-82M v1.0 (local, onnx)','voice':VOICE,'pitch_semitones':SEMIS,'lines':meta},open('audio/voice/voice_meta.json','w'),indent=1)
