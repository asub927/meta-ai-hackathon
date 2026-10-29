import { describe, expect, it } from "vitest";
import { choreograph, evaluateBeat } from "./index.js";
import { stickerStory as story } from "./fixture.js";

const scene = { reducedMotion: false };
const beat = choreograph(scene, story.solved, { kind: "beat", question: story.questions[1]! });
const reaction = choreograph(scene, story.solved, {
  kind: "reaction",
  reaction: story.reactions[0]!,
  shown: 33,
});

describe("evaluateBeat: sticker beat (1200ms, say@0)", () => {
  it("t=0: say gated on, not done", () => {
    const f = evaluateBeat(beat, 0);
    expect(f.say).toBe(beat.say);
    expect(f.activeCues).toEqual(["say"]);
    expect(f.done).toBe(false);
    expect(f.bookCount).toBe(beat.bookCount);
    expect(f.expression).toBe("curious");
  });
  it("mid-beat holds say, never done early", () => {
    for (const t of [299, 300, 1199]) {
      const f = evaluateBeat(beat, t);
      expect(f.say).toBe(beat.say);
      expect(f.done).toBe(false);
    }
  });
  it("done boundary: 1199 not done, 1200 done", () => {
    expect(evaluateBeat(beat, 1199).done).toBe(false);
    expect(evaluateBeat(beat, 1200).done).toBe(true);
    expect(evaluateBeat(beat, 1800).done).toBe(true);
  });
});

describe("evaluateBeat: sticker reaction (1800ms, say@0 pop@300)", () => {
  it("pop cue activates at the 300ms boundary", () => {
    expect(evaluateBeat(reaction, 0).activeCues).toEqual(["say"]);
    expect(evaluateBeat(reaction, 299).activeCues).toEqual(["say"]);
    expect(evaluateBeat(reaction, 300).activeCues).toEqual(["say", "pop"]);
  });
  it("say gating: say visible once the say cue fires", () => {
    expect(evaluateBeat(reaction, 0).say).toBe(reaction.say);
    expect(evaluateBeat(reaction, 1800).say).toBe(reaction.say);
  });
  it("done boundary: 1199/1200 not done, 1800 done", () => {
    expect(evaluateBeat(reaction, 1199).done).toBe(false);
    expect(evaluateBeat(reaction, 1200).done).toBe(false);
    expect(evaluateBeat(reaction, 1800).done).toBe(true);
  });
  it("clamps t into [0, durationMs]", () => {
    expect(evaluateBeat(reaction, -50)).toEqual(evaluateBeat(reaction, 0));
    expect(evaluateBeat(reaction, 9999)).toEqual(evaluateBeat(reaction, 1800));
  });
});

describe("evaluateBeat: reduced motion (duration 0)", () => {
  const rm = choreograph({ reducedMotion: true }, story.solved, {
    kind: "reaction",
    reaction: story.reactions[0]!,
    shown: 33,
  });
  it("duration 0 is done at t=0 (and any t)", () => {
    expect(rm.durationMs).toBe(0);
    expect(evaluateBeat(rm, 0).done).toBe(true);
    expect(evaluateBeat(rm, 300).done).toBe(true);
  });
});

describe("evaluateBeat: determinism", () => {
  it("same t twice gives a deep-equal frame", () => {
    expect(evaluateBeat(reaction, 300)).toEqual(evaluateBeat(reaction, 300));
    expect(evaluateBeat(beat, 0)).toEqual(evaluateBeat(beat, 0));
  });
  it("seek determinism: fixed t after other t's gives the identical frame", () => {
    for (const t of [0, 299, 300, 1199, 1200, 1800]) evaluateBeat(reaction, t);
    expect(evaluateBeat(reaction, 300)).toEqual({ ...evaluateBeat(reaction, 300) });
    const before = evaluateBeat(beat, 1199);
    for (const t of [1800, 0, 300]) evaluateBeat(beat, t);
    expect(evaluateBeat(beat, 1199)).toEqual(before);
  });
  it("frames are JSON-stable", () => {
    const a = JSON.stringify(evaluateBeat(reaction, 300));
    const b = JSON.stringify(evaluateBeat(reaction, 300));
    expect(a).toBe(b);
  });
});
