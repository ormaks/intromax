import path from "node:path";

/*
 * Runs on `git commit` (via .husky/pre-commit), against staged files only.
 *
 * ESLint can't run once from the repo root: every project has its own
 * eslint.config.mjs, and ESLint uses the config of the directory it runs in.
 * So staged files are grouped by project (`apps/<name>`, `modules/<name>`)
 * and ESLint runs once per project, from that project's directory.
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
      `pnpm --dir ${project} exec eslint --fix ${projectFiles.map(quote).join(" ")}`,
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
