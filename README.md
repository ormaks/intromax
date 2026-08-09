# Intromax — Portfolio Monorepo

Personal portfolio, rebuilt as an Nx monorepo, doubling as a hands-on testbed for agentic development workflows.

## What this is

- A rebuild of an existing portfolio (previously static, deployed on GitHub Pages) — new stack, new design, same core purpose: showcase experience and projects.
- A "Lab" / pet-projects section: standalone demo apps for practicing specific libraries/techniques, including a rebuilt version of an earlier barbershop project.
- An explicit experiment in agent-driven development: most implementation work here goes through Claude Code following the conventions in `AGENTS.md`, with the process itself being part of the point, not just the output.
## Stack

- **Monorepo**: Nx (task orchestration/caching; apps are hand-scaffolded, not Nx-generated)
- **Apps**: Next.js 16 (App Router, Turbopack), TypeScript, Tailwind
- **Package manager**: pnpm
- **Testing**: Playwright (e2e)
- **Deploy**: Cloudflare, via `@opennextjs/cloudflare`
- **Backend**: minimal by design — starts as a contact-form endpoint (email API), expands only as specific pet projects need it (e.g. a Postgres + Auth.js pet project for auth practice)
## Structure

```
apps/
  portfolio/          # main site
  <pet-project>/       # each pet project is its own app
modules/
  common/              # shared utils, types, hooks
  ui/                  # shared design-system components
  config/              # shared eslint/tsconfig/tailwind config (manual)
docs/
  specs/               # spec-per-non-trivial-change, see spec-template.md
  PROGRESS.md          # running log, updated at the end of each stage
.claude/
  agents/
    code-reviewer.md   # read-only review subagent
  launch.json          # dev-server config for agent-driven local runs
```

Requires Node 24 (see `.nvmrc`) and pnpm — `pnpm install`, then `pnpm nx dev portfolio`.

## Roadmap

- [x] **Stage 0** — Agent workflow setup: `AGENTS.md`, spec template, `code-reviewer` subagent, `.gitignore`
- [x] **Stage 1** — Nx workspace + portfolio app scaffolding
- [ ] **Stage 2** — Architecture & design system
- [ ] **Stage 3** — Backend/storage (contact-form endpoint first)
- [ ] **Stage 4** — Legacy content/design migration
- [ ] **Stage 5** — Pet-projects section + barbershop duplicate
- [ ] **Stage 6** — Cloudflare CI/CD
- [ ] **Stage 7** — Testing & ongoing agent loop
  See `docs/PROGRESS.md` for what's actually landed vs. this plan, and `AGENTS.md` for how work in this repo is done.

## Working in this repo

- Non-trivial changes: write a spec in `docs/specs/` first (`docs/spec-template.md`), then implement.
- One branch per feature (`stage/…`, `feat/…`, `fix/…`), PR to `main`, never commit directly to `main`. Follow-ups to a feature in flight stay on its branch.
- Agents implement and self-check, then stop — commits, pushes and PRs happen only when I ask for them, after I've read the diff.
- Full conventions: see `AGENTS.md`.
 