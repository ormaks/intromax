export type ToastVariant = "success" | "error" | "info";

export type ToastEntry = {
  id: number;
  variant: ToastVariant;
  message: string;
  duration: number;
};

export const DEFAULT_TOAST_DURATION = 5000;

type Listener = () => void;

let toasts: ToastEntry[] = [];
let nextId = 0;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToastsSnapshot(): ToastEntry[] {
  return toasts;
}

// useSyncExternalStore needs a stable reference for SSR; module state would
// otherwise start non-empty for a request that reuses a warm module scope.
const EMPTY_TOASTS: ToastEntry[] = [];

export function getServerToastsSnapshot(): ToastEntry[] {
  return EMPTY_TOASTS;
}

export function addToast(
  variant: ToastVariant,
  message: string,
  duration: number = DEFAULT_TOAST_DURATION,
): number {
  const id = nextId++;
  toasts = [...toasts, { id, variant, message, duration }];
  emit();
  return id;
}

export function removeToast(id: number): void {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}
