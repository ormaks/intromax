import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "intromax:lab-best";

/*
 * localStorage can throw (private mode, storage disabled, quota), so every
 * access is guarded, and the in-memory best covers a session where writes
 * fail.
 */
let memoryBest = 0;
const listeners = new Set<() => void>();

function readBest(): number {
  let stored = 0;
  try {
    const value = Number(window.localStorage.getItem(STORAGE_KEY));
    if (Number.isFinite(value) && value > 0) stored = Math.floor(value);
  } catch {
    // Fall back to the in-memory best.
  }
  return Math.max(stored, memoryBest);
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab setting a new best.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * The visitor's best runner score, persisted in localStorage, and a
 * `submit(score)` that records it only when it beats the best so far.
 *
 * The server can't see storage, so it reports `0`; the stored value replaces
 * it straight after hydration.
 */
export function useBestScore(): [number, (score: number) => void] {
  const best = useSyncExternalStore(subscribe, readBest, () => 0);

  const submit = useCallback((score: number) => {
    if (score <= readBest()) return;
    memoryBest = score;
    try {
      window.localStorage.setItem(STORAGE_KEY, String(score));
    } catch {
      // Kept in memory for this session only.
    }
    for (const listener of listeners) listener();
  }, []);

  return [best, submit];
}
