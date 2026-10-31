import { describe, expect, it } from "vitest";
import { stickerStory, targetFor } from "@kids-math/core";
import { hintCueFor } from "./hints";

const story = stickerStory;
const q1 = story.questions[1]!; // count after giving away (target 15)
const q2 = story.questions[2]!; // final count (target 20)

describe("hintCueFor", () => {
  it("maps rung 0 to no cue", () => {
    expect(targetFor(story.solved, q1)).toBe(15);
    expect(hintCueFor(q1, 0, story.solved)).toBeNull();
  });

  it("maps rung 1 to the question cue with hints[0] text", () => {
    const cue = hintCueFor(q1, 1, story.solved);
    expect(cue?.kind).toBe("question");
    expect(cue?.say).toBe(q1.hints[0]);
  });

  it("maps rung 2 to the ten-frame cue for target 15", () => {
    const cue = hintCueFor(q1, 2, story.solved);
    expect(cue?.kind).toBe("ten-frame");
    expect(cue?.say).toBe(q1.hints[1]);
    expect(cue?.tenFrame).toEqual({ full: 1, partial: 5 });
  });

  it("maps rung 3 to the same-question explainer derivation", () => {
    const cue = hintCueFor(q1, 3, story.solved);
    expect(cue?.kind).toBe("explainer");
    expect(cue?.explainer?.question).toBe("How many does Momo have now?");
    expect(cue?.say).toBe("How many does Momo have now?");
    const steps = cue?.explainer?.steps ?? [];
    expect(steps.length).toBeGreaterThan(0);
    for (const s of steps) expect(s.text.trim()).not.toBe("");
    expect(steps[steps.length - 1]!.text).toContain("15");
  });

  it("builds a full ten-frame for target 20", () => {
    expect(targetFor(story.solved, q2)).toBe(20);
    expect(hintCueFor(q2, 2, story.solved)?.tenFrame).toEqual({ full: 2, partial: 0 });
  });
});
