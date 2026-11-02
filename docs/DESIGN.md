# Wizard buttons: design (v2)

Status: **proposed, prototyped, not built in the app.** v2 of DESIGN.md, Nov 1, 2026. It folds in the 12 taste changes (TASTE-REVIEW.md) and Anantha's Nov 1 answers. Two prototypes, one per open option, live in `btn-proto/options/` (`option2.html`, `option3.html`, `compare.html`). Nothing is in `apps/web`, and nothing is committed or merged.

Parent docs: [DESIGN-PLAN.md](DESIGN-PLAN.md), [WORKED-EXAMPLE-EXPLAINER.md](WORKED-EXAMPLE-EXPLAINER.md), [../PLAN.md](../PLAN.md). Where this doc differs from them, §10 says so.

## 1. Purpose and non-goals

**Purpose.** Three buttons get a short, original wizard-school effect, in the Hero theme only. How much effect they get depends on how rare the moment is.

| Button | Rare moment (wand) | Every other time |
|---|---|---|
| **Check** (one label for all three answer controls: "Answer", "Done counting" and "Confirm tray" all become "Check") | Wand flick: a spark arc, a rune ring stamps around the answer, a tick | Ring stamp and tick only (Option 2) |
| **Show me** (rung 2) | Wand flick: a rune frame stamps around the ten-frame cue | Rune frame only (Option 2) |
| **Next** (rung 3) | Spellbook opens beside the step text | 200 ms step fade |

Two options are still open (§11):
- **Option 2, Earned magic (recommended).** Rare moments get the wand; repeats get the stamp.
- **Option 3, Calm and quick.** One short wand effect every time, and no book.

**Why.**
- The effect marks a moment the child caused, and it stays tied to the math: the tick lands on the answer, the frame goes around the cue, and the band sits behind the step.
- Delight is spent on rare moments. A child with 20 right answers watches about 0.65 s per repeat, not 2 s.

**Non-goals.** These are unchanged from v1:
- no effect on wrong answers;
- no sound;
- no Glam theme;
- no candles, owl or potion;
- no hover trail;
- no native port;
- no mascot art.

## 2. Principles for kids

1. **Calm.** One short effect per tap, then stillness.
2. **Story first.** The effect decorates a state change the app already makes.
3. **Never mark wrong.** A wrong answer gets no wand, no ring and no stamp. The story line carries it.
4. **The answer never leaks.** Nothing drawn shows a number before the real UI does, and the spell word is never a number.
5. **Fit effects to frequency.** The rare tier may run up to 1.5 s, and repeats finish in 0.7 s or less.
6. **Effects never block input.** Next always responds at once. Check and Show me ignore repeat taps during a run, which lasts at most 1.45 s. The button only dims to 0.6, so it never looks locked.

## 3. The effects

### 3.1 State machine (unchanged)

The states are `idle`, `casting`, `result`, `cleanup` and `skipped`. The transition table is the same as in v1, and the prototype implements it as `fxStep()`.
- `apply` runs exactly once per run.
- A Next tap during a run skips ahead: the pending step applies, then the new step applies with no effect.
- Cancel (problem change, story change, tab hidden) applies anything still pending and clears the overlay.

**New: the tier.** It is decided at tap time and passed into the run. The state machine does not change.

| Option | Check tier | Show me tier | Next tier |
|---|---|---|---|
| 2 | `rare` on the **first right answer of each story** and the **story's last right answer**; otherwise `repeat` | `rare` on the first Show me of each story; otherwise `repeat` | `rare` on the first Next per explainer (each problem now has its own worked example); otherwise `repeat` |
| 3 | `same` every time | `same` | `same` |

### 3.2 Check

Times are ms from the tap. Press feedback (`scale(0.97)`, 120 ms on pointer-down, 160 ms release) runs in every tier.

