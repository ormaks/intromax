import { cn } from "@intromax/ui";
import type { ReactNode } from "react";
import { CodeTag } from "@/components/codeTag";
import { Preloader } from "@/components/preloader";

type PageShellProps = {
  children: ReactNode;
  /** Classes for the content block between the frame tags. */
  className?: string;
};

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
 * Tablet and mobile are ordinary document flow and scroll normally.
 */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <Preloader>
      <div
        className={cn(
          "flex min-h-full flex-col justify-between gap-6 py-4",
          "desktop:mt-[5dvh] desktop:h-[90dvh] desktop:min-h-141.5 desktop:gap-0 desktop:py-0",
        )}
      >
        <CodeTag name="body" indent className={TAG_INDENT} />

        <div
          className={cn(
            "mx-[5%] tablet:mr-[5%] tablet:ml-[9%] desktop:mr-0 desktop:ml-[6%]",
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
    </Preloader>
  );
}
