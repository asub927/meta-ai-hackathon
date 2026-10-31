import { describe, expect, it } from "vitest";
import { stickerStory } from "@kids-math/core";
import { loadProgress, progressDots, resumeIndex, resumePhaseFrom, saveProgress } from "./progress";
import { createIdbBackend, createMemoryBackend } from "./storage";

describe("saveProgress / loadProgress", () => {
  it("round-trips qIndex, tag, and rung", () => {
    const raw = saveProgress({ qIndex: 2, phaseTag: "asking", rung: 1 });
    expect(loadProgress(raw)).toEqual({ v: 1, qIndex: 2, tag: "asking", rung: 1 });
  });
  it("round-trips miss and shown for a reacting save", () => {
    const raw = saveProgress({ qIndex: 1, phaseTag: "reacting", miss: "off-by-one", shown: 16 });
    expect(loadProgress(raw)).toEqual({ v: 1, qIndex: 1, tag: "reacting", miss: "off-by-one", shown: 16 });
  });
  it("drops a bad miss or shown but keeps the snapshot", () => {
    expect(loadProgress(JSON.stringify({ v: 1, qIndex: 1, tag: "reacting", miss: "made-up", shown: -2 }))).toEqual({
      v: 1, qIndex: 1, tag: "reacting",
    });
  });
  it("omits rung when not given", () => {
    expect(loadProgress(saveProgress({ qIndex: 0, phaseTag: "explaining" }))).toEqual({
      v: 1, qIndex: 0, tag: "explaining",
    });
  });
  it("rejects null, garbage, wrong version, and bad fields", () => {
    expect(loadProgress(null)).toBeNull();
    expect(loadProgress("not json")).toBeNull();
    expect(loadProgress(JSON.stringify({ v: 2, qIndex: 0, tag: "asking" }))).toBeNull();
    expect(loadProgress(JSON.stringify({ v: 1, qIndex: -1, tag: "asking" }))).toBeNull();
    expect(loadProgress(JSON.stringify({ v: 1, qIndex: 0, tag: "" }))).toBeNull();
    expect(loadProgress(JSON.stringify([]))).toBeNull();
  });
  it("drops an out-of-range rung but keeps the snapshot", () => {
    expect(loadProgress(JSON.stringify({ v: 1, qIndex: 1, tag: "asking", rung: 9 }))).toEqual({
      v: 1, qIndex: 1, tag: "asking",
    });
  });
});

describe("resumeIndex", () => {
  it("returns qIndex or null", () => {
    expect(resumeIndex(saveProgress({ qIndex: 1, phaseTag: "asking", rung: 0 }))).toBe(1);
    expect(resumeIndex(null)).toBeNull();
  });
});

describe("resumePhaseFrom", () => {
  it("restores asking with rung", () => {
    expect(resumePhaseFrom(saveProgress({ qIndex: 1, phaseTag: "asking", rung: 2 }), stickerStory)).toEqual({
      tag: "asking", qIndex: 1, rung: 2,
    });
  });
  it("restores explaining", () => {
    expect(resumePhaseFrom(saveProgress({ qIndex: 0, phaseTag: "explaining" }), stickerStory)).toEqual({
      tag: "explaining", qIndex: 0,
    });
  });
  it("falls back from a pre-smaller reacting save to re-asking the same question", () => {
    expect(resumePhaseFrom(saveProgress({ qIndex: 2, phaseTag: "reacting" }), stickerStory)).toEqual({
      tag: "asking", qIndex: 2, rung: 0,
    });
  });
  it("restores reacting with a smaller question derived from the saved misconception", () => {
    const raw = saveProgress({ qIndex: 1, phaseTag: "reacting", miss: "wrong-operation", shown: 33 });
    const phase = resumePhaseFrom(raw, stickerStory);
    expect(phase).toMatchObject({ tag: "reacting", qIndex: 1, shown: 33 });
    if (phase?.tag !== "reacting") throw new Error("expected reacting");
    expect(phase.reaction.misconception).toBe("wrong-operation");
    expect(phase.reaction.smaller.id).toBe("q0-count~wrong-operation");
    expect(phase.reaction.smaller.step).toBe(0);
    expect(phase.reaction.smaller.ask).toBe("Count what {hero} has now.");
  });
  it("falls back to re-asking when the reacting save has no story or a bad misconception", () => {
    const raw = saveProgress({ qIndex: 1, phaseTag: "reacting", miss: "wrong-operation", shown: 33 });
    expect(resumePhaseFrom(raw)).toEqual({ tag: "asking", qIndex: 1, rung: 0 });
    expect(resumePhaseFrom(saveProgress({ qIndex: 1, phaseTag: "reacting", miss: "made-up", shown: 33 }), stickerStory))
      .toEqual({ tag: "asking", qIndex: 1, rung: 0 });
    expect(resumePhaseFrom(saveProgress({ qIndex: 9, phaseTag: "reacting", miss: "unknown", shown: 1 }), stickerStory))
      .toEqual({ tag: "asking", qIndex: 9, rung: 0 });
  });
  it("returns null for telling, done, and unknown tags", () => {
    expect(resumePhaseFrom(saveProgress({ qIndex: 0, phaseTag: "telling" }))).toBeNull();
    expect(resumePhaseFrom(saveProgress({ qIndex: 0, phaseTag: "done" }))).toBeNull();
    expect(resumePhaseFrom(saveProgress({ qIndex: 0, phaseTag: "nonsense" }))).toBeNull();
    expect(resumePhaseFrom(null)).toBeNull();
  });
});

describe("progressDots", () => {
  it("marks done, current, and todo", () => {
    expect(progressDots(3, 1, 1)).toEqual(["done", "current", "todo"]);
    expect(progressDots(2, 0, 0)).toEqual(["current", "todo"]);
    expect(progressDots(0, 0, 0)).toEqual([]);
  });
});

describe("storage backend", () => {
  it("memory backend round-trips, removes, and misses as null", async () => {
    const backend = createMemoryBackend();
    expect(await backend.get("k")).toBeNull();
    await backend.set("k", "v");
    expect(await backend.get("k")).toBe("v");
    await backend.remove("k");
    expect(await backend.get("k")).toBeNull();
  });
  it("idb backend keeps progress readable without IndexedDB", async () => {
    const backend = createIdbBackend();
    const raw = saveProgress({ qIndex: 1, phaseTag: "asking", rung: 0 });
    await backend.set("kids-math-progress", raw);
    expect(loadProgress(await backend.get("kids-math-progress"))).toEqual({
      v: 1, qIndex: 1, tag: "asking", rung: 0,
    });
    await backend.remove("kids-math-progress");
    expect(await backend.get("kids-math-progress")).toBeNull();
  });
});
