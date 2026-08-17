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
- `modules/common` — shared utils, types, hooks, and common dependencies consumed by every app
- `modules/ui` — shared design-system components used across apps
- `modules/config` — shared eslint/tsconfig/tailwind config (manual, not Nx-generated — kept explicit and easy to reason about), consumed through subpath exports:
  - `@intromax/config/tsconfig/{base,react,next}.json` — `base` for plain TS, `react` adds DOM + JSX, `next` adds the Next plugin
  - `@intromax/config/eslint/{base,react,next}` — flat configs. `react` and `next` each compose `base`; `next` does **not** compose `react`, because `eslint-config-next` already registers the react-hooks plugin and flat config rejects a duplicate plugin key. Use `react` for shared React modules, `next` for apps.
  - `@intromax/config/tailwind/theme.css` — Tailwind v4 is CSS-first, so the shared "preset" is a stylesheet apps `@import`, not a JS config object

Nx here is used for task orchestration/caching across apps, not for generating app scaffolding — apps are set up manually following standard Next.js conventions. Nx discovers targets straight from each project's `package.json` scripts; there are no Nx plugins and no Nx Cloud.

`modules/ui` and `modules/common` export TypeScript source rather than a built `dist/`. Apps compile them via `transpilePackages` in `next.config.ts` — so a new app must list them there, and a non-Next consumer would need a real build step added.

### Version management

Versions shared across projects (`react`, `react-dom`, `typescript`, `eslint`, the `@types/*`) live in the `catalog:` block of `pnpm-workspace.yaml` and are referenced as `"catalog:"` in each `package.json`. Bump them there, once. React especially must stay single-copy: `modules/ui` is compiled in place via `transpilePackages`, so a drifting range there hands the app a second React and an `Invalid hook call` at runtime.

`eslint-config-next` is pinned in `modules/config` and must be bumped together with `next` in each app — nothing enforces that pairing automatically.

Shared code lives in `modules/`, not the conventional `packages/` — the npm scope is still `@intromax/*`, only the directory name differs. If a tool defaults to `packages/`, configure it rather than renaming the directory back.

**Apps keep `app/` at the app root — no `src/` directory.** Modules do use `src/`. This asymmetry is deliberate, not an oversight: `app/` is Next's App Router directory, and apps have few enough root-level files that another nesting level buys nothing. Don't "fix" it.

### Component layout

One folder per component, everywhere — `modules/ui/src/` and an app's `app/components/` alike:

```
button/
  index.ts      re-exports the component and its prop types
  Button.tsx    the component
```

Folder names are `camelCase` (`textArea/`, `textSplit/`), files are `PascalCase` and match the component they export. A folder holds extra files when the component genuinely has parts (`header/BurgerMenu.tsx`); styling helpers shared by two components go in `src/utils/` rather than in one of their folders. Barrel exports go through the folder's `index.ts`, and `modules/ui/src/index.ts` re-exports the public surface.

An app's `app/components/` needs no `_` prefix — a folder under `app/` only becomes a route if it contains a `page.tsx`.

### App-level layout inside `app/`

`app/` holds as little as Next actually requires directly inside it, plus organizational folders:

```
app/
  layout.tsx          root layout — Next requires this exact location
  not-found.tsx        global 404 — see note below, also root-only
  favicon.ico
  (pages)/            every route, grouped
    page.tsx           "/" — the index route has no folder of its own; see note below
    about/page.tsx
    contact/page.tsx
  components/          app-local components (Header, TextSplit, ...)
  styles/              globals.css, fonts.ts
```

`(pages)` is a Next **route group** — a folder wrapped in parens is stripped from the URL, so `app/(pages)/about/page.tsx` still serves `/about`. It exists purely so `app/` itself isn't a flat mix of route folders and organizational ones; every actual page lives inside it, one folder per route, `page.tsx` as the entry.

Two things can't move into the group, both confirmed by testing rather than assumed:
- **`layout.tsx`** — the root layout must be direct child of `app/`; Next won't find it inside a group.
- **`not-found.tsx`** — moving it into `(pages)/` silently breaks the global 404: unmatched top-level paths fell back to Next's plain default page instead of the custom one. Root-level `app/not-found.tsx` is the only placement that catches genuinely unmatched routes; a route group's own `not-found.tsx` only catches `notFound()` calls thrown from within that group.

The index route (`/`) has no dedicated folder the way `/about` does — `(pages)/page.tsx` sits directly in the group, because Next has no way to give the empty path a named wrapper folder without changing the URL. This is a one-time exception, not a pattern to extend.

Route implementations live directly in each route's `page.tsx`, not behind a re-export from a separate views folder. Cross-file imports inside `app/` use the `@/*` path alias (already declared in `tsconfig.json`, mapped to the app root) rather than relative paths — `@/app/components/header`, not `../../components/header` — so import paths don't get uglier as routes nest deeper inside `(pages)/`.

(Update this list as apps/modules are added — keep it accurate, not aspirational.)

### Dependency boundary rule

`modules/common` and `modules/ui` must stay lean. Only add a dependency there if 2+ apps actually need it. App-specific libraries (e.g. Three.js, GSAP, an animation lib for one pet project) live in that app's own `package.json`, never in a shared package. If unsure whether something belongs in shared or app-local, default to app-local and flag it — moving something into shared later is cheap, walking back a shared dependency that's now used everywhere is not.

**`modules/ui` depends on `next`** (peer dependency, catalog-pinned) because its `Link` wraps `next/link` — the fast, no-full-reload navigation Next apps expect, instead of a plain `<a>`. This is the one thing that would stop a non-Next app from using `modules/ui`. Every app in the workspace is a Next app today, so it isn't blocking anything yet, but it's worth remembering next time a pet project isn't Next-based.

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

- **Branching**: one branch per **feature**, always off `main`. A feature is a coherent unit of work that lands as a single PR — it can hold many commits. Naming: `stage/NN-short-name` for roadmap-stage work (e.g. `stage/01-nx-workspace-scaffolding`), `feat/short-name` or `fix/short-name` for everything after Stage 1. Never commit directly to `main` — everything lands as a PR.
- **Stay on the branch.** Follow-up tweaks, review fixes, renames and doc updates that belong to the feature in flight go on that same branch, as further commits. Don't spin up a new branch and a second PR for every adjustment. Cut a new branch only when the work is genuinely unrelated to what's already on the current one — and if that's a judgment call, ask rather than guessing.
- **Stop before git.** Implementing a change never includes committing it. See [Review and handoff](#review-and-handoff) — the agent's work ends with a dirty working tree and a summary, not a commit.
- **Small changes** (styling tweaks, copy edits, config bumps, obvious bug fixes): just do it directly. No spec needed.
- **Non-trivial changes** (new page, new API/endpoint, data model change, migration of a legacy section, new shared component): write a short spec first using `spec-template.md`, get it reviewed, then implement against it.
- Never self-merge. Every change reaches `main` through a PR and human review — a small change that belongs to a feature already in flight rides along in that feature's PR rather than getting one of its own.
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

- Prefer editing/extending `modules/ui` components over duplicating UI logic in an app.
- TypeScript: no `any` without a comment explaining why.
- Keep components small and colocated with their route unless shared across 2+ apps — then it moves to `modules/ui`.
