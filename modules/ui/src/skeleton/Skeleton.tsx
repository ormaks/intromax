import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

/**
 * A pulsing placeholder for content that's still loading. Give it the size
 * of what it stands in for through `className` (`h-12 w-full`, `absolute
 * inset-0`, ...), so nothing shifts when the real content replaces it.
 *
 * Decorative (`aria-hidden`): announcing the loading state is the job of the
 * component that owns it.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-control bg-field", className)}
      {...props}
    />
  );
}
