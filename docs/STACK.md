# Tech stack: Socratic kids' math story

Status: decision document, Oct 28, 2026, revised the same evening with Anantha's product decisions. Nothing is built. PLAN.md has been re-scoped to match (native SwiftUI M3, on-device only, backend deferred). Pre-decision copy: `STACK.pre-decisions.md`. Lives in `/workspace/socratic-math-plan/`, mirrored to `/home/box/socratic-math/`.

**Recorded decisions (Anantha, Oct 28, 2026).** These bind every layer below.
1. **Code: MIT** for every repo the project owns.
2. **Content: CC BY-SA 4.0** for lessons, stories, Pip's scripts and content packs. Third-party CC BY content can be adapted in; NC-licensed sources cannot be included.
3. **Mascot art: CC0 1.0**, names generic and trademark-free (no mark is ever registered or claimed).
4. **Backend deferred** to a future implementation after the hackathon. For the hackathon: on-device only, with file export and import. Privacy follows COPPA's spirit (no accounts, no personal data, nothing leaves the device); not a legal-compliance claim. If sync is needed later, study Kolibri's offline-first design with optional school-server sync first.
5. **Governance: BDFL (Anantha) until M5**, then revisit.
6. **Legal home: deferred** (hackathon entry, intent to continue), revisit around M5.
7. **Standards: NC Standard Course of Study (NCDPI), grade 2, math first**, built one section at a time in NCDPI order. IDs plus our own paraphrase, never NCDPI text.
8. **Read-aloud in M1**, on-device voices only.
9. **Subject order: math, science, English language arts.**
10. **English only.** Spanish deferred, no timeline.

**Goal.** Anantha wants a child to work out a math story problem with Pip asking, not telling. He has set the order. First a real web application, then a native SwiftUI iPad app, later a curriculum at scale. **The problem this document solves.** Two native UIs must show the same numbers, the same Socratic flow and the same timing, without two teams drifting apart. **The smallest stack that meets it** is one TypeScript domain core, data contracts that both apps parse, and two thin native renderers.

Built with pstack. `poteto-mode` set the style and the playbook mapping. `architect` shaped the module boundaries (sketch only, no arena run yet, see section 9). Principles that changed a decision are named where they did.

## Summary

| Layer | Recommendation | Runner-up (why not) |
|---|---|---|
| Shared core | One subject-neutral TypeScript core (`step`, `detect`, `fill`, `choreograph`) with pluggable subject modules (math first, then science, then ELA). Rewards, mastery, review and the parent report are pure functions over the on-device event log. Zod 4 schema is the source of truth, exported to JSON Schema. iOS runs the same core bundle in JavaScriptCore behind a typed Swift facade. Conformance vectors prove Node, WebKit and iOS agree. | Swift port of the runtime core plus the same vectors. Every rule change becomes two PRs. Kept as the fallback if the JSC spike fails |
| Content format | `StoryData` JSON, Zod 4 parse at the boundary, `z.toJSONSchema` for the LLM and for Swift types | Hand-written JSON Schema with Ajv. Two sources of truth for one shape |
| Motion | `BeatScript` data (tracks, keyframes, sampled springs, cues) on a fixed 1280×720 logical stage. Web plays it with WAAPI. iOS plays it with a Swift evaluator driven by `TimelineView` | Motion 14 (MIT) on web. Good, but adds a runtime and does nothing for iOS parity |
| Web app | React 19, TypeScript 7, Vite 8, react-router 8 (declarative mode), pure reducer (no XState), WebAudio, vite-plugin-pwa, idb | Svelte 5. Smaller runtime, but the stage is imperative either way and agents are most fluent in React |
| Web tests | Vitest 5, Testing Library, Playwright 1.64 (Chromium and WebKit, iPad descriptors), axe via `@axe-core/playwright` (test-only) | Cypress. No WebKit |
| Generator | Node CLI. Structured output against the Zod-derived JSON Schema through the Anthropic/OpenAI gateway, then `lesson/validate`, one retry, then a human slot. Recorded cache in CI | Runtime generation. Off the table for children (COPPA, stability) |
| Offline video | Playwright seeks the web player frame by frame, ffmpeg encodes, audio rendered from the cue sheet | Real-time screencast (v3). Not repeatable |
| Backend | **None for the hackathon; deferred (decided).** Static files for the web app (Caddy in Docker if self-hosted). Lessons ship inside each app build or as content-pack files | Any server now, including the earlier M4 Hono, Postgres and Keycloak plan. Deferred; post-hackathon design starts from a Kolibri study |
| Learner data | Append-only `LocalEvent` log on the device (IndexedDB on web, SwiftData on iPad). Export and import as a file. Storage options are compared in `PROGRESS-STORAGE.md` | Any sync. Future option only |
| Read-aloud | On-device speech: Web Speech filtered to `localService` voices, AVSpeechSynthesizer on iPad. English only | Recorded or cloud voices. Remote voices send text off the device |
| iPad app | iPadOS 17 minimum, built with Xcode 26. SwiftUI with `@Observable` store, no TCA. AVAudioEngine. SwiftData for the event log | TCA (MIT). A second reducer layer around a reducer that already exists in the core |
| Mascot assets | One SVG per mascot with named rig groups, art under CC0 1.0. Web inlines it. A small in-repo script generates SwiftUI `Shape` code per part | Rive. The runtime is MIT, but the editor is hosted SaaS and the v3 art is SVG |
| iOS tests | Swift Testing and XCTest, swift-snapshot-testing (MIT) at fixed timeline times, XCUITest for child paths | Manual simulator checks. Not rerunnable |
| Repo and CI | One pnpm monorepo. GitHub Actions. Linux jobs for everything except Xcode. macOS job on a self-hosted runner on Anantha's Mac (actions/runner is MIT), GitHub-hosted `macos-26` as fallback | Two repos. The contracts would cross a repo boundary on every change |
| Licences | MIT code, CC BY-SA 4.0 content, CC0 mascot art. CI checks dependency licences against an allow-list (section 10) and content source licences (no NC, no ND) | Apache-2.0 for code. Decided against |
| Process | pstack throughout (the process skills and playbooks the engineering team follows). Delivery Lead runs `/poteto-mode` and the Orchestrate playbook, units go through Feature, Prototype, Visual parity, Eval, Hillclimb, Bug fix and Trace forensics. All communication about this project goes through the Delivery Lead bot, with no direct side channels. The Scribe notes every decision and discussion (including voice calls) in `DECISIONS-LOG.md`. A process rule, not a stack choice | None. Anantha said no exceptions |

