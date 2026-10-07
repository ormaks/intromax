# Progress log

Updated at the end of each stage. A stage isn't considered done until this file reflects it. Newest entry at the top.

Each entry: what shipped, key decisions made (and why), what's next.

---

## Stage 6 — Wrap-up

**Status:** Done. Stage 6 shipped in one branch (6a): the Experience page, plus three site-wide additions that came out of it:

- the constellation backdrop
- music that keeps playing across pages
- the reworked Skills call to action and sphere

**Carried forward:**

- Animations still ignore `prefers-reduced-motion` (the site-wide decision).
- The mini player can cover the bottom-right corner of a page on phones.
- The site plays one track.
- No NVDA/VoiceOver pass yet, as at the end of Stage 4.

**Next:** Stage 7 — pet-projects section + barbershop duplicate.

---

## Stage 6a — Experience page

**Status:** Done - spec: `docs/specs/006a-experience.md`

**Roadmap reordered:** the Experience page became Stage 6, pet projects Stage 7, and testing Stage 8.

**Shipped — the Experience page:**

- **`/experience`:** long-form case studies of past work, linked from Skills, with no nav icon.
  - An intro from the CV, beside a "What I bring" column.
  - Four case studies: WorkJam, Esko, the design-led real-estate sites, and early projects (Benamix, Sol-Ra, M-Pluse).
  - Jump links, a career timeline with education, and a closing link to Contact.
  - All copy is typed data in `constants/experience.ts`.
- **`components/caseStudy/`:**
  - The section has a `section` code tag, an `h2`, `h3` subheadings and bulleted lists.
  - On desktop it's two columns: the text on the left (capped at 52rem), and key facts and stack chips on the right. Below desktop it stacks facts, text, then stack.
- **`components/diagram/`:** inline-SVG sketches in the site's thin-line style, with flowing dashed connectors. Each is `role="img"` with a label.
  - **The WorkJam platform:** browser, Microsoft Teams and the mobile apps, the monorepo, the separate chat app and its own server, and the APIs and Gemini.
  - **The chat bridge.**
  - Below its minimum width, a diagram scrolls sideways in a focusable region instead of shrinking its text.
- **`PageShell` `scroll`:**
  - On desktop the content block scrolls between the pinned frame tags as a focusable "Page content" region.
  - The edges fade and the scrollbar is thin.
  - The document-level lock stays as it is.
- **Reading text:**
  - Inter (`next/font/google`, not preloaded) through the `reading-text` utility in `globals.css`.
  - Theme tokens: `--font-reading`, `text-reading` and `text-reading-sm`, and `text-heading-md` and `text-heading-md-sm` for section headings.

**Shipped — across the site:**

- **`components/constellationBackdrop/`, mounted by `PageShell`:** a dim canvas constellation on every framed page. The 404 has its own scene and no backdrop.
  - Stars drift and link to their neighbours, and to the mouse when it comes near.
  - It runs on GSAP's ticker and stays still until the preloader lifts.
  - At most 140 stars, at up to 2× resolution.
  - A resize rescales the stars rather than reshuffling them.
- **Skills:**
  - **Link:** a boxless "See more about my experience" link under the category chips, 14px (16px from tablet).
    - Its underline keeps drawing itself in (`underline-draw`), and its arrow nudges (`arrow-nudge`).
    - On hover or focus the underline settles in full, both glow, and the arrow hurries.
    - The page still fits at 1280×600.
  - **Sphere:** words on its far half ignore the pointer, so only the front-facing words light up or pulse.
- **Music across the site:**
  - **`components/musicProvider/`:**
    - Owns the one hidden SoundCloud widget from the root layout, so music keeps playing through client-side navigation.
    - SoundCloud loads only once a page calls `load()`.
    - Volume starts at 70%.
  - **About's player:** now a view over `useMusic()`, with a volume slider. Seek and volume share the thin glowing `LineSlider`.
  - **Seeking before the first play works:**
    - A seek sent before the track has ever played leaves SoundCloud's widget stuck, so the provider holds it and sends it once playback starts.
    - The e2e stub mimics that quirk.
  - **`components/miniPlayer/`:**
    - Floats bottom-right on pages without the full player, once the track has played.
    - It has a sound-wave, the title linking back to About, play/pause, and close (pause and hide until the next play).

**Decisions:**

- **Content came from an interview with you:**
  - Company and client names (WorkJam, Esko) are shown. Real-estate site names and links, screenshots, logos and per-project dates are not.
  - Case-study roles use the general "Frontend Developer".
  - The chat isn't named, and is described at a high level because of the NDA. Teams is mentioned in general terms only.
  - Each case study is presented as the highlights, alongside many other features.
  - A colleague's site was a source of shared facts that you confirmed, never of wording.
  - The copy grew about 50% over the first approved version, which is kept as "exp1".
- **Scroll inside the frame, not the document.** The single-screen desktop design and its global lock stay intact.
- **Inter over the monospace prose:** long text reads at 16px/1.65 instead of 12px mono. Headings and code tags keep the site's look.
- **Picked from playable previews:**
  - **Skills link:** the underline-and-arrow variant, over orbit, typing, light sweep and mini-constellation.
  - **Backdrop:** the pointer-reactive constellation, darkened for reading, then extended to every page.
- **Music across pages through the root layout,** because App Router keeps it mounted during client navigation. The widget never remounts, and nothing per page is hardcoded.
- **Shared class sets go in a Tailwind `@utility`,** never in a style-only constants file.

**Review fixes (three `code-reviewer` passes):**

- **Experience page:**
  - The desktop scroll region and the scrollable diagrams take keyboard focus.
  - Jump links land below the top fade.
  - Diagram labels stay legible on phones, and captions sit off their connector lines.
  - The e2e scroll container is found by its role.
- **Backdrop:**
  - It keeps its stars across resizes, such as a mobile URL bar showing or hiding.
  - The star count and canvas resolution are capped, and the per-frame loop uses indexes rather than array copies.
  - It stays still until the preloader lifts.
  - Stars clamp at the edges, and the pointer resets on window blur.
- **Music:**
  - The drag flag clears when pointer capture is lost or the player unmounts.
  - The widget's listeners are unbound if their effect re-runs (React's development double-invoke).
  - The mini player's close button is 32px.

**Not changed (deliberately):**

- New animations ignore `prefers-reduced-motion`, following the site-wide decision.
- Focus falls back to the page when the mini player closes.
- On phones the mini player can cover the bottom-right corner of the content.
- One track only: the first track loaded stays for the session.

**Verification:**

- Lint, typecheck, build (every route static) and Prettier pass. The full e2e suite passes (75/75). New and extended specs:
  - **`experience.spec.ts`:** structure, scrolling inside the frame, keyboard scrolling, jump links, Inter, the backdrop's pointer links, the contact link, and mobile.
  - **`music.spec.ts`:** SoundCloud stays unloaded on Home, music keeps playing across pages, and the mini player pauses, closes and links back to About.
  - **About:** the early seek and the volume slider.
  - **Skills:** the link and the sphere's far side.
  - **Shell:** the backdrop on every framed page and none on the 404.
- **In the browser:**
  - The page at 1440×900 and 375px: pinned frame tags, jump links, no horizontal overflow.
  - Skills at 1280×600.
  - Against the real SoundCloud widget: playing on About, moving to Skills, the mini player showing "A Walk", and pausing from it.
- **Not watched live:** the backdrop's motion in the browser pane, which wasn't running animation frames this session. The e2e pixel test covers the pointer links.

---

## Stage 5a — Cloudflare CI/CD

**Status:** Done - live at https://intromax-portfolio.ormaks.workers.dev. Spec: `docs/specs/005a-cloudflare-deploy.md`

**Roadmap reordered:** CI/CD moved up to Stage 5, so everything after it ships through a checked pipeline. Pet projects are now Stage 6, testing Stage 7.

**Shipped:**

- **OpenNext adapter in `apps/portfolio`:**
  - `wrangler.jsonc`: Worker `intromax-portfolio` on `workers.dev`, with `nodejs_compat`, static assets and Workers Logs.
  - `open-next.config.ts`: the static-assets incremental cache.
  - `preview` and `deploy` scripts.
- **New dev dependencies (app-local):** `@opennextjs/cloudflare` and `wrangler`. In `pnpm-workspace.yaml`, `allowBuilds` sets `esbuild` and `workerd` to `false`, because their binaries come as per-platform optional packages.
- **`.github/workflows/ci.yml`:**
  - `checks` runs lint and typecheck, then the OpenNext build (`next build` plus the Worker bundle).
  - `e2e` runs the full suite on bundled Chromium and uploads traces if it fails.
  - `deploy` runs only on `main`, after both pass.
  - A newer push cancels an older PR run. A started run on `main` is never cancelled.
