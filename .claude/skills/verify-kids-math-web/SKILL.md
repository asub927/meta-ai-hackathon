---
name: verify-kids-math-web
description: "Drive the Socratic kids' math web app (React 19 + Vite, Playwright WebKit iPad) the way a child does: launch, doctor, play a lesson, capture evidence. Use when verifying any web-app change in this repo. PROVEN at e8590dc for the scaffold sticker story (lesson right-path, reaction, hints, speech, log — 12/12 WebKit iPad + Chromium); the full 5-story NC.2.OA.1 lesson and offline/resume/export round-trip remain unproven."
---

# Verify kids-math web (DRAFT — unproven)

> **Status: PROVEN (partial) at `e8590dc`.** Doctor exits 0 (`evidence/U0/doctor.txt`); Playwright WebKit iPad + Chromium pass 12/12 over the scaffold sticker story (1 story, 3 questions: predict → count 15 → count 20) — lesson right-path, reaction play-out (33/9/24), hint ladder, local-only speech, on-device log — with screenshots in `evidence/U0/` surviving cleanup. **Not yet proven:** a full 5-story approved NC.2.OA.1 lesson (U12), offline reload/resume, export→import round-trip, reduced-motion parity, real-iPad gates. Do not report those as verified.

Target once built: pnpm monorepo, `apps/web` (React 19, TypeScript, Vite 8, react-router declarative; routes: lessons, play, settings), fixed 1280×720 logical stage, WAAPI `BeatScript` player, IndexedDB (`idb`) append-only `LocalEvent` log, vite-plugin-pwa offline.

## Launch

From repo root (once `apps/web` exists):

```bash
pnpm install
pnpm --filter web dev -- --port 5173 --host 127.0.0.1   # Vite dev server
```

Ready means usable, not just answering: `http://127.0.0.1:5173/` returns 200 **and** the lesson picker renders a real `<button>` per approved lesson (Playwright: `getByRole('button')` count ≥ 1), with an empty/fresh IndexedDB profile. Seed state = fresh browser context (no prior `LocalEvent`s); the app must reach the picker with no migrations beyond its own IndexedDB creation.

Teardown: stop only the dev-server process this run started (record its PID at launch; `kill <pid>`). Never `pkill` by name.

## Doctor

Run first whenever anything looks off (read-only; safe against a missing app):

```bash
node .claude/skills/verify-kids-math-web/scripts/doctor.mjs
```

It checks: repo root, `apps/web/package.json` present, required verify scripts defined, Node/pnpm versions, Playwright + WebKit availability. Exit `0` = worth driving. Exit `1` prints the exact missing piece — today it exits `1` with `apps/web/package.json missing — app not built yet`, which is the correct result, not a failure of this skill.

## Drive

Harness: Playwright (Chromium + **WebKit**, iPad Pro 11 and iPad Mini device descriptors, landscape and portrait) — the commands the app repo must expose per PLAN.md acceptance criteria:

| Check | Command | Proves |
|---|---|---|
| Beat parity vs baseline | `npm run verify:beats -- --problem 1` | DOM totals `[24,15,20]`, 5 PNGs/device in `evidence/U0/` |
| Full lesson, 3 child paths | `npm run verify:lesson -- --paths all` | all-right / one-misconception-per-question / all-hints complete, zero console errors |
| Reactions | `npm run verify:react` | child's number staged on screen, conservation readout shows real start |
| Hints | `npm run verify:hints` | rungs in order question → visual → worked (different numbers), strategy recorded |
| Speech | `npm run verify:speech` | only `localService === true` voices ever selected |
| Offline/resume | `npm run verify:lesson` with `context.setOffline(true)` | airplane-mode reload, mid-story resume, first-party-only requests |
| Event log | `npm run verify:log` | export → clear → import reproduces identical derived progress; malformed file rejected with issue codes |

Stable handles only: ARIA roles/labels (`aria-live="polite"` Pip bubble, real `<button>`s, 64px+ targets), route paths, and the render hook `window.__render.seek(t)` (deterministic frame hash, same hash twice). Never coordinates/tab order. Start the audio path only via the title-screen **Start** tap (the unlock gesture).

Feature recipes: see `features/README.md`, then one file per feature. A proof driving one entry point is incomplete when the map lists others.

## Evidence

Location: `evidence/<unit>/` in the repo (e.g. `evidence/U0/beats.json`, screenshots, videos, request logs, IndexedDB dumps). Proof standards:

- Exercise the real child path (pointer events, Start tap, hint button), never internal setters or test-only endpoints — `__render.seek` is for frame determinism only, not for answering.
- Capture the action **and** the resulting state (DOM numbers mid-reaction, not just the final screen); verify side effects alongside the visible (IndexedDB `LocalEvent` written, export file checksum).
- Zero-network assertion from the Playwright request log: first-party only, no analytics, nothing leaves the device.
- Mocks only at production boundaries (e.g. stubbed `speechSynthesis` asserting voice+text per line).

## Cleanup

Kill only the PID recorded at launch; close the Playwright context (its fresh profile/IndexedDB dies with it); remove scratch data dirs the run created. **Evidence in `evidence/<unit>/` is never removed by cleanup** — after teardown, `ls evidence/<unit>/` must still list the run's artifacts; a cleanup that eats the proof fails the run.

## Helpers

- `scripts/doctor.mjs` (executable) — the read-only doctor above: `node .claude/skills/verify-kids-math-web/scripts/doctor.mjs [--json]`.

## Isolation

Each run: its own dev-server port (default 5173; pick a free one and record it), its own fresh browser context/profile. Never drive an instance this run did not start — a shared instance may hold a real child's on-device progress.

Maintenance: `/pstack:maintain-verification-skill` keeps this map honest as the app changes.
