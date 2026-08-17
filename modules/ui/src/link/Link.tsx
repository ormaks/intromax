import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type LinkProps = NextLinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkProps>;

/**
 * Accent-colored link over `next/link`, so shared components keep client-side
 * routing rather than falling back to full page loads.
 *
 * This is what puts `next` in this module's peerDependencies. Every app in the
 * workspace is a Next app, so that is not a real constraint today — but if a
 * non-Next consumer ever appears, this is the component that blocks it.
 */
export function Link({ className, ...props }: LinkProps) {
  return (
    <NextLink
      className={cn(
        "text-accent no-underline transition-colors duration-300",
        "hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
      {...props}
    />
  );
}
