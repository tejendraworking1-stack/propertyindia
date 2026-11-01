#!/usr/bin/env node
// Phase 1 verification orchestrator. Run on an internet-connected machine (Node 20+, Windows or Linux/macOS):
//   node scripts/verify-phase1.mjs
// Chrome 111 is an OPTIONAL backward-compatibility test (never blocks Phase 1). Skip it with SKIP_CHROME_111=1.
// More optional older-Chrome runs:  EXTRA_CHROME_VERSIONS="100 90" node scripts/verify-phase1.mjs
// Required browser: Playwright-pinned Chromium (default 141; PLAYWRIGHT_VERSION / CHROMIUM_MAJOR override).
//
// Every run is kept in its own folder: verification/runs/<UTC-timestamp>/ (nothing is ever deleted).
// The newest run's REPORT.md / ERRORS.md / results.json are also copied to verification/ for convenience,
// and verification/LATEST.txt names the run folder.
// "Phase 1 COMPLETE" is printed only if EVERY required step exists and is PASS. Nothing is PASS by default.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import net from "node:net";
import os from "node:os";

const WIN = process.platform === "win32";
const ROOT_V = "verification";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const V = `${ROOT_V}/runs/${stamp}`;
const PORT = process.env.PORT ?? "3100";
const BASE = `http://localhost:${PORT}`;
const GATE_CHROME = "111"; // optional backward-compat run only
const SKIP_111 = process.env.SKIP_CHROME_111 === "1";
const PW_VERSION = process.env.PLAYWRIGHT_VERSION ?? "1.56.0"; // 1.56.0 ships Chromium 141
const CHROMIUM_MAJOR = process.env.CHROMIUM_MAJOR ?? "141";
const EXTRA = (process.env.EXTRA_CHROME_VERSIONS ?? "").split(/\s+/).filter(Boolean);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(`${V}/logs`, { recursive: true });

// Required steps. Missing, FAIL, SKIPPED or NOT RUN on any of these => NOT COMPLETE.
const N = {
  node: "0-node-version (>= 20)",
  install: "1-npm-install",
  lock: "2a-package-lock.json generated",
  ci: "2b-npm-ci (lockfile reproducible)",
  build: "3-production-build",
  tsc: "4-typescript-check",
  tscCov: "4b-tsconfig coverage (no application TS file excluded)",
  lint: "5-eslint (whole project, 0 errors, 0 warnings)",
  lintSrc: "5b-eslint app + components",
  compat: `6-built-CSS compat scan (min Chrome must be <= ${CHROMIUM_MAJOR})`,
  tw4: "6b-tailwind-4 verification (versions, PostCSS, compiled CSS, utilities)",
  pw: "7a-install-playwright (no-save)",
  chromium: "7b-install-chromium (playwright)",
  chrome111: `7c-download-chrome-${GATE_CHROME} (optional)`,
  devUp: "8-dev-server (server up)",
  devSuite: "foundation-preview suite: dev-bundled-chromium",
  devStop: "8-dev-server (server cleanup)",
  prodUp: "9-production-server (server up)",
  prodSuite: "foundation-preview suite: prod-bundled-chromium",
  c111Suite: `foundation-preview suite: chrome${GATE_CHROME} (optional)`,
  androidSuite: "foundation-preview suite: android-chrome-emulation (informational)",
  prodStop: "9-production-server (server cleanup)",
};
// Chrome 111 and the Android emulation run are NOT required.
const REQUIRED = Object.values(N).filter((n) => !n.includes("(optional)") && !n.includes("(informational)"));

const steps = [];
const errors = []; // {source, text}
let blocker = null; // failed step that makes later steps meaningless

