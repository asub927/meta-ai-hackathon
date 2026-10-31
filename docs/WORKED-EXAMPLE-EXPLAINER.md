# Worked example explainer

Status: approved, Oct 30, 2026. Spec for rung 3 of the hints ladder. Parent doc: [DESIGN-PLAN.md](DESIGN-PLAN.md). Nothing here is built yet.

## What it is

When a child is still stuck after a smaller question and a visual cue, rung 3 opens a **worked example explainer**: a calm, step-by-step walkthrough that **derives the answer to the same question** they were working on. It is about the math and the explanation, not the sticker story.

This layer is **not** the story-consequence layer. Wrong answers still play out in the story (amber number, cast on stage). The explainer is separate help the child chooses from the hint ladder.

**Mascots stay out.** Pip, Momo, Kiwi, and the rest belong in the main flow and in story consequences. The worked example does not need mascots, story cards, or a retold narrative.

## Purpose and controls

- A quiet “help me” screen the child opens when stuck.
- **One idea per step.** The child taps **Next** to advance and **Back** to review. They can leave anytime to retry the question.
- **No timers.** Nothing auto-advances in a way the child cannot pause or step through.
- **No auto-play** that races ahead without the child’s tap.

## Look and feel

- **Light theme only** (matches [DESIGN-PLAN.md](DESIGN-PLAN.md)).
- Plain **dots or stickers**, or a **ten-frame** when that fits the explanation type. **Big numbers.**
- The **question stays visible at the top** for the whole explainer.
- At most a **small neutral voice line** per step (short helper text, not story dialogue). Whether **Pip** appears as that small text voice is **open**; **default: no mascot voice line at all.**

## Motion

- Calm, **one visual change per step**.
- **Transform and opacity only**, same easing spirit as the main app.
- **`prefers-reduced-motion`:** show each step’s **final state** with no movement (instant or fade only).

## Accessibility

Every step must exist as **plain text** so VoiceOver (and similar) can read the full explanation. The earlier canvas prototype was not accessible; the shipping explainer must not repeat that mistake. Each step carries a **text alternative** alongside whatever is drawn on screen.

## Where it fits

| Layer | When | What the child sees |
|--------|------|---------------------|
| Story consequence | After a wrong check | Story plays out the child’s number; cast and setting stay in the narrative |
| Hint rung 1 | Stuck | Smaller two-option question (Pip in the main flow) |
| Hint rung 2 | Still stuck | Visual cue on the problem (highlight, count-along, ten-frame fill, **Show me**, etc.) |
| **Hint rung 3** | Still stuck | **This worked example explainer** — derivation, no story cast |

See [DESIGN-PLAN.md](DESIGN-PLAN.md) for the full predict → do → check flow.

## Explanation types

Templates are **data**: an ordered list of steps per **problem type**, with numbers filled in by code. Three types to ship first:

### 1. Take away (e.g. 14 − 6 = 8)

| Step | On-screen change | Text alternative (example) |
|------|------------------|----------------------------|
| 1 | Show the question **14 − 6 = ?** at the top | “14 take away 6. What is left?” |
| 2 | Show **14** dots (or stickers) in the work area | “Here are 14.” |
| 3 | **Six** dots lift away (opacity/move off); a counter shows **6 taken** and the pile count rolls **14 → 8** | “Take away 6. Six go away.” |
| 4 | Highlight what remains; **count aloud on screen** to **8** | “Count what is left: 8.” |
| 5 | One closing line: **“14 take away 6 leaves 8.”** | Same sentence |

### 2. Make 10 (e.g. 7 + ? = 10)

| Step | On-screen change | Text alternative (example) |
|------|------------------|----------------------------|
| 1 | Show the question **7 + ? = 10** at the top | “7 and how many more make 10?” |
| 2 | Ten-frame with **7** cells filled | “The ten-frame has 7 filled.” |
| 3 | **Empty cells highlighted** | “These spaces are empty.” |
| 4 | Count empty cells; show **3** | “Count the empty spaces: 3.” |
| 5 | Closing line: **“7 and 3 make 10.”** | Same sentence |

### 3. Who has more and by how many (e.g. 11 and 8)

| Step | On-screen change | Text alternative (example) |
|------|------------------|----------------------------|
| 1 | Show the question (e.g. **11 and 8 — how many more is 11?**) at the top | “11 and 8. How many more is 11?” |
| 2 | Two groups **side by side**, dots aligned in **matching rows** | “Line up 11 and 8.” |
| 3 | **Extra dots with no partner** highlighted on the larger group | “These dots have no partner.” |
| 4 | Count the extras; show **3** | “Count the extras: 3.” |
| 5 | Closing line: **“11 is 3 more than 8.”** | Same sentence |

Other problem shapes reuse the same three templates when the underlying strategy matches (take-away, compose-to-ten, compare).

## Authoring (data shape)

Explanations are **not** hand-built per question. One **template** per explanation type holds an ordered **steps** array; the app plugs in the numbers from the current problem.

Suggested shape (illustrative only — not app code):

```json
{
  "explainerType": "take-away",
  "params": { "minuend": 14, "subtrahend": 6 },
  "steps": [
    { "id": "question", "text": "14 take away 6. What is left?" },
    { "id": "show-total", "text": "Here are 14." },
    { "id": "remove", "text": "Take away 6. Six go away." },
    { "id": "count-remainder", "text": "Count what is left: 8." },
    { "id": "summary", "text": "14 take away 6 leaves 8." }
  ]
}
```

Each step’s `text` is the VoiceOver string. Visual behavior is keyed by step `id` (or an equivalent discriminant) so one renderer drives all instances.

## Verification (later build)

- For each template and a set of number fixtures, assert the **last step’s derived answer** matches the solver.
- Assert **every step** has a non-empty **text** alternative.

## Open questions

- Should **Pip** appear as a small neutral text voice on each step, or stay silent in this layer?
- Should there be a **“show me again”** replay from step 1 after the summary?
- How do these templates extend to **English language arts** and **science** hints later (same step UI, different visual idioms)?

## Licensing

Same as [DESIGN-PLAN.md](DESIGN-PLAN.md): code MIT; lesson content CC BY-SA 4.0.
