# Production Notes — MOONBOY EP.01 "First Day on the Job"

## 1. Method summary

**Character (no AI redraw).**
- Every MOONBOY pixel comes from the two supplied official references.
- `tools/extract_assets.py` cuts the front art into rig parts:
  - the moon body and chrome ring as **one** sprite, so the ring can never drift, detach or change shape;
  - eyes, brows, nose and mouth as separate pieces;
  - an inpainted blank face;
  - fist, glove, standing shoe and raised sole.
- `tools/extract_back.py` cuts the back view from the turnaround sheet. It is used for the upside-down landing that shows his backside.
- Expressions are built from the official eye, brow and nose pieces, plus a few vector mouth and closed-eye shapes in matching ink weight.
- The default happy expression is the untouched official face.

**Limbs.** Arms and legs are procedural rubber-hose curves: black with a thin ivory rim, as in the reference art.

**Animation.**
- `scenes/episode.js` is a deterministic, code-driven 2D cut-out animation, rendered frame by frame in headless Chromium and encoded with FFmpeg.
- No text-to-video generation was used for any shot.

**Manga prop.** An original fictional volume, *COSMO KID Vol. 1*, drawn once as a master asset and reused unchanged in every shot. No copyrighted cover art is involved.

**Book physics** (`scenes/timeline.js`). The sequence is sneeze → gust → book slides → book crosses the edge → book falls:
- Sneeze burst at **11.55 s**; the gust reaches the book at 11.66 s.
- The slide uses constant friction: 1180 → 520 px/s over 0.30 s.
- The book leaves the edge at **11.96 s**.
- After that it follows a ballistic fall with gravity and horizontal drag, tumbling on the way down.
- Cartoon slow motion is a time-rate curve on the book's own clock. Position stays continuous, so there is no teleport.

**Dialogue.**
- Higgsfield → ElevenLabs TTS, preset voice **"Miles"**.
- One take of the whole script was split into seven lines (`tools/split_voice.py`) with a +2 semitone lift for a more youthful cartoon timbre.
- Using one take keeps the voice identical across the episode.
- A second voice ("Evan") was generated only for comparison and is not used.

**Music.** Higgsfield → ElevenLabs Music v2.5. Instrumental 1930s cartoon-jazz cue, take A is used; take B is kept in `audio/higgsfield/`. The cue is ducked under dialogue and filtered and dropped during the slow-motion section.

**SFX.** All synthesized in code (`tools/make_audio.py`); no third-party samples:
- boings, whooshes, plop, glint "ting", slide, falling whistle, slow-mo drone and ticks
- check-mark dings, sleeve rustle and shimmer
- outro chime

**Subtitles.**
- Traditional Chinese (Taiwan) only.
- Cue times come from the measured onset and offset of each actual voice clip.
- Burned in during post with libass, and also kept as a separate SRT and a soft track.
- The AI never generates any text into images.

**Outro.** The official 369° Collectible logo file is drawn unmodified. Only a feathered alpha on its black surround and a moving silver highlight are added, plus the line "BEYOND THE COLLECTION." "Stay curious!" does not appear anywhere.

## 2. Scene timing (final)

| Scene | Time | Content |
|---|---|---|
| 01 | 0:00–0:05 | Spotlight on; MOONBOY hops in, nearly trips, plays it cool, waves — "Hey! Name's Moonboy!" |
| 02 | 0:05–0:09 | Walks to the worktable and tugs his gloves — "First day! Easy peasy!" |
| 03 | 0:09–0:14 | One continuous wide shot: nose twitch, ACHOO, gust, slide, edge, fall |
| 04 | 0:14–0:18 | Close-up: smile drops, Collector Mode, ring glint — "Not on my watch!"; slow-motion book shot |
| 05 | 0:18–0:24 | Launch, stretched rubber-hose arm, mid-air catch at 18.86 s ("Gotcha!"), upside-down landing with backside showing, book held high |
| 06 | 0:24–0:32 | Back at the table: book on a display easel; checks corners ×2, spine, paper edge and surface; archival sleeve; "Phew… Not a scratch!"; wink |
| 07 | 0:32–0:35 | Fade to black; official logo; BEYOND THE COLLECTION.; chime |