function record(s) {
  steps.push(s);
  console.log(`[${s.status}] ${s.name}${s.detail ? " – " + s.detail : ""}`);
}
function skip(name, gate = true) {
  record({ name, gate, status: "SKIPPED", detail: `blocked by failed step: ${blocker}` });
}
function run(name, cmd, args, { blocks = false, gate = true, env = {} } = {}) {
  if (blocker) return skip(name, gate), false;
  const t = Date.now();
  // shell is needed on Windows so npm.cmd / npx.cmd resolve
  const r = spawnSync(cmd, args, { encoding: "utf8", env: { ...process.env, ...env }, maxBuffer: 1 << 28, shell: WIN });
  const out = (r.stdout ?? "") + (r.stderr ?? "") + (r.error ? `\nspawn error: ${r.error.message}` : "");
  const log = `${V}/logs/${name.replace(/[^a-z0-9._-]+/gi, "_")}.log`;
  writeFileSync(log, `$ ${cmd} ${args.join(" ")}\n\n${out}\n[exit ${r.status}]\n`);
  const ok = r.status === 0;
  record({ name, gate, status: ok ? "PASS" : "FAIL", exit: r.status, ms: Date.now() - t, detail: `exit ${r.status}`, log });
  if (!ok) {
    errors.push({ source: name, text: out.trim().split("\n").slice(-60).join("\n") });
    if (blocks) blocker = name;
  }
  return ok;
}
const portOpen = (port) =>
  new Promise((resolve) => {
    const s = net.connect({ port: Number(port), host: "127.0.0.1" });
    s.setTimeout(1500, () => { s.destroy(); resolve(false); });
    s.once("connect", () => { s.destroy(); resolve(true); });
    s.once("error", () => resolve(false));
  });

// Stops the whole process tree (Windows: taskkill /T /F; POSIX: signal the process group), then
// confirms the port is actually free. Returns true only if the port is free afterwards.
async function stopServer(child) {
  const kill = (sig) => {
    if (!child.pid) return;
    if (WIN) spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { encoding: "utf8" });
    else {
      try { process.kill(-child.pid, sig); } catch {
        try { child.kill(sig); } catch { /* process already exited */ }
      }
    }
  };
  kill("SIGTERM");
  for (let i = 0; i < 20; i++) { if (!(await portOpen(PORT))) return true; await sleep(500); }
  kill("SIGKILL");
  for (let i = 0; i < 10; i++) { if (!(await portOpen(PORT))) return true; await sleep(500); }
  return false;
}

async function withServer(name, upName, stopName, npmArgs, fn) {
  if (blocker) { skip(upName); skip(stopName); return; }
  if (await portOpen(PORT)) {
    // never test against a stale/foreign server
    record({ name: upName, gate: true, status: "FAIL", detail: `port ${PORT} is already in use; free it or set PORT` });
    errors.push({ source: name, text: `Port ${PORT} already in use before start.` });
    skip(stopName); return;
  }
  const log = `${V}/logs/${name}-server.log`;
  const fd = openSync(log, "w");
  const child = spawn("npm", npmArgs, { detached: !WIN, stdio: ["ignore", fd, fd], env: { ...process.env, PORT }, shell: WIN });
  let exited = false;
  child.on("exit", () => { exited = true; });
  let ready = false;
  for (let i = 0; i < 120 && !ready && !exited; i++) {
    try { ready = (await fetch(`${BASE}/dev/foundation`)).ok; } catch { /* server not accepting connections yet */ }
    if (!ready) await sleep(1000);
  }
  if (!ready) {
    record({ name: upName, gate: true, status: "FAIL", detail: exited ? "server process exited early" : "server did not serve /dev/foundation within 120s", log });
    errors.push({ source: name, text: readFileSync(log, "utf8").split("\n").slice(-40).join("\n") });
  } else {
    record({ name: upName, gate: true, status: "PASS", log });
    await fn();
  }
  const freed = await stopServer(child);
  record({ name: stopName, gate: true, status: freed ? "PASS" : "FAIL", detail: freed ? `port ${PORT} freed` : `port ${PORT} STILL OPEN after kill – stop it manually`, log });
  if (!freed) errors.push({ source: stopName, text: `Port ${PORT} still open after attempting to stop the server process tree.` });
  const serverErrs = readFileSync(log, "utf8").split("\n").filter((l) => /\b(error|warn|failed)\b/i.test(l));
  if (serverErrs.length) errors.push({ source: `${name}-server log`, text: serverErrs.slice(0, 40).join("\n") });
}

