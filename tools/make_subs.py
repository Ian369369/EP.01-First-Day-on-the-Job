"""Traditional Chinese (Taiwan) subtitles synced to the actual spoken audio (voice onset/offset from the rendered timeline).
Writes subtitles/EP01_zh-TW.srt (editable), subtitles/EP01_zh-TW.ass (styled burn-in) and subtitles/EP01_en.srt (reference)."""
import json, sys
info = json.load(open(sys.argv[1]))
ZH = {'03a_ah': '啊……啊……', '03b_achoo': '哈啾！'}
def ts(t, srt=True):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f'{h:02d}:{m:02d}:{int(s):02d},{int(round((s % 1) * 1000)):03d}' if srt else f'{h:d}:{m:02d}:{s:05.2f}'
rows = []
for v in info['voStarts']:
    a = v['start'] + v['onset'] - 0.06; b = max(a + 1.0, v['start'] + v['offset'] + 0.40)
    rows.append((a, b, v['zh'] or ZH.get(v['id']), v['en']))
for i in range(len(rows) - 1):            # no overlaps
    if rows[i][1] > rows[i + 1][0] - 0.04: rows[i] = (rows[i][0], rows[i + 1][0] - 0.04, rows[i][2], rows[i][3])
def srt(col):
    return '\n'.join(f'{i + 1}\n{ts(a)} --> {ts(b)}\n{r[col]}\n' for i, r in enumerate(rows) for a, b in [r[:2]])
open('subtitles/EP01_zh-TW.srt', 'w', encoding='utf-8').write(srt(2))
open('subtitles/EP01_en.srt', 'w', encoding='utf-8').write(srt(3))
ass = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ZH,Noto Sans TC,74,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,2,0,1,4.5,1.5,2,90,90,400,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
for a, b, zh, en in rows:
    ass += f'Dialogue: 0,{ts(a, False)},{ts(b, False)},ZH,,0,0,0,,{{\\fad(80,120)\\fw900}}{zh}\n'
open('subtitles/EP01_zh-TW.ass', 'w', encoding='utf-8').write(ass)
for r in rows: print(f'{r[0]:6.2f} -> {r[1]:6.2f}  {r[2]}  ({r[3]})')
