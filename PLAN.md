# Socratic math story plan

Anantha wants children to work out the answer in the math story themselves. In v3, Pip tells them. Pip should ask, the child should act, and the story should react. The first goal is a real web application. A native SwiftUI iPad app comes after that (not a wrapper). The same story data also produces teacher preview videos, and the curriculum grows one NCDPI section at a time. This plan covers the build only. Nothing gets built until Anantha says go.

Files: this plan and [STACK.md](docs/STACK.md) live in `/workspace/socratic-math-plan/` and are mirrored to `/home/box/socratic-math/`. Pre-decision copies: `PLAN.pre-decisions.md`, `STACK.pre-decisions.md`. Product vision: [VISION.md](docs/VISION.md). Decisions log (kept by the Scribe): [DECISIONS-LOG.md](docs/DECISIONS-LOG.md).

## Recorded decisions (Anantha, Oct 28, 2026)

Every unit below follows these. None is open.

| # | Decision | What it means for the build |
|---|---|---|
| 1 | **Code: MIT** | `LICENSE` (MIT) at the repo root. Shipped dependencies must be MIT-compatible ([STACK.md](docs/STACK.md) §10). GSAP is not MIT, so WAAPI is the default (U1, U6) |
| 2 | **Content: CC BY-SA 4.0** | Lessons, stories, Pip's scripts and content packs. Third-party CC BY content can be adapted in; NC-licensed sources cannot be included (validator check, U4) |
| 3 | **Mascot art: CC0 1.0, names generic and trademark-free** | `assets/mascots/LICENSE` is CC0. No mark is registered or claimed. Forks may reuse the art without attribution (accepted). `FORKS.md` asks forks to use their own app name |
| 4 | **Backend deferred until after the hackathon** | For the hackathon the app is on-device only: no server, no accounts, no personal data, nothing leaves the device (COPPA's spirit, not a legal-compliance claim). Progress is an on-device event log, options in [`PROGRESS-STORAGE.md`](docs/PROGRESS-STORAGE.md). If sync is needed later, study Kolibri's offline-first design with optional school-server sync before designing a custom backend |
| 5 | **Governance: BDFL (Anantha) until M5**, then revisit | Anantha approves lessons and lands every PR |
| 6 | **Legal home: deferred** | Hackathon entry with intent to continue. No fiscal sponsor or entity now; revisit around M5 |
| 7 | **Standards: NC Standard Course of Study (NCDPI), grade 2, math first** | Built one section at a time in NCDPI's grade 2 order, starting with NC.2.OA.1. Store standard IDs plus our own paraphrase, never NCDPI text |
| 8 | **Read-aloud in M1** | On-device voices only (Web Speech `localService` voices, AVSpeechSynthesizer). Unit U12a |
| 9 | **Subject order: math, science, English language arts** | Math is M1 to M5. Science, then ELA, come after M5 (roadmap below) |
| 10 | **English only** | Spanish deferred, no timeline, no reviewer. Strings stay in a locale table only because that was already planned |

**Process (Anantha, no exceptions).** The build uses pstack, the process skills and playbooks the engineering team follows. All communication about this project goes through the Delivery Lead bot, with no direct side channels. The Scribe notes every decision and discussion, including voice calls, in `docs/DECISIONS-LOG.md`. This is a process rule, not a stack change. Detail in **Process** below.

**Status.** Nothing is built until Anantha says go. `DL-MESSAGE.md` (next to this file) is a draft to Delivery Lead awaiting Anantha's approval; it has not been sent.

## Tutor rules (hard)

These hold in every lesson, on both platforms. The validator (U4) and the reducer property tests (U5) enforce them, so a lesson that breaks one cannot ship.

- **The tutor never states the answer.** It only asks the next Socratic question. No `say` effect, hint, reaction or explain line contains the answer before the child gives it. Hints climb question → visual cue → worked example explainer ([WORKED-EXAMPLE-EXPLAINER.md](docs/WORKED-EXAMPLE-EXPLAINER.md)): step-by-step derivation for the **same** question, no story cast. After three hints the explainer finishes and the original question is asked again; the tutor still does not say the answer in the main story flow before the child gives it.
- **Short prompts, one idea per turn.** One question per bubble, one action asked for at a time. Bubbles stay within the validator's length limit (a 46-character bubble fails in U4). No compound questions ("and then…") in one turn.
- **The mascot's face carries the emotion.** Feelings are expression states, not extra text. Proposed mapping (the `choreograph` output, a `BeatScript` track on the mascot rig):

  | Event | Expression |
  |---|---|
  | `asking` | curious (head tilt, eyes on the objects) |
  | waiting / no input 8 s | patient (soft blink, small nod toward the hint button) |
  | `reacting` (misconception plays out) | puzzled, never sad or cross |
  | hint shown | thinking, pointing at the cue |
  | right answer | delighted (small bounce) |
  | `explaining` | proud, listening |
  | lesson finished | celebrate (short, under 2 s) |

  A wrong answer is never marked wrong: no red X, no "wrong", no "try again" (never-wrong lint, U8).
- **Light gamification only.**
  - Streaks: one gentle streak across subjects, with rest days built in and no loss shaming (no "you lost your streak", no countdowns).
  - A small mascot celebration at the end of a lesson.
  - One badge per NCDPI section when that section is mastered.
  - Chests tied to the lesson just finished (story items, mascot outfits).
  - Never: leaderboards, purchasable rewards, currencies, ads, or any score that drops after a mistake.
  - Enforced by pure reward functions with no-dark-patterns property tests (U27).

## Mastery and review

- **Source.** Mastery and review are computed from the append-only `LocalEvent` log on the device (U11a, U21). Nothing about mastery is stored separately; it is always derived.
- **Mastery threshold (proposal, to tune in the Stage A and Stage B pilots).** A skill (one NCDPI standard, or a sub-skill within it) is mastered after **three clean answers in a row**. Clean means first try and no hint. Answers count across different problem templates, so three repeats of one template do not count as mastery (proposal: at least two distinct templates in the three).
- **Mastery never drops within a session.** A mistake after mastery schedules extra review; it does not take the mastery or a badge away. Property test (U26).
- **Spaced review (proposal).** After mastery, review problems come back at **1, 3, 7 and 21 days**. A clean review moves the skill to the next interval; a missed review repeats the current interval (it does not reset to day 1). Review problems use fresh instances, not the ones the child already solved.
- **Code.** Pure functions `mastery(log)` and `review(log, now)` in the shared TypeScript core, run in JavaScriptCore on iPad, with conformance vectors and property tests (replayed random logs; mastery monotonic within a session; review dates deterministic for a given log and `now`).

## Content depth

Synthesis Tutor's most common complaint is running out of content: "a strong student finishes in weeks" ([COMPETITOR-SYNTHESIS.md](docs/COMPETITOR-SYNTHESIS.md), reviews row and takeaway 4). A child must not be able to exhaust our content in about a week.

Per NCDPI standard, content varies along four axes:
- **Problem templates with parameter ranges.** Each template is a problem shape (for NC.2.OA.1: add-to, take-from, put-together, compare; result, change and start unknown; one and two steps) with numbers drawn by code within the standard's limits. The solver and validator check every instance.
- **Story contexts.** The same shape in different stories (stickers, balloons, books, shells, bus seats…), each a CC BY-SA story with its own staging.
- **Number-size ladders.** Within 20, then within 50, then within 100 (or the standard's own bounds), with and without regrouping.
- **Mixed review.** Earlier standards mixed in, driven by the review schedule above.

**Target per standard (proposal, to revisit after the pilot):**
- at least **6 distinct problem templates**,
- at least **4 story contexts**,
- at least **3 number-size ladder steps**,
- at least **150 distinct valid instances** reachable from the templates,
- enough for **at least 3 weeks of daily 15-minute sessions** per standard without repeating an instance (estimate, labelled as one).

**Content-coverage check in CI.** `npm run coverage:content` reads the approved lessons and templates, counts templates, contexts, ladder steps and distinct instances per NCDPI ID, and fails the build for any standard listed as shipped that is below target (U25). The report goes to `evidence/<unit>/coverage.md`.

## Progress storage

Full research and tradeoffs: [PROGRESS-STORAGE.md](docs/PROGRESS-STORAGE.md).

- **Web: IndexedDB via `idb`.** One append-only event log keyed by profile (U11a). Call `navigator.storage.persist()` and show the result. Precache the app with the service worker so it works offline. localStorage is not used (about 5 MiB cap).
- **Safari note.** Safari can delete a site's data after 7 days of Safari use with no tap on the site, unless the app is **added to the Home Screen**. The iPad build shows an "Add to Home Screen" prompt and a warning when storage is not persistent.
- **iPad native: SwiftData** (U21), same event format, progress derived not stored.
- **Kid profiles: nickname and avatar only**, no real names, birthdays, photos or free text. Profiles are created and managed behind the parent gate (a grown-up task, not a secret).
- **Export and import.** Versioned NDJSON event log per profile with a SHA-256 checksum (integrity, not authenticity). Same file on web and iPad. Malformed or mismatched files are rejected at the boundary with issue codes.
- **Teacher and parent tools, behind the gate:** export, import, reset one profile, wipe all (with an "export first?" offer), and a visible "last backup" date.
- **Nothing leaves the device** unless an adult exports a file. No server, sync or analytics (decision 4).

## Process

- **pstack is the process layer.** Every unit is briefed in the pstack template, run under `/poteto-mode` and the pstack playbooks (Orchestrate, Prototype, Feature, `figure-it-out`), and verified with evidence against its ACCEPTANCE criteria (unit, live and perf checks, saved under `evidence/<unit>/`). pstack is process, not a tech-stack choice.
- **All project communication goes through Delivery Lead.** Workers, reviewers and the Scribe report to Delivery Lead; Delivery Lead batches questions to Anantha. No direct side channels.
- **The Scribe logs everything** (decisions, discussion, voice calls, open items) in `docs/DECISIONS-LOG.md`, so it is available for future reference.
- **Gates.** Nothing is built until Anantha says go. Anantha (BDFL until M5) approves lessons and lands every PR. Outbound drafts such as `DL-MESSAGE.md` wait for his approval.

The rule the program enforces is simple. Every number on screen, in Pip's lines, and in a video comes from code, not from a model or a hand-typed string. A wrong answer is never marked wrong. The story shows what that answer would mean.

Built with pstack. `poteto-mode` set the bar. `architect` shaped the types and the module boundaries. `figure-it-out` shaped the milestone playbook. `create-verification-skill` shaped U0. The principles applied are named at the point where each one changed a decision.

## How to read this

- One work unit (U-number) is one change with its own evidence. Each unit is written in the pstack brief template (GOAL, SCOPE, CONTEXT, ACCEPTANCE, VERIFY, TIMEBOX, FORBIDDEN, REPORT, STANDING).
- Two fields are the same for every unit, so they are written out once here.
  - **STANDING.** `/home/box/eng-team/preferences.md` pasted verbatim. Add the animation rule: Emil Kowalski's `animate` first, then `animation-performance`, then `review-animations` before hand-back.
  - **FORBIDDEN (base).** Editing `/workspace/kids-math-story-v3/`. Local git clones (repo work goes through cloud agents). Merging, deploying, or publishing anything without Anantha's yes. Any LLM call outside the Anthropic/OpenAI gateway. Any SaaS dependency. Any employer data or names. Sending child data off the device. Any server, account or network path in the app. A shipped dependency that is not MIT-compatible. Copying NCDPI standards text or NC-licensed material into content. Project communication outside Delivery Lead.
- Execution runs under pstack's Orchestrate playbook (two platforms, many stacked PRs; see [STACK.md](docs/STACK.md) §7). Delivery Lead coordinates. Workers build and verify. Anantha merges.
- Tests alone are not sufficient verification. A unit is verified only when its unit, live, and perf checks all pass. "Live" means a Playwright run of the real page in WebKit with the iPad descriptor, plus a screenshot or video saved to `evidence/<unit>/`. A unit that changes an interaction also waits for Anantha's review of the screenshots and video.

## 1. Problem and non-goals

**Problem.** v3 is a 41-second film. The child watches and learns nothing they had to work out. We need these four things:
1. **Socratic mode.** Pip asks. The child drags, taps a count, or picks an equation. A wrong answer plays out on screen, and Pip asks a smaller question. A right answer gets "how did you know?" Hints climb a ladder (question, visual cue, worked example explainer on the same question) and never start with the answer.
2. **Data in, story out.** A problem plus a learning goal becomes validated `StoryData`. Code checks the math. A model may write the questions and reactions, but code checks every number before anything renders.
3. **Web app first, then native SwiftUI iPad.** Touch, pointer events, landscape and portrait, audio unlock, safe areas, offline, read-aloud.
4. **A curriculum, one NCDPI section at a time.** NC grade 2 math sections go in, approved CC BY-SA lessons come out. Progress, rewards and the parent view are computed from the on-device event log. Child data never leaves the device unless an adult exports a file.

**Non-goals (M1 to M5, the hackathon build).**
- No runtime LLM on the child's device. All generation happens offline and gets reviewed. This keeps COPPA scope small and lessons stable.
- No voice input. "How did you know?" uses tap choices. Recording a child's voice brings in COPPA consent and storage problems.
- No accounts, logins, server or sync. The parent view (M4) runs on the device behind an adult gate.
- M1 covers NC.2.OA.1 only (add and subtract word problems within 100). Later NC grade 2 sections come in NCDPI order in M4. No science or ELA before M5.
- **Pip** (barn owl) narrator plus **Momo** and **Kiwi** as story cast for M1 (real species, `role` field; art CC0 once human-redrawn). Six more story animals at **M4** (see [DESIGN-PLAN.md](docs/DESIGN-PLAN.md)). Pip never acts as a countable object in the problem.
- English only.
- No App Store release before M5. TestFlight first, and it waits for Anantha's Apple Developer account.

## 2. Domain model

**Model the Domain** changed this design. v3 spreads the story across `STORIES[n]` plus `op === "-"` and `how === "give"` branches inside `beatStep`. Here, a discriminated union and a registry replace those branches, and a reducer replaces the beat booleans (`SKIP`, `beat`, `shown`). **Type System Discipline** brands every number a child sees, so a raw `number` cannot reach the screen without passing through the solver.

```ts
// schema/types.ts (TypeScript strict; the parse lives in schema/parse.ts with zod, MIT)
type Brand<T, B> = T & { readonly __brand: B };
type Count = Brand<number, "Count">;          // integer 0..CAPACITY; made only by math/solve
type StepIndex = Brand<number, "StepIndex">;
type MascotId = Brand<string, "MascotId">;
type LessonId = Brand<string, "LessonId">;
type StandardCode = Brand<string, "StandardCode">; // NCDPI ID, e.g. "NC.2.OA.1" (plus our own paraphrase elsewhere)
type LineTemplate = Brand<string, "LineTemplate">; // placeholders only, no digits (validator)

type MascotRole = "narrator" | "story";
type MascotSpecies = "barn-owl" | "lop-eared-rabbit" | "kiwi-bird" | "toucan" | "fox" | "elephant" | "turtle" | "hedgehog" | "macaw";
type Mascot = { id: MascotId; name: string; species: MascotSpecies; role: MascotRole;
  pronouns: { they: string; them: string; their: string } | null; colors: Palette };
// M1 cast: pip (narrator), momo, kiwi (story). Remaining story species ship in M4 (U24).

// A story step. One variant per verb, never op + how strings.
type Step =
  | { kind: "give"; n: number; to: MascotId }          // take-away, a friend receives
  | { kind: "pop"; n: number }                         // take-away, items vanish
  | { kind: "find"; n: number; place: "bed" | "gift" } // add, items appear
  | { kind: "receive"; n: number; from: MascotId };    // add, a friend gives

type Problem = { id: string; standard: StandardCode; goal: LearningGoal;
  hero: MascotId; friend: MascotId | null; item: ItemKind; start: number; steps: readonly Step[] };
type LearningGoal = "take-away-within-100" | "add-to-within-100" | "two-step-add-sub";

// Derived by code, never authored.
type Solved = { problem: Problem; totals: readonly Count[] /* length steps+1 */; answer: Count };

// What the child is asked to do. One variant per input widget.
type Interaction =
  | { kind: "predict"; options: readonly ["more", "fewer", "same"] }
  | { kind: "count"; pad: "tap-items" | "number-pad"; range: [Count, Count] }
  | { kind: "drag"; target: Count; from: "book"; to: "tray" | "book" }
  | { kind: "equation"; options: readonly EquationChoice[] };   // 3 choices, one correct
type EquationChoice = { a: Count; op: "+" | "-"; b: Count; result: Count };

type Answer =
  | { kind: "predict"; value: "more" | "fewer" | "same" }
  | { kind: "count"; value: number }      // raw; a child can type anything
  | { kind: "drag"; moved: number }
  | { kind: "equation"; index: number };

type Question = { id: string; step: StepIndex | "final"; ask: LineTemplate;
  interaction: Interaction; hints: HintLadder; explain: ExplainPrompt };

// A hint ladder is exactly three rungs, in this order. A tuple makes "answer first" unrepresentable.
type HintLadder = readonly [
  { rung: "question"; say: LineTemplate },                       // a smaller question
  { rung: "visual"; cue: VisualCue; say: LineTemplate },          // highlight, count-along, ten-frame
  { rung: "worked"; explainer: WorkedExplainer } ]; // same question; see docs/WORKED-EXAMPLE-EXPLAINER.md
type VisualCue = "highlight-leaving" | "count-along" | "ten-frame" | "show-start-pile";
type ExplainerType = "take-away" | "make-10" | "compare-more";
type WorkedExplainer = { type: ExplainerType; params: Record<string, number>; steps: readonly { id: string; text: string }[] };

type ExplainPrompt = { ask: LineTemplate; choices: readonly ExplainChoice[] }; // "How did you know?"
type ExplainChoice = { label: LineTemplate; strategy: "counted-back" | "counted-on" | "tens-and-ones" | "known-fact" | "guessed" };

// Misconceptions are a code registry. Content may word them, never invent new kinds.
type MisconceptionId = "wrong-operation" | "echoed-a-given" | "off-by-one"
  | "smaller-from-larger" | "direction-flip" | "unknown";
type Misconception = { id: MisconceptionId; detect: (s: Solved, q: Question, a: Answer) => boolean };

// What the story does about an answer. Never a red X, never "wrong".
type Reaction =
  | { kind: "play-out"; shows: number; check: "conservation" | "direction" } // stage the child's number, let the mismatch show
  | { kind: "count-together"; from: Count; to: Count }                     // slow count with highlights
  | { kind: "celebrate"; then: "explain" };
type ReactionScript = { misconception: MisconceptionId; reaction: Reaction;
  pip: LineTemplate; smaller: Question };  // "smaller" is the follow-up question

type StoryData = { version: 1; solved: Solved; cast: Record<MascotId, Mascot>;
  questions: readonly Question[]; reactions: readonly ReactionScript[];
  narration: NarrationScript; audio: AudioCueSheet; status: ReviewStatus };
type ReviewStatus = { state: "draft" | "validated" | "approved"; by?: string; at?: string };

type Lesson = { id: LessonId; title: string; standard: StandardCode;
  stories: readonly StoryData[] /* 5 */; status: ReviewStatus };

// Per-step Socratic flow. A reducer, not booleans.
type StepPhase =
  | { tag: "telling" }                                   // story beat plays (v3 motion)
  | { tag: "asking"; q: Question; rung: 0 | 1 | 2 | 3 }  // rung = hints shown so far
  | { tag: "reacting"; r: ReactionScript }
  | { tag: "explaining"; q: Question }
  | { tag: "done" };
type Event = { type: "beat-ended" } | { type: "answered"; a: Answer }
  | { type: "hint" } | { type: "reaction-ended" } | { type: "explained"; c: ExplainChoice };
type Effect = { type: "play"; beat: BeatId } | { type: "react"; r: Reaction }
  | { type: "say"; line: string } | { type: "cue"; sound: SoundId } | { type: "record"; e: LocalEvent };
declare function step(state: StepPhase, ev: Event, s: Solved): [StepPhase, Effect[]]; // pure
```

**Example `StoryData` for the sticker problem (trimmed).** Every number the child sees is either `start`, a step's `n`, or a solver output.

```json
{
  "version": 1,
  "solved": {
    "problem": {
      "id": "stickers-24-9-5", "standard": "NC.2.OA.1", "goal": "two-step-add-sub",
      "hero": "momo", "friend": "kiwi", "item": "sticker", "start": 24,
      "steps": [ { "kind": "give", "n": 9, "to": "kiwi" },
                 { "kind": "find", "n": 5, "place": "bed" } ]
    },
    "totals": [24, 15, 20], "answer": 20
  },
  "questions": [
    { "id": "q0-predict", "step": 0, "ask": "{hero} gives {n} away. More or fewer now?",
      "interaction": { "kind": "predict", "options": ["more", "fewer", "same"] },
      "hints": [
        { "rung": "question", "say": "When you give some away, do you keep them?" },
        { "rung": "visual", "cue": "highlight-leaving", "say": "Watch the ones that fly." },
        { "rung": "worked", "explainer": { "type": "take-away", "params": { "minuend": 7, "subtrahend": 2 },
          "steps": [ { "id": "summary", "text": "7 take away 2 leaves 5." } ] } } ],
      "explain": { "ask": "How did you know?", "choices": [
        { "label": "Giving away makes fewer", "strategy": "known-fact" },
        { "label": "I guessed", "strategy": "guessed" } ] } },
    { "id": "q0-count", "step": 0, "ask": "How many does {hero} have now?",
      "interaction": { "kind": "count", "pad": "number-pad", "range": [0, 40] },
      "hints": [
        { "rung": "question", "say": "How many were there at the start?" },
        { "rung": "visual", "cue": "ten-frame", "say": "Let's make tens. Take {n} away." },
        { "rung": "worked", "explainer": { "type": "take-away", "params": { "minuend": 13, "subtrahend": 4 },
          "steps": [ { "id": "summary", "text": "13 take away 4 leaves 9." } ] } } ],
      "explain": { "ask": "How did you know?", "choices": [
        { "label": "I counted back", "strategy": "counted-back" },
        { "label": "I used tens", "strategy": "tens-and-ones" },
        { "label": "I guessed", "strategy": "guessed" } ] } }
  ],
  "reactions": [
    { "misconception": "wrong-operation",
      "reaction": { "kind": "play-out", "shows": 33, "check": "conservation" },
      "pip": "If {hero} had {shown}, where did {friend}'s {n} come from?",
      "smaller": { "id": "q0-predict-retry", "step": 0, "ask": "Did {hero} get more, or give some away?" } },
    { "misconception": "echoed-a-given",
      "reaction": { "kind": "play-out", "shows": 9, "check": "conservation" },
      "pip": "{shown} is how many flew to {friend}. How many stayed?",
      "smaller": { "id": "q0-count-book", "step": 0, "ask": "Count the ones still in the book." } },
    { "misconception": "smaller-from-larger",
      "reaction": { "kind": "play-out", "shows": 25, "check": "conservation" },
      "pip": "{shown} plus {friend}'s {n} makes {sum}. Was it {start}?",
      "smaller": { "id": "q0-tens", "step": 0, "ask": "Can we take {n} from the 4 ones?" } }
  ],
  "status": { "state": "validated" }
}
```

**Scope note.** This sticker example (24 − 9 + 5 = 20) stays as the demo. Its sums fit grade 2 fluency within 100 (NC.2.NBT.5), but NC.2.OA.1 limits two-step word problems to single digits, so lesson 1 is re-picked (U12). NC.2.OA.1 also asks for start-unknown and compare problems, so U4 extends `Problem` with an unknown position (`start | change | result`) and a `compare` shape (`bigger | smaller | difference`).

Note the `smaller-from-larger` line, "Can we take {n} from the 4 ones?" It contains a literal 4, so the validator rejects it, and that is correct. It must become `{ones}`, a solver-derived placeholder. The example is kept here because U4's negative fixtures use it.

**What "play out" means.** The story stages the child's number as if it were true. With 33, the book fills to 33 while Kiwi's tray still holds 9, and the start pile counter shows 24. 33 + 9 does not equal 24. With 25, the book holds 25 and the tray holds 9, which makes 34 stickers out of 24. One generic `conservation` reaction covers most take-away errors. `direction` covers more and fewer errors. That keeps the authoring load small. Misconceptions pick the Pip line and the smaller question. They do not need custom animation.

## 3. Architecture

Each module owns one body of domain knowledge (**Model the Domain**, not load, validate, render phases). Arrows are imports. Validation lives only at the two boundaries, which are JSON coming in (`schema/parse`) and model output coming in (`gen/llm`). Everything inside trusts the types (**Boundary Discipline**).

```
gen/ (offline, Node)                    apps/web (React) and apps/ios (SwiftUI, core via JSC)
  spec -> llm (gateway boundary)          shell (lessons, progress, PWA, adult gate)
       -> math/solve                        -> socratic (reducer, pure)
       -> lesson/validate  ---------->      -> story (scene, beats, camera)
render/ (offline, Node + Chrome)           -> interact (pointer, drag, count, equation)
  seek-render frames + audio mix -> mp4    -> narrator (Pip lines, fill)
                                           -> audio (WebAudio, unlock, cues)
                                           -> speech (on-device read-aloud)
                                           -> log (LocalEvent append, export/import)
                     shared: schema/ math/ lesson/ motion/ progress/ (pure views over the log)
```

| Module | Owns | Public surface | Pure? |
|---|---|---|---|
| `schema/` | types, `parseStoryData(json): Result<StoryData, Issue[]>` | types, `parse*` | yes |
| `math/` | `solve(p: Problem): Solved`, `misconceptions` registry, `equationChoices` | `solve`, `detect` | yes |
| `lesson/` | `validate(sd): Issue[]` covering numbers, placeholders, reading level, bubble length, gendered words, hint order, worked-explainer steps (non-empty text per step, solver match), "never wrong" lint | `validate`, CLI `npm run validate <file>` | yes |
| `socratic/` | `step(state, event, solved)` reducer and question order | `step`, `initial` | yes |
| `narrator/` | `fill(template, vars)` with vars only from `Solved` (`{n}{before}{after}{start}{result}{ones}{tens}{shown}{sum}{w*}`) | `fill`, `pipLine` | yes |
| `progress/` | `mastery`, `review`, `rewards`, `streak`, `parentReport`: pure functions over `LocalEvent[]` | those functions | yes |
| `speech/` | on-device read-aloud, `localService` voices only, word highlighting | `speak`, `available` | DOM |
| `motion/` | `Timeline` interface for to, fromTo, set, call, cue, seek, duration, play, pause, kill, plus easings `EASE_OUT`, `EASE_IO`, `spring` | `timeline()`, eases | adapter |
| `story/` | scene, mascots, items, camera, beats and reactions as functions `(scene, data) => Timeline` | `mountScene`, `beat`, `react` | DOM |
| `interact/` | pointer-event widgets that emit `Answer`. 64 px minimum targets, drag with snap, `aria-live` | `ask(q): Promise<Answer>` | DOM |
| `audio/` | WebAudio graph, unlock on the Start tap, cue scheduling from `Timeline.cue` | `unlock`, `cue`, `setSound` | DOM |
| `shell/` | lesson list, 5-story run, resume, settings, offline service worker, IndexedDB `LocalEvent` log with export and import (options in [PROGRESS-STORAGE.md](docs/PROGRESS-STORAGE.md)), adult gate | `main.ts` | DOM |
| `render/` | `render(sd, path: ChildPath, out): mp4` that seeks the timeline frame by frame in headless Chrome and muxes audio from the cue sheet | CLI | Node |
| `gen/` | `ProblemSpec -> StoryData` draft, with the LLM writing `LineTemplate`s through the gateway | CLI | Node |

**Subject modules.** `math/` is the first `SubjectModule` (solver, misconception registry, interactions, validator rules). `socratic/`, `narrator/` and `progress/` stay subject-neutral so science (predict, observe, explain) and ELA (multiple choice, ordering) plug in after M5 without core rewrites.

**The motion boundary is the GSAP decision point.** `story/` never imports GSAP. It only sees `motion/Timeline`. Swapping GSAP for WAAPI or Motion is then one adapter file plus a parity run. Today, v3 calls `gsap.*` about 200 times across `part5.js` and `part6.js`.

**The LLM boundary.** `gen/llm.ts` sends a prompt built from structured state (Solved, goal, misconception ids, reading level) to the gateway. Responses must match a JSON schema of `LineTemplate` slots. `lesson/validate` then rejects any of these:
- any digit or number word in a template
- an unknown placeholder
- a bubble over 45 characters after filling
- a Flesch-Kincaid grade above the target
- a gendered word not in the cast's pronouns
- a hint rung out of order
- a worked explainer whose steps omit text alternatives or whose final step disagrees with `solve`
- any of the words "wrong", "incorrect", "no", or "try again"
- a misconception id outside the registry

Rejected output gets one retry with the issues fed back. After that, a human writes the line. The model never produces a number. Numbers only enter through placeholders that `narrator/fill` resolves from `Solved`.

**Deterministic offline video.** v3's preview was a real-time screencast, aligned to audio within 20 to 35 ms. In `render/`, the page exposes `__render.seek(t)` and Playwright screenshots each frame at 30 fps. ffmpeg then encodes the frames, and the existing `mix.py` approach renders audio from the cue sheet. The result is frame-exact and repeatable, so two renders hash the same. A `ChildPath` (for example, answer 33, then hint, then 15) scripts the child's side, so teachers see a Socratic exchange and not only the happy path.

## 4. Work units

Units run in order. A unit starts only when the one before it is verified (**Sequence Work into Verifiable Units**). Subtraction and the verification harness come before features (**Subtract Before You Add**, **Build the Lever**).

### M0. Decisions and harness

**U0. Verification skill and baseline.**
- GOAL: Any agent can launch, drive, and capture evidence from the story page in WebKit iPad emulation and in Chromium.
- SCOPE: New repo `kids-math-socratic` (name pending D5) at `.cursor/skills/verify-kids-math/` with `features/`, `tools/evidence.ts`, and a copy of v3 as `baseline/` (read-only reference).
- CONTEXT: `create-verification-skill` sections (Launch, Doctor, Drive, Evidence, Cleanup, Helpers). v3 `tests/test_shots.py` reads numbers from the DOM through `window.__story`.
- ACCEPTANCE: `npm run verify:doctor` reports the server, build hash, and both browsers. `npm run verify:beats -- --problem 1` writes `evidence/U0/beats.json` with totals `[24,15,20]` and 5 PNGs per device (iPad Pro 11 landscape, iPad Mini portrait, Desktop Chrome).
- STATUS: Device matrix corrected. Only iPad Pro 11 and Desktop Chrome projects exist. Beats.json holds 3 PNGs and notes the shortfall. The skill path reads `.cursor/skills/verify-kids-math/`. The tree uses `.claude/skills/verify-kids-math-web/`.
- VERIFY: Run the skill's own steps once end to end (launch, doctor, drive one feature, cleanup), then `ls evidence/U0` after cleanup. The evidence must survive.
- TIMEBOX: half a day.
- FORBIDDEN: base.
- REPORT: skill path, evidence listing, any WebKit-only differences seen.

**U1. Motion engine bakeoff (Prototype playbook, decides D1).**
- GOAL: Settle the GSAP question with measurements, not opinion (**Exhaust the Design Space**).
- SCOPE: Throwaway `proto/motion-{gsap,waapi,motion}/`. Each one ports the "give" beat (peel, arc flight with trail, landing squash, odometer roll, one camera push, sound cues) behind the draft `Timeline` interface.
- CONTEXT: v3 `part5.js` (`fly`, `peel`, `squash`), `part6.js` (`beatStep`), `part3.js` (`cue`, `spring`). Emil's skills. WAAPI's `Animation.currentTime` is seekable. Motion is MIT.
- ACCEPTANCE: A table per engine with these columns: fps and frames over 20 ms at 4x CPU throttle in Chromium, the same in WebKit, the seek determinism hash (two renders of 90 frames compared), the cue offset max (ms), shipped kB gzipped, adapter lines, licence, and a reduced-motion parity check.
- VERIFY: `npm run proto:bench` prints the table to `evidence/U1/bench.md`. Side-by-side MP4s go in `evidence/U1/`. Run `review-animations` on each.
- STATUS: Retired unbuilt per DECISIONS-LOG entry 17. WAAPI stands as the default. No bench table, MP4s, or per-engine passes exist and none are planned. A future feel regression reopens the question.
- TIMEBOX: 1.5 days.
- FORBIDDEN: base, plus no production code.
- REPORT: table, recommendation, frames of the worst case.

**U2. Socratic input feel (Prototype playbook, decides D2).**
- GOAL: Pick the count input a 7-year-old can use on an iPad (**Experience First**).
- SCOPE: Throwaway `proto/input/` with 3 variants: tap-items-to-count, a big number pad (0 to 9 plus a clear key), and a tens-and-ones dial. Add drag-to-tray and choose-equation once each.
- ACCEPTANCE: Every target is 64 CSS px or larger. A WebKit iPad run passes in both orientations. Drag works with touch and with Apple Pencil hover ignored. A screenshot and a 20-second video exist per variant.
- VERIFY: `npm run verify:input` (Playwright touch emulation, `page.touchscreen`). Anantha reviews the videos (review gate) and ideally tries them on a real iPad through a LAN URL.
- STATUS: Retired unbuilt per DECISIONS-LOG entry 17. No proto variants, videos, or target-size tables exist. The shipped widgets carry U7-era coverage only. The Anantha review gate stays open.
- TIMEBOX: 1 day.
- FORBIDDEN: base.
- REPORT: videos, measured target sizes, Anantha's pick.

**U2b. JavaScriptCore bridge spike (Prototype playbook).**
- GOAL: Decide JSC versus a Swift port of the device functions from measurements ([STACK.md](docs/STACK.md) §1 fallback trigger).
- SCOPE: Throwaway `proto/jsc/`: `core.ios.js` IIFE bundle, a minimal `CoreBridge.swift`, 1,000 `step` + `fill` round trips.
- ACCEPTANCE: p95 latency over 3 runs on an iPad simulator and a real iPad, spread under 20 percent; keep JSC if p95 is under 4 ms, else Swift port with the same vectors. Threshold written before the run.
- VERIFY: `.xcresult` and a bench table in `evidence/U2b/` from the macOS runner. TIMEBOX: 1 day (Mac-gated). FORBIDDEN: base. REPORT: table, decision row.
- STATUS: Retired unbuilt per DECISIONS-LOG entry 17. Never run. Mac-gated.

**U2c. quicktype unions spike.** GOAL: Know whether quicktype emits usable Swift enums for `Step`, `Interaction`, `Answer`, `Effect`. ACCEPTANCE: generated code round-trips the fixture JSON byte-equal, or a decision to hand-write the ~12 union types. VERIFY: `swift test` in the `swift:6.4` Docker image. TIMEBOX: 2 hours. REPORT: generated file, decision.
- STATUS: Retired unbuilt per DECISIONS-LOG entry 17.

### M1. One Socratic lesson of 5 problems, web app, with read-aloud

**U3. Subtract and scaffold.**
- GOAL: A typed, modular port of v3 with identical behaviour and less code.
- SCOPE: Vite (MIT), TypeScript strict, Vitest (MIT), Playwright (Apache-2.0). Port `src/part*.{html,js}` into `story/`, `audio/`, `narrator/`, and `shell/`. Delete `index-problem2.html` (use `?problem=2`), `build.sh` concatenation, and the 2.8 MB base64 `sounds.js` (serve `audio/*.wav` and precache them in the service worker). Keep GSAP behind `motion/` for now.
- ACCEPTANCE: Same DOM numbers per beat as baseline (`[24,15,20]`, `[31,19,27]`). Same 58 cues by name and count. Reduced-motion numbers unchanged. Clean console. Bundle no larger than v3 minus `sounds.js`.
- VERIFY: `npm run verify:beats -- --compare baseline` diffs `beats.json` and `sfx.json` against baseline. `npm run verify:fps -- --throttle 4` gives 59 fps or better and 6 or fewer frames over 20 ms. Do a visual check of 10 beat shots per device.
- STATUS: Two acceptance lines are unrunnable as written. No `sfx.json` baseline exists, so the 58-cue diff cannot run. No baseline copy sits in the repo, so the bundle comparison cannot run. The `[31,19,27]` parity run has no record.
- TIMEBOX: 2 days.
- FORBIDDEN: base, plus no behaviour change.
- REPORT: deleted lines vs added, diff output, fps table.

**U4. Schema, solver, validator, BeatScript contract (the lever).**
- GOAL: A bad lesson cannot get past `npm run validate` (**Build the Lever**, **Type System Discipline**).
- SCOPE: `schema/` (Zod 4, `z.toJSONSchema`), `math/solve.ts`, `math/misconceptions.ts`, `lesson/validate.ts`, CLI, and `fixtures/{good,bad}/*.json`. Also: the `SubjectModule` interface with math as its first module; `Problem` extended with unknown position and compare shapes (NC.2.OA.1); the `BeatScript` type (tracks, keyframes, sampled springs, cues on the 1280×720 stage); a `source` record on every lesson (URL, licence, changes) and NCDPI standard IDs with our own paraphrase.
- ACCEPTANCE:
  - The good fixtures are stickers, balloons, and 3 more from D4, and they validate clean.
  - Each bad fixture fails with its specific `Issue.code`. The bad fixtures cover these cases: totals hand-edited, a digit in a template (the `{ones}` example above), a count above capacity, a negative result, a hint ladder out of order (fails to parse), a worked explainer with an empty step text or wrong derived answer, "try again" in a line, a 46-character bubble, a gendered word, an unknown misconception, an NC- or ND-licensed source, a lesson without an NCDPI ID, and pasted NCDPI standards text.
  - `solve` agrees with an independent brute-force oracle on 10,000 random problems.
- VERIFY: `npm test -- lesson math` and `npm run validate fixtures/bad/*` (expect one non-zero exit per file and the expected code). Tests assert the issue codes callers branch on, not message text (**Test Behavior, Not Implementation**).
- TIMEBOX: 1.5 days.
- FORBIDDEN: base.
- REPORT: fixture matrix (file to expected code to actual code).

**U5. Socratic reducer, `choreograph` and conformance vectors.**
- GOAL: The whole ask, react, hint, explain flow is a pure, tested, subject-neutral state machine (**Model the Domain**), and every beat is data.
- SCOPE: `socratic/step.ts`, `choreograph(scene, solved, beat | reaction): BeatScript`, a table-driven test, and `packages/conformance` (vectors for `step`, `detect`, `fill`, `choreograph`; run in Node and WebKit now, in JSC at U16).
- ACCEPTANCE:
  - Right answer: `asking` → `explaining` → `done`.
  - Each detected misconception: `asking` → `reacting` → `asking` on the smaller question.
  - Three hints and still stuck: the worked example explainer runs, then the original question is asked again. No `say` effect in the main story flow ever contains the answer before the child gives it.
  - A double-tap answers only once.
  - Unknown wrong answers fall back to `count-together`.
  - `choreograph` output is deterministic and vectors match in Node and WebKit byte for byte.
- VERIFY: `npm test -- socratic`, `pnpm vectors && git diff --exit-code`. A property test replays 1,000 random answer sequences and asserts that every sequence reaches `done` and that no effect before the correct answer contains `answer`.
- TIMEBOX: 1 day.
- FORBIDDEN: base, plus no DOM imports in `socratic/`.
- REPORT: transition table, property test output.

**U6. WAAPI player for `BeatScript` (GSAP removed).**
- GOAL: `story/` plays `BeatScript` data through WAAPI (default, because GSAP is not MIT), or Motion (MIT) if U1 says WAAPI loses. GSAP is removed (**Migrate Callers Then Delete Legacy APIs**, one wave).
- SCOPE: `motion/` and every `story/` call site.
- ACCEPTANCE: The U3 parity holds against baseline. `__render.seek(t)` is deterministic (same frame hash twice). There are no `gsap` imports at all, and `gsap.min.js` is gone from the bundle.
- VERIFY: `npm run verify:beats -- --compare baseline`, `npm run verify:seek` (hash 3 timestamps twice), `rg -n "gsap" src/ | grep -v motion/` returns empty, and `review-animations` gives a pass table.
- TIMEBOX: 2 to 3 days.
- FORBIDDEN: base.
- REPORT: parity diff, seek hashes, licence line for `NOTICE`.

**U7. Interaction layer.**
- GOAL: The child can answer with touch in either orientation.
- SCOPE: `interact/` (the D2 count widget, drag-to-tray, choose-equation, predict). Also `shell/` layout covering landscape and portrait, `env(safe-area-inset-*)`, `touch-action`, no double-tap zoom, and `pointercancel` handling.
- ACCEPTANCE: Each widget emits the right `Answer` via real pointer events. Drag cancels cleanly when a second finger touches. Targets are 64 px or larger. Tap feedback appears in under 100 ms. VoiceOver labels exist on every control. The portrait layout keeps the counter, Pip's bubble, and the input visible without overlap.
- VERIFY: `npm run verify:interact` in WebKit for iPad Pro 11 and iPad Mini, both orientations. A bounding-box overlap check like v3's `overlap.py` covers the bubble, input, counter, and safe areas. Screenshots go to `evidence/U7/`. Review gate.
- STATUS: Run matrix corrected. Only iPad Pro 11 ran, plus chromium. No screenshots or video were saved. The equation branch has no implementation and no test.
- TIMEBOX: 2 days.
- FORBIDDEN: base.
- REPORT: screenshot grid, overlap minimum gaps, video.

**U8. Reactions that play out.**
- GOAL: A wrong answer shows its own consequence, and the child sees the mismatch.
- SCOPE: `story/react.ts` with `conservation`, `direction`, and `count-together`, wired to the reducer's `react` effect.
- ACCEPTANCE: For 33, 9, 25, and 14 on the sticker problem, the on-screen book count equals the child's number during the play-out, and the conservation readout shows the real start. A "never wrong" lint over the built bundle finds no "wrong", "incorrect", red X glyph, or error-red colour token in a reaction path. Reduced motion keeps the state and drops the movement.
- VERIFY: `npm run verify:react` reads the DOM numbers mid-reaction and saves screenshots plus a 4-reaction video. `npm run lint:never-wrong`. `review-animations` gives a pass table. Review gate.
- TIMEBOX: 2 days.
- FORBIDDEN: base.
- REPORT: video, numbers per reaction.

**U9. Hint ladder, worked example explainer, and "how did you know?"**
- GOAL: Hints climb in order; rung 3 is the worked example explainer per [WORKED-EXAMPLE-EXPLAINER.md](docs/WORKED-EXAMPLE-EXPLAINER.md); the explain step records a strategy locally.
- SCOPE: `story/hints.ts` (visual cues: highlight, count-along, ten-frame, show-start-pile), `story/worked-explainer.ts` (templated step UI for take-away, make-10, compare-more; Next/Back; plain text per step for VoiceOver), `interact/explain.ts`.
- ACCEPTANCE: The hint button only shows after 8 s of no input or one reaction. Rungs appear in order. Rung 3 uses the same question numbers, no mascots, light theme, child-paced steps, reduced-motion final states. Every explainer step has a text alternative. The chosen strategy is written to IndexedDB as a `LocalEvent`, with no free text and no identifiers.
- VERIFY: `npm run verify:hints` (DOM order and number checks), an IndexedDB dump in `evidence/U9/`, and a video. Review gate.
- TIMEBOX: 1.5 days.
- FORBIDDEN: base.
- REPORT: video, event dump.

**U10. iPad audio and lifecycle.**
- GOAL: Sound works on the first try in iPad Safari.
- SCOPE: `audio/`. A "Start" button on the title is the unlock gesture, and it no longer doubles as a skip (the v3 bug). Resume on `visibilitychange`. Handle the AudioContext `interrupted` state. Duck the music under Pip lines.
- ACCEPTANCE: In WebKit, `audioState()` is `running` after the Start tap. After background and foreground, audio resumes. All cues still fire within 17 ms of their timeline position.
- VERIFY: `npm run verify:audio` (WebKit) and the cue log diff. A real-iPad check by Anantha is listed as a gate, because emulation does not model the silent switch.
- TIMEBOX: half a day.
- FORBIDDEN: base.
- REPORT: cue offsets, state log.

**U11. Lesson shell and offline.**
- GOAL: Five stories in a row, resumable, working offline.
- SCOPE: `shell/` (lesson picker, progress dots, resume, settings for sound and reduced motion), service worker precache, IndexedDB.
- ACCEPTANCE: Airplane-mode reload works after the first visit. Killing the tab mid-story resumes at that question. No network request goes to any third-party origin.
- VERIFY: `npm run verify:lesson` (Playwright `context.setOffline(true)`, a request log asserting first-party only, and a reload-resume check).
- TIMEBOX: 1.5 days.
- FORBIDDEN: base, plus no analytics endpoint.
- REPORT: request log, resume trace.

**U11a. Event log v1 and export/import.**
- GOAL: Every child action is an append-only `LocalEvent` on the device, and an adult can export and re-import it.
- SCOPE: `log/` (IndexedDB through idb; storage choice per [PROGRESS-STORAGE.md](docs/PROGRESS-STORAGE.md)), versioned NDJSON export and import with a SHA-256 checksum in `schema/`, the event types the reducer's `record` effect emits, `navigator.storage.persist()` with its result shown, nickname-and-avatar kid profiles behind the parent gate, reset one profile and wipe all (see **Progress storage**).
- ACCEPTANCE: Events have no free text and no identifiers. Export then import on a fresh profile reproduces identical derived progress. A malformed import file is rejected at the boundary with issue codes. No network request.
- VERIFY: `npm run verify:log` (Playwright: play, export, clear storage, import, compare), the request log. TIMEBOX: 1 day. FORBIDDEN: base. REPORT: sample export file, round-trip diff.

**U12a. On-device read-aloud (decided: M1).**
- GOAL: Every child-facing line can be heard, with nothing leaving the device.
- SCOPE: `speech/` using Web Speech with `localService === true` voices only, English; word highlighting; music ducking; a Read-aloud toggle; hidden if no local voice exists.
- ACCEPTANCE: Pip's lines, questions, choices and hints all speak. No remote voice is ever selected (asserted). Works after the Start-tap unlock in WebKit.
- VERIFY: `npm run verify:speech` (stubbed `speechSynthesis` asserting the voice and text per line), a real-iPad check by Anantha at the U12 gate. TIMEBOX: 1 day. FORBIDDEN: base, plus no cloud TTS. REPORT: voice log, video.

**U12. Lesson 1 content and M1 acceptance.**
- GOAL: One reviewed 5-problem NC.2.OA.1 lesson that a child can finish, every story ending on the written equation.
- SCOPE: `lessons/nc-2-oa-1-lesson-1.json` (CC BY-SA 4.0), hand-authored lines that pass `validate`. Proposed problems ([VISION.md](docs/VISION.md) §9, Anantha reviews): take-from start-unknown (□ − 9 = 15), add-to start-unknown (□ + 6 = 31), compare bigger-unknown (18 and 7 more), compare smaller-unknown (32 and 8 fewer), two-step single digits (7 + 5 − 4).
- ACCEPTANCE:
  - `validate` is clean.
  - A scripted run in WebKit iPad for each of 3 child paths completes all 5 stories with zero console errors. The paths are all right, one misconception per question, and all hints.
  - The full run holds 58 fps or better at 4x throttle.
  - Read-aloud covers every line (U12a).
  - Anantha plays it on a real iPad and approves.
- VERIFY: `npm run verify:lesson -- --paths all`, the fps table, and 3 videos. Review gate.
- STATUS: Runnable part proven in `evidence/U12/paths-report.md`. Videos, fps table, real-iPad read-aloud, and Anantha approval stay open at the gate. Requirement unchanged.
- TIMEBOX: 1.5 days.
- FORBIDDEN: base.
- REPORT: videos, fps, and Anantha's notes.

### M2. Generator and offline video

**U13. Deterministic renderer.** GOAL: `npm run render -- lesson.json --path wrong-then-right` writes an MP4 that is the same every run. SCOPE: `render/`. ACCEPTANCE: two renders give the same video-stream hash, audio cues within 1 frame (33 ms) of their seeked time, 1280×720 at 30 fps, H.264 plus AAC. VERIFY: `sha256sum` of two runs, `ffprobe`, and 12 extracted frames viewed. TIMEBOX: 2 days. FORBIDDEN: base, plus no real-time screencast. REPORT: hashes, ffprobe, frame grid.

**U14. Generator with the LLM boundary.** GOAL: `npm run gen -- spec.json` turns a problem and goal into a validated draft. SCOPE: `gen/spec.ts` (a structured spec, or a word problem that the model parses into a `Problem`, after which code re-derives everything), `gen/llm.ts` (gateway client, model id in config, JSON-schema output, one retry with issues), and `gen/cache/` (recorded responses so tests never call the network). ACCEPTANCE: A spec run produces `status: "validated"` or a list of human-to-do slots, never a draft with a number from the model. With the recorded cache, CI is deterministic. VERIFY: `npm test -- gen` (cache), plus a red-team fixture where the "model" returns "Momo has 15 left!" and "try again", which must be rejected. TIMEBOX: 2 days. FORBIDDEN: base, plus no provider SDK outside the gateway client. REPORT: rejection log, sample draft.

**U15. Generator eval.** GOAL: Know how often the generator needs a human. SCOPE: 20 specs across `NC.2.OA.1` and `NC.2.NBT.5`, run through the gateway. ACCEPTANCE: a table of validator first-pass rate, after-retry rate, human-slot count, and reading-level distribution. Anantha reviews 5 drafts against a rubric (kind, Socratic, on-goal). VERIFY: `npm run eval:gen` writes `evidence/U15/eval.md`. TIMEBOX: 1 day. REPORT: table and the worst 3 drafts.

**U15a. Authoring tool v1.** GOAL: A teacher turns an NC grade 2 problem into a draft lesson without an engineer. SCOPE: a browser page, offline, no account: pick the NCDPI ID, enter the problem, the solver fills numbers, pick misconceptions, live preview, output a CC BY-SA lesson file. ACCEPTANCE: one non-engineer authors a lesson that passes `validate`. VERIFY: Playwright drive plus the authored file. TIMEBOX: 2 days. REPORT: file, the author's notes.

### M3. Native SwiftUI iPad app

Units follow [STACK.md](docs/STACK.md) §5. Every unit's VERIFY runs in the macOS CI job (self-hosted runner on Anantha's Mac, `macos-26` fallback) and attaches `.xcresult`, snapshot diffs and simulator videos.

**U16. CoreBridge and vectors in JSC.** `CoreBridge.swift` owns one `JSContext` running the bundled `core.ios.js` (or the Swift port, per U2b). ACCEPTANCE: every conformance vector, including derived views, matches Node byte for byte. TIMEBOX: 1.5 days.

**U17. Generated types.** Swift Codable types from `schema/*.json` (quicktype or hand-written per U2c), with branded `Count`. ACCEPTANCE: good fixtures round-trip byte-equal, bad shapes are rejected. TIMEBOX: 1 day.

**U18. BeatPlayer, stage and mascots.** `BeatPlayer` evaluates `BeatScript` at `t` inside `TimelineView`; `tools/mascots` generates SwiftUI `Shape`s from the CC0 SVG rigs. ACCEPTANCE: values match the TS evaluator within 0.01 px and 0.001 opacity; snapshots at each beat end in both orientations, reduced motion on and off; 60 fps on Anantha's iPad in Instruments. Emil's skills apply. TIMEBOX: 3 days.

**U19. Interaction widgets.** Predict, count, drag-to-tray, equation, explain, with VoiceOver labels, Switch Control alternatives and 64 pt targets. ACCEPTANCE: XCUITest drives each widget and the reducer receives the right `Answer`. TIMEBOX: 2 days.

**U20. Audio and read-aloud.** AVAudioEngine cues from the beat clock, `.ambient` session; AVSpeechSynthesizer with an on-device English voice, word highlighting, music ducking. ACCEPTANCE: cue offsets within one frame; every line speaks; no network. TIMEBOX: 1.5 days.

**U21. Event log on iPad.** SwiftData `LocalEvent` log, progress derived not stored; export and import via `fileExporter` and `fileImporter` using the same JSON file as the web app. ACCEPTANCE: a web export imports on iPad and gives identical derived progress, and the reverse. TIMEBOX: 1.5 days.

**U22. Lesson shell and adult gate.** Lesson list, 5-story run, resume, settings, an adult gate in front of settings and export. ACCEPTANCE: the three scripted child paths complete lesson 1 in XCUITest with videos. TIMEBOX: 1.5 days.

**U23. TestFlight readiness.** Kids Category rules, privacy manifest, privacy label "Data Not Collected", privacy policy, review notes. ACCEPTANCE: an archive uploads to TestFlight on Anantha's yes; he approves on a real iPad. TIMEBOX: 1 day.

### M4. NC grade 2 math, section by section (outline; detail each section with `figure-it-out` at M3 end)

- **U24. NCDPI section pipeline.** One NCDPI grade 2 section at a time, in order: NC.2.OA.1–4, then NC.2.NBT.1–8, then NC.2.MD.1–10, then NC.2.G.1 and G.3. Each section is a PR of lessons with IDs, our own paraphrase, and the 2026-edition ID from NCDPI's crosswalk once verified. New interaction kinds (arrays, number line, clocks, money, shapes) land as module code with tests before content.
- **U25. Content commons and approval.** `draft → validated → approved` in the lesson JSON and git history; builds ship only `approved`; CI fails on an unapproved reference, an NC or ND source, missing licence records, or a shipped standard below the **Content depth** target (`npm run coverage:content`). `LICENSE` files: MIT root, CC BY-SA 4.0 `content/`, CC0 `assets/mascots/`. `FORKS.md` naming norm.
- **U26. Mastery and spaced review.** Pure `mastery(log)` and `review(log, now)` per **Mastery and review** (three clean in a row, 1/3/7/21-day review, both proposals tuned at Stage A). Property test: mastery never drops within a session after a mistake.
- **U27. Rewards.** Per **Tutor rules (hard)**: chests tied to the lesson just finished (story items, mascot outfits), one gentle streak across subjects with rest days and no loss shaming, a small mascot celebration, one badge per NCDPI section, no leaderboards, nothing bought, no score that drops after a mistake. Pure functions with no-dark-patterns property tests. Chest animations use Emil's `animate`, `animation-performance` and `review-animations`.
- **U28. Parent view.** One app, behind the adult gate: what was mastered, which misconceptions came up and were repaired, a weekly report exported as a file. Computed on the device from the log. No teacher roster or class aggregate in the hackathon build.
- **U29. Suggested-question chips** ("Why fewer?", "Show me", "A smaller one") as reducer events.
- **U30. Stage A usability.** 5 to 10 children with an adult present, paper notes only, findings fixed.

### M5. Open ecosystem and pilot (outline)

- **U31. Open content spec 1.0** (published JSON Schema plus conformance vectors) and forkable content packs loaded by file import.
- **U32. Authoring tool release** and contributor tiers (community, reviewed, piloted).
- **U33. Stage B pilot** with a comparison group, de-identified log exports under consent, offline analysis.
- **U34. Revisit points.** Governance (BDFL to M5), legal home, and whether any sync is needed (if so, a Kolibri study first). Re-plan science and ELA with `figure-it-out`.

### After M5 (roadmap, not planned in units)
- **M6 Science:** NC grade 2 science (2023 SCOS), section by section, with predict, observe and explain steps and its own CC0 mascot.
- **M7 English language arts:** NC grade 2 ELA (2026 SCOS), mostly multiple choice and ordering, read-aloud carrying the text.
- Spanish stays deferred. A backend stays deferred.

## 5. Milestones

| Milestone | Units | Exit criteria | Rough effort |
|---|---|---|---|
| M0 Harness and spikes | U0 to U2c | Verification skill works end to end; motion bakeoff table (WAAPI default); count widget picked; JSC and quicktype decided; MIT `LICENSE` and dependency licence check in CI | 4 days (U2b Mac-gated) |
| M1 One Socratic lesson, web app, read-aloud | U3 to U12a | NC.2.OA.1 lesson 1 completes in WebKit on three child paths with zero console errors and zero network calls; read-aloud on every line from on-device voices; event log exports and re-imports; vectors green; GSAP gone; Anantha approves on a real iPad's browser | 3 weeks |
| M2 Generator, video, authoring | U13 to U15a | A spec becomes a validated lesson and a deterministic MP4 (two equal hashes); generator eval table; one non-engineer authors a lesson | 1.5 weeks |
| M3 Native SwiftUI iPad | U16 to U23 | Lesson 1 runs in the SwiftUI app on three paths; vectors agree in JSC; snapshots pass; web and iPad exports interchange; TestFlight build approved by Anantha on a real iPad | 2.5 weeks (Mac-gated) |
| M4 NC grade 2 math | U24 to U30 | Every NC grade 2 math standard has reviewed lessons meeting the **Content depth** target (coverage check green), built section by section in NCDPI order; mastery and reward property tests green; parent view and report export work offline; Stage A findings fixed | re-plan at M3 end |
| M5 Open ecosystem and pilot | U31 to U34 | Spec 1.0 and authoring tool published; external lessons merge through the validator; Stage B pilot report; governance, legal home and sync revisited and logged | re-plan at M4 end |

Science (M6) and English language arts (M7) follow M5. See the roadmap after U34.

Throughput checkpoint (Feature playbook step 3):
- **Blocking first steps.** U0, U1, U3, and U4 gate everything. U2b gates M3.
- **Independent workstreams.** U1, U2, U2b and U2c can run in parallel. U5 (pure) can run alongside U6. U11a and U12a can run alongside U7 to U9. U13 can start once U6 lands. M3 units U16 and U17 can start once U5's vectors exist.
- **Shared mutable state.** `story/` is touched by U6, U8, and U9, so those run serially, one writer per branch.
- **Smallest safe decomposition.** One owner per unit. The verifier uses a different model family from the worker where available (preferences line 6); otherwise verdicts are labelled same-family.

## 6. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| WAAPI port loses v3's feel (springs, nested timelines, `cue` timing) | medium | U1 measures it first. Springs are precomputed `linear()` easing curves. Keep GSAP behind the adapter if the bakeoff loses |
| iPad Safari audio and silent switch | high | U10 Start-tap unlock, plus a real-device gate. Emulation cannot prove it |
| Weak-GPU frame drops (the title-dive `clip-path`) | medium | 4x throttle is a proxy only. Real iPad check at U12. Fallback is the crossfade dive |
| Model text smuggles in numbers or shaming words | medium | No digits allowed, placeholders only, never-wrong lint, recorded-cache tests, human approval |
| Misconception detection misfires (a guess gets read as a misconception) | medium | Unknown answers fall back to `count-together`. The registry is small and tested against hand-labelled answers |
| Portrait layout crowds Pip, the counter, and the input | medium | U7 overlap check per orientation |
| COPPA or district rules | medium | Follow COPPA's spirit by design: no accounts, no ids, no voice input, no network, nothing leaves the device unless an adult exports a file. Not a legal-compliance claim; written review before the M5 pilot |
| GSAP licence (not MIT) stays in by accident | low | U6 removes it; CI licence allow-list fails on it |
| No on-device English voice on some browsers | medium | Hide read-aloud rather than use a remote voice; checked at U12a and U20 |
| NCDPI terms or edition change (2026 math SCOS effective fall 2028) | medium | IDs plus our own paraphrase only; tag both editions via NCDPI's crosswalk; 2026 grade 2 IDs not yet verified |
| Look-alike forks of the CC0 mascots | medium | `FORKS.md` naming norm, published official builds; accepted by decision |
| Real-iPad testing depends on Anantha | certain | Batch the review gates (U2, U7 to U9, U12, U12a, U23) into a few sessions |

## 7. Decision detail

- **GSAP licence (decided by decision 1).** GSAP's standard licence is no-charge but not MIT, so it cannot ship in the MIT app. WAAPI is the default; Motion (MIT) is the fallback if U1 shows WAAPI loses; GSAP stays only until U6 removes it.
- **Native app.** Native SwiftUI (M3), not a WKWebView or Capacitor wrapper (Anantha's direction). The shared TypeScript core runs in JavaScriptCore, with a Swift port as the fallback (U2b).
- **LLM boundary validation.** Structured output against a JSON schema, then `lesson/validate`, then one retry, then a human slot. Recorded responses in CI. The model id lives in config. Team preferences line 5 says "Gemini default" for demo apps, while the standing rule says Anthropic/OpenAI gateway only. This plan follows the gateway rule. Authoring time only, never on the child's device.
- **Misconception authoring.** The kinds live in code (registry plus detectors). Reactions come from the 3 generic stagings. Lines per misconception are drafted by the model or by hand, validated, then approved. New kinds need a code change and a test, not content.
- **Standards text.** NCDPI's site allows non-commercial reuse only without written permission (https://www.dpi.nc.gov/about-dpi). CC BY-SA content allows commercial reuse, so lessons carry IDs plus our own paraphrase and a link. Not legal advice.

## 8. What to cut

- Voice answers, a runtime LLM, accounts, any server or sync (backend deferred until after the hackathon), teacher class rosters and aggregates.
- Story cast beyond Pip, Momo, and Kiwi before M4 (full eight story animals at M4 per DESIGN-PLAN), and per-problem custom reaction animations. Use the 3 generic stagings.
- The duplicate `index-problem2.html`, the `build.sh` concatenation, and the 2.8 MB base64 audio (cut in U3). GSAP (cut in U6).
- Real-time screencast previews (replaced by U13).
- Any NC grade 2 section out of NCDPI order, and science or ELA before M5. Any language other than English.

## 9. Engineering confirmations (defaults, batch to Anantha through Delivery Lead)

Every product decision is recorded at the top and none is open. These are engineering defaults to confirm at one checkpoint; none blocks M0.

1. **D1 motion engine.** WAAPI by default (decision 1 rules out GSAP); Motion only if U1 shows WAAPI loses.
2. **D2 count input.** Which count widget, from the U2 videos.
3. **D3 Mac and Apple account.** Who provides the Mac for the self-hosted runner and the Apple Developer account before M3. Default: Anantha's Mac. Also iPadOS 17 minimum, iPad only, Kids Category, `.ambient` audio (defaults yes).
4. **D4 lesson 1 problems.** The five NC.2.OA.1 problems proposed in U12 and [VISION.md](docs/VISION.md) §9, as fixed scripts Anantha reviews. Default: use the proposal.
5. **D5 repo and model.** Repo `asub927/kids-math-socratic` (built through cloud agents, not local clones), made public by M5 at the latest. The LLM path is the Anthropic/OpenAI gateway, which overrides "Gemini default". Default yes.
