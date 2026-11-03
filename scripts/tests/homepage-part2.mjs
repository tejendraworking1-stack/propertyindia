// HOMEPAGE PART 2 suite: Popular Locations, Recently Added, How it works, List CTA, Footer, mobile bottom nav, Ask Property AI.
// Compares the page under test with the ORIGINAL HTML (reference/) at 10 widths (layout + pixels) and runs the same
// interactions on both, requiring identical observable results.
//   real Next.js:  node scripts/tests/homepage-part2.mjs --target http://localhost:3100/ --tag dev-bundled-chromium
//   optional:      --ai-target <url of a build with NEXT_PUBLIC_AI_ENDPOINT pointing at a test endpoint> (AI contract tests)
//   env: VERIFY_DIR, CHROME_PATH, EXPECT_MAJOR, PX_LIMIT_PCT (max % differing pixels, default 0.35)
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { WIDTHS as ALL_WIDTHS, diffPng, fontCss, resolveBrowser, startReferenceServer } from "./lib/compare.mjs";

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const TARGET = arg("target", "http://localhost:3000/");
const AI_TARGET = arg("ai-target", "");
const REFERENCE_FILE = arg("reference", "reference/propertyindia-home-v13-contrast.html");
const TAG = arg("tag", "run");
// --widths 320,380 and --only visual|interactions let a long run be split; the default runs everything.
const WIDTHS = arg("widths", "") ? arg("widths", "").split(",").map(Number) : ALL_WIDTHS;
const ONLY = arg("only", "all");
const OUT = `${process.env.VERIFY_DIR ?? "verification"}/homepage-part2/${TAG}`;
const PX_LIMIT_PCT = Number(process.env.PX_LIMIT_PCT ?? 0.35);
const SECTIONS = [["locations", "section.wrap.sec:has(#locs)"], ["recent", "#recent"], ["how", "#how"], ["cta", "#list"], ["footer", "footer.ft"]];
const FLOW = [["featured", "#featured"], ...SECTIONS];
mkdirSync(`${OUT}/visual`, { recursive: true });

const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok: !!ok, detail: String(detail).slice(0, 1500) });
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const diffKeys = (a, b) => {
  if (a === undefined || b === undefined) return "no result";
  const keys = [...new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])].filter((k) => JSON.stringify(a?.[k]) !== JSON.stringify(b?.[k]));
  return keys.slice(0, 3).map((k) => `step "${k}": page ${JSON.stringify(a?.[k])} | original ${JSON.stringify(b?.[k])}`).join(" ;; ");
};

const resolved = resolveBrowser();
if (!resolved) {
  console.error("No Chromium executable found.");
  writeFileSync(`${OUT}/results.json`, JSON.stringify({ suite: "homepage-part2", tag: TAG, browser: null, results: [{ name: "browser executable found", ok: false, detail: "none" }] }, null, 2));
  process.exit(1);
}
const ref = await startReferenceServer(REFERENCE_FILE);
const REFERENCE = ref.url;
const FONT = fontCss();
const targetHost = new URL(TARGET).host;
const browser = await chromium.launch(resolved.path ? { executablePath: resolved.path } : {});
const browserVersion = browser.version();
console.log("Browser:", browserVersion, "| executable:", resolved.path ?? resolved.shown, `[${resolved.source}]`);
if (process.env.EXPECT_MAJOR) check(`browser major version is ${process.env.EXPECT_MAJOR}`, browserVersion.split(".")[0] === process.env.EXPECT_MAJOR, browserVersion);

