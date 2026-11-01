# Offline results (authoring environment, no internet)

These are REAL executions with real results, but they are NOT Phase 1 gate evidence.
Phase 1 stays NOT COMPLETE until `node scripts/verify-phase1.mjs` passes on a connected machine.

## 1. Foundation suite on Chromium 141 – 150/150 checks passed

| | |
|---|---|
| Browser | Chromium 141.0.7390.37 |
| Executable | `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` |
| How chosen | playwright-bundled (Playwright's own Chromium, already installed in `/opt/pw-browsers`) |
| Widths | 320, 360, 380, 414, 430, 639, 768, 1024, 1280, 1440 (all 10 tested) |
| Results | `foundation/chromium141/results.json` |
| Screenshots | `foundation/chromium141/<width>.png` (10 files) |
| Log | `logs/foundation-chromium141.log` |

Checks per width: no horizontal overflow; Plus Jakarta Sans served from the local font file (200, same origin,
sha256 identical to `public/fonts/PlusJakartaSans-VariableFont_wght.ttf`); no external requests; 35 icons; original
tokens; no console/network errors.

**What was actually tested (be careful what you conclude):** the real `app/dev/foundation/page.tsx` and `Icon`
components rendered to static HTML with `react-dom/server`, styled with CSS compiled from the current
`globals.css` tokens/base rules using the **Tailwind 3.4 fallback config** (Tailwind 4 is not installed here),
served by a tiny Node server (`harness/serve-static-foundation.js`) with the local font file.
**Not** tested: `next dev`, `next build`, `next start`, Next.js metadata from `layout.tsx`, Tailwind 4 output.

## 2. If `playwright install chromium` fails: which executable runs the suite?

`scripts/tests/foundation.mjs` records the executable and why it was chosen in every `results.json`:
1. `CHROME_PATH` if set (used for the Chrome 111 run);
2. else Playwright's own Chromium if it exists;
3. else an already-installed Playwright Chromium discovered in `PLAYWRIGHT_BROWSERS_PATH`, `/opt/pw-browsers`,
   `~/.cache/ms-playwright`, `~/Library/Caches/ms-playwright` or `%LOCALAPPDATA%\\ms-playwright`;
4. else the suite fails with a clear message (it never silently uses another browser).

A failed `playwright install chromium` still makes Phase 1 NOT COMPLETE (step 7b is required), but tests can still
run on a discovered Chromium for diagnosis. Fallback proof (installation path pointed at an empty folder):
`foundation/chromium141-discovered/results.json` -> 150/150 passed, executable `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`,
source "discovered in /opt/pw-browsers (Playwright's own Chromium path not present)". (Screenshots omitted for that run; they are identical in purpose.)

## 3. Chrome 111

See `CHROME111-REPORT.md`: **NOT RUN – OPTIONAL** (does not block Phase 1).
