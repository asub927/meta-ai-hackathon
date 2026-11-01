# Wizard buttons: design

Status: **proposed, not built.** No code for this feature exists in `apps/web` yet. Drafted Nov 1, 2026, for Anantha's review. This is the durable spec: what the effects are and why. The build order lives in the companion plan (`PLAN-WIZARD-BUTTONS.md`, not yet in the repo).

Parent docs: [DESIGN-PLAN.md](DESIGN-PLAN.md) (child flow, motion rules), [WORKED-EXAMPLE-EXPLAINER.md](WORKED-EXAMPLE-EXPLAINER.md) (rung 3), [../PLAN.md](../PLAN.md) (tutor rules, work units). Where this doc differs from them, §10 says so.

## 1. Purpose and non-goals

**Purpose.** Three buttons get a short, original wizard-school effect, in the Hero theme only:

| Button | Effect | Where it lives today |
|---|---|---|
| **Check** (answer) | Wand flick: a spark arc stamps a rune ring with a tick | "Answer" in `main.tsx`, "Done counting" in `interact/CountWidget.tsx`, "Confirm tray" in `interact/DragTray.tsx`. There is no single Check button yet. |
| **Show me** (rung 2) | Wand flick: the ring forms around the ten-frame cue | The "Hint" button in `main.tsx` when the rung goes from 1 to 2 |
| **Next** (rung 3) | Spellbook: a book opens, a page turns, light lifts onto the step | `explainer-next` in `story/ExplainerPanel.tsx` |

**Why.**
- The effect marks a moment the child caused: an answer accepted, help shown, a step taken.
- It stays tied to the math. The tick lands on the answer, the ring circles the cue, and the light lands on the step text.

**Non-goals.**
- No effect on wrong answers. The story consequence owns that moment.
- No sound effects.
- No Glam theme.
- No other v7 variations (candles, owl, potion).
- No hover trail.
- No native iPad port. The SwiftUI app re-specs this later.
- No mascot art.

## 2. Principles for kids

1. **Calm.** One short effect per tap, then stillness. While input waits, only Pip's blink moves ([DESIGN-PLAN.md](DESIGN-PLAN.md) "Motion rules").
2. **Story first.** The effect decorates a state change the app already makes. It never adds a step, a reward or a score.
3. **Never mark wrong.** A wrong answer gets no wand, no ring and no amber-versus-green contrast from this layer.
4. **The answer never leaks.**
   - Nothing the effect draws shows a number before the real UI shows it.
   - The spell word is never a number or a hint.
5. **Celebrations under 2 s.** The Check effect *is* the right-answer celebration, with a cap of 2,000 ms. It must not run on top of another celebration.
6. **Effects never block input.**
   - Next always responds at once.
   - Check and Show me ignore repeat taps during their run. That is at most 2.0 s and 2.6 s, and the app could not use those taps anyway.

## 3. The three effects

### 3.1 One state machine for all three

Each button owns one `FxRun`. The states are a discriminated union, and every transition is a row in the table below. There are no booleans.

| State | Meaning |
|---|---|
| `idle` | Nothing running. |
| `casting` | Motion before the peak. The real UI change is **not** applied yet. |
| `result` | The peak has passed. The real UI change **is** applied, and motion is settling. |
| `cleanup` | Nodes are fading and being removed. Taps count as idle again. |
| `skipped` | The run was cut short. The real UI change is applied at once, then the machine goes to `idle` on the next step. |

| From | Event | To | Commands |
|---|---|---|---|
| `idle` | `tap`, motion `full` | `casting` | `start` |
| `idle` | `tap`, motion `calm` or `reduced` | `skipped` | `apply`, `still` |
| `casting` | `peak` (timer) | `result` | `apply` |
| `casting` | `tap` (Check, Show me) | `casting` | none (ignored) |
| `casting` | `tap` (Next) | `skipped` | `apply`, `clear`, `advance` |
| `result` | `tap` (Next) | `skipped` | `clear`, `advance` |
| `result` | `tap` (Check, Show me) | `result` | none (ignored) |
| `result` | `settled` (timer) | `cleanup` | `fadeOut` |
| `cleanup` | `tap` | treated as from `idle` | `clear` first |
| `cleanup` | `done` | `idle` | `clear` |
| `casting` or `result` | `cancel` (unmount, story change, tab hidden) | `skipped` | `apply` if not yet applied, `clear` |
| `skipped` | (next tick) | `idle` | none |

**Invariant.** `apply` runs **exactly once per run**: on `casting → result`, or on any exit from `casting` that skips the peak. A thrown error inside the effect is the same as `cancel`.

