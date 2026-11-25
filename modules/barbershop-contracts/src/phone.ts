import { z } from "zod";

/**
 * A phone number as typed ("+1 (555) 234-5678"), normalised to a leading +
 * (if given) and digits only ("+15552345678"), so the same number typed two
 * ways compares equal on lookup. It checks the shape, not that the number
 * exists.
 */
export const phone = z
  .string()
  .trim()
  .regex(/^\+?[\d\s().-]+$/, "Use digits, spaces, ( ) - . and a leading +")
  .transform((raw) => (raw.startsWith("+") ? "+" : "") + raw.replace(/\D/g, ""))
  .pipe(z.string().regex(/^\+?\d{7,15}$/, "Expected 7 to 15 digits"));
