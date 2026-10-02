/**
 * Shared utils, types and hooks consumed by every app. Keep this package
 * dependency-free unless 2+ apps genuinely need the dependency (see
 * AGENTS.md).
 */

/** A project surfaced in the portfolio's Lab section. */
export type PetProject = {
  slug: string;
  title: string;
};
