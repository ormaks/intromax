import { useCallback, useSyncExternalStore } from "react";

/**
 * Whether a media query matches, kept in sync as the viewport changes.
 *
 * The server can't know the viewport, so it reports `true`: the server HTML
 * (and the first client render, which must match it) includes whatever the
 * query guards, and it's dropped straight after hydration where the query
 * doesn't match. Use it to keep heavy or hidden-anyway content from mounting,
 * not for layout — layout belongs in CSS breakpoints.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => true,
  );
}
