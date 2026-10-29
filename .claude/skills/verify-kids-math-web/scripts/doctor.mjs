#!/usr/bin/env node
// Read-only doctor for the planned kids-math web app.
// Exit 0 = instance worth driving. Exit 1 = prints the exact missing piece.
// Safe to run when the app is not built yet: that is a report, not a crash.
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const json = process.argv.includes("--json");
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const checks = [];
const check = (name, ok, detail) => checks.push({ name, ok, detail });

check("repo root (PLAN.md)", existsSync(join(root, "PLAN.md")), root);

const pkgPath = join(root, "apps", "web", "package.json");
const hasApp = existsSync(pkgPath);
check("apps/web/package.json", hasApp, hasApp ? pkgPath : "missing — app not built yet (PLAN.md: nothing built until Anantha says go)");

if (hasApp) {
  const scripts = JSON.parse(readFileSync(pkgPath, "utf8")).scripts ?? {};
  for (const s of ["verify:doctor", "verify:beats", "verify:lesson", "verify:react", "verify:hints", "verify:speech", "verify:log"]) {
    check(`script ${s}`, s in scripts, s in scripts ? scripts[s] : "not defined in apps/web/package.json");
  }
}

for (const tool of ["node", "pnpm"]) {
  try { check(tool, true, execSync(`${tool} --version`, { encoding: "utf8" }).trim()); }
  catch { check(tool, false, "not on PATH"); }
}

let playwright = false;
try { execSync("node -e \"require.resolve('@playwright/test')\"", { cwd: join(root, "apps", "web"), stdio: "pipe" }); playwright = true; } catch {}
check("@playwright/test resolvable", playwright, playwright ? "ok (apps/web)" : "not installed in apps/web");
let webkit = false;
try { const out = execSync("ls ~/Library/Caches/ms-playwright 2>/dev/null || ls ~/.cache/ms-playwright 2>/dev/null", { encoding: "utf8", shell: "/bin/sh" }); webkit = /webkit/.test(out); } catch {}
check("WebKit browser", webkit, webkit ? "installed (ms-playwright cache)" : "not installed: pnpm --filter web exec playwright install webkit");

const ok = checks.every((c) => c.ok);
if (json) console.log(JSON.stringify({ ok, checks }, null, 2));
else for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name} — ${c.detail}`);
process.exit(ok ? 0 : 1);
