"use client";

import { cn } from "@intromax/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType } from "react";
import {
  EnvelopeIcon,
  FacebookIcon,
  GearIcon,
  HomeIcon,
  InstagramIcon,
  TelegramIcon,
  UserIcon,
  type IconProps,
} from "@/components/icons";
import { Wolf } from "@/components/wolf";
import { BurgerMenu } from "./BurgerMenu";

const NAV_ID = "primary-nav";

type Item = {
  href: string;
  label: string;
  Icon: ComponentType<IconProps>;
};

const NAV_ITEMS: Item[] = [
  { href: "/", label: "home", Icon: HomeIcon },
  { href: "/about", label: "about", Icon: UserIcon },
  { href: "/skills", label: "skills", Icon: GearIcon },
  { href: "/contact", label: "contact", Icon: EnvelopeIcon },
];

/* External profiles — plain anchors, not client-side Links. */
const SOCIAL_ITEMS: Item[] = [
  {
    href: "https://www.facebook.com/chytailo",
    label: "Facebook",
    Icon: FacebookIcon,
  },
  {
    href: "https://www.instagram.com/maks_chytailo",
    label: "Instagram",
    Icon: InstagramIcon,
  },
  { href: "https://t.me/ormaks", label: "Telegram", Icon: TelegramIcon },
];

/**
 * Segment-aware prefix match, so sub-routes (`/skills/react`) still light up
 * their tab without `/aboutx` matching `/about`.
 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* Keyboard focus rings sit inside the item — the tablet bar clips overflow. */
const FOCUS_RING = "focus-visible:-outline-offset-2";

/* Where the burger stops being needed (the tablet breakpoint). */
const TABLET_UP = "(min-width: 30.0625rem)";

/**
 * Site navigation, in three layouts:
 *
 * - **desktop** — a fixed 55px rail down the left edge: the spinning wolf and
 *   wordmark at the top, icon nav in the middle, socials at the bottom. Nav
 *   items widen into a 64px tab on hover and show their label.
 * - **tablet** — a fixed 60px bar across the top, everything in one row.
 * - **mobile** — the same bar with the wordmark centred and a burger; opening
 *   it slides the nav in as a row under the bar and the socials into the bar
 *   itself, in place of the wordmark.
 *
 * Links are plain `next/link` rather than the shared `Link`: that one is an
 * inline accent link with its own colour and hover defaults, which would
 * fight the fully custom styling here.
 */
export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Close on any route change — link clicks, back/forward, redirects. Adjusting
  // state during render (rather than in an effect) avoids a flash of the open
  // menu on the new page.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;

    // Escape closes and hands focus back to the burger, so it isn't lost on
    // a link that just became invisible.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      burgerRef.current?.focus();
    };
    // Growing past mobile width drops the burger entirely; don't leave the
    // menu "open" to reappear when the window shrinks again.
    const wide = window.matchMedia(TABLET_UP);
    const onResize = () => {
      if (wide.matches) setIsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    wide.addEventListener("change", onResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      wide.removeEventListener("change", onResize);
    };
  }, [isOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-30 flex h-(--height-header) flex-row items-center justify-between bg-surface",
        // The closed mobile panels wait off-screen to the right; clip them
        // horizontally without clipping the nav row that hangs below the bar.
        "overflow-x-clip tablet:overflow-hidden",
        "desktop:right-auto desktop:bottom-0 desktop:h-full desktop:min-h-100 desktop:w-header desktop:flex-col desktop:overflow-visible",
      )}
    >
      <Link
        href="/"
        aria-label="Ormaks — home"
        onClick={() => setIsOpen(false)}
        className={cn(
          "flex h-full shrink-0 flex-col items-center justify-center no-underline desktop:h-auto desktop:w-header desktop:pt-1",
          FOCUS_RING,
        )}
      >
        {/* A heavier stroke than the default: at 45-55px tall the default
            stroke would render well under a pixel wide. */}
        <Wolf
          strokeWidth={3}
          className="h-14 w-auto animate-[logo-spin_15s_ease-in-out_infinite] text-accent tablet:h-11 desktop:h-14"
        />
        <span
          className={cn(
            "font-logo leading-none transition-all duration-300 ease-linear",
            // mobile: large and centred in the bar
            "absolute top-2 left-[37%] text-logo text-accent",
            isOpen && "opacity-0",
            // tablet/desktop: small, tucked under the wolf
            "tablet:static tablet:-mt-1.5 tablet:text-lg tablet:tracking-normal tablet:text-wordmark tablet:opacity-100",
            "tablet:[text-shadow:0_0_1px_rgb(8_253_216/0.55)]",
            "desktop:mt-0 desktop:mb-1",
          )}
        >
          Ormaks
        </span>
      </Link>

      <nav
        id={NAV_ID}
        aria-label="Primary"
        className={cn(
          "flex flex-row items-center justify-around bg-surface",
          // mobile: a row that slides in under the bar
          "absolute top-[calc(var(--height-header)-1px)] h-14 w-full transition-[left,visibility] duration-300 ease-linear",
          isOpen ? "visible left-0" : "invisible left-full",
          // tablet: part of the bar
          "tablet:visible tablet:static tablet:h-full tablet:w-100 tablet:transition-none",
          // desktop: a column in the middle of the rail
          "desktop:h-72 desktop:w-full desktop:flex-col desktop:items-start",
        )}
      >
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              onClick={() => setIsOpen(false)}
              className={cn(
                "group flex h-full w-header flex-col items-center justify-center gap-1.5 bg-surface no-underline transition-all duration-300",
                "desktop:h-auto desktop:flex-1 desktop:hover:w-16 desktop:focus-visible:w-16",
                FOCUS_RING,
                active ? "text-accent" : "text-border hover:text-accent",
              )}
            >
              <Icon className="text-icon" />
              <span
                className={cn(
                  "text-label leading-none font-light text-accent uppercase transition-opacity duration-300 font-sans-serif",
                  active
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <ul
        className={cn(
          "m-0 flex list-none flex-row items-center justify-evenly p-0",
          // mobile: slides into the middle of the bar, replacing the wordmark
          "absolute top-0 h-(--height-header) min-w-44 transition-[left,visibility] duration-300 ease-linear",
          isOpen ? "visible left-[calc(50%-90px)]" : "invisible left-full",
          "tablet:visible tablet:static tablet:min-w-24 tablet:transition-none",
          "desktop:h-auto desktop:w-full desktop:min-w-0 desktop:flex-col desktop:pb-2",
        )}
      >
        {SOCIAL_ITEMS.map(({ href, label, Icon }) => (
          <li key={href}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={cn(
                "flex h-8 items-center justify-center px-2 text-icon-sm text-border transition-colors duration-300 hover:text-accent",
                FOCUS_RING,
              )}
            >
              <Icon />
            </a>
          </li>
        ))}
      </ul>

      <BurgerMenu
        ref={burgerRef}
        isOpen={isOpen}
        onToggle={() => setIsOpen((open) => !open)}
        controls={NAV_ID}
      />
    </header>
  );
}
