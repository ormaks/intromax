# Progress log

Updated at the end of each stage. A stage isn't considered done until this file reflects it. Newest entry at the top.

Each entry: what shipped, key decisions made (and why), what's next.

---

## Stage 2 — Architecture & design system foundation

**Status:** Done — spec: `docs/specs/002-design-system-foundation.md`

**Shipped:**
- `modules/config/tailwind/` — real tokens replacing Stage 1's invented `--color-brand-*` placeholders, plus the five legacy `.ttf` files as shared assets
- `apps/portfolio/app/styles/fonts.ts` — all four loaded font roles via `next/font/local` / `next/font/google`
- `modules/ui` — Button, ButtonLink, Input, TextArea, Card, Link, Heading/Text, Container, and `cn`/`fieldClassName`/`buttonClassName` helpers; `WorkspaceBadge` deleted
- `apps/portfolio/app/components/` — Header (+ BurgerMenu), TextSplit, Preloader, CodeTag
- Five route shells under `app/(pages)/`: `/`, `/about`, `/skills`, `/contact`, plus root-level `not-found` — all prerendered static

**Decisions:**
- **The audit missed the site's dominant color.** `#08fdd8` teal appears 23 times across the legacy SCSS — buttons, borders, input underlines, wordmark glow, 404 glitch — but the audit's `main.scss`-only pass captured only `#252627`/`#fff`/`#515152`. The deeper per-page read the spec asked for also turned up `#37393b` as the form-field fill and `#181818` as the header rail. `docs/legacy-audit.md` now carries the corrected table.
- **Five font roles, not two.** `main.scss:81-107` declares `MyHeader`→Millunium-BOLD, `MyTags`→LaBelleAurore, `MyLogo`→DancingScript (Regular + Bold), `LogoImg`→tempsitc, plus `"Open Sans"` for body copy. Geist is gone.
- **Font role variables are deliberately named differently from the raw ones.** `theme.css` emits `--font-heading` on `:root`; `next/font` sets `--font-millunium` on `<html>`. Same specificity, so sharing a name would make which declaration wins arbitrary — the roles map to the raw names instead.
- **`next/font/local` reaches into `modules/config` fine.** The planned fallback (copy into each app's `public/`, `@font-face` by URL) was not needed, so future apps inherit the files rather than re-copying them.
- **`TextSplit` is a hover effect, not an entrance animation.** The legacy `TextAnimation.js` splits text into per-letter spans that play animate.css's `rubberBand` for 1s on `mouseenter`. Nothing reveals letter-by-letter on load. Rebuilt with CSS keyframes only.
- **No motion library.** Both signature effects are pure CSS in the legacy site already, so nothing new entered `package.json` for them. Stage 4's sphere can still make its own case.
- **Accessible text in `TextSplit` comes from keeping real space characters, not from ARIA.** Two approaches that look right both fail: `aria-label` on the wrapper is ignored because a bare span is a generic role (the heading then read `"Hi,IamMaks"`), and a visually-hidden copy paired with an `aria-hidden` letter subtree made Chrome announce the string twice — it still walks the hidden subtree for name-from-content. `whitespace-pre-wrap` keeps the spaces from collapsing between inline-block letters.
- **`Preloader` uses `useSyncExternalStore`, not `useState` + `useEffect`.** Document readiness is external state, and `react-hooks/set-state-in-effect` correctly rejects the effect version. Its server snapshot reports "not loaded" so the loader is in the markup Next sends: hydration runs well before `window.load`, so the opposite (which is how this was first written) painted the page and *then* dropped a full-screen overlay over content the visitor could already read. A `<noscript>` rule hides it outright, which is what keeps a JS-less visitor from being stuck behind it.
- **`next` is now a `modules/ui` peer dependency**, because `Link` wraps `next/link` to keep client-side routing in shared components. Added to the pnpm `catalog:` alongside React for the same single-copy reason. This is the one thing standing between `modules/ui` and a non-Next consumer.
- **Dark only.** create-next-app's `prefers-color-scheme` block is gone; the legacy site has one theme.
- Component convention changed repo-wide: folder per component, `camelCase` folder, `PascalCase` file, `index.ts` barrel — replacing Stage 1's flat kebab-case. Documented in `AGENTS.md` so it does not drift back.

**Known leftovers (deliberately not touched):**
- `SITE_NAME` in `modules/common` survives from Stage 1 and is now unused — `apps/portfolio` still declares the `@intromax/common` dependency but no longer imports it. Left per the stage's scope call; worth deleting when `modules/common` gets real content.
- The legacy cursor (`cursor.cur`), the mirrored SVG wordmark, wolf imagery, the 404 glitch treatment and the skills sphere are all Stage 4.
- Font licensing for `Millunium-BOLD` and `tempsitc` is unverified — `tempsitc` looks like Tempus Sans ITC, which is commercially licensed. Agreed to settle this at Stage 6, before anything deploys publicly.
- `apps/portfolio` reaches into `modules/config` by relative filesystem path for the font files, because `next/font/local` does not resolve package specifiers. Fine in a single workspace tree; it would break an isolated build context (Docker, `pnpm deploy`). Flagged in `fonts.ts`; revisit at Stage 6.
- `TextSplit` splits headings into per-letter spans, which is a known screen-reader hazard even with the spaces preserved. The Chrome accessibility tree reads the headings correctly, but no NVDA/VoiceOver pass has been done — worth one before Stage 4 builds more on it.

**Review fixes (from the `code-reviewer` pass):**
- **Mobile nav opened a full viewport below the fold.** The panel is `absolute top-full` but `<header>` had no `relative`, so it positioned against the initial containing block. Genuinely broken on mobile, and invisible to the DOM-only checks that had "verified" the toggle — those confirmed `display` flipped, never *where* the panel landed.
- **The preloader was inverted** (see the decision above).
- **`text-muted` was doing functional work at ~2:1 contrast** — nav links, all three form labels, body copy. The token is legacy and stays; using the *decorative* color for navigation and labels was a new mistake, not a migrated one. Those are `text-foreground` now (17.8:1), and muted is decoration only.
- **The decorative `<h1>` markers were being read aloud** on every route — ten "less than h 1 greater than" announcements. Now behind a `CodeTag` component that owns the `aria-hidden`.
- **The heading breakpoint was 640px, not the legacy 480px** — 480-639px rendered small where the legacy renders large. Now `min-[480px]:`, with the comments corrected to match.
- **Home duplicated `Button`'s class list on a link.** Extracted `buttonClassName` and added `ButtonLink`, mirroring the existing `fieldClassName` pattern.
- Dropped `tempsitc.ttf` from the loaded set (its consumer is the Stage 4 wordmark) and set `preload: false` on the two below-the-fold display faces — font preloads went from six to two. Also fixed a `fonts.ts` comment that claimed pnpm symlink resolution when the paths are plain relative traversal, and removed the dead `./tailwind/fonts/*` export it implied.
- Active nav state is prefix-aware, so Stage 4/5 sub-routes still light up their tab.
- Added a skip link, and `Metadata` typing is now consistent across routes.

**Verification:** lint, typecheck and `next build` pass (all 5 routes static). In-browser: routes and 404 resolve, console clean of `Invalid hook call`, `document.fonts.check` confirms Millunium actually rendering at 56px rather than falling back, accent/foreground tokens and contrast ratios confirmed live, the `rubber-band` hover rule and keyframes confirmed present in the CSSOM, the mobile panel confirmed flush with the header edge with socials reachable, and the heading confirmed at 56px at 520px / 35px at 375px. Screenshots were not possible — the Browser pane was hidden for this session, which also blocked pointer-driven hover and click, so those were verified through the DOM and CSSOM instead. **The hover bounce has therefore never been watched running**; the rule, the keyframes and the `@media (hover: hover)` guard are confirmed present, which is not the same thing.

**Follow-up polish (after handoff, requested in review of the diff):**
- **Recurring legacy pixel values became real Tailwind theme tokens** instead of scattered arbitrary brackets: `rounded-control` (3px, the site's one border-radius), `w-header` (55px, the rail width — also referenced from padding via `pl-(--width-header)`, since padding and width are different Tailwind utility families and only one token is needed), `h-field` (50px, input height), `text-button` (13px), and a real `xs:` variant (`--breakpoint-xs: 30rem`) replacing the one-off `min-[480px]:` arbitrary variant. Left arbitrary and documented as such: TextArea's 150–250px min/max height (single-use, no clean scale rounding), the two `vh`-based hero heights (compositional choices with no legacy or scale equivalent), and the shadow glows on form fields (literal legacy alpha values).
- **`app/` restructured around a Next route group.** `app/` previously mixed route folders (`about/`, `contact/`, `skills/`) with `components/` at the same level, which read as clutter. Every route now lives under `app/(pages)/` — parens mean the segment is stripped from the URL, so `app/(pages)/about/page.tsx` still serves `/about` — leaving `app/` itself holding only what Next actually requires there (`layout.tsx`, `not-found.tsx`) plus two organizational folders (`components/`, `styles/`). Confirmed by testing, not assumed: `not-found.tsx` *cannot* move into the group — doing so silently replaced the custom 404 with Next's plain default for any genuinely unmatched path, so it stays at `app/not-found.tsx`. Cross-file imports inside `app/` now go through the `@/*` alias (already declared in `tsconfig.json`) rather than relative paths, so they don't get uglier as routes nest inside the group.
- `AGENTS.md` documents both: the new theme-token convention and the `app/` layout, including the two things that had to stay put and why.

**Next:** Stage 3 — contact form backend (Resend-backed endpoint; the legacy form never submitted anywhere, so this is new functionality)

---

## Stage 1 — Nx workspace + portfolio app scaffolding

**Status:** Done — spec: `docs/specs/001-nx-workspace-scaffolding.md`

**Shipped:**
- Root workspace: hand-written `package.json`, `pnpm-workspace.yaml`, `nx.json`, `.nvmrc`
- `apps/portfolio` — Next.js 16.3.0, App Router, TypeScript, Tailwind v4, via `create-next-app`
- `modules/config` — shared tsconfig (`base`/`react`/`next`), eslint flat configs (`base`/`next`), Tailwind theme stylesheet
- `modules/ui`, `modules/common` — minimal real modules, linked into the app and rendering on the home page
- `.claude/launch.json` so the dev server can be driven directly

**Decisions:**
- **Node 24, not the 22 the spec said.** The dev machine runs 24 with no version manager installed; a 22 pin would have been a number nothing honored. Next 16 only requires >=20.9.
- **pnpm installed globally rather than via corepack.** `corepack enable` needs write access to `C:\Program Files\nodejs` and failed with EPERM without elevation. The `packageManager` field still pins the version in-repo.
- **No `nx init`, no Nx plugins, no Nx Cloud.** Nx reads targets straight off each `package.json`'s scripts, which covers `dev`/`build`/`lint`/`typecheck`. Manual config also matches the spec's "kept explicit".
- **Tailwind "preset" is a stylesheet, not a JS object.** Tailwind v4 is CSS-first — no `tailwind.config.js`, no `presets` array. Apps `@import "@intromax/config/tailwind/theme.css"`.
- **Shared modules export TS source, not a built `dist/`**, compiled by the app through `transpilePackages`. No build step or watch mode to keep in sync; a non-Next consumer would need a real build added.
- **`typecheck` runs `next typegen` first.** Next generates `LayoutProps`/`PageProps` into `.next/types`; without typegen, `tsc` fails on a clean checkout.
- **`@source` lives in the shared theme.** Tailwind only scans the importing app's directory, so `modules/ui` class names generated nothing. Declaring `@source "../../ui/src"` inside `theme.css` means future apps inherit it instead of each repeating it.
- **Shared versions live in a pnpm `catalog:`.** `react`, `react-dom`, `typescript`, `eslint` and the `@types/*` are declared once in `pnpm-workspace.yaml`. Without it, `modules/ui`'s `react: ^19` would eventually resolve to a different copy than the app's pin — and since ui is compiled in place, that means two Reacts and `Invalid hook call`.
- **An `eslint/react` rung to match the tsconfig trio.** `modules/ui` was inheriting only `base` (no React rules at all), which made shared components the one place rules-of-hooks wasn't enforced. `next.mjs` deliberately does *not* compose it — `eslint-config-next` registers the react-hooks plugin itself and flat config rejects the duplicate key.
- New dependencies in `modules/config`: `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks` — needed for the shared flat configs to parse and lint TypeScript and React outside the Next app.
- Skipped `create-next-app`'s generated `AGENTS.md` (`--no-agents-md`) so the root `AGENTS.md` stays the single source of conventions.

**Known leftovers (deliberately not touched — Stage 2 territory):**
- `apps/portfolio/app/globals.css` still carries create-next-app's `body { font-family: Arial, … }`, which overrides the Geist fonts `layout.tsx` loads. Content only renders in Geist because `page.tsx` sets `font-sans` on a wrapper.
- `WorkspaceBadge` and `SITE_NAME` exist purely to prove the workspace linkage. Delete both when real components and content land.

**Review:** `code-reviewer` subagent run before PR; its findings on Nx cache inputs, the missing `modules/config` lint target, the React lint gap, and version drift are all folded into the decisions above.

**Next:** Stage 2 — architecture & design system (`modules/ui` gets real components; `theme.css` gets real tokens; the two Stage 1 placeholders get deleted)

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
- Shared packages (`modules/common`, `modules/ui`) stay lean — only promote a dependency there if 2+ apps need it
- Agent workflow: single agent for plan + implement (mode-switching), separate `code-reviewer` subagent for independent review before PR
- Backend approach: no CMS/DB by default — starts as a contact-form endpoint (Resend or similar), real DB (Postgres/D1) only added when a specific pet project (e.g. auth practice) needs it
- One branch per change, PR to `main`, no direct commits to `main`

**Next:** Stage 1 — Nx workspace + portfolio app scaffolding (see `docs/specs/001-nx-workspace-scaffolding.md`)

---

<!-- Add new entries above this line as stages complete -->
