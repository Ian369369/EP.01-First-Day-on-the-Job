# MOONBOY EP.01 — Production Log (Higgsfield)

Budget approved by user: ~170 credits, 720p (2026-11-17). Balance at approval: 174.72.
All creative generation runs on Higgsfield. Local code = orchestration, downloads, QC/analysis only.

| # | Step | Higgsfield model / tool | Inputs (media / job ids) | Job id | Status | Credits | Output | Notes |
|---|------|------------------------|--------------------------|--------|--------|---------|--------|-------|
| 1 | Upload references | media_upload | ref v1 video, ref v2 video, official images | 5c00b0b9…, ee98951d…, 3ae11971…, 230f0830… | done | 0 | — | |
| 2 | Vocal isolation | separate_stems (htdemucs) | ref v1, ref v2 (sandbox) | — | done | 0 | sandbox moonboy/stems_v1, stems_v2 | replaces earlier local separation |
| 3 | Authentic voice clip | Higgsfield sandbox trim/concat | stems vocals | media 5cd7db21… | done | 0 | studio/voice/identity/authentic_voice_ref.mp3 | 9.7 s real speech only |
| 4 | Voice element v2 | create_voice_from_confirmed_audio | 5cd7db21… | voice b4584f89… | done | 40 | MOONBOY Voice v2 (authentic) | |
| 5 | Voice test | seed_audio + v2 | — | 1961990d…, d83fceb7…, 415e92c9… | done | ~1 | studio/voice/tests/v2/ | sim 0.76/0.82; sneeze too high-pitched (old ref) |
| 6 | Lip-sync pipeline test | voice_change (v1 then v2) on Seedance 2.0 Mini shot f2f17eb9… | — | 7335b273…, 90de0fe0… | v1 done / v2 pending | ~5 each | studio/episodes/ep01/takes/ | timing preserved (corr 0.96) |
| 7 | Lip-sync test v2 result | voice_change (v2) | shot f2f17eb9… | 90de0fe0… | done | ~1.7 | takes/sh1_test_A_voicechanged_v2.mp4 | timing corr 0.97, sim 0.57 → APPROVED as SH1 |
| 8 | EP01 dialogue (v2) | seed_audio + v2 | — | 5c823589 (beauty), 18bdf102 (sneeze ✔ 'Ah, ah. Achoo!'), 7de3125b (sneeze alt), cd857120 (watch), 062bbd23 (gotcha), 4288b745 (phew) | done | ~2 | studio/voice/takes/ep01_v2/ | used as audio_references for shots |
| 9 | SH2+3 (collectible + sneeze), 2 takes | seedance_2_0_mini 720p 9 s, generate_audio | start 90ab750e (keyframe), video_ref 5c00b0b9, audio_refs 5c823589 + 18bdf102 | ca655a9a…, ada7427d… | submitted | ~18 | — | |
| — | Music | (reuse) ElevenLabs Music v2.5 via Higgsfield, earlier job 9c147777… | — | 9c147777… | done (reused) | 0 | audio/higgsfield/music_a_jazz.wav | 1930s cartoon jazz, 36 s |
| 9r | SH2+3 review | — | ca655a9a (take1), ada7427d (take2) | — | REJECTED | (18 spent) | takes/sh23_take*.mp4 | video_references made the model copy the reference video (its 'Uh-oh, not on my watch' + close-up); take2: crying not sneezing, card teleports. Fix: no video_references, split shots, start+end keyframes for sneeze |
| 10 | Sneeze keyframes (pre-sneeze, card airborne) | gpt_image_2_6 high 2k (edit of 90ab750e) | 90ab750e, 3ae11971 | 899d7e5a…, 99a68136… | submitted | ~5.5 | — | |
| 11 | SH2 'Ooh! What a beauty!', 2 takes | seedance_2_0_mini 720p 4 s | start 90ab750e, img 3ae11971, audio 5c823589 | 58f2b30b…, bd8b0a1d… | submitted | ~8 | — | |
| 11r | SH2 review | — | 58f2b30b (take1), bd8b0a1d (take2) | — | take1 APPROVED | 8 | takes/sh2_take1.mp4 | 'Ooh, what a beauty.'; take2 ok but glove deformation; take1 ends in pose that matches next shot |
| 12 | Catch keyframe | gpt_image_2_6 high 2k | 99a68136, 3ae11971, 230f0830 | 1c8b2640… | done | 2.75 | keyframes/kf_sh4_catch.png | card held above floor |
| 13 | SH3 sneeze, 2 takes | seedance_2_0_mini 720p 6 s, start 899d7e5a + end 99a68136, audio 18bdf102 | — | 8ef00d40…, a50df960… | take2 APPROVED | 12 | takes/sh3_take2.mp4 | real sneeze ('A chew!' at 4.1 s), card blown off table; take1 sneeze less clear |
| 14 | SH4 rescue, 2 takes | seedance_2_0_mini 720p 5 s, start 99a68136 + end 1c8b2640, audio cd857120 + 062bbd23 | — | a26d4b2a…, d95cdcbc… | take2 APPROVED (take1 pending) | 10 | takes/sh4_take2.mp4 | 'Not on my watch. Gotcha!', catch above floor |
| 15 | SH5 inspect + proud ending, 2 takes | seedance_2_0_mini 720p 8 s, start 1c8b2640, audio 4288b745 | — | b91d5e5b…, bc540dc5… | submitted | 16 | — | |
| 16 | Voice lock (v2) | voice_change | 58f2b30b, a50df960, d95cdcbc | 7a4f159f…, 7314f86c…, 93c39ef1… | submitted | ~5 | — | |
| 17 | SH1 redo, 100% Higgsfield | gpt_image_2_6 keyframe (refs 3ae11971, 230f0830, 90ab750e) → seedance_2_0_mini 7 s (start 7ee1b7ad, img refs official, audio ref = v2 job 1961990d directly) → voice_change v2 | — | 7ee1b7ad, dbf2588d, 6226edcd (chosen), vc 7ebc2cf6 | done | ~2.75+14+1.7 | approved/sh1_v2_all_higgsfield.mp4 | on-model throughout; replaces old SH1 that used a locally-prepared reference |
