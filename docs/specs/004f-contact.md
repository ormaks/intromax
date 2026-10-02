# Spec: Stage 4f — Contact page

## What

The Contact page, built around the working contact form (Stage 3):

- **Left:** the "Contact me" heading, a short intro, and the form (name, email, message). Every character you type rises from the spot where it was typed and fades away.
- **Right:**
  - **Channels:** a row of five magnetic icon links (GitHub, email, LinkedIn, Instagram, Telegram).
  - **CV card:** a card for the CV, which can be previewed in the page or downloaded.

## Why

The form already works. The page around it should feel like the rest of the site: playful, animated, code-flavoured. It also gives visitors the other ways to reach Maks and his CV in one place.

## Scope

**In scope:**

- The page layout at all three breakpoints, plus copy and metadata.
- `ContactChannels`, `CvCard`, `RisingLetters`; `GithubIcon` and `LinkedinIcon` in the icon set.
- The CV PDF and a page-1 thumbnail in `public/cv/`.

**Out of scope:**

- Changes to the form's fields or its sending.
- Analytics on CV downloads.

## Approach

**Channels** (`components/contactChannels/`):

- A list of five icon links:
  - GitHub `github.com/ormaks`
  - email `mailto:maks.chytailo@gmail.com`
  - LinkedIn `linkedin.com/in/ormaks`
  - Instagram `instagram.com/maks_chytailo`
  - Telegram `t.me/ormaks`
- External links open in a new tab.
- With a mouse, each icon is pulled toward the pointer (GSAP `quickTo`) and springs back on leave.
- Hover or keyboard focus turns it accent and types the handle into a line under the row. That line is decorative; the link's `aria-label` names it.

**CV card** (`components/cvCard/`):

- **Card:** a thumbnail of page 1, the file name and a short description. The thumbnail tilts on hover.
- **Preview:**
  - **Tablet and up:** opens a native `<dialog>` (Escape, focus trap and backdrop built in) holding the PDF in an `<iframe>` (the browser's own viewer), a download link and a close button.
  - **Mobile:** phone browsers don't render PDFs in frames reliably, so it opens the PDF in a new tab instead.
- **Download:** a plain `<a download>`.

**Rising letters** (`components/risingLetters/`):

- Wraps the form and listens for `beforeinput` events of type `insertText` on its fields.
- A hidden mirror of the field (same font, padding and wrapping, filled with the text up to the caret) gives the caret's position on screen.
- **Each typed character:** spawned there in a fixed, click-through overlay, then floats up about 60px with a little drift and rotation while it fades (0.9s), and is removed.
- **Pastes:** only the first 12 characters rise.
- Decorative (`aria-hidden`).

**Layout:**

- **Desktop:** two columns. The left (about half) holds the heading, intro and form; the right holds the channels above the CV card, vertically centred.
- **Right-column titles:** `<find me />` above the channels and `<cv />` above the CV card, in the decorative tag font.
- **Form text:** labels and inline errors use the monospace prose font for readability.
- **Tablet and mobile:** stacked in the same order.
- Tailwind scale sizes only. The page fits without scrolling at 1440×900 and at the 566px minimum.

## Acceptance criteria

- [x] Five channel links with names and hrefs; external ones open in a new tab
- [x] Magnetic hover (mouse) and accent plus typed handle on hover or focus
- [x] CV card opens a dialog with the PDF and a download link; Escape closes it; on mobile, preview opens the PDF in a new tab
- [x] Typed characters rise from the caret and are cleaned up
- [x] Fits without scrolling at 1440×900; stacked on tablet and mobile
- [x] e2e covers the above
- [x] Lint, typecheck, build and e2e pass

## Content

- **Heading:** "Contact me" (accent).
- **Intro:** "Open to new offers and interesting projects. Write to me here, reach me on any channel, or grab my CV."
- **CV card:** "cv_maks_chytailo.pdf" · "Senior Front-End Developer · 2 pages".
- **Metadata:** title "Contact - Ormaks"; description "Get in touch with Maks Chytailo: send a message, find him on GitHub, LinkedIn, Instagram or Telegram, or download his CV."
