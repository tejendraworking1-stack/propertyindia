// HOMEPAGE PART 1 suite: Header, Hero, Search (4 tabs), Why Choose, Featured Properties.
// Compares the page under test against the ORIGINAL HTML (reference/) at 10 widths (pixels + layout) and runs the
// same interactions on both, requiring identical observable results. Works against any URL:
//   real Next.js:  node scripts/tests/homepage-part1.mjs --target http://localhost:3100/ --tag dev-bundled-chromium
//   env: VERIFY_DIR (output root), CHROME_PATH, EXPECT_MAJOR, PX_LIMIT_PCT (max % of differing pixels, default 0.35)
// Approved deviation: Featured Properties at >=1280px shows all four cards (checked separately, not pixel-compared).
import { chromium } from "playwright";
import { createServer } from "node:http";
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const TARGET = arg("target", "http://localhost:3000/");
const REFERENCE_FILE = arg("reference", "reference/propertyindia-home-v13-contrast.html");
const TAG = arg("tag", "run");
const OUT = `${process.env.VERIFY_DIR ?? "verification"}/homepage-part1/${TAG}`;
const WIDTHS = [320, 360, 380, 414, 430, 639, 768, 1024, 1280, 1440];
const PX_LIMIT_PCT = Number(process.env.PX_LIMIT_PCT ?? 0.35);
const DELTA = 32; // per-channel difference that counts as a changed pixel
const SECTIONS = [["header", ".top"], ["hero", ".hero"], ["search", "#searchModule"], ["why-choose", "div.wrap.sec:has(.trust)"], ["featured", "#featured"]];
const KEEP_MAX_FEATURED = 1280; // from this width the Featured section is an approved deviation
mkdirSync(`${OUT}/visual`, { recursive: true });

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail: String(detail).slice(0, 600) });
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------- browser selection (same rules as foundation.mjs; recorded in results.json)
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
      if (existsSync(p)) return { path: p, source: `discovered in ${root}` };
    }
  }
  return null;
}
const resolved = resolveBrowser();
if (!resolved) {
  console.error("No Chromium executable found.");
  writeFileSync(`${OUT}/results.json`, JSON.stringify({ suite: "homepage-part1", tag: TAG, browser: null, results: [{ name: "browser executable found", ok: false, detail: "none" }] }, null, 2));
  process.exit(1);
}
const FONT_PATH = "public/fonts/PlusJakartaSans-VariableFont_wght.ttf";
const FONT_CSS = existsSync(FONT_PATH)
  ? `@font-face{font-family:'Plus Jakarta Sans';src:url(data:font/ttf;base64,${readFileSync(FONT_PATH).toString("base64")}) format('truetype');font-weight:200 800;font-style:normal;font-display:block}`
  : "";

// ---------- serve the ORIGINAL html over http (so both pages are secure contexts, same as production)
const refHtml = readFileSync(REFERENCE_FILE);
const refServer = createServer((req, res) => {
  if (req.url === "/" || req.url?.startsWith("/?")) { res.setHeader("content-type", "text/html; charset=utf-8"); res.end(refHtml); return; }
  res.statusCode = 404; res.end("not found");
});
await new Promise((r) => refServer.listen(0, "127.0.0.1", r));
const REFERENCE = `http://127.0.0.1:${refServer.address().port}/`;
const targetHost = new URL(TARGET).host;

const browser = await chromium.launch(resolved.path ? { executablePath: resolved.path } : {});
const browserVersion = browser.version();
console.log("Browser:", browserVersion, "| executable:", resolved.path ?? resolved.shown, `[${resolved.source}]`);
if (process.env.EXPECT_MAJOR) check(`browser major version is ${process.env.EXPECT_MAJOR}`, browserVersion.split(".")[0] === process.env.EXPECT_MAJOR, browserVersion);

