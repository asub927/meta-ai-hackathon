# Socratic math app: decisions log

Source: Anantha, Oct 28, 2026, chat and voice calls. Kept for the Scribe. Not yet handed to Delivery Lead or Scribe (Anantha's draft-approval rule still applies).

## Decided
1. Code licence: MIT.
2. Content licence: CC BY-SA 4.0.
3. Mascot art: CC0 1.0, generic trademark-free names (no marks claimed).
4. Backend: deferred to after the hackathon. Hackathon app is on-device only. COPPA's spirit: no accounts, no personal data, nothing leaves the device (no legal-compliance claim). If sync is needed later, study Kolibri's offline-first design with optional school-server sync first.
5. Governance: BDFL (Anantha) until M5, then revisit.
6. Legal home: deferred (hackathon entry, intent to continue), revisit around M5.
7. Standards: NC Standard Course of Study (NCDPI), grade 2, math first, one section at a time in NCDPI order. (Briefly said grade 1, corrected to grade 2 on the same call.)
8. Read-aloud in M1.
9. Subject order: math, science, English language arts (all NCDPI).
10. Human languages: English only. Spanish deferred, no timeline, no reviewer (Anantha has no Spanish expertise).
11. Process: pstack throughout, no exceptions. All project communication goes through Delivery Lead. Scribe records decisions and discussion, including calls.

## Proposed, needs Anantha approval at landing
12. Spikes retired unbuilt: U1 bakeoff, U2 feel variants, U2b JSC/CoreBridge, U2c quicktype. No bakeoff table, proto dir, or evidence was ever produced. WAAPI stands as the animation surface. Native bridges defer with the backend (entry 4).
13. Storage: web persists in IndexedDB via idb, the PROGRESS-STORAGE.md recommended default. navigator.storage.persist() result shown in settings, Add to Home Screen prompt with non-persistent warning. Mount performs a one-time import of kids-math-progress, kids-math-log-v1, and kids-math-sound from localStorage, copies only missing values into IndexedDB, then removes migrated legacy keys. No other src use remains.
14. Mastery approximation: the stored log records correct answers but not mistakes or hint use, so clean (PLAN.md:58) is approximated as a recorded correct answer. The distinct-templates clause holds through question ids on record effects.
15. Audio precache: no media assets exist (all cues synthesized through Web Audio), so the service-worker precache stays shell-only. No sfx.json baseline exists, so the 58-cue name-and-count diff is not runnable.

## Discussed, not decided
- Progress storage options: PROGRESS-STORAGE.md (recommended default: IndexedDB with export file, teacher dashboard page from exports, SwiftData on iPad).
- Competitor research: COMPETITOR-SYNTHESIS.md, COMPETITOR-LANDSCAPE.md. Vision: VISION.md.
- Demo built: /workspace/socratic-math-demo/ (preview.mp4).
