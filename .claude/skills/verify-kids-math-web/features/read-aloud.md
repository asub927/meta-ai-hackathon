# Read-aloud

Every child-facing line (Pip, questions, choices, hints) can be heard with on-device voices only. If no local voice exists, read-aloud hides rather than using a remote voice. Planned acceptance: PLAN.md U12a.

## Sub-features

- `speech-local-only` — only voices with `localService === true` are ever selected.
- `speech-covers-lines` — Pip lines, questions, choices, and hints all speak.
- `speech-hidden-no-voice` — with no local voice, the read-aloud control is absent.
- `speech-ducking` — music ducks under Pip's lines; word highlighting follows boundary events.

## How to get to it (user POV)

- Toggle **Read-aloud** in settings; tap any Pip bubble/line to hear it (route: settings; play).

## Driving it with Playwright

Preconditions:

- Baseline with stubbed `speechSynthesis` recording (voice, text) pairs. Command: `npm run verify:speech`.

- **Coverage.** Play one story; the stub log contains every displayed child-facing line exactly once per display.
- **Local only.** Offer the stub one remote voice and one local voice: the remote voice is never selected. Offer only remote voices: read-aloud control is hidden.
- **Unlock.** Speech works after the title **Start** tap in WebKit (no speech before a user gesture).
- **Proof.** Voice log in `evidence/U12a/` (voice name, `localService`, text per line).

## Gotchas

- Emulated WebKit voice lists differ from a real iPad — selection logic is proven here; actual voice availability is Anantha's real-iPad gate.
- A line rendered but not spoken (or spoken but not rendered) is a failure — compare against the `aria-live` text, not a fixture copy.
- Never fall back to cloud TTS to make this pass (PLAN.md FORBIDDEN).
