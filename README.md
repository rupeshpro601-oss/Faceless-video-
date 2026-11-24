# Faceless-video-

Original, fully self-contained animated YouTube Shorts — no stock footage, no AI image generators,
no external services. Everything (renderer, fonts, voice track, sound design, music) lives in this
repo and runs locally.

## 🎬 Current short: *The Runner Who Won Olympic Gold In A Car* [`faceless video 2d/`](faceless%20video%202d/)

The true story of the 1904 St. Louis Olympic marathon: Fred Lorz rode a car, the race director
withheld water to experiment on the runners, a Cuban postman snacked on rotten apples, a South
African runner was chased off course by wild dogs, and the winner got there on a mix of
strychnine, raw egg white and brandy. All facts verified against the sources listed in
[`faceless video 2d/script.json`](faceless%20video%202d/script.json).

| Spec | Value |
|---|---|
| Platform | YouTube Shorts, 9:16, 1080×1920 |
| Duration | 59.56 s · 24 fps · ~1,430 frames |
| Format | H.264 + AAC with full mix baked in |
| Final render | [`faceless video 2d/renders/marathon-1904.mp4`](faceless%20video%202d/renders/marathon-1904.mp4) — rebuilt any time with the 5-step pipeline below |
| Story style | Hook (0–3 s) → Setup → Development → Twist → Payoff ending, no intros |

## How the video should look (style bible)

- **Cinematic 3D environments** (dirt roads, dust clouds, a grandstand, an orchard, a finish tape)
  built from primitives with lights, shadows and depth of field — rendered live in WebGL via a
  vendored copy of three.js ([`vendor/`](faceless%20video%202d/vendor)).
- **Stylized 3D toon characters** with articulated limbs and expressive 2D cartoon faces (eyes,
  eyebrows, sweat drops, blush) drawn onto the 3D heads — see [`src/core/toon.js`](faceless%20video%202d/src/core/toon.js).
- **A different camera language per scene**: fly-ins, overheads, close-ups, head-on chases,
  reveal push-ins — every shot enters with a move, never a static frame.
- **Word-synced 2D caption cards** at the bottom (comic-book style, `|` = caption break) that cut
  exactly on the spoken words.
- **A hand-drawn 3D→2D blend**: cut-out gala racers, canvas-drawn dog sprites, red stamped
  insert cards ("RAT POISON").
- **Full sound design**: word-cued procedural SFX (whoosh/pop/boing/slam/…) + a procedural
  comedy oom-pah music bed that ducks under the voice — all synthesized in
  [`tools/mix.py`](faceless%20video%202d/tools/mix.py), zero samples.
- See [`docs/storyboard.jpg`](faceless%20video%202d/docs/storyboard.jpg) for a timestamped contact sheet
  of the whole film.

## How to make the video (build pipeline)

Requirements: **Node 22+**, a **Chrome/Chromium** binary (auto-detected, or set `CHROME=...`),
**ffmpeg** on PATH, and **Python 3** with `numpy` + `scipy` (only for rebuilding the audio mix).

```bash
cd "faceless video 2d"

# 0 · Story & research: script.json holds title, pacing, caption styling,
#     verified sources, and the narration lines. Edit this to write a new story.

# 1 · Narration: data/narration.wav is committed. To re-voice it, synthesize each
#     line in script.json with any TTS (espeak-ng voice "am_michael", speed 1.05,
#     gaps 0.18 s, 0.3 s lead-in) and update data/lines.json timings to match.

# 2 · Word timings + captions + sound cues (headless Chrome, ~1 min):
node tools/capture.mjs check        # boot + shot list + caption preview, errors if broken
node tools/capture.mjs cues         # writes data/cues.json

# 3 · Sound design / music / final mix (48 kHz stereo):
python3 tools/mix.py                # writes data/mix.wav (voice + SFX + music bed)

# 4 · QA before rendering (fast, low-res):
node tools/capture.mjs sheet review/all.jpg 0.7 7      # timestamped contact sheet
node tools/capture.mjs frames review/qa "1.2,8.4"      # full-size stills at any time

# 5 · Render the film with the mix baked in:
node tools/capture.mjs video renders/marathon-1904.mp4

# Live preview in a normal browser (interactive play button):
node tools/capture.mjs preview
```

### Long-render tip (chunking)

On software-GL machines Chrome's WebGL context can die mid-render (hang or crash).
Render in short chunks with fresh Chrome per chunk and losslessly concat:

```bash
node tools/capture.mjs video renders/c1.mp4 0 14.88
node tools/capture.mjs video renders/c2.mp4 14.89 29.88
node tools/capture.mjs video renders/c3.mp4 29.9 44.88
node tools/capture.mjs video renders/c4.mp4 44.89 59.562
cd renders && printf "file 'c1.mp4'\nfile 'c2.mp4'\nfile 'c3.mp4'\nfile 'c4.mp4'\n" > cat.txt
ffmpeg -f concat -safe 0 -i cat.txt -c copy marathon-1904.mp4
```

Chunk boundaries must not overlap (sub-0.1 s video/audio drift at the seams is imperceptible).
If a chunk hangs (log static for ≥3 min), kill it and re-run only that chunk.

## Project layout

```
faceless video 2d/
├── index.html / sheet.html    App entry + style-sheet (design doc) page
├── script.json                 Story: lines, captions, pacing, verified sources
├── src/
│   ├── main.js                 Boot, routing
│   ├── shots.js                The film: one draw function per shot + SFX cues
│   ├── sheet.js                Design-system style sheet page
│   └── core/                   engine.js, world.js, toon.js, props.js, captions.js,
│                                timing.js, board.js, lib.js
├── tools/
│   ├── capture.mjs             Headless-Chrome capture/render/QA CLI
│   └── mix.py                  Procedural SFX + music + final mix
├── vendor/                     Vendored three.js (see LICENSE-three.txt)
├── fonts/                      Inter Black/ExtraBold, Caladea Bold (bundled)
├── data/                       narration.wav, words.json, lines.json, cues.json, mix.wav
├── docs/storyboard.jpg         Timestamped contact sheet of the final film
└── renders/                    Final film (1080×1920 H.264+AAC) + its render chunks
```

## Making another episode

1. Pick a verified, twisty topic; cite sources in `script.json` (`sources[]`).
2. Write the narration lines (hook in the first 3 s, no "hey guys"), plus per-line `caps`
   (`|` = caption cut) for word-synced captions.
3. In `src/shots.js`, map each line to a shot: hide/show actors, place them, pick a camera
   (see the existing 16 shots and the `LOOKS` presets in `src/core/world.js`).
4. Run steps 2–5 above → QA the contact sheet → render.
