// U15 repair CLI: merge hand-written or model-repaired reaction pips into a
// tailed draft attempt, then validate.
//   node gen/repair.mjs <attempt.json> <pips.json> [--out draft.json]
// attempt.json is gen/cache/<spec>.attemptN.json (the {key,request,content}
// wrapper) or a raw model JSON object. pips.json is {"reactions": {id: pip}}.
// Writes the validateModel result. Exit 0 validated, 2 still needs human,
// 1 error. Never touches the network.

import { execSync } from "node:child_process";
import { promises as fs, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const log = (...a) => console.error("[repair]", ...a);

function parseArgs(argv) {
  const args = { attempt: null, pips: null, out: null };
  const rest = [...argv];
  if (rest.length && !rest[0].startsWith("--")) args.attempt = rest.shift();
  if (rest.length && !rest[0].startsWith("--")) args.pips = rest.shift();
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--out") args.out = rest[++i];
    else throw new Error(`unknown arg: ${rest[i]}`);
  }
  if (!args.attempt || !args.pips) throw new Error("usage: repair.mjs <attempt.json> <pips.json> [--out draft.json]");
  return args;
}

/** Unwrap a cache file ({key,request,content}) or accept a raw model object. */
function readModel(file) {
  const parsed = JSON.parse(readFileSync(path.resolve(file), "utf8"));
  if (typeof parsed.content === "string") return JSON.parse(parsed.content);
  return parsed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  execSync("pnpm --filter @kids-math/core exec tsc -p tsconfig.cli.json", { cwd: ROOT, stdio: "pipe" });
  const core = await import("../packages/core/.validate-dist/index.js");
  const { loadSpec } = await import("./spec.mjs");
  const { mergeRepair, validateModel } = await import("./draft.mjs");

  const model = readModel(args.attempt);
  const pips = JSON.parse(readFileSync(path.resolve(args.pips), "utf8"));
  if (!pips || typeof pips.reactions !== "object") throw new Error("pips.json must be {\"reactions\": {id: pip}}");
  const missingIds = Object.keys(pips.reactions);
  const merged = mergeRepair(model, missingIds, JSON.stringify(pips));
  if (merged === null) throw new Error("attempt.json is not a model object with a reactions map");

  // The spec id rides on the cache filename (<id>.attemptN.json); for a raw
  // model object, recover it from the skeleton question ids instead.
  const base = path.basename(args.attempt);
  const specId = base.match(/^(.*)\.attempt\d+\.json$/)?.[1]
    ?? Object.keys(model.lines ?? {})[0]?.split("-q")[0];
  if (!specId) throw new Error("cannot recover the spec id: use a gen/cache/<id>.attemptN.json file");
  let spec = null;
  for (const dir of ["gen/eval/specs", "gen/examples"]) {
    try {
      spec = loadSpec(JSON.parse(readFileSync(path.join(ROOT, dir, `${specId}.spec.json`), "utf8")));
      break;
    } catch { /* try the next dir */ }
  }
  if (!spec) throw new Error(`no spec file for id ${specId} (looked in gen/eval/specs and gen/examples)`);

  const result = validateModel(core, spec, merged);
  const out = args.out
    ? path.resolve(args.out)
    : path.join(ROOT, "gen/out", `${spec.id}.draft.json`);
  mkdirSync(path.dirname(out), { recursive: true });
  await fs.writeFile(out, JSON.stringify(result, null, 2) + "\n");
  log(`${spec.id}: ${result.status}, ${result.slots.length} slots`);
  console.log(JSON.stringify({
    out, status: result.status,
    slots: result.slots.length, issues: result.issues.map((i) => i.code),
  }));
  if (result.status !== "validated") process.exit(2);
}

main().catch((e) => { console.error(`[repair] fatal: ${e.message}`); process.exit(1); });
