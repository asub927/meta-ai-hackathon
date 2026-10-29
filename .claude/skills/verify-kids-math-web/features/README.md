# Kids-math web verification map

Maintained source for verifying user-facing behavior of the Socratic math web app. **DRAFT at `ed9421f`: the app is not built yet** — every recipe below is the contract from `PLAN.md` (U0, U7–U12) for the first agent who drives the real app. Read this index, then the matching feature file.

## Baseline preconditions

- Doctor passes: `node .claude/skills/verify-kids-math-web/scripts/doctor.mjs` exits 0.
- App launched by this run at `http://127.0.0.1:5173/` (own port, own PID), Playwright WebKit, iPad Pro 11 landscape unless a recipe says otherwise.
- Fresh browser context: empty IndexedDB, no `LocalEvent`s, sound on, reduced motion off.
- Approved lesson 1 (NC.2.OA.1, 5 stories) bundled; sticker demo problem totals are `[24,15,20]`.

## Driving conventions

- Start every recipe from baseline unless its preconditions say otherwise.
- ARIA roles/labels and route paths only — no coordinates, no tab order.
- Unlock audio only via the title-screen **Start** button.
- Restore fresh-context state after any mutation; never remove proof artifacts in cleanup.

## Proof and skip reporting

- Capture the action and the resulting state, not only the final screen.
- UI proof: screenshot + DOM/`aria-live` text. Log proof: IndexedDB dump + export file.
- Record feature ID and entry point with every artifact in `evidence/<unit>/`.
- An unreachable path is reported with the attempted command and unmet precondition — never reported as verified via another path.

## Feature entry contract

Each file: H1 + one paragraph, then exactly `Sub-features`, `How to get to it (user POV)`, `Driving it with Playwright`, `Gotchas`.

## Features

- [Play a Socratic lesson](./lesson-play.md) — picker → 5 stories → finish, all three child paths.
- [Wrong answers play out](./reactions-play-out.md) — misconception reactions, never marked wrong.
- [Hint ladder and explain](./hint-ladder-and-explain.md) — question → visual → worked, strategy recorded.
- [Read-aloud](./read-aloud.md) — on-device voices only, every child-facing line.
- [Offline, resume, and progress files](./offline-resume-progress.md) — offline reload, resume, export/import.
