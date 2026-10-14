# Sunre CELPIP practice

Independent original CELPIP-General-style preparation. Five Reading and five Listening tests, 38 questions each. Content emphasizes advanced inference, qualification, attitude and argument. Not official exam content or a calibrated CLB predictor.

## Deployment

Static files live only in `celpip/`, served at `/celpip/` by the existing Cloudflare deployment. No changes to business pages, root routing, build settings or external trackers. No server-side data collection. Progress and up to five submitted attempts per test are saved in localStorage on the current device/browser. Clearing website data removes progress.

## Modes and adaptations

Timed mode: a continuous 55-minute wall-clock deadline, including time away from the tab; automatic submission on expiry. Reading has four parts; Listening has six. Listening recordings are single-play, with questions unlocked after their associated recording ends. Interrupted audio can resume at its saved position. Manual play buttons comply with iOS playback restrictions. Source transcripts are withheld until submission. Parts can be revisited; discussion is audio rather than video. These are explicitly described practice adaptations, not an exact reproduction of the exam interface.

Practice mode: no countdown; native audio controls allow pause, replay and seeking. Answers remain editable until submission. Review includes full source, audio replay, transcripts, correct responses, explanations and per-part/per-skill raw scores. Official CLB scores are not inferred.

## Audio

Recorded neural speech, distinct voices for dialogue speakers, encoded as MP3. All audio is supplied as static files; no browser speech synthesis. `audio-manifest.json` records actual durations, size and voice count. `generate_audio.py` regenerates audio using edge-tts and ffmpeg (requires network access and those development dependencies). The deployed app has no dependency on that service.

## Content and engine

`reading.json` and `listening.json` hold original source text and answer keys. `core.mjs` provides scoring, persisted deadline calculations, audio paths and single-play question gating. `app.js` renders the responsive interface and stores attempts. The versioned storage key prevents incompatible data from being reused following a future content revision.

Official reference: https://www.celpip.ca/test-format-scoring/
