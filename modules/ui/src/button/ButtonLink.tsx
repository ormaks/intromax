import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { buttonClassName } from "../utils/buttonClassName";

export type ButtonLinkProps = NextLinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkProps>;

/**
 * A link that looks like a Button — the legacy "contact me" call to action was
 * exactly this (an `<a>` styled as `.contact_btn`, not a real button).
 *
 * Use this rather than restyling a Link at the call site; that duplicates the
 * class list and drifts the moment the button treatment changes.
 */
export function ButtonLink({ className, ...props }: ButtonLinkProps) {
  return <NextLink className={buttonClassName(className)} {...props} />;
}
