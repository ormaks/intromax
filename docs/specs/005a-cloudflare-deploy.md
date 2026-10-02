# Spec: Stage 5a — Cloudflare CI/CD

## What

The portfolio deploys to Cloudflare Workers through `@opennextjs/cloudflare`. A GitHub Actions workflow runs lint, typecheck, build and the full e2e suite on every pull request and push to `main`. When those pass on `main`, it deploys production.

## Why

The site is complete but has never been live. CI/CD moves ahead of the pet-projects stage so that everything after it ships through a checked pipeline. The roadmap becomes Stage 5 CI/CD, Stage 6 pet projects, Stage 7 testing.

## Scope

**In scope:**

- The OpenNext adapter for `apps/portfolio`: `wrangler.jsonc`, `open-next.config.ts`, `preview` and `deploy` scripts.
- `.github/workflows/ci.yml` with `checks`, `e2e` and `deploy` jobs.
- Env docs: `apps/portfolio/.env.example` (it was never committed).
- README, AGENTS.md and PROGRESS updates.

**Out of scope:**

- A custom domain. The site lives at `intromax-portfolio.<subdomain>.workers.dev`.
- Per-PR preview deployments.
- Dependabot or other update bots.
- Cloudflare bindings (KV, R2, D1) and the Next image optimizer. Every route is prerendered, and the one `next/image` is `unoptimized`.
- Font licensing.

## Approach

**New dependencies (dev, `apps/portfolio` only):** `@opennextjs/cloudflare` (the Next-to-Workers adapter) and `wrangler` (Cloudflare's CLI, which builds and deploys the Worker). Neither goes into the catalog, because no other app uses them.

**`apps/portfolio/wrangler.jsonc`:**

- `name: "intromax-portfolio"`, `main: ".open-next/worker.js"`
- `compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"]`
- `assets` served from `.open-next/assets`
- `observability.enabled`, so the contact action's `console.error` reaches Workers Logs.

**`apps/portfolio/open-next.config.ts`:** `defineCloudflareConfig` with the static-assets incremental cache. Prerendered pages are read from the deployed assets, and nothing revalidates, so no R2 or KV is needed.

**Scripts:**

- `preview`: an OpenNext build, then the Worker locally in `wrangler dev`.
- `deploy`: an OpenNext build, then `wrangler deploy`.
- Nx exposes both as targets. Neither is cached.
- `.open-next/` is ignored by ESLint and Prettier.

**Env:** the contact action already reads `process.env.RESEND_API_KEY` and `process.env.CONTACT_RECIPIENT_EMAIL`. On Workers these come from Worker secrets, so no code changes. Locally:

- `next dev` and `preview` both read `.env.local`. With no `.dev.vars`, wrangler falls back to `.env` and `.env.local`.
- `.env.example` documents both variables.

**Workflow (`.github/workflows/ci.yml`):**

- **Triggers:** `pull_request` to `main` and `push` to `main`.
- **Concurrency per ref:** a newer push cancels older PR runs. A run on `main` is never cancelled once started, so a deploy can't be cut off. A newer push only replaces a run that is still queued.
- **Each job:** checkout, `pnpm/action-setup` (version from `packageManager`), `setup-node` from `.nvmrc` with the pnpm cache, then `pnpm install --frozen-lockfile`.
- **`checks`:** `nx run-many -t lint typecheck build`, then `opennextjs-cloudflare build --skipNextBuild`, so a Worker bundling error fails the PR rather than the deploy.
- **`e2e`** (parallel to `checks`):
  - Installs Playwright's bundled Chromium and runs `nx e2e portfolio` with `PLAYWRIGHT_CHANNEL=""`.
  - Uploads `test-results/` (traces) on failure.
- **`deploy`:**
  - Runs after both pass, only on a push to `main`, in the `production` environment.
  - `nx deploy portfolio`, with `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from repo secrets.

**Secrets and env vars:**

| Name                      | Purpose                                          | Where it's set                                  |
| ------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`    | wrangler auth for the deploy job                 | GitHub → repo secret                            |
| `CLOUDFLARE_ACCOUNT_ID`   | the Cloudflare account to deploy to              | GitHub → repo secret                            |
| `RESEND_API_KEY`          | contact form sending                             | Cloudflare → Worker `intromax-portfolio` secret |
| `CONTACT_RECIPIENT_EMAIL` | contact form recipient                           | Cloudflare → Worker `intromax-portfolio` secret |
| `PLAYWRIGHT_CHANNEL`      | `""` selects Playwright's bundled Chromium in CI | inline in the workflow                          |

## Acceptance criteria

- [ ] `opennextjs-cloudflare build` produces `.open-next/worker.js` and `.open-next/assets`.
- [ ] `preview` serves every route and the 404 from the Worker locally.
- [x] `ci.yml` runs `checks` and `e2e` on PRs and pushes to `main`, and runs `deploy` only on `main` after both pass.
- [x] A new push to a PR cancels its older run. A started run on `main` is never cancelled.
- [x] `.env.example` lists both contact variables with placeholder values.
- [x] README roadmap reordered. AGENTS.md documents the commands, deploy flow and secrets.
- [x] Lint, typecheck, build and the full e2e suite pass locally.

## Deviations

- **The first two criteria are unchecked: the OpenNext bundle hasn't been built locally.** `opennextjs-cloudflare build` gets through `next build`, then fails while copying traced files with `EPERM: symlink`. Windows only allows symlinks from a non-admin shell with Developer Mode on. The first Ubuntu CI run is the real check.
- **`allowBuilds`:** wrangler brings in `esbuild` and `workerd`. Both are set to `false`, because their binaries install as per-platform optional packages.
- **ESLint and Prettier** also ignore `.wrangler/` (wrangler's local state), not only `.open-next/`.
