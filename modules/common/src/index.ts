/**
 * Shared utils, types and hooks consumed by every app.
 *
 * Placeholder content for Stage 1 — its only job right now is to prove the
 * pnpm workspace linkage works. Keep this package dependency-free unless 2+
 * apps genuinely need the dependency (see AGENTS.md).
 */

export const SITE_NAME = "Intromax";

/** A project surfaced in the portfolio's Lab section. */
export type PetProject = {
  slug: string;
  title: string;
};
