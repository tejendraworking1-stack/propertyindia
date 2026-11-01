# Tailwind 3.4 fallback (verified to compile offline)

Use ONLY if Tailwind 4 shows a serious compatibility problem (see docs/TAILWIND-DECISION.md).

1. package.json: `tailwindcss@^3.4.17`, add `autoprefixer@^10.4.20`, remove `@tailwindcss/postcss`.
2. Copy `tailwind.config.ts` and `postcss.config.mjs` from this folder to the project root.
3. In app/globals.css replace everything above the "Design tokens" comment with `globals.head.css`
   and delete the `@theme` / `@utility` blocks.
