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

/* External profiles — plain anchors, not client-side Links. */
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
 * The site navigation: a fixed 55px left rail on desktop — wordmark at the
 * top, nav in the middle, socials at the bottom. Below `desktop` (1025px) it
 * becomes a top bar with the nav behind the burger toggle.
 *
 * Nav items are text labels for now; the icon set arrives with the header
 * redesign.
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
        "desktop:fixed desktop:inset-y-0 desktop:left-0 desktop:h-full desktop:w-header desktop:flex-col desktop:py-2",
      )}
    >
      <Link
        href="/"
        aria-label="Ormaks — home"
        className="px-4 font-logo text-2xl text-foreground desktop:px-0 desktop:py-2"
      >
        O
      </Link>

      {/*
       * One panel holding both nav and socials, so the burger reveals
       * everything the desktop rail shows. Splitting them left the socials
       * unreachable below `desktop`.
       */}
      <div
        id={NAV_ID}
        className={cn(
          "absolute inset-x-0 top-full flex-col gap-6 bg-surface p-4",
          "desktop:static desktop:flex desktop:h-full desktop:flex-1 desktop:justify-between desktop:bg-transparent desktop:p-0",
          isOpen ? "flex" : "hidden",
        )}
      >
        <nav
          aria-label="Primary"
          className="flex flex-col gap-4 desktop:my-auto desktop:gap-6"
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

        <ul className="flex list-none flex-col gap-4 p-0 desktop:pb-2">
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
