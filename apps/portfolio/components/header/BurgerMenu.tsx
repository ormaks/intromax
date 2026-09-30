"use client";

import { cn } from "@intromax/ui";
import type { Ref } from "react";

type BurgerMenuProps = {
  isOpen: boolean;
  onToggle: () => void;
  /** Id of the nav this button controls, for `aria-controls`. */
  controls: string;
  ref?: Ref<HTMLButtonElement>;
};

/*
 * Width and colour are never in the shared class: cn() only joins strings, so
 * `w-full` here would silently beat the open state's `w-0` (and `bg-border`
 * would beat `bg-accent`) — each state sets its own.
 */
const BAR = "absolute left-0 h-1";

/**
 * Mobile-only menu toggle: three bars that fold into an accent ✕.
 *
 * Opening: the outer bars shrink away first, then the middle pair rotates
 * into the cross. Closing runs the same steps in reverse — the cross unfolds,
 * then the outer bars grow back. The 0.2s delays sequence the two steps.
 */
export function BurgerMenu({
  isOpen,
  onToggle,
  controls,
  ref,
}: BurgerMenuProps) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={controls}
      // A constant name; aria-expanded carries the open/closed state.
      aria-label="Menu"
      className="flex h-full w-12.5 shrink-0 items-center justify-center bg-surface focus-visible:-outline-offset-2 tablet:hidden"
    >
      <span className="relative block h-7.5 w-9" aria-hidden="true">
        {/* Outer bars: collapse first when opening, grow back last when closing. */}
        {["top-0.75", "bottom-0.75"].map((position) => (
          <span
            key={position}
            className={cn(
              BAR,
              position,
              "transition-[width] duration-200",
              isOpen ? "w-0 bg-border delay-0" : "w-full bg-border delay-200",
            )}
          />
        ))}
        {/* Middle pair: rotates into the cross after the outer bars are gone. */}
        {["rotate-45", "-rotate-45"].map((rotation) => (
          <span
            key={rotation}
            className={cn(
              BAR,
              "top-3.25 w-full transition-[rotate,background-color] duration-200",
              isOpen
                ? cn(rotation, "bg-accent delay-200")
                : "bg-border delay-0",
            )}
          />
        ))}
      </span>
    </button>
  );
}
