import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { canonicalJson } from "./canonical.js";
import { builders, type VectorFile } from "./vectors.js";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "vectors");

describe("conformance vectors", () => {
  for (const [kind, build] of Object.entries(builders)) {
    it(`${kind}: committed vectors match the builders byte-for-byte`, () => {
      const file = join(dir, `${kind}.json`);
      const committed = readFileSync(file, "utf8");
      expect(canonicalJson(build())).toBe(committed);
      const parsed = JSON.parse(committed) as VectorFile;
      expect(parsed.version).toBe(1);
      expect(parsed.kind).toBe(kind);
      expect(parsed.cases.length).toBeGreaterThan(0);
      const ids = parsed.cases.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  }
});
