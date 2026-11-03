# Part 2 – delivery and honest testing report

Scope (approved split): Popular Locations, Recently Added, How PropertyIndia works, List-Property CTA, Footer (accordion,
Download App buttons, social, legal, language pill), mobile bottom navigation, Ask Property AI (draggable button, chat panel, no backend).
With Part 1 (already approved) the whole original homepage is now rebuilt, in the original section order.

Base: your uploaded `propertyindia-main__1__1.zip` (Part 1 approved by you) and your original
`propertyindia-home-v13-contrast.html` (`reference/`). Your two changes were kept as they are: the 7 duplicate global rules removed from
`app/home.css`, and `devIndicators: false` in `next.config.ts`. Nothing from earlier folders was reused. The Part 1 verification reports
you mentioned were not attached to your message or inside the ZIP; I relied on your written approval.

## A. What was built

| File | Purpose |
|---|---|
| `components/PopularLocations.tsx` | 8 city cards, swipeable row with position dots |
| `components/RecentlyAdded.tsx`, `RecentCard.tsx` | 6 sample listings, save heart, "posted" time |
| `components/HowItWorks.tsx` | 3 steps (long/short text switched by the original CSS) |
| `components/ListPropertyCta.tsx`, `CtaIllustration.tsx` | "Own a property? List it free." banner (illustration copied unchanged from the original) |
| `components/Footer.tsx` | brand/address, link accordion (phones) / open columns (640px+), Download App, social, legal, language pill |
| `components/BottomNav.tsx` | bottom nav below 960px; hides on scroll down, shows on scroll up / top / bottom / keyboard focus |
| `components/AskPropertyAi.tsx`, `hooks/useAskPropertyAi.ts`, `hooks/useDraggableButton.ts` | floating button (draggable), chat panel, history, 20 s timeout, offline notice, keyboard-aware panel |
| `hooks/useLanguagePanel.ts` | shared logic for the header dropdown and the footer language pill |
| `data/homepage.ts` | Part 2 content (locations, recent listings, steps, footer columns, AI suggestions) |
| `scripts/tests/homepage-part2.mjs`, `lib/compare.mjs` | Part 2 suite: original-vs-page at 10 widths + interactions (works on any URL) |

## B. Deliberate differences and notes (nothing else changed, removed or added)

1. **Part 1 file touched:** `components/LanguageDropdown.tsx` now uses the shared `useLanguagePanel` hook (same behaviour; the footer needs the same logic).
   The whole Part 1 suite was run again afterwards: 155/155.
2. **Ask Property AI has no backend.** `NEXT_PUBLIC_AI_ENDPOINT` is empty, so the panel shows "AI service is not connected yet. Please try again later."
   exactly like the original; no simulated answers. When an endpoint exists the request/response contract is documented in `hooks/useAskPropertyAi.ts`.
3. **Footer accordion class:** `js-acc` is added when the page loads in the browser (as in the original), so without JavaScript all columns stay open.
4. **Store buttons** say "Coming soon" (cleared after 3.5 s) until a real store URL is passed to `onStoreClick` in `Footer.tsx`.
5. **Links:** all footer/menu placeholder links stay `#` as in the original; `#how`, `#list` and `#search` now scroll to their sections (tested).
6. **Unstyled hooks kept:** the classes `bl` (header button label) and `ft-country` exist in the original markup but have no CSS rule; they are allow-listed in the Tailwind check.
7. **Recently Added** sample data: the original also carried a per-card colour that no markup used; it was left out.
8. **Images:** `next/image` with `unoptimized` (byte-identical pixels), as in Part 1.
9. The Part 1 test (`homepage-part1.mjs`) now hides the bottom bar and AI button on both pages (they exist on the page now).

## C. Tests

### C1. Static-render / React-harness tests – ACTUALLY RUN (authoring environment, Chromium 141.0.7390.37)

What this is: the real components bundled with esbuild, server-rendered and hydrated with React 19 in the browser, with the real tokens/base rules
+ `home.css` + overrides. `next/image` is replaced by a plain `<img>`. This is NOT Next.js and NOT Tailwind 4 output.