| Option 2 rare | Option 2 repeat | Option 3 (every time) |
|---|---|---|
| 0–120: wand rises from the button | 0–180: ring stamps down from 1.22 to 1 | 0–100: wand rises |
| 120–260: flick (pull back, then snap) | **180 peak**: badge pops, tick wipes in (150 ms), sentence fills | 100–200: flick |
| 120–700: spell word beside the button | 500–650: ring fades | 200–400: spark arc (travel curve) |
| 260–560: spark arc, 2 trailing sparks 30 ms apart | **done ≤ 700** | 400–580: ring stamps down |
| 600–780: ring stamps down, 3 sparks | | **450 peak**: tick and sentence |
| **650 peak**: tick wipes in, sentence fills, Pip asks "How did you know?" | | 600–750: wand sinks into the button |
| 1,100–1,300: ring fades | | 900–1,050: ring fades |
| 1,300–1,450: wand sinks into the button (about 150 ms, no flight home) | | **done ≤ 1,100** |
| **done ≤ 1,600** | | |

### 3.3 Show me

| Option 2 rare / Option 3 | Option 2 repeat |
|---|---|
| 0–100: wand rises; 100–220: flick; 220–440: arc | 0–180: rune frame stamps around the cue |
| 440–620: rune frame stamps around the cue | **180 peak**: cue appears; dots fade in by column, 30 ms apart |
| **500 peak**: cue appears; dots by column, 30 ms apart | 450–600: frame fades |
| 900–1,050: frame fades; 1,000–1,150: wand sinks | **done ≤ 600** |
| **done ≤ 1,300** (Option 2) / **≤ 1,200** (Option 3) | |

The spell word shows only in Option 2's rare tier, from 100 to 600 ms. The rung change happens on the tap; only the cue render waits for the peak.

### 3.4 Next

- **Option 2, first Next per explainer.**
  - 0–200: a closed book fades in beside the step text.
  - 200–560: the cover opens.
  - **250 peak**: the step text and "Step n of m" change.
  - 250–750: a flat cream band shows behind the step text (500 ms in all).
  - 900–1,150: the book fades.
  - **Done ≤ 1,200.** There is no wand on Next.
- **Option 2, later Next taps.** The step changes at once and fades in over 200 ms.
- **Option 3, every Next.**
  - The book icon on the button tilts once (200 ms).
  - The step text fades out by 150 ms, changes at **150 (peak)**, and fades in by 350.
  - There is no 3D book. **Done ≤ 400.**
- **Both options.** Back and "Try it" never animate. Five fast taps advance five steps (the prototype has 5 steps, so 4 taps reach the end).

### 3.5 Calm and reduced motion (both options)

- One still fades in over 200 ms: the ring with a tick, the cue frame, or the closed book.
- The real change applies at once, and the still is gone by 1,300 ms.
- There is no wand, no travel and no word.
- Press feedback keeps only its opacity under reduced motion.

## 4. Module design (`apps/web/src/fx/`, proposed)

These are the v1 types with three changes: `FxVariant` loses the accent, the tier is new, and `art` gains a cue frame.

```ts
type FxVariant = { spell: SpellWord; arc: "high" | "low" };            // accent removed (one magic colour)
type FxTier = "rare" | "repeat" | "same";
// fx/tier.ts (pure): story-scoped counters live in the core reducer, not in fx
export function tierFor(option: 2 | 3, button: FxButton, c: { rightsInStory: number; isLastProblem: boolean; showsInStory: number; nextsInExplainer: number }): FxTier;
type Effect = (layer: FxLayer, a: Anchors, v: FxVariant, tier: FxTier) => Timeline;
// fx/art.ts gains runeFrame(w, h) for the cue; ring and glow are flat circles (no gradients)
```

The data flow, pure/DOM split and plug-in points are as in v1. One change: the "Check" label replaces "Answer", "Done counting" and "Confirm tray". The prototype keeps every effect on one WAAPI animation per element; `peak`, `settled` and `done` are WAAPI timers on `document.timeline`, not `setTimeout`.

## 5. Visual spec

