import { existsSync } from "node:fs";
import { defineConfig } from "vitest/config";

// Database tests read DATABASE_URL, the same as the app.
if (existsSync(".env")) process.loadEnvFile(".env");

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