function foundationSuite(name, tag, { chromePath, expectMajor, gate = true, extraEnv = {} } = {}) {
  const env = { ...process.env, ...extraEnv, VERIFY_DIR: V, ...(chromePath ? { CHROME_PATH: chromePath } : {}), ...(expectMajor ? { EXPECT_MAJOR: expectMajor } : {}) };
  const r = spawnSync("node", ["scripts/tests/foundation.mjs", `${BASE}/dev/foundation`, tag], { encoding: "utf8", env, maxBuffer: 1 << 28 });
  const out = (r.stdout ?? "") + (r.stderr ?? "");
  writeFileSync(`${V}/logs/foundation-${tag}.log`, out);
  let detail = "";
  let ok = r.status === 0;
  const res = `${V}/foundation/${tag}/results.json`;
  if (existsSync(res)) {
    const j = JSON.parse(readFileSync(res, "utf8"));
    const bad = j.results.filter((x) => !x.ok);
    const widths = new Set(j.results.map((x) => (x.name.match(/^(\d+)px/) ?? [])[1]).filter(Boolean)).size;
    if (widths !== 10) { ok = false; bad.push({ name: "all 10 widths tested", detail: `only ${widths} widths produced results` }); }
    detail = `${j.results.length - bad.length}/${j.results.length} checks passed on ${j.browser}; ${widths}/10 widths; executable: ${j.browserExecutable} [${j.browserSource}]`;
    for (const b of bad) errors.push({ source: `foundation/${tag}`, text: `FAILED CHECK: ${b.name} – ${b.detail}` });
    if (bad.length) ok = false;
  } else {
    ok = false;
    detail = "test did not produce results (browser could not launch or connect)";
    errors.push({ source: `foundation/${tag}`, text: out.trim().split("\n").slice(-30).join("\n") });
  }
  record({ name, gate, status: ok ? "PASS" : "FAIL", detail, log: `${V}/logs/foundation-${tag}.log` });
}

// Downloads a specific Chrome build (Chrome for Testing). Returns the executable path or null.
function installChrome(v) {
  const r = spawnSync("npx", ["--yes", "@puppeteer/browsers", "install", `chrome@${v}`, "--path", ".chrome-versions"], { encoding: "utf8", shell: WIN, maxBuffer: 1 << 28 });
  const out = (r.stdout ?? "") + (r.stderr ?? "") + (r.error ? `\nspawn error: ${r.error.message}` : "");
  writeFileSync(`${V}/logs/install-chrome-${v}.log`, `[exit ${r.status}]\n${out}`);
  const line = out.trim().split("\n").filter((l) => l.startsWith(`chrome@${v}`)).pop();
  return { status: r.status, path: r.status === 0 && line ? line.split(" ").slice(1).join(" ").trim() : null, out };
}

// ---------------------------------------------------------------- steps
const sh = (c, a) => (spawnSync(c, a, { encoding: "utf8", shell: WIN }).stdout ?? "").trim();
const env = { node: process.version, npm: sh("npm", ["-v"]), os: `${os.type()} ${os.release()} ${os.arch()}`, date: new Date().toISOString(), runFolder: V };
console.log("Environment:", env);

// 0. Node 20+ is enforced here (and by engines + .npmrc engine-strict)
const major = Number(process.versions.node.split(".")[0]);
record({ name: N.node, gate: true, status: major >= 20 ? "PASS" : "FAIL", detail: `running Node ${process.version}` });
if (major < 20) { errors.push({ source: N.node, text: `Node ${process.version} is not supported. Install Node 20 or newer and re-run.` }); blocker = N.node; }

