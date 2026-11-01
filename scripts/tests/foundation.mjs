// FOUNDATION PREVIEW suite (Phase 1 only). It tests /dev/foundation: local font, 35 icons, original
// tokens, overflow and console/network errors at 10 widths. It is NOT a homepage test.
// Usage: node scripts/tests/foundation.mjs <url> <tag>   (env: CHROME_PATH, EXPECT_MAJOR)
// Needs Playwright (installed by scripts/verify-phase1.mjs with --no-save).
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

const url = process.argv[2] ?? "http://localhost:3000/dev/foundation";
const tag = process.argv[3] ?? "run";
const WIDTHS = [320, 360, 380, 414, 430, 639, 768, 1024, 1280, 1440];
const hex = (x) => (typeof x === "string" ? x.trim().toLowerCase().replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/, "#$1$1$2$2$3$3") : x);
const EXPECT_VARS = {
  "--orange": "#f58220", "--orange-2": "#f28b1c", "--deep": "#174a8b", "--cta": "#c45506",
  "--blue": "#0b6cf0", "--bg": "#f4f7fc", "--surface": "#ffffff", "--ink": "#0f1b33",
};
const outDir = `${process.env.VERIFY_DIR ?? "verification"}/foundation/${tag}`;
// Local font file: the served font must be byte-identical to public/fonts (proves it is NOT an external source).
const FONT_PATH = "public/fonts/PlusJakartaSans-VariableFont_wght.ttf";
const fontBuf = existsSync(FONT_PATH) ? readFileSync(FONT_PATH) : null;
const LOCAL_SHA = fontBuf ? createHash("sha256").update(fontBuf).digest("hex") : null;
const pageIsHttp = /^https?:/.test(url);
const pageHost = pageIsHttp ? new URL(url).host : "";
mkdirSync(outDir, { recursive: true });
// ---- Which browser executable runs this suite? (always recorded in results.json)
//  1. CHROME_PATH            explicit binary (used for the Chrome 111 run)
//  2. Playwright's own Chromium (what `npx playwright install chromium` downloads), if it exists
//  3. If that install failed/was skipped: an already-installed Playwright Chromium found in
//     PLAYWRIGHT_BROWSERS_PATH, /opt/pw-browsers, ~/.cache/ms-playwright, ~/Library/Caches/ms-playwright
//     or %LOCALAPPDATA%\\ms-playwright (newest chromium-<rev> wins). Best-effort across revisions.
//  If none exists the suite FAILS with a clear message; it never silently uses another browser.
function resolveBrowser() {
  if (process.env.CHROME_PATH) return { path: process.env.CHROME_PATH, source: "CHROME_PATH (explicit)" };
  let bundled = "";
  try { bundled = chromium.executablePath(); } catch { /* Playwright has no Chromium path configured */ }
  if (bundled && existsSync(bundled)) return { path: undefined, shown: bundled, source: "playwright-bundled" };
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, "/opt/pw-browsers", join(homedir(), ".cache", "ms-playwright"),
    join(homedir(), "Library", "Caches", "ms-playwright"), process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "ms-playwright")].filter(Boolean);
  for (const root of roots) {
    if (!existsSync(root)) continue;
    const dirs = readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
    for (const d of dirs) for (const rel of [["chrome-linux", "chrome"], ["chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium"], ["chrome-win", "chrome.exe"]]) {
      const p = join(root, d, ...rel);
      if (existsSync(p)) return { path: p, source: `discovered in ${root} (Playwright's own Chromium path not present)` };
    }
  }
  return null;
}
const resolved = resolveBrowser();
if (!resolved) {
  console.error("No Chromium executable found. Run `npx playwright install chromium`, set PLAYWRIGHT_BROWSERS_PATH, or set CHROME_PATH.");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(`${outDir}/results.json`, JSON.stringify({ suite: "foundation-preview", tag, url, emulation: process.env.EMULATE ?? null, browser: null, browserExecutable: null, browserSource: "none found", widths: WIDTHS, results: [{ name: "browser executable found", ok: false, detail: "no Chromium found" }] }, null, 2));
  process.exit(1);
}
const browser = await chromium.launch(resolved.path ? { executablePath: resolved.path } : {});
console.log("Browser executable:", resolved.path ?? resolved.shown, "| source:", resolved.source);
const version = browser.version();
console.log("Browser:", version);
const results = [];
if (process.env.EXPECT_MAJOR) {
  // proves the intended Chrome version was really the one driven
  results.push({ name: `browser major version is ${process.env.EXPECT_MAJOR}`, ok: version.split(".")[0] === process.env.EXPECT_MAJOR, detail: version });
}
let failed = results.filter((r) => !r.ok).length;
const check = (name, ok, detail = "") => { results.push({ name, ok, detail }); if (!ok) failed++; };

