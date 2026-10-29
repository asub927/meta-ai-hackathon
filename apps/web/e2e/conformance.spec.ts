import { expect, test } from "@playwright/test";

// "node:fs" has no type declarations in scope (the web tsconfig bundles
// vite/client types only — no @types/node), so reach it through a dynamic
// import with a non-literal specifier that tsc leaves alone. Specs run in
// Node, where the builtin always exists.
const fsSpecifier = "node:fs" as string;
const loadFs = async (): Promise<{
  existsSync: (p: URL) => boolean;
  readFileSync: (p: URL, encoding: string) => string;
}> => (await import(fsSpecifier)) as unknown as {
  existsSync: (p: URL) => boolean;
  readFileSync: (p: URL, encoding: string) => string;
};

// Vectors live at <repo>/packages/conformance/vectors/; this spec runs from <repo>/apps/web/e2e/.
const vectorsDir = new URL("../../../packages/conformance/vectors/", import.meta.url);
const KINDS = ["step", "detect", "fill", "choreograph"] as const;

/** Canonical JSON: object keys sorted recursively, so key order never matters. */
const canonicalize = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(canonicalize);
  if (v !== null && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, val]) => [k, canonicalize(val)]),
    );
  }
  return v;
};
const canonical = (v: unknown) => JSON.stringify(canonicalize(v));

test("conformance: vectors match WebKit byte for byte", async ({ page }) => {
  const { existsSync, readFileSync } = await loadFs();
  for (const kind of KINDS) {
    const file = new URL(`${kind}.json`, vectorsDir);
    expect(existsSync(file), `missing vector file ${file.href} — run the conformance vector generator first`).toBe(true);
  }
  const suites = KINDS.map((kind) => {
    const raw = JSON.parse(readFileSync(new URL(`${kind}.json`, vectorsDir), "utf8"));
    const cases = (Array.isArray(raw) ? raw : raw.cases) as Array<{ input: unknown; expected: unknown }>;
    expect(Array.isArray(cases), `${kind}.json must hold an array or { cases: [...] }`).toBe(true);
    return { kind, cases };
  });

  await page.goto("/");
  await expect(page.locator("main"), "app did not render").toBeVisible();
  expect(await page.evaluate(() => typeof (window as any).__conformanceRun), "__conformanceRun hook missing").toBe("function");

  for (const { kind, cases } of suites) {
    const outputs = await page.evaluate(
      ({ kind, inputs }) => inputs.map((i) => (window as any).__conformanceRun(kind, i)),
      { kind, inputs: cases.map((c) => c.input) },
    );
    let passed = 0;
    for (let i = 0; i < cases.length; i++) {
      expect(canonical(outputs[i]), `${kind}[${i}]: output differs from vector`).toBe(canonical(cases[i]!.expected));
      passed++;
    }
    expect(passed, `${kind}: ${passed}/${cases.length} vectors matched`).toBe(cases.length);
  }
});
