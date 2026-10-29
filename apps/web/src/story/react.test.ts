import { describe, expect, it } from "vitest";
import { detect, stickerStory, targetFor, type Answer } from "@kids-math/core";
import { countTogetherSteps, stagingFor } from "./react";

const story = stickerStory;
const q1 = story.questions[1]!; // count after giving away (target 15)
const q0 = story.questions[0]!; // predict (step 0)
const q2 = story.questions[2]!; // final count (target 20)

function stageCount(q: typeof q1, value: number) {
  const miss = detect(story.solved, q, { kind: "count", value } satisfies Answer);
  if (miss === null) throw new Error(`expected a reaction for ${value}`);
  const staging = stagingFor(miss, story.solved, q, value);
  return { miss, staging };
}

describe("stagingFor", () => {
  it("stages 33 as conservation with the real start", () => {
    const { miss, staging } = stageCount(q1, 33);
    expect(miss).toBe("wrong-operation");
    expect(staging.kind).toBe("conservation");
    expect(staging.bookCount).toBe(33);
    expect(staging.startCount).toBe(24);
    expect(staging.trayCount).toBe(9);
    expect(staging.expression).toBe("puzzled");
  });

  it("stages an echoed given (9) as conservation", () => {
    const { miss, staging } = stageCount(q1, 9);
    expect(miss).toBe("echoed-a-given");
    expect(staging.kind).toBe("conservation");
    expect(staging.bookCount).toBe(9);
    expect(staging.startCount).toBe(24);
    expect(staging.trayCount).toBe(9);
    expect(staging.expression).toBe("puzzled");
  });

  it("stages 25 as conservation with the child's number on the shelf", () => {
    const { staging } = stageCount(q1, 25);
    expect(staging.kind).toBe("conservation");
    expect(staging.bookCount).toBe(25);
    expect(staging.startCount).toBe(24);
    expect(staging.trayCount).toBe(9);
    expect(staging.expression).toBe("puzzled");
  });

  it("stages 14 as count-together over the staged pile", () => {
    const { miss, staging } = stageCount(q1, 14);
    expect(miss).toBe("off-by-one");
    expect(staging.kind).toBe("count-together");
    expect(staging.bookCount).toBe(14);
    expect(staging.startCount).toBe(24);
    expect(staging.trayCount).toBe(9);
    expect(countTogetherSteps(staging, story.solved, q1)).toEqual(
      Array.from({ length: 14 }, (_, i) => i + 1),
    );
  });

  it("stages a direction-flip on q0 as direction", () => {
    const miss = detect(story.solved, q0, { kind: "predict", value: "more" } satisfies Answer);
    expect(miss).toBe("direction-flip");
    const shown = targetFor(story.solved, q0);
    const staging = stagingFor(miss!, story.solved, q0, shown);
    expect(staging.kind).toBe("direction");
    expect(staging.bookCount).toBe(shown);
    expect(staging.startCount).toBe(24);
    expect(staging.trayCount).toBe(9);
    expect(staging.expression).toBe("puzzled");
  });

  it("stages unknown (42 on q2) as count-together with tray 5", () => {
    const { miss, staging } = stageCount(q2, 42);
    expect(miss).toBe("unknown");
    expect(staging.kind).toBe("count-together");
    expect(staging.bookCount).toBe(42);
    expect(staging.startCount).toBe(24);
    expect(staging.trayCount).toBe(5);
    expect(staging.expression).toBe("puzzled");
  });

  it("caps the count-along at 30", () => {
    const { staging } = stageCount(q2, 42);
    expect(countTogetherSteps(staging, story.solved, q2)).toHaveLength(30);
  });
});