const external = new Set();
const consoleErrors = [];
async function open(url, width, { isTarget, context = {}, clock = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce", ...context });
  const page = await ctx.newPage();
  await page.route("**/*", (route) => {
    const u = route.request().url();
    if (u.includes("fonts.googleapis.com")) return route.fulfill({ status: 200, contentType: "text/css", body: FONT_CSS });
    if (/^https?:/.test(u) && !u.startsWith(REFERENCE) && new URL(u).host !== targetHost) {
      if (isTarget && !u.includes("nominatim.openstreetmap.org")) external.add(u);
      return route.abort();
    }
    return route.continue();
  });
  if (isTarget) {
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(`${width}px: ${m.text().slice(0, 200)}`); });
    page.on("pageerror", (e) => consoleErrors.push(`${width}px pageerror: ${String(e).slice(0, 200)}`));
  }
  if (clock) await page.clock.install();
  await page.goto(url, { waitUntil: "load" });
  // Comparison only: the ORIGINAL also contains Part 2 elements (mobile bottom bar, Ask Property AI) that overlay the
  // sections above them. They are not part of Part 1, so they are hidden on the reference page.
  if (!isTarget) await page.addStyleTag({ content: ".bar,.ai,.aip{display:none!important}" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  return { ctx, page };
}

// ---------- pixel comparison done inside the browser (no image libraries needed)
const diffPage = await (await browser.newContext()).newPage();
async function diffPng(a, b) {
  return diffPage.evaluate(async ([x, y, delta]) => {
    const load = (s) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = `data:image/png;base64,${s}`; });
    const [A, B] = await Promise.all([load(x), load(y)]);
    const w = Math.min(A.width, B.width), h = Math.min(A.height, B.height);
    const get = (img) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.drawImage(img, 0, 0); return g.getImageData(0, 0, w, h).data; };
    const da = get(A), db = get(B);
    let n = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let i = 0; i < da.length; i += 4) {
      if (Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])) > delta) {
        n++; const p = i / 4, px = p % w, py = (p - px) / w;
        if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
      }
    }
    return { sizeA: [A.width, A.height], sizeB: [B.width, B.height], changed: n, pct: +(100 * n / (w * h)).toFixed(3), bbox: n ? [x0, y0, x1, y1] : null };
  }, [a.toString("base64"), b.toString("base64"), DELTA]);
}

