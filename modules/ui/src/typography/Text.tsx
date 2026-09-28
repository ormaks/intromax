import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type TextProps = HTMLAttributes<HTMLParagraphElement> & {
  /**
   * `body` is ordinary prose. `tag` is the site's "code as design" motif —
   * the muted decorative markup (`<h1>`, `</p>`) framing real content.
   */
  variant?: "body" | "tag";
};

/*
 * `body` is page prose: system monospace, 16px/19px on mobile and tablet,
 * 12px/18px on desktop. Monospace is deliberate — it carries the
 * code-as-design look into the copy.
 */
const VARIANTS: Record<NonNullable<TextProps["variant"]>, string> = {
  body: "font-mono text-prose-lg desktop:text-prose desktop:tracking-normal text-foreground",
  tag: "font-tag text-tag text-muted",
};

export function Text({ variant = "body", className, ...props }: TextProps) {
  return <p className={cn("m-0", VARIANTS[variant], className)} {...props} />;
}
