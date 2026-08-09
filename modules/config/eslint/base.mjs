import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

/**
 * Base flat config every package and app in the workspace builds on.
 * Next-specific rules live in ./next.mjs, which composes this.
 */
export default defineConfig([
  globalIgnores(["**/node_modules/**", "**/dist/**", "**/.next/**"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // AGENTS.md: no `any` without a comment explaining why. Erroring here
      // forces an explicit eslint-disable line, which is where that why goes.
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
]);