## 1. Shared core: one source of truth

**Attack the Premise changed this layer.** The question assumed both platforms need the whole core. They don't. The solver, the validator and the generator run at authoring time, in Node, and every lesson ships already solved and validated. On the device only four pure functions run.

| Function | Runs where | Input to output |
|---|---|---|
| `step(state, event, solved)` | device | Socratic reducer, returns `[StepPhase, Effect[]]` |
| `detect(solved, question, answer)` | device | misconception id from the code registry |
| `fill(template, vars)` | device | Pip's line, numbers only from `Solved` |
| `choreograph(scene, solved, beat or reaction)` | device and renderer | `BeatScript` data, the timing source for both apps and the video |
| `mastery(log)`, `review(log, now)`, `rewards(log)`, `streak(log, now)`, `parentReport(log, range)` | device | derived views over the `LocalEvent` log. Pure, deterministic, vector-tested like `step` |
| `solve`, `validate`, `equationChoices` | authoring only | lesson JSON is written with every derived number |

**Subject-neutral engine.** `step` and the hint ladder know nothing about math. A `SubjectModule` supplies its own `Interaction` kinds, misconception registry and detectors, `fill` variables, validator rules and reaction primitives. Math is the first module. Science adds predict, observe and explain steps (the play-out stages the child's prediction). ELA mostly uses multiple choice and ordering. A module is a folder under `packages/modules/<subject>` plus content; the core changes only if a new effect kind is needed.

**Rewards and dashboards are pure functions over the log.** There is no second store of progress. Chests (tied to the lesson just finished, never random, never bought), one streak across subjects (rest days, no leaderboards), mastery that never drops within a session, spaced review and the parent report are all recomputed from events. Property tests assert the no-dark-patterns rules on these functions.

Moving derivations to authoring time is also **Subtract Before You Add**. The device surface shrinks to about four functions, so the "keep two platforms equal" problem shrinks with it.

**Options compared.**

| Option | One implementation? | Cloud-agent friendly (Linux) | Licence | Verdict |
|---|---|---|---|---|
| TS core, run on iOS in JavaScriptCore | yes | yes (Node tests) | built into iOS | **Recommended** |
| Duplicate in Swift, conformance vectors | no | yes (`swift test` in the `swift:6.4` Docker image) | n/a | Runner-up, fallback |
| Rust core via UniFFI, wasm on web | yes | partly | UniFFI is MPL-2.0 | Rejected. Adds Rust, wasm and FFI builds for about 600 lines of logic |
| Kotlin Multiplatform | yes | partly | Apache-2.0 | Rejected. Gradle plus Kotlin/Native for Swift, heavy for the size, no web DOM fit |

**How the recommended core works.**
- `packages/core` is TypeScript strict, no DOM, no Node APIs. It builds two artefacts: an ES module for the web app and a single IIFE bundle (`core.ios.js`) that ships inside the iOS app bundle. It is never downloaded, which keeps App Review guideline 2.5.2 satisfied (no downloaded code).
- `CoreBridge.swift` owns one `JSContext`. Each call passes JSON in and gets JSON out. The Swift side decodes results into Codable types at that boundary and trusts them after (**Boundary Discipline**). Calls happen per child event and per beat, never per frame. The derived-view functions run when a screen opens, not per frame.
- Swift types come from the same Zod schema. `z.toJSONSchema` writes `schema/story.schema.json` and quicktype (Apache-2.0) generates Swift Codable types. Unverified: whether quicktype emits Swift enums with associated values for our discriminated unions (`Step`, `Interaction`, `Answer`, `Effect`). A one-hour spike decides it. If not, the ~12 union types are hand-written Codable enums, and the round-trip vectors below catch any drift.
- Branded numbers survive the boundary. `Count` is a Swift struct with an internal initializer that only `CoreBridge` decoding can call, mirroring the TS brand (**Type System Discipline**).

**Conformance vectors (how we prove both platforms agree).**
1. `pnpm vectors` writes `packages/conformance/vectors/*.json` from the TS core. Each vector holds an input and its expected canonical JSON output (sorted keys, integers only).
   - Reducer traces: U5's table cases plus 1,000 seeded random answer sequences per fixture lesson.
   - Detector sweeps: every answer 0 to 100 for every question in every fixture, with the expected misconception id. Exhaustive and cheap.
   - `fill` outputs for every template and fixture.
   - `BeatScript` outputs for every beat and reaction of every fixture, rounded to 0.01 px.
   - Derived views: `mastery`, `rewards`, `streak` and `parentReport` over seeded random event logs.
   - Schema round trips: every good fixture must decode and re-encode byte-equal, and every bad-shape fixture must be rejected.
2. The same vectors run in three hosts. Node (Vitest), WebKit (Playwright loads the ES module in a blank page) and iOS JavaScriptCore through `CoreBridge` (XCTest). All three must match byte for byte.
3. The evaluators that turn a `BeatScript` into values at time `t` exist twice, in TS (WAAPI adapter and renderer) and Swift (`BeatPlayer`). Each is about 150 lines. Vectors sample 30 times per beat and require agreement within 0.01 px and 0.001 opacity.
4. CI fails if `vectors/` is stale (regenerate, then `git diff --exit-code`).

**Fallback trigger.** The JSC spike (Prototype playbook, M0) measures `step` plus `fill` round-trip latency on an iPad simulator and on a real iPad. Decision written before the run: keep JSC if p95 is under 4 ms across 3 runs of 1,000 calls with a spread under 20 percent. Otherwise port the four functions to Swift and keep the vectors as the contract. Unmeasured today; no latency claim is made here (**Explain the Number**).

## 2. Web application

| Concern | Choice | Version and licence (checked Oct 28, 2026) |
|---|---|---|
| Language | TypeScript strict | 7.0.2, Apache-2.0 |
| UI | React, shell and widgets only. The story stage is an imperative module mounted from a ref | 19.3.1, MIT |
| Build | Vite | 8.3.5, MIT |
| Routing | react-router, declarative mode, three routes (lessons, play, settings) | 8.5.1, MIT |
| State | Pure reducer from `packages/core`, held in `useReducer`, effects run by a small interpreter | none |
| Animation | WAAPI through `motion/`, consuming `BeatScript` | browser built-in |
| Audio | WebAudio, unlock on the Start tap, cues scheduled on `AudioContext.currentTime` | browser built-in |
| Offline | vite-plugin-pwa (Workbox underneath), precache app, WAVs and fonts | 2.0.0 MIT, Workbox MIT |
| Local data | IndexedDB through idb, append-only `LocalEvent` log. Export and import as a JSON file (download and file picker) | 8.0.4, ISC (permissive, MIT-compatible) |
| Read-aloud | Web Speech `speechSynthesis`, only voices with `localService === true`; if none, read-aloud is hidden rather than using a remote voice. Word highlighting from boundary events | browser built-in |
| Fonts | Fredoka and Nunito, self-hosted | SIL OFL 1.1 |

**State machine: no library.** **Model the Domain** is satisfied by the reducer PLAN.md already defines. XState 5 (5.33.3, MIT) would add hierarchical and actor semantics that the Swift side would then have to reproduce. A plain `step` function is what crosses to iOS through JSC, so a library on the web side only would fork the semantics. The pstack `statechart` skill can model-check the flow in TLA+ instead (every path reaches `done`, no `say` contains the answer before the child gives it).

**Animation engine.** Recommend WAAPI. GSAP's standard licence (https://gsap.com/standard-license) is no-charge, commercial use allowed, but it is not MIT, forbids use in visual animation builders that compete with Webflow, and lets Webflow terminate the licence in its discretion. Motion 14.7.1 is MIT and has seekable sequences (https://motion.dev/docs/animate), so it stays the runner-up if WAAPI loses the U1 bakeoff. With `BeatScript` as data, the engine is an adapter of about 200 lines, so the choice stays reversible. Springs are sampled once in `choreograph` and played as WAAPI `linear()` easing, so web and iOS use identical numbers. Emil Kowalski's rules apply unchanged (strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)`, no `scale(0)`, transform and opacity plus sanctioned `clip-path`, reduced motion keeps state and drops movement), with `animate`, `animation-performance` and `review-animations` on every motion PR.

**Fixed logical stage.** The stage is 1280×720 logical units, scaled to fit and letterboxed, as v3's coordinates already assume. Portrait puts the input panel below the scaled stage. This keeps `BeatScript` coordinates identical on every screen and on both platforms.

**Tests.** Vitest 5.0.5 for core and reducer, Testing Library 16.3.3 for widgets, Playwright 1.64.1 in Chromium and WebKit with the iPad Pro 11 and iPad Mini descriptors, landscape and portrait. `@axe-core/playwright` 4.14.0 is MPL-2.0. It is a test-only dev dependency, never shipped, and MPL is file-level copyleft, so it is acceptable, but it is flagged.

**Accessibility.** Read-aloud for every child-facing line (M1), 64 px minimum targets, real `<button>` elements, `aria-live="polite"` for Pip's lines, `aria-pressed` for Sound, full keyboard path, `prefers-reduced-motion` and an in-app toggle, no information carried by colour alone, and no red or "wrong" tokens (the never-wrong lint).

**Hosting.** Static files. Self-hosted with Caddy (Apache-2.0) in Docker, or any static host. The service worker makes it work offline after the first visit. No third-party origins, asserted by the Playwright request log.

## 3. Content, generator and video

**Format.** `content/lessons/*.json`, one `Lesson` holding five `StoryData`, licensed CC BY-SA 4.0. Each lesson carries a `source` record (URL, licence, changes) and its NCDPI standard IDs (e.g. `NC.2.OA.1`, with the 2026-edition ID added from NCDPI's crosswalk when available) plus our own paraphrase. NCDPI standards text is never copied: NCDPI's site limits reuse to non-commercial use without written permission (https://www.dpi.nc.gov/about-dpi), which CC BY-SA content cannot honour. `validate` rejects NC or ND source licences. Every derived number is stored (`totals`, `answer`, equation choices) and recomputed by `validate`, which fails on any mismatch.

**Schema.** Zod 4.6.7 (MIT) in `packages/schema` is the only hand-written definition. `z.toJSONSchema` (https://zod.dev/json-schema, Draft 2020-12 default) emits `story.schema.json`, `lesson.schema.json` and the LLM slot schema. Zod refinements that JSON Schema cannot express (no digits in templates, hint order, worked-example numbers) live in `lesson/validate`, so the JSON Schema is a shape contract and `validate` is the rule contract.

**Generator pipeline.**
1. `ProblemSpec` (structured, or a word problem the model parses into a `Problem`, after which code re-derives everything).
2. `solve` writes `Solved`.
3. The model fills only `LineTemplate` slots, through the gateway, with the slot schema as structured output. The model id lives in config.
4. `validate` rejects digits, unknown placeholders, bubbles over 45 characters, reading level above target, gendered words outside the cast, out-of-order hints, reused worked-example numbers and shaming words.
5. One retry with the issues fed back, then a human slot. `status` moves `draft` to `validated`. Only Anantha (or a named reviewer) moves it to `approved`, and app builds include only `approved` lessons.
6. CI uses a recorded response cache and never calls the network. A red-team fixture whose fake model returns "Momo has 15 left!" must be rejected.

**Offline video.** `tools/render` opens the web player with `?render=1`, which exposes `__render.seek(t)`. Playwright screenshots each frame at 30 fps, ffmpeg encodes H.264 plus AAC, and the soundtrack is mixed offline from the `BeatScript` cue sheet (v3's `mix.py` approach). A `ChildPath` scripts the child's answers. Acceptance is two renders with the same video-stream hash. ffmpeg with libx264 is GPL and used as a build tool only, never shipped. The iPad app does not render video.

**Audio assets.** `tools/audio/gen_sounds.py` (numpy, BSD-3-Clause) stays the single source of every sound. It writes WAV files used by both apps and drops the 2.8 MB base64 `sounds.js`.

## 4. Data on the device (backend deferred, decided)

For the hackathon there is no server. The backend is **deferred** to a future implementation after the hackathon, so the earlier M4 plan (Hono API, PostgreSQL, Keycloak teacher OIDC, aggregate analytics tables, Docker Compose and Helm) is out of this build. If sync is needed later, the first step is a study of how Kolibri (Learning Equality) does offline-first with optional sync to a school server (https://learningequality.org/kolibri/about-kolibri/, https://kolibri-dev.readthedocs.io/en/latest/backend_architecture/facility_syncing/) before designing anything custom. Privacy follows COPPA's spirit: no accounts, no personal data, nothing leaves the device. This is a design stance, not a claim of legal compliance.

- **Lessons** are files in the repo, approved through PRs and bundled into each build. Teachers can also load a **content pack** (a folder of lesson files) by file import. Nothing is downloaded from a project server.
- **Learner data** is one append-only `LocalEvent` log per child profile, on the device. Every view (progress, mastery, review, chests, streak, parent report) is computed from it by the pure functions in section 1. Storage options are compared in `PROGRESS-STORAGE.md`.
- **Export and import.** The log exports as a versioned JSON file (schema in `packages/schema`) and imports on another device or after a reinstall. The parent report exports as a file the parent can save, print or AirDrop. A de-identified export for research is a separate, consent-gated option (VISION.md section 6).
- **Future options, not plans:** device-to-device sync over the local network or by file, and optional iCloud sync on iPad. Each needs its own privacy review and Anantha's yes before any design work.
- **Generator and renderer** remain CLIs run by a cloud agent or on Anantha's machine, with the gateway key from the environment. Authoring-time only; never on the child's device.

Product analytics SaaS and third-party SDKs are out. Apple guideline 1.3 bars third-party analytics in Kids Category apps except in narrow cases (https://developer.apple.com/app-store/review/guidelines/). CI asserts zero network requests during a lesson.

## 5. Native iPad app (SwiftUI)

**Targets.** Minimum iPadOS 17, the release that brought Observation, SwiftData, `PhaseAnimator`, `keyframeAnimator` and `Spring` (availability read from Apple's documentation JSON for each symbol). App Store uploads must be built with Xcode 26 and the iOS 26 SDK since April 28, 2026, and the floor for uploads is iOS 13 (https://developer.apple.com/news/upcoming-requirements/). Unverified: which school iPad models still sit on iPadOS 17. That decides whether 17 is too low or too high. iPad only at first, landscape and portrait. No iPhone layout and no Mac Catalyst.

**Architecture.** Plain SwiftUI with `@Observable`. `LessonStore` holds the `StepPhase`, sends events through `CoreBridge.step`, and interprets the five effect kinds (`play`, `react`, `say`, `cue`, `record`). That is the same shape as the web interpreter. TCA (MIT) is the runner-up. It is a good library, but here the reducer already lives in the core, and TCA would wrap it in a second one.

**Animation.**
- `BeatPlayer` evaluates the `BeatScript` at time `t` (pure Swift, vector-tested against TS) and the stage applies the values as `scaleEffect`, `offset`, `rotationEffect` and `opacity` on layered views. A `TimelineView(.animation)` supplies `t`. The camera is one transform on the world layer, with parallax layers at 0.2× and 0.5×.
- Seekable on purpose. Tap-to-skip jumps `t` to the beat end, reduced motion uses the script's reduced variant, and snapshot tests render any `t` exactly.
- Trail dots and confetti draw in one `Canvas` inside the same `TimelineView`, so particle count does not create views.
- `PhaseAnimator` and `keyframeAnimator` are used only for incidental UI (button press, bubble pop), never for story beats, because they are trigger-driven and not seekable.
- `@Environment(\.accessibilityReduceMotion)` selects the reduced script.
- Lottie (Apache-2.0) and Rive are rejected. Both bring a second animation source that the web player and the video renderer cannot share.
- Performance target is 60 fps with no hitches on Anantha's real iPad, measured with Instruments (Animation Hitches). Not measured yet; no fps claim is made for iOS.

**Mascots.** `assets/mascots/<species>.svg` keeps v3's named parts (`.m-eyes`, `.armL`, `.earL` and the rest) and `RIG` pivots as JSON. `tools/mascots` (TypeScript, about 200 lines, our own art so no parser edge cases to chase) generates one SwiftUI `Shape` per part plus a pivot table. Expressions are part visibility in data. SwiftDraw (Zlib) is the runner-up converter. Zlib is permissive but not MIT or Apache, and a generic converter is more than our paths need.

**Read-aloud.** AVSpeechSynthesizer with an on-device English voice, word highlighting from its delegate callbacks, and ducking of music while Pip speaks. English only.

**Audio.** AVAudioEngine with one `AVAudioPlayerNode` for music and a small pool for effects, buffers loaded from the shared WAVs, cues scheduled at `AVAudioTime` from the beat clock. Audio session category `.ambient`, which respects the silent switch (guideline 2.5.9 forbids overriding standard switches; `.playback` would ignore the switch, so it is a product call, see D3).

**Persistence.** SwiftData model for the append-only `LocalEvent` log, mirroring the TS schema; progress is derived, not stored. Export and import through `fileExporter` and `fileImporter` (or `ShareLink`) using the same JSON file as the web app. Nothing leaves the device unless an adult exports it. No iCloud sync (future option only).

**Accessibility.** VoiceOver labels and `accessibilityValue` on every count and widget, Pip's lines posted as announcements, 64 pt targets, Switch Control actions on drag (an alternative tap path, since drag is hard for switch users), reduced motion, and Dynamic Type for menus (the bubble keeps its 45-character limit and scales as a whole).

**Testing.**
- Swift Testing and XCTest for `CoreBridge`, `BeatPlayer` and the conformance vectors in JSC.
- swift-snapshot-testing (MIT) renders the stage at fixed `t` per beat, both orientations, reduced motion on and off.
- XCUITest drives the three scripted child paths (all right, one misconception per question, all hints) through lesson 1.
- A simulator video per path via `xcrun simctl io recordVideo` goes into the evidence folder.

**Where Xcode runs.** Cloud agents run Linux and cannot run Xcode or the simulator. They can still build and test everything else, including the core in Node and any Swift-only package in the `swift:6.4` Docker image. Xcode builds and tests run in the macOS CI job, on a self-hosted runner on a Mac Anantha provides (recommended, keeps compute self-hosted), or on GitHub's `macos-26` runner (https://github.com/actions/runner-images) as a fallback. A Swift UI PR is only verified when that job's `.xcresult`, snapshot diffs and videos are attached. Real-device checks stay with Anantha.

**App Store and Kids Category** (guidelines 1.3 and 5.1.4, last updated Oct 16, 2026).
- No links out, purchases or other distractions outside a parental gate.
- No third-party analytics or advertising, and no personal or device data to third parties.
- A privacy policy, linked in the app and in App Store Connect. The privacy label should be "Data Not Collected".
- A privacy manifest declaring any required-reason APIs (approved-reasons rule since May 1, 2024).
- Honest answers to the updated age-rating questions.
- "For Kids" wording only if the app is in the Kids Category.
- TestFlight first, App Store only on Anantha's yes. Needs his Apple Developer account.

## 6. Monorepo and CI

```
kids-math-socratic/
  packages/
    schema/        Zod source of truth, emits schema/*.json
    core/          step, detect, fill, choreograph (device); solve, validate (authoring)
    conformance/   vector generator and vectors/*.json
    modules/math/  first subject module (science, then ELA, later)
  apps/
    web/           React + Vite app: stage, motion (WAAPI adapter), interact, audio, shell
    ios/           Xcode project: SwiftUI app, CoreBridge, BeatPlayer, generated types
  tools/           gen/ (LLM CLI), render/ (video), audio/ (gen_sounds.py), mascots/ (SVG to Swift)
  content/lessons/ approved and draft lesson JSON (CC BY-SA 4.0, LICENSE file in the folder)
  assets/          mascots/*.svg and rig.json (CC0 1.0, LICENSE file), audio/*.wav, fonts/ (OFL)
  LICENSE          MIT
  FORKS.md         fork naming norm (forks use their own app name)
  baseline/v3/     read-only v3 source and evidence, for parity
  .cursor/skills/  verify-kids-math-web/, verify-kids-math-ios/
```

pnpm workspaces (MIT), plain package scripts, no Turborepo or Nx (**Subtract Before You Add**). One repo, because the schema and vectors change together with both apps.

**CI (GitHub Actions).**
- Linux, every PR: typecheck, lint, dependency licence allow-list (section 10), content source licence check, zero-network assertion, Vitest, `validate content/**`, vectors fresh, vectors in Node and WebKit, Playwright Chromium and WebKit (iPad descriptors), axe, bundle size, never-wrong lint, a 3-second render determinism check.
- macOS, PRs touching `apps/ios`, `packages/core` or `packages/conformance`: `xcodebuild test` on an iPad simulator, vectors in JSC, snapshots, XCUITest paths, artefacts uploaded.
- Nightly: full lesson render plus hash, generator eval on the recorded cache.
- GitHub itself is hosted. The repo already lives there (`asub927`), so the stack keeps build compute self-hostable through the runner and keeps every tool self-hostable. Forgejo with Forgejo Actions is the self-hosted escape hatch if needed. Note: Forgejo v9 and later are GPL-3.0-or-later, not MIT (https://forgejo.org/2024-08-gpl/); it is an external tool, not a dependency, but it conflicts with the MIT or Apache-2.0 tooling rule, so Gitea (MIT, not checked today) would be the rule-compliant alternative.

## 7. pstack across the build

**Process rule (Anantha).** The build uses pstack throughout, no exceptions. All communication about this project goes through the Delivery Lead bot, with no direct side channels. The Scribe notes every decision and discussion (including voice calls) in `DECISIONS-LOG.md`. This is a process rule, not a tech-stack change.

Delivery Lead coordinates in its own chat and runs `/poteto-mode` on every request. It copies the matched playbook's steps into its todo list verbatim, writes every brief in pstack's template (GOAL, SCOPE, CONTEXT, ACCEPTANCE, VERIFY, TIMEBOX, FORBIDDEN, REPORT, STANDING) with `preferences.md` pasted in, gives every unit one owner, and accepts a unit only with evidence against its acceptance criteria. With two platforms and many stacked PRs, the program now fits **Orchestrate** better than Autopilot-stack. Anantha still lands every PR. Delivery Lead keeps `decisions.tsv` per `show-me-your-work`.

| Stage | Playbook | Skills | Evidence that closes it |
|---|---|---|---|
| M0 harness | Feature | `create-verification-skill` (web: Playwright WebKit; iOS: xcodebuild and simctl on the Mac runner) | doctor output, one driven feature, evidence surviving cleanup |
| M0 empirical forks: JSC vs Swift port, WAAPI vs Motion vs GSAP, count widget, quicktype enums | Prototype | `arena`, `benchmark-checklist`, Emil's skills | bench table with runs, spread and limiter; side-by-side videos; decision row |
| Contracts: schema, `BeatScript`, `CoreBridge` | Feature | `architect` (full arena run), `interrogate` on the contracts | sketch plus rationale; schema and vector files |
| Core: reducer, detect, fill, choreograph | Feature | `tdd`, `statechart` (TLA+ check of the flow), `principle-test-behavior-not-implementation` | vectors green in Node and WebKit; model check report |
| v3 port to the web app | Visual parity, then Feature | `review-animations` | image diffs against `baseline/v3` at each beat end; same DOM numbers and 58 cues |
| Web features: interaction, reactions, hints, audio, offline | Feature (one PR each) | `create-verification-skill` drive steps, Emil's skills | Playwright WebKit runs, screenshots, videos, Anantha's review gates |
| iOS app | Feature (one PR per screen or subsystem) | verification skill for iOS, `swarm` for the verifier | `.xcresult`, snapshot diffs, XCUITest videos, vectors in JSC |
| Generator quality | Eval, then Hillclimb on first-pass validation rate | `swarm` | eval table over 20 specs; `decision.tsv`, one row per attempt |
| Performance on real iPads | Perf issue or Hillclimb | `benchmark-checklist`, `principle-explain-the-number` | before and after with run count, spread, limiter |
| Captured traces (Chrome performance, Instruments) | Trace forensics | | written diagnosis tied to source |
| Defects | Bug fix | reproduce first in the verification skill | failing then passing run on the same surface |
| Landing | Shipping, only on Anantha's yes | | per-PR independent verdict |

**Verification bar per milestone.**
- **M0.** Both verification skills work end to end, and the four forks have tables and a decision.
- **M1 web.** Lesson 1 completes in WebKit on three child paths with zero console errors, vectors green, Anantha approves on a real iPad's browser through a LAN URL.
- **M2.** A spec becomes a validated lesson and a deterministic MP4 (two equal hashes).
- **M3 native.** The same lesson runs in the SwiftUI app on the simulator on three paths, vectors agree in JSC, snapshots pass, Anantha approves on a real iPad via TestFlight.
- **M4.** Every NC grade 2 math section has reviewed lessons; derived-view property tests (no dark patterns) green; Stage A usability findings fixed.
- **M5.** Content spec 1.0 published with conformance vectors; external authors merge lessons through the validator. Re-plan science (M6) and ELA (M7) with `figure-it-out` here.

Known gap. Preferences ask for a verifier from a different model family. Only one family is available in Cursor, so verdicts are labelled same-family, as Delivery Lead already noted.

## 8. Risks, cuts and PLAN.md changes

| Risk | Likelihood | Mitigation |
|---|---|---|
| JSC bridge is slow or awkward to debug on device | medium | M0 spike with a written threshold; Swift port fallback with the same vectors |
| Rewriting v3 beats as `choreograph` data costs more than a port | high | Visual parity first against v3, one beat per PR, GSAP stays behind the adapter until parity holds |
| Mac dependency blocks every iOS PR | high | Self-hosted runner on Anantha's Mac; hosted `macos-26` fallback; Linux-testable core keeps most work unblocked |
| SwiftUI hitches with many layered views | medium | `Canvas` for particles, one transform per layer, Instruments on a real iPad |
| quicktype output unusable for unions | medium | hand-written enums, round-trip vectors |
| Kids Category review rejection | medium | parental gate, no third-party SDKs, privacy manifest, review notes |
| GSAP licence terminable at Webflow's discretion | low | WAAPI default, adapter keeps it swappable |
| No on-device English voice on a given browser or device | medium | Hide read-aloud rather than fall back to a remote voice; WebKit and iPad checks in M1 and M3 |
| Event log grows large over a school year | low | Derived views are incremental over append-only data; compaction into snapshots is allowed if measured as needed |

**Cut.** Capacitor and the WKWebView wrapper (overridden). XState, TCA, Rive, Lottie, Turborepo. Any backend during the hackathon (Hono, PostgreSQL, Keycloak, PocketBase; deferred, not designed). Voice input, runtime LLM, accounts, iPhone and Mac layouts, Android, sync of any kind (future option only), languages other than English. Read-aloud is no longer cut: it ships in M1 on device voices.

**PLAN.md changes (done in this revision).** U16 and U17 replaced with native SwiftUI units; M0 spikes for JSC and quicktype added; `choreograph` and `BeatScript` folded into U4 to U6; backend and analytics-endpoint units removed; event log, read-aloud, rewards, parent view, content commons and validator units added; lesson 1 re-pointed at NC.2.OA.1.

## 9. Engineering confirmations (defaults)

All product decisions are recorded at the top of this document. What remains are engineering defaults for Delivery Lead to confirm with Anantha at one checkpoint; each has a default and none blocks M0.

1. **Motion engine.** Leave GSAP for WAAPI if U1 shows parity. Default yes (GSAP's licence is not MIT; see section 10).
2. **Mac, Apple account and CI.** Provide a Mac for a self-hosted runner and an Apple Developer account before M3. Default your Mac as the runner, GitHub-hosted `macos-26` only if it is unavailable.
3. **iPad target and store path.** iPadOS 17 minimum, iPad only, designed to Kids Category rules, `.ambient` audio that respects the silent switch. Default yes to all four.
4. **Lesson 1 problems.** Five NC.2.OA.1 problems proposed in VISION.md section 9, fixed Pip scripts Anantha reviews. Default: use the proposal.
5. **Repo and model.** One monorepo `asub927/kids-math-socratic` (public at M5 at the latest, since the project is open source), Anthropic/OpenAI gateway only (overrides "Gemini default"). Default yes.

Not yet done, and owned by Delivery Lead. The full `architect` arena run on the contracts, `interrogate` on the core-sharing choice, and the M0 spikes. This document is a recommendation from a sketch, and those runs can overturn it.

## 10. Licence check of every listed dependency (against MIT code)

Rule: anything shipped inside the app must be MIT-compatible permissive (MIT, Apache-2.0, ISC, BSD, OFL for fonts). Build- and test-only tools may differ if never shipped, and are flagged. Licences are as recorded in the sources below on Oct 28, 2026; this pass re-checked the list, not every licence page.

| Dependency | Licence | Ships? | Status |
|---|---|---|---|
| TypeScript, Playwright, quicktype, Caddy, Lottie (rejected) | Apache-2.0 | TS/quicktype output yes; others no | OK (Apache-2.0 is MIT-compatible inbound) |
| React, Vite, react-router, Zod, Motion (runner-up), vite-plugin-pwa, Workbox, Vitest, Testing Library, pnpm, swift-snapshot-testing, actions/runner, XState and TCA (both rejected), Rive runtime (rejected) | MIT | some | OK |
| idb | ISC | yes | OK, permissive, not MIT by name |
| Fredoka, Nunito fonts | SIL OFL 1.1 | yes | OK for fonts; keep the OFL text in `assets/fonts/` |
| numpy (`gen_sounds.py`) | BSD-3-Clause | no (build) | OK |
| `@axe-core/playwright` | MPL-2.0 | no (test only) | **Flag:** file-level copyleft, acceptable as an unshipped test tool |
| ffmpeg with libx264 | GPL | no (build tool, video only) | **Flag:** never bundled; the apps do not render video |
| SwiftDraw (runner-up only) | Zlib | n/a | **Flag:** permissive but not MIT/Apache; not selected |
| UniFFI (rejected) | MPL-2.0 | n/a | Rejected |
| Forgejo (escape hatch only) | GPL-3.0-or-later since v9 | no | **Flag:** conflicts with the tooling rule; not a dependency |
| **GSAP 3.12.5** (v3 demo today) | GSAP standard licence, no-charge, **not MIT** (https://gsap.com/standard-license) | yes, in the current demo | **Flag:** must not ship in the MIT app. **Recommend WAAPI as the default** (browser built-in, no licence), Motion (MIT) as fallback; GSAP stays only behind the adapter until U6 removes it |
| PostgreSQL, Keycloak, Hono, PocketBase | various | removed | Out with the deferred backend |
| Web Speech, WAAPI, WebAudio, IndexedDB, JavaScriptCore, SwiftUI, SwiftData, AVFoundation | platform built-ins | yes | OK, no licence to carry |

Content and art are separate from code: lessons CC BY-SA 4.0, mascot art CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/legalcode.en). Still unverified, carried over: pnpm and PostgreSQL licence pages (PostgreSQL no longer matters), Gitea's current licence.

## Sources checked (Oct 28, 2026)

- npm registry `latest` for versions and licences: xstate, motion, zod, vite, react, react-router, svelte, typescript, @playwright/test, vitest, @testing-library/react, @axe-core/playwright, idb, vite-plugin-pwa, quicktype-core, gsap.
- GitHub API licence fields: quicktype, uniffi-rs (MPL-2.0), SwiftDraw (Zlib), lottie-ios, rive-ios, swift-snapshot-testing, swift-composable-architecture, actions/runner, workbox, keycloak, hono, pocketbase (latest v0.40.6).
- https://gsap.com/standard-license, https://zod.dev/json-schema, https://motion.dev/docs/animate
- https://developer.apple.com/news/upcoming-requirements/, https://developer.apple.com/app-store/review/guidelines/
- Apple documentation JSON for `keyframeAnimator`, `PhaseAnimator`, SwiftData, Observation, `Spring` (iOS 17.0) and `TimelineView` (iOS 15.0).
- Docker Hub `swift` tags (6.4 current), https://github.com/actions/runner-images (`macos-26`).
- https://www.dpi.nc.gov/about-dpi (reuse terms), NCDPI math vertical progression PDF (2017 SCOS grade 2 IDs), https://forgejo.org/2024-08-gpl/, CC0 1.0 legal code.
- Not verified: quicktype's Swift output for discriminated unions, JSC call latency, school iPad OS versions, pnpm licence page (known permissive, not fetched), the 2026 NCDPI math SCOS grade 2 IDs, on-device English voice availability per browser.
