# Kid-flow findings — pre-gate review notes (U12 gate input)

Date: 2026-10-29. Reviewer: Anantha (assisted review).
Source: 12 extracted frames from the U13 wrong-then-right render
(`lessons/nc-2-oa-1-lesson-1.json`),
plus live-app expectations from `apps/web/src/main.tsx`.
Status: DRAFT for the U12 "Anantha plays it on a real iPad" gate.
Not yet validated by the full-video watch or the 3-path iPad playthrough.

Note (2026-10-31, backfill): the original text named a render file that
does not exist in the repo. The renders present are `render/out/final-a.mp4`
and `render/out/final-b.mp4` (plus `final-frames/`, `frames12/`,
`verify-frames/`). The finding text above is otherwise kept verbatim as
history; any full-video rewatch should name which present file was watched.

## Must-resolve before any child session

1. Reaction beats read as non-sequiturs (frames 1, 2, 5).
   Bare follow-up question + "Keep going" while Start/Book/Tray counts
   change with no visible continuity (tray appears/disappears).
   The child may not connect the reaction to the answer they gave.
   Suspected owner: U5 reducer/choreograph staging, U8 reaction play-out.
2. Same screen after an answer (frames 1 vs 10: identical ask screens).
   Re-ask re-renders the question unchanged, so a "Keep going" click can
   feel like the answer did nothing. Needs a continuity signal
   (e.g. pip acknowledges the retry, or the re-ask is visually marked).
3. Wrong answer lingers unexplained (frame 4: "33" still in the box).
   No acknowledgment of what the child entered before moving on.
   Decide: echo-and-repair vs clear-and-retry, then implement per U8.

## Should-fix before Stage A (U30)

4. Hint button leak (frame 7). A Hint button is visible mid-ask on a path
   that never uses hints. The render harness hides Hint buttons, so this
   frame caught a hide-timing race — worth confirming it cannot happen
   in the live app (U9: hint only after 8 s idle or one reaction).
5. Count-widget screens are busy (frames 3, 4, 8, 12). Number grid 1–20,
   text input, Answer, Done counting, Clear, and a star tray compete on one
   screen. Check focus order and whether the tray + grid duplicate each other.
6. No Pip artwork anywhere — "Pip the puffbun" is text only. Mascot art is
   M3/U18 scope, but even a static placeholder would change how a 7-year-old
   reads the page. Product call: placeholder now or wait for U18.
7. Read-aloud defaults off behind a checkbox (U12a). A non-fluent reader
   gets silence unless an adult enables it first. For any child session,
   decide the default and the adult-gate story before U30.

## By design (record, do not "fix" in U13)

8. The MP4 has no voice and near-static motion. Both are U13 requirements
   (frame-stepped determinism: same hash twice; audio is cue blips only).
   Voice = app read-aloud; motion = 200 ms pip entrance (U6). Judge animation
   and voice in the live app, never in the render.
9. The frame grid hops every 4.3 s and exaggerates discontinuity. Always
   confirm a finding against the full video before filing it as a bug.

## Positive (keep)

- Numbers are internally consistent within every frame; book/start/tray
  match the story state; widgets render cleanly at 1280x720.
- U13 acceptance itself is green: identical stream hashes on two runs,
  36/36 cues within 4 ms (budget 33 ms), H.264 + AAC 48 kHz mono.

## Next checks (the actual gate)

- [ ] Watch the U13 render end to end, note timestamps of confusion.
  (Open: the original file named here is absent; present renders are
  `final-a.mp4` and `final-b.mp4`. Record which file is watched.)
- [ ] Real-iPad playthrough, all 3 U12 paths, sound + read-aloud on.
- [ ] Write the U13 one-page report (hashes, ffprobe, frame notes).