**Which taps start a run.** Check starts a run only when the core reducer moves to `explaining` (a right answer). A wrong answer sends no `tap` to this machine.

### 3.2 Check: wand flick (cap 2,000 ms)

| ms | What the child sees |
|---|---|
| 0 | Button press feedback (scale 0.97, 60 ms). Button dims to 0.35 opacity. |
| 0–150 | Wand rises from the button with a glowing tip. |
| 120–900 | A speech burst pops up with the spell word (§6) and fades out. |
| 150–450 | The wand draws a small figure-eight, with a short glowing trail. |
| 450–530 | Flick: pull back, then snap forward. |
| 530–830 | A spark arc travels from the tip to the result spot. |
| 800 | A rune ring stamps around the result spot, with 6 sparks. |
| **830 peak** | **Real change:** the number sentence fills (for example "14 − 6 = 8"), the tick draws in the ring, and Pip's "How did you know?" line appears. |
| 1,250–1,550 | The ring and tick fade. |
| 1,500–1,850 | The wand flies home into the button, and the button returns to full opacity. |
| ≤ 2,000 | Overlay empty. |

**On time regardless.** The sentence fill and the Pip line come from the reducer's effects in `send()`. They apply at `peak`, or at once on skip or cancel. They never wait past 830 ms.

**Skip and cancel.** Extra Check taps are ignored. The core reducer already ignores `answered` outside `asking`. Cancel clears nodes and applies the change.

### 3.3 Show me: wand flick around the cue (cap 2,600 ms)

| ms | What the child sees |
|---|---|
| 0–170 | Wand rises from the Hint / Show me button. |
| 170–600 | Figure-eight with trail. The spell burst shows from 200 to 1,180. |
| 600–790 | Flick. |
| 790–1,090 | Spark arc to the centre of the cue area. |
| 1,060 | A large rune ring stamps around the cue area. |
| **1,100 peak** | **Real change:** the ten-frame cue appears. Dots fade in 25 ms apart, and Pip's hint line shows. |
| 1,700–2,000 | The ring fades. |
| 2,000–2,400 | The wand flies home. |
| ≤ 2,600 | Overlay empty. |

**On time regardless.** The rung change (`send({type:"hint"})`) happens on the tap. Only the *render* of the cue waits for peak, and skip or cancel shows it at once.

**Skip and cancel.** Repeat taps are ignored during the run. This differs from the v7 prototype, which queued them. Here a queued tap would climb straight to rung 3 and skip the cue.

### 3.4 Next: spellbook (cap 1,800 ms on the first Next, 600 ms after; see §9 Q4)

**First Next in an explainer:**

| ms | What the child sees |
|---|---|
| 0–200 | A closed blue book (moon and star on the cover) fades in beside the step text. |
| 150–350 | The wand taps the cover. |
| **250 peak** | **Real change:** the step text and "Step n of m" update. |
| 200–580 | The cover opens in 3D around its spine. |
| 600–800 | A page flips. |
| 700–1,200 | A soft light lifts off the page and settles on the new step text. |
| 1,300–1,600 | The book closes and fades. The wand goes home. |
| ≤ 1,800 | Overlay empty. |

**Later Next taps:** a single page turn, with the peak at 150 ms and the end at ≤ 600 ms.

**On time regardless.** `panelReducer` (`story/ExplainerPanel.tsx`) stays the only source of the step index. The dispatch happens at peak (≤ 250 ms), or at once on skip.

**Skip and cancel.** A Next tap during a run skips it: the pending step applies, then the new step applies at once with no new effect. Five fast taps advance exactly five steps. Back and "Try it" never animate.

## 4. Module design (`apps/web/src/fx/`, proposed)

Sketched types first. Bodies are not written.

