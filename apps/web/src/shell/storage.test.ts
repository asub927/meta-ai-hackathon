import { describe, expect, it } from "vitest";
import { createMemoryBackend, migrateLegacyKeys } from "./storage";

describe("migrateLegacyKeys", () => {
  it("imports a missing key once and clears the legacy copy", async () => {
    const key = "kids-math-progress";
    const legacy = new Map<string, string>([[key, "legacy"]]);
    const holder = globalThis as Record<string, unknown>;
    const previous = holder.localStorage;
    holder.localStorage = {
      getItem: (k: string) => legacy.get(k) ?? null,
      removeItem: (k: string) => {
        legacy.delete(k);
      },
    };
    try {
      const backend = createMemoryBackend();
      expect(await migrateLegacyKeys(backend, [key, "kids-math-missing"])).toEqual([key]);
      expect(await backend.get(key)).toBe("legacy");
      expect(legacy.has(key)).toBe(false);
    } finally {
      if (previous === undefined) delete holder.localStorage;
      else holder.localStorage = previous;
    }
  });

  it("leaves an existing backend value and its legacy copy alone", async () => {
    const key = "kids-math-progress";
    const legacy = new Map<string, string>([[key, "legacy"]]);
    const holder = globalThis as Record<string, unknown>;
    const previous = holder.localStorage;
    holder.localStorage = {
      getItem: (k: string) => legacy.get(k) ?? null,
      removeItem: (k: string) => {
        legacy.delete(k);
      },
    };
    try {
      const backend = createMemoryBackend({ [key]: "current" });
      expect(await migrateLegacyKeys(backend, [key])).toEqual([]);
      expect(await backend.get(key)).toBe("current");
      expect(legacy.get(key)).toBe("legacy");
    } finally {
      if (previous === undefined) delete holder.localStorage;
      else holder.localStorage = previous;
    }
  });
});
