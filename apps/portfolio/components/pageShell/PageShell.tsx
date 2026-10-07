import { cn } from "@intromax/ui";
import type { ReactNode } from "react";
import { CodeTag } from "@/components/codeTag";
import { ConstellationBackdrop } from "@/components/constellationBackdrop";
import { Preloader } from "@/components/preloader";

type PageShellProps = {
  children: ReactNode;
  /** Classes for the content block between the frame tags. */
  className?: string;
  /**
   * Horizontal margins of the content block, replacing the default set as a
   * whole (cn() doesn't dedupe, so they can't be overridden one by one).
   */
  inset?: string;
  /**
   * Decoration painted behind the page (Home's wolf and wordmark). Rendered
   * inside the preloader, so it can wait on `usePreloaderDone()`, and after
   * the frame, which stacks above it.
   */
  backdrop?: ReactNode;
  /**
   * For pages longer than one screen. On desktop the content block becomes
   * its own scroll container between the frame tags, which stay pinned; the
   * document itself still doesn't scroll there.
   */
  scroll?: boolean;
};

/* Content margins: 5% mobile, 9% tablet, 6% desktop. */
const DEFAULT_INSET =
  "mx-[5%] tablet:mr-[5%] tablet:ml-[9%] desktop:mr-0 desktop:ml-[6%]";

/* Frame-tag indent: 5px mobile, 10px tablet, 30px desktop. */
const TAG_INDENT = "ml-[5px] tablet:ml-[10px] desktop:ml-[30px]";

/**
 * The frame every page sits in, except the 404:
 *
 * - its own preloader, so the loader replays on every navigation (each page
 *   remounts its shell when the route changes)
 * - the decorative `<body>` … `</body></html>` markup, pinned top and bottom
 * - on desktop, a single-screen layout: `top: 5%; height: 90%;
 *   min-height: 566px`, with the page content spaced between the two frame
 *   tags. The no-scroll rule that goes with it lives in globals.css.
 *
 * Behind it all sits the pointer-reactive constellation backdrop.
 *
 * Tablet and mobile are ordinary document flow and scroll normally.
 * `scroll` lets a long page scroll inside the desktop frame.
 */
export function PageShell({
  children,
  className,
  inset = DEFAULT_INSET,
  backdrop,
  scroll = false,
}: PageShellProps) {
  return (
    <Preloader>
      <div
        className={cn(
          "relative z-10 flex min-h-full flex-col justify-between gap-6 py-4",
          "desktop:mt-[5dvh] desktop:h-[90dvh] desktop:min-h-141.5 desktop:gap-0 desktop:py-0",
        )}
      >
        <CodeTag name="body" indent className={TAG_INDENT} />

        <div
          // A scroll container has to take focus so keyboard users can
          // scroll it with the arrow keys, Space and Page Up/Down.
          {...(scroll && {
            role: "region",
            "aria-label": "Page content",
            tabIndex: 0,
          })}
          className={cn(
            inset,
            scroll && [
              "desktop:focus-visible:-outline-offset-2",
              "scroll-smooth desktop:min-h-0 desktop:flex-1 desktop:overflow-y-auto desktop:pr-[5%]",
              "desktop:[scrollbar-color:var(--color-border)_transparent] desktop:[scrollbar-width:thin]",
              // Text fades out at the frame's edges instead of being cut off.
              "desktop:[mask-image:linear-gradient(to_bottom,transparent,black_32px,black_calc(100%-32px),transparent)]",
            ],
            className,
          )}
        >
          {children}
        </div>

        <div className={TAG_INDENT}>
          <CodeTag name="body" closing indent />
          <CodeTag name="html" closing />
        </div>
      </div>
      <ConstellationBackdrop />
      {backdrop}
    </Preloader>
  );
}
