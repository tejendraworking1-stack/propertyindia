# Phase 1 – fixes, reviews and status (not yet approved)

## 1. Results reported by the owner (their machine; I have not seen the logs)

| Check | Reported |
|---|---|
| Next.js production build | PASS (after adding two tsconfig exclusions) |
| TypeScript | PASS |
| ESLint, `app` + `components` | PASS |
| ESLint, whole project | 187 errors, 4,044 warnings |
| Tailwind CSS 4 packages + generated CSS (initial check) | PASS |
| Production server | PASS |
| Real homepage | scaffold only (Phase 2–5 work) |

These are treated as reported, not as verified by me. Phase 1 stays NOT COMPLETE until one orchestrator run
(`node scripts/verify-phase1.mjs`) passes every required step and its REPORT.md is reviewed.

## 2. tsconfig.json review

Why the two exclusions were needed: my `include` was `**/*.ts` / `**/*.tsx`, so it also swallowed two files that
are not application code and cannot compile in the app's TypeScript project:
- `docs/tailwind-3.4-fallback/tailwind.config.ts` (imports Tailwind 3 types; archived, never built)
- `verification-offline/harness/render-foundation-ssr.tsx` (test harness with relative imports to a temp folder)

Fix (instead of just excluding): `include` is now an explicit allow-list (`app`, `components`, `data`, `hooks`,
`lib`, `next.config.ts`, `next-env.d.ts`, `.next/types`), and `exclude` is limited to
`node_modules`, `docs/tailwind-3.4-fallback`, `verification`, `verification-offline`, `scripts`.
`scripts/` contains only `.mjs` (ESLint-checked, not TypeScript).

Guard so nothing important can silently escape type-checking: `scripts/tests/tsconfig-coverage.mjs` (required
orchestrator step 4b) fails if any application `.ts/.tsx` file is not covered or if `exclude` contains anything
beyond the reviewed list. Currently 6 application files, all covered. Tested offline: PASS on the real tree;
FAIL when a stray `widgets/a.ts` is added; FAIL when `components` is added to `exclude`.

## 3. ESLint (187 errors / 4,044 warnings)

I could not see your ESLint output, so I have not triaged those 187 errors one by one. My hypothesis (unconfirmed):
the whole-project run also linted generated/vendored folders (`.next`, `.chrome-versions`, `verification`,
`public`, the archived fallback) and the Node scripts without Node globals. Changes made, none of which turns a
rule off:
- `eslint.config.mjs`: explicit ignores only for non-source paths (`node_modules, .next, out, build, coverage,
  next-env.d.ts, .chrome-versions, verification, verification-offline, public, docs/tailwind-3.4-fallback`).
  `app`, `components`, `scripts` and all config files ARE linted.
- Scripts/configs now use ESLint's recommended rules with Node globals; browser globals only inside Playwright
  `page.evaluate` callbacks (`scripts/tests/foundation.mjs`).
- Real fixes in my scripts: removed an unused import (`copyFileSync`); three empty `catch {}` blocks now state why
  they are intentionally ignored (found with `tsc --noUnusedLocals`; no ESLint was available offline).
- New dev dependencies needed by that config: `@eslint/js`, `globals`.
- `npm run lint` = `eslint . --max-warnings 0` (whole project, zero warnings). `npm run lint:src` = app + components.
- If anything still fails: `npm run lint:report` writes `verification/eslint-full.json` and
  `eslint-summary.md` (totals, per folder, per rule). The orchestrator runs it automatically on lint failure
  and copies the summary into the run folder and ERRORS.md.

Remaining errors/warnings after your next run: unknown until then. Send `eslint-summary.md` and I will fix every
real issue in application code.

## 4. Tailwind CSS 4 verification

New required step `scripts/tests/tailwind4.mjs` (27 checks) after the production build: installed
`tailwindcss` and `@tailwindcss/postcss` are v4; `postcss.config.mjs` uses `@tailwindcss/postcss`; no `tailwind.config.*`;
`globals.css` has v4 imports, `@theme inline`, no `@tailwind` directives, no preflight import; no application or
build file references `docs/tailwind-3.4-fallback`; the compiled CSS in `.next/static/css` contains the original
tokens, the local `@font-face`, no external URL, no preflight reset, the 640/960 breakpoints, the custom
`shadow-card` / `bg-orange-2` / `rounded-card` mappings, the layer declaration, and every utility class used in
`className` attributes (whole-selector match). The browser suite additionally proves utilities beat the base `svg`
rule (icons 28px / 40px) and that the `border` utility draws a visible border.
Tested offline on fixtures only (script mechanics): positive fixture 27/27; raw Tailwind 3.4 output is detected;
missing utility, v3 config and fallback leakage are detected. This is NOT a Tailwind 4 build result.

## 5. Real-browser suite status

Static-render run on Chromium 141 with the extended suite: 170/170
(`verification-offline/foundation/chromium141-v2/`). Not a Next.js result. The earlier 150/150 run stays for reference.

## 6. Configuration changes (all)

- tsconfig: explicit include list + reviewed excludes (replaces the two ad-hoc exclusions).
- eslint.config.mjs rewritten (see §3); package.json: scripts `lint`, `lint:src`, `lint:report`, `check:tsconfig`;
  devDependencies `@eslint/js`, `globals`.
- Orchestrator: new required steps 4b (tsconfig coverage), 5 (whole-project ESLint, 0 warnings), 5b (ESLint app +
  components), 6b (Tailwind 4 verification). Chrome 111 optional; Chromium 141 required on `next dev` and `next start`.
- No test was skipped, disabled or bypassed.

## 7. What is still needed (cannot be done offline)

1. Merge these files into your repository (your local two tsconfig exclusions are superseded by §2).
2. `node scripts/verify-phase1.mjs` on a connected Node 20+ machine: npm install, package-lock.json, `npm ci`, build,
   typecheck, tsconfig coverage, ESLint, compat scan, Tailwind 4 verification, Playwright/Chromium, `next dev` and
   `next start` suites at all 10 widths on Chromium 141. Optional: Chrome 111.
3. Commit to GitHub only changes that pass: `git add -A && git commit -m "Phase 1: tsconfig/ESLint/Tailwind 4 verification fixes"`
   (I cannot push: no network and no repository access here).
4. Send `verification/REPORT.md`, `ERRORS.md`, `results.json`, `package-lock.json`. Phase 2 starts only after your written approval.
