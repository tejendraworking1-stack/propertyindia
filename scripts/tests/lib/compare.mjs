// Shared helpers for the homepage comparison suites (Part 2). Same rules as foundation.mjs / homepage-part1.mjs.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const WIDTHS = [320, 360, 380, 414, 430, 639, 768, 1024, 1280, 1440];

export function resolveBrowser() {
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

/** The original HTML is served over http (so it is a secure context like production) on a random local port. */
export async function startReferenceServer(file) {
  const html = readFileSync(file);
  const server = createServer((req, res) => {
    if (req.url === "/" || req.url?.startsWith("/?")) { res.setHeader("content-type", "text/html; charset=utf-8"); res.end(html); return; }
    res.statusCode = 404; res.end("not found");
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { url: `http://127.0.0.1:${server.address().port}/`, close: () => server.close() };
}

export function fontCss() {
  const f = "public/fonts/PlusJakartaSans-VariableFont_wght.ttf";
  return existsSync(f)
    ? `@font-face{font-family:'Plus Jakarta Sans';src:url(data:font/ttf;base64,${readFileSync(f).toString("base64")}) format('truetype');font-weight:200 800;font-style:normal;font-display:block}`
    : "";
}

/** Pixel comparison inside the browser (no image libraries). Counts pixels differing by more than `delta` per channel. */
export async function diffPng(diffPage, a, b, delta = 32) {
  return diffPage.evaluate(async ([x, y, d]) => {
    const load = (s) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = `data:image/png;base64,${s}`; });
    const [A, B] = await Promise.all([load(x), load(y)]);
    const w = Math.min(A.width, B.width), h = Math.min(A.height, B.height);
    const get = (img) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.drawImage(img, 0, 0); return g.getImageData(0, 0, w, h).data; };
    const da = get(A), db = get(B);
    let n = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let i = 0; i < da.length; i += 4) {
      if (Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])) > d) {
        n++; const p = i / 4, px = p % w, py = (p - px) / w;
        if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
      }
    }
    return { sizeA: [A.width, A.height], sizeB: [B.width, B.height], changed: n, pct: +(100 * n / (w * h)).toFixed(3), bbox: n ? [x0, y0, x1, y1] : null };
  }, [a.toString("base64"), b.toString("base64"), delta]);
}
