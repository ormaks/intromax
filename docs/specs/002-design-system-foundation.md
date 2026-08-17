# Spec: Architecture & design system foundation

## What

Build out `modules/config`'s Tailwind preset with the legacy site's real design tokens, and scaffold `modules/ui` with a first set of shared components — generic primitives plus the two signature pieces (letter-split text animation, preloader) — wired directly into real pages in `apps/portfolio` so everything is built and verified in context, not in isolation.

## Why

Foundation for every page and every future pet-project app. Getting tokens and the core component API right now avoids rework once content (Stage 4) and additional apps (Stage 5) start depending on it.

## Scope

**In scope:**
- `modules/config` Tailwind preset: colors, font roles, and spacing extracted from the legacy audit (`docs/legacy-audit.md`) — dark background `#252627`, text `#fff`, muted decorative-text color `#515152`, accent `#08fdd8`, the five custom font roles, custom font files migrated as shared assets
- `modules/ui` package scaffold (real, buildable, consumed via workspace protocol — not a stub)
- Layer 1 primitives: Button, Input, Textarea, Card, Link, Typography (heading/body components mapped to the font tokens), Container/layout wrapper
- Layer 2 signature components: `TextSplit` (letter-by-letter animation, rebuilt clean — no legacy dependency), `Preloader`
- Minimal page shells in `apps/portfolio` for Home, About, Skills, Contact, NotFound — enough structure/routing to actually exercise every new component, without full legacy content or pixel-perfect fidelity yet
- No Storybook / isolated component preview — components are built and reviewed directly on their real pages

**Out of scope (explicitly):**
- Final page copy/content (Stage 4 — legacy content rewrite)
- The skills tag-cloud/sphere component (complex enough to warrant its own spec — candidate for Stage 4 alongside the rest of the visual-fidelity pass)
- Contact form backend/submission logic (Stage 3)
- Cloudflare deploy config (Stage 6)
- Full pixel-for-pixel fidelity to the legacy site — that's Stage 4's job once content lands on this foundation

## Approach

1. Read `docs/legacy-audit.md` for the token/font source of truth.
2. Build the Tailwind preset in `modules/config`, migrate font files as assets.
3. Scaffold `modules/ui`, build Layer 1 primitives first (they unblock everything else).
4. Build `TextSplit` and `Preloader` as clean, dependency-free reimplementations.
5. Wire `apps/portfolio` routes/pages so each new component gets used somewhere real — even placeholder copy is fine, the point is proving the system works end-to-end.
6. Confirm lint/typecheck/build still pass.

## Acceptance criteria

- [ ] `modules/config` Tailwind preset reflects the extracted legacy tokens (colors, all five font roles)
- [ ] Custom font files present as assets and actually rendering in `apps/portfolio`
- [ ] `modules/ui` exports Button, Input, Textarea, Card, Link, Typography, Container, `TextSplit`, `Preloader` — each consumed at least once in a real `apps/portfolio` page
- [ ] Home/About/Skills/Contact/NotFound page shells exist and route correctly (content can be placeholder)
- [ ] `TextSplit` visibly reproduces the legacy per-letter hover bounce
- [ ] Lint, typecheck, build all pass

## Open questions

- None blocking. Flag anything found in the deeper per-page SCSS files (beyond `main.scss`) that meaningfully changes the token set, rather than guessing.

## Findings from the per-page SCSS pass

Answering the question above — three things the audit's `main.scss`-only read had missed:

1. **`#08fdd8` is the site's dominant accent**, 23 uses across the SCSS: button fills and borders, input underlines, the SVG wordmark glow, the 404 glitch. Neither the audit nor this spec's original scope mentioned it.
2. **Five font roles, not two** (`main.scss:81-107`): `MyHeader`→`Millunium-BOLD`, `MyTags`→`LaBelleAurore`, `MyLogo`→`DancingScript` (Regular + Bold), `LogoImg`→`tempsitc`, plus `"Open Sans"` for body copy.
3. **`TextSplit` is a hover effect, not an entrance animation.** `containers/TextAnimation.js` splits text into per-letter spans, each playing animate.css's `rubberBand` for 1s on `mouseenter` — there is no letter-by-letter reveal on load. "Letter-by-letter animation feel" in the original wording meant this.
