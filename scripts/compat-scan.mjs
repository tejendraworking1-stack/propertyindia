// Static browser-feature scan. Usage: node scripts/compat-scan.mjs <file|dir> [...]
// Reports which modern CSS/JS features the given files use and the minimum Chrome version each needs.
// NOTE: the version table below is from the author's knowledge of release data, not a live dataset.
// Verify any surprising row on MDN / caniuse before acting on it.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const CSS = [
  ["cascade layers (@layer)", /@layer\b/, 99],
  ["@property", /@property\b/, 85],
  ["color-mix()", /color-mix\(/, 111],
  ["oklch/oklab/lab/lch()", /\b(oklch|oklab|lab|lch)\(/, 111],
  ["media range syntax (width >= x)", /@media[^{]*\(\s*(width|height)\s*[<>]=?/, 104],
  ["individual transform props (translate/scale/rotate)", /(^|[;{\s])(translate|scale|rotate)\s*:/, 104],
  [":has()", /:has\(/, 105],
  ["@container", /@container\b/, 105],
  [":is()/:where()", /:(is|where)\(/, 88],
  [":focus-visible", /:focus-visible/, 86],
  ["inset shorthand", /(^|[;{\s])inset\s*:/, 87],
  ["logical props (-inline/-block)", /(margin|padding|border)-(inline|block)/, 87],
  ["aspect-ratio", /aspect-ratio\s*:/, 88],
  ["overflow: clip", /overflow(-[xy])?\s*:\s*clip/, 90],
  ["dvh/svh/lvh units", /\d(dvh|svh|lvh)\b/, 108],
  ["clamp()/min()/max()", /\b(clamp|min|max)\(/, 79],
  ["env()", /env\(/, 69],
  ["scroll-snap", /scroll-snap-/, 69],
  ["scrollbar-width", /scrollbar-width\s*:/, 121],
  ["field-sizing", /field-sizing\s*:/, 123],
  ["backdrop-filter", /backdrop-filter\s*:/, 76],
  ["text-wrap", /text-wrap\s*:/, 114],
  ["CSS nesting (&)", /\{[^{}]*\n?\s*&[\s:.>[]/, 120],
  ["@starting-style / transition-behavior", /@starting-style|transition-behavior/, 117],
  ["light-dark()", /light-dark\(/, 123],
];
const JS = [
  ["optional chaining / nullish (?. ??)", /\?\.[a-zA-Z_([]|\?\?/, 80],
  ["replaceAll", /\.replaceAll\(/, 85],
  [".at()", /\.at\(-?\d/, 92],
  ["structuredClone", /structuredClone\(/, 98],
  ["Object.hasOwn", /Object\.hasOwn\(/, 93],
  ["findLast", /\.findLast(Index)?\(/, 97],
  ["AbortSignal.timeout", /AbortSignal\.timeout\(/, 124],
  ["crypto.randomUUID", /randomUUID\(/, 92],
  ["ResizeObserver", /ResizeObserver/, 64],
  ["IntersectionObserver", /IntersectionObserver/, 58],
  ["scrollTo/scrollIntoView behavior:'smooth'", /behavior\s*:\s*['"]smooth/, 61],
  ["navigator.geolocation", /navigator\.geolocation/, 5],
  ["fetch + async/await", /\bawait\b/, 55],
];
const HTML = [
  ['loading="lazy"', /loading=["']lazy/, 77],
  ["fetchpriority", /fetchpriority=/, 101],
  ["inert attribute", /\sinert[\s>=]/, 102],
  ["popover attribute", /\spopover[\s>=]/, 114],
];

function files(p) {
  if (statSync(p).isDirectory()) return readdirSync(p).flatMap((f) => files(join(p, f)));
  return [p];
}
const targets = process.argv.slice(2).flatMap(files).filter((f) => /\.(css|html|js|mjs)$/.test(f));
if (!targets.length) { console.error("No .css/.html/.js files found."); process.exit(2); }

let overall = 0;
for (const f of targets) {
  const txt = readFileSync(f, "utf8").replace(/data:[a-z/+.-]+;base64,[A-Za-z0-9+/=]+/g, "DATA");
  const ext = extname(f);
  let css = "", js = "", html = "";
  if (ext === ".css") css = txt;
  else if (ext === ".html") {
    css = [...txt.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
    js = [...txt.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n");
    html = txt.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, "");
  } else js = txt;
  const hits = [];
  for (const [n, re, v] of CSS) if (css && re.test(css)) hits.push(["CSS", n, v]);
  for (const [n, re, v] of JS) if (js && re.test(js)) hits.push(["JS", n, v]);
  for (const [n, re, v] of HTML) if (html && re.test(html)) hits.push(["HTML", n, v]);
  const need = Math.max(0, ...hits.map((h) => h[2]));
  overall = Math.max(overall, need);
  console.log(`\n${f}  (${(txt.length / 1024).toFixed(0)} KB scanned)`);
  console.log(`  Minimum Chrome implied by listed features: ${need || "n/a"}`);
  for (const h of hits.sort((a, b) => b[2] - a[2])) console.log(`   Chrome ${String(h[2]).padStart(3)}  ${h[0].padEnd(5)} ${h[1]}`);
}
console.log(`\nOVERALL minimum Chrome: ${overall}`);