```ts
// fx/seed.ts (pure, plus one storage read at the boundary)
type FxSeed = number & { readonly __brand: "FxSeed" };      // uint32
export function parseSeed(raw: string | null): FxSeed | null;
export function newSeed(rand: () => number): FxSeed;
export function variantFor(seed: FxSeed, button: FxButton): FxVariant;

type FxButton = "check" | "show" | "next";
type FxVariant = { spell: SpellWord; arc: "high" | "low"; accent: AccentToken };

// fx/spells.ts (pure)
export const SPELLS: readonly SpellWord[];                     // the 12 words in §7
type SpellWord = string & { readonly __brand: "SpellWord" };

// fx/run.ts (pure state machine from §3.1)
type FxPhase =
  | { tag: "idle" }
  | { tag: "casting"; run: number }
  | { tag: "result"; run: number }
  | { tag: "cleanup"; run: number }
  | { tag: "skipped"; run: number };
type FxEvent =
  | { type: "tap"; motion: MotionMode }
  | { type: "peak" } | { type: "settled" } | { type: "done" } | { type: "cancel" };
type FxCommand = "start" | "apply" | "still" | "clear" | "fadeOut" | "advance";
export function fxStep(button: FxButton, s: FxPhase, e: FxEvent): [FxPhase, FxCommand[]];

// fx/motion.ts (boundary: reads media query + setting)
type MotionMode = "full" | "calm" | "reduced";
export function motionMode(calmSetting: boolean, mq: (q: string) => boolean): MotionMode;

// fx/art.ts (pure: SVG strings, Hero palette only)
export const art: {
  wand(accent: AccentToken): string; tipGlow(): string; burst(word: SpellWord): string;
  runeRing(r: number): string; book: { cover(): string; inside(): string; page(): string };
  spark(): string; still(button: FxButton): string;
};

// fx/layer.ts (DOM: the only module that creates or removes nodes)
interface FxLayer {
  play(effect: Effect, anchors: Anchors, hooks: { onPeak(): void }): Promise<void>; // rejects on cancel
  cancelAll(): void;
  nodeCount(): number;                                         // hard cap 28
}
export function createFxLayer(root: HTMLElement): FxLayer;

// fx/effects.ts (DOM via FxLayer only)
type Anchors = { from: DOMRect; to: DOMRect };
type Effect = (layer: FxLayer, a: Anchors, v: FxVariant) => Timeline;
export const EFFECTS: Record<FxButton, Effect>;               // check, show -> flick; next -> spellbook

// fx/useFx.ts (React adapter: owns one FxPhase per button, runs commands)
export function useFx(button: FxButton): { tap(apply: () => void, anchor: HTMLElement): void };
```

**Data flow.**
1. A tap reaches the component handler. The core `step()` decides the outcome (existing code).
2. `useFx.tap(apply, anchor)` calls `fxStep`.
3. The returned commands run: `start` calls `EFFECTS[button]`, `apply` calls the caller's `apply`, and `clear` calls `layer.cancelAll()`.
4. The layer's peak and settle timers feed `peak`, `settled` and `done` back into `fxStep`.

**Pure vs DOM.**
- **Pure:** `seed`, `spells`, `run`, `art` and the `motion` decision. They are tested in Vitest's node environment, which matches `vitest.config.ts`.
- **DOM:** `layer`, `effects` and `useFx`.
- **Boundaries:** `motionMode` reads `matchMedia`. `parseSeed` reads IndexedDB through the existing `StorageBackend` (`shell/storage.ts`). Nothing inside re-validates.

**Plug-in points.**
- **`main.tsx`.**
  - Mount one `<FxLayer>` in `.stage`.
  - In `send()`: right answer → `useFx("check").tap(...)`, and rung 1→2 → `useFx("show").tap(...)`.
  - Add the Calm checkbox in the Parents section.
  - Set effects off when `__render` drives the page, so `render/` hashes stay stable.
- **`interact/CountWidget.tsx` and `interact/DragTray.tsx`.** `onAnswer(a, anchor?)` gains an optional anchor element.
- **`story/ExplainerPanel.tsx`.** Next calls `useFx("next").tap(() => dispatch({type:"next"}), el)`.
- **`index.css` and `public/sw.js`.** Add a bundled Nunito `@font-face` and precache it.
- **Calm setting storage.** IndexedDB key `kids-math-calm`, next to `kids-math-sound`.

## 5. Visual spec

| Token | Value | Use |
|---|---|---|
| Blue | `#4d96ff` | Ring line, burst text accent |
| Sky | `#bde0fe` | Stage (existing `.stage`) |
| Amber | `#ffd166` | Tip glow, sparks, default accent |
| Ink | `#213547` | Outlines, text |
| Cream | `#fff8ec` | Page background, ring disc, book pages |
| Accent set (seeded) | amber `#ffd166`, violet `#A78BFA`, sky `#7FC4FF`, mint `#7ED9A3` | Wand bands, spark mix |

- **Easing.**
  - `cubic-bezier(0.23,1,0.32,1)` for pops, fades and arrivals.
  - `cubic-bezier(0.77,0,0.175,1)` only for on-screen travel (wand home, book close). See §10.
  - Never ease-in, never `transition: all`, never `scale(0)`. The smallest start scale is 0.6.
