# AGENTS.md

Conventions for any AI agent (Claude Code, etc.) working in this repo.

## Stack

- Monorepo: Nx
- Apps: Next.js 16 (App Router, Turbopack), TypeScript, Tailwind
- Package manager: pnpm
- Testing: Playwright (e2e), TypeScript strict mode + ESLint as the fast checks
- Deploy: Cloudflare (via `@opennextjs/cloudflare`), CI through GitHub Actions

## Repo layout

- `apps/portfolio` — main site
- `apps/<pet-project-name>` — each pet project is its own app
- `packages/common` — shared utils, types, hooks, and common dependencies consumed by every app
- `packages/ui` — shared design-system components used across apps
- `packages/config` — shared eslint/tsconfig/tailwind config (manual, not Nx-generated — kept explicit and easy to reason about)

Nx here is used for task orchestration/caching across apps, not for generating app scaffolding — apps are set up manually following standard Next.js conventions.

(Update this list as apps/packages are added — keep it accurate, not aspirational.)

### Dependency boundary rule

`packages/common` and `packages/ui` must stay lean. Only add a dependency there if 2+ apps actually need it. App-specific libraries (e.g. Three.js, GSAP, an animation lib for one pet project) live in that app's own `package.json`, never in a shared package. If unsure whether something belongs in shared or app-local, default to app-local and flag it — moving something into shared later is cheap, walking back a shared dependency that's now used everywhere is not.

## Commands

- `pnpm install` — install deps at the workspace root
- `pnpm nx dev <app>` — run an app locally
- `pnpm nx build <app>` — production build
- `pnpm nx lint <app>` — lint
- `pnpm nx typecheck <app>` — typecheck
- `pnpm nx test <app>` — unit tests (if/when added)
- `pnpm nx e2e <app>` — Playwright e2e

Before considering any task done: lint, typecheck, and relevant e2e must pass.

## Workflow rules

- **Small changes** (styling tweaks, copy edits, config bumps, obvious bug fixes): just do it directly. No spec needed.
- **Non-trivial changes** (new page, new API/endpoint, data model change, migration of a legacy section, new shared component): write a short spec first using `spec-template.md`, get it reviewed, then implement against it.
- Never self-merge. All changes land as a PR for human review, even small ones.
- Don't introduce a new dependency, new external service, or new package without flagging it first — one line explaining why is enough.
- Match existing patterns in the codebase before introducing new ones. If an existing pattern seems wrong, flag it rather than silently deviating.

## Boundaries

- No changes to `apps/<pet-project>` deployment/CI config without explicit approval — pet projects can be experimental in code, not in how they ship.
- No database schema changes without a spec.
- No new environment variables/secrets added without calling it out explicitly (name + purpose + where it's set in Cloudflare).

## Review

After implementing a non-trivial change (lint/typecheck/tests passing), invoke the `code-reviewer` subagent (`.claude/agents/code-reviewer.md`) for an independent pass before opening the PR. It's read-only by design — it reports findings, it doesn't fix them. Address its findings, then open the PR for human review.

## Style

- Prefer editing/extending `packages/ui` components over duplicating UI logic in an app.
- TypeScript: no `any` without a comment explaining why.
- Keep components small and colocated with their route unless shared across 2+ apps — then it moves to `packages/ui`.
