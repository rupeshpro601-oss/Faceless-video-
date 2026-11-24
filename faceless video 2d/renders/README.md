# renders/ (generated output)

- `chunk1_0-14.88s.mp4` · `chunk2_14.89-29.88s.mp4` — the first two of four render chunks
  of the final film (frames 0–717 of ~1430), verified valid. Rendered chunk-by-chunk because
  software-GL Chrome can die during a single ~60 min pass.

To finish the film, render the remaining two chunks and concat all four:

```bash
cd "faceless video 2d"
node tools/capture.mjs video renders/c3.mp4 29.9 44.88
node tools/capture.mjs video renders/c4.mp4 44.89 59.562
ffmpeg -f concat -safe 0 -i <(printf "file '%s'\n" chunk1_0-14.88s.mp4 chunk2_14.89-29.88s.mp4 c3.mp4 c4.mp4) -c copy marathon-1904.mp4
```

Chunk boundaries must not overlap. If a render hangs (log static ≥3 min), kill it and re-run
that chunk only — each `video` run boots a fresh Chrome.
