# Spec: Nx workspace scaffolding

## What

Set up the Nx monorepo workspace (pnpm, manual config — no Nx app generators) with a first working Next.js 16 app for the portfolio, plus the shared packages structure defined in `AGENTS.md`.

## Why

Foundation everything else builds on — every future app (portfolio, pet projects) and shared package depends on this structure being right from the start.

## Scope

**In scope:**
- Nx workspace initialized in this repo, pnpm as the package manager
- `apps/portfolio` — Next.js 16 (App Router, TypeScript, Tailwind), created manually via `create-next-app`, not an Nx Next.js plugin generator
- `packages/config` — shared eslint config, base tsconfig, tailwind preset
- `packages/ui` — empty/minimal scaffold (package.json + placeholder export), ready for components later
- `packages/common` — empty/minimal scaffold (package.json + placeholder export), ready for shared utils/types later
- `apps/portfolio` consumes `packages/config` and `packages/ui` via the pnpm workspace protocol
- `.nvmrc` pinning Node 22 LTS
- Root `package.json` with workspace scripts
- Confirm `pnpm nx dev|build|lint|typecheck portfolio` all run successfully
- Update `AGENTS.md`'s repo layout section if the real structure ends up differing from the draft

**Out of scope (explicitly):**
- Any actual portfolio content, design, or components
- Playwright/e2e setup
- Cloudflare deploy config
- Nx Cloud / remote caching
- Any backend, CMS, or form-handling work

## Approach

1. Initialize Nx at the repo root (`pnpm dlx create-nx-workspace` or `nx init`, integrated monorepo style, pnpm as package manager).
2. Manually scaffold `apps/portfolio` with `create-next-app` (App Router, TypeScript, Tailwind, no `src/` directory unless there's a good reason — confirm before deviating).
3. Build out `packages/config` with a shared ESLint flat config, a base `tsconfig.json` other packages/apps extend, and a shared Tailwind preset.
4. Scaffold `packages/ui` and `packages/common` as minimal, real, buildable packages — not just empty folders — each with its own `package.json` and a single placeholder export, wired into `apps/portfolio` so the workspace-protocol linkage is proven to work now rather than discovered broken later.
5. Wire Nx targets (`dev`, `build`, `lint`, `typecheck`) for `apps/portfolio` and confirm each runs clean.
6. Add `.nvmrc` (Node 22 LTS).
7. Reconcile `AGENTS.md`'s repo layout section against what actually got built.

## Acceptance criteria

- [ ] `pnpm install` succeeds from a clean clone
- [ ] `pnpm nx dev portfolio` runs and serves the default Next.js page locally
- [ ] `pnpm nx build portfolio` succeeds
- [ ] `pnpm nx lint portfolio` and `pnpm nx typecheck portfolio` pass
- [ ] `apps/portfolio` visibly imports something from both `packages/ui` and `packages/common` (proves the workspace linkage, however trivial)
- [ ] `.nvmrc` present and correct
- [ ] `AGENTS.md` repo layout matches reality

## Open questions

- None blocking — Node version and Nx Cloud already decided (Node 22 LTS; skip Nx Cloud for now). Flag anything else that comes up during setup rather than guessing.
