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

## Oct 30, 2026 — Interaction design and cast (Anantha, approved)

12. **Interaction design:** [DESIGN-PLAN.md](DESIGN-PLAN.md) is the approved child-facing flow (predict → drag/count → number pad → check; hint ladder; six-lesson strip with x/6 ticks, no points on screen). Light theme only. Calm mode swaps animals for plain objects. Motion: transform/opacity only, `cubic-bezier(0.23, 1, 0.32, 1)`; while input waits, only Pip’s slow blink moves.
13. **Cast model:** **Pip** (barn owl) is the fixed **narrator** (`role: "narrator"`). **Momo** (lop-eared rabbit) and **Kiwi** (kiwi bird) are real **story** species (`role: "story"`) for M1. Six more story animals (toucan, fox, elephant, turtle, hedgehog, macaw) join at **M4** with cast lint. Random hero/friend pairing happens **between problems only**, not mid-problem. Story animals never speak hints or answers and are never countable. *No study supports random character rotation; see [research/mascots.md](research/mascots.md).*
14. **Art before release:** AI concept sketches are reference only. A person redraws each character as original layered SVG, then CC0. Thaler v. Perlmutter and US Copyright Office AI Part 2 (Jan 2025) noted in DESIGN-PLAN and mascot research.
15. **Pedagogy research on file:** [research/brilliant-pedagogy.md](research/brilliant-pedagogy.md) — borrow try-first and fading scaffolds; avoid leagues and streak pressure for young children. *No independent Brilliant efficacy study exists.*
16. **Worked example explainer (rung 3):** [WORKED-EXAMPLE-EXPLAINER.md](WORKED-EXAMPLE-EXPLAINER.md) — when still stuck, the third hint is its own calm explainer that walks through the **same question** and derives the answer step by step (Next / Back, no timers). Light theme, dots or ten-frame, question pinned at top; mascots and story cards stay in the main flow and wrong-answer consequences, not here. Explanations are templated data (ordered steps plus text per step). Pip as a small text voice on each step is undecided (default none).

## Discussed, not decided
- Progress storage options: PROGRESS-STORAGE.md (recommended default: IndexedDB with export file, teacher dashboard page from exports, SwiftData on iPad).
- Competitor research: COMPETITOR-SYNTHESIS.md, COMPETITOR-LANDSCAPE.md. Vision: VISION.md.
- Demo built: /workspace/socratic-math-demo/ (preview.mp4).