| Token | Value | Use |
|---|---|---|
| Ground / Cream | `#fff8ec` | Page, answer box, ring badge, word pill |
| Ink | `#213547` | Text, outlines |
| Blue (UI) | `#4d96ff`, tint `#dcebff` | Check and Next (primary), Show me (secondary by tone, no outline) |
| Sky | `#bde0fe` | Stage |
| **Amber (the only magic colour)** | `#ffd166` | Ring, spark, wand bands and tip, word star |
| Band | `#fff1c9` | Flat cream band behind the step text on Next |

- **Removed:** the seeded accent set (violet, sky, mint), radial-gradient glows, `drop-shadow`.
- **Flat, not glowing.** Glows are two flat concentric circles at different opacity. Depth is an ink outline.
- **Type hierarchy.**
  - The number sentence is the biggest text: 72 pt, weight 800.
  - Step text is 28 pt; the spell word and button labels are 24–28 pt.
  - The spell word sits beside its button and never over the question or the sentence.
- **Spacing.** An 8-pt scale (8, 16, 24, 32, 48).
  - Tap targets are **≥ 56 pt**: keys 56 × 56, buttons ≥ 64 tall.
  - At least 16 pt between Check and Show me.
  - The answer ring's radius is half the answer box plus 16, with no glyph at 3 or 9 o'clock, so it never crowds "=".
- **Buttons.** Flat, one shape (16 pt radius), one primary per area. While a run is active they dim to **0.6** and keep the label legible.
- **Easing.**
  - `cubic-bezier(0.23,1,0.32,1)` for every pop, fade and arrival.
  - `cubic-bezier(0.77,0,0.175,1)` **only for travel** (the spark arc).
  - Never ease-in, never `transition: all`, never `scale(0)`. The smallest start scale is 0.85 (the wand sink).
- **Properties.** Transform and opacity only. The prototype's runtime scan of every keyframe found only `transform` and `opacity`.
- **Budget.**
  - ≤ 28 overlay nodes. Measured peaks: 10 for Option 2 rare, 6 for Option 3.
  - Stagger ≥ 30 ms.
  - One `perspective` node (the book).
  - No `will-change`.
- **Fonts.** System rounded stack (`ui-rounded`, then bundled Nunito in the app). No network.
- **Accessibility.** The overlay is `aria-hidden` and `pointer-events: none`. Spoken text comes only from the real UI.

## 6. Per-device seed

