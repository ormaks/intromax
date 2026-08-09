import { defineConfig } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";

import base from "./base.mjs";

/**
 * Flat config for React modules that are not Next.js apps — `modules/ui`
 * above all. Without this, shared components would be the one place in the
 * workspace where the rules-of-hooks checks don't run, which is backwards.
 *
 * Deliberately NOT composed into ./next.mjs: eslint-config-next registers the
 * react-hooks plugin itself, and flat config rejects the same plugin key being
 * defined twice with different instances.
 */
// Note the `.flat.` — the top-level `configs["recommended-latest"]` is still
// the eslintrc shape (`plugins: ["react-hooks"]`) and throws under flat config.
export default defineConfig([
  ...base,
  reactHooks.configs.flat["recommended-latest"],
]);
