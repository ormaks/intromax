/**
 * The site's breakpoints as media queries, for code that has to ask in JS
 * (`window.matchMedia`, `useMediaQuery`). Styling uses the `tablet:` and
 * `desktop:` variants instead.
 *
 * Mirrors `--breakpoint-tablet` and `--breakpoint-desktop` in
 * `@intromax/config/tailwind/theme.css` — change them together.
 */
export const MEDIA = {
  /** 481px and up: the header is a full bar, no burger. */
  tabletUp: "(min-width: 30.0625rem)",
  /** 1025px and up: the header is the side rail. */
  desktopUp: "(min-width: 64.0625rem)",
} as const;
