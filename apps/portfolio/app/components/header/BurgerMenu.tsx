"use client";

type BurgerMenuProps = {
  isOpen: boolean;
  onToggle: () => void;
  /** Id of the nav this button controls, for `aria-controls`. */
  controls: string;
};

/**
 * Mobile-only toggle for the nav rail. Purely presentational — the open state
 * lives in Header, which is what the rail's layout classes react to.
 */
export function BurgerMenu({ isOpen, onToggle, controls }: BurgerMenuProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={controls}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 sm:hidden"
    >
      <span
        className={`h-0.5 w-6 bg-accent transition-transform duration-300 ${
          isOpen ? "translate-y-2 rotate-45" : ""
        }`}
      />
      <span
        className={`h-0.5 w-6 bg-accent transition-opacity duration-300 ${
          isOpen ? "opacity-0" : ""
        }`}
      />
      <span
        className={`h-0.5 w-6 bg-accent transition-transform duration-300 ${
          isOpen ? "-translate-y-2 -rotate-45" : ""
        }`}
      />
    </button>
  );
}
