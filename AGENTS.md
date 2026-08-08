# AGENTS.md

Conventions for any AI agent (Claude Code, etc.) working in this repo.

## Stack

- Monorepo: Nx
- Apps: Next.js 16 (App Router, Turbopack), TypeScript, Tailwind v4
- Node: 24, pinned in `.nvmrc`
- Package manager: pnpm (version pinned via `packageManager` in the root `package.json`)
- Testing: Playwright (e2e), TypeScript strict mode + ESLint as the fast checks
- Deploy: Cloudflare (via `@opennextjs/cloudflare`), CI through GitHub Actions

## Repo layout

- `apps/portfolio` — main site
- `apps/<pet-project-name>` — each pet project is its own app
- `packages/common` — shared utils, types, hooks, and common dependencies consumed by every app
- `packages/ui` — shared design-system components used across apps
- `packages/config` — shared eslint/tsconfig/tailwind config (manual, not Nx-generated — kept explicit and easy to reason about), consumed through subpath exports:
  - `@intromax/config/tsconfig/{base,react,next}.json` — `base` for plain TS, `react` adds DOM + JSX, `next` adds the Next plugin
  - `@intromax/config/eslint/{base,react,next}` — flat configs. `react` and `next` each compose `base`; `next` does **not** compose `react`, because `eslint-config-next` already registers the react-hooks plugin and flat config rejects a duplicate plugin key. Use `react` for shared React packages, `next` for apps.
  - `@intromax/config/tailwind/theme.css` — Tailwind v4 is CSS-first, so the shared "preset" is a stylesheet apps `@import`, not a JS config object

Nx here is used for task orchestration/caching across apps, not for generating app scaffolding — apps are set up manually following standard Next.js conventions. Nx discovers targets straight from each project's `package.json` scripts; there are no Nx plugins and no Nx Cloud.

`packages/ui` and `packages/common` export TypeScript source rather than a built `dist/`. Apps compile them via `transpilePackages` in `next.config.ts` — so a new app must list them there, and a non-Next consumer would need a real build step added.

### Version management

Versions shared across projects (`react`, `react-dom`, `typescript`, `eslint`, the `@types/*`) live in the `catalog:` block of `pnpm-workspace.yaml` and are referenced as `"catalog:"` in each `package.json`. Bump them there, once. React especially must stay single-copy: `packages/ui` is compiled in place via `transpilePackages`, so a drifting range there hands the app a second React and an `Invalid hook call` at runtime.

`eslint-config-next` is pinned in `packages/config` and must be bumped together with `next` in each app — nothing enforces that pairing automatically.

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
- `pnpm nx run-many -t lint typecheck` — every project at once

Next.js generates route types (`LayoutProps`, `PageProps`) into `.next/types`, so an app's `typecheck` script must run `next typegen` before `tsc --noEmit` or it fails on a clean checkout.

Before considering any task done: lint, typecheck, and relevant e2e must pass.

## Workflow rules

- **Branching**: one branch per change, always off `main`. Naming: `stage/NN-short-name` for roadmap-stage work (e.g. `stage/01-nx-workspace-scaffolding`), `feat/short-name` or `fix/short-name` for everything after Stage 1. Never commit directly to `main`, including small changes — everything lands as a PR.
- **Stop before git.** Implementing a change never includes committing it. See [Review and handoff](#review-and-handoff) — the agent's work ends with a dirty working tree and a summary, not a commit.
- **Small changes** (styling tweaks, copy edits, config bumps, obvious bug fixes): just do it directly. No spec needed.
- **Non-trivial changes** (new page, new API/endpoint, data model change, migration of a legacy section, new shared component): write a short spec first using `spec-template.md`, get it reviewed, then implement against it.
- Never self-merge. All changes land as a PR for human review, even small ones.
- Don't introduce a new dependency, new external service, or new package without flagging it first — one line explaining why is enough.
- Match existing patterns in the codebase before introducing new ones. If an existing pattern seems wrong, flag it rather than silently deviating.

## Boundaries

- No changes to `apps/<pet-project>` deployment/CI config without explicit approval — pet projects can be experimental in code, not in how they ship.
- No database schema changes without a spec.
- No new environment variables/secrets added without calling it out explicitly (name + purpose + where it's set in Cloudflare).

## Review and handoff

After implementing a non-trivial change (lint/typecheck/tests passing), invoke the `code-reviewer` subagent (`.claude/agents/code-reviewer.md`) for an independent pass. It's read-only by design — it reports findings, it doesn't fix them. Address its findings, re-run the checks, and then **stop**.

**Do not run `git commit`, `git push`, or `gh pr create` unless explicitly asked.** That applies to every change, small or large, and to fixes made in response to review findings. The subagent's review is an input to my review, not a substitute for it — I read the actual diff myself before anything leaves the machine.

The handoff state the agent should leave behind:

- All changes applied and saved, working tree **dirty and unstaged** — don't `git add` either, staging is part of my review
- `lint`, `typecheck` and relevant e2e passing
- Review findings either fixed or explicitly listed as deliberately-not-fixed, with reasons
- A summary of what changed, what was decided and why, and anything left out

Then wait. I'll review the changed files and either handle git myself or ask the agent to do it. When I do ask ("commit and push", "open the PR"), commit on the current branch, push, and open the PR against `main` — with a body that covers decisions and deviations, not just a file list.

Never self-merge, and never merge on my behalf.

## Style

- Prefer editing/extending `packages/ui` components over duplicating UI logic in an app.
- TypeScript: no `any` without a comment explaining why.
- Keep components small and colocated with their route unless shared across 2+ apps — then it moves to `packages/ui`.
