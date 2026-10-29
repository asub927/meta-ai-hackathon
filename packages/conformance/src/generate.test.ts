import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { canonicalJson } from "./canonical.js";
import { builders } from "./vectors.js";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "vectors");

describe("generate vectors", () => {
  it("writes vectors/*.json from the builders (idempotent)", () => {
    mkdirSync(dir, { recursive: true });
    for (const [kind, build] of Object.entries(builders))
      writeFileSync(join(dir, `${kind}.json`), canonicalJson(build()));
    expect(true).toBe(true);
  });
});
