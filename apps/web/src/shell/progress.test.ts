import { describe, expect, it } from "vitest";
import { loadProgress, progressDots, resumeIndex, resumePhaseFrom, saveProgress } from "./progress";

describe("saveProgress / loadProgress", () => {
  it("round-trips qIndex, tag, and rung", () => {
    const raw = saveProgress({ qIndex: 2, phaseTag: "asking", rung: 1 });
    expect(loadProgress(raw)).toEqual({ v: 1, qIndex: 2, tag: "asking", rung: 1 });
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
    expect(resumePhaseFrom(saveProgress({ qIndex: 1, phaseTag: "asking", rung: 2 }))).toEqual({
      tag: "asking", qIndex: 1, rung: 2,
    });
  });
  it("restores explaining", () => {
    expect(resumePhaseFrom(saveProgress({ qIndex: 0, phaseTag: "explaining" }))).toEqual({
      tag: "explaining", qIndex: 0,
    });
  });
  it("falls back from reacting to re-asking the same question", () => {
    expect(resumePhaseFrom(saveProgress({ qIndex: 2, phaseTag: "reacting" }))).toEqual({
      tag: "asking", qIndex: 2, rung: 0,
    });
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