- **Properties.** Transform and opacity only. No animated filters, shadows or layout.
- **Budget.**
  - ≤ 28 overlay nodes at any moment.
  - Stagger ≥ 20 ms between nodes.
  - At most one `perspective` node (the book).
  - `will-change` only while running.
- **Depth.** Shadows are drawn as offset SVG shapes. No CSS `filter: drop-shadow`, which costs a filtered layer per moving element on iPad Safari. Glows are radial gradients, not blur. Any blur is ≤ 8 px and static.
- **Durations.** Check ≤ 2,000 ms, Show me ≤ 2,600 ms, Next ≤ 1,800 ms (≤ 600 ms after the first).
- **Calm mode and `prefers-reduced-motion`.**
  - One still image fades in for 200 ms beside the target: the ring with a tick, the ring, or the closed book.
  - The real change applies at once.
  - The still fades out by 1,300 ms.
  - No wand, no travel, no burst.
- **Text.** The burst uses bundled Nunito 900, at least 28 px, ink outline on white.
- **Accessibility.** The overlay is `aria-hidden="true"` and `pointer-events: none`. Spoken and read text comes only from the real UI (the existing `aria-live` bubble and step text).

## 6. Per-device seed

- **Source.** A random 32-bit seed is made on first launch and stored in IndexedDB as `kids-math-fx-seed`. The app has no profiles or kid names, so the v7 name-based seed does not carry over.
- **What it varies, per button:** the spell word (one of 12), the arc height (high or low) and the accent (one of 4).
  - Same device, same button: always the same.
  - Different devices: likely different.
- **Privacy.** The seed is not in the event log and not in exports. Nothing about it leaves the device, which matches decision 4 in [DECISIONS-LOG.md](DECISIONS-LOG.md).

## 7. Content and trademark rules

- **Art.**
  - Original SVG drawn in code: wand (wood, amber bands, star tip), rune ring (invented glyphs: dot-in-circle, crescent, sparkle, chevron, spiral, twin dots), and a book (blue cover, moon and star).
  - No AI art and no traced art.
  - Licence: **CC0 1.0 candidate**, matching the repo's art licence.
- **Spell words (12, invented).** Plinko!, Sparkalo!, Zimzoom!, Twinkabloo!, Fizzleberry!, Glimmerpop!, Bobbledoo!, Wizzlewop!, Starbumble!, Moonmallow!, Zappadoodle!, Shimmeroo!
- **New words.** Each one gets a web search before it is added, to confirm it is not a known franchise spell or brand.
- **Banned words.** The list lives in `fx/banned-words.ts`, not in this doc, so this doc stays free of the words. It covers:
  - the names, places, houses, sports and spell words of well-known wizard-school franchises;
  - major toy, comic and film studio brands.

  A unit test fails if any spell word, art string or UI string under `fx/` matches it.
- **Audit checklist** (every effects PR):
  - no franchise names or spell words;
  - no zig-zag lightning bolt (the spark path is a smooth arc);
  - no round glasses paired with a scar;
  - no crest, house colours, scarf stripes or a red-and-gold pairing;
  - no triangle-circle-line symbol;
  - no winged golden ball;
  - no look-alike logo or display font.
- **Licences.**
  - Code: MIT.
  - Font: Nunito under SIL OFL 1.1, shipped with `OFL.txt`.
  - No new dependencies. Existing runtime dependencies are react and react-dom (MIT) and idb (ISC). No GSAP and no non-MIT-compatible library (PLAN.md decision 1).

## 8. Verification matrix

