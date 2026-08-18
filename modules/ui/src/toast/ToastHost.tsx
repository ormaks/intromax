"use client";

import { useSyncExternalStore } from "react";
import {
  getServerToastsSnapshot,
  getToastsSnapshot,
  subscribeToasts,
} from "./toastStore";
import { ToastItem } from "./ToastItem";

/**
 * Mount once, near the app root (e.g. the root layout). `toastSuccess` /
 * `toastError` / `toastInfo` push into a shared store this component reads
 * via `useSyncExternalStore` — same pattern as `Preloader`'s document-ready
 * subscription, for the same reason: this is external state, not local
 * component state, so reading it this way avoids the cascading render that
 * setting state inside an effect would cause (`react-hooks/set-state-in-effect`).
 *
 * Renders every currently-open toast stacked vertically in the top-right
 * corner; each `ToastItem` owns its own animation/dismiss lifecycle and
 * removes itself from the store when done.
 */
export function ToastHost() {
  const toasts = useSyncExternalStore(
    subscribeToasts,
    getToastsSnapshot,
    getServerToastsSnapshot,
  );

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed top-6 right-6 z-40 flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
