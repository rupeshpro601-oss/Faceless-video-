# The Man Who Sold the Eiffel Tower — faceless 2D short

A 54-second vertical (1080x1920) faceless 2D animated short about Victor Lustig's
1925 con — selling the Eiffel Tower as scrap metal to André Poisson — made entirely
with the `faceless-shorts` skill in the **tall-tale** style (cut-out 3D dioramas,
speed-line comedy, big rubber stamps).

Final render: `eiffel-tower.mp4` — attached to the release on the branch that carries
this folder. A frame contact sheet is in `review/all.jpg`.

## Pipeline (all repeatable, no accounts / paid APIs)

Every step runs inside this folder:

```bash
SKILL=skills/faceless-shorts          # from the repo zip

# 1. narration + word timings (local Kokoro TTS + Whisper, no network)
bash $SKILL/scripts/py $SKILL/scripts/voice.py .
bash $SKILL/scripts/py $SKILL/scripts/words.py .

# 2. verify the shot list against the voice track
node tools/capture.mjs check

# 3. sound design (data/cues.json -> data/mix.wav: voice + music + 65 SFX cues)
node tools/capture.mjs cues
bash $SKILL/scripts/py tools/mix.py .

# 4. render the film (headless Chrome -> ffmpeg, ~25 min on CPU)
node tools/capture.mjs video renders/eiffel-tower.mp4

# review helpers
node tools/capture.mjs sheet review/all.jpg 0.5   # contact sheet
node tools/capture.mjs frames review/full "3.4,16.2"
```

## What's where

| path | what |
|---|---|
| `script.json` | title, voice (`am_michael`), music, 25 narration lines + verified sources |
| `src/shots.js` | the shot list — 25 shots keyed to spoken-word timestamps |
| `src/core/props.js` | Tall Tale kit + the added parametric `eiffel(h)` tower prop |
| `src/core/*` | engine (three.js renderer, DOF, bloom), toon cut-out rig, world sets, captions, timing |
| `tools/capture.mjs` | shot-exact capture through headless Chrome (`check/cues/sheet/frames/video`) |
| `tools/mix.py` | numpy soundtrack mixer (voice, music bed, cartoon SFX cues) |
| `review/all.jpg` | 109-frame contact sheet used for QA |

## QA performed

- `capture.mjs check` — no errors across all 25 shots at 0.25 s steps.
- Contact sheet + full-size key frames reviewed; camera paths in S01/S02/S25
  re-aimed so the characters sit in frame.
- Final MP4 verified: h264 1080x1920 24 fps, AAC 48 kHz stereo, 54.25 s.