const external = new Set();
const consoleErrors = [];
async function open(url, width, { isTarget, hideOverlays = false, context = {}, clock = false, height = 900, collectErrors = isTarget } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce", ...context });
  const page = await ctx.newPage();
  await page.route("**/*", (route) => {
    const u = route.request().url();
    if (u.includes("fonts.googleapis.com")) return route.fulfill({ status: 200, contentType: "text/css", body: FONT });
    if (/^https?:/.test(u) && !u.startsWith(REFERENCE) && new URL(u).host !== targetHost && !(AI_TARGET && new URL(u).host === new URL(AI_TARGET).host)) {
      if (isTarget) external.add(u);
      return route.abort();
    }
    return route.continue();
  });
  if (collectErrors) {
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(`${width}px: ${m.text().slice(0, 200)}`); });
    page.on("pageerror", (e) => consoleErrors.push(`${width}px pageerror: ${String(e).slice(0, 200)}`));
  }
  if (clock) await page.clock.install();
  await page.goto(url, { waitUntil: "load" });
  if (hideOverlays) await page.addStyleTag({ content: ".bar,.ai,.aip{display:none!important}" });
  // The approved Featured change (four cards from 1280px, see app/part1-overrides.css) makes that section shorter, which moves
  // everything below it by a fractional pixel and blurs pixel comparisons. The reference gets the same override so that
  // Part 2 sections are compared at identical positions.
  if (!isTarget) await page.addStyleTag({ content: "@media (min-width:1280px){#grid .card{flex:0 0 calc((100% - 48px)/4);min-width:0}}" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  return { ctx, page };
}
const diffPage = await (await browser.newContext()).newPage();

// ---------- 1) layout + pixels at all 10 widths
const visual = [];
for (const w of ONLY === "interactions" ? [] : WIDTHS) {
  const t = await open(TARGET, w, { isTarget: true, hideOverlays: true });
  const r = await open(REFERENCE, w, { isTarget: false, hideOverlays: true });
  const geo = (page) => page.evaluate((flow) => {
    const rect = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { top: b.top + scrollY, bottom: b.bottom + scrollY, h: b.height, w: b.width }; };
    return { rects: Object.fromEntries(flow.map(([n, s]) => [n, rect(s)])), hOverflow: document.documentElement.scrollWidth - innerWidth };
  }, FLOW);
  const gt = await geo(t.page), gr = await geo(r.page);
  check(`${w}px no horizontal overflow (page under test)`, gt.hOverflow <= 0, `overflow ${gt.hOverflow}`);
  for (let i = 1; i < FLOW.length; i++) {
    const [name] = FLOW[i], [prev] = FLOW[i - 1];
    const a = gt.rects[name], b = gr.rects[name];
    const gapT = a.top - gt.rects[prev].bottom, gapR = b.top - gr.rects[prev].bottom;
    const ok = Math.abs(a.h - b.h) <= 1 && Math.abs(a.w - b.w) <= 1 && Math.abs(gapT - gapR) <= 1;
    check(`${w}px layout ${name}: size and spacing equal original (±1px)`, ok, `h ${a.h.toFixed(1)}/${b.h.toFixed(1)}, w ${a.w.toFixed(1)}/${b.w.toFixed(1)}, gap ${gapT.toFixed(1)}/${gapR.toFixed(1)}`);
    const sa = await t.page.locator(SECTIONS.find((s) => s[0] === name)[1]).first().screenshot({ animations: "disabled", caret: "hide" });
    const sb = await r.page.locator(SECTIONS.find((s) => s[0] === name)[1]).first().screenshot({ animations: "disabled", caret: "hide" });
    const d = await diffPng(diffPage, sa, sb);
    const sizeOk = d.sizeA[0] === d.sizeB[0] && Math.abs(d.sizeA[1] - d.sizeB[1]) <= 1;
    visual.push({ width: w, section: name, ...d });
    check(`${w}px pixels ${name}: <= ${PX_LIMIT_PCT}% changed`, sizeOk && d.pct <= PX_LIMIT_PCT, `${d.pct}% changed (${d.changed}px), sizes ${d.sizeA} vs ${d.sizeB}${d.bbox ? ", bbox " + d.bbox : ""}`);
  }
  // whole page, both, for human review (Featured differs from 1280px by design: four cards)
  await t.page.evaluate(() => scrollTo(0, 0)); await r.page.evaluate(() => scrollTo(0, 0));
  writeFileSync(`${OUT}/visual/${w}-page-full.png`, await t.page.screenshot({ fullPage: true }));
  writeFileSync(`${OUT}/visual/${w}-original-full.png`, await r.page.screenshot({ fullPage: true }));
  await t.ctx.close(); await r.ctx.close();

  // fixed elements (bottom bar below 960px, AI button), compared at the top of the page, not hidden
  const t2 = await open(TARGET, w, { isTarget: true }); const r2 = await open(REFERENCE, w, { isTarget: false });
  const barVisible = async (p) => p.evaluate(() => getComputedStyle(document.querySelector(".bar")).display !== "none");
  const bt = await barVisible(t2.page), br = await barVisible(r2.page);
  check(`${w}px bottom nav visibility equals original`, bt === br && bt === (w < 960), `target ${bt}, original ${br}`);
  for (const [name, sel] of [["bottom-nav", ".bar"], ["ai-button", "#aiBtn"]]) {
    if (name === "bottom-nav" && !bt) continue;
    const a = await t2.page.locator(sel).screenshot({ animations: "disabled" });
    const b = await r2.page.locator(sel).screenshot({ animations: "disabled" });
    const d = await diffPng(diffPage, a, b);
    visual.push({ width: w, section: name, ...d });
    check(`${w}px pixels ${name}: <= ${PX_LIMIT_PCT}% changed`, d.sizeA[0] === d.sizeB[0] && d.sizeA[1] === d.sizeB[1] && d.pct <= PX_LIMIT_PCT, `${d.pct}% changed, sizes ${d.sizeA} vs ${d.sizeB}`);
  }
  await t2.ctx.close(); await r2.ctx.close();
}