- **`apps/portfolio/.env.example` is restored.** The Stage 3 entry lists it, but it was never committed. `preview` reads the same `.env.local` as `next dev`: when there's no `.dev.vars`, wrangler falls back to `.env` and `.env.local`, so a second example file isn't needed.
- **Ignores:** ESLint (shared `next` config) and Prettier skip `.open-next/` and `.wrangler/`.
- **AGENTS.md:** a Deploy section (workflow, secrets table), the new commands, and the app-root files.

**Decisions:**

- **GitHub Actions deploys, not Cloudflare Workers Builds.** Deploys wait for lint, typecheck and e2e, and the pipeline lives in the repo.
- **No PR previews, no custom domain, no Dependabot** for now.
- **No R2/KV.** Every route is prerendered and nothing revalidates, so the read-only cache from static assets is enough.
- **`run-many`, not `nx affected`, in CI.** There's one app. Switching to `affected` makes sense once pet projects land.

**Review fixes (`code-reviewer` pass):**

- **The Worker bundle is built on every PR.** `checks` runs `opennextjs-cloudflare build`. Without it, the first merge to `main` would have been the first time the bundle was ever built.
- **The first CI run caught a `--skipNextBuild` mistake.** OpenNext reads Next's standalone output, which only its own build turns on (`NEXT_PRIVATE_STANDALONE`), so bundling a plain `next build` failed on a missing `.next/standalone`. `checks` now lets the OpenNext build run the Next build itself, in place of Nx's `build` target.
- **Concurrency wording** in the workflow and docs is now precise: a run on `main` is never cancelled once started, but a newer push replaces a run that is still queued.
- **Not changed:**
  - `compatibility_date` `2026-09-30` is within the installed workerd (1.20260930).
  - Actions are pinned to major tags rather than SHAs. Secrets only reach the deploy step, and the workflow token is read-only.

**Wrap-up (`fix/stage-5-wrap-up`):**

- **CI annotations from the first green run:**
  - `pnpm/action-setup` is bumped to v6, which runs on Node 24. v4 targeted the deprecated Node 20.
  - Runners are pinned to `ubuntu-24.04` instead of `ubuntu-latest`, which moves to Ubuntu 26 on 19 October 2026. Playwright's `--with-deps` installs system packages per distro, so the runner image changes only when we choose.
