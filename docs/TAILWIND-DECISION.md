# Tailwind CSS – decision log

**Decision (owner):** target the latest stable Tailwind CSS 4. No users exist yet, so no browser
analytics are available; do not choose older technology on assumptions. Re-review after launch using
real analytics.

**Status of the project:** Tailwind 4 is now configured (`@tailwindcss/postcss`, `@theme inline`
mapped to the original CSS variables, no preflight). It has **not** been compiled or run yet: the
offline environment has no Tailwind 4 and no npm access. Fallback to 3.4 is one step
(`docs/tailwind-3.4-fallback/`) and is only for a *serious, demonstrated* compatibility problem.

## What is already established (static analysis of the original HTML)

The original page is written defensively. Modern features it uses, and what happens in older Chrome:

| Feature (min Chrome) | How it is used | Older-browser behaviour |
|---|---|---|
| `scrollbar-width` (121) | hides slider scrollbars (5 rules) | `::-webkit-scrollbar{display:none}` covers older Chrome. No change |
| `text-wrap: balance` (114) | hero h1 / paragraph line breaks | cosmetic only |
| `dvh` (108) | AI panel / menu height | a `vh` declaration comes first as fallback |
| `:has()` (105) | one rule: 7px padding under slider dots | cosmetic only |
| `overflow-x: clip` (90) | page overflow guard | `overflow-x:hidden` declared first |
| `:is()` (88) | footer focus outline | outline missing on footer only if unsupported |
| `aspect-ratio` (88), `inset` (87), `:focus-visible` (86) | image boxes, overlays, focus ring | hard requirements; all below Chrome 111 |

Result: from the CSS/JS, the page's own functional floor is about **Chrome 88–90**; everything newer
degrades cosmetically. So on Chrome 111+ the original design should render the same as in current Chrome.
This is from reading the code (`scripts/compat-scan.mjs` automates it), not from running old browsers.

## What Tailwind 4 adds (from documentation, to be confirmed on the build output)

Tailwind 4 documents Chrome 111+, Safari 16.4+, Firefox 128+. Its output relies on cascade layers
(Chrome 99), `@property` (85), `color-mix()` (111), range media queries (104) and individual transform
properties (104). On Chrome 111+ all are supported. Below 111 some utilities (opacity-modified
colours, shadows/rings) may degrade or break. Our own base rules live in `@layer base`, so a browser
without cascade layers (below Chrome 99) would drop them too: the page would be unstyled there.

## What still has to be run (needs a connected machine)

`node scripts/verify-phase1.mjs` (see README). Required: build, typecheck, lint, built-CSS compat scan,
`next dev` and `next start` foundation suites on Chromium 141 at 10 widths. Chrome 111 is now an **optional**
backward-compatibility run and does not block Phase 1 (owner decision; target is current Chrome and Android Chrome).

Things to watch in the first v4 build (I could not test these):
- `@theme inline` with `--color-*: initial`, `--breakpoint-*: initial` and `@utility` are accepted.
- `border` utility renders a visible solid border without preflight.
- Layer order: our `@layer base` rules (e.g. `svg{width:1.25em}`) must lose to utilities like `h-7 w-7`.

## Fallback rule

Switch to 3.4 only if a required check on current Chromium fails because of Tailwind 4 output, with the exact
failure documented. A failure of the optional Chrome 111 run alone is not a reason to switch; after launch, decide
again from real browser analytics.
