# PropertyIndia – Next.js migration (Phase 1 scaffold)

Next.js (App Router) · React · TypeScript · Tailwind CSS 4 (target; see docs/TAILWIND-DECISION.md). No backend, auth or API.
Source of truth for design/behaviour: `propertyindia-home-v13-contrast.html`.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint
npm run typecheck
```

## Phase 1 verification (Node 20+, internet required; Windows and Linux/macOS)

```bash
node scripts/verify-phase1.mjs
# optional: SKIP_CHROME_111=1   EXTRA_CHROME_VERSIONS="100 90"   PLAYWRIGHT_VERSION=1.56.0   CHROMIUM_MAJOR=141
```

**Required for Phase 1 (all must PASS):** Node 20+, `npm install`, `package-lock.json`, `npm ci`, production build,
TypeScript check, tsconfig coverage (`npm run check:tsconfig`), ESLint on the whole project with 0 warnings (`npm run lint`;
triage with `npm run lint:report`), ESLint app + components (`npm run lint:src`), Tailwind 4 verification (`scripts/tests/tailwind4.mjs`), Tailwind 4 built-CSS compat scan (minimum Chrome implied must be <= the tested Chromium),
Playwright + Chromium install (exit statuses recorded), and the foundation-preview suite at 10 widths against the
real Next.js `next dev` server and `next start` server on Playwright-pinned **Chromium 141** (the run fails if the
browser major version is not 141). Each server is stopped and its port confirmed free. The suite also proves
Plus Jakarta Sans is served from `public/fonts` (sha256 identical, same origin) and that no external request is made.

**Optional, never blocks Phase 1:** Chrome 111 backward-compatibility run (`CHROME111-REPORT.md`), an Android Chrome
*emulation* run (touch + mobile UA; not a real device), and any `EXTRA_CHROME_VERSIONS`.

Every run is kept in `verification/runs/<UTC timestamp>/` (logs, screenshots, REPORT.md, ERRORS.md, results.json).
The newest run is also copied to `verification/`. "COMPLETE" is only reported if every required step exists and
passed. Commit `package-lock.json` after a successful run. Full homepage visual/interaction tests are Phase 2.

Dev-only foundation preview (fonts, palette, icons): http://localhost:3000/dev/foundation
(delete `app/dev/` before launch).

## Structure

```
app/
  layout.tsx        metadata (title, OG, Twitter, canonical, icons) + viewport (from original <head>)
  page.tsx          placeholder – sections arrive in Phase 2/3
  globals.css       Tailwind layers + ORIGINAL design tokens + original base rules
  fonts.css         local Plus Jakarta Sans @font-face
  dev/foundation/   dev-only preview page
components/ui/
  Icon.tsx          <Icon name="home" /> – renders original SVG icons inline
  icons.tsx         the 35 original sprite icons (path data unchanged)
public/
  fonts/            PlusJakartaSans-VariableFont_wght.ttf + OFL.txt
  images/           13 images extracted byte-identical from the original HTML
  favicon.svg       identical to the original inline favicon
  apple-touch-icon.png, og-image.jpg
scripts/            verify-phase1.mjs (orchestrator; .sh wrapper), tests/foundation.mjs, compat-scan.mjs
docs/               Tailwind decision + verified 3.4 fallback
```

## Rules that keep the design identical

- **Tokens:** all 125 CSS variables (68 colours, incl. `#f58220`, `#174a8b`, `#f28b1c`) live in `app/globals.css`, copied from the original in source order. Do not change values without approval.
- **No Tailwind preflight** (only the `theme` and `utilities` layers are imported in `globals.css`) so browser defaults match the original HTML. Colours, radii, font and breakpoints are mapped to the original variables in the `@theme inline` block. Keep `border-solid` next to `border` until the build is verified.
- **Breakpoints:** the original uses ~22 ad-hoc widths. Only `sm: 640px` and `lg: 960px` are named; use arbitrary variants for others (`min-[1280px]:`, `max-[379px]:`).
- **Icons:** use `<Icon />` only. Do not swap in other icon sets without approval.
- **Font:** local variable font via `@font-face` (weights 200–800). No Google Fonts request.
- **AI chat:** `NEXT_PUBLIC_AI_ENDPOINT` (see `.env.example`). Empty = "AI service is not connected yet." as in the original.
