// Runs ESLint on the whole project (JSON output) and prints a triage summary:
// totals, counts per top-level folder, and the most frequent rules. Nothing is hidden or auto-fixed.
// Usage: node scripts/lint-report.mjs   -> verification/eslint-full.json + verification/eslint-summary.md
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { relative, sep } from "node:path";

mkdirSync("verification", { recursive: true });
const json = "verification/eslint-full.json";
const r = spawnSync("npx", ["eslint", ".", "-f", "json", "-o", json], { encoding: "utf8", shell: process.platform === "win32" });
let data;
try { data = JSON.parse(readFileSync(json, "utf8")); } catch {
  console.error("ESLint did not produce JSON output.\n" + (r.stderr ?? "") + (r.stdout ?? ""));
  process.exit(2);
}
const count = (m) => m.reduce((a, x) => (x.severity === 2 ? { ...a, e: a.e + 1 } : { ...a, w: a.w + 1 }), { e: 0, w: 0 });
const total = data.reduce((a, f) => { const c = count(f.messages); return { e: a.e + c.e, w: a.w + c.w }; }, { e: 0, w: 0 });
const byDir = {};
const byRule = {};
for (const f of data) {
  const top = relative(process.cwd(), f.filePath).split(sep)[0];
  for (const m of f.messages) {
    const d = (byDir[top] ??= { e: 0, w: 0 });
    m.severity === 2 ? d.e++ : d.w++;
    const rule = (byRule[m.ruleId ?? "(parse/config)"] ??= { e: 0, w: 0 });
    m.severity === 2 ? rule.e++ : rule.w++;
  }
}
const rows = (o, n = 25) => Object.entries(o).sort((a, b) => b[1].e + b[1].w - (a[1].e + a[1].w)).slice(0, n).map(([k, v]) => `| ${k} | ${v.e} | ${v.w} |`).join("\n");
const md = `# ESLint summary (whole project)\n\nTotal: **${total.e} errors, ${total.w} warnings** in ${data.filter((f) => f.messages.length).length} files.\n\n## By top-level folder\n\n| Folder | Errors | Warnings |\n|---|---|---|\n${rows(byDir)}\n\n## Top rules\n\n| Rule | Errors | Warnings |\n|---|---|---|\n${rows(byRule)}\n\nFull output: ${json}\n`;
writeFileSync("verification/eslint-summary.md", md);
console.log(md);
process.exit(total.e + total.w === 0 ? 0 : 1);