run(N.install, "npm", ["install"], { blocks: true });
let lockSha = null;
if (!blocker) {
  const hasLock = existsSync("package-lock.json");
  if (hasLock) lockSha = createHash("sha256").update(readFileSync("package-lock.json")).digest("hex");
  record({ name: N.lock, gate: true, status: hasLock ? "PASS" : "FAIL", detail: hasLock ? `sha256 ${lockSha.slice(0, 12)}` : "missing" });
  if (!hasLock) { errors.push({ source: "lockfile", text: "package-lock.json missing after npm install" }); blocker = N.lock; }
} else skip(N.lock);
run(N.ci, "npm", ["ci"], { blocks: true });
run(N.build, "npm", ["run", "build"], { blocks: true });
run(N.tsc, "npm", ["run", "typecheck"]);
run(N.tscCov, "node", ["scripts/tests/tsconfig-coverage.mjs"], { env: { VERIFY_DIR: V } });
if (!run(N.lint, "npm", ["run", "lint"]) && !blocker) {
  // triage data for every error/warning: totals, per folder, per rule (never hidden)
  const rep = spawnSync("node", ["scripts/lint-report.mjs"], { encoding: "utf8", shell: false });
  const sumTxt = (rep.stdout ?? "") + (rep.stderr ?? "");
  writeFileSync(`${V}/logs/5-eslint-triage.log`, sumTxt);
  errors.push({ source: `${N.lint} – triage`, text: sumTxt.trim().split("\n").slice(0, 60).join("\n") });
  for (const f of ["eslint-full.json", "eslint-summary.md"]) if (existsSync(`verification/${f}`)) writeFileSync(`${V}/${f}`, readFileSync(`verification/${f}`));
}
run(N.lintSrc, "npm", ["run", "lint:src"]);

if (!blocker) {
  const r = spawnSync("node", ["scripts/compat-scan.mjs", ".next/static/css"], { encoding: "utf8" });
  const out = (r.stdout ?? "") + (r.stderr ?? "");
  writeFileSync(`${V}/logs/6-compat-scan-built-css.log`, out);
  const m = out.match(/OVERALL minimum Chrome: (\d+)/);
  const min = m ? Number(m[1]) : null;
  record({ name: N.compat, gate: true, status: min !== null && min <= Number(CHROMIUM_MAJOR) ? "PASS" : "FAIL", detail: min === null ? "scan produced no result" : `minimum Chrome implied: ${min}` });
  if (min === null || min > Number(CHROMIUM_MAJOR)) errors.push({ source: "compat-scan", text: out.trim().split("\n").slice(-25).join("\n") });
} else skip(N.compat);
run(N.tw4, "node", ["scripts/tests/tailwind4.mjs"], { env: { VERIFY_DIR: V } });

// 7. browsers: every exit status is recorded
const pwOk = run(N.pw, "npm", ["install", "--no-save", `playwright@${PW_VERSION}`]);
if (pwOk) run(N.chromium, "npx", ["playwright", "install", "chromium"]);
else { if (!blocker) blocker = N.pw; skip(N.chromium); }
let chrome111 = null;
if (SKIP_111) record({ name: N.chrome111, gate: false, status: "NOT RUN", detail: "skipped (SKIP_CHROME_111=1); optional" });
else if (!blocker) {
  const c = installChrome(GATE_CHROME);
  chrome111 = c.path;
  record({ name: N.chrome111, gate: false, status: c.path ? "PASS" : "FAIL", detail: c.path ?? `exit ${c.status}; see logs/install-chrome-${GATE_CHROME}.log (optional, does not block Phase 1)`, log: `${V}/logs/install-chrome-${GATE_CHROME}.log` });
  if (!c.path) errors.push({ source: `${N.chrome111} [optional]`, text: c.out.trim().split("\n").slice(-30).join("\n") });
} else record({ name: N.chrome111, gate: false, status: "NOT RUN", detail: "blocked earlier; optional" });

