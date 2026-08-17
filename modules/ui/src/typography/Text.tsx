import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type TextProps = HTMLAttributes<HTMLParagraphElement> & {
  /**
   * `body` is ordinary prose. `tag` is the legacy "code as design" motif —
   * the muted decorative markup (`<h1>`, `</p>`) framing real content.
   */
  variant?: "body" | "tag";
};

const VARIANTS: Record<NonNullable<TextProps["variant"]>, string> = {
  body: "font-sans text-base text-foreground",
  tag: "font-tag text-tag text-muted",
};

export function Text({ variant = "body", className, ...props }: TextProps) {
  return <p className={cn("m-0", VARIANTS[variant], className)} {...props} />;
}
