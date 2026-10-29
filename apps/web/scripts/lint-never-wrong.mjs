// Never-marked-as-mistaken lint: reaction paths must not tell the child they
// are mistaken. Flags judgement copy ("incorrect", "try again"), failure
// glyphs, and error-red colour tokens in web src (tests excluded).
//
// NOTE: the misconception id "wrong-operation" contains the flagged word
// across its hyphen (the pattern matches at the hyphen boundary), so every
// occurrence of that id is stripped before matching. It is a code key, not
// child-facing copy.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "src");
const PATTERN = /\b(wrong|incorrect)\b|try again|✗|✘|#f00|red-/i;
const ID_ALLOWLIST = /wrong-operation/g;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx|css)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

const hits = [];
for (const file of walk(SRC)) {
  const text = readFileSync(file, "utf8").replace(ID_ALLOWLIST, "");
  text.split("\n").forEach((line, i) => {
    if (PATTERN.test(line)) hits.push(`${file}:${i + 1}: ${line.trim()}`);
  });
}

if (hits.length > 0) {
  console.error(`never-wrong violations (${hits.length}):`);
  for (const h of hits) console.error(`  ${h}`);
  process.exit(1);
}
console.log("never-wrong: clean");
