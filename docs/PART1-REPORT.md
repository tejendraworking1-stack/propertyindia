# Part 1 – delivery and honest testing report

Scope (approved split): Header (logo, nav, hamburger menu, language dropdown), Hero, Search section (four separate
tabs: Rent, PG / Hostel, Commercial, Land / Plot; per-tab fields; validation; GPS), Why Choose PropertyIndia,
Featured Properties (slider, dots, favourites). Part 2 (Popular Locations, Recently Added, How it works, List CTA,
Footer, bottom nav, Ask Property AI) has NOT been started and will not be until you approve Part 1 in writing.

Base: your uploaded `propertyindia-main__1_.zip` (Phase 1, approved) and your original
`propertyindia-home-v13-contrast.html` (identical to the reference used in earlier phases; copy in `reference/`).

## A. What was built

| File | Purpose |
|---|---|
| `app/page.tsx` | Part 1 page: Header, Hero, SearchSection, WhyChoose, FeaturedProperties |
| `components/Header.tsx`, `Logo.tsx`, `LanguageDropdown.tsx` | Header, hamburger menu (items in `data/homepage.ts`), tagline fit, language dropdown |
| `components/Hero.tsx` | Hero (original photo, `next/image`) |
| `components/CategoryTabs.tsx`, `SearchSection.tsx` | Four tabs in original order, form, validation, 5 s messages, GPS |
| `components/WhyChoose.tsx`, `FeaturedProperties.tsx`, `PropertyCard.tsx`, `SliderDots.tsx` | Sections, favourites, slider dots |
| `hooks/useGps.ts`, `usePairStack.ts`, `useSliderIndicators.ts`, `useTaglineFit.ts` | Ports of the original page scripts |
| `data/homepage.ts` | All Part 1 content (properties, search config, menu, trust items) |
| `app/home.css` | The original stylesheet, carried over verbatim (both `<style>` blocks, original order) |
| `app/part1-overrides.css` | The one approved deviation (Featured: four cards at 1280px and wider) |
| `scripts/tests/homepage-part1.mjs` | Part 1 suite: original-vs-page comparison at 10 widths + interactions (works on any URL) |
| `reference/propertyindia-home-v13-contrast.html` | Original homepage, used only as the test reference |

## B. Deliberate differences (nothing else was changed, removed or added)

1. **Featured Properties, 1280px and wider (your decision):** four equal cards (267px each instead of 323px), none cropped,
   dots hidden because nothing scrolls. Below 1280px the original slider is unchanged. In the original, the third tag chip
   of every card collapses to 0 px; this is identical in the new page.
2. **Styling approach:** the original CSS is carried over verbatim (`home.css`) instead of being rewritten into Tailwind
   utilities, because design preservation comes first and I cannot run a visual check of a rewrite inside Next.js here.
   Tailwind 4 stays configured and is used for new work. Converting rules to utilities would be a separate step needing your approval.
3. **Hero/card images:** `next/image` with `unoptimized`, so the served pixels are byte-identical to the original photos.
   Using Next's optimizer would re-encode them (a visible change); also a separate decision.
4. **`app/globals.css`:** added `@source not` lines so Tailwind 4 does not scan the original HTML, docs and scripts for class names.
5. **Links to Part 2 sections** (`#how`, `#list`) have no target yet, so they do nothing until Part 2 exists.
   Placeholder `#` links behave as in the original (menu closes, page does not jump).
6. **Phones (<960px):** the original base CSS reserves 68px at the page bottom for the bottom nav; that nav is Part 2, so an
   empty strip shows at the very bottom until then.
7. **GPS** still calls OpenStreetMap Nominatim directly from the browser (existing original behaviour; no backend).
8. Tabs/labels: unchanged text; "Commercial" remains its own tab, in original order.

## C. Tests

### C1. Static-render / React-harness tests – ACTUALLY RUN (authoring environment, Chromium 141.0.7390.37)

What this is: the real Part 1 components bundled with esbuild, server-rendered and hydrated with React 19 in the browser,
styled with the real token/base rules + `home.css` + overrides, served by a small Node server (`verification-offline/part1/harness/`).
`next/image` is replaced by a plain `<img>`. This is NOT Next.js and NOT Tailwind 4 output.

Result: **155/155 checks passed** (`verification-offline/part1/harness-chromium141/results.json`, `suite.log`).
- 10 widths (320, 360, 380, 414, 430, 639, 768, 1024, 1280, 1440): no horizontal overflow; tagline font size equals the original.
- Layout of header, hero, search, why-choose and featured equals the original within 1px at every width.
- Pixel comparison, 48 section images (5 sections × 10 widths, Featured excluded at 1280/1440): 0% of pixels differ by more than 32/255 in all 48.
- Featured at 1280 and 1440: four cards, 267px wide, all inside the row, no scrolling, dots hidden. Below 1280px the slider matches the original.
- Four tabs in order Rent, PG / Hostel, Commercial, Land / Plot at all widths.
- Interactions give identical results on the new page and on the original HTML: menu (open, Esc + focus, outside click, item click, anchor link), language dropdown,
  all four tabs and their dropdown options, "1 RK / Single Room" locking, favourites, slider dots (scroll and click), select stacking on phones,
  search validation with the 5-second auto-clear (fake clock), GPS denied and GPS success (OpenStreetMap response mocked).
- No console or hydration errors; no external requests (apart from the mocked GPS lookup).
- For comparison only, the original's bottom bar and AI button (Part 2 elements that overlay the page) are hidden on the reference.
Screenshots: `verification-offline/part1/harness-chromium141/visual/<width>-page.png` (new) and `<width>-original.png`.

### C2. Actual Next.js build and browser tests – NOT RUN (no internet here)

| Check | Status |
|---|---|
| `npm ci`, production build | NOT RUN |
| TypeScript type-check (no React type packages available offline) | NOT RUN |
| ESLint (0 warnings required) | NOT RUN |
| Tailwind 4 build with `home.css`, `@source not` lines, `tailwind4.mjs` | NOT RUN |
| `next dev` / `next start`: foundation suite and Part 1 suite at 10 widths on Chromium 141 | NOT RUN |
| Real `next/image`, real hydration in Next | NOT RUN |
| Real Chrome 111 / real Android | NOT RUN (optional) |

Run on your connected machine or GitHub Actions: `node scripts/verify-phase1.mjs`. It now also runs
`scripts/tests/homepage-part1.mjs` against `next dev` and `next start` (required steps) and records every result in
`verification/REPORT.md` and `ERRORS.md`. Single run: `node scripts/tests/homepage-part1.mjs --target http://localhost:3000/ --tag local`.

### C3. Other checks run here
- `tsconfig` coverage: 21 application TS files, all covered, only reviewed exclusions.
- Scripts scanned for unused code (tsc `noUnusedLocals`): none.

## D. Things to watch in your first real run (I could not test these)
- Type errors or ESLint warnings in the new files (I wrote them without type packages or ESLint available).
- Next's CSS minifier handling the verbatim CSS (e.g. fallback declarations such as `vh` followed by `dvh`).
- `tailwind4.mjs` on a real build: `bl` is allow-listed (an unstyled class in the original).
- `next/image` dev warnings (sizes) with `unoptimized`.

## E. Approval
Part 2 starts only after you have run the verification, reviewed this report and written: "Part 1 approved. Part 2 shuru karo."