// ---------- 1) layout + pixels at all 10 widths
const visual = [];
for (const w of WIDTHS) {
  const t = await open(TARGET, w, { isTarget: true });
  const r = await open(REFERENCE, w, { isTarget: false });
  const metrics = (page) => page.evaluate((sections) => {
    const rect = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.top + scrollY), Math.round(b.height * 10) / 10, Math.round(b.width * 10) / 10]; };
    const small = document.querySelector(".logo small");
    return { rects: Object.fromEntries(sections.map(([n, s]) => [n, rect(s)])), taglinePx: small ? Math.round(parseFloat(getComputedStyle(small).fontSize) * 10) / 10 : null,
      hOverflow: document.documentElement.scrollWidth - innerWidth };
  }, SECTIONS);
  const mt = await metrics(t.page), mr = await metrics(r.page);
  check(`${w}px no horizontal overflow (page under test)`, mt.hOverflow <= 0, `overflow ${mt.hOverflow}`);
  check(`${w}px tagline font size equals original`, mt.taglinePx === mr.taglinePx, `${mt.taglinePx}px vs ${mr.taglinePx}px`);
  for (const [name, sel] of SECTIONS) {
    const deviation = name === "featured" && w >= KEEP_MAX_FEATURED;
    if (!deviation) {
      const a = mt.rects[name], b = mr.rects[name];
      const geo = a && b && Math.abs(a[0] - b[0]) <= 1 && Math.abs(a[1] - b[1]) <= 1 && Math.abs(a[2] - b[2]) <= 1;
      check(`${w}px layout ${name}: position and size equal original (±1px)`, geo, `${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
    }
    const sa = await t.page.locator(sel).first().screenshot({ animations: "disabled", caret: "hide" });
    const sb = await r.page.locator(sel).first().screenshot({ animations: "disabled", caret: "hide" });
    if (deviation) { visual.push({ width: w, section: name, note: "approved deviation (four cards visible), not pixel-compared" }); continue; }
    const d = await diffPng(sa, sb);
    const sizeOk = d.sizeA[0] === d.sizeB[0] && Math.abs(d.sizeA[1] - d.sizeB[1]) <= 1;
    visual.push({ width: w, section: name, ...d });
    check(`${w}px pixels ${name}: <= ${PX_LIMIT_PCT}% changed`, sizeOk && d.pct <= PX_LIMIT_PCT, `${d.pct}% changed (${d.changed}px), sizes ${d.sizeA} vs ${d.sizeB}${d.bbox ? ", bbox " + d.bbox : ""}`);
  }
  // full Part 1 strip, both pages, for human review (scroll to top first: the header is sticky)
  await t.page.evaluate(() => scrollTo(0, 0));
  await r.page.evaluate(() => scrollTo(0, 0));
  await t.page.waitForTimeout(150);
  const clipH = async (page) => page.evaluate(() => Math.ceil(document.querySelector("#featured").getBoundingClientRect().bottom + scrollY));
  const ht = await clipH(t.page), hr = await clipH(r.page);
  writeFileSync(`${OUT}/visual/${w}-page.png`, await t.page.screenshot({ clip: { x: 0, y: 0, width: w, height: ht }, fullPage: true }));
  writeFileSync(`${OUT}/visual/${w}-original.png`, await r.page.screenshot({ clip: { x: 0, y: 0, width: w, height: hr }, fullPage: true }));

  // approved deviation + slider behaviour of Featured
  const feat = await t.page.evaluate(() => {
    const g = document.getElementById("grid"), gr = g.getBoundingClientRect();
    const cards = [...g.querySelectorAll(".card")].map((c) => { const b = c.getBoundingClientRect(); return { l: b.left - gr.left, r: b.right - gr.right }; });
    const dots = g.nextElementSibling;
    return { count: cards.length, allInside: cards.every((c) => c.l >= -1 && c.r <= 1), noScroll: g.scrollWidth <= g.clientWidth + 1, dotsHidden: !!dots && dots.hidden, widths: [...g.querySelectorAll(".card")].map((c) => Math.round(c.getBoundingClientRect().width)) };
  });
  if (w >= KEEP_MAX_FEATURED) check(`${w}px Featured: all 4 cards fully visible, no cropping, dots hidden`, feat.count === 4 && feat.allInside && feat.noScroll && feat.dotsHidden, JSON.stringify(feat));
  else {
    const featRef = await r.page.evaluate(() => { const g = document.getElementById("grid"); return { scroll: g.scrollWidth > g.clientWidth + 1, count: g.querySelectorAll(".card").length }; });
    check(`${w}px Featured: slider behaviour equals original (below 1280px)`, feat.count === featRef.count && (!feat.noScroll) === featRef.scroll, JSON.stringify({ feat, featRef }));
  }
  const tabs = await t.page.evaluate(() => [...document.querySelectorAll("#smTabs .tab .tl")].map((e) => e.textContent));
  check(`${w}px four category tabs in original order`, same(tabs, ["Rent", "PG / Hostel", "Commercial", "Land / Plot"]), JSON.stringify(tabs));
  await t.ctx.close(); await r.ctx.close();
}

// ---------- 2) interactions: identical observable results on the page under test and the original
const scenarios = {
  menu: async (page) => {
    const st = () => page.evaluate(() => ({ mm: document.getElementById("mainMenu").hidden, scrim: document.getElementById("mmScrim").hidden, top: document.querySelector(".top").classList.contains("menu-open"), exp: document.querySelector(".top .menu").getAttribute("aria-expanded"), label: document.querySelector(".top .menu").getAttribute("aria-label") }));
    const o = { initial: await st() };
    await page.click(".top .menu"); o.open = await st();
    await page.keyboard.press("Escape"); o.esc = await st(); o.focus = await page.evaluate(() => document.activeElement.className);
    await page.click(".top .menu"); await page.mouse.click(5, 880); o.outside = await st();
    await page.click(".top .menu"); const y0 = await page.evaluate(() => scrollY);
    await page.click('#mainMenu a.mm-it[href="#"]'); o.item = await st(); o.noJump = (await page.evaluate(() => scrollY)) === y0;
    await page.click(".top .menu"); await page.click('#mainMenu a.mm-it[href="#search"]'); o.searchLink = await st();
    return o;
  },
  language: async (page) => {
    const st = () => page.evaluate(() => { const p = document.getElementById("langP"); return { hidden: p.hidden, exp: document.getElementById("langBtn").getAttribute("aria-expanded"), top: Math.round(parseFloat(p.style.top) || 0), left: Math.round(parseFloat(p.style.left) || 0), text: p.hidden ? null : p.innerText.replace(/\s+/g, " ").trim() }; });
    const o = { initial: await st() };
    await page.click("#langBtn"); o.open = await st();
    await page.keyboard.press("Escape"); o.esc = await st(); o.focus = await page.evaluate(() => document.activeElement.id);
    await page.click("#langBtn"); await page.click(".lang-o"); o.option = await st(); o.focus2 = await page.evaluate(() => document.activeElement.id);
    await page.click("#langBtn"); await page.mouse.click(5, 880); o.outside = await st();
    return o;
  },
  tabs: async (page) => {
    const o = {};
    for (const k of ["pg", "commercial", "land", "rent"]) {
      await page.click(`#smTabs .tab[data-t="${k}"]`);
      o[k] = await page.evaluate(() => ({ sel: [...document.querySelectorAll("#smTabs .tab")].map((t) => t.getAttribute("aria-selected")), types: [...document.getElementById("ptype").options].map((x) => x.text), extra: [...document.getElementById("bhk").options].map((x) => x.text), label: document.getElementById("bhkL").textContent, button: document.getElementById("sbtn").textContent, ptype: document.getElementById("ptype").value, bhk: document.getElementById("bhk").value }));
    }
    return o;
  },
  rentLock: async (page) => {
    const st = () => page.evaluate(() => { const b = document.getElementById("bhk"); return { disabled: b.disabled, value: b.value, opacity: b.closest(".field").style.opacity }; });
    const o = { initial: await st() };
    await page.selectOption("#bhk", "3 BHK"); await page.selectOption("#ptype", "1 RK"); o.oneRk = await st();
    await page.selectOption("#ptype", "Single Room"); o.single = await st();
    await page.selectOption("#ptype", "Villa"); o.villa = await st();
    return o;
  },
  favourites: async (page) => {
    const st = () => page.evaluate(() => [...document.querySelectorAll("#grid .fav")].map((f) => f.getAttribute("aria-pressed")));
    const o = { initial: await st() };
    await page.locator("#grid .fav").nth(1).click({ force: true }); o.one = await st();
    await page.locator("#grid .fav").nth(1).click({ force: true }); o.two = await st();
    return o;
  },
  sliders: async (page) => {
    const st = () => page.evaluate(() => { const info = (sel) => { const e = document.querySelector(sel), d = e && e.nextElementSibling; return d ? { hidden: d.hidden, count: d.children.length, current: [...d.children].findIndex((c) => c.getAttribute("aria-current") === "true") } : null; }; return { trust: info(".trust"), grid: info("#grid") }; });
    const o = { initial: await st() };
    await page.evaluate(() => { document.getElementById("grid").scrollTo({ left: 99999 }); document.querySelector(".trust").scrollTo({ left: 99999 }); });
    await page.waitForTimeout(300); o.end = await st();
    if (o.initial.grid && !o.initial.grid.hidden) { await page.locator("#grid + .sl-dots .sl-dot").first().click(); await page.waitForTimeout(300); o.dotClick = await st(); }
    return o;
  },
  pairStack: async (page) => {
    const o = {};
    for (const t of ["Any", "Independent Floor", "Flat / Apartment", "Independent House", "Penthouse"]) { await page.selectOption("#ptype", t); await page.waitForTimeout(80); o[t] = await page.evaluate(() => document.querySelector(".pair").classList.contains("pair-stack")); }
    for (const k of ["pg", "commercial", "land"]) { await page.click(`#smTabs .tab[data-t="${k}"]`); await page.selectOption("#ptype", { index: 2 }); await page.waitForTimeout(80); o[k] = await page.evaluate(() => document.querySelector(".pair").classList.contains("pair-stack")); }
    return o;
  },
};
for (const w of [380, 1024]) {
  for (const [name, fn] of Object.entries(scenarios)) {
    if (name === "pairStack" && w !== 380) continue;
    let a, b, err = "";
    try {
      const t = await open(TARGET, w, { isTarget: true }); const r = await open(REFERENCE, w, { isTarget: false });
      a = await fn(t.page); b = await fn(r.page); await t.ctx.close(); await r.ctx.close();
    } catch (e) { err = String(e).slice(0, 300); }
    check(`${w}px interaction "${name}" matches original`, !err && same(a, b), err || (same(a, b) ? "identical" : `target ${JSON.stringify(a)} | original ${JSON.stringify(b)}`));
  }
}
// search validation with a fake clock (5s auto-clear)
{
  const run = async (page) => {
    const st = () => page.evaluate(() => ({ err: !document.getElementById("searchMsg").hidden, info: !document.getElementById("searchInfo").hidden, invalid: document.getElementById("loc").closest(".field").classList.contains("invalid"), ariaInvalid: document.getElementById("loc").getAttribute("aria-invalid"), focus: document.activeElement.id }));
    const o = {}; await page.click("#sf .btn"); o.empty = await st();
    await page.clock.fastForward(5100); o.emptyAfter5s = await st();
    await page.click("#sf .btn"); await page.fill("#loc", "Pune"); o.typing = await st();
    await page.click("#sf .btn"); o.filled = await st();
    await page.clock.fastForward(5100); o.filledAfter5s = await st();
    await page.click("#sf .btn"); await page.fill("#loc", ""); await page.click("#sf .btn"); await page.click('#smTabs .tab[data-t="pg"]'); o.tabClears = await st();
    return o;
  };
  let a, b, err = "";
  try { const t = await open(TARGET, 380, { isTarget: true, clock: true }); const r = await open(REFERENCE, 380, { isTarget: false, clock: true }); a = await run(t.page); b = await run(r.page); await t.ctx.close(); await r.ctx.close(); } catch (e) { err = String(e).slice(0, 300); }
  check('interaction "search validation + 5s clear" matches original', !err && same(a, b), err || (same(a, b) ? "identical" : `target ${JSON.stringify(a)} | original ${JSON.stringify(b)}`));
}
// GPS: denied and success (Nominatim is mocked; no real network request is made)
for (const mode of ["denied", "success"]) {
  const run = async (page) => {
    if (mode === "success") await page.route("https://nominatim.openstreetmap.org/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ address: { suburb: "Whitefield", city: "Bengaluru" } }) }));
    await page.click("#gpsBtn");
    await page.waitForFunction(() => { const m = document.getElementById("gpsMsg"); return !m.hidden && !/Detecting/.test(m.textContent); }, null, { timeout: 8000 });
    return page.evaluate(() => ({ text: document.getElementById("gpsMsg").textContent, err: document.getElementById("gpsMsg").classList.contains("err"), value: document.getElementById("loc").value, link: (document.querySelector("#gpsMsg a") || {}).href || null, busy: document.getElementById("gpsBtn").getAttribute("aria-busy"), ph: document.getElementById("loc").placeholder }));
  };
  const ctxOpts = mode === "success" ? { permissions: ["geolocation"], geolocation: { latitude: 12.9698, longitude: 77.75 } } : {};
  let a, b, err = "";
  try { const t = await open(TARGET, 380, { isTarget: true, context: ctxOpts }); const r = await open(REFERENCE, 380, { isTarget: false, context: ctxOpts }); a = await run(t.page); b = await run(r.page); await t.ctx.close(); await r.ctx.close(); } catch (e) { err = String(e).slice(0, 300); }
  check(`interaction "GPS ${mode}" matches original`, !err && same(a, b), err || (same(a, b) ? JSON.stringify(a) : `target ${JSON.stringify(a)} | original ${JSON.stringify(b)}`));
}

check("no external requests from the page under test (fonts, CDN)", external.size === 0, [...external].slice(0, 5).join(" | "));
check("no console errors / hydration errors on the page under test", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" | "));
await browser.close(); refServer.close();
writeFileSync(`${OUT}/results.json`, JSON.stringify({ suite: "homepage-part1", tag: TAG, target: TARGET, referenceFile: REFERENCE_FILE, browser: browserVersion, browserExecutable: resolved.path ?? resolved.shown, browserSource: resolved.source, widths: WIDTHS, pixelLimitPct: PX_LIMIT_PCT, results, visual }, null, 2));
const bad = results.filter((r) => !r.ok);
console.log(`${results.length - bad.length}/${results.length} checks passed`);
for (const b of bad) console.log("FAIL:", b.name, "-", b.detail);
process.exit(bad.length ? 1 : 0);
