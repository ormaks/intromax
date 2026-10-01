import { Open_Sans } from "next/font/google";
import localFont from "next/font/local";

/*
 * The display faces live in @intromax/config so a future app inherits the
 * files rather than re-copying them.
 *
 * The `src` values are plain relative filesystem paths out of this app and
 * into a sibling package's directory — next/font/local does not resolve
 * package specifiers, so this deliberately bypasses the export map. It works
 * because the whole workspace is one tree; it would break if this app were
 * ever built in an isolated context (a Docker build context, `pnpm deploy`).
 * That is a Stage 6 concern, noted here so it is not a surprise then.
 *
 * Each face is exposed as a CSS variable rather than a class, so the shared
 * theme.css owns the role -> font mapping and this file only owns loading.
 * The variables are named after the *file*, not the role (--font-millunium,
 * not --font-heading), because theme.css emits its role variables on :root
 * while next/font sets these on <html> — identical specificity, so a shared
 * name would make which declaration wins arbitrary.
 */

/** Millunium — page headings. The only display face above the fold. */
export const heading = localFont({
  src: "../../../modules/config/tailwind/fonts/Millunium-BOLD.ttf",
  variable: "--font-millunium",
  display: "swap",
});

/** La Belle Aurore — the muted "code tags" decorative text. */
export const tag = localFont({
  src: "../../../modules/config/tailwind/fonts/LaBelleAurore.ttf",
  variable: "--font-la-belle-aurore",
  display: "swap",
  // Decorative and small; not worth blocking the preload budget for.
  preload: false,
});

/** Dancing Script — the "Ormaks" wordmark. */
export const logo = localFont({
  src: [
    {
      path: "../../../modules/config/tailwind/fonts/DancingScript-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../modules/config/tailwind/fonts/DancingScript-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-dancing-script",
  display: "swap",
  // Only the small header wordmark uses it, and the preloader covers the
  // first paint while it loads.
  preload: false,
});

/**
 * Open Sans — buttons only. Page prose is the system monospace stack.
 */
export const sans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

export const fontVariables = [
  heading.variable,
  tag.variable,
  logo.variable,
  sans.variable,
].join(" ");
