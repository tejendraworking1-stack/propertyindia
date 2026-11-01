// Tailwind CSS 4 verification against the REAL build output. Usage (after `npm run build`):
//   node scripts/tests/tailwind4.mjs
// Checks: installed versions, PostCSS wiring, v4 syntax in globals.css, no v3 config / fallback leakage,
// and that the compiled CSS in .next/static/css really contains the original tokens, the local @font-face,
// the 640/960 breakpoints, no preflight reset, and EVERY utility class used by the app.
import { existsSync, readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const out = process.env.VERIFY_DIR ?? "verification";
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok, detail });
const read = (f) => readFileSync(f, "utf8");
const json = (f) => JSON.parse(read(f));
const walk = (d, test, acc = []) => {
  if (!existsSync(d)) return acc;
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p, test, acc);
    else if (test(p)) acc.push(p);
  }
  return acc;
};
const major = (v) => Number(String(v).replace(/^[^\d]*/, "").split(".")[0]);

// --- installed packages / config wiring
const pkg = json("package.json");
const twRange = pkg.devDependencies?.tailwindcss ?? pkg.dependencies?.tailwindcss;
check("package.json requests tailwindcss ^4", major(twRange) === 4, String(twRange));
check("package.json requests @tailwindcss/postcss ^4", major(pkg.devDependencies?.["@tailwindcss/postcss"]) === 4, String(pkg.devDependencies?.["@tailwindcss/postcss"]));
const tw = existsSync("node_modules/tailwindcss/package.json") ? json("node_modules/tailwindcss/package.json").version : null;
const twpc = existsSync("node_modules/@tailwindcss/postcss/package.json") ? json("node_modules/@tailwindcss/postcss/package.json").version : null;
check("installed tailwindcss is v4", tw !== null && major(tw) === 4, `installed ${tw}`);
check("installed @tailwindcss/postcss is v4", twpc !== null && major(twpc) === 4, `installed ${twpc}`);
const postcss = existsSync("postcss.config.mjs") ? read("postcss.config.mjs") : "";
check("postcss.config.mjs uses @tailwindcss/postcss", /@tailwindcss\/postcss/.test(postcss) && !/(^|[\s{,])tailwindcss\s*:/.test(postcss), "");
const v3cfg = ["ts", "js", "mjs", "cjs"].map((e) => `tailwind.config.${e}`).filter((f) => existsSync(f));
check("no Tailwind 3 config file at project root", v3cfg.length === 0, v3cfg.join(", "));
check("autoprefixer is not required by the Tailwind 4 setup", !pkg.devDependencies?.autoprefixer || !/autoprefixer/.test(postcss), "");

// --- the 3.4 fallback must not leak into the application
// Only code that could actually pull the fallback into the build is scanned (source folders + CSS/PostCSS/Next config).
// eslint.config.mjs / tsconfig.json legitimately NAME the folder in their ignore/exclude lists.
const BUILD_FILES = ["postcss.config.mjs", "next.config.ts", "app/globals.css", "app/fonts.css"];
const leaks = [...walk(".", (p) => /\.(ts|tsx|css|mjs|js)$/.test(p) && /^(\.[\\/])?(app|components|data|hooks|lib)[\\/]/.test(p)), ...BUILD_FILES.filter((f) => existsSync(f))]
  .filter((p) => /tailwind-3\.4-fallback/.test(read(p)));
check("application code and build config never reference the 3.4 fallback", leaks.length === 0, leaks.join(", "));
const css = existsSync("app/globals.css") ? read("app/globals.css") : "";
check("globals.css uses v4 imports (theme + utilities layers)", /@import\s+"tailwindcss\/theme\.css"/.test(css) && /@import\s+"tailwindcss\/utilities\.css"/.test(css), "");
check("globals.css has no v3 @tailwind directives", !/@tailwind\s+(base|components|utilities)/.test(css), "");
check("globals.css does not import Tailwind preflight (browser defaults preserved)", !/@import\s+["']tailwindcss["']/.test(css) && !/@import\s+["']tailwindcss\/preflight/.test(css), "");
check("globals.css maps tokens via @theme inline", /@theme\s+inline/.test(css), "");

// --- compiled CSS
const files = walk(".next/static/css", (p) => p.endsWith(".css"));
check("compiled CSS exists in .next/static/css (run npm run build first)", files.length > 0, `${files.length} file(s)`);
const built = files.map(read).join("\n");
const has = (re) => re.test(built);
check("tokens present: --orange #f58220", has(/--orange\s*:\s*#f58220/i), "");
check("tokens present: --orange-2 #f28b1c", has(/--orange-2\s*:\s*#f28b1c/i), "");
check("tokens present: --deep #174a8b", has(/--deep\s*:\s*#174a8b/i), "");
check("tokens present: --cta #c45506", has(/--cta\s*:\s*#c45506/i), "");
check("local @font-face for Plus Jakarta Sans (200-800) from /fonts/", has(/@font-face\s*\{[^}]*Plus Jakarta Sans[^}]*\}/i) && has(/\/fonts\/PlusJakartaSans-VariableFont_wght\.ttf/) && has(/font-weight\s*:\s*200\s+800/), "");
check("no external font/CDN URL in compiled CSS", !has(/url\(\s*["']?https?:/i), "");
check("no Tailwind preflight reset in compiled CSS", !has(/::file-selector-button/) && !has(/\*,\s*:?:?after,\s*:?:?before,\s*::backdrop/), "");
check("breakpoint sm = 640px present", has(/@media\s*\(\s*(min-width\s*:\s*640px|width\s*>=\s*640px)\s*\)/), "");
check("breakpoint lg = 960px present", has(/@media\s*\(\s*(min-width\s*:\s*960px|width\s*>=\s*960px)\s*\)/), "");
check("shadow-card maps to var(--shadow-card)", has(/\.shadow-card\s*\{[^}]*box-shadow\s*:\s*var\(--shadow-card\)/), "");
check("bg-orange-2 maps to var(--orange-2)", has(/\.bg-orange-2\s*\{[^}]*background-color\s*:\s*var\(--orange-2\)/), "");
check("rounded-card maps to var(--r-card)", has(/\.rounded-card\s*\{[^}]*border-radius\s*:\s*var\(--r-card\)/), "");
check("cascade layers declared (theme, base, components, utilities)", has(/@layer\s+theme\s*,(?:\s*[a-z]+\s*,)*\s*utilities\s*;/), "found: " + ((built.match(/@layer\s+[a-z, ]+;/) || ["none"])[0]));

// --- every utility used by the app exists in the compiled CSS
const escapeSel = (c) => c.replace(/([^a-zA-Z0-9_-])/g, "\\$1");
const src = walk(".", (p) => /\.(tsx|ts)$/.test(p) && /^(\.[\\/])?(app|components|data|hooks|lib)[\\/]/.test(p));
const tokens = new Set(json("scripts/tests/tailwind-required-utilities.json").utilities);
for (const f of src) {
  for (const m of read(f).matchAll(/className\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*`([^`]*)`\s*\}|\{\s*"([^"]*)"\s*\})/g)) {
    const s = m[1] ?? m[2] ?? m[3] ?? m[4] ?? "";
    for (const t of s.replace(/\$\{[^}]*\}/g, " ").split(/\s+/)) if (t) tokens.add(t);
  }
}
const allow = existsSync("scripts/tests/tailwind-nonutility-classes.txt") ? new Set(read("scripts/tests/tailwind-nonutility-classes.txt").split(/\s+/).filter(Boolean)) : new Set();
// whole-selector match: ".h-1" must not be satisfied by ".h-10"
const reEsc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasClass = (t) => new RegExp("\\." + reEsc(escapeSel(t)) + "(?![\\w-])").test(built);
const missing = [...tokens].filter((t) => !allow.has(t) && !hasClass(t));
check(`all ${tokens.size} utility classes used by the app exist in compiled CSS`, missing.length === 0, missing.length ? `MISSING: ${missing.join(" ")}` : `${tokens.size} checked`);

mkdirSync(`${out}/tailwind4`, { recursive: true });
writeFileSync(`${out}/tailwind4/results.json`, JSON.stringify({ tailwind: tw, postcssPlugin: twpc, cssFiles: files, results }, null, 2));
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}: ${r.name}${r.detail ? " – " + r.detail : ""}`);
const bad = results.filter((r) => !r.ok);
console.log(`${results.length - bad.length}/${results.length} Tailwind 4 checks passed`);
process.exit(bad.length ? 1 : 0);
