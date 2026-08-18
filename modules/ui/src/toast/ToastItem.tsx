"use client";

import { useEffect, useState } from "react";
import { cn } from "../utils/cn";
import { removeToast, type ToastEntry, type ToastVariant } from "./toastStore";

/**
 * Reuses existing tokens rather than inventing new hues, to stay inside the
 * site's deliberately narrow palette: accent (teal) already means "positive
 * action" everywhere else, danger is already the site's one error color, and
 * info stays neutral rather than adding a third brand color nothing else uses.
 */
const VARIANTS: Record<ToastVariant, string> = {
  success: "border-accent text-accent",
  error: "border-danger text-danger",
  info: "border-border text-foreground",
};

const EXIT_TRANSITION_MS = 300;

type ToastItemProps = {
  toast: ToastEntry;
};

/**
 * A single toast's animation/dismiss lifecycle — slides/fades in on mount,
 * then either auto-dismisses after `toast.duration` (shown as a shrinking
 * bar along the bottom edge) or dismisses on click. Removes itself from the
 * shared store once its exit transition finishes.
 */
export function ToastItem({ toast }: ToastItemProps) {
  const { id, variant, message, duration } = toast;
  const [phase, setPhase] = useState<"enter" | "shown" | "exit">("enter");

  useEffect(() => {
    // A short timeout rather than requestAnimationFrame — rAF is tied to the
    // tab's compositor and doesn't fire while backgrounded, which would stall
    // a toast that mounts in a tab the visitor isn't currently looking at.
    const enterTimer = setTimeout(() => setPhase("shown"), 10);

    const dismissTimer =
      duration > 0 ? setTimeout(() => setPhase("exit"), duration) : undefined;

    return () => {
      clearTimeout(enterTimer);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [duration]);

  useEffect(() => {
    if (phase !== "exit") return;
    const timeout = setTimeout(() => removeToast(id), EXIT_TRANSITION_MS);
    return () => clearTimeout(timeout);
  }, [phase, id]);

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      onClick={() => setPhase("exit")}
      className={cn(
        "pointer-events-auto relative w-full cursor-pointer overflow-hidden",
        "rounded-control border-l-4 bg-surface px-4 py-3 font-tag text-tag",
        "transition-all duration-300 ease-out",
        phase === "shown"
          ? "translate-x-0 opacity-100"
          : "translate-x-4 opacity-0",
        VARIANTS[variant],
      )}
    >
      {message}
      {duration > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-current/25">
          <div
            className="h-full origin-left bg-current transition-transform ease-linear"
            style={{
              transitionDuration: `${duration}ms`,
              transform: phase === "shown" ? "scaleX(0)" : "scaleX(1)",
            }}
          />
        </div>
      )}
    </div>
  );
}
