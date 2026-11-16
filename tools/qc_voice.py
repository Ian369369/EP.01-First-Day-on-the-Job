"""QC: transcribe voice lines with Whisper (local) to confirm intelligibility + word timings."""
import numpy as np, soundfile as sf, glob, sys, json
from faster_whisper import WhisperModel
m=WhisperModel('base.en',device='cpu',compute_type='int8')
out={}
for f in sorted(glob.glob(sys.argv[1] if len(sys.argv)>1 else 'audio/voice/*.wav')):
    a,sr=sf.read(f,dtype='float32'); a=a if a.ndim==1 else a.mean(1)
    a=np.interp(np.arange(0,len(a),sr/16000),np.arange(len(a)),a).astype('float32')
    segs,_=m.transcribe(a,word_timestamps=True)
    ws=[(w.word.strip(),round(w.start,2),round(w.end,2)) for s in segs for w in s.words]
    out[f]=ws; print(f, round(sf.info(f).duration,2), ws, flush=True)
json.dump(out,open('audio/voice/qc_transcript.json','w'),indent=1)