// ---------- 2) interactions: identical observable results on the page under test and on the original
const scenarios = {
  footerAccordion: async (page) => {
    const st = () => page.evaluate(() => ({ js: document.querySelector("footer.ft").classList.contains("js-acc"), cols: [...document.querySelectorAll(".ft-h")].map((b) => [b.getAttribute("aria-expanded"), b.tabIndex, b.getAttribute("aria-disabled")]), open: [...document.querySelectorAll(".ft-col")].map((c) => c.classList.contains("open")) }));
    const o = { initial: await st() };
    await page.locator("#fh-explore").scrollIntoViewIfNeeded();
    await page.click("#fh-explore", { force: true }); o.explore = await st();
    await page.click("#fh-company", { force: true }); o.company = await st();
    await page.click("#fh-company", { force: true }); o.closed = await st();
    return o;
  },
  footerLanguage: async (page) => {
    const st = () => page.evaluate(() => { const p = document.getElementById("ftLangP"); return { hidden: p.hidden, exp: document.getElementById("ftLangBtn").getAttribute("aria-expanded"), top: Math.round(parseFloat(p.style.top) || 0), left: Math.round(parseFloat(p.style.left) || 0), text: p.hidden ? null : p.innerText.replace(/\s+/g, " ").trim() }; });
    await page.locator("#ftLangBtn").scrollIntoViewIfNeeded();
    const o = { initial: await st() };
    await page.click("#ftLangBtn"); o.open = await st();
    await page.keyboard.press("Escape"); o.esc = await st(); o.focus = await page.evaluate(() => document.activeElement.id);
    await page.click("#ftLangBtn"); await page.locator("#ftLangP .lang-o").click(); o.option = await st(); o.focus2 = await page.evaluate(() => document.activeElement.id);
    await page.click("#ftLangBtn"); await page.mouse.click(5, 5); o.outside = await st();
    return o;
  },
  recentFavourites: async (page) => {
    const st = () => page.evaluate(() => [...document.querySelectorAll("#raList .ra-fav")].map((f) => f.getAttribute("aria-pressed")));
    const o = { initial: await st() };
    await page.locator("#raList .ra-fav").nth(2).scrollIntoViewIfNeeded();
    await page.locator("#raList .ra-fav").nth(2).click({ force: true }); o.one = await st();
    await page.locator("#raList .ra-fav").nth(2).click({ force: true }); o.two = await st();
    return o;
  },
  locationsSlider: async (page) => {
    const st = () => page.evaluate(() => { const l = document.getElementById("locs"), d = l.nextElementSibling; return { scrolls: l.scrollWidth > l.clientWidth + 2, dots: d ? { hidden: d.hidden, count: d.children.length, current: [...d.children].findIndex((c) => c.getAttribute("aria-current") === "true") } : null, cards: l.children.length }; });
    const o = { initial: await st() };
    await page.evaluate(() => document.getElementById("locs").scrollTo({ left: 99999 })); await page.waitForTimeout(300); o.end = await st();
    const first = page.locator("#locs + .sl-dots .sl-dot").first();
    if (await first.count()) { await first.click({ force: true }); await page.waitForTimeout(300); o.dotClick = await st(); }
    return o;
  },
  bottomBar: async (page) => {
    const hid = () => page.evaluate(() => document.body.classList.contains("bar-hid"));
    const o = { initial: await hid() };
    const go = async (y) => { await page.evaluate((v) => scrollTo({ top: v, behavior: "instant" }), y); await page.waitForTimeout(150); return hid(); };
    o.down = await go(700); o.down2 = await go(1100); o.up = await go(900); o.top = await go(10);
    o.down3 = await go(900); await page.focus('.bar a[href="#search"]'); o.focus = await hid();
    o.bottom = await go(99999);
    return o;
  },
  storeButtons: async (page) => {
    const st = () => page.evaluate(() => ({ hidden: document.getElementById("appNote").hidden, text: document.getElementById("appNote").textContent }));
    const o = { initial: await st() };
    await page.locator(".store-and").scrollIntoViewIfNeeded();
    await page.click(".store-and", { force: true }); o.android = await st();
    await page.click(".store-ios", { force: true }); o.ios = await st();
    return o;
  },
  aiPanel: async (page) => {
    const st = () => page.evaluate(() => ({ hidden: document.getElementById("aiPanel").hidden, exp: document.getElementById("aiBtn").getAttribute("aria-expanded"), focus: document.activeElement.id || document.activeElement.className, sug: document.getElementById("aipSug").hidden, msgs: [...document.querySelectorAll("#aipLog .aip-msg")].map((m) => `${m.className}|${m.textContent}`), send: document.getElementById("aipSend").disabled, input: document.getElementById("aipIn").disabled, val: document.getElementById("aipIn").value }));
    const o = { initial: await st() };
    await page.click("#aiBtn"); o.open = await st();
    await page.click("#aipSug button >> nth=0"); o.suggestion = await st();
    await page.fill("#aipIn", "hello there"); await page.press("#aipIn", "Enter"); o.typed = await st();
    await page.keyboard.press("Escape"); o.esc = await st();
    await page.click("#aiBtn"); await page.click("#aipClose"); o.closeBtn = await st();
    await page.click("#aiBtn"); await page.fill("#aipIn", "   "); await page.press("#aipIn", "Enter"); o.blank = await st();
    return o;
  },
  aiOffline: async (page) => {
    await page.click("#aiBtn");
    const net = () => page.evaluate(() => ({ hidden: document.getElementById("aipNet").hidden, text: document.getElementById("aipNet").textContent }));
    const o = { online: await net() };
    await page.context().setOffline(true); await page.waitForTimeout(200); o.offline = await net();
    await page.context().setOffline(false); await page.waitForTimeout(200); o.back = await net();
    return o;
  },
  aiDrag: async (page) => {
    const st = () => page.evaluate(() => { const b = document.getElementById("aiBtn"); return { left: Math.round(parseFloat(b.style.left) || -1), top: Math.round(parseFloat(b.style.top) || -1), exp: b.getAttribute("aria-expanded"), drag: b.classList.contains("drag"), panelHidden: document.getElementById("aiPanel").hidden }; });
    const box = await page.locator("#aiBtn").boundingBox();
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    const o = { initial: await st() };
    await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx - 60, cy - 90, { steps: 6 }); o.during = await st();
    await page.mouse.up(); o.after = await st();
    await page.waitForTimeout(50);
    return o;
  },
  anchors: async (page) => {
    const o = {};
    for (const href of ["#how", "#list", "#search"]) {
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await page.click(`.top .nav a[href="${href}"], .top a.btn[href="${href}"]`, { force: true }).catch(() => page.evaluate((h) => { location.hash = h; }, href));
      await page.waitForTimeout(250);
      o[href] = Math.round(await page.evaluate(() => scrollY) / 4);
    }
    return o;
  },
};
for (const w of ONLY === "visual" ? [] : [380, 1024]) {
  for (const [name, fn] of Object.entries(scenarios)) {
    if (["bottomBar"].includes(name) && w !== 380) continue;
    if (name === "anchors" && w !== 1024) continue;
    let a, b, err = "";
    try {
      const t = await open(TARGET, w, { isTarget: true }); const r = await open(REFERENCE, w, { isTarget: false });
      a = await fn(t.page); b = await fn(r.page); await t.ctx.close(); await r.ctx.close();
    } catch (e) { err = String(e).slice(0, 300); }
    check(`${w}px interaction "${name}" matches original`, !err && same(a, b), err || (same(a, b) ? "identical" : diffKeys(a, b)));
  }
}
// store note auto-clears after 3.5 s (fake clock)
if (ONLY !== "visual") {
  const run = async (page) => {
    const st = () => page.evaluate(() => document.getElementById("appNote").hidden);
    await page.locator(".store-and").scrollIntoViewIfNeeded(); await page.click(".store-and", { force: true });
    const o = { shown: await st() }; await page.clock.fastForward(3400); o.at3_4s = await st(); await page.clock.fastForward(300); o.at3_7s = await st();
    return o;
  };
  let a, b, err = "";
  try { const t = await open(TARGET, 380, { isTarget: true, clock: true }); const r = await open(REFERENCE, 380, { isTarget: false, clock: true }); a = await run(t.page); b = await run(r.page); await t.ctx.close(); await r.ctx.close(); } catch (e) { err = String(e).slice(0, 300); }
  check('interaction "store note clears after 3.5s" matches original', !err && same(a, b), err || (same(a, b) ? "identical" : diffKeys(a, b)));
}

