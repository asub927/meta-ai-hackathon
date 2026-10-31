// @ts-ignore: @types/node is not a dependency; this file only runs under Node (see tsconfig.cli.json).
import { readFileSync } from "node:fs";
import { parseStoryData, validateStory } from "./index.js";

declare const process: { argv: string[]; exit(code?: number): never };

/** `npm run validate <file…>` (PLAN.md U4): exit 1 per file that fails,
 *  printing the Issue codes callers branch on. A lesson wrapper
 *  ({id, standard, stories}) validates each story in turn. */
let failed = false;
for (const file of process.argv.slice(2)) {
  const data = JSON.parse(readFileSync(file, "utf8"));
  const stories: unknown[] = Array.isArray((data as { stories?: unknown }).stories)
    ? (data as { stories: unknown[] }).stories : [data];
  stories.forEach((story, i) => {
    const label = stories.length > 1 ? `${file}#stories/${i}` : file;
    const parsed = parseStoryData(story);
    const issues = parsed.ok ? validateStory(parsed.data) : parsed.issues;
    if (issues.length) {
      failed = true;
      for (const issue of issues) console.log(`${label}: ${issue.code} (${issue.path}) ${issue.message}`);
    } else console.log(`${label}: ok`);
  });
}
if (!process.argv[2]) { console.error("usage: validate <file…>"); process.exit(2); }
process.exit(failed ? 1 : 0);
