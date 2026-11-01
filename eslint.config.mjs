import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import globals from "globals";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  // Not project source: build output, downloaded browsers, test artefacts, static assets and the
  // archived Tailwind 3.4 fallback (never built). Everything else (app, components, scripts, configs) IS linted.
  {
    ignores: [
      "node_modules/**", ".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts",
      ".chrome-versions/**", "verification/**", "verification-offline/**", "public/**",
      "docs/tailwind-3.4-fallback/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Node scripts and config files: real ESLint recommended rules, no rule is switched off.
  {
    files: ["scripts/**/*.mjs", "*.mjs"],
    ...js.configs.recommended,
    languageOptions: { ecmaVersion: 2023, sourceType: "module", globals: { ...globals.node } },
  },
  // Playwright page.evaluate() callbacks run in the browser, so DOM globals are legitimate here.
  {
    files: ["scripts/tests/foundation.mjs"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];

export default config;
