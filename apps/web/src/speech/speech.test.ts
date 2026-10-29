import { describe, expect, it } from "vitest";
import { pickLocalVoice, shouldSpeak } from "./speech";

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
