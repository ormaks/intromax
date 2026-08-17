"use client";

import { cn, Link } from "@intromax/ui";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BurgerMenu } from "./BurgerMenu";

const NAV_ID = "primary-nav";

const NAV_ITEMS = [
  { href: "/", label: "home" },
  { href: "/about", label: "about" },
  { href: "/skills", label: "skills" },
  { href: "/contact", label: "contact" },
] as const;

/*
 * Social URLs carried over from the legacy Header. The legacy version routed
 * these through react-router's <Link>, which was a bug — they are external, so
 * they get plain anchors here.
 */
const SOCIAL_ITEMS = [
  { href: "https://www.facebook.com/chytailo", label: "Facebook", short: "fb" },
  {
    href: "https://www.instagram.com/maks_chytailo",
    label: "Instagram",
    short: "ig",
  },
  { href: "https://t.me/ormaks", label: "Telegram", short: "tg" },
] as const;

/** Prefix-aware so future sub-routes (`/skills/react`) still light up their tab. */
function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * The legacy site's fixed 55px left rail (`header.scss`): wordmark at the top,
 * nav in the middle, socials at the bottom. Under `sm` it becomes a top bar
 * with the nav behind the burger toggle.
 *
 * Labels are text rather than the legacy FontAwesome icons — the icon set is a
 * Stage 4 fidelity concern and not worth a vendor bundle here.
 */
export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header
      className={cn(
        "relative z-30 flex w-full flex-row items-center justify-between bg-surface",
        // `relative` is load-bearing: the mobile panel below is positioned
        // `top-full`, and without a positioned ancestor it resolves against
        // the viewport and drops a full screen height out of view.
        "sm:fixed sm:inset-y-0 sm:left-0 sm:h-full sm:w-header sm:flex-col sm:py-2",
      )}
    >
      <Link
        href="/"
        aria-label="Ormaks — home"
        className="px-4 font-logo text-2xl text-foreground sm:px-0 sm:py-2"
      >
        O
      </Link>

      {/*
       * One panel holding both nav and socials, so the burger reveals
       * everything the desktop rail shows. Splitting them left the socials
       * unreachable under `sm`.
       */}
      <div
        id={NAV_ID}
        className={cn(
          "absolute inset-x-0 top-full flex-col gap-6 bg-surface p-4",
          "sm:static sm:flex sm:h-full sm:flex-1 sm:justify-between sm:bg-transparent sm:p-0",
          isOpen ? "flex" : "hidden",
        )}
      >
        <nav
          aria-label="Primary"
          className="flex flex-col gap-4 sm:my-auto sm:gap-6"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "text-center text-xs uppercase tracking-widest",
                  active ? "text-accent" : "text-foreground hover:text-accent",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <ul className="flex list-none flex-col gap-4 p-0 sm:pb-2">
          {SOCIAL_ITEMS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={item.label}
                className="block text-center text-xs uppercase tracking-widest text-foreground transition-colors duration-300 hover:text-accent"
              >
                {item.short}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <BurgerMenu
        isOpen={isOpen}
        onToggle={() => setIsOpen((open) => !open)}
        controls={NAV_ID}
      />
    </header>
  );
}