for (const w of WIDTHS) {
  // fresh context per width: no shared HTTP cache, so the font request is always observable
  const emu = process.env.EMULATE === "android"
    ? { userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36", isMobile: true, hasTouch: true, deviceScaleFactor: 2.625 }
    : {}; // EMULATE=android is an emulation (touch, mobile viewport, UA), not a real Android device
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, ...emu });
  const page = await ctx.newPage();
  const requests = [];
  let fontResp = null;
  page.on("request", (r) => requests.push(r.url()));
  page.on("response", (r) => { if (r.url().includes("/fonts/PlusJakartaSans-VariableFont_wght.ttf")) fontResp = r; });
  const problems = [];
  page.on("console", (m) => m.type() === "error" && problems.push("console: " + m.text().slice(0, 140)));
  page.on("pageerror", (e) => problems.push("pageerror: " + String(e).slice(0, 140)));
  page.on("requestfailed", (r) => problems.push("requestfailed: " + r.url().slice(0, 140)));
  page.on("response", (r) => r.status() >= 400 && problems.push(`HTTP ${r.status()}: ${r.url().slice(0, 140)}`));
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const m = await page.evaluate((vars) => {
    const r = getComputedStyle(document.documentElement);
    return {
      overflow: document.documentElement.scrollWidth - innerWidth,
      fontLoaded: [...document.fonts].some((f) => f.family.includes("Jakarta") && f.status === "loaded"),
      bodyFont: getComputedStyle(document.body).fontFamily,
      rcard: r.getPropertyValue("--r-card").trim(),
      iconW: (document.querySelector('#f-ic ~ ul li svg') || {getBoundingClientRect: () => ({width: 0})}).getBoundingClientRect().width,
      logoW: (document.querySelector('#f-logo')?.previousElementSibling || {getBoundingClientRect: () => ({width: 0})}).getBoundingClientRect().width,
      borderStyle: (() => { const e = document.querySelector('#f-col ~ ul li'); return e ? getComputedStyle(e).borderTopStyle + ' ' + getComputedStyle(e).borderTopWidth : 'none'; })(),
      icons: document.querySelectorAll("#f-ic ~ ul li svg").length,
      vars: Object.fromEntries(Object.keys(vars).map((k) => [k, r.getPropertyValue(k).trim().toLowerCase()])),
    };
  }, EXPECT_VARS);
  check(`${w}px no horizontal overflow`, m.overflow <= 0, `overflow=${m.overflow}`);
  check(`${w}px Plus Jakarta Sans loaded (local)`, m.fontLoaded && /Plus Jakarta Sans/.test(m.bodyFont), m.bodyFont);
  check(`${w}px utilities override base svg rule (icon grid 28px, logo 40px)`, Math.round(m.iconW) === 28 && Math.round(m.logoW) === 40, `grid ${m.iconW}px, logo ${m.logoW}px (base rule alone would give 20px)`);
  check(`${w}px border utility renders a visible solid border`, m.borderStyle === "solid 1px", m.borderStyle);
  check(`${w}px 35 icons rendered`, m.icons === 35, `found ${m.icons}`);
  for (const [k, v] of Object.entries(EXPECT_VARS)) check(`${w}px token ${k}`, hex(m.vars[k]) === hex(v), m.vars[k]);
  // responsive token: 6px below 640px, 12px from 640px (original @media rule)
  check(`${w}px token --r-card (responsive)`, m.rcard === (w >= 640 ? "12px" : "6px"), m.rcard);
  // font provenance: served from our own origin, 200, byte-identical (sha256) to the local file
  let fontOk = false, fontDetail = !LOCAL_SHA ? `${FONT_PATH} not found (run from the project root)` : "no request for the local font file was observed";
  if (fontResp && LOCAL_SHA) {
    const body = await fontResp.body();
    const sha = createHash("sha256").update(body).digest("hex");
    const sameOrigin = pageIsHttp ? new URL(fontResp.url()).host === pageHost : true;
    fontOk = fontResp.status() === 200 && sameOrigin && sha === LOCAL_SHA && body.length === fontBuf.length;
    fontDetail = `${fontResp.url()} -> ${fontResp.status()}, ${body.length} B, sha256 ${sha.slice(0, 12)} vs local ${LOCAL_SHA.slice(0, 12)}`;
  }
  check(`${w}px font served from local file (byte-identical, same origin)`, fontOk, fontDetail);
  const external = requests.filter((u) => /^https?:/.test(u) && (!pageIsHttp || new URL(u).host !== pageHost));
  check(`${w}px no external requests (no Google Fonts/CDN)`, external.length === 0, external.slice(0, 5).join(" | "));
  check(`${w}px no console/network errors`, problems.length === 0, problems.join(" | "));
  await page.screenshot({ path: `${outDir}/${w}.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
writeFileSync(`${outDir}/results.json`, JSON.stringify({ suite: "foundation-preview", tag, url, browser: version, browserExecutable: resolved.path ?? resolved.shown, browserSource: resolved.source, widths: WIDTHS, fontSha256: LOCAL_SHA, results }, null, 2));
const bad = results.filter((r) => !r.ok);
console.log(`${results.length - bad.length}/${results.length} checks passed`);
for (const b of bad) console.log("FAIL:", b.name, "-", b.detail);
process.exit(failed ? 1 : 0);
