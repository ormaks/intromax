import path from "node:path";

/*
 * Runs on `git commit` (via .husky/pre-commit), against staged files only.
 *
 * Every project has its own eslint.config.mjs and its own ESLint. Staged
 * files are grouped by project (`apps/<name>`, `modules/<name>`), and each
 * group is linted by that project's ESLint, started with `node` from the
 * repo root. The v10_config_lookup_from_file flag makes ESLint take each
 * file's config from the nearest eslint.config.mjs above it, instead of from
 * the directory it runs in.
 *
 * Nothing here goes through pnpm: a pnpm command waits for pnpm's
 * version-switch lock at startup, and a pnpm stuck elsewhere on the machine
 * would stall every commit behind it.
 *
 * Order matters: ESLint --fix first, Prettier last, so Prettier has the final
 * say on formatting. lint-staged re-stages whatever the fixes changed.
 */

const PROJECT_DIR = /^(apps|modules)\/[^/]+/;

/**
 * Quote a path (the repo lives under a folder with a space) and normalise
 * Windows backslashes, which would otherwise need escaping inside the quotes.
 */
const quote = (file) => `"${file.replaceAll("\\", "/")}"`;

function eslintPerProject(files) {
  const byProject = new Map();

  for (const file of files) {
    const relative = path.relative(process.cwd(), file).replaceAll("\\", "/");
    const project = relative.match(PROJECT_DIR)?.[0];
    // Root-level scripts (this file, etc.) belong to no ESLint project.
    if (!project) continue;

    byProject.set(project, [...(byProject.get(project) ?? []), file]);
  }

  return [...byProject].map(
    ([project, projectFiles]) =>
      `node ${quote(`${project}/node_modules/eslint/bin/eslint.js`)} --flag v10_config_lookup_from_file --fix ${projectFiles.map(quote).join(" ")}`,
  );
}

const prettier = "prettier --write --ignore-unknown";

export default {
  "*.{js,mjs,cjs,jsx,ts,tsx}": (files) => [
    ...eslintPerProject(files),
    `${prettier} ${files.map(quote).join(" ")}`,
  ],
  "*.{json,md,css,yaml,yml,html}": prettier,
};