- A random 32-bit seed is made on first launch: IndexedDB `kids-math-fx-seed` in the app (localStorage in the prototype).
- **It varies only the spell word (1 of 12) and the arc height, per button.**
  - The same device always gets the same word per button.
  - **The spell word shows only on rare moments** (Option 2's wand tier). Option 3 shows no word.
- Privacy is unchanged: the seed is never in the event log or in exports.

## 7. Content and trademark rules

- **Art.** Original SVG drawn in code: a wand (wood, amber bands, star tip), a rune ring and frame (invented glyphs) and a blue book with a moon and star. No AI art and no traced art. CC0 candidate.
- **Spell words (12, made up), searched on the web Nov 1, 2026.** Each was searched in quotes.

| Word | Status |
|---|---|
| Sparkalo! | Kept. Only a forum username and a fan joke turned up; no product or franchise. |
| Wizzlewop! | Kept. A parked domain (2025) and a username only. |
| Starbumble! | Kept. One hobby avatar-model name only. |
| Brindlezip! | New. No exact match. |
| Pimbleshoo! | New. No exact match. |
| Zorbleflick! | New. No exact match; nearest is "Zorbles", a fidget toy, so watch it. |
| Snorkleflip! | New. No exact match. |
| Twirlimix! | New. No exact match. |
| Flumbersnip! | New. No exact match. |
| Frizzlequonk! | New. No exact match. |
| Snicklewisp! | New. No exact match. |
| Tumblezorp! | New. No exact match. |

  - **Dropped, with the reason:**
    - "Plinko!" is a live registered trademark for games.
    - "Zimzoom!" is a photo-booth company.
    - "Twinkabloo!" is one letter from an adult site.
    - "Fizzleberry!" is a paint colour and a drink in a children's book series.
    - "Glimmerpop!" is a retailer.
    - "Moonmallow!" is an iOS game.
    - "Zappadoodle!" is a kids' cartoon channel name.
    - "Shimmeroo!" is a UK company.
    - "Bobbledoo!" is a baby-learning channel name.
  - "Plinko!" must not be reused.
  - A web search is not a trademark clearance. Run a formal check before the app ships publicly.
- **Banned words** stay in `fx/banned-words.ts`, as in v1.
- **Audit checklist** (unchanged): no franchise names or spells, no zig-zag bolt, no glasses-and-scar, no crest or house colours, no triangle-circle-line, no winged ball, no look-alike font.
- **Licences.** Code MIT; Nunito OFL; no new dependencies; no GSAP.

## 7a. Strategy names (NCDPI terms, verbatim)

Added Nov 1, 2026 at Anantha's request. The sourced list, with URLs, quotes, grade bands and gaps, is `btn-proto/options/NCDPI-STRATEGIES.md`.

**Rules.**
1. **Names come from NCDPI, word for word.** Every on-screen strategy name is a term from the NC Standard Course of Study, NC.1.OA.6: "Add and subtract, within 20, using strategies such as: Counting on, Making ten, Decomposing a number leading to a ten, Using the relationship between addition and subtraction, Using a number line, Creating equivalent but simpler or known sums."
   - Sources: [Vertical Progression (NCDPI)](https://www.dpi.nc.gov/documents/publications/catalog/ma196-vertical-progression-math/open), [1st Grade Unpacked Contents, Aug 2025](https://docs.google.com/document/d/1W37Ng1PYGVmUNNl7prYjCg7Lf4f5oMBTh21xEiwctnw) and [2nd Grade Unpacked Contents, Aug 2025](https://docs.google.com/document/d/1hIv3AVJtUaoIZs9kz1sLgRalHlqtk1ARf0agKCJV7_0), both linked from [NCDPI's unpacking index](https://ncdpi.instructure.com/courses/12806/pages/k-12-unpacking-documents).
   - We never rename, shorten or invent a strategy. Where NCDPI's term is hard for a young child, the term stays as it is and the kid sentence explains it.
   - Only NCDPI's capitalisation is changed: the first word is capitalised.
2. **Chip plus kid sentence.**
   - The name is shown as a text chip, with a visually hidden "Strategy:" prefix for screen readers.
   - Under or beside the chip is one plain-language kid sentence explaining the strategy.
   - The chip uses text, never colour or an icon alone. It is a pill with an ink outline and a 10-pt radius, so long names can wrap.
3. **Why-line.**
   - Every problem has its own "why this strategy" line, using that problem's real numbers. It is one sentence of about 12 words or fewer.
   - Every worked example has its own why-line, using the example's numbers, and it is the example's step 1. The problem's why-line also shows in the explainer header. No why-line is generic.
   - The strategy must genuinely fit the numbers. For example, Making ten only when an addend is 8 or 9, and Using the relationship… when subtracting a number close to 10.
   - Why-lines never state the answer.
4. **Consistency.** One strategy always gets the same name, and the same kid sentence, wherever it appears.
5. **Never on a wrong answer.**
   - A wrong answer shows "Not yet. Have another go, or tap Show me." with no chip.
   - The old "Try counting on from n" line is gone, since it named a strategy as a consequence of being wrong.
6. **Layout never moves under an effect.**
   - The Pip bubble reserves the space for chip plus why-line: 80 pt in portrait, 108 pt in landscape, where the why-line can wrap. The Show me rune frame therefore lands on a cue that does not move (checked on all 12 problems).
   - The explainer's progress dots now sit between Back and Next, so portrait 820×1180 still fits without scrolling.
7. **Grade band.**
   - NC.1.OA.6 is a Grade 1 standard, reused for Grade 2 fluency (NC.2.OA.2). Kindergarten has no named strategy list.
   - For grades 3–5 NCDPI has no within-20 strategy list. Only NC.3.NBT.2 ("relationship between addition and subtraction", "expanded form") and the NC.4.NBT.4 standard algorithm exist. We do not invent names for those gaps.

**Where names appear (both options, identical).**

| Place | What shows |
|---|---|
| Hint ladder, rung 2 (Show me), in the Pip bubble above the sentence | Chip and the problem's why-line, applied at the Show me peak |
| Worked example (rung 3) header, under "Worked example: a ± b" | Chip, the kid sentence, and "Your problem, a ± b:" with the problem's why-line |
| Explainer step 1 (step text, aria-live) | The worked example's own why-line |
| Each explainer step, above the step text (changes on Next) | Small chip, same name |
| Wrong answer, the Check result | Nothing (rule 5) |

**The NCDPI strategies.**

| NCDPI name (verbatim) | Grade band (NCDPI) | NCDPI definition (short) | Kid sentence (ours) | On screen in the demo |
|---|---|---|---|---|
| Counting on | 1–2 (K foundation, NC.K.CC.2) | "Students see the first addend as part of the total and count on" (also subtracts by finding an unknown addend) | Keep one number in your head and count up. | Story 2 P1, Story 3 P2 |
| Making ten | 1–2 (K foundation, NC.K.OA.4) | "decompose one of the addends to make a group of 10" | Make a 10 first, then add what is left. | Story 1 P1, Story 3 P1 |
| Decomposing a number leading to a ten | 1–2 | "The number being subtracted is decomposed in order to land on 10 and then the remaining number is subtracted." | Break the number apart so you land on 10 first. | Story 1 P2, Story 3 P4 |
| Using the relationship between addition and subtraction | 1–3 | "adding up from the number they are subtracting until they reach the start number" | Turn take-away into adding: what adds up to the total? | Story 1 P4, Story 2 P4 |
| Using a number line | 1–2 | A tool "to show how a student counts on, counts backwards, makes a group of ten, or decomposes a number leading to a ten" | Make jumps on a number line to find the answer. | Story 2 P2 |
| Creating equivalent but simpler or known sums | 1–2 | "use doubles combinations to solve doubles + 1 and doubles + 2 combinations" | Use a fact you already know, like a double, to solve a new one. | Story 1 P3, Story 2 P3, Story 3 P3 |

Not used, and why (details in NCDPI-STRATEGIES.md):
- **"Doubles +/- 1 or 2" and "doubles and near doubles"** appear only as sample-answer labels or in passing in the unpacking docs. NCDPI files them under *Creating equivalent but simpler or known sums*.
- **Counting back** is only a teacher note ("not explicitly mentioned in this standard").
- **Compensation and friendly numbers** come from a grant-funded supplemental site, not an NCDPI publication.

**All 12 demo problems: strategy, why-line and fit.** Story 1 is the one recorded.
- Every problem has its own worked example: the same strategy with other numbers, so the explainer never solves the child's own problem.
- **Step 1 of every worked example is the example's why-line**, so "why" is the first thing the explainer says.
- The explainer header repeats the child's own why-line under "Your problem, a ± b:".
- No why-line states an answer.

| # | Problem | NCDPI strategy | Why-line (hint + explainer header) | Worked example: step 1 why-line | Fit |
|---|---|---|---|---|---|
| S1 P1 | 8 + 5 | Making ten | This works because 8 is just 2 away from 10. | 9 + 6: This works because 9 is just 1 away from 10. | Strong: an addend of 8 or 9 |
| S1 P2 | 14 − 6 | Decomposing a number leading to a ten | This works because taking 4 from 14 lands on 10. | 15 − 8: This works because taking 5 from 15 lands on 10. | Strong: NCDPI's own example (S2, 14 − 6) |
| S1 P3 | 6 + 7 | Creating equivalent but simpler or known sums | This works because you know 6 + 6, and 7 is 1 more. | 7 + 8: This works because you know 7 + 7, and 8 is 1 more. | Strong: doubles + 1 (S2 files it here) |
| S1 P4 | 12 − 8 | Using the relationship between addition and subtraction | This works because 8 + 2 makes 10, then add up to 12. | 13 − 9: This works because 9 + 1 makes 10, then add up to 13. | Strong: NCDPI's own examples (12 − 8, 13 − 9) |
| S2 P1 | 9 + 3 | Counting on | This works because 3 is small, so count up 3 from 9. | 8 + 3: This works because 3 is small, so count up 3 from 8. | Strong: small addend (Making ten would also fit) |
| S2 P2 | 13 − 5 | Using a number line | This works because 13 is just 3 jumps from 10. | 12 − 4: This works because 12 is just 2 jumps from 10. | Good: NCDPI's own number-line task is 13 − 5 (S2). NCDPI calls the number line a tool for showing strategies |
| S2 P3 | 7 + 8 | Creating equivalent but simpler or known sums | This works because you know 7 + 7, and 8 is 1 more. | 5 + 6: This works because you know 5 + 5, and 6 is 1 more. | Strong: doubles + 1 |
| S2 P4 | 15 − 9 | Using the relationship between addition and subtraction | This works because 9 + 1 makes 10, then add up to 15. | 14 − 8: This works because 8 + 2 makes 10, then add up to 14. | Strong: subtracting 9 |
| S3 P1 | 5 + 8 | Making ten | This works because 8 needs just 2 more to make 10. | 4 + 9: This works because 9 needs just 1 more to make 10. | Strong |
| S3 P2 | 11 − 9 | Counting on | This works because 9 and 11 are close, so count up from 9. | 10 − 8: This works because 8 and 10 are close, so count up from 8. | Strong: NCDPI's "count on … (find an unknown addend)" with a gap of 2 |
| S3 P3 | 8 + 9 | Creating equivalent but simpler or known sums | This works because you know 8 + 8, and 9 is 1 more. | 4 + 5: This works because you know 4 + 4, and 5 is 1 more. | Strong: doubles + 1 |
| S3 P4 | 16 − 7 | Decomposing a number leading to a ten | This works because taking 6 from 16 lands on 10. | 13 − 5: This works because taking 3 from 13 lands on 10. | Strong: NCDPI's own number-line example is 13 − 5 |

**Changed on the Nov 1 evening re-check.** These were weak fits or repeated lines:
- **The worked example for 5 + 8** was 7 + 5 under Making ten. 7 is 3 away from 10, and NCDPI solves 7 + 5 via 5 + 5. It is now 4 + 9.
- **The relationship why-lines** said "8 is close to 12" and "9 is close to 15" (gaps of 4 and 6, so not close). They now name the real reason: "8 + 2 makes 10, then add up to 12."
- **The example for 15 − 9** was 14 − 9, which had the same why-line as the problem. It is now 14 − 8.

**Open (Anantha).** NC.1.OA.3 names the commutative and associative properties "as strategies for solving addition problems". They are NCDPI terms but are not in the demo; adding one is a product call. See NCDPI-STRATEGIES.md.

## 8. Verification

These are the v1 checks, plus the rows below. "Proto" means it was checked in the prototype with headless Chromium at 820×1180 and 1180×820.

| Rule | Check | Status |
|---|---|---|
| Tier: rare on the first and last right answer per story, repeat otherwise | Unit test on `tierFor`; E2E over a 4-problem story | Proto ✓ (rare, repeat, repeat, rare) |
| No wand on wrong answers | Wrong answer → 0 overlay nodes, 0 runs | Proto ✓ |
| Repeat Check taps ignored | 5 taps → 1 run | Proto ✓ |
| Fast Next taps skip ahead | 4 fast taps from step 1 → step 5 | Proto ✓ |
| Peak and done within spec | WAAPI timeline (table below) | Proto ✓ |
| Transform/opacity only | Runtime scan of `getAnimations()` keyframes | Proto ✓ |
| ≤ 28 nodes | rAF sample of the overlay | Proto ✓ (max 10) |
| Calm = one still ≤ 1.3 s | Calm toggle → 1 node | Proto ✓ (done 1,300 scheduled, 1,317 measured, which is one frame) |
| Strategy chip and why-line in the DOM and accessible name | Hint, explainer header and step chip text; aria snapshot contains "Strategy: <NCDPI name>" | Proto ✓ (`out/strategy-dom.json`) |
| No chip on a wrong answer | Wrong answer → 0 chips in the Pip | Proto ✓ |
| Cue does not move when the hint lands | Cue top before and after Show me, all 12 problems, both sizes | Proto ✓ (0 px shift) |
| Why-line on screen for all 12 problems | Hint why = problem's; explainer header contains it; step 1 = example why; both in the aria snapshot; no scroll on any step of any problem, both sizes | Proto ✓ (`out/strategy-dom.json`, 48 problem-views) |
| **Verified again, Nov 1, 2026, 5:31 PM ET** | Re-fetched NCDPI S1–S8; chip names verbatim against NC.1.OA.6; K and Grade 3–5 docs read for missed names (only NC.1.OA.3 properties found, not added); 12-problem fit review (3 fixes); rebuild; measure, DOM/aria, fit, recordings, sheets and screenshots re-run | Proto ✓ |
| Smooth on iPad, Safari, system Reduce Motion | Real iPad | **Not done** |

**Measured in the prototype.** Peak = the moment `apply` ran, read from `document.timeline` minus the run's first animation start. Done = all of the run's animations finished. Values are frame-quantised (≈ 16.7 ms) and were the same in both orientations.

| Run | Spec peak / done | Measured peak / done |
|---|---|---|
| Opt 2 Check rare | 650 / ≤ 1,600 | 650–667 / 1,450–1,467 |
| Opt 2 Check repeat | ~180 / ~700 | 183 / 650–667 |
| Opt 2 Show me rare | ~500 / ≤ 1,300 | 500–517 / 1,167 |
| Opt 2 Show me repeat | 180 / 600 | 183 / 600–617 |
| Opt 2 Next first / later | 250 / ~1,200; 0 / 200 | 250–267 / 1,167; 0 / 200–217 |
| Opt 3 Check | ~450 / ~1,100 | 450–467 / 1,050–1,067 |
| Opt 3 Show me | ~500 / ~1,200 | 517 / 1,167 |
| Opt 3 Next | 150 / ≤ 400 | 150–167 / 350–367 |
| Calm still (all) | 0 / ≤ 1,300 | 0 / 1,317 (scheduled 1,300) |

## 9. Decisions

**Decided (Anantha, Nov 1, 2026).**
- Wand flick on Check and Show me; spellbook on Next. Original art; no trademarks.
- Prototype Options 2 and 3 side by side in `btn-proto/`, outside the repo.
- Rare tier per **story**, and the story's last right answer counts.
- Per-device seed, with the spell word on rare moments only.
- Tap targets of 56 pt.
- Swap "Plinko!" and search all 12 words.
- Apply all 12 taste changes.
- Strategy names verbatim from NCDPI, each with a kid sentence and a per-problem why-line (§7a).

**Still open.** Option 2 or 3 (§11); Q1–Q5 from v1 (Hero only, no wand on wrong answers, the "Show me" label on rung 2, spellbook frequency, Calm off by default); and whether to allow a ≤ 0.2 overshoot on the ring (none in either prototype).

**Decisions log (v1 → v2).**

| # | Change | Source |
|---|---|---|
| 1 | Check peak 830 → 650 ms (rare), 180 ms (repeat); cap 2,000 → 1,600 / 700 | Taste 1–3, Anantha |
| 2 | Rare and repeat tiers per story; last right answer is rare | Taste 2, Anantha |
| 3 | Figure-eight trail cut; sparks 6 → 3; spell word gone by 700 ms | Taste 1 |
| 4 | Wand sinks into the button in about 150 ms; no flight home | Taste 4 |
| 5 | Amber is the only magic colour; accent set (with violet) dropped; seed varies word and arc only | Taste 5 |
| 6 | Radial glows become flat concentric circles; Next "light lift" becomes a flat cream band ≤ 500 ms | Taste 6 |
| 7 | Button dim 0.35 → 0.6; one "Check" label; Show me secondary by tone | Taste 7 |
| 8 | Number sentence is the biggest text; spell word beside the button | Taste 8 |
| 9 | 8-pt spacing scale; 56-pt targets; ≥ 16 pt between buttons | Taste 9, Anantha |
| 10 | Second curve accepted for travel only; closes the v1 §10 easing item | Taste 10 |
| 11 | First Next 1,800 → ~1,200 ms, no wand on Next; later Next 600 → 200 ms | Taste 11 |
| 12 | "Plinko!" and 8 other words replaced after web search | Taste 12, Anantha |
| 13 | Show me ring becomes a rounded rune frame around the cue (a circle cut through the cells) | Prototype |
| 14 | Tick reveal is a transform wipe, not a stroke draw (keeps transform/opacity only) | Prototype |
| 15 | Strategy names shown on screen, **verbatim from NCDPI NC.1.OA.6**: never invented or renamed; a kid sentence explains each one (§7a). The earlier invented labels ("Make ten", "Count on", "Break apart", "Double it", "Think add", "Jump the line") were dropped before they shipped | Anantha, Nov 1 |
| 16 | Every problem and every worked example has its own one-sentence "why this strategy" line using its real numbers, shown next to the chip (hint and explainer); never the answer | Anantha, Nov 1 |
| 17 | Demo stories use varied NCDPI strategies; each problem gets its own worked example (same strategy, different numbers), so the explainer, and Option 2's first-Next book, resets per problem. Wrong-answer line no longer names a strategy | Prototype |
| 18 | Re-verified against fresh NCDPI sources. Example step 1 = why-line; the explainer header shows the child's own why-line; 3 weak fits fixed (5 + 8 example → 4 + 9; relationship why-lines now say "a + b makes 10, then add up"; 15 − 9 example → 14 − 8) | Anantha, Nov 1 (evening) |

## 10. Differences from existing docs

These are the v1 rows, minus the easing row (closed by decision 10). Changes:
- **DESIGN-PLAN: Calm "No celebration burst"; reduced motion "celebration off".** One still ≤ 1.3 s stays, backed by C6 in OPTIONS.md.
- **WORKED-EXAMPLE-EXPLAINER: "one visual change per step".** Option 2's book plays once per explainer (~1.2 s, step text at 250 ms). Later steps are a 200 ms fade, and Option 3 never uses a book.

## 11. Option 2 vs Option 3

| | Option 2, Earned magic | Option 3, Calm and quick |
|---|---|---|
| Right answer | Full wand about twice per story (1.45 s); otherwise a 0.65 s stamp | The same 1.05 s wand every time |
| 20 right answers (5 stories) | ≈ 10 × 1.45 + 10 × 0.65 ≈ **21 s** of effect | 20 × 1.05 ≈ **21 s** |
| Spell word | Yes, on rare moments | None |
| Spellbook | Once per explainer | Icon tilt only |
| Feel | Special moments, fast practice | Predictable; a child learns exactly what Check does |
| Cost | A story-scoped tier (two counters) | None, but the repeat is ~1 s on every answer (review-animations flags it), and it drops the decided spellbook |
| Risk | A changing effect could confuse a child | Repetition may bore, and it is slower per repeat |
| Strategy names (§7a) | Same chips, kid sentences and why-lines | Same; this is not a difference between the options |

The total time comes out about even. That arithmetic uses the measured durations and assumes 4 problems per story; it was not measured with a child.

The real difference is where the time goes. Option 2 makes repeats about 0.4 s faster and spends the saving on two moments per story.

**Recommendation.** It stays **Option 2**. Decide by watching a child on a real iPad using `compare.html`.

## 12. Links

- `btn-proto/options/option2.html` and `option3.html` (self-contained) and `compare.html`
- `btn-proto/options/out/`: contact sheets, mp4s, calm stills, `measure.json`, `strategy-option{2,3}-p{1..4}-1180x820.png` and `strategy-dom.json`
- `btn-proto/options/NCDPI-STRATEGIES.md`: the sourced NCDPI strategy list
- [../PLAN.md](../PLAN.md), [DESIGN-PLAN.md](DESIGN-PLAN.md), [WORKED-EXAMPLE-EXPLAINER.md](WORKED-EXAMPLE-EXPLAINER.md), [DECISIONS-LOG.md](DECISIONS-LOG.md)
