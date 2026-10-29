// @ts-ignore: @types/node is not a dependency; this file only runs under Node (see tsconfig.cli.json).
import { readFileSync } from "node:fs";
import { parseStoryData, validateStory } from "./index.js";

declare const process: { argv: string[]; exit(code?: number): never };

/** `npm run validate <file…>` (PLAN.md U4): exit 1 per file that fails,
 *  printing the Issue codes callers branch on. */
let failed = false;
for (const file of process.argv.slice(2)) {
  const parsed = parseStoryData(JSON.parse(readFileSync(file, "utf8")));
  const issues = parsed.ok ? validateStory(parsed.data) : parsed.issues;
  if (issues.length) {
    failed = true;
    for (const i of issues) console.log(`${file}: ${i.code} (${i.path}) ${i.message}`);
  } else console.log(`${file}: ok`);
}
if (!process.argv[2]) { console.error("usage: validate <file…>"); process.exit(2); }
process.exit(failed ? 1 : 0);
