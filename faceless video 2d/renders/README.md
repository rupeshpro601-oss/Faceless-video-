# renders/ (generated output)

- `marathon-1904.mp4` — **the final film** (59.53 s, 1080×1920, H.264 + AAC with the full mix).
- `chunk1..4.mp4` / `chunk3_..` / `chunk4_..` — the four render chunks it was concatenated from
  (kept so a chunk can be re-rendered without redoing the whole pass; each `video` run boots a
  fresh Chrome, which is the reliable mode on software-GL machines).

Re-render a chunk and rebuild:

```bash
cd "faceless video 2d"
node tools/capture.mjs video renders/c4.mp4 44.89 59.562    # example: re-do chunk 4
printf "file 'c1.mp4'\nfile 'c2.mp4'\nfile 'c3.mp4'\nfile 'c4.mp4'\n" > renders/cat.txt
ffmpeg -f concat -safe 0 -i renders/cat.txt -c copy renders/marathon-1904.mp4
```

Chunk boundaries must not overlap. If a render hangs (log static ≥3 min), kill it and re-run
that chunk only.
