import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

import base from "./base.mjs";

/** Flat config for Next.js apps: the workspace base plus Next's own rules. */
export default defineConfig([
  ...base,
  ...nextVitals,
  ...nextTs,
  // eslint-config-next sets these as ignores; restate them so they survive
  // being composed with other configs.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
