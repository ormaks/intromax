/**
 * Throwaway placeholder that exists to prove `@intromax/ui` resolves and
 * renders from an app. Delete it once Stage 2 puts real components here.
 */
export function WorkspaceBadge({ label }: { label: string }) {
  return (
    <span className="rounded-card border border-brand-500 px-2 py-1 font-mono text-xs text-brand-900 dark:text-brand-50">
      {label}
    </span>
  );
}