await withServer("8-dev-server", N.devUp, N.devStop, ["run", "dev"], async () => { foundationSuite(N.devSuite, "dev-bundled-chromium", { expectMajor: CHROMIUM_MAJOR }); });
run("3b-rebuild-before-production-server", "npm", ["run", "build"]);
await withServer("9-production-server", N.prodUp, N.prodStop, ["run", "start"], async () => {
  foundationSuite(N.prodSuite, "prod-bundled-chromium", { expectMajor: CHROMIUM_MAJOR });
  foundationSuite(N.androidSuite, "android-chrome-emulation", { expectMajor: CHROMIUM_MAJOR, gate: false, extraEnv: { EMULATE: "android" } });
  if (chrome111) foundationSuite(N.c111Suite, `chrome${GATE_CHROME}`, { chromePath: chrome111, expectMajor: GATE_CHROME, gate: false });
  else record({ name: N.c111Suite, gate: false, status: "NOT RUN", detail: `Chrome ${GATE_CHROME} not available; optional` });
  for (const v of EXTRA) {
    const c = installChrome(v);
    if (c.path) foundationSuite(`foundation-preview suite: chrome${v} (informational)`, `chrome${v}-info`, { chromePath: c.path, expectMajor: v, gate: false });
    else record({ name: `foundation-preview suite: chrome${v} (informational)`, gate: false, status: "FAIL", detail: "download failed" });
  }
});

record({ name: "10-FULL HOMEPAGE visual + interaction suite", gate: false, status: "NOT RUN", detail: "required in Phase 2 (homepage does not exist yet)" });