| Run | Result |
|---|---|
| Part 2 – layout + pixels at 10 widths (`verification-offline/part2/visual-10-widths/`) | **140/140 passed** |
| Part 2 – interactions + AI contract (`verification-offline/part2/interactions-and-ai/`) | **26/26 passed** |
| Part 1 suite re-run on the full page (`verification-offline/part2/part1-regression/`) | **155/155 passed** |

Details of the Part 2 comparison with the original HTML:
- Widths 320, 360, 380, 414, 430, 639, 768, 1024, 1280, 1440: no horizontal overflow; size and spacing of every Part 2 section equal the original (±1px).
- 67 pixel comparisons (5 sections × 10 widths, plus bottom nav and AI button where visible): **0% of pixels differ** by more than 32/255.
- Bottom nav is visible below 960px and hidden from 960px up, as in the original.
- Interactions give identical results on the page and on the original HTML (380px and 1024px): footer accordion (open one, close others, aria and tab order),
  footer language pill (open, Esc and focus, option, outside click), Recently Added hearts, Popular Locations slider and dots, bottom-bar hide/show on scroll
  and keyboard focus, store buttons and the 3.5 s note (fake clock), Ask Property AI (open, suggestion, typed message, blank message, Esc, close button, focus handling),
  offline notice, dragging the AI button (drag does not open the chat), anchor links to How it works / List / Search.
- AI endpoint contract (a harness build with a test endpoint): reply shown and the previous question/answer pair sent as history with the next message; HTTP 500 and an
  empty response show the not-connected message; 20 s timeout shows the timeout message, with the input disabled while waiting.
- Reference note: from 1280px the reference page also receives the approved Featured override (four cards), so that sections below it sit at identical positions.
  Without it, sub-pixel offsets from the shorter Featured section gave 2–6% antialiasing differences at 1280/1440px (no visible difference).
- A bug found by these tests and fixed: after closing the AI panel focus did not return to the floating button on phones (the button is hidden while the panel is open,
  so focus must be restored after the panel is hidden, as the original does).
- No console or hydration errors; no external requests.
Screenshots: `verification-offline/part2/visual-10-widths/visual/<width>-page-full.png` (new) and `<width>-original-full.png`.

### C2. Actual Next.js build and browser tests – NOT RUN (no internet here)

| Check | Status |
|---|---|
| `npm ci`, production build | NOT RUN |
| TypeScript type-check (no React type packages available offline) | NOT RUN |
| ESLint (0 warnings required) | NOT RUN |
| Tailwind 4 build and `tailwind4.mjs` | NOT RUN |
| `next dev` / `next start`: foundation, Part 1 and Part 2 suites at 10 widths on Chromium 141 | NOT RUN |
| Real `next/image`, real hydration in Next | NOT RUN |
| Real phone behaviour (touch dragging, on-screen keyboard lifting the AI panel via `visualViewport`) | NOT RUN (cannot be emulated faithfully headless) |
| Real Chrome 111 / Android | NOT RUN (optional) |

Run on your connected machine or GitHub Actions: `node scripts/verify-phase1.mjs`. It now runs the Part 1 and Part 2 suites against `next dev` and `next start`
as required steps and records everything in `verification/REPORT.md` and `ERRORS.md`. Single run:
`node scripts/tests/homepage-part2.mjs --target http://localhost:3000/ --tag local`.

### C3. Other checks run here
- `tsconfig` coverage: 33 application TS files, all covered, only reviewed exclusions.
- Scripts scanned for unused code (tsc `noUnusedLocals`): none.
- Every `className` used in the new components has a rule in the original CSS (except the two allow-listed hooks).

## D. Things to watch in your first real run
- Type errors or ESLint warnings in the new files (written without type packages or ESLint available).
- Next's CSS minifier and Tailwind 4 with the verbatim `home.css`.
- `react-hooks` lint rules on the new hooks (timers and refs were written to avoid the common warnings).
- On a real phone: dragging the AI button and the panel position while the keyboard is open.

## E. Approval
Both parts are delivered. After you run the verification and review this report, tell me what to fix or write "Part 2 approved".
