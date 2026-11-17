"""Review helper: frame strip of a clip (n frames, evenly spaced or every `step` s). Usage: strip.py clip.mp4 out.png [n] [cols] [t0] [t1]"""
import subprocess, sys
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]; n = int(sys.argv[3]) if len(sys.argv) > 3 else 12; cols = int(sys.argv[4]) if len(sys.argv) > 4 else 6
d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src]))
t0 = float(sys.argv[5]) if len(sys.argv) > 5 else 0; t1 = float(sys.argv[6]) if len(sys.argv) > 6 else d
w, h = 216, 384; rows = (n + cols - 1) // cols; S = Image.new('RGB', (cols * w, rows * (h + 18)), (30, 30, 30)); D = ImageDraw.Draw(S)
for i in range(n):
    t = t0 + (t1 - t0) * (i + 0.5) / n
    subprocess.run(['ffmpeg', '-nostdin', '-loglevel', 'error', '-y', '-ss', f'{t:.3f}', '-i', src, '-vframes', '1', '-vf', f'scale={w}:{h}', '/tmp/_strip.png'], check=True)
    x, y = (i % cols) * w, (i // cols) * (h + 18); S.paste(Image.open('/tmp/_strip.png'), (x, y + 18)); D.text((x + 3, y + 3), f'{t:.2f}s', fill=(255, 255, 0))
S.save(out)
