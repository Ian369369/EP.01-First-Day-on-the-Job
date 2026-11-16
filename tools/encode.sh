#!/usr/bin/env bash
# Final encode: rendered PNG frames + mix -> H.264 High / AAC MP4 with burned-in zh-TW subtitles (+ soft mov_text track).
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=output/MOONBOY_EP01_First_Day_on_the_Job.mp4
ffmpeg -y -loglevel error -framerate 24 -i output/frames/%04d.png -i audio/mix/episode_mix.wav -i subtitles/EP01_zh-TW.srt \
 -filter_complex "[0:v]ass=subtitles/EP01_zh-TW.ass:fontsdir=assets/fonts,format=yuv420p[v]" -map "[v]" -map 1:a -map 2:s \
 -c:v libx264 -preset slow -crf 17 -profile:v high -level 4.1 -pix_fmt yuv420p -r 24 -g 48 -c:a aac -b:a 192k -ar 48000 \
 -c:s mov_text -metadata:s:s:0 language=chi -metadata:s:s:0 "title=繁體中文（台灣）" \
 -metadata "title=MOONBOY EP.01 — First Day on the Job" -movflags +faststart -t 35 "$OUT"
# clean (no burned subtitles) master for re-editing
ffmpeg -y -loglevel error -framerate 24 -i output/frames/%04d.png -i audio/mix/episode_mix.wav -map 0:v -map 1:a \
 -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -r 24 -c:a aac -b:a 192k -movflags +faststart -t 35 output/MOONBOY_EP01_clean_no_subs.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames:format=duration,size -of compact "$OUT"
