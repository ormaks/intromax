# Spec: Nx workspace scaffolding

## What

Set up the Nx monorepo workspace (pnpm, manual config — no Nx app generators) with a first working Next.js 16 app for the portfolio, plus the shared modules structure defined in `AGENTS.md`.

## Why

Foundation everything else builds on — every future app (portfolio, pet projects) and shared package depends on this structure being right from the start.

## Scope

**In scope:**
- Nx workspace initialized in this repo, pnpm as the package manager
- `apps/portfolio` — Next.js 16 (App Router, TypeScript, Tailwind), created manually via `create-next-app`, not an Nx Next.js plugin generator
- `modules/config` — shared eslint config, base tsconfig, tailwind preset
- `modules/ui` — empty/minimal scaffold (package.json + placeholder export), ready for components later
- `modules/common` — empty/minimal scaffold (package.json + placeholder export), ready for shared utils/types later
- `apps/portfolio` consumes `modules/config` and `modules/ui` via the pnpm workspace protocol
- `.nvmrc` pinning Node 24 LTS (revised from 22 during implementation — the dev machine runs 24 and no version manager is installed, so a 22 pin would have been documentation nothing honored)
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
3. Build out `modules/config` with a shared ESLint flat config, a base `tsconfig.json` other modules/apps extend, and a shared Tailwind preset.
4. Scaffold `modules/ui` and `modules/common` as minimal, real, buildable packages — not just empty folders — each with its own `package.json` and a single placeholder export, wired into `apps/portfolio` so the workspace-protocol linkage is proven to work now rather than discovered broken later.
5. Wire Nx targets (`dev`, `build`, `lint`, `typecheck`) for `apps/portfolio` and confirm each runs clean.
6. Add `.nvmrc` (Node 24 LTS).
7. Reconcile `AGENTS.md`'s repo layout section against what actually got built.

## Acceptance criteria

- [x] `pnpm install` succeeds from a clean clone
- [x] `pnpm nx dev portfolio` runs and serves the default Next.js page locally
- [x] `pnpm nx build portfolio` succeeds
- [x] `pnpm nx lint portfolio` and `pnpm nx typecheck portfolio` pass
- [x] `apps/portfolio` visibly imports something from both `modules/ui` and `modules/common` (proves the workspace linkage, however trivial)
- [x] `.nvmrc` present and correct
- [x] `AGENTS.md` repo layout matches reality

## Open questions

- None blocking — Node version and Nx Cloud already decided (Node 24 LTS; skip Nx Cloud for now). Flag anything else that comes up during setup rather than guessing.

## Outcome

Implemented. Deviations from the draft above, and why, are recorded in the Stage 1 entry of `docs/PROGRESS.md`.
