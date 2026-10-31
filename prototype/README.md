# Playable interaction prototype

Single-file canvas demo for the flow in [docs/DESIGN-PLAN.md](../docs/DESIGN-PLAN.md). **Not shipped code.** No network, no storage; state lives in memory only.

## Source file in this repo

**`interactive.html` is not committed.** The template embeds mascot art as `data:image/...;base64,...` placeholders. Repo policy: no AI-generated art, mascot images, or screenshots in git. To run locally, use the template you were given and fill the image slots yourself, or open a build that already has images inlined (outside the repo).

## What it demonstrates

- **Layout:** iPad-first landscape and portrait; light theme only (`color-scheme: light`).
- **Lesson strip:** six lessons (Getting more, How many left?, Make 10, Make it fair, Who has more?, There and back), two problems each, with tick marks and no points.
- **Cast:** Pip stays as narrator. Two story animals are picked at random **when a new problem starts** (Momo, Kiwi, toucan, fox, elephant, hedgehog in the prototype list; macaw and turtle are in the full cast plan for M4).
- **Phases per problem:**
  1. **Predict** — optional quick-guess buttons (More/Same/Fewer, and similar).
  2. **Do** — drag stickers from a pile or sticker sheet to the receiver; live “moved” or pile count; tap pile as fallback; wrong drop returns the sticker; answer pile label shows **?** until solved.
  3. **Answer** — 0–9 number pad (up to 20), Undo, Check; targets sized for 64 px minimum.
  4. **Right** — number sentence fills, stickers settle, short star burst (&lt; 2 s unless calm/reduced motion), Pip compares with the guess.
  5. **Wrong** — amber flash on the typed number, brief ghost pile, then hint ladder: smaller two-option question → **Show me** (zoom + ring) → **See it another way** (ten-frame tap cells) → three-step worked example.
- **Calm mode toggle** (stand-in for parent gate): box/tray instead of animals; no celebration; no Pip blink.
- **Motion:** transform/opacity tweens with `cubic-bezier(0.23, 1, 0.32, 1)`; while waiting on a question, only Pip’s slow blink runs (unless calm or reduced motion).
- **Accessibility gap:** buttons are drawn on canvas with a minimal keyboard path (Tab/Enter). The real app must use native controls and VoiceOver labels.

## How to run (local, with your own copy)

1. Save the filled single-file HTML (with images inlined only on your machine).
2. Open it in a browser (prototype was exercised in Chromium; Safari, real iPad, and VoiceOver are **not** verified).

## Licence

MIT for the prototype script. Art in local builds is concept/reference only until human-redrawn CC0 SVG ships in `assets/mascots/`.
