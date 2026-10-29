# Offline, resume, and progress files

After the first visit the app works in airplane mode, resumes mid-story after the tab is killed, and an adult behind the parent gate can export/import/reset a profile's append-only event log. Nothing leaves the device unless an adult exports a file. Planned acceptance: PLAN.md U11, U11a.

## Sub-features

- `offline-reload` — airplane-mode reload after first visit works (service-worker precache).
- `resume-mid-story` — killing the tab mid-question resumes at that question.
- `log-export-import` — NDJSON export (SHA-256 checksum) re-imported into a fresh profile reproduces identical derived progress.
- `log-reject-malformed` — malformed/checksum-mismatched import is rejected at the boundary with issue codes.
- `no-third-party` — zero requests to third-party origins across all of the above.

## How to get to it (user POV)

- Play normally, then reopen the app offline; an adult opens the parent gate → export / import / reset one profile / wipe all (with "export first?" offer).

## Driving it with Playwright

Preconditions:

- Baseline. Commands: `npm run verify:lesson` (offline/resume), `npm run verify:log` (files); request log captured throughout.

- **Offline.** Load once online, `context.setOffline(true)`, reload: picker and lesson play work.
- **Resume.** Answer one question, close the page, reopen: same story, same question, prior answers intact.
- **Round-trip.** Export via the parent gate, clear storage, import the file: derived progress (mastery/review views) is byte-identical; sample export lands in `evidence/U11a/`.
- **Reject.** Corrupt one byte in the export: import is refused with a checksum issue code and the existing log is untouched.
- **Network.** Request log across all steps contains first-party origins only.

## Gotchas

- Safari can evict site data after 7 days without a visit unless added to the Home Screen — surface the persistence result (`navigator.storage.persist()`) in the run log; do not "fix" eviction in the recipe.
- Reset/wipe recipes destroy data: run them only on the fresh-context profile this run created, never on a pre-existing instance.
- Export files contain nickname/avatar only — a file containing a real name, birthday, or free text is a product failure, not test data.