// ---------------------------------------------------------------- report
const byName = (n) => steps.find((s) => s.name === n);
const missingOrNotPass = REQUIRED.filter((n) => byName(n)?.status !== "PASS");
const nonPassGating = steps.filter((s) => s.gate !== false && s.status !== "PASS").map((s) => s.name);
const complete = missingOrNotPass.length === 0 && nonPassGating.length === 0;
let md = `# PropertyIndia – Phase 1 verification report\n\n`;
md += `**Phase 1 status: ${complete ? "COMPLETE – all required checks passed" : "NOT COMPLETE – required checks failed, skipped or not run"}**\n\n`;
if (!complete) md += `Not passing: ${[...new Set([...missingOrNotPass, ...nonPassGating])].map((n) => `\`${n}\``).join(", ")}\n\n`;
md += `Environment: Node ${env.node}, npm ${env.npm}, ${env.os}\nRun folder: ${V}\nRun at: ${env.date}\n${lockSha ? `package-lock.json sha256: ${lockSha}\n` : ""}\n`;
md += `## A. Build and tooling (required)\n\n| Step | Result | Detail |\n|---|---|---|\n`;
for (const s of steps.filter((x) => !x.name.startsWith("foundation-preview") && !x.name.startsWith("10-"))) md += `| ${s.name} | ${s.status} | ${s.detail ?? ""}${s.log ? ` (${s.log})` : ""} |\n`;
md += `\n## B1. Foundation-preview suite on Chromium (dev + prod servers) – Phase 1 only, tests /dev/foundation, NOT the homepage\n\nWidths: 320, 360, 380, 414, 430, 639, 768, 1024, 1280, 1440. Per width: no horizontal overflow; Plus Jakarta Sans served from the local font file (byte-identical sha256, same origin); no external requests; 35 icons; original tokens; no console/network errors. The browser executable and how it was chosen are listed per run (CHROME_PATH, Playwright-bundled, or discovered).\n\n| Browser run | Result | Detail |\n|---|---|---|\n`;
for (const s of steps.filter((x) => x.name.startsWith("foundation-preview") && !x.name.includes(`chrome${GATE_CHROME}`))) md += `| ${s.name.replace("foundation-preview suite: ", "")} | ${s.status} | ${s.detail ?? ""} |\n`;
md += `\nScreenshots: ${V}/foundation/<browser>/<width>.png\n`;
const c111step = byName(N.c111Suite);
const c111status = !c111step ? "NOT RUN" : c111step.status === "PASS" ? "PASS" : c111step.status === "FAIL" ? "FAIL" : "NOT RUN";
md += `\n## B2. Chrome ${GATE_CHROME} backward compatibility – OPTIONAL (separate report: CHROME${GATE_CHROME}-REPORT.md)\n\nStatus: **${c111status}** (optional; does not affect the Phase 1 verdict).\n`;
md += `\n## C. Full homepage visual and interaction tests (Phase 2)\n\nStatus: **NOT RUN – required during Phase 2.** Planned: side-by-side comparison with the original HTML at the same 10 widths; four category tabs in order Rent, PG / Hostel, Commercial, Land / Plot with category-specific fields; search validation; menu, language dropdown, sliders (Featured shows all four cards at 1280 and 1440px), favourites, footer accordion, bottom bar, Ask Property AI.\n`;
md += `\n## D. Errors recorded\n\n${errors.length ? `See ERRORS.md (${errors.length} entries).` : "No errors recorded."}\n`;
const dl = byName(N.chrome111);
const c111json = (() => { try { return JSON.parse(readFileSync(`${V}/foundation/chrome${GATE_CHROME}/results.json`, "utf8")); } catch { return null; } })();
const compatStep = byName(N.compat);
let c111 = `# PropertyIndia – Chrome ${GATE_CHROME} compatibility report\n\n**Status: ${c111status}**\n\n`;
c111 += `This test is OPTIONAL backward compatibility. It never affects the Phase 1 verdict.\n\n` + (c111status === "NOT RUN" ? `NOT RUN means no real Chrome ${GATE_CHROME} was driven in this run. Nothing below is a pass.\n\n` : "");
c111 += `| Item | Result |\n|---|---|\n| Chrome ${GATE_CHROME} download | ${dl ? dl.status + " – " + (dl.detail ?? "") : "NOT RUN"} |\n| Browser major version proven = ${GATE_CHROME} | ${c111json ? c111json.results.find((r) => r.name.startsWith("browser major version"))?.ok ? "YES (" + c111json.browser + ")" : "NO (" + c111json.browser + ")" : "NOT RUN"} |\n| Foundation suite, 10 widths | ${c111step ? c111step.status + " – " + (c111step.detail ?? "") : "NOT RUN"} |\n| Built-CSS static scan (min Chrome implied) | ${compatStep ? compatStep.status + " – " + (compatStep.detail ?? "") : "NOT RUN"} |\n\nScreenshots: ${V}/foundation/chrome${GATE_CHROME}/<width>.png (only if the run happened)\n`;
writeFileSync(`${V}/CHROME${GATE_CHROME}-REPORT.md`, c111);
writeFileSync(`${ROOT_V}/CHROME${GATE_CHROME}-REPORT.md`, c111);
const errMd = `# Recorded errors\n\n` + (errors.length ? errors.map((e) => `## ${e.source}\n\n\`\`\`\n${e.text}\n\`\`\`\n`).join("\n") : "None.\n");
const resJson = JSON.stringify({ env, complete, requiredNotPassing: missingOrNotPass, lockSha256: lockSha, steps, errorCount: errors.length }, null, 2);
writeFileSync(`${V}/REPORT.md`, md);
writeFileSync(`${V}/ERRORS.md`, errMd);
writeFileSync(`${V}/results.json`, resJson);
// convenience copies of the newest run (earlier runs stay untouched in verification/runs/)
writeFileSync(`${ROOT_V}/REPORT.md`, md);
writeFileSync(`${ROOT_V}/ERRORS.md`, errMd);
writeFileSync(`${ROOT_V}/results.json`, resJson);
writeFileSync(`${ROOT_V}/LATEST.txt`, `${V}\n`);
console.log(`\nPhase 1 ${complete ? "COMPLETE" : "NOT COMPLETE"} – see ${V}/REPORT.md and ${V}/ERRORS.md`);
process.exit(complete ? 0 : 1);