// ---------- 3) Ask Property AI contract (optional): a build whose endpoint points at a test server
if (AI_TARGET && ONLY !== "visual") {
  const send = async (page, text) => { await page.fill("#aipIn", text); await page.press("#aipIn", "Enter"); };
  const msgs = (page) => page.evaluate(() => [...document.querySelectorAll("#aipLog .aip-msg")].map((m) => `${m.className.replace("aip-msg ", "")}|${m.textContent}`));
  // (console errors are not collected for these pages: HTTP 500 and timeouts are provoked on purpose)
  const sc = async (name, fn) => { let err = "", val; try { const t = await open(AI_TARGET, 1024, { isTarget: true, collectErrors: false, clock: name.includes("timeout") }); await t.page.click("#aiBtn"); val = await fn(t.page); await t.ctx.close(); } catch (e) { err = String(e).slice(0, 300); } return { err, val }; };
  let x = await sc("reply", async (p) => { await send(p, "first"); await p.waitForSelector(".aip-msg.bot:not(.typing):nth-of-type(n+2)", { timeout: 6000 }).catch(() => null); await p.waitForTimeout(300); await send(p, "second"); await p.waitForTimeout(600); return msgs(p); });
  check("AI contract: reply shown; history (previous pair) is sent with the second message", !x.err && x.val.some((m) => m.startsWith("bot|Echo: first")) && x.val.some((m) => m.startsWith("bot|Echo: second") && m.includes("history=2")), x.err || JSON.stringify(x.val).slice(0, 400));
  x = await sc("http error", async (p) => { await send(p, "err please"); await p.waitForTimeout(500); return msgs(p); });
  check("AI contract: HTTP 500 shows the not-connected message", !x.err && x.val.some((m) => m === "err|AI service is not connected yet. Please try again later."), x.err || JSON.stringify(x.val));
  x = await sc("bad response", async (p) => { await send(p, "bad please"); await p.waitForTimeout(500); return msgs(p); });
  check("AI contract: response without a reply shows the not-connected message", !x.err && x.val.some((m) => m === "err|AI service is not connected yet. Please try again later."), x.err || JSON.stringify(x.val));
  x = await sc("timeout", async (p) => { await send(p, "slow please"); await p.waitForTimeout(200); const busy = await p.evaluate(() => [document.getElementById("aipIn").disabled, !!document.querySelector(".aip-msg.typing")]); await p.clock.fastForward(20500); await p.waitForTimeout(300); return { busy, msgs: await msgs(p), after: await p.evaluate(() => document.getElementById("aipIn").disabled) }; });
  check("AI contract: 20s timeout shows the timeout message, input disabled while waiting and enabled after", !x.err && same(x.val.busy, [true, true]) && x.val.msgs.some((m) => m === "err|The AI service took too long to respond. Please try again.") && x.val.after === false, x.err || JSON.stringify(x.val).slice(0, 400));
}

check("no external requests from the page under test (fonts, CDN)", external.size === 0, [...external].slice(0, 5).join(" | "));
check("no console errors / hydration errors on the page under test", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" | "));
await browser.close(); ref.close();
writeFileSync(`${OUT}/results.json`, JSON.stringify({ suite: "homepage-part2", tag: TAG, target: TARGET, aiTarget: AI_TARGET || null, referenceFile: REFERENCE_FILE, browser: browserVersion, browserExecutable: resolved.path ?? resolved.shown, browserSource: resolved.source, widths: WIDTHS, pixelLimitPct: PX_LIMIT_PCT, results, visual }, null, 2));
const bad = results.filter((r) => !r.ok);
console.log(`${results.length - bad.length}/${results.length} checks passed`);
for (const b of bad) console.log("FAIL:", b.name, "-", b.detail);
process.exit(bad.length ? 1 : 0);
