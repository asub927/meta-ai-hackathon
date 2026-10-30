// U14 generator CLI.
//   node gen/gen.mjs <spec.json> [--out draft.json]
// Writes {status: "validated", story} or {status: "needs-human", slots, issues}.
// Exit 0 validated, 2 needs human, 1 error. Network only when the cache misses.

import { execSync } from "node:child_process";
import { promises as fs, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const log = (...a) => console.error("[gen]", ...a);

function buildCore() {
  log("building core…");
  execSync("pnpm --filter @kids-math/core exec tsc -p tsconfig.cli.json", { cwd: ROOT, stdio: "pipe" });
}

function parseArgs(argv) {
  const args = { spec: null, out: null };
  const rest = [...argv];
  if (rest.length && !rest[0].startsWith("--")) args.spec = rest.shift();
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--out") args.out = rest[++i];
    else throw new Error(`unknown arg: ${rest[i]}`);
  }
  if (!args.spec) throw new Error("usage: gen.mjs <spec.json> [--out draft.json]");
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  buildCore();
  const core = await import("../packages/core/.validate-dist/index.js");
  const { loadSpec } = await import("./spec.mjs");
  const { generateDraft } = await import("./draft.mjs");
  const { buildClient, cacheMode } = await import("./llm.mjs");
  const { config } = await import("./config.mjs");

  const specJson = JSON.parse(readFileSync(path.resolve(args.spec), "utf8"));
  const spec = loadSpec(specJson);
  const model = process.env.GEN_MODEL ?? config.model;
  log(`spec ${spec.id}, model ${model}, cache ${cacheMode()}`);

  const client = buildClient({ model, maxTokens: config.maxTokens, temperature: config.temperature });

  const result = await generateDraft(core, spec, client);
  const out = args.out
    ? path.resolve(args.out)
    : path.join(ROOT, "gen/out", `${spec.id}.draft.json`);
  mkdirSync(path.dirname(out), { recursive: true });
  await fs.writeFile(out, JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify({
    out, status: result.status,
    slots: result.slots.length, issues: result.issues.map((i) => i.code),
  }));
  if (result.status !== "validated") process.exit(2);
}

main().catch((e) => { console.error(`[gen] fatal: ${e.message}`); process.exit(1); });