## 3. Quality control

**Book-fall gate.** `node tools/qc_book.js` reports **PASS**; the full report is in `qc/book_fall_acceptance_report.txt`.

| Criterion | Result |
|---|---|
| The book leaves the table because of the sneeze | ✔ Sneeze 11.55 s → gust hit 11.66 s → slide → edge 11.96 s |
| The whole book is visibly separated from the table | ✔ Entire book past the edge and airborne by 12.25 s |
| MOONBOY does not move before the book falls | ✔ First reaction 12.30 s; launch 18.0 s |
| The book never teleports or changes appearance | ✔ One continuous physics function and one prop asset |
| MOONBOY catches the book in mid-air | ✔ Hand meets the book at 18.86 s |
| The book never touches the floor | ✔ Lowest point is 26 px above the floor |

These criteria were also confirmed visually on frames **decoded from the final MP4** (`qc/sneeze_to_fall_filmstrip_from_final_mp4.png`, frames 272–306). The shot is continuous, with no cut between the sneeze and the fall.

**Episode, audio and subtitles.**
- **Voice:** Whisper transcription of the final mix recovers every line correctly: "Hey! Name's Moonboy!", "First day! Easy peasy!", "Not on my watch!", "Gotcha!", "Phew! Not a scratch!"
- **Subtitle sync:** cue windows bracket the spoken words.
- **Loudness:** −15.6 LUFS integrated, LRA 7.1 LU.
- **Container:** 840 video frames, 35.000 s, H.264 High, AAC 48 kHz stereo at 192 kbps.
- **Subtitle placement:** subtitles sit 400 px above the bottom edge, clear of the Instagram Reels caption UI. Close-up framing was changed so the text never overlaps the character (`qc/subtitle_safe_area_check.png`).

**Covers.**
- Titles stay inside the centre safe area.
- MOONBOY's face stays large in the 3:4 profile-grid thumbnail (`qc/covers_and_grid_thumbnail_check.png`).
- The manga is secondary to the character.

## 4. AI / paid-credit usage

Everything ran on Higgsfield, with your explicit approval of a budget of about 12 credits:
- voice: 2 × ElevenLabs TTS, 0.6 credits each
- music: 2 × ElevenLabs Music v2.5 (36 s), 5.24 credits each

Total ≈ **11.7 credits**; the balance was 609 before generation.

No AI image or video generation was used. A local Kokoro-82M TTS draft (free) was tried first and dropped because of mispronunciation ("Moonboy", "Phew"); `tools/make_voice.py` remains as a free fallback.

The 369collectible.com website was not touched, and nothing was posted to social media.

## 5. Known limitations

1. **Cut-out animation, not hand-drawn in-betweens.**
   - Motion is rig-based: rotation, squash and stretch, and procedural limbs. It is not frame-by-frame redrawn cel animation, so there are no true 3D head turns.
   - Side views exist only as the official back view, and the front art is mirrored for facing right.
   - Mouth shapes beyond the official smile are vector approximations in matching style.
2. **The back view is upscaled.** It is ~2.7× from the small turnaround sheet and sharpened, so it is slightly softer than the front art. It appears only in the upside-down landing and the roll.
3. **The blank face is inpainted.** The front sprite with the face removed uses an inpainted ivory patch under the features. It is fully covered by the face pieces at all times, but small shading differences are possible in extreme close-ups.
4. **Timbre is altered.** The "Miles" preset is tagged middle-aged. The youthful sound comes from pitch-up plus delivery. A custom or cloned cartoon voice would be a further improvement.
5. **The fall uses a single cartoon slow-motion curve.** The book "hangs" for about 5 s. That is an intentional cartoon convention, not real-time physics.
6. **No industry-standard layered source.** No PSD or After Effects project is included because this toolchain has no Adobe tools. Instead:
   - the covers ship as separate transparent layer PNGs plus a regenerable HTML/canvas source;
   - the episode is fully regenerable from the scripts.
