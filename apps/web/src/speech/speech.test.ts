import { describe, expect, it, vi } from "vitest";
import { boundaryWord, createVoiceLog, pickLocalVoice, shouldSpeak, trackBoundaries } from "./speech";

const remote = { name: "Remote", localService: false, lang: "en-US" };
const localEn = { name: "OnDevice", localService: true, lang: "en-US" };
const localFr = { name: "LocalFr", localService: true, lang: "fr-FR" };

describe("pickLocalVoice", () => {
  it("prefers the first local English voice and never a remote one", () => {
    expect(pickLocalVoice([remote, localFr, localEn])).toBe(localEn);
    expect(pickLocalVoice([remote])).toBeNull();
    expect(pickLocalVoice([localFr])).toBeNull();
    expect(pickLocalVoice([])).toBeNull();
  });
});

describe("shouldSpeak", () => {
  it("requires both the toggle and a local voice", () => {
    expect(shouldSpeak(true, true)).toBe(true);
    expect(shouldSpeak(true, false)).toBe(false);
    expect(shouldSpeak(false, true)).toBe(false);
    expect(shouldSpeak(false, false)).toBe(false);
  });
});

describe("createVoiceLog", () => {
  it("records each spoken line with its voice in order", () => {
    const log = createVoiceLog(() => 7);
    log.record("Hi! I am Pip.", "OnDevice");
    log.record("How many?", "OnDevice");
    expect(log.lines()).toEqual([
      { text: "Hi! I am Pip.", voiceName: "OnDevice", atMs: 7 },
      { text: "How many?", voiceName: "OnDevice", atMs: 7 },
    ]);
  });

  it("returns a copy callers cannot mutate", () => {
    const log = createVoiceLog(() => 7);
    log.record("Hi!", "OnDevice");
    log.lines().push({ text: "mutated", voiceName: "X", atMs: 0 });
    expect(log.lines()).toHaveLength(1);
  });
});

describe("boundaryWord", () => {
  it("finds the word around a char offset", () => {
    expect(boundaryWord("Hi! I am Pip.", 0)).toEqual({ word: "Hi!", charIndex: 0, charLength: 3 });
    expect(boundaryWord("Hi! I am Pip.", 6)).toEqual({ word: "am", charIndex: 6, charLength: 2 });
  });

  it("returns null on whitespace or outside the text", () => {
    expect(boundaryWord("Hi! I am", 3)).toBeNull();
    expect(boundaryWord("Hi!", -1)).toBeNull();
    expect(boundaryWord("Hi!", 3)).toBeNull();
  });
});

describe("trackBoundaries", () => {
  it("reports each boundary word and ignores whitespace", () => {
    const utterance = { onboundary: null as ((e: { charIndex: number }) => void) | null };
    const seen: string[] = [];
    trackBoundaries(utterance, "Hi! I am Pip.", (w) => seen.push(w.word));
    utterance.onboundary!({ charIndex: 0 });
    utterance.onboundary!({ charIndex: 3 });
    utterance.onboundary!({ charIndex: 7 });
    expect(seen).toEqual(["Hi!", "am"]);
  });

  it("prefers the event charLength when the engine gives one", () => {
    const utterance = { onboundary: null as ((e: { charIndex: number; charLength?: number }) => void) | null };
    const onWord = vi.fn();
    trackBoundaries(utterance, "Hi! I am", onWord);
    utterance.onboundary!({ charIndex: 0, charLength: 2 });
    expect(onWord).toHaveBeenCalledWith({ word: "Hi!", charIndex: 0, charLength: 2 });
  });
});
