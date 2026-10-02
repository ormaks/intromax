import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

import base from "./base.mjs";

/** Flat config for Next.js apps: the workspace base plus Next's own rules. */
export default defineConfig([
  ...base,
  ...nextVitals,
  ...nextTs,
  // eslint-config-next sets the first four as ignores; restate them so they
  // survive being composed with other configs. The last two are the
  // Cloudflare build output and wrangler's local state.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".open-next/**",
    ".wrangler/**",
  ]),
]);
