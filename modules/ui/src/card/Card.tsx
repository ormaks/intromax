import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type CardProps = HTMLAttributes<HTMLDivElement>;

/** Raised panel over the page background — surface fill, hairline border. */
export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-control border border-border bg-surface p-6",
        className,
      )}
      {...props}
    />
  );
}
