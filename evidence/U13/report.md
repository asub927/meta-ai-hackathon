# U13 evidence — deterministic renderer

Lesson: `lessons/nc-2-oa-1-lesson-1.json`. Path: `wrong-then-right`.
Command: `npm run render -- lessons/nc-2-oa-1-lesson-1.json --path wrong-then-right`.

## Determinism (two runs, post-fix tree)

- `render/out/final-a.mp4`: `c9b7ba0f66f61aadc3580ef5ed251f3d57ed38182462cd07b50e7dc237f28814`
- `render/out/final-b.mp4`: `c9b7ba0f66f61aadc3580ef5ed251f3d57ed38182462cd07b50e7dc237f28814`
- File hashes identical. Video-stream hashes identical
  (`f546c5bfa07a33a9bff42e1e3ccaff0c56fcf9a43eb48813d3b407a6db12fc7f` twice).
- 1557 frames, 51900 ms. No real-time screencast: every frame is a
  `window.__render.seek(t)` screenshot piped to ffmpeg.

## Container (ffprobe, `final-a.mp4`)

- Video: H.264, 1280x720, 30/1 fps.
- Audio: AAC, 48000 Hz, 1 channel.

## Cue timing (`--verify-cues final-a.mp4`)

- Expected 36, detected 36, max error 4 ms. Budget is one frame (33 ms).

## Frames

- `frame-grid.png`: 12 frames across the run, all viewed.
- `crayons-count-together.png`: compare-story reaction stages the wrong
  answer 40 with `Tray: 8` (the difference). Before the `stagingFor` fix
  this frame read `Tray: NaN`.

## Unit checks

- `node --test render/timeline.test.mjs`: 7 passed, including
  build-twice-deep-equal.
- `pnpm --filter @kids-math/core test`: 71 passed.
- `pnpm --filter web test`: 43 passed, including the compare tray case.
- Core and web `typecheck` clean.