- **About plays Tycho - "A Walk"** (SoundCloud 85216615, Tycho's own upload), in place of a fan upload of Amy Winehouse's "Back to Black".
  - You picked an instrumental with a clean title that suits the site's mood.
  - Candidates were checked for SoundCloud's stream policy from the dev machine. Most big-label hits are blocked or play only a 30-second preview there, for example "Get Lucky", "Uptown Funk" and "Blinding Lights". Tycho's upload streams in full.
  - The policy can differ by country. The player's "Listen on SoundCloud" fallback covers a visitor for whom the track doesn't play.
- **Prettier leaves trailing commas out of `.jsonc`** (an override in `.prettierrc.json`). Its default adds them, which editors that validate `wrangler.jsonc` as strict JSON flag as errors.
- README ticks Stage 5, and the spec records what CI and the live site verified.

**Verification:**

- Lint, typecheck and `next build` pass, and the full e2e suite passes (57/57).
- **The OpenNext bundle builds only in CI.** Locally, `opennextjs-cloudflare build` gets through `next build`, then fails while copying traced files with `EPERM: symlink`. Windows only lets non-admin shells create symlinks with Developer Mode on. `checks` builds it on Ubuntu for every PR.
- **The live site:** every route returns 200, an unknown path returns the custom 404, and prerendered pages are served with `s-maxage=31536000`.
- **Not verified yet:** a contact form message sent from the live site. It needs the two Worker secrets in Cloudflare.

---

## Stage 4 — Wrap-up

**Status:** Done. Every page of the legacy site is rebuilt across 4a-4h:

- the global shell
- the header
- Home, About, Skills and Contact
- the 404
- a closing polish pass

**Carried forward:**

- No NVDA/VoiceOver pass yet. Accessibility has been checked through Chrome's accessibility tree and Playwright's role queries.
- Animations deliberately ignore `prefers-reduced-motion` (a site-wide decision).

**Next:** Stage 5 — pet-projects section.

---

## Stage 4h — Polish pass

**Status:** Done — spec: `docs/specs/004h-polish.md`

**Shipped:**

- **TextSplit headings read as whole words.** The letters sit in an `aria-hidden` wrapper next to an `sr-only` copy of the text.
  - Chrome's accessibility tree now names every page heading once and normally ("About me", "Hi, I'm Maks, frontend developer.", and so on).
  - This closes the Stage 4c note about letter-by-letter headings.
- **e2e:** headings are asserted with `getByRole("heading", { level: 1, name })` using exact names.
- **`e2e/fixtures.ts`:**
  - Every spec imports `test`/`expect` from it.
  - An automatic fixture stubs SoundCloud on every page, so a full run makes no SoundCloud requests (checked with a catch-all route logger).
  - The player's fallback tests pick `test.use({ soundCloud: "blocked" | "no-sound" })`.
- **`modules/common`:** the unused `SITE_NAME` is gone. `PetProject` stays for Stage 5.
- **Skills e2e:** the "pulses through its group" test samples every frame instead of polling, which removes a flake under full-suite load.

**Decisions:**

- **`sr-only` copy instead of `aria-label` on the heading.**
  - The copy lives inside TextSplit, so every heading gets it without callers doing anything.
  - Chrome reads the name once, not twice.
- **Out of scope (your call):** code-tag spacing, a side-by-side visual pass, replaying Home on resize, and `tailwind-merge`.

---

## Stage 4g — 404

**Status:** Done — spec: `docs/specs/004g-not-found.md`

**Shipped:**

- `app/not-found.tsx` renders `components/notFoundScene/`:
  - a constellation that has fallen apart into drifting dots
  - a glitching "404" (CSS keyframes: a scale flicker plus red and blue offset copies) over "Page not found"
  - "Take me home"
- Hovering or focusing "Take me home" pulls the dots back into the spinning, linked sphere; leaving scatters them. On touch screens it loops by itself.
- `components/constellation/` is shared with the preloader. It gained an `assembled` amount (0-1, eased) and exposes `data-assembled` for tests.
- `e2e/not-found.spec.ts`: a 404 status, the heading and link, and the sphere assembling on hover and scattering on leave. `shell.spec.ts` now checks the 404 heading by its accessible name.

**Decisions:**

- **Broken constellation** over a glitch circle or a terminal error. You picked it from playable concepts. It reuses the preloader's sphere, so the page reads as the site's own visuals breaking and repairing.
- **The heading's accessible name is "404 - Page not found"** (screen-reader text), while the visible "404" glitch and its copies are `aria-hidden`.
- **Sphere size:** 240px on mobile, 288px on tablet, 384px on desktop.

**Review fixes (`code-reviewer` pass):**

- `Constellation` follows its canvas's CSS size with a ResizeObserver, so a breakpoint change or phone rotation redraws it at the right scale and sharpness.
- `data-assembled` is written only when the state flips, not every frame.
- An e2e test covers keyboard focus on "Take me home" rebuilding the sphere.
- **Not changed:** the glitch and the sphere ignore `prefers-reduced-motion`, following the site-wide decision that everything animates.

**Next:** Stage 4h — polish pass.

---

## Stage 4f — Contact

**Status:** Done — spec: `docs/specs/004f-contact.md`

**Shipped:**

- `app/contact/page.tsx`:
  - **Left:** the accent "Contact me" heading, the intro, and the form.
  - **Right:** the channels above the CV card.
  - A meta description.
- `components/contactChannels/`: GitHub, email, LinkedIn, Instagram and Telegram as round icon links.
  - With a mouse, each leans toward the pointer (GSAP) and springs back with an elastic ease.
  - Hover or focus turns it accent and types its handle under the row.
- `components/cvCard/`: a page-1 thumbnail that tilts on hover, with preview and download.
  - **Tablet and up:** preview opens a native `<dialog>` with the PDF in the browser's own viewer.
  - **Mobile:** preview opens the PDF in a new tab.
- `components/risingLetters/`: wraps the form, so every typed character rises from the exact caret position (found with a mirror of the field) and fades. Pastes send up at most 12 characters.
- `public/cv/`: the CV PDF, plus a page-1 thumbnail rendered once with pdf.js in a scratch script.
- `GithubIcon` and `LinkedinIcon` (Font Awesome Free 7, CC BY 4.0) in the icon set.
- `ContactForm`: name and email share a row from tablet up.
- `e2e/contact.spec.ts`: heading and form, channel links and handle typing, the CV dialog and Escape, rising letters cleaned up, the short-desktop fit, and the mobile preview link.

**Decisions:**

- **No map** (it would show the city), and **no live message preview.** The preview was tried in a mockup and dropped.
- **The CV is published as is**, phone numbers included. You accepted that.
- **Name and email on one row.** At 1280×600 the stacked form overflowed the non-scrolling desktop page by about 95px, which hid the Send button. One row fixes that.
- **The CV preview uses the browser's PDF viewer** rather than a PDF library: no dependency, and zoom, pages and print for free.

**Polish from your review (riding along in this PR):**

- **Contact:** small code-tag titles above the right column's blocks, `<find me />` and `<cv />` (`CodeTag` gained a `selfClosing` form).
- **Autofilled fields keep the dark field colour.** Chrome paints autofilled inputs with its own light background, which CSS can't override directly. `Input` and `TextArea` (`modules/ui`) defer that background change indefinitely with a very long `:autofill` transition and pin the text colour.
- **Readable form text:** labels, inline field errors and toasts switched from the handwriting tag font to the monospace prose font (`modules/ui` Input, TextArea, Toast).
- **Header:** the "Ormaks" text is gone; the spinning wolf stands alone. Dancing Script was only used there, so its font load and the `--font-logo`, `--color-wordmark` and `text-logo` tokens are removed too. The Home wordmark is outlined paths and doesn't need the font.
- **Preloader:**
  - The folding squares are replaced by a **mini constellation**: a small, tilted, spinning sphere of 18 linked dots on a canvas (`preloader/Constellation.tsx`), echoing the Skills sphere. You picked it from five playable concepts, after trying a wolf draw-in first.
  - The bar's tip is now a single glowing dot. The old tip laid a background-coloured fade over the fill, which showed as a dark patch with stray glow.
  - About's wolf draw-in lives in `components/wolf/drawIn.ts` (`drawWolfIn`, `hideWolf`).
- **Not a site bug:** the "children should not have changed" console error that paused the debugger as the loader finished comes from the React DevTools extension's own hook (`installHook.js`), not app code. Updating the extension, or not pausing on caught exceptions, avoids it, and it never reaches visitors.
- **e2e:** About's wolf tests target the reactive wolf by test id, so they can never pick up another wolf on the page.

**Review fixes (`code-reviewer` pass):**

- **Letters typed in the email field rose from its left edge.** `type="email"` inputs report no `selectionStart`, so the caret mirror was empty. The caret now falls back to the end of the value, and an e2e test checks that email letters start well along the field.
- **Caret mirror width:** the mirror takes the field's width minus any scrollbar, so a long message in the textarea wraps the same way.
- **Channel handle:** hover and keyboard focus are tracked separately. Leaving one icon with the pointer no longer blanks the handle of another that still has focus.
- **CV thumbnail:** re-rendered at 120px (25KB, was 203KB) and served `unoptimized`. It doesn't depend on Next's image optimizer, which isn't set up for the Cloudflare deploy yet.
- **e2e:** channel links are scoped to their own list, and the letter overlay has a test id.
- **Not changed:** IME and autocorrect input (`insertCompositionText`, `insertReplacementText`) don't send letters up. It's decorative, and most mobile keyboards go through those.
- **PDF metadata checked:** author, Canva and design IDs; nothing sensitive. The embedded title reads "Chytailo_CV, копия, копия" and shows in the viewer's title bar, so it's worth fixing on the next Canva export.

**Verification:**

- Lint and typecheck pass; `contact.spec.ts` passes (8/8); the full suite passes (54/54) after the polish round.
- In real Chrome:
  - layout at 1440, 800 and 375, and the fit at 1280×600
  - the magnetic hover and typed handle
  - the CV dialog showing the PDF
  - letters rising from the caret

**Next:** Stage 4g — 404.

---

## Stage 4e — Skills

**Status:** Done — spec: `docs/specs/004e-skills.md`

**Shipped:**

- `app/skills/page.tsx`:
  - the "Skills & Experience" heading
  - word-split prose in which every named technology is a button wired to the sphere
  - four category chips
  - a closing line with LinkedIn (new tab) and contact links
  - a meta description
- `components/skillSphere/`, the **constellation sphere**:
  - 34 skills in four categories, each category gathered in its own region (greedy assignment of evenly spread points to tetrahedron centres)
  - each skill linked to its 4 nearest neighbours
  - quaternion rotation on GSAP's ticker
  - words as real list items positioned with transforms; links and pulses on a canvas behind them
- **Interactions:**
  - The sphere spins slowly and fades in after the preloader.
  - The pointer steers it over the sphere column, not over the text.
  - A **linked word** lights only its skill and turns it to the front.
  - A **chip** lights its category and turns the group to the front.
  - A **sphere word** lights itself and its links.
  - Highlighted words grow to 1.3×, and clicks send pulses along the links.
  - On release, the slow spin resumes.
- `SkillFocus`: a small context through which the prose links and chips drive the sphere
- `TextSplit`:
  - **link mode** (`href`): the text is one link that bounces as a unit, and external URLs open in a new tab
  - word-split text is now `inline`, so several segments and links flow as one paragraph
- `e2e/skills.spec.ts`:
  - heading, prose and 34 skills
  - a linked word lights only its skill and centres it
  - a chip lights exactly its group
  - steering over the sphere column vs the text column
  - links
  - mobile stacking

**Decisions:**

- **Constellation over orbit rings or colour clusters.** You picked it from playable prototypes. It keeps one accent colour, and the links make the skills read as a connected set.
- **Hybrid rendering.** Words are HTML: crisp text, a real list for screen readers, CSS hover. The canvas draws only lines and dots.
- **Plain-TS controller** (`sphere.ts`, `geometry.ts`), like the wolf's spring field. Per-frame state lives outside React; components only wire events to it.
- **Before JavaScript runs, the skills show as a plain wrapped list.** The sphere takes over the layout once it attaches.

**Bug caught during verification:**

- Internal TextSplit links (`/contact`) opened in a new tab. Shell escaping while editing had truncated the external-URL regex, leaving a RegExp object that is always truthy. The e2e test now asserts the contact link has no `target`.

**Review fixes (`code-reviewer` pass):**

- **Focus ownership.** A prose link or chip releases only the focus it set, and leaving a sphere word restores whatever focus is still held. Before, leaving one control could cancel another's keyboard focus. Covered by a new e2e test.
- **Releasing a focus keeps an active steer** instead of stalling the spin until the next pointer move.
- **Prose links and chips react to hover only for the mouse.** A tap no longer leaves the sphere locked on a focus.
- **Both lists carry `role="list"`**, because `list-none` drops list semantics in Safari.
- **The geometry comment states the actual screen-aligned axes.**
- **Not changed:** the sphere ignores `prefers-reduced-motion`, following the site-wide decision that everything animates.

**Fixes from your review:**

- **Categories are now truly contiguous.**
  - The greedy placement filled the largest group (tooling and testing) last and stranded Jest on the far side.
  - A swap pass now moves points between categories while that pulls each one tighter around its own centre.
  - e2e checks that every category's skills reach the front together.
- **Chip clicks pulse again.**
  - The pulse started from the group's first skill, which was the stranded Jest. None of Jest's links stayed inside the group, so the pulse had nowhere to go.
  - `pulseGroup` now starts from the group's most central skill and spreads until the group is covered.
  - e2e checks that the pulse reaches several words.
- **The turn to a focused skill is a timed ease-in-out** (1.2s, `power2.inOut`), not a per-frame exponential approach, so it starts gently instead of lurching. A new focus mid-turn starts from wherever the sphere is.
- **Hovering a word on the sphere stops the spin** rather than slowing it. The stop is quick but not abrupt, so the word stays under the cursor even mid-steer, and the spin resumes on leave. Covered by e2e.
- **Highlights ease in alongside the turn** instead of snapping. Each word and link carries an eased lit amount, settling in about 0.9s. The rest dims, the lit word brightens and grows, and its links light up together while the sphere turns. Only words that are neither lit nor neighbours dim, so the focused word never dips before brightening.
- **Lit links are dimmer than lit words**, at a brightness between the resting links and the words, so highlighted text stays readable.

**Verification:** lint, typecheck, build and 46/46 e2e pass; the Skills spec also passed 3 repeated runs. In real Chrome:

- a linked word and a chip each turned the sphere to their skills
- pulses travel along the group's links
- the page fits at 1440×900 and 1280×600
- tablet and mobile stack the sphere below the text

**Known leftovers:**

- Pulses aren't asserted by e2e (canvas-only); they were checked visually.
- The shared TextSplit heading a11y name and code-tag spacing are left for 4h.

**Next:** Stage 4f — Contact.

---

## Stage 4d — About

**Status:** Done — spec: `docs/specs/004d-about.md`

**Shipped:**

- `app/about/page.tsx`:
  - the accent "About me" heading and a six-paragraph word-split bio, written from the CV and functionality-first (no company names)
  - a meta description
- `components/musicPlayer/`: our own player over a hidden SoundCloud widget, driven by the Widget API. It has:
  - an accent play/pause button
  - title and artist
  - a glowing progress line that seeks on click, drag or arrow keys, with elapsed/total time
  - a skeleton while loading, and a "Listen on SoundCloud" link if the widget isn't ready in 10s
- `components/reactiveWolf/` (desktop only):
  - the wolf draws in after the preloader
  - its lines and shapes bend away from the pointer and spring back
  - a click sends out an accent ripple ring, plus a shockwave that knocks nearby lines outward to wobble back on the same spring
  - a small spring simulation (`springField.ts`) runs on GSAP's ticker, only while anything moves
- `modules/ui`: a new `Skeleton` (pulsing placeholder, sized by `className`)
- `types/soundcloud.ts`: the slice of the Widget API we call
- `e2e/about.spec.ts`, against a stubbed Widget API (offline, deterministic):
  - heading and copy
  - load, play and seek
  - wolf bend and spring-back, click ripple and shockwave
  - fallback when blocked
  - a clean exit from About
- **Site copy uses "-", never "—"** (new AGENTS.md rule). Existing titles, the contact toast and the logo label were updated to match.

**Decisions:**

- **The right column is a reactive wolf**, an interactive piece you chose in review.
- **A custom player over the Widget API, not SoundCloud's iframe UI.** The API is current, and the right column now matches the site. SoundCloud's script is the one new external script; SoundCloud itself isn't a new service.
- **The legacy track is kept.** Hosh's "Tighter" (CamelPhat Remix) has no official SoundCloud upload, only mashups that tend to disappear.
- **The spring simulation lives outside React** (`createSpringField`). It mutates per-frame state, which React Compiler's lint rules reject in refs, and it's clearer as plain code with a four-method surface.
- **Sizing uses Tailwind scale values only.** The `PageShell` indents are the one exception.

**Bugs caught during verification:**

- **Leaving About crashed the next page** ("This page couldn't load"). On unmount the widget iframe is already gone, and SoundCloud's `unbind` throws when it messages a detached frame. The cleanup now only talks to the widget while its iframe is connected. The fake widget in the e2e stub throws the same way, so the regression test failed before the fix and passes after.
- **SoundCloud's widget logged canvas errors in a 1px iframe.** The hidden iframe now takes the player's full box (invisible, click-through) and is allowed `encrypted-media`.

**Review fixes (`code-reviewer` pass):**

- The play button changes its label ("Play" / "Pause") and no longer also sets `aria-pressed`. The two together announced "Pause, pressed", which reads as the opposite state.
- A track that reports ready with no sound (removed or region-locked) now shows the SoundCloud link instead of an empty player. Covered by a test.
- The wolf e2e test keeps sweeping the pointer until the lines respond, instead of a fixed wait, so a slow machine can't make it flaky.
- Not fixed:
  - A progress event already in flight can snap the seek thumb back for one frame after a drag. It's cosmetic and self-corrects on the next event.
  - The spring runs per frame, not per unit of time, so it feels slightly livelier on high-refresh screens. It's decorative.

**Verification:**

- Against live SoundCloud in Chrome: the track loads, plays from our button, seeks by click (50% → 123s of 244s) and by arrow keys, with no console errors.
- The wolf bends and returns to its exact original points.
- The bio fits without scrolling at 1440×900 and at short desktop heights (1280×600, 1100×620).

**Known leftovers:**

- The shared TextSplit heading a11y name and code-tag spacing (end-of-Stage-4 polish pass).
- Other pages' e2e tests that visit About hit live SoundCloud. They don't depend on it loading, but they do make the request.
- Side-by-side screenshots go in the PR.

**Next:** Stage 4e — Skills.

---

## Stage 4c — Home

**Status:** Done — spec: `docs/specs/004c-home.md`

**Shipped:**

- `app/page.tsx`:
  - the three-line TextSplit heading ("Hi," / "I'm Maks," / "frontend developer.")
  - the subtitle "React / TypeScript / Next.js"
  - CONTACT ME → `/contact`
  - a meta description
- `components/wordmark/`: "Ormaks" outlined from Dancing Script Regular, one path per glyph, generated once by a scratch script with `opentype.js` (never in the repo)
- `components/homeArt/`:
  - desktop: the wolf, a 45°-rotated wordmark with a neon glow, and a blurred mirrored reflection
  - tablet: wolf and upright wordmark, bottom-anchored
  - mobile: a 2%-opacity wolf watermark
  - GSAP timeline, gated on `usePreloaderDone()`: 4s DrawSVG wordmark draw with the fill over the last 20%, a ~3s top-to-bottom wolf draw with each filled part (forehead, eyes, nose) fading in as the strokes reach it, and a looping neon blink
- `Preloader`: fades out over 300ms instead of vanishing. "Done" fires as the fade starts, so the Home draw-in begins under the fading overlay.
- `TextSplit` bounce: ends on the real `animationend`, not a 1s timer. Re-hovering used to keep resetting the timer, which left the class on and blocked new bounces until the pointer had been away for a second. A hover mid-bounce now queues one replay that starts when the current bounce ends, so quick back-and-forth sweeps keep the letters moving without bounces cutting each other off. Covered by `e2e/textSplit.spec.ts`.
- `hooks/useMediaQuery.ts`, the app's first hook. It keeps the wordmark off mobile and the reflection off tablet, and 4d reuses it.
- `PageShell`: new `backdrop` and `inset` props
- `modules/ui`: `Button`/`ButtonLink` gained `size` (`default` | `responsive`)
- Theme tokens: `--color-subtle`, `text-caption`, `text-button-sm`; button text line-height `normal`
- `gsap` + `@gsap/react` in `apps/portfolio` only
- `e2e/home.spec.ts`:
  - heading, subtitle and navigation
  - glyph counts per breakpoint (12 on desktop, 6 on tablet, 0 on mobile)
  - the blink really dips, with and without reduced motion
  - clean navigation away mid-animation

**Decisions:**

- **No reduced-motion exceptions, the blink included.** The site is animation-first. A steady-glow fallback was considered because the flicker is close to WCAG's flash limit, and deliberately not taken.
- **Geometry follows the legacy markup exactly.** The boxes, text origins and positions were measured equal to the live legacy site at 1440 and 800. The glow is kept because Chrome does render the legacy `text-shadow`, which the spec had assumed it didn't.
- **React decides what mounts (`useMediaQuery`); GSAP decides what animates.** The server renders the full picture, so no-JS visitors see it finished.
- **Button sizes are complete class sets**, not caller overrides, because `cn()` doesn't dedupe. `PageShell`'s `inset` follows the same rule.

**Known leftovers:**

- **Shared spacing gap:** code tags are 25px tall versus legacy's 33px (`text-tag` line-height), and the tablet/mobile content block starts about 20px higher than legacy. On Home that puts the subtitle and button 4px (desktop) to 33px (tablet) higher. The fix belongs in shared `CodeTag`/`PageShell`, affecting every page, so it's worth its own change.
- The button renders Open Sans, where legacy fell back to Arial (Open Sans was never loaded there). The button is about 3px taller and a little narrower. This is the 4a font decision, not a regression.
- Side-by-side screenshots go in the PR.
- **TextSplit headings are read letter by letter.** Chrome's own accessibility tree names the Home heading "H i , I ' m M a k s , …" and About's "A b o u t m e". The Stage 2 note said Chrome read them correctly, so this is worse than recorded. It affects every page, and the likely fix is an `aria-label` on the heading element (a real `h1` role honours it, unlike the generic span tried in Stage 2). Worth its own change before more TextSplit copy lands.
- Resizing across the tablet or desktop breakpoint replays the Home draw-in, because mounting the wordmark or reflection rebuilds the timeline. Not fixed: it's decorative and only happens on a live resize or rotation.

**Next:** Stage 4d — About.

---

## Stage 4b — Header

**Status:** Done — spec: `docs/specs/004b-header.md`

**Shipped:**

- `apps/portfolio/components/header/` rebuilt in three layouts:
  - desktop: a 55px side rail with the spinning wolf and wordmark, icon nav that widens into a labelled tab on hover or focus, and socials at the bottom
  - tablet: a 60px top bar with everything in one row
  - mobile: a top bar with a centred wordmark and a burger that morphs into an accent ✕, sliding the nav row in under the bar and the socials into it
- `apps/portfolio/components/icons/`: seven Font Awesome Free 7 icons (CC BY 4.0), one file for the set
- `apps/portfolio/components/wolf/`: the wolf mark as 96 stroked polylines plus 4 filled shapes, symmetric and ordered for a staggered draw-in (used by 004c)
- Theme tokens: `--height-header`, `--color-wordmark`, `--font-sans-serif`, `text-label` / `text-icon` / `text-icon-sm` / `text-logo`
- Root layout clears the fixed bar with `pt-(--height-header)` (the offset 004a deferred)
- `e2e/header.spec.ts`: burger open/close, Escape and focus return, back-navigation, and no overflow at 375; the bar at 800; the rail, active page and hover tab at 1440; accessible names

**Decisions:**

- **The wolf was traced by a throwaway script**, then mirrored and hand-corrected. Only the path data is in the repo. See the spec's Deviations for the method.
- **Header links use `next/link` directly, not `@intromax/ui`'s `Link`.** `cn` only concatenates, so `Link`'s own `hover:text-foreground` beat the header's `hover:text-accent`, depending on CSS emission order. The same class-conflict issue hit the burger's widths and the wolf's `h-auto`. It's systemic: `tailwind-merge` in `cn` would fix it at the root, and is worth raising as its own change.
- **Sizes follow the Tailwind scale**, even where a legacy value is a pixel off (hover tab 64px instead of 65, nav column 288px instead of 300). Recurring header type and the wordmark grey are named tokens, not arbitrary values.
- **Closed mobile panels are `invisible` as well as off-screen**, so keyboard and screen-reader users can't reach them. Visibility transitions with the slide.
- **Home icon is the regular (outline) house**, matching user and envelope.
- **No reduced-motion override.** The site-wide `prefers-reduced-motion` rule, which had been in `globals.css` since Stage 2, is removed. The site is animation-first, so animations play whatever the OS setting. The rule showed its cost once Windows' "Show animations" was off: it silently disabled the TextSplit bounce, the preloader and the logo spin.

**Review fixes (`code-reviewer` pass):**

- Escape returns focus to the burger.
- The burger has a constant "Menu" label.
- The menu closes on any route change (including back/forward) and on growing past mobile width.
- Focus rings are inset so the tablet bar doesn't clip them.
- Labels show on keyboard focus.
- ~~Reduced motion also zeroes transition delays.~~ Superseded (see Decisions).
- `isActive` is segment-aware.

**Also in this change (outside the header):**

- `suppressHydrationWarning` on `<body>`, covering its own attributes only, because browser extensions inject attributes there before hydration.
- The shell smoke test checks for the preloader in the server HTML instead of waiting for it to become visible. On a slow first load it could lift before `goto()` returned.
- A repo-wide Prettier pass (formatting only), the first since the pre-commit hook landed.

**Known leftovers:**

- `tailwind-merge` for `cn` (see above). It would be a new `modules/ui` dependency, so it needs flagging first.
- Side-by-side screenshots against the legacy site go in the PR. Not yet checked: the wolf rendering crisp at 300px+ (it's only shown at 44–56px until 004c), and the desktop rail against the legacy site.
- The desktop rail's content is about 475px tall, but its `min-height` is 400px. On desktop-width viewports shorter than that, the socials run off the bottom of the fixed rail. Not fixed: `overflow-y: auto` would also clip the hover tab sideways, and viewports that short at 1025px+ wide are rare.
- The tablet media query in `Header.tsx` repeats `--breakpoint-tablet` as a literal. It's commented, but would drift if the breakpoint changed.

**Next:** Stage 4c — Home.

---

## Stage 4a — Global shell

**Status:** Done — spec: `docs/specs/004a-global-shell.md`

**Shipped:**

- Breakpoints reduced to the three layouts: unprefixed (≤480), `tablet:` (481+) and `desktop:` (1025+). Tailwind's defaults are cleared, and every `sm:`/`xs:` usage has been migrated.
- `components/pageShell/`, which wraps Home/About/Skills/Contact (not the 404):
  - the per-page preloader
  - the decorative `<body>` … `</body></html>` frame
  - the single-screen desktop geometry (`top: 5%`, `height: 90%`, `min-height: 566px`)
- Preloader rework:
  - replays for 1.5s on every navigation
  - on first load, waits for `load` (capped at 5s)
  - `usePreloaderDone()` for entrance animations
  - visual pass on the cube, label and progress bar
- Global styles:
  - custom cursor (`public/cursor.png`)
  - `user-select: none`
  - keyboard-only `:focus-visible` accent ring
  - prose in the system monospace stack, buttons in Open Sans
  - `text-prose`/`text-prose-lg` tokens
- New favicon and apple-touch-icon; `tempsitc.ttf` and `--font-logo-alt` removed
- Playwright (`@playwright/test`, app-local) with a smoke suite against a production build on port 3100, plus an `e2e` Nx target
- After the stage: a Husky pre-commit hook (lint-staged ESLint + Prettier, then `nx affected -t typecheck`) and Prettier as the formatter

**Decisions:**

- **Preloader "done" is React context, not a module store.** A store leaked the previous page's "done" into the next page's first render.
- **Desktop scroll lock starts at 596px tall, not 566.** `top: 5%` plus a 566px page only fits from about 596px, so shorter viewports scroll instead of clipping.
- **Playwright uses the installed Chrome** (`channel: "chrome"`), because the bundled Chromium download kept timing out. `PLAYWRIGHT_CHANNEL=""` switches back.
- **No `aria-busy` wrapper around pages.** The overlay's `role="status"` already announces loading.
- **The preloader is mounted per page, not in `app/template.tsx`.** A root template would also wrap the global 404, which must have no loader.
- **`Text`'s `body` variant became the mono prose style** instead of adding a variant: every existing use was page prose.
- **Code comments no longer reference the legacy site.** It's an AGENTS.md rule now; legacy comparisons live only in `docs/`.

**Known leftovers:**

- Visual snapshot tests (`toHaveScreenshot`) are planned for the end of Stage 4.
- Font licensing for Millunium is unverified; it's a Stage 6 item.

**Next:** Stage 4b — Header.

---

## Stage 3 — Contact form backend

**Status:** Done — spec: `docs/specs/003-contact-form-backend.md`

**Shipped:**

- `apps/portfolio/actions/contact.ts` — first Server Action in the repo (`'use server'`), validates name/email/message, calls Resend, returns a typed `ContactFormState`
- `apps/portfolio/components/contactForm/` — client component (`useActionState`), wired into `apps/portfolio/app/contact/page.tsx` in place of the Stage 2 inert placeholder form
- `modules/ui` — new `Notification` component (`success`/`failure`/`info`), reusable across future apps; `Input`/`TextArea`'s `error` prop changed from `boolean` to `string` and each component now renders its own inline error message
- `apps/portfolio/.env.example` — documents `RESEND_API_KEY`, `CONTACT_RECIPIENT_EMAIL` (placeholders only)
- `resend` added to `apps/portfolio/package.json` (app-local, per the dependency-boundary rule)

**Decisions:**

- **Recipient address is an env var (`CONTACT_RECIPIENT_EMAIL`), not hardcoded.** Same reasoning as not hardcoding the API key — keeps a personal address out of git history.
- **Resend's default sending domain (no verified domain — out of scope this stage) generally only delivers to the email on the Resend account itself.** Flagged before implementation; the Resend account is expected to be set up so the recipient matches. First thing to check if real delivery doesn't work.
- **Error message ownership moved into `modules/ui` itself.** The first real form in the workspace exposed a genuine gap — `Input`/`TextArea` only had a boolean `error` before. Rather than composing a separate `Text` element per field in the page (the original plan), `error` became a `string` and the components render their own message. A deliberate `modules/ui` public-API change, not a premature one — driven by an actual second requirement, not speculation.
- **`Notification` is intentionally generic**, not contact-form-specific — success/failure/info banner for any async action, meant for reuse by future apps. Colors reuse existing tokens rather than inventing new hues: `success` → `--color-accent` (already the site's "positive action" teal), `failure` → `--color-danger` (already the site's one error color), `info` → neutral (`--color-foreground` on `--color-border`, no accent). It is _not_ used for per-field validation hints — those stay small inline text on the field itself; a boxed banner under every invalid input would be visually heavy.
- **`fieldClassName` util removed.** Its shared class list is now inlined directly into `Input.tsx` and `TextArea.tsx` — accepted duplication over a shared helper, per explicit direction from review of the initial plan.
- **Server Actions get a dedicated `apps/portfolio/actions/` folder**, not colocated per-route — a deliberate home for this and future actions, added to `AGENTS.md`'s app root layout list.
- **No logging dependency.** The app deploys to Cloudflare Workers (`@opennextjs/cloudflare`), which already captures `console.log`/`console.error` through Workers Logs / `wrangler tail` — a real log sink (Sentry, etc.) is a Stage 6-adjacent decision, not needed now. The action logs the real Resend error server-side via a structured `console.error` before returning the generic client-facing message.
- **The agent never touches `.env.local`.** The user pastes the real `RESEND_API_KEY`/`CONTACT_RECIPIENT_EMAIL` in themselves; the agent only ever created `.env.example` with placeholders. Real-email and real-Resend-failure verification are therefore manual steps left to the user, not something the agent claims to have confirmed.
- **`.env.example` lives in `apps/portfolio/`, not the repo root.** Nx runs each project's `package.json` scripts with that project's directory as the working directory, so Next.js only auto-loads `.env.local` from `apps/portfolio/` — a repo-root `.env.example` would have documented the wrong location.

**Bug caught during verification:**

- `new Resend(process.env.RESEND_API_KEY)` was originally called _outside_ the `try` block. With no key configured, the constructor throws synchronously, which crashed the whole Server Action uncaught — the page fell back to Next's generic "This page couldn't load" error screen instead of the intended generic-failure `Notification`. Exactly the kind of raw error the spec's acceptance criteria says must not reach the user. Caught by submitting valid data against this dev environment's already-missing `RESEND_API_KEY` (no `.env.local` exists here) — fixed by moving the constructor inside the `try`. Re-verified: the same submission now renders the `Notification variant="failure"` banner, and the real `Missing API key` error only appears in the server console via the structured `console.error`.

**Known leftovers (deliberately not touched — out of scope per the spec):**

- Bot/spam protection (honeypot, rate limiting).
- Domain-verified Resend sending — current default-domain delivery constraint (only delivers to the account's own address) noted above as a decision, not solved.
- Cloudflare production env var configuration for `RESEND_API_KEY`/`CONTACT_RECIPIENT_EMAIL` — Stage 6.
- Real successful email delivery and a real Resend-API-failure state (as opposed to a missing-key failure) were not verified by the agent — both require a real `.env.local`, which is the user's to create; worth a manual pass before calling the feature fully live.

**Verification:** `pnpm nx run-many -t lint typecheck` and `pnpm nx build portfolio` all pass (all 5 routes still static, including `/contact`). In-browser: submitting all-empty fields renders all three per-field alerts and confirmed (network tab) Resend is never invoked; submitting valid data with no `RESEND_API_KEY` configured exercises the real failure path end-to-end, confirming the generic `Notification` renders instead of a raw error (see bug above). Screenshots were not possible — the Browser pane was hidden for this session — verified via the accessibility tree and server logs instead.

**Review fixes (from the `code-reviewer` pass):**

- **Header injection via the `name` field.** `name` was interpolated raw into the outgoing email's `from` display name and `subject`. Server Actions accept arbitrary `FormData` (not limited to what a single-line `<input>` produces in a browser), so an unsanitized `name` containing `\r\n` could inject extra email headers. Added `sanitizeHeaderValue()` (trims, strips CR/LF) and applied it to `name` before it's used in `from`/`subject`; `email` and `message` are now trimmed consistently too. `email` itself was already safe — the validation regex rejects whitespace characters outright.
- **Missing client-side "nicety" validation.** The spec listed this as in-scope, but none of the three fields had a `required` attribute, so an all-empty submission always round-tripped to the server before showing anything. Added `required` to all three fields; server-side validation in `actions/contact.ts` remains the actual source of truth, unchanged.
- **Not fixed, by design: the form isn't cleared after a successful send.** Flagged by the reviewer as a UX gap (stale values could be resubmitted as a second email), but this was an explicit decision made with the user before implementation — "leave fields filled" was chosen over a reset, and nothing in the spec requires a reset. Left as-is.

**`Notification` redesign (requested after handoff): self-positioning toast, not an inline banner.**

- `Notification` moved from an inline banner rendered inside the form to a self-contained toast: `position: fixed` at the top-right corner (`top-6 right-6`, `z-40` — above the header's `z-30`), slide/fade in on mount, auto-dismiss after a default 5s shown as a shrinking bar along the bottom edge, or dismiss immediately on click. It unmounts itself once its exit transition finishes rather than relying on the parent to stop rendering it.
- Became a client component (`"use client"`) — the first in `modules/ui` — since the timers/animation state require it. Each other component in the module stays server-renderable on its own; nothing about this forces client-only status onto the rest of the barrel.
- `ContactForm` now gives each toast occurrence a `key` (`` `success-${toastKey}` `` / `` `error-${toastKey}` ``, bumped once per completed submission) — without it, two identical results in a row (e.g. two successful sends) would reuse the same already-dismissed instance instead of restarting the animation/timer, since React only remounts on a `key` or type change, not just because a submission happened again with the same message.
- **Two real bugs caught during this round, both fixed:**
  - `react-hooks/set-state-in-effect` (real lint rule, not a style nit) caught a synchronous `setState` call at the top of the mount effect. Fixed by dropping the redundant explicit reset (the initial `useState` value already covers it) and keeping only the `setTimeout`-scheduled state changes, which are the async-callback case the rule allows.
  - The enter animation was originally gated behind `requestAnimationFrame`, which never fires while a tab isn't compositing frames (confirmed against this session's own Browser pane, which hit the same "not compositing" wall documented in Stage 2's hover-bounce caveat) — a toast mounted in a backgrounded tab would have stalled indefinitely. Replaced with a short `setTimeout(10)`, which doesn't depend on the tab being visible.
  - Separately, the timer bar's shrink transition toggled `transitionDuration` and `transform` together in the same style update, which doesn't reliably trigger a CSS transition. Fixed by holding `transitionDuration` constant (set once, from the first render) and only toggling `transform` — the same "static duration, toggled value" shape already used for the outer enter/exit transition.
- **Verification:** lint/typecheck/build re-run clean after each fix. In-browser (a fresh dev server was needed — the previously-running one predated the `.env.local` update, and Next only reads env vars at boot, not on hot-reload): confirmed fixed positioning, correct role (`alert` for failure/`status` for success), correct token colors, auto-dismiss actually removing the element from the DOM within the expected window, and click-dismiss ending the toast within ~450ms instead of waiting out the 5s timer. **Not verified**: smooth frame-by-frame interpolation of the transitions themselves — this session's Browser pane doesn't composite frames (no screenshots possible either, same limitation Stage 2 hit), so `getBoundingClientRect`/`getComputedStyle` can only confirm start/end states, not motion in between. The code now uses the standard, well-supported CSS-transition shape rather than the broken one, but an actual visual pass (a real browser tab) is worth doing before calling the animation itself confirmed.
- Testing this sent several real test emails to the configured recipient via the live Resend account (already-configured credentials, exercised directly rather than mocked) — expected fallout of verifying against the real integration, not requiring separate flagging.

**Toast API redesign: imperative functions + a shared host, not a component every consumer renders.** The `<Notification>` JSX component from the round above still required each consumer to render it inline and manage its `key`/visibility — the user asked instead for an imperative API (`toastSuccess("...")`, matching the react-hot-toast/sonner shape) callable from anywhere, and for multiple simultaneous toasts to actually stack rather than the single-instance-per-call-site limitation the previous design carried.

- `modules/ui/src/notification/` replaced by `modules/ui/src/toast/`: a module-level store (`toastStore.ts` — plain array + listener `Set`, no external state library) holds the current list of toasts; `toastSuccess`/`toastError`/`toastInfo` (`toast.ts`) just push into it. `ToastHost` (mount once, e.g. root layout) subscribes via `useSyncExternalStore` — the same pattern `Preloader` already established for external, non-React state — and renders the current list as a `fixed`, top-right, vertically-stacked column; each `ToastItem` owns its own animation/dismiss lifecycle (identical enter/timer-bar/exit logic as the previous single-toast version) and calls `removeToast(id)` on itself when its exit transition finishes.
- `Notification`'s `"failure"` variant is renamed `"error"` throughout, to match the public `toastError` function name 1:1 instead of the two disagreeing.
- `apps/portfolio/app/layout.tsx` mounts `<ToastHost />` once, next to `<Preloader />`. `ContactForm` no longer renders any toast JSX or manages a remount `key` — it just calls `toastSuccess`/`toastError` from a `useEffect` keyed on `state` (fires once per completed submission, since `useActionState` returns a fresh object reference each time). The stacking problem this solves is more than cosmetic: the earlier per-consumer `Notification`, being a single JSX node position, could only ever show one toast at a time per call site; the shared store has no such ceiling; multiple calls from anywhere in the app now render as independent, simultaneously-visible entries.
- **Verified stacking directly**: two submissions ~1.2s apart rendered two distinct toast elements at once (`top: 24px` and `top: 110px`, same left edge) — confirms the store correctly accumulates entries and `ToastHost` renders all of them, not just the latest.

**`label` moved into `Input`/`TextArea`.** Both previously rendered only the bare field; every consumer hand-rolled its own `<label>` + wrapping `flex flex-col gap-1` div (`ContactForm` had three near-identical copies). Both now accept an optional `label?: string` — with it, they render `label` + field + inline error inside that same wrapper div; without it, they return just the field (+ error, if any) with no wrapper, unchanged from before. `id` falls back to `useId()` when the consumer doesn't pass one, so `label`'s `htmlFor` and the error message's `aria-describedby` both stay correctly wired even if a future caller omits `id`. `ContactForm`'s three fields collapsed from a `<div><label/><Input/></div>` each down to a single `<Input label="name" .../>` call. Verified the `for`/`id` pairing directly in the DOM after the change (`name`↔`name`, `email`↔`email`, `message`↔`message`).

**Next:** Stage 4 (not yet spec'd) — content migration and the legacy visual details flagged as Stage 2 leftovers: the cursor, mirrored wordmark, wolf imagery, 404 glitch treatment, and skills sphere.

---

## Stage 2 — Architecture & design system foundation

**Status:** Done — spec: `docs/specs/002-design-system-foundation.md`

**Shipped:**

- `modules/config/tailwind/` — real tokens replacing Stage 1's invented `--color-brand-*` placeholders, plus the five legacy `.ttf` files as shared assets
- `apps/portfolio/styles/fonts.ts` — all four loaded font roles via `next/font/local` / `next/font/google`
- `modules/ui` — Button, ButtonLink, Input, TextArea, Card, Link, Heading/Text, Container, and `cn`/`fieldClassName`/`buttonClassName` helpers; `WorkspaceBadge` deleted
- `apps/portfolio/components/` — Header (+ BurgerMenu), TextSplit, Preloader, CodeTag
- Five route shells directly under `app/`: `/`, `/about`, `/skills`, `/contact`, plus root-level `not-found` — all prerendered static

**Decisions:**

- **The audit missed the site's dominant color.** `#08fdd8` teal appears 23 times across the legacy SCSS — buttons, borders, input underlines, wordmark glow, 404 glitch — but the audit's `main.scss`-only pass captured only `#252627`/`#fff`/`#515152`. The deeper per-page read the spec asked for also turned up `#37393b` as the form-field fill and `#181818` as the header rail. `docs/legacy-audit.md` now carries the corrected table.
- **Five font roles, not two.** `main.scss:81-107` declares `MyHeader`→Millunium-BOLD, `MyTags`→LaBelleAurore, `MyLogo`→DancingScript (Regular + Bold), `LogoImg`→tempsitc, plus `"Open Sans"` for body copy. Geist is gone.
- **Font role variables are deliberately named differently from the raw ones.** `theme.css` emits `--font-heading` on `:root`; `next/font` sets `--font-millunium` on `<html>`. Same specificity, so sharing a name would make which declaration wins arbitrary — the roles map to the raw names instead.
- **`next/font/local` reaches into `modules/config` fine.** The planned fallback (copy into each app's `public/`, `@font-face` by URL) was not needed, so future apps inherit the files rather than re-copying them.
- **`TextSplit` is a hover effect, not an entrance animation.** The legacy `TextAnimation.js` splits text into per-letter spans that play animate.css's `rubberBand` for 1s on `mouseenter`. Nothing reveals letter-by-letter on load. Rebuilt with CSS keyframes only.
- **No motion library.** Both signature effects are pure CSS in the legacy site already, so nothing new entered `package.json` for them. Stage 4's sphere can still make its own case.
- **Accessible text in `TextSplit` comes from keeping real space characters, not from ARIA.** Two approaches that look right both fail: `aria-label` on the wrapper is ignored because a bare span is a generic role (the heading then read `"Hi,IamMaks"`), and a visually-hidden copy paired with an `aria-hidden` letter subtree made Chrome announce the string twice — it still walks the hidden subtree for name-from-content. `whitespace-pre-wrap` keeps the spaces from collapsing between inline-block letters.
- **`Preloader` uses `useSyncExternalStore`, not `useState` + `useEffect`.** Document readiness is external state, and `react-hooks/set-state-in-effect` correctly rejects the effect version. Its server snapshot reports "not loaded" so the loader is in the markup Next sends: hydration runs well before `window.load`, so the opposite (which is how this was first written) painted the page and _then_ dropped a full-screen overlay over content the visitor could already read. A `<noscript>` rule hides it outright, which is what keeps a JS-less visitor from being stuck behind it.
- **`next` is now a `modules/ui` peer dependency**, because `Link` wraps `next/link` to keep client-side routing in shared components. Added to the pnpm `catalog:` alongside React for the same single-copy reason. This is the one thing standing between `modules/ui` and a non-Next consumer.
- **Dark only.** create-next-app's `prefers-color-scheme` block is gone; the legacy site has one theme.
- Component convention changed repo-wide: folder per component, `camelCase` folder, `PascalCase` file, `index.ts` barrel — replacing Stage 1's flat kebab-case. Documented in `AGENTS.md` so it does not drift back.

**Known leftovers (deliberately not touched):**

- `SITE_NAME` in `modules/common` survives from Stage 1 and is now unused — `apps/portfolio` still declares the `@intromax/common` dependency but no longer imports it. Left per the stage's scope call; worth deleting when `modules/common` gets real content.
- The legacy cursor (`cursor.cur`), the mirrored SVG wordmark, wolf imagery, the 404 glitch treatment and the skills sphere are all Stage 4.
- Font licensing for `Millunium-BOLD` and `tempsitc` is unverified — `tempsitc` looks like Tempus Sans ITC, which is commercially licensed. Agreed to settle this at Stage 6, before anything deploys publicly.
- `apps/portfolio` reaches into `modules/config` by relative filesystem path for the font files, because `next/font/local` does not resolve package specifiers. Fine in a single workspace tree; it would break an isolated build context (Docker, `pnpm deploy`). Flagged in `fonts.ts`; revisit at Stage 6.
- `TextSplit` splits headings into per-letter spans, which is a known screen-reader hazard even with the spaces preserved. The Chrome accessibility tree reads the headings correctly, but no NVDA/VoiceOver pass has been done — worth one before Stage 4 builds more on it.
- **`TextSplit` has no link-wrapper mode.** Legacy `TextSplit` could render as `tagName="link"`, splitting text inside a `next/link`-equivalent — used inline for "LinkedIn" and "contact" mid-paragraph on the Skills page (`Skills.js`). **Blocks the Skills-page content migration** — Stage 4 needs this built before that page's real copy can land with the same inline-link treatment the legacy site had.

**Review fixes (from the `code-reviewer` pass):**

- **Mobile nav opened a full viewport below the fold.** The panel is `absolute top-full` but `<header>` had no `relative`, so it positioned against the initial containing block. Genuinely broken on mobile, and invisible to the DOM-only checks that had "verified" the toggle — those confirmed `display` flipped, never _where_ the panel landed.
- **The preloader was inverted** (see the decision above).
- **`text-muted` was doing functional work at ~2:1 contrast** — nav links, all three form labels, body copy. The token is legacy and stays; using the _decorative_ color for navigation and labels was a new mistake, not a migrated one. Those are `text-foreground` now (17.8:1), and muted is decoration only.
- **The decorative `<h1>` markers were being read aloud** on every route — ten "less than h 1 greater than" announcements. Now behind a `CodeTag` component that owns the `aria-hidden`.
- **The heading breakpoint was 640px, not the legacy 480px** — 480-639px rendered small where the legacy renders large. Now `min-[480px]:`, with the comments corrected to match.
- **Home duplicated `Button`'s class list on a link.** Extracted `buttonClassName` and added `ButtonLink`, mirroring the existing `fieldClassName` pattern.
- Dropped `tempsitc.ttf` from the loaded set (its consumer is the Stage 4 wordmark) and set `preload: false` on the two below-the-fold display faces — font preloads went from six to two. Also fixed a `fonts.ts` comment that claimed pnpm symlink resolution when the paths are plain relative traversal, and removed the dead `./tailwind/fonts/*` export it implied.
- Active nav state is prefix-aware, so Stage 4/5 sub-routes still light up their tab.
- Added a skip link, and `Metadata` typing is now consistent across routes.

**Verification:** lint, typecheck and `next build` pass (all 5 routes static). In-browser: routes and 404 resolve, console clean of `Invalid hook call`, `document.fonts.check` confirms Millunium actually rendering at 56px rather than falling back, accent/foreground tokens and contrast ratios confirmed live, the `rubber-band` hover rule and keyframes confirmed present in the CSSOM, the mobile panel confirmed flush with the header edge with socials reachable, and the heading confirmed at 56px at 520px / 35px at 375px. Screenshots were not possible — the Browser pane was hidden for this session, which also blocked pointer-driven hover and click, so those were verified through the DOM and CSSOM instead. **The hover bounce has therefore never been watched running**; the rule, the keyframes and the `@media (hover: hover)` guard are confirmed present, which is not the same thing.

**Follow-up polish (after handoff, requested in review of the diff):**

- **Recurring legacy pixel values became real Tailwind theme tokens** instead of scattered arbitrary brackets: `rounded-control` (3px, the site's one border-radius), `w-header` (55px, the rail width — also referenced from padding via `pl-(--width-header)`, since padding and width are different Tailwind utility families and only one token is needed), `h-field` (50px, input height), `text-button` (13px), and a real `xs:` variant (`--breakpoint-xs: 30rem`) replacing the one-off `min-[480px]:` arbitrary variant. Left arbitrary and documented as such: TextArea's 150–250px min/max height (single-use, no clean scale rounding), the two `vh`-based hero heights (compositional choices with no legacy or scale equivalent), and the shadow glows on form fields (literal legacy alpha values).
- **`app/` restructured around a Next route group.** `app/` previously mixed route folders (`about/`, `contact/`, `skills/`) with `components/` at the same level, which read as clutter. Every route now lives under `app/(pages)/` — parens mean the segment is stripped from the URL, so `app/(pages)/about/page.tsx` still serves `/about` — leaving `app/` itself holding only what Next actually requires there (`layout.tsx`, `not-found.tsx`) plus two organizational folders (`components/`, `styles/`). Confirmed by testing, not assumed: `not-found.tsx` _cannot_ move into the group — doing so silently replaced the custom 404 with Next's plain default for any genuinely unmatched path, so it stays at `app/not-found.tsx`. Cross-file imports inside `app/` now go through the `@/*` alias (already declared in `tsconfig.json`) rather than relative paths, so they don't get uglier as routes nest inside the group.
- `AGENTS.md` documents both: the new theme-token convention and the `app/` layout, including the two things that had to stay put and why.

**Second follow-up round (more requests against the same diff):**

- **Confirmed `not-found.tsx` can't get its own folder at all, by any means.** Beyond the route-group test above, a _dedicated, otherwise-empty_ route group (`app/(notFoundTest)/not-found.tsx`, nothing else inside it) was tried too — same failure, plain Next default instead of the custom page. It has to be the literal file `app/not-found.tsx`, no wrapper of any kind.
- **`layout.tsx` can't move either, and can't be renamed `_app.tsx`.** No `next.config.ts` option relocates it (only confirmed real option in that neighborhood, `pageExtensions`, changes the recognized file _extension_, not the base filename — checked directly against the installed `next` package's config types). `_app.tsx` is a Pages Router file, a different, older routing system this project doesn't use; Next wouldn't recognize it here at all, and the site would lose its root HTML/body/font wrapper. Left as full content in place, not indirected — the one file with no alternative location gains nothing from a re-export wrapper.
- **`page.tsx` can't become `index.tsx`.** Not a config gap — App Router's special filenames (`page`, `layout`, `loading`, `error`, `not-found`, `route`, `template`, `default`) are fixed specifically because several of them can coexist in the same folder; `index` couldn't disambiguate which role a file plays even if Next allowed it. Renaming would mean reverting to the old Pages Router, undoing Stage 1's explicit App Router choice.
- **`Link` and `ButtonLink` briefly moved off the main `@intromax/ui` barrel onto `@intromax/ui/next`, then reverted back onto the main barrel** — kept on the simpler single-import setup instead of the subpath split. The tradeoff behind the split still holds and is documented in AGENTS.md: because a bundler resolves every module a barrel statically re-exports while building the module graph (before tree-shaking removes what's unused), a non-Next app importing only `Button` from the current single barrel would still need `next/link` to resolve, and fail to build without it. That's a real constraint for a future non-Next pet project, not a hypothetical one — revisit the split then, rather than carrying the extra file and import path now for a need that doesn't exist yet.
- Hit a misleading dev-tooling artifact along the way, not a code issue: after edits, the browser tab kept showing a `Module not found` overlay for an import that no longer existed on disk — surviving a `.next` wipe, a full process-tree kill (`pnpm`/`nx`/`next`, five processes deep), and the Nx daemon being stopped. `next build` (a fresh process every time) had zero errors throughout. The actual cause was simpler than any of that: Next's dev-mode HMR error overlay is sticky in the browser tab's own memory once it catches an error, and doesn't clear just because the underlying server reconnects — a `curl` straight to the server proved it was serving clean output the whole time. Opening a **new browser tab** (not reloading the old one) showed the correct, error-free page immediately. Worth remembering before reaching for server-side fixes: check a fresh tab first.

**Third follow-up round (final restructure for this stage):**

- **The `app/(pages)/` route group was removed.** It solved the original complaint (routes and `components/` mixed in the same listing) by grouping every route together — but the simpler fix is moving `components/` and `styles/` fully out of `app/`, to top-level siblings (`apps/portfolio/components/`, `apps/portfolio/styles/`). With them gone, `app/` naturally holds only routes plus Next's two pinned files, and no route group is needed at all. Routes are flat real folders again — `app/about/page.tsx` → `/about` — which is also the structure nearly every Next.js doc and template assumes, so this is less to explain to a future reader, not more.
- The `not-found.tsx`/`layout.tsx` constraints from the second round are unchanged by this — they're still pinned to `app/` itself, just without a group to be tempted to move them into.
- `favicon.ico` moved from `app/` into `public/`, matching the conventional split (Next also supports an `app/favicon.ico` metadata-file convention, which was fine too — moved for consistency with the rest of the reorganization, not because the old spot was wrong).
- Deleted `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` — create-next-app defaults, confirmed zero references anywhere in `app/`.
- `lib/`, `hooks/`, `utils/`, `types/`, `middleware.ts` — all appeared in the requested target structure but stay unmade: nothing in the app needs them yet, and an empty folder isn't worth the placeholder. Documented in AGENTS.md so the next stage adds them on demand rather than guessing they should already exist.
- Two directory moves (`app/components`, the old `app/(pages)`) hit Windows file-lock errors mid-move, unrelated to the code — WebStorm's TypeScript/Tailwind language servers and the Nx daemon were holding watch handles on those paths. Killing those processes (they restart automatically on next use) cleared it. Not a repo issue, just a note in case a future session hits the same `Permission denied` on a directory rename.

**`TextSplit` fix round (comparison against `containers/TextAnimation.js` requested directly):**

- **The bounce is a timer again, not a CSS `:hover` trigger.** The original build's comment explicitly weighed this tradeoff and dismissed it as "not worth a client component and a timer per character" — wrong call once actually compared against legacy, since it meant unhovering mid-bounce visibly cut the animation short, which reads as broken rather than as the legacy's always-finishes feel. `TextSplit` is `"use client"` again; each unit (`AnimatedUnit`) holds its own `isAnimating` state, set on `mouseEnter`/cleared by a 1000ms `setTimeout` — matching `TextAnimation.js`'s own `setTimeout(..., 1000)` almost exactly. Verified directly: dispatching `mouseover` then `mouseout` at 30ms still shows the animate class present at 500ms and gone by 1200ms — confirms the bounce survives the pointer leaving early, not just that a class gets added.
- **Added `byWord`, a boolean prop** — legacy's `splitBy="words"` was a string switch between exactly two states (letter/word), which a boolean captures without losing anything. Reading every legacy page's usage (`Home.js`, `About.js`, `Skills.js`, `Contact.js`, `NotFound.js`) showed word-split wasn't a minor variant — it's how _all_ of the legacy site's body prose was animated, headings were the letter-split minority. Wired into the About page's placeholder bio so the capability is actually exercised, not just theoretically supported; confirmed in the DOM that it splits into real per-word `<span>` units with correct spacing, not per-letter.
- **Not reproduced: `tagName="link"`** — see "Known leftovers" above; tracked there as a Stage 4 blocker rather than left to fall out of a fix-round paragraph.

**Second `code-reviewer` pass (full-diff review against `main`, PR #2):**

- Fixed a real bug the first pass's smaller diffs never surfaced: `TextSplit`'s `AnimatedUnit` started a `setTimeout` on hover with no unmount cleanup. Legacy `TextAnimation.js` has the identical gap, but only because it's an old class component with no `componentWillUnmount` — not a behavior worth carrying forward into a client component that unmounts for real on `next/link` navigation. Added a `useEffect` cleanup; verified with a real client-side navigation fired 100ms into a bounce, confirming zero console errors past the full 1000ms window.
- Fixed a stale doc comment (`modules/ui/src/index.ts` still said `apps/portfolio/app/components`, left over from the routing restructure) and reconciled `docs/specs/002-design-system-foundation.md`'s acceptance criteria with what actually shipped — `TextSplit`/`Preloader` are app-local, not `modules/ui` exports as originally scoped; the spec now says so and explains why, instead of sitting on unchecked boxes that no longer matched reality.

**`cn` replaced with `classnames`:** the hand-rolled `filter(Boolean).join(" ")` in `modules/ui/src/utils/cn.ts` is now a one-line re-export of the `classnames` package — same call sites, same `cn(...)` name everywhere (nothing else needed to change), just a maintained implementation instead of a bespoke one. Also swept the app for `+`-concatenated or template-literal-with-ternary classNames (`Header.tsx`, `BurgerMenu.tsx`, `layout.tsx`) and converted them to `cn(...)` calls with one logical class group per argument — `condition && "class"` instead of a ternary against `""`. Verified in-browser that the resulting class strings are exactly right: no stray spaces, no literal `"false"`/`"undefined"` text, burger-menu toggle and active-nav-link states both confirmed correct before/after.

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
- **An `eslint/react` rung to match the tsconfig trio.** `modules/ui` was inheriting only `base` (no React rules at all), which made shared components the one place rules-of-hooks wasn't enforced. `next.mjs` deliberately does _not_ compose it — `eslint-config-next` registers the react-hooks plugin itself and flat config rejects the duplicate key.
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
