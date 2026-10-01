import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { buttonClassName, type ButtonSize } from "../utils/buttonClassName";

export type ButtonLinkProps = NextLinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkProps> & {
    size?: ButtonSize;
  };

/**
 * A link that looks like a Button — for calls to action that navigate, like
 * "Contact me", which are links rather than real buttons.
 *
 * Use this rather than restyling a Link at the call site; that duplicates the
 * class list and drifts the moment the button treatment changes.
 */
export function ButtonLink({ className, size, ...props }: ButtonLinkProps) {
  return <NextLink className={buttonClassName(className, size)} {...props} />;
}
