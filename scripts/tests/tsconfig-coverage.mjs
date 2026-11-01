// Fails if any TypeScript file that is part of the application is NOT type-checked by tsconfig.json,
// or if tsconfig.json excludes anything beyond the reviewed, non-application paths below.
// Usage: node scripts/tests/tsconfig-coverage.mjs   (needs `typescript`, i.e. after npm install)
import ts from "typescript";
import { existsSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

const ROOT = process.cwd();
// Reviewed exclusions: none of these is application code.
const ALLOWED_EXCLUDES = ["node_modules", "docs/tailwind-3.4-fallback", "verification", "verification-offline", "scripts"];
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", ".chrome-versions"]);
const out = process.env.VERIFY_DIR ?? "verification";

const cfgPath = resolve(ROOT, "tsconfig.json");
const raw = ts.readConfigFile(cfgPath, ts.sys.readFile);
if (raw.error) { console.error(ts.flattenDiagnosticMessageText(raw.error.messageText, "\n")); process.exit(2); }
const parsed = ts.parseJsonConfigFileContent(raw.config, ts.sys, ROOT);
const covered = new Set(parsed.fileNames.map((f) => resolve(f)));

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok, detail });

const excludes = (raw.config.exclude ?? []).map((e) => e.replace(/\\/g, "/"));
const extra = excludes.filter((e) => !ALLOWED_EXCLUDES.includes(e));
check("tsconfig exclude list contains only reviewed non-application paths", extra.length === 0, extra.length ? `unreviewed exclusions: ${extra.join(", ")}` : excludes.join(", "));

const isAllowed = (rel) => ALLOWED_EXCLUDES.some((a) => rel === a || rel.startsWith(a + "/"));
const found = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const rel = relative(ROOT, p).split(sep).join("/");
    if (statSync(p).isDirectory()) { if (!SKIP_DIRS.has(f) && !isAllowed(rel)) walk(p); }
    else if (/\.(ts|tsx)$/.test(f) && !isAllowed(rel)) found.push(rel);
  }
})(ROOT);
const uncovered = found.filter((rel) => !covered.has(resolve(ROOT, rel)));
check("every application .ts/.tsx file is type-checked", uncovered.length === 0, uncovered.length ? `NOT covered: ${uncovered.join(", ")}` : `${found.length} application files, all covered`);
check("next-env.d.ts is included when present", !existsSync("next-env.d.ts") || covered.has(resolve(ROOT, "next-env.d.ts")), "");
mkdirSync(`${out}/tsconfig`, { recursive: true });
writeFileSync(`${out}/tsconfig/results.json`, JSON.stringify({ covered: [...covered].map((f) => relative(ROOT, f).split(sep).join("/")), results }, null, 2));
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}: ${r.name}${r.detail ? " – " + r.detail : ""}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
