# Progress log

Updated at the end of each stage. A stage isn't considered done until this file reflects it. Newest entry at the top.

Each entry: what shipped, key decisions made (and why), what's next.

---

## Stage 1 — Nx workspace + portfolio app scaffolding

**Status:** Done — spec: `docs/specs/001-nx-workspace-scaffolding.md`

**Shipped:**
- Root workspace: hand-written `package.json`, `pnpm-workspace.yaml`, `nx.json`, `.nvmrc`
- `apps/portfolio` — Next.js 16.3.0, App Router, TypeScript, Tailwind v4, via `create-next-app`
- `packages/config` — shared tsconfig (`base`/`react`/`next`), eslint flat configs (`base`/`next`), Tailwind theme stylesheet
- `packages/ui`, `packages/common` — minimal real packages, linked into the app and rendering on the home page
- `.claude/launch.json` so the dev server can be driven directly

**Decisions:**
- **Node 24, not the 22 the spec said.** The dev machine runs 24 with no version manager installed; a 22 pin would have been a number nothing honored. Next 16 only requires >=20.9.
- **pnpm installed globally rather than via corepack.** `corepack enable` needs write access to `C:\Program Files\nodejs` and failed with EPERM without elevation. The `packageManager` field still pins the version in-repo.
- **No `nx init`, no Nx plugins, no Nx Cloud.** Nx reads targets straight off each `package.json`'s scripts, which covers `dev`/`build`/`lint`/`typecheck`. Manual config also matches the spec's "kept explicit".
- **Tailwind "preset" is a stylesheet, not a JS object.** Tailwind v4 is CSS-first — no `tailwind.config.js`, no `presets` array. Apps `@import "@intromax/config/tailwind/theme.css"`.
- **Shared packages export TS source, not a built `dist/`**, compiled by the app through `transpilePackages`. No build step or watch mode to keep in sync; a non-Next consumer would need a real build added.
- **`typecheck` runs `next typegen` first.** Next generates `LayoutProps`/`PageProps` into `.next/types`; without typegen, `tsc` fails on a clean checkout.
- **`@source` lives in the shared theme.** Tailwind only scans the importing app's directory, so `packages/ui` class names generated nothing. Declaring `@source "../../ui/src"` inside `theme.css` means future apps inherit it instead of each repeating it.
- **Shared versions live in a pnpm `catalog:`.** `react`, `react-dom`, `typescript`, `eslint` and the `@types/*` are declared once in `pnpm-workspace.yaml`. Without it, `packages/ui`'s `react: ^19` would eventually resolve to a different copy than the app's pin — and since ui is compiled in place, that means two Reacts and `Invalid hook call`.
- **An `eslint/react` rung to match the tsconfig trio.** `packages/ui` was inheriting only `base` (no React rules at all), which made shared components the one place rules-of-hooks wasn't enforced. `next.mjs` deliberately does *not* compose it — `eslint-config-next` registers the react-hooks plugin itself and flat config rejects the duplicate key.
- New dependencies in `packages/config`: `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks` — needed for the shared flat configs to parse and lint TypeScript and React outside the Next app.
- Skipped `create-next-app`'s generated `AGENTS.md` (`--no-agents-md`) so the root `AGENTS.md` stays the single source of conventions.

**Known leftovers (deliberately not touched — Stage 2 territory):**
- `apps/portfolio/app/globals.css` still carries create-next-app's `body { font-family: Arial, … }`, which overrides the Geist fonts `layout.tsx` loads. Content only renders in Geist because `page.tsx` sets `font-sans` on a wrapper.
- `WorkspaceBadge` and `SITE_NAME` exist purely to prove the workspace linkage. Delete both when real components and content land.

**Review:** `code-reviewer` subagent run before PR; its findings on Nx cache inputs, the missing `packages/config` lint target, the React lint gap, and version drift are all folded into the decisions above.

**Next:** Stage 2 — architecture & design system (`packages/ui` gets real components; `theme.css` gets real tokens; the two Stage 1 placeholders get deleted)

---

## Stage 0 — Agent workflow setup

**Status:** Done

**Shipped:**
- `AGENTS.md` — repo conventions, commands, workflow rules, boundaries
- `docs/spec-template.md` — lightweight spec format for non-trivial changes
- `.claude/agents/code-reviewer.md` — read-only review subagent
- `.gitignore` — Nx/Next.js/pnpm/Cloudflare-aware

**Decisions:**
- Monorepo via Nx, but **manual** app/package scaffolding — Nx used for task orchestration/caching, not its generators
- Shared packages (`packages/common`, `packages/ui`) stay lean — only promote a dependency there if 2+ apps need it
- Agent workflow: single agent for plan + implement (mode-switching), separate `code-reviewer` subagent for independent review before PR
- Backend approach: no CMS/DB by default — starts as a contact-form endpoint (Resend or similar), real DB (Postgres/D1) only added when a specific pet project (e.g. auth practice) needs it
- One branch per change, PR to `main`, no direct commits to `main`

**Next:** Stage 1 — Nx workspace + portfolio app scaffolding (see `docs/specs/001-nx-workspace-scaffolding.md`)

---

<!-- Add new entries above this line as stages complete -->
