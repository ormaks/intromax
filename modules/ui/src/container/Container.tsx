import type { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type ContainerProps = HTMLAttributes<HTMLDivElement>;

/** Centered page-width wrapper with the gutters every route shares. */
export function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-5xl px-6 py-12", className)}
      {...props}
    />
  );
}
