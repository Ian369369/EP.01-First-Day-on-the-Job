"""Split the single Higgsfield/ElevenLabs 'Miles' take (one voice for the whole episode) into line files.
Applies a +2 semitone formant-light pitch lift for a more youthful cartoon timbre, then loudness-matches."""
import numpy as np, soundfile as sf, subprocess, json, os
SRC='audio/higgsfield/voice_miles.wav'
CUTS=[('01_hey',0.04,1.85),('02_firstday',2.05,4.30),('03a_ah',4.48,5.50),('03b_achoo',5.52,6.60),
      ('04_watch',6.80,8.45),('05_gotcha',8.74,9.60),('06_phew',9.83,11.84)]
SEMIS=2.0
x,sr=sf.read(SRC); meta={}
for id,a,b in CUTS:
    seg=x[int(a*sr):int(b*sr)].copy(); n=int(0.012*sr); seg[:n]*=np.linspace(0,1,n); seg[-n:]*=np.linspace(1,0,n)
    tmp=f'audio/voice/_{id}.wav'; sf.write(tmp,seg,sr); r=2**(SEMIS/12); out=f'audio/voice/{id}.wav'
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',tmp,'-af',f'asetrate={sr}*{r},aresample=48000,atempo={1/r:.5f},highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=80',
                    '-ar','48000','-ac','1',out],check=True); os.remove(tmp)
    y,_=sf.read(out); y=y/np.abs(y).max()*0.9; sf.write(out,y,48000)
    # speech onset/offset inside the clip (for subtitle sync + lip flap)
    hop=480; e=np.array([np.sqrt(np.mean(y[i:i+hop]**2)) for i in range(0,len(y)-hop,hop)]); env=(e/e.max()).round(3)
    on=np.where(env>0.06)[0]; meta[id]={'dur':round(len(y)/48000,3),'onset':round(on[0]/100,2),'offset':round(on[-1]/100,2),'env100':env.tolist()}
    print(id,meta[id]['dur'],meta[id]['onset'],meta[id]['offset'])
json.dump({'engine':'Higgsfield text2speech_v2 / ElevenLabs','voice':'Miles (preset e18664a7)','pitch_semitones':SEMIS,'lines':meta},open('audio/voice/voice_meta.json','w'))
