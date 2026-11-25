import { z } from "zod";

/** A database id. */
export const id = z.uuid();

/** A day on the shop's calendar, e.g. "2026-12-01". Rejects 2026-02-30. */
export const localDate = z.iso.date();

/** A wall-clock time on the shop's clock, e.g. "09:30". */
export const localTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected a time as HH:MM");

/** 0-6, with 0 = Sunday. */
export const weekday = z.int().min(0).max(6);

/** The body of every error response. */
export const apiError = z.object({
  error: z.object({
    // Stable and machine-readable, e.g. "slot_taken"; clients branch on it.
    code: z.string(),
    // Human-readable; may change wording at any time.
    message: z.string(),
    // For validation errors: field path -> what's wrong with it.
    fields: z.record(z.string(), z.string()).optional(),
  }),
});
export type ApiError = z.infer<typeof apiError>;
