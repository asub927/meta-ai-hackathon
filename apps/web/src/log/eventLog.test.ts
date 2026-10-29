import { describe, expect, it } from "vitest";
import {
  append, fnv1aHex, loadStoredLog, parseImport, serialize, sha256Hex, withChecksum,
} from "./eventLog";

describe("append", () => {
  it("assigns seq by length and returns a new array", () => {
    const log = append([], "answered-clean");
    expect(log).toEqual([{ v: 1, seq: 0, type: "answered-clean" }]);
    const log2 = append(log, "strategy", { choice: "counted" });
    expect(log2).toEqual([
      { v: 1, seq: 0, type: "answered-clean" },
      { v: 1, seq: 1, type: "strategy", data: { choice: "counted" } },
    ]);
    expect(log).toHaveLength(1);
  });
  it("rejects empty types and non-scalar or unlisted data", () => {
    expect(() => append([], "")).toThrow("bad-event-type");
    expect(() => append([], "x", { choice: "ok", extra: 1 } as never)).toThrow("bad-event-data");
    expect(() => append([], "x", { choice: { nested: true } } as never)).toThrow("bad-event-data");
    expect(() => append([], "x", [1] as never)).toThrow("bad-event-data");
  });
  it("accepts a custom allowlist", () => {
    expect(append([], "x", { custom: 7 }, ["custom"])).toHaveLength(1);
  });
});

describe("serialize / parseImport", () => {
  it("round-trips events including data", () => {
    const log = append(append([], "answered-clean"), "strategy", { choice: "tens" });
    expect(parseImport(serialize(log))).toEqual(log);
  });
  it("skips checksum lines, comments, and blanks", () => {
    const body = serialize(append([], "answered-clean"));
    const text = `\n${body}\n# sha256:deadbeef\n`;
    expect(parseImport(text)).toEqual([{ v: 1, seq: 0, type: "answered-clean" }]);
  });
  it("throws issue codes with the event line number", () => {
    expect(() => parseImport("{oops")).toThrow("bad-event-line-1");
    const body = serialize(append([], "answered-clean"));
    expect(() => parseImport(`${body}\n{"v":2,"seq":1,"type":"x"}\n{"v":1,"seq":2,"type":""}`)).toThrow(
      "bad-event-line-2",
    );
    expect(() => parseImport('{"v":1,"seq":0,"type":"x","data":{"choice":[]}}')).toThrow("bad-event-line-1");
  });
});

describe("checksums", () => {
  it("fnv1aHex is a stable 8-hex string", () => {
    expect(fnv1aHex("abc")).toMatch(/^[0-9a-f]{8}$/);
    expect(fnv1aHex("abc")).toBe(fnv1aHex("abc"));
    expect(fnv1aHex("abc")).not.toBe(fnv1aHex("abd"));
  });
  it("withChecksum appends the trailing line", () => {
    expect(withChecksum("a", "ff")).toBe("a\n# sha256:ff");
    expect(withChecksum("", "ff")).toBe("# sha256:ff");
  });
  it("sha256Hex matches the known vector", async () => {
    await expect(sha256Hex("abc")).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

describe("loadStoredLog", () => {
  it("returns [] for missing or corrupt storage and skips bad rows", () => {
    expect(loadStoredLog(null)).toEqual([]);
    expect(loadStoredLog("[oops")).toEqual([]);
    expect(loadStoredLog("{}")).toEqual([]);
    expect(
      loadStoredLog(JSON.stringify([{ v: 1, seq: 5, type: "answered-clean" }, { v: 9 }, null])),
    ).toEqual([{ v: 1, seq: 0, type: "answered-clean" }]);
  });
});
