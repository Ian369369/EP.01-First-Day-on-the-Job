---
name: moonboy-episode
description: Produce a new MOONBOY episode (369° Collectible) end-to-end through Higgsfield. Use when the user asks for "MOONBOY EP.xx", a new MOONBOY episode/short, or to revise one.
---

# MOONBOY Episode Production (Higgsfield-first)

**Policy (user mandate):** Claude Code directs; **Higgsfield performs all creative generation** — images, video,
animation, voice, voice change / lip-sync, music, SFX, editing. Local code is only orchestration, downloads,
QC analysis and bookkeeping. Never substitute local rendering, local TTS or local SFX. Get the user's approval
for a credit budget before chargeable jobs, log every job in the episode's `production_log.md`, and never call
something done before Higgsfield returned the finished result.

## Fixed assets (reuse every episode)
- Character: `studio/character/moonboy_character_bible.md` (prompt block), official images
  (Higgsfield media `3ae11971-e9d1-4fe8-96e8-639570779805` front, `230f0830-4012-4377-bba7-249eafe0107b` turnaround).
- Style reference videos: `5c00b0b9-4bf2-4985-94f7-d0dcfedcbb62` (ref v1), `ee98951d-1ea2-46a5-bd02-6438df3f6a6a` (ref v2).
- Voice: **MOONBOY Voice v2 (authentic)** element `b4584f89-4dd0-4eab-b47e-b199779231a5` — see `studio/voice/moonboy_voice_profile.json`.
- Logo: `studio/reference/369_logo_official.png` (never regenerate; composite unaltered).

## Pipeline
1. **Script** → `studio/episodes/epXX/episode.json` (shots, EN lines, zh-TW subtitles, actions, musts). ~30 s, 9:16.
2. **Budget** → estimate (Seedance 2.0 Mini 720p ≈ 1 credit/s; Seedance 2.5 1080p ≈ 16 credits/s; seed_audio line ≈ 0.2–1;
   voice_change ≈ 1–2; gpt_image_2_6 high 2k ≈ 2.75) and ask the user to approve.
3. **Dialogue** → `generate_audio` model `seed_audio`, `voice_type: element`, `voice_id` = v2, plain line text.
   ≥2 takes; QC with `studio/tools/voice_qc.py` (transcript correct, F0 ~200–300 Hz, highest sim to
   `studio/voice/identity/authentic_voice_ref.wav`). Sneeze: "Ah... Ahh... ACHOO!" — verify with `studio/tools/sneeze_check.py`.
4. **Keyframes** (only where a new set/prop is needed) → `gpt_image_2_6`, quality high, 2k, 9:16, refs = a style frame
   from the reference video + official images.
5. **Shots** → `generate_video` `seedance_2_0_mini` (or `seedance_2_5` if budget allows), `generate_audio: true`,
   `start_image` = keyframe or the previous shot's last frame (continuity), `video_references` = ref v1/v2,
   `audio_references` = the v2 dialogue job ids; prompt says "lip-synced to @Audio N". 2 takes per shot; review
   frame strips (character on-model, ring intact, action/musts satisfied).
6. **Voice lock + lip-sync** → `voice_change` on each approved shot with the v2 element (keeps timing; verify with
   `studio/tools/sync_check.py`).
7. **Assembly / music / subtitles / end card** → Higgsfield sandbox via the `video-montage` workflow
   (`get_workflow_instructions video-montage`): concat, duck music, burn zh-TW subtitles, append the logo end card
   built from the unaltered official logo + "BEYOND THE COLLECTION.". Upload the master back to Higgsfield.
8. **QC & delivery** → frame strips of the master, transcript check, duration/streams; record credits in the log.