| Rule | Check | Kind |
|---|---|---|
| `apply` runs exactly once per run, for every event order | Property test over random event sequences on `fxStep` | Unit |
| Repeat Check / Show me taps ignored; Next skips ahead | `fxStep` table test; Playwright: 5 fast taps → 1 run (Check) and +5 steps (Next) | Unit + E2E |
| No wand on wrong answers | Playwright: wrong answer → `.fx` has 0 nodes, reaction runs | E2E |
| Answer not shown before peak | Playwright samples the sentence every frame: empty before the `peak` mark, filled after | E2E |
| Check ≤ 2.0 s, Show me ≤ 2.6 s, Next ≤ 1.8 s / 0.6 s | `performance.mark` start and end per run; asserted in Playwright (webkit-ipad, chromium) | E2E |
| Step text visible ≤ 250 ms after Next | Playwright: `explainer-step` text changes within 300 ms | E2E |
| ≤ 28 nodes, stagger ≥ 20 ms | `layer.nodeCount()` sampled each rAF; animation start-time diff | E2E |
| Transform/opacity only; no filter or `drop-shadow` | Scan `getAnimations()` keyframe properties; grep `fx/` for `filter`, `ease-in`, `transition: all`, `scale(0)` | E2E + lint |
| Cleanup on unmount, story change, tab hidden | Playwright: trigger each mid-run → 0 nodes, real change applied | E2E |
| Calm / reduced = one fading still ≤ 1.3 s | `emulateMedia({reducedMotion:"reduce"})` and the Calm toggle: max 1 node; Calm persists after reload | E2E |
| Same seed gives same variant; all 12 words reachable | Unit over 1,000 seeds | Unit |
| Seed never leaves the device | Export file contains no `fx-seed`; offline request log is first-party only (existing U11 check) | E2E |
| No banned words | `banned-words` test over `fx/` | Unit |
| Smooth on iPad | `verify-fps.mjs --fx`: ≥ 55 fps and ≤ 6 frames over 20 ms at 4x throttle while effects run (Chromium; WebKit reported) | Perf gate |
| Real-device feel, readability, no overlap with input or counter, battery and heat after 10 runs, system Reduce Motion | Manual checklist on a real iPad, portrait and landscape | Manual |
| Render hashes unchanged | Existing `render/` double-render hash with effects off | E2E |

## 9. Decisions

**Decided (Anantha, Nov 1, 2026).**
- Wand flick on Check and Show me, spellbook on Next.
- Original art drawn in code; no trademarks.

**Open: recommended defaults, awaiting Anantha.**

| # | Question | Recommended default |
|---|---|---|
| Q1 | Theme | **Hero only.** Park Glam. |
| Q2 | Wrong answers | **No wand.** The story consequence carries it alone. |
| Q3 | Show me label | **Rename "Hint" to "Show me" on rung 2 only.** Rungs 1 and 3 stay "Hint". |
| Q4 | Spellbook frequency | **Full spellbook on the first Next per explainer**, then a 0.6 s page turn. |
| Q5 | Calm mode | **Off by default, under Parents next to Sound.** |

## 10. Differences from existing docs

| Doc says | This design | Why |
|---|---|---|
| DESIGN-PLAN: Check is on a 0–9 pad | Attaches to the three answer controls that exist | The pad is not built. When it lands, the effect moves to its Check button with no other change. |
| DESIGN-PLAN Calm mode: "No celebration burst"; reduced motion: "Celebration off" | One still (ring with tick) fades for ≤ 1.3 s | It marks the state change without motion. If Anantha wants nothing at all, drop the still; the state machine is unchanged (`still` becomes a no-op). |
| DESIGN-PLAN easing: only `cubic-bezier(0.23,1,0.32,1)` | Adds `cubic-bezier(0.77,0,0.175,1)` for on-screen travel only | Ease-out on travel looks like a jolt. Still no ease-in. Needs Anantha's OK, or travel falls back to ease-out. |
| DESIGN-PLAN proposed check: "at most one animated node within 120 px of input" | Up to 28 nodes near the button during a run | The rule targets the waiting state. Effects run only while the button is busy and end before input is awaited. The lint should exempt the `.fx` overlay during a run. |
| WORKED-EXAMPLE-EXPLAINER: "one visual change per step", calm, mascots stay out | The spellbook adds a book, a wand and light on Next | The wand and book are not mascots and carry no text. Q4 limits the full effect to the first step, and the step text never waits past 250 ms. |
| DESIGN-PLAN: Show me is part of rung 2 (zoom, slow replay, ring on the pile) | Ring around the ten-frame cue | Matches "ring on the pile". Only the button label is new (Q3). |
| README and DESIGN-PLAN: "Nothing is built yet" | — | Stale. `apps/web` runs today. This feature is still unbuilt. |

## 11. Links

- [../PLAN.md](../PLAN.md): build plan, tutor rules, U6 WAAPI player, U11 shell
- [DESIGN-PLAN.md](DESIGN-PLAN.md): child flow, Calm mode, motion rules
- [WORKED-EXAMPLE-EXPLAINER.md](WORKED-EXAMPLE-EXPLAINER.md): rung 3 explainer
- [DECISIONS-LOG.md](DECISIONS-LOG.md): licence and privacy decisions

*How this doc was made:* written with the pstack skills poteto-mode, architect (types and module sketch before prose; one author, no multi-model arena run), principle-model-the-domain (one state machine with explicit transitions), principle-minimize-reader-load, principle-boundary-discipline, principle-prove-it-works (§8) and ce-noslop.
