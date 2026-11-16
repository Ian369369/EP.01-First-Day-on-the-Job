# MOONBOY — EP.01 "First Day on the Job"

369° Collectible · original animated short · 1080×1920 (9:16) · 24 fps · 35.0 s · H.264 + AAC

## Deliverables

| File | What it is |
|---|---|
| `output/MOONBOY_EP01_First_Day_on_the_Job.mp4` | **Final episode.** Traditional Chinese (Taiwan) subtitles burned in, plus a soft `mov_text` zh-TW track |
| `output/MOONBOY_EP01_clean_no_subs.mp4` | Same picture and mix with no subtitles, for re-editing or re-subtitling |
| `subtitles/EP01_zh-TW.srt` | Editable Traditional Chinese subtitles, synced to the spoken audio |
| `subtitles/EP01_zh-TW.ass` | Styled burn-in version (white bold Noto Sans TC, black outline, mobile-safe margin) |
| `subtitles/EP01_en.srt` | English dialogue reference |
| `covers/MOONBOY_EP01_Cover_A_Reel_1080x1920.png` | Instagram Reel cover (9:16) |
| `covers/MOONBOY_EP01_Cover_B_Feed_1080x1350.png` | Instagram feed promo cover (4:5) |
| `covers/*_textfree.png` | Text-free clean covers |
| `covers/layers/<format>/01–04_*.png` + `covers/cover.html` | Layered, editable cover source (background, accents, character, text as separate transparent PNGs; regenerate with `node tools/render_covers.js`) |
| `storyboard/EP01_storyboard_keyframes.png` | Storyboard: 21 key panels with timecodes |
| `storyboard/EP01_animatic_timecode.mp4` | Timecoded animatic (frame number and time burned in) |
| `qc/` | Quality-control evidence: book-fall acceptance report, sneeze filmstrip and key frames decoded from the final MP4, subtitle safe-area check, cover grid-thumbnail check |

## Project layout

```
assets/reference/   official MOONBOY references (front, turnaround) — the only appearance source
assets/brand/       official 369° Collectible logo (used unmodified in the outro)
assets/character/   rig sprites cut from the official art + parts.json (anchors/offsets)
assets/fonts/       OFL fonts: Titan One, Montserrat, Noto Sans TC
rig/moonboy_rig.js  reusable 2D cut-out rig (head+ring unit, face parts, rubber-hose limbs, gloves, shoes)
scenes/timeline.js  master timeline + deterministic book physics (shared by renderer and QC)
scenes/episode.js   all 7 scenes: poses, expressions, camera, studio, manga prop, FX, outro
scenes/episode.html renderer page (Chromium canvas)
audio/voice/        final dialogue lines (one voice) + voice_meta.json (lip-sync envelopes)
audio/higgsfield/   source takes downloaded from Higgsfield (voice takes, two music cues)
audio/sfx/          procedurally synthesized original SFX + cue_sheet.json
audio/mix/          final mix + dialogue / music / SFX stems
tools/              extraction, voice, audio, subtitle, render, encode and QC scripts
```

## Rebuild from source

```bash
python3 tools/extract_assets.py && python3 tools/extract_back.py   # rig sprites from official art
python3 tools/split_voice.py                                       # dialogue lines from the Higgsfield take
node tools/qc_book.js                                              # book-fall acceptance gate (must PASS)
node tools/render.js output/frames 0 839 1 4                       # 840 frames
python3 tools/make_subs.py output/frames/_info.json
python3 tools/make_audio.py output/frames/_info.json
tools/encode.sh
node tools/render_covers.js
```

Needs ffmpeg (with libass), Node + Playwright Chromium, and Python 3 with numpy, opencv-python-headless and soundfile.

See `PRODUCTION_NOTES.md` for methods, QC results and remaining limitations.
